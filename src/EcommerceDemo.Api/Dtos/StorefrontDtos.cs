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
    IReadOnlyCollection<StorefrontOrderItemRequest> Items);
