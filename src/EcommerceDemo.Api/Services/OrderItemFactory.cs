using EcommerceDemo.Api.Domain;

namespace EcommerceDemo.Api.Services;

public sealed record OrderProductSelection(Guid ProductId, int Quantity);

public sealed class OrderItemFactory
{
    public bool TryAddItems(
        Order order,
        IEnumerable<OrderProductSelection> selections,
        IReadOnlyDictionary<Guid, Product> products,
        out string? error)
    {
        foreach (var selection in selections)
        {
            if (selection.Quantity <= 0 || selection.Quantity > 1000)
            {
                error = "Item quantity must be between 1 and 1,000.";
                return false;
            }

            var product = products[selection.ProductId];
            order.Items.Add(new OrderItem
            {
                ProductId = product.Id,
                ProductName = product.Name,
                Quantity = selection.Quantity,
                UnitPrice = product.Price,
                LineTotal = decimal.Round(product.Price * selection.Quantity, 2)
            });
        }

        error = null;
        return true;
    }

}
