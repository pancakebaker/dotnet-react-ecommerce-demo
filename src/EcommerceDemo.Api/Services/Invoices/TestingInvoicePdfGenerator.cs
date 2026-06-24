using System.Text;

namespace EcommerceDemo.Api.Services.Invoices;

public sealed class TestingInvoicePdfGenerator : IInvoicePdfGenerator
{
    public Task<byte[]> GenerateAsync(string html, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var marker = html.Contains("Commerce Platform", StringComparison.Ordinal)
            ? "Razor invoice rendered"
            : "Invoice template missing";
        var pdf = $"%PDF-1.4\n% {marker}\n%%EOF";
        return Task.FromResult(Encoding.ASCII.GetBytes(pdf));
    }
}
