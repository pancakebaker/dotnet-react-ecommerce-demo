namespace EcommerceDemo.Api.Services.Invoices;

public interface IInvoicePdfGenerator
{
    Task<byte[]> GenerateAsync(string html, CancellationToken cancellationToken);
}
