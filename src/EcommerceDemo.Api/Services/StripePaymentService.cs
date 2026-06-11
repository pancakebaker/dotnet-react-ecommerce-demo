using System.Collections.Concurrent;
using Microsoft.Extensions.Options;
using Stripe;

namespace EcommerceDemo.Api.Services;

public sealed class StripePaymentService(IOptions<StripeOptions> options) : IPaymentProvider
{
    private readonly StripeOptions _options = options.Value;

    public string ProviderName => "stripe";
    public bool IsConfigured => !string.IsNullOrWhiteSpace(_options.SecretKey);
    public string Currency => string.IsNullOrWhiteSpace(_options.Currency) ? "usd" : _options.Currency.ToLowerInvariant();

    public async Task<PaymentIntentResult> CreatePaymentAsync(
        PaymentIntentRequest request,
        CancellationToken cancellationToken)
    {
        EnsureConfigured();

        if (request.LineItems.Count == 0)
        {
            throw new PaymentProviderException("Cannot create a payment for an empty cart.");
        }

        var amount = request.LineItems.Sum(item => item.UnitAmount * item.Quantity);

        if (amount <= 0)
        {
            throw new PaymentProviderException("Cannot create a payment with a zero or negative amount.");
        }

        var paymentMetadata = request.Metadata.ToDictionary(pair => pair.Key, pair => pair.Value);

        // Keep a few useful values on the PaymentIntent for Stripe dashboard/debugging.
        paymentMetadata.TryAdd("customerEmail", request.CustomerEmail);
        paymentMetadata.TryAdd("itemCount", request.LineItems.Sum(item => item.Quantity).ToString());

        var description = string.Join(", ", request.LineItems.Select(item =>
            item.Quantity > 1 ? $"{item.Name} x{item.Quantity}" : item.Name));

        try
        {
            var service = new PaymentIntentService();
            var paymentIntent = await service.CreateAsync(new PaymentIntentCreateOptions
            {
                Amount = amount,
                Currency = Currency,
                ReceiptEmail = string.IsNullOrWhiteSpace(request.CustomerEmail) ? null : request.CustomerEmail,
                Description = description.Length > 500 ? description[..500] : description,
                Metadata = paymentMetadata,

                // Required/recommended when using PaymentElement so Stripe can decide
                // which payment methods are available for the PaymentIntent.
                AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
                {
                    Enabled = true
                }
            },
            new RequestOptions
            {
                ApiKey = _options.SecretKey,
                IdempotencyKey = request.IdempotencyKey
            }, cancellationToken);

            return ToResult(paymentIntent);
        }
        catch (StripeException ex)
        {
            throw new PaymentProviderException(ex.StripeError?.Message ?? "Stripe could not create a payment intent.", ex);
        }
    }

    public async Task<PaymentIntentResult> GetPaymentAsync(string providerPaymentId, CancellationToken cancellationToken)
    {
        EnsureConfigured();

        try
        {
            var paymentIntent = await new PaymentIntentService().GetAsync(providerPaymentId, requestOptions: new RequestOptions
            {
                ApiKey = _options.SecretKey
            }, cancellationToken: cancellationToken);

            return ToResult(paymentIntent);
        }
        catch (StripeException ex)
        {
            throw new PaymentProviderException(ex.StripeError?.Message ?? "Payment verification failed.", ex);
        }
    }

    private void EnsureConfigured()
    {
        if (!IsConfigured)
        {
            throw new PaymentProviderException("Payment provider is not configured.");
        }
    }

    private static PaymentIntentResult ToResult(PaymentIntent paymentIntent)
    {
        return new PaymentIntentResult(
            paymentIntent.Id,
            paymentIntent.ClientSecret ?? string.Empty,
            paymentIntent.Status ?? "unknown",
            paymentIntent.Amount,
            paymentIntent.Currency ?? "usd");
    }
}

public sealed class TestingPaymentProvider : IPaymentProvider
{
    private readonly ConcurrentDictionary<string, PaymentIntentResult> _paymentIntents = new();

    public string ProviderName => "testing";
    public bool IsConfigured => true;
    public string Currency => "usd";

    public Task<PaymentIntentResult> CreatePaymentAsync(
        PaymentIntentRequest request,
        CancellationToken cancellationToken)
    {
        var idempotencyKey = request.IdempotencyKey;
        var id = $"pi_test_{idempotencyKey[..Math.Min(idempotencyKey.Length, 16)]}";
        var amount = request.LineItems.Sum(item => item.UnitAmount * item.Quantity);
        var paymentIntent = new PaymentIntentResult(id, $"{id}_secret_test", "requires_payment_method", amount, Currency);
        _paymentIntents[id] = paymentIntent;
        return Task.FromResult(paymentIntent);
    }

    public Task<PaymentIntentResult> GetPaymentAsync(string providerPaymentId, CancellationToken cancellationToken)
    {
        if (_paymentIntents.TryGetValue(providerPaymentId, out var paymentIntent))
        {
            return Task.FromResult(paymentIntent with { Status = "succeeded" });
        }

        return Task.FromResult(new PaymentIntentResult(providerPaymentId, $"{providerPaymentId}_secret_test", "succeeded", 0, Currency));
    }
}
