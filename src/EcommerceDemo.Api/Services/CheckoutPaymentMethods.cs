namespace EcommerceDemo.Api.Services;

public static class PaymentMethodIds
{
    public const string Card = "card";
    public const string CashOnDelivery = "cash_on_delivery";
}

public sealed record PaymentPreparationRequest(
    IReadOnlyCollection<PaymentLineItem> LineItems,
    IReadOnlyDictionary<string, string> Metadata,
    string CustomerEmail,
    string IdempotencyKey);

public sealed record PaymentPreparationResult(
    string PaymentMethod,
    string ClientSecret,
    string PaymentReferenceId,
    long Amount,
    string Currency,
    string Status);

public sealed record PaymentValidationRequest(
    string? PaymentReferenceId,
    long Amount);

public sealed record PaymentValidationResult(
    string ProviderName,
    string? ReferenceId);

public interface ICheckoutPaymentMethod
{
    string Id { get; }
    bool IsConfigured { get; }

    Task<PaymentPreparationResult> PrepareAsync(
        PaymentPreparationRequest request,
        CancellationToken cancellationToken);

    Task<PaymentValidationResult> ValidateAsync(
        PaymentValidationRequest request,
        CancellationToken cancellationToken);
}

public interface ICheckoutPaymentMethodRegistry
{
    ICheckoutPaymentMethod Find(string? paymentMethod);
}

public sealed class CheckoutPaymentMethodRegistry(IEnumerable<ICheckoutPaymentMethod> methods) : ICheckoutPaymentMethodRegistry
{
    private readonly IReadOnlyDictionary<string, ICheckoutPaymentMethod> _methods = methods.ToDictionary(
        method => method.Id,
        StringComparer.OrdinalIgnoreCase);

    public ICheckoutPaymentMethod Find(string? paymentMethod)
    {
        var id = string.IsNullOrWhiteSpace(paymentMethod) ? PaymentMethodIds.Card : paymentMethod.Trim();
        if (_methods.TryGetValue(id, out var method))
        {
            return method;
        }

        throw new PaymentProviderException($"Payment method '{id}' is not available.");
    }
}

public sealed class CardCheckoutPaymentMethod(IPaymentProvider paymentProvider) : ICheckoutPaymentMethod
{
    public string Id => PaymentMethodIds.Card;
    public bool IsConfigured => paymentProvider.IsConfigured;

    public async Task<PaymentPreparationResult> PrepareAsync(
        PaymentPreparationRequest request,
        CancellationToken cancellationToken)
    {
        var payment = await paymentProvider.CreatePaymentAsync(new PaymentIntentRequest(
            request.LineItems,
            request.Metadata,
            request.CustomerEmail,
            request.IdempotencyKey), cancellationToken);

        return new PaymentPreparationResult(
            Id,
            payment.ClientSecret,
            payment.Id,
            payment.Amount,
            payment.Currency,
            payment.Status);
    }

    public async Task<PaymentValidationResult> ValidateAsync(
        PaymentValidationRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.PaymentReferenceId))
        {
            throw new PaymentProviderException("Payment is required before placing the order.");
        }

        var payment = await paymentProvider.GetPaymentAsync(request.PaymentReferenceId.Trim(), cancellationToken);
        if (!string.Equals(payment.Status, "succeeded", StringComparison.OrdinalIgnoreCase))
        {
            throw new PaymentProviderException($"Payment is not complete. Current status: {payment.Status}.");
        }

        if (payment.Amount != request.Amount ||
            !string.Equals(payment.Currency, paymentProvider.Currency, StringComparison.OrdinalIgnoreCase))
        {
            throw new PaymentProviderException("Payment does not match the current cart total.");
        }

        return new PaymentValidationResult(paymentProvider.ProviderName, payment.Id);
    }
}

public sealed class CashOnDeliveryPaymentMethod : ICheckoutPaymentMethod
{
    public string Id => PaymentMethodIds.CashOnDelivery;
    public bool IsConfigured => true;

    public Task<PaymentPreparationResult> PrepareAsync(
        PaymentPreparationRequest request,
        CancellationToken cancellationToken)
    {
        return Task.FromResult(new PaymentPreparationResult(
            Id,
            string.Empty,
            string.Empty,
            request.LineItems.Sum(item => item.UnitAmount * item.Quantity),
            "cod",
            "not_required"));
    }

    public Task<PaymentValidationResult> ValidateAsync(
        PaymentValidationRequest request,
        CancellationToken cancellationToken)
    {
        return Task.FromResult(new PaymentValidationResult(Id, null));
    }
}
