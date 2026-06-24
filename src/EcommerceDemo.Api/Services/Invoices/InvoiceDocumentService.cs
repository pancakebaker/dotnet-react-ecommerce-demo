using EcommerceDemo.Api.Domain;

namespace EcommerceDemo.Api.Services.Invoices;

public sealed class InvoiceDocumentService(
    IInvoiceTemplateRenderer templateRenderer,
    IInvoicePdfGenerator pdfGenerator)
{
    public async Task<byte[]> GenerateAsync(Order order, CancellationToken cancellationToken)
    {
        var model = InvoiceViewModel.FromOrder(order);
        var html = await templateRenderer.RenderAsync(model, cancellationToken);
        return await pdfGenerator.GenerateAsync(html, cancellationToken);
    }
}
