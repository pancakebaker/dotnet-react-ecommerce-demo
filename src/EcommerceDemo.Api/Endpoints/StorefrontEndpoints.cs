using System.Security.Cryptography;
using System.Text;
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
            IPasswordHasher passwordHasher,
            IStripePaymentService stripe,
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

            var cart = await BuildCartAsync(request.Items, db, cancellationToken);
            if (cart.Error is not null)
            {
                return cart.Error;
            }

            var paymentValidation = await ValidatePaymentAsync(request.PaymentIntentId, cart, stripe, cancellationToken);
            if (paymentValidation is not null)
            {
                return paymentValidation;
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

                var product = cart.Products[item.ProductId];
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
            order.StripePaymentIntentId = request.PaymentIntentId;
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

        group.MapPost("/payments/create-intent", async (
            StorefrontPaymentIntentRequest request,
            AppDbContext db,
            IStripePaymentService stripe,
            CancellationToken cancellationToken) =>
        {
            if (!stripe.IsConfigured)
            {
                return Results.Problem("Stripe secret key is not configured for this demo.", statusCode: StatusCodes.Status503ServiceUnavailable);
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

            var cart = await BuildCartAsync(request.Items, db, cancellationToken);
            if (cart.Error is not null)
            {
                return cart.Error;
            }

            var amount = ToStripeAmount(cart.Total);
            var idempotencyKey = string.IsNullOrWhiteSpace(request.IdempotencyKey)
                ? BuildIdempotencyKey(customerInput.Email, request.Items, amount, stripe.Currency)
                : request.IdempotencyKey.Trim();

            try
            {
                var lineItems = cart.Items.Select(item => new StripePaymentLineItem(
                        item.Product.Name,
                        item.Product.Description,
                        ToStripeAmount(item.Product.Price),
                        item.Quantity)).ToList();
                if (cart.Tax > 0)
                {
                    lineItems.Add(new StripePaymentLineItem("Estimated tax", "Demo storefront tax calculation", ToStripeAmount(cart.Tax), 1));
                }

                var paymentIntent = await stripe.CreatePaymentIntentAsync(
                    lineItems,
                    new Dictionary<string, string>
                {
                    ["app"] = "dotnet-react-ecommerce-demo",
                    ["customer_email"] = customerInput.Email,
                    ["customer_name"] = customerInput.Name,
                    ["product_count"] = request.Items.Count.ToString(),
                    ["total"] = cart.Total.ToString("0.00")
                },
                    customerInput.Email,
                    idempotencyKey,
                    cancellationToken);

                return Results.Ok(new StorefrontPaymentIntentResponse(
                    paymentIntent.ClientSecret,
                    paymentIntent.Id,
                    paymentIntent.Amount,
                    paymentIntent.Currency,
                    paymentIntent.Status));
            }
            catch (Stripe.StripeException ex)
            {
                return Results.Problem(ex.StripeError?.Message ?? "Stripe could not create a payment intent.", statusCode: StatusCodes.Status502BadGateway);
            }
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

    private static async Task<CheckoutCart> BuildCartAsync(
        IReadOnlyCollection<StorefrontOrderItemRequest> items,
        AppDbContext db,
        CancellationToken cancellationToken)
    {
        if (items.Count == 0 || items.Count > 50)
        {
            return CheckoutCart.Failed(Results.BadRequest(new { message = "Order must include between 1 and 50 line items." }));
        }

        if (items.Any(item => item.Quantity <= 0 || item.Quantity > 1000))
        {
            return CheckoutCart.Failed(Results.BadRequest(new { message = "Item quantity must be between 1 and 1,000." }));
        }

        var productIds = items.Select(item => item.ProductId).Distinct().ToArray();
        var products = await db.Products
            .Where(product => productIds.Contains(product.Id) && product.IsActive)
            .ToDictionaryAsync(product => product.Id, cancellationToken);

        if (products.Count != productIds.Length)
        {
            return CheckoutCart.Failed(Results.BadRequest(new { message = "One or more products are inactive or missing." }));
        }

        var checkoutItems = items.Select(item => new CheckoutCartItem(products[item.ProductId], item.Quantity)).ToList();
        var subtotal = decimal.Round(checkoutItems.Sum(item => item.Product.Price * item.Quantity), 2);
        var tax = decimal.Round(subtotal * TaxRate, 2);
        var total = decimal.Round(subtotal + tax, 2);

        return new CheckoutCart(products, checkoutItems, subtotal, tax, total, null);
    }

    private static async Task<IResult?> ValidatePaymentAsync(
        string? paymentIntentId,
        CheckoutCart cart,
        IStripePaymentService stripe,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(paymentIntentId))
        {
            return Results.BadRequest(new { message = "Stripe payment is required before placing the order." });
        }

        if (!stripe.IsConfigured)
        {
            return Results.Problem("Stripe secret key is not configured for this demo.", statusCode: StatusCodes.Status503ServiceUnavailable);
        }

        try
        {
            var paymentIntent = await stripe.GetPaymentIntentAsync(paymentIntentId.Trim(), cancellationToken);
            if (!string.Equals(paymentIntent.Status, "succeeded", StringComparison.OrdinalIgnoreCase))
            {
                return Results.BadRequest(new
                {
                    message = $"Stripe payment is not complete. Current status: {paymentIntent.Status}."
                });
            }

            if (paymentIntent.Amount != ToStripeAmount(cart.Total) ||
                !string.Equals(paymentIntent.Currency, stripe.Currency, StringComparison.OrdinalIgnoreCase))
            {
                return Results.BadRequest(new
                {
                    message = "Stripe payment does not match the current cart total."
                });
            }
        }
        catch (Stripe.StripeException ex)
        {
            return Results.Problem(ex.StripeError?.Message ?? "Stripe payment verification failed.", statusCode: StatusCodes.Status502BadGateway);
        }

        return null;
    }

    private static long ToStripeAmount(decimal total)
    {
        return decimal.ToInt64(decimal.Round(total * 100m, 0, MidpointRounding.AwayFromZero));
    }

    private static string BuildIdempotencyKey(
        string email,
        IReadOnlyCollection<StorefrontOrderItemRequest> items,
        long amount,
        string currency)
    {
        var raw = string.Join("|", items
            .OrderBy(item => item.ProductId)
            .ThenBy(item => item.Quantity)
            .Select(item => $"{item.ProductId}:{item.Quantity}"));
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes($"{email}|{raw}|{amount}|{currency}"));
        return Convert.ToHexString(bytes).ToLowerInvariant();
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

    private sealed record CheckoutCart(
        IReadOnlyDictionary<Guid, Product> Products,
        IReadOnlyCollection<CheckoutCartItem> Items,
        decimal Subtotal,
        decimal Tax,
        decimal Total,
        IResult? Error)
    {
        public static CheckoutCart Failed(IResult error)
        {
            return new CheckoutCart(new Dictionary<Guid, Product>(), [], 0m, 0m, 0m, error);
        }
    }

    private sealed record CheckoutCartItem(Product Product, int Quantity);
}
