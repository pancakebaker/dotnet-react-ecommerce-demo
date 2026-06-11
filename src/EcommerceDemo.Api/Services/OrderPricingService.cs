using EcommerceDemo.Api.Domain;

namespace EcommerceDemo.Api.Services;

public sealed class OrderPricingService
{
    private const decimal TaxRate = 0.12m;

    public void Recalculate(Order order)
    {
        order.Subtotal = decimal.Round(order.Items.Sum(item => item.LineTotal), 2);
        order.Tax = decimal.Round(order.Subtotal * TaxRate, 2);
        order.Total = decimal.Round(order.Subtotal + order.Tax - order.Discount, 2);
    }

    public long ToMinorCurrencyUnit(decimal total)
    {
        return decimal.ToInt64(decimal.Round(total * 100m, 0, MidpointRounding.AwayFromZero));
    }

    public OrderTotals CalculateTotals(IEnumerable<OrderItem> items, decimal discount = 0m)
    {
        return CalculateTotals(items.Select(item => item.LineTotal), discount);
    }

    public OrderTotals CalculateTotals(IEnumerable<decimal> lineTotals, decimal discount = 0m)
    {
        var subtotal = decimal.Round(lineTotals.Sum(), 2);
        var tax = decimal.Round(subtotal * TaxRate, 2);
        var total = decimal.Round(subtotal + tax - discount, 2);
        return new OrderTotals(subtotal, tax, total);
    }
}

public sealed record OrderTotals(decimal Subtotal, decimal Tax, decimal Total);
