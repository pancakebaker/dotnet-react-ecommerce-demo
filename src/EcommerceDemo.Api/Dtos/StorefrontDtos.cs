namespace EcommerceDemo.Api.Dtos;

public sealed record StorefrontCustomerRequest(
    string Name,
    string? CompanyName,
    string Email,
    string? Phone,
    string? Address);

public sealed record StorefrontOrderItemRequest(Guid ProductId, int Quantity);

public sealed record StorefrontCheckoutRequest(
    StorefrontCustomerRequest Customer,
    IReadOnlyCollection<StorefrontOrderItemRequest> Items,
    string? PaymentIntentId = null);

public sealed record StorefrontPaymentIntentRequest(
    StorefrontCustomerRequest Customer,
    IReadOnlyCollection<StorefrontOrderItemRequest> Items,
    string? IdempotencyKey = null);

public sealed record StorefrontPaymentIntentResponse(
    string ClientSecret,
    string PaymentIntentId,
    long Amount,
    string Currency,
    string Status);
