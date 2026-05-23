namespace EcommerceDemo.Api.Dtos;

public sealed record ProductResponse(Guid Id, string Name, string Sku, string? Description, decimal Price, int StockQuantity, bool IsActive);
public sealed record UpsertProductRequest(string Name, string Sku, string? Description, decimal Price, int StockQuantity, bool IsActive);
