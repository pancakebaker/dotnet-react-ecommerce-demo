using Microsoft.EntityFrameworkCore;
using EcommerceDemo.Api.Data;
using EcommerceDemo.Api.Domain;
using EcommerceDemo.Api.Dtos;
using EcommerceDemo.Api.Services.Permissions;
using EcommerceDemo.Api.Validation;

namespace EcommerceDemo.Api.Endpoints;

public static class ProductEndpoints
{
    public static IEndpointRouteBuilder MapProductEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/products")
            .RequireAuthorization("StaffOrAdmin")
            .WithTags("Products");

        group.MapGet("/", async (string? search, int page, int pageSize, AppDbContext db) =>
        {
            page = Math.Max(page, 1);
            pageSize = Math.Clamp(pageSize == 0 ? 10 : pageSize, 1, 50);
            var query = db.Products.AsNoTracking();
            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLowerInvariant();
                query = query.Where(product => product.Name.ToLower().Contains(term) || product.Sku.ToLower().Contains(term));
            }

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderBy(product => product.Name)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(product => ToResponse(product))
                .ToListAsync();

            return Results.Ok(new PagedResult<ProductResponse>(items, page, pageSize, totalCount));
        }).RequirePermission("products", "view");

        group.MapPost("/", async (HttpContext httpContext, AppDbContext db, IPermissionService permissions, CancellationToken cancellationToken) =>
        {
            var payload = await PermissionPayloadReader.ReadAsync<UpsertProductRequest>(httpContext, permissions, "products", cancellationToken);
            if (!payload.IsValid)
            {
                return payload.Error!;
            }

            var request = payload.Value!;
            if (!InputValidation.TryProduct(request.Name, request.Sku, request.Description, request.Price, request.StockQuantity, request.IsActive, out var input, out var errors))
            {
                return Results.ValidationProblem(errors);
            }

            if (await db.Products.AnyAsync(product => product.Sku == input.Sku))
            {
                return Results.Conflict(new { message = "SKU already exists." });
            }

            var product = new Product
            {
                Name = input.Name,
                Sku = input.Sku,
                Description = input.Description,
                Price = input.Price,
                StockQuantity = input.StockQuantity,
                IsActive = input.IsActive
            };
            db.Products.Add(product);
            AddLog(db, product.Id, "Created", $"Product {product.Sku} was created.", CurrentUser.Id(httpContext.User));
            await db.SaveChangesAsync();

            return Results.Created($"/api/products/{product.Id}", ToResponse(product));
        }).RequirePermission("products", "create");

        group.MapPut("/{id:guid}", async (Guid id, HttpContext httpContext, AppDbContext db, IPermissionService permissions, CancellationToken cancellationToken) =>
        {
            var payload = await PermissionPayloadReader.ReadAsync<UpsertProductRequest>(httpContext, permissions, "products", cancellationToken);
            if (!payload.IsValid)
            {
                return payload.Error!;
            }

            var request = payload.Value!;
            if (!InputValidation.TryProduct(request.Name, request.Sku, request.Description, request.Price, request.StockQuantity, request.IsActive, out var input, out var errors))
            {
                return Results.ValidationProblem(errors);
            }

            var product = await db.Products.FindAsync(id);
            if (product is null)
            {
                return Results.NotFound();
            }

            product.Name = input.Name;
            product.Sku = input.Sku;
            product.Description = input.Description;
            product.Price = input.Price;
            product.StockQuantity = input.StockQuantity;
            product.IsActive = input.IsActive;
            product.UpdatedAt = DateTimeOffset.UtcNow;
            AddLog(db, product.Id, "Updated", $"Product {product.Sku} was updated.", CurrentUser.Id(httpContext.User));
            await db.SaveChangesAsync();

            return Results.Ok(ToResponse(product));
        }).RequirePermission("products", "update");

        group.MapDelete("/{id:guid}", async (Guid id, AppDbContext db, HttpContext httpContext) =>
        {
            var product = await db.Products.FindAsync(id);
            if (product is null)
            {
                return Results.NotFound();
            }

            db.Products.Remove(product);
            AddLog(db, product.Id, "Deleted", $"Product {product.Sku} was deleted.", CurrentUser.Id(httpContext.User));
            await db.SaveChangesAsync();

            return Results.NoContent();
        }).RequirePermission("products", "delete");

        return app;
    }

    private static ProductResponse ToResponse(Product product)
    {
        return new ProductResponse(product.Id, product.Name, product.Sku, product.Description, product.Price, product.StockQuantity, product.IsActive);
    }

    private static void AddLog(AppDbContext db, Guid entityId, string action, string description, Guid userId)
    {
        db.ActivityLogs.Add(new ActivityLog
        {
            EntityType = "Product",
            EntityId = entityId,
            Action = action,
            Description = description,
            UserId = userId
        });
    }
}
