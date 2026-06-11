using Microsoft.EntityFrameworkCore;
using EcommerceDemo.Api.Data;
using EcommerceDemo.Api.Dtos;
using EcommerceDemo.Api.Services;
using EcommerceDemo.Api.Validation;

namespace EcommerceDemo.Api.Endpoints;

public static class StorefrontEndpoints
{
    public static IEndpointRouteBuilder MapStorefrontEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/storefront").WithTags("Storefront");

        group.MapGet("/products", async (string? search, AppDbContext db) =>
        {
            var query = db.Products.AsNoTracking().Where(product => product.IsActive);
            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLowerInvariant();
                query = query.Where(product =>
                    product.Name.ToLower().Contains(term) ||
                    product.Sku.ToLower().Contains(term) ||
                    (product.Description != null && product.Description.ToLower().Contains(term)));
            }

            var products = await query
                .OrderBy(product => product.Name)
                .Select(product => new ProductResponse(
                    product.Id,
                    product.Name,
                    product.Sku,
                    product.Description,
                    product.Price,
                    product.StockQuantity,
                    product.IsActive))
                .ToListAsync();

            return Results.Ok(products);
        }).AllowAnonymous();

        group.MapPost("/orders", async (
            StorefrontCheckoutRequest request,
            StorefrontCheckoutService checkout,
            CancellationToken cancellationToken) =>
        {
            if (!InputValidation.TryCustomer(
                request.Customer.Name,
                request.Customer.CompanyName,
                request.Customer.Email,
                request.Customer.Phone,
                request.Customer.Address,
                out var customerInput,
                out var customerErrors))
            {
                return Results.ValidationProblem(customerErrors);
            }

            var result = await checkout.SubmitOrderAsync(request, customerInput, cancellationToken);
            if (result.Error is not null)
            {
                return ToCheckoutErrorResult(result.Error);
            }

            return Results.Created($"/api/orders/{result.Order!.Id}", result.Order);
        }).AllowAnonymous();

        group.MapPost("/payments/create-intent", async (
            StorefrontPaymentIntentRequest request,
            StorefrontCheckoutService checkout,
            CancellationToken cancellationToken) =>
        {
            return await PreparePaymentAsync(request with { PaymentMethod = PaymentMethodIds.Card }, checkout, cancellationToken);
        }).AllowAnonymous();

        group.MapPost("/payments/prepare", async (
            StorefrontPaymentIntentRequest request,
            StorefrontCheckoutService checkout,
            CancellationToken cancellationToken) =>
        {
            return await PreparePaymentAsync(request, checkout, cancellationToken);
        }).AllowAnonymous();

        return app;
    }

    private static async Task<IResult> PreparePaymentAsync(
        StorefrontPaymentIntentRequest request,
        StorefrontCheckoutService checkout,
        CancellationToken cancellationToken)
    {
        if (!InputValidation.TryCustomer(
            request.Customer.Name,
            request.Customer.CompanyName,
            request.Customer.Email,
            request.Customer.Phone,
            request.Customer.Address,
            out var customerInput,
            out var customerErrors))
        {
            return Results.ValidationProblem(customerErrors);
        }

        var result = await checkout.PreparePaymentAsync(request, customerInput, cancellationToken);
        if (result.Error is not null)
        {
            return ToCheckoutErrorResult(result.Error);
        }

        return Results.Ok(result.Payment);
    }

    private static IResult ToCheckoutErrorResult(StorefrontCheckoutError error)
    {
        if (error.StatusCode == StatusCodes.Status400BadRequest)
        {
            return Results.BadRequest(new { message = error.Message });
        }

        return Results.Problem(error.Message, statusCode: error.StatusCode);
    }
}
