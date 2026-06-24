namespace EcommerceDemo.Api.Services.Invoices;

public interface IInvoiceTemplateRenderer
{
    Task<string> RenderAsync(InvoiceViewModel model, CancellationToken cancellationToken);
}
