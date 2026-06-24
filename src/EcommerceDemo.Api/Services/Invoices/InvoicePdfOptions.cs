namespace EcommerceDemo.Api.Services.Invoices;

public sealed class InvoicePdfOptions
{
    public string? BrowserExecutablePath { get; set; }
    public bool AllowBrowserDownload { get; set; } = true;
    public bool DisableSandbox { get; set; }
}
