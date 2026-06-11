using EcommerceDemo.Api.Domain;
using EcommerceDemo.Api.Dtos;

namespace EcommerceDemo.Api.Services;

public sealed class OrderMapper
{
    public OrderResponse ToResponse(Order order)
    {
        return new OrderResponse(
            order.Id,
            order.OrderNumber,
            order.CustomerId,
            order.Customer?.Name ?? "Unknown customer",
            order.Status,
            order.Subtotal,
            order.Tax,
            order.Discount,
            order.Total,
            order.CreatedByUserId,
            order.CreatedAt,
            order.Items.Select(item => new OrderItemResponse(
                item.Id,
                item.ProductId,
                item.ProductName,
                item.Quantity,
                item.UnitPrice,
                item.LineTotal)).ToList());
    }
}
