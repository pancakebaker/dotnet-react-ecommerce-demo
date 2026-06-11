using EcommerceDemo.Api.Services;

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
    string? PaymentIntentId = null,
    string? PaymentMethod = null,
    string? PaymentReferenceId = null);

public sealed record StorefrontPaymentIntentRequest(
    StorefrontCustomerRequest Customer,
    IReadOnlyCollection<StorefrontOrderItemRequest> Items,
    string? IdempotencyKey = null,
    string? PaymentMethod = null);

public sealed record StorefrontPaymentIntentResponse(
    string ClientSecret,
    string PaymentIntentId,
    long Amount,
    string Currency,
    string Status,
    string PaymentMethod = PaymentMethodIds.Card,
    string? PaymentReferenceId = null);
