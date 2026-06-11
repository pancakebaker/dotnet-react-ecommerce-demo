using Microsoft.EntityFrameworkCore;
using EcommerceDemo.Api.Data;
using EcommerceDemo.Api.Domain;
using EcommerceDemo.Api.Dtos;
using EcommerceDemo.Api.Services;

namespace EcommerceDemo.Api.Endpoints;

public static class OrderEndpoints
{
    public static IEndpointRouteBuilder MapOrderEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/orders")
            .RequireAuthorization("StaffOrAdmin")
            .WithTags("Orders");

        group.MapGet("/", async (string? status, int page, int pageSize, AppDbContext db, OrderMapper orderMapper) =>
        {
            page = Math.Max(page, 1);
            pageSize = Math.Clamp(pageSize == 0 ? 10 : pageSize, 1, 50);
            var query = db.Orders
                .AsNoTracking()
                .Include(order => order.Customer)
                .Include(order => order.Items)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(order => order.Status == status);
            }

            var totalCount = await query.CountAsync();
            var orders = await query
                .OrderByDescending(order => order.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Results.Ok(new PagedResult<OrderResponse>(orders.Select(orderMapper.ToResponse).ToList(), page, pageSize, totalCount));
        });

        group.MapGet("/{id:guid}", async (Guid id, AppDbContext db, OrderMapper orderMapper) =>
        {
            var order = await db.Orders
                .AsNoTracking()
                .Include(x => x.Customer)
                .Include(x => x.Items)
                .SingleOrDefaultAsync(x => x.Id == id);

            return order is null ? Results.NotFound() : Results.Ok(orderMapper.ToResponse(order));
        });

        group.MapPost("/", async (
            CreateOrderRequest request,
            AppDbContext db,
            HttpContext httpContext,
            IHubSpotOrderSyncService hubSpot,
            OrderItemFactory orderItemFactory,
            OrderMapper orderMapper,
            OrderNumberService orderNumbers,
            OrderPricingService pricing,
            CancellationToken cancellationToken) =>
        {
            if (!await db.Customers.AnyAsync(customer => customer.Id == request.CustomerId, cancellationToken))
            {
                return Results.BadRequest(new { message = "Customer does not exist." });
            }

            if (request.Items.Count == 0 || request.Items.Count > 50)
            {
                return Results.BadRequest(new { message = "Order must include between 1 and 50 line items." });
            }

            if (request.Discount < 0 || request.Discount > 9999999999.99m)
            {
                return Results.BadRequest(new { message = "Discount must be between 0 and 9,999,999,999.99." });
            }

            var productIds = request.Items.Select(item => item.ProductId).ToArray();
            var products = await db.Products
                .Where(product => productIds.Contains(product.Id) && product.IsActive)
                .ToDictionaryAsync(product => product.Id, cancellationToken);
            if (products.Count != productIds.Distinct().Count())
            {
                return Results.BadRequest(new { message = "One or more products are inactive or missing." });
            }

            var order = new Order
            {
                OrderNumber = await orderNumbers.NextAsync(cancellationToken),
                CustomerId = request.CustomerId,
                CreatedByUserId = CurrentUser.Id(httpContext.User),
                Discount = Math.Max(0, request.Discount),
                Status = OrderStatuses.Submitted
            };

            var selections = request.Items.Select(item => new OrderProductSelection(item.ProductId, item.Quantity)).ToList();
            if (!orderItemFactory.TryAddItems(order, selections, products, out var itemError))
            {
                return Results.BadRequest(new { message = itemError });
            }

            pricing.Recalculate(order);
            db.Orders.Add(order);
            db.ActivityLogs.Add(new ActivityLog
            {
                EntityType = "Order",
                EntityId = order.Id,
                Action = "Created",
                Description = $"Order {order.OrderNumber} was created.",
                UserId = order.CreatedByUserId
            });
            await db.SaveChangesAsync(cancellationToken);

            var created = await db.Orders
                .AsNoTracking()
                .Include(x => x.Customer)
                .Include(x => x.Items)
                .SingleAsync(x => x.Id == order.Id, cancellationToken);
            var hubSpotObjectId = await hubSpot.CreateOrderAsync(created, cancellationToken);
            if (!string.IsNullOrWhiteSpace(hubSpotObjectId))
            {
                order.HubSpotObjectId = hubSpotObjectId;
                await db.SaveChangesAsync(cancellationToken);
            }

            return Results.Created($"/api/orders/{order.Id}", orderMapper.ToResponse(created));
        });

        group.MapPatch("/{id:guid}/status", async (
            Guid id,
            UpdateOrderStatusRequest request,
            AppDbContext db,
            HttpContext httpContext,
            IHubSpotOrderSyncService hubSpot,
            CancellationToken cancellationToken) =>
        {
            if (!OrderStatuses.All.Contains(request.Status))
            {
                return Results.BadRequest(new { message = "Invalid order status." });
            }

            var order = await db.Orders
                .Include(x => x.Customer)
                .Include(x => x.Items)
                .SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
            if (order is null)
            {
                return Results.NotFound();
            }

            order.Status = request.Status;
            order.UpdatedAt = DateTimeOffset.UtcNow;
            db.ActivityLogs.Add(new ActivityLog
            {
                EntityType = "Order",
                EntityId = order.Id,
                Action = "StatusChanged",
                Description = $"Order {order.OrderNumber} moved to {order.Status}.",
                UserId = CurrentUser.Id(httpContext.User)
            });
            await db.SaveChangesAsync(cancellationToken);
            await hubSpot.UpdateOrderAsync(order, cancellationToken);

            return Results.NoContent();
        });

        return app;
    }
}
