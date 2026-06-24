using EcommerceDemo.Api.Services.Invoices;
using Microsoft.Extensions.DependencyInjection;

namespace EcommerceDemo.Api.Tests;

public sealed class InvoiceTemplateRendererTests(ApiTestFactory factory) : IClassFixture<ApiTestFactory>
{
    [Fact]
    public async Task Razor_Renderer_Produces_Invoice_Html_And_Handles_Missing_Optional_Fields()
    {
        using var scope = factory.Services.CreateScope();
        var renderer = scope.ServiceProvider.GetRequiredService<IInvoiceTemplateRenderer>();
        var model = new InvoiceViewModel(
            "Commerce Platform",
            "ORD-HTML-1001",
            new DateTimeOffset(2026, 6, 24, 8, 30, 0, TimeSpan.Zero),
            "Invoice Customer",
            null,
            "invoice@example.test",
            null,
            null,
            [
                new InvoiceLineItemViewModel("<Priority Scanner>", 2, 149m, 298m)
            ],
            298m,
            35.76m,
            10m,
            323.76m,
            "Card",
            "Paid",
            "Submitted");

        var html = await renderer.RenderAsync(model, CancellationToken.None);

        Assert.Contains("<!doctype html>", html, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("ORD-HTML-1001", html);
        Assert.Contains("Invoice Customer", html);
        Assert.Contains("invoice@example.test", html);
        Assert.Contains("&lt;Priority Scanner&gt;", html);
        Assert.Contains("$323.76", html);
        Assert.DoesNotContain("PaymentReferenceId", html);
    }
}
