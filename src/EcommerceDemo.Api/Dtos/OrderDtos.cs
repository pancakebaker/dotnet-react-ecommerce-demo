namespace EcommerceDemo.Api.Dtos;

public sealed record OrderItemRequest(Guid ProductId, int Quantity);
public sealed record CreateOrderRequest(Guid CustomerId, decimal Discount, IReadOnlyCollection<OrderItemRequest> Items);
public sealed record UpdateOrderStatusRequest(string Status);
public sealed record OrderItemResponse(Guid Id, Guid ProductId, string ProductName, int Quantity, decimal UnitPrice, decimal LineTotal);
public sealed record OrderResponse(
    Guid Id,
    string OrderNumber,
    Guid CustomerId,
    string CustomerName,
    string Status,
    decimal Subtotal,
    decimal Tax,
    decimal Discount,
    decimal Total,
    Guid CreatedByUserId,
    DateTimeOffset CreatedAt,
    IReadOnlyCollection<OrderItemResponse> Items);
