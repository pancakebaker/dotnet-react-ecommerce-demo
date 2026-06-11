namespace EcommerceDemo.Api.Services;

public sealed record PaymentLineItem(
    string Name,
    string? Description,
    long UnitAmount,
    int Quantity);

public sealed record PaymentIntentResult(
    string Id,
    string ClientSecret,
    string Status,
    long Amount,
    string Currency);

public sealed record PaymentIntentRequest(
    IReadOnlyCollection<PaymentLineItem> LineItems,
    IReadOnlyDictionary<string, string> Metadata,
    string CustomerEmail,
    string IdempotencyKey);

public interface IPaymentProvider
{
    string ProviderName { get; }
    bool IsConfigured { get; }
    string Currency { get; }

    Task<PaymentIntentResult> CreatePaymentAsync(
        PaymentIntentRequest request,
        CancellationToken cancellationToken);

    Task<PaymentIntentResult> GetPaymentAsync(
        string providerPaymentId,
        CancellationToken cancellationToken);
}

public sealed class PaymentProviderException(string message, Exception? innerException = null)
    : Exception(message, innerException);
