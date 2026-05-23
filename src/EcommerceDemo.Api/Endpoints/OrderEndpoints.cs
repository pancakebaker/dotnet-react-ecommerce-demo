using Microsoft.EntityFrameworkCore;
using EcommerceDemo.Api.Data;
using EcommerceDemo.Api.Domain;
using EcommerceDemo.Api.Dtos;

namespace EcommerceDemo.Api.Endpoints;

public static class OrderEndpoints
{
    private const decimal TaxRate = 0.12m;

    public static IEndpointRouteBuilder MapOrderEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/orders")
            .RequireAuthorization("StaffOrAdmin")
            .WithTags("Orders");

        group.MapGet("/", async (string? status, int page, int pageSize, AppDbContext db) =>
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

            return Results.Ok(new PagedResult<OrderResponse>(orders.Select(ToResponse).ToList(), page, pageSize, totalCount));
        });

        group.MapGet("/{id:guid}", async (Guid id, AppDbContext db) =>
        {
            var order = await db.Orders
                .AsNoTracking()
                .Include(x => x.Customer)
                .Include(x => x.Items)
                .SingleOrDefaultAsync(x => x.Id == id);

            return order is null ? Results.NotFound() : Results.Ok(ToResponse(order));
        });

        group.MapPost("/", async (CreateOrderRequest request, AppDbContext db, HttpContext httpContext) =>
        {
            if (!await db.Customers.AnyAsync(customer => customer.Id == request.CustomerId))
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
            var products = await db.Products.Where(product => productIds.Contains(product.Id) && product.IsActive).ToDictionaryAsync(product => product.Id);
            if (products.Count != productIds.Distinct().Count())
            {
                return Results.BadRequest(new { message = "One or more products are inactive or missing." });
            }

            var order = new Order
            {
                OrderNumber = await NextOrderNumber(db),
                CustomerId = request.CustomerId,
                CreatedByUserId = CurrentUser.Id(httpContext.User),
                Discount = Math.Max(0, request.Discount),
                Status = OrderStatuses.Submitted
            };

            foreach (var item in request.Items)
            {
                if (item.Quantity <= 0 || item.Quantity > 1000)
                {
                    return Results.BadRequest(new { message = "Item quantity must be between 1 and 1,000." });
                }

                var product = products[item.ProductId];
                order.Items.Add(new OrderItem
                {
                    ProductId = product.Id,
                    ProductName = product.Name,
                    Quantity = item.Quantity,
                    UnitPrice = product.Price,
                    LineTotal = decimal.Round(product.Price * item.Quantity, 2)
                });
            }

            Recalculate(order);
            db.Orders.Add(order);
            db.ActivityLogs.Add(new ActivityLog
            {
                EntityType = "Order",
                EntityId = order.Id,
                Action = "Created",
                Description = $"Order {order.OrderNumber} was created.",
                UserId = order.CreatedByUserId
            });
            await db.SaveChangesAsync();

            var created = await db.Orders.AsNoTracking().Include(x => x.Customer).Include(x => x.Items).SingleAsync(x => x.Id == order.Id);
            return Results.Created($"/api/orders/{order.Id}", ToResponse(created));
        });

        group.MapPatch("/{id:guid}/status", async (Guid id, UpdateOrderStatusRequest request, AppDbContext db, HttpContext httpContext) =>
        {
            if (!OrderStatuses.All.Contains(request.Status))
            {
                return Results.BadRequest(new { message = "Invalid order status." });
            }

            var order = await db.Orders.FindAsync(id);
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
            await db.SaveChangesAsync();

            return Results.NoContent();
        });

        return app;
    }

    private static void Recalculate(Order order)
    {
        order.Subtotal = decimal.Round(order.Items.Sum(item => item.LineTotal), 2);
        order.Tax = decimal.Round(order.Subtotal * TaxRate, 2);
        order.Total = decimal.Round(order.Subtotal + order.Tax - order.Discount, 2);
    }

    private static async Task<string> NextOrderNumber(AppDbContext db)
    {
        var count = await db.Orders.CountAsync() + 1;
        return $"OF-{DateTime.UtcNow:yyyyMMdd}-{count:0000}";
    }

    private static OrderResponse ToResponse(Order order)
    {
        return new OrderResponse(
            order.Id,
            order.OrderNumber,
            order.CustomerId,
            order.Customer?.Name ?? "Unknown customer",
            order.Status,
            order.Subtotal,
            order.Tax,
            order.Discount,
            order.Total,
            order.CreatedByUserId,
            order.CreatedAt,
            order.Items.Select(item => new OrderItemResponse(item.Id, item.ProductId, item.ProductName, item.Quantity, item.UnitPrice, item.LineTotal)).ToList());
    }
}
