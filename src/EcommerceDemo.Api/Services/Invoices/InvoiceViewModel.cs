using System.Globalization;
using EcommerceDemo.Api.Domain;

namespace EcommerceDemo.Api.Services.Invoices;

public sealed record InvoiceLineItemViewModel(
    string ProductName,
    int Quantity,
    decimal UnitPrice,
    decimal LineTotal);

public sealed record InvoiceViewModel(
    string StoreName,
    string OrderNumber,
    DateTimeOffset OrderDate,
    string CustomerName,
    string? CompanyName,
    string CustomerEmail,
    string? CustomerPhone,
    string? DeliveryAddress,
    IReadOnlyCollection<InvoiceLineItemViewModel> Items,
    decimal Subtotal,
    decimal Tax,
    decimal Discount,
    decimal Total,
    string PaymentMethod,
    string PaymentStatus,
    string OrderStatus)
{
    public string FormatMoney(decimal amount)
    {
        return amount.ToString("C2", CultureInfo.GetCultureInfo("en-US"));
    }

    public static InvoiceViewModel FromOrder(Order order)
    {
        var customer = order.Customer ?? throw new InvalidOperationException("Invoice orders must include customer details.");
        var payment = PaymentSummary(order);

        return new InvoiceViewModel(
            "Commerce Platform",
            order.OrderNumber,
            order.CreatedAt,
            customer.Name,
            customer.CompanyName,
            customer.Email,
            customer.Phone,
            customer.Address,
            order.Items.Select(item => new InvoiceLineItemViewModel(
                item.ProductName,
                item.Quantity,
                item.UnitPrice,
                item.LineTotal)).ToList(),
            order.Subtotal,
            order.Tax,
            order.Discount,
            order.Total,
            payment.Method,
            payment.Status,
            order.Status);
    }

    private static (string Method, string Status) PaymentSummary(Order order)
    {
        if (string.Equals(order.PaymentProvider, PaymentMethodIds.CashOnDelivery, StringComparison.OrdinalIgnoreCase))
        {
            return ("Cash on delivery", "Due on delivery");
        }

        if (string.Equals(order.PaymentProvider, "stripe", StringComparison.OrdinalIgnoreCase))
        {
            return ("Card", string.IsNullOrWhiteSpace(order.PaymentReferenceId) ? "Not recorded" : "Paid");
        }

        return ("Not recorded", "Not recorded");
    }
}
