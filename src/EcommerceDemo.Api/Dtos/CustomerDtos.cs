namespace EcommerceDemo.Api.Dtos;

public sealed record CustomerResponse(Guid Id, string Name, string? CompanyName, string Email, string? Phone, string? Address, DateTimeOffset CreatedAt);
public sealed record UpsertCustomerRequest(string Name, string? CompanyName, string Email, string? Phone, string? Address);
