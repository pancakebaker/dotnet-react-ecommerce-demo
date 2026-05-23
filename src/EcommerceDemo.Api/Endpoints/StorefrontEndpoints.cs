using Microsoft.EntityFrameworkCore;
using EcommerceDemo.Api.Data;
using EcommerceDemo.Api.Domain;
using EcommerceDemo.Api.Dtos;
using EcommerceDemo.Api.Services;
using EcommerceDemo.Api.Validation;

namespace EcommerceDemo.Api.Endpoints;

public static class StorefrontEndpoints
{
    private const decimal TaxRate = 0.12m;
    private const string StorefrontUserEmail = "storefront@ecommerce-demo.test";

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
            AppDbContext db,
            IPasswordHasher passwordHasher) =>
        {
            if (request.Items.Count == 0 || request.Items.Count > 50)
            {
                return Results.BadRequest(new { message = "Order must include between 1 and 50 line items." });
            }

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

            var productIds = request.Items.Select(item => item.ProductId).ToArray();
            var products = await db.Products
                .Where(product => productIds.Contains(product.Id) && product.IsActive)
                .ToDictionaryAsync(product => product.Id);

            if (products.Count != productIds.Distinct().Count())
            {
                return Results.BadRequest(new { message = "One or more products are inactive or missing." });
            }

            var storefrontUser = await GetOrCreateStorefrontUser(db, passwordHasher);
            var customer = new Customer
            {
                Name = customerInput.Name,
                CompanyName = customerInput.CompanyName,
                Email = customerInput.Email,
                Phone = customerInput.Phone,
                Address = customerInput.Address
            };

            var order = new Order
            {
                OrderNumber = await NextOrderNumber(db),
                Customer = customer,
                CreatedByUserId = storefrontUser.Id,
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
            db.Customers.Add(customer);
            db.Orders.Add(order);
            db.ActivityLogs.Add(new ActivityLog
            {
                EntityType = "Customer",
                EntityId = customer.Id,
                Action = "Created",
                Description = $"Customer {customer.Name} checked out from the storefront.",
                UserId = storefrontUser.Id
            });
            db.ActivityLogs.Add(new ActivityLog
            {
                EntityType = "Order",
                EntityId = order.Id,
                Action = "Submitted",
                Description = $"Storefront order {order.OrderNumber} was submitted.",
                UserId = storefrontUser.Id
            });

            await db.SaveChangesAsync();

            var created = await db.Orders
                .AsNoTracking()
                .Include(x => x.Customer)
                .Include(x => x.Items)
                .SingleAsync(x => x.Id == order.Id);

            return Results.Created($"/api/orders/{order.Id}", ToResponse(created));
        }).AllowAnonymous();

        return app;
    }

    private static async Task<User> GetOrCreateStorefrontUser(AppDbContext db, IPasswordHasher passwordHasher)
    {
        var user = await db.Users.SingleOrDefaultAsync(x => x.Email == StorefrontUserEmail);
        if (user is not null)
        {
            return user;
        }

        user = new User
        {
            FirstName = "Storefront",
            LastName = "Checkout",
            Email = StorefrontUserEmail,
            Role = Roles.Staff,
            PasswordHash = passwordHasher.Hash(Guid.NewGuid().ToString("N"))
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return user;
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
