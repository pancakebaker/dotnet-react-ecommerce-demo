using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using EcommerceDemo.Api.Data;
using EcommerceDemo.Api.Dtos;
using EcommerceDemo.Api.Services;
using EcommerceDemo.Api.Validation;

namespace EcommerceDemo.Api.Endpoints;

public static class StorefrontEndpoints
{
    private static readonly IReadOnlySet<string> CheckoutFields = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        "customer",
        "items",
        "paymentIntentId",
        "paymentMethod",
        "paymentReferenceId"
    };

    private static readonly IReadOnlySet<string> PaymentIntentFields = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        "customer",
        "items",
        "idempotencyKey",
        "paymentMethod"
    };

    public static IEndpointRouteBuilder MapStorefrontEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/storefront").WithTags("Storefront");

        group.MapGet("/products", async (string? search, AppDbContext db, IMemoryCache cache) =>
        {
            if (!InputValidation.TrySearch(search, out var searchInput, out var searchErrors))
            {
                return Results.ValidationProblem(searchErrors);
            }

            if (string.IsNullOrWhiteSpace(searchInput.Term) &&
                cache.TryGetValue(StorefrontCacheKeys.ActiveProducts, out IReadOnlyCollection<ProductResponse>? cachedProducts))
            {
                return Results.Ok(cachedProducts);
            }

            var query = db.Products.AsNoTracking().Where(product => product.IsActive);
            if (!string.IsNullOrWhiteSpace(searchInput.Term))
            {
                var term = searchInput.Term.ToLowerInvariant();
                query = query.Where(product =>
                    product.Name.ToLower().Contains(term) ||
                    product.Sku.ToLower().Contains(term) ||
                    (product.Description != null && product.Description.ToLower().Contains(term)));
            }

            IReadOnlyCollection<ProductResponse> products = await query
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

            if (string.IsNullOrWhiteSpace(searchInput.Term))
            {
                cache.Set(
                    StorefrontCacheKeys.ActiveProducts,
                    products,
                    new MemoryCacheEntryOptions
                    {
                        AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5),
                        Size = products.Count
                    });
            }

            return Results.Ok(products);
        }).AllowAnonymous();

        group.MapPost("/orders", async (
            HttpContext httpContext,
            StorefrontCheckoutService checkout,
            CancellationToken cancellationToken) =>
        {
            var payload = await PermissionPayloadReader.ReadAllowedFieldsAsync<StorefrontCheckoutRequest>(httpContext, CheckoutFields, cancellationToken);
            if (!payload.IsValid)
            {
                return payload.Error!;
            }

            var request = payload.Value!;
            var payloadError = ValidateCheckoutPayload(request.Customer, request.Items);
            if (payloadError is not null)
            {
                return payloadError;
            }

            if (!string.IsNullOrWhiteSpace(request.PaymentReferenceId))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    [nameof(request.PaymentReferenceId)] = ["Use paymentIntentId for card payments."]
                });
            }

            if (!InputValidation.TryPaymentReference(request.PaymentIntentId, out var paymentIntentId, out var paymentReferenceErrors))
            {
                return Results.ValidationProblem(paymentReferenceErrors);
            }

            request = request with { PaymentIntentId = paymentIntentId, PaymentReferenceId = null };
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
            HttpContext httpContext,
            StorefrontCheckoutService checkout,
            CancellationToken cancellationToken) =>
        {
            var payload = await PermissionPayloadReader.ReadAllowedFieldsAsync<StorefrontPaymentIntentRequest>(httpContext, PaymentIntentFields, cancellationToken);
            if (!payload.IsValid)
            {
                return payload.Error!;
            }

            var request = payload.Value!;
            return await PreparePaymentAsync(request with { PaymentMethod = PaymentMethodIds.Card }, checkout, cancellationToken);
        }).AllowAnonymous();

        group.MapPost("/payments/prepare", async (
            HttpContext httpContext,
            StorefrontCheckoutService checkout,
            CancellationToken cancellationToken) =>
        {
            var payload = await PermissionPayloadReader.ReadAllowedFieldsAsync<StorefrontPaymentIntentRequest>(httpContext, PaymentIntentFields, cancellationToken);
            if (!payload.IsValid)
            {
                return payload.Error!;
            }

            var request = payload.Value!;
            return await PreparePaymentAsync(request, checkout, cancellationToken);
        }).AllowAnonymous();

        return app;
    }

    private static async Task<IResult> PreparePaymentAsync(
        StorefrontPaymentIntentRequest request,
        StorefrontCheckoutService checkout,
        CancellationToken cancellationToken)
    {
        var payloadError = ValidateCheckoutPayload(request.Customer, request.Items);
        if (payloadError is not null)
        {
            return payloadError;
        }

        if (!InputValidation.TryIdempotencyKey(request.IdempotencyKey, out var idempotencyKey, out var idempotencyErrors))
        {
            return Results.ValidationProblem(idempotencyErrors);
        }

        request = request with { IdempotencyKey = idempotencyKey };
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

    private static IResult? ValidateCheckoutPayload(
        StorefrontCustomerRequest? customer,
        IReadOnlyCollection<StorefrontOrderItemRequest>? items)
    {
        if (customer is null)
        {
            return Results.BadRequest(new { message = "Customer details are required." });
        }

        if (items is null)
        {
            return Results.BadRequest(new { message = "Order items are required." });
        }

        return null;
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
