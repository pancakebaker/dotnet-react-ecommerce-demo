using System.Collections.Concurrent;
using Microsoft.Extensions.Options;
using Stripe;

namespace EcommerceDemo.Api.Services;

public sealed record StripePaymentLineItem(
    string Name,
    string? Description,
    long UnitAmount,
    int Quantity);

public sealed record StripePaymentIntentResult(
    string Id,
    string ClientSecret,
    string Status,
    long Amount,
    string Currency);

public interface IStripePaymentService
{
    bool IsConfigured { get; }
    string Currency { get; }

    Task<StripePaymentIntentResult> CreatePaymentIntentAsync(
        IReadOnlyCollection<StripePaymentLineItem> lineItems,
        IReadOnlyDictionary<string, string> metadata,
        string customerEmail,
        string idempotencyKey,
        CancellationToken cancellationToken);

    Task<StripePaymentIntentResult> GetPaymentIntentAsync(string paymentIntentId, CancellationToken cancellationToken);
}

public sealed class StripePaymentService(IOptions<StripeOptions> options) : IStripePaymentService
{
    private readonly StripeOptions _options = options.Value;

    public bool IsConfigured => !string.IsNullOrWhiteSpace(_options.SecretKey);
    public string Currency => string.IsNullOrWhiteSpace(_options.Currency) ? "usd" : _options.Currency.ToLowerInvariant();

    public async Task<StripePaymentIntentResult> CreatePaymentIntentAsync(
        IReadOnlyCollection<StripePaymentLineItem> lineItems,
        IReadOnlyDictionary<string, string> metadata,
        string customerEmail,
        string idempotencyKey,
        CancellationToken cancellationToken)
    {
        EnsureConfigured();

        if (lineItems.Count == 0)
        {
            throw new InvalidOperationException("Cannot create a Stripe payment for an empty cart.");
        }

        var amount = lineItems.Sum(item => item.UnitAmount * item.Quantity);

        if (amount <= 0)
        {
            throw new InvalidOperationException("Cannot create a Stripe payment with a zero or negative amount.");
        }

        var paymentMetadata = metadata.ToDictionary(pair => pair.Key, pair => pair.Value);

        // Keep a few useful values on the PaymentIntent for Stripe dashboard/debugging.
        paymentMetadata.TryAdd("customerEmail", customerEmail);
        paymentMetadata.TryAdd("itemCount", lineItems.Sum(item => item.Quantity).ToString());

        var description = string.Join(", ", lineItems.Select(item =>
            item.Quantity > 1 ? $"{item.Name} x{item.Quantity}" : item.Name));

        var service = new PaymentIntentService();
        var paymentIntent = await service.CreateAsync(new PaymentIntentCreateOptions
        {
            Amount = amount,
            Currency = Currency,
            ReceiptEmail = string.IsNullOrWhiteSpace(customerEmail) ? null : customerEmail,
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
            IdempotencyKey = idempotencyKey
        }, cancellationToken);

        return ToResult(paymentIntent);
    }

    public async Task<StripePaymentIntentResult> GetPaymentIntentAsync(string paymentIntentId, CancellationToken cancellationToken)
    {
        EnsureConfigured();

        var paymentIntent = await new PaymentIntentService().GetAsync(paymentIntentId, requestOptions: new RequestOptions
        {
            ApiKey = _options.SecretKey
        }, cancellationToken: cancellationToken);

        return ToResult(paymentIntent);
    }

    private void EnsureConfigured()
    {
        if (!IsConfigured)
        {
            throw new InvalidOperationException("Stripe secret key is not configured.");
        }
    }

    private static StripePaymentIntentResult ToResult(PaymentIntent paymentIntent)
    {
        return new StripePaymentIntentResult(
            paymentIntent.Id,
            paymentIntent.ClientSecret ?? string.Empty,
            paymentIntent.Status ?? "unknown",
            paymentIntent.Amount,
            paymentIntent.Currency ?? "usd");
    }
}

public sealed class TestingStripePaymentService : IStripePaymentService
{
    private readonly ConcurrentDictionary<string, StripePaymentIntentResult> _paymentIntents = new();

    public bool IsConfigured => true;
    public string Currency => "usd";

    public Task<StripePaymentIntentResult> CreatePaymentIntentAsync(
        IReadOnlyCollection<StripePaymentLineItem> lineItems,
        IReadOnlyDictionary<string, string> metadata,
        string customerEmail,
        string idempotencyKey,
        CancellationToken cancellationToken)
    {
        var id = $"pi_test_{idempotencyKey[..Math.Min(idempotencyKey.Length, 16)]}";
        var amount = lineItems.Sum(item => item.UnitAmount * item.Quantity);
        var paymentIntent = new StripePaymentIntentResult(id, $"{id}_secret_test", "requires_payment_method", amount, Currency);
        _paymentIntents[id] = paymentIntent;
        return Task.FromResult(paymentIntent);
    }

    public Task<StripePaymentIntentResult> GetPaymentIntentAsync(string paymentIntentId, CancellationToken cancellationToken)
    {
        if (_paymentIntents.TryGetValue(paymentIntentId, out var paymentIntent))
        {
            return Task.FromResult(paymentIntent with { Status = "succeeded" });
        }

        return Task.FromResult(new StripePaymentIntentResult(paymentIntentId, $"{paymentIntentId}_secret_test", "succeeded", 0, Currency));
    }
}
