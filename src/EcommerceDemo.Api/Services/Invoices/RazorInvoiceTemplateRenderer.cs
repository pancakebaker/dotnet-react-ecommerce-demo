using System.Globalization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Mvc.Razor;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.AspNetCore.Routing;

namespace EcommerceDemo.Api.Services.Invoices;

public sealed class RazorInvoiceTemplateRenderer(
    IRazorViewEngine viewEngine,
    ITempDataProvider tempDataProvider,
    IServiceProvider services) : IInvoiceTemplateRenderer
{
    private const string TemplatePath = "/Templates/Invoices/Invoice.cshtml";

    public async Task<string> RenderAsync(InvoiceViewModel model, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var httpContext = new DefaultHttpContext { RequestServices = services };
        var actionContext = new ActionContext(httpContext, new RouteData(), new ActionDescriptor());
        var viewResult = viewEngine.GetView(executingFilePath: null, TemplatePath, isMainPage: true);
        if (!viewResult.Success)
        {
            throw new InvalidOperationException(
                $"Invoice Razor template was not found. Searched: {string.Join(", ", viewResult.SearchedLocations)}");
        }

        await using var writer = new StringWriter(CultureInfo.InvariantCulture);
        var viewData = new ViewDataDictionary<InvoiceViewModel>(
            new EmptyModelMetadataProvider(),
            new ModelStateDictionary())
        {
            Model = model
        };
        var viewContext = new ViewContext(
            actionContext,
            viewResult.View,
            viewData,
            new TempDataDictionary(httpContext, tempDataProvider),
            writer,
            new HtmlHelperOptions());

        await viewResult.View.RenderAsync(viewContext);
        cancellationToken.ThrowIfCancellationRequested();
        return writer.ToString();
    }
}
