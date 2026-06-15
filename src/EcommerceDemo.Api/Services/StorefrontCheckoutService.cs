using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using EcommerceDemo.Api.Data;
using EcommerceDemo.Api.Domain;
using EcommerceDemo.Api.Dtos;
using EcommerceDemo.Api.Validation;

namespace EcommerceDemo.Api.Services;

public sealed class StorefrontCheckoutService(
    AppDbContext db,
    IPasswordHasher passwordHasher,
    ICheckoutPaymentMethodRegistry paymentMethods,
    IHubSpotOrderSyncService hubSpot,
    OrderItemFactory orderItemFactory,
    OrderMapper orderMapper,
    OrderNumberService orderNumbers,
    OrderPricingService pricing)
{
    private const string StorefrontUserEmail = "storefront@ecommerce-demo.test";

    public async Task<StorefrontOrderSubmissionResult> SubmitOrderAsync(
        StorefrontCheckoutRequest request,
        SanitizedCustomerInput customerInput,
        CancellationToken cancellationToken)
    {
        var cart = await BuildCartAsync(request.Items, cancellationToken);
        if (cart.Error is not null)
        {
            return StorefrontOrderSubmissionResult.Failed(cart.Error);
        }

        var paymentMethod = FindPaymentMethod(request.PaymentMethod);
        if (paymentMethod.Error is not null)
        {
            return StorefrontOrderSubmissionResult.Failed(paymentMethod.Error);
        }

        var paymentValidation = await ValidatePaymentAsync(
            paymentMethod.Result!,
            request.PaymentIntentId,
            cart,
            cancellationToken);
        if (paymentValidation.Error is not null)
        {
            return StorefrontOrderSubmissionResult.Failed(paymentValidation.Error);
        }

        var storefrontUser = await GetOrCreateStorefrontUser(cancellationToken);
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
            OrderNumber = await orderNumbers.NextAsync(cancellationToken),
            Customer = customer,
            CreatedByUserId = storefrontUser.Id,
            Status = OrderStatuses.Submitted
        };

        var selections = request.Items.Select(item => new OrderProductSelection(item.ProductId, item.Quantity)).ToList();
        if (!orderItemFactory.TryAddItems(order, selections, cart.Products, out var itemError))
        {
            return StorefrontOrderSubmissionResult.Failed(StorefrontCheckoutError.BadRequest(itemError ?? "Invalid order items."));
        }

        pricing.Recalculate(order);
        order.PaymentProvider = paymentValidation.Result?.ProviderName;
        order.PaymentReferenceId = paymentValidation.Result?.ReferenceId;
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

        return StorefrontOrderSubmissionResult.Succeeded(orderMapper.ToResponse(created));
    }

    public async Task<StorefrontPaymentPreparationResult> PreparePaymentAsync(
        StorefrontPaymentIntentRequest request,
        SanitizedCustomerInput customerInput,
        CancellationToken cancellationToken)
    {
        var paymentMethod = FindPaymentMethod(request.PaymentMethod);
        if (paymentMethod.Error is not null)
        {
            return StorefrontPaymentPreparationResult.Failed(paymentMethod.Error);
        }

        if (!paymentMethod.Result!.IsConfigured)
        {
            return StorefrontPaymentPreparationResult.Failed(StorefrontCheckoutError.ServiceUnavailable("Payment provider is not configured for this demo."));
        }

        var cart = await BuildCartAsync(request.Items, cancellationToken);
        if (cart.Error is not null)
        {
            return StorefrontPaymentPreparationResult.Failed(cart.Error);
        }

        var amount = pricing.ToMinorCurrencyUnit(cart.Total);
        var idempotencyKey = string.IsNullOrWhiteSpace(request.IdempotencyKey)
            ? BuildIdempotencyKey(customerInput.Email, request.Items, amount, paymentMethod.Result.Id)
            : request.IdempotencyKey.Trim();

        try
        {
            var payment = await paymentMethod.Result.PrepareAsync(new PaymentPreparationRequest(
                BuildPaymentLineItems(cart),
                new Dictionary<string, string>
                {
                    ["app"] = "dotnet-react-ecommerce-demo",
                    ["customer_email"] = customerInput.Email,
                    ["customer_name"] = customerInput.Name,
                    ["payment_method"] = paymentMethod.Result.Id,
                    ["product_count"] = request.Items.Count.ToString(),
                    ["total"] = cart.Total.ToString("0.00")
                },
                customerInput.Email,
                idempotencyKey),
                cancellationToken);

            return StorefrontPaymentPreparationResult.Succeeded(new StorefrontPaymentIntentResponse(
                payment.ClientSecret,
                payment.PaymentReferenceId,
                payment.Amount,
                payment.Currency,
                payment.Status,
                payment.PaymentMethod,
                payment.PaymentReferenceId));
        }
        catch (PaymentProviderException)
        {
            return StorefrontPaymentPreparationResult.Failed(StorefrontCheckoutError.BadGateway("Payment provider could not prepare the payment."));
        }
    }

    private StorefrontPaymentMethodResult FindPaymentMethod(string? paymentMethod)
    {
        try
        {
            return StorefrontPaymentMethodResult.Succeeded(paymentMethods.Find(paymentMethod));
        }
        catch (PaymentProviderException ex)
        {
            return StorefrontPaymentMethodResult.Failed(StorefrontCheckoutError.BadRequest(ex.Message));
        }
    }

    private List<PaymentLineItem> BuildPaymentLineItems(CheckoutCart cart)
    {
        var lineItems = cart.Items.Select(item => new PaymentLineItem(
                item.Product.Name,
                item.Product.Description,
                pricing.ToMinorCurrencyUnit(item.Product.Price),
                item.Quantity)).ToList();
        if (cart.Tax > 0)
        {
            lineItems.Add(new PaymentLineItem("Estimated tax", "Demo storefront tax calculation", pricing.ToMinorCurrencyUnit(cart.Tax), 1));
        }

        return lineItems;
    }

    private async Task<StorefrontPaymentValidationResult> ValidatePaymentAsync(
        ICheckoutPaymentMethod paymentMethod,
        string? paymentReferenceId,
        CheckoutCart cart,
        CancellationToken cancellationToken)
    {
        if (!paymentMethod.IsConfigured)
        {
            return StorefrontPaymentValidationResult.Failed(StorefrontCheckoutError.ServiceUnavailable("Payment provider is not configured for this demo."));
        }

        try
        {
            var result = await paymentMethod.ValidateAsync(
                new PaymentValidationRequest(paymentReferenceId, pricing.ToMinorCurrencyUnit(cart.Total)),
                cancellationToken);

            return StorefrontPaymentValidationResult.Succeeded(result);
        }
        catch (PaymentProviderException)
        {
            return StorefrontPaymentValidationResult.Failed(StorefrontCheckoutError.BadRequest("Payment could not be verified."));
        }
    }

    private async Task<User> GetOrCreateStorefrontUser(CancellationToken cancellationToken)
    {
        var user = await db.Users.SingleOrDefaultAsync(x => x.Email == StorefrontUserEmail, cancellationToken);
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
        await db.SaveChangesAsync(cancellationToken);
        return user;
    }

    private async Task<CheckoutCart> BuildCartAsync(
        IReadOnlyCollection<StorefrontOrderItemRequest> items,
        CancellationToken cancellationToken)
    {
        if (items.Count == 0 || items.Count > 50)
        {
            return CheckoutCart.Failed(StorefrontCheckoutError.BadRequest("Order must include between 1 and 50 line items."));
        }

        if (items.Any(item => item.Quantity <= 0 || item.Quantity > 1000))
        {
            return CheckoutCart.Failed(StorefrontCheckoutError.BadRequest("Item quantity must be between 1 and 1,000."));
        }

        var productIds = items.Select(item => item.ProductId).Distinct().ToArray();
        var products = await db.Products
            .Where(product => productIds.Contains(product.Id) && product.IsActive)
            .ToDictionaryAsync(product => product.Id, cancellationToken);

        if (products.Count != productIds.Length)
        {
            return CheckoutCart.Failed(StorefrontCheckoutError.BadRequest("One or more products are inactive or missing."));
        }

        var checkoutItems = items.Select(item => new CheckoutCartItem(products[item.ProductId], item.Quantity)).ToList();
        var totals = pricing.CalculateTotals(checkoutItems.Select(item => decimal.Round(item.Product.Price * item.Quantity, 2)));

        return new CheckoutCart(products, checkoutItems, totals.Subtotal, totals.Tax, totals.Total, null);
    }

    private static string BuildIdempotencyKey(
        string email,
        IReadOnlyCollection<StorefrontOrderItemRequest> items,
        long amount,
        string paymentMethod)
    {
        var raw = string.Join("|", items
            .OrderBy(item => item.ProductId)
            .ThenBy(item => item.Quantity)
            .Select(item => $"{item.ProductId}:{item.Quantity}"));
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes($"{email}|{raw}|{amount}|{paymentMethod}"));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    private sealed record CheckoutCart(
        IReadOnlyDictionary<Guid, Product> Products,
        IReadOnlyCollection<CheckoutCartItem> Items,
        decimal Subtotal,
        decimal Tax,
        decimal Total,
        StorefrontCheckoutError? Error)
    {
        public static CheckoutCart Failed(StorefrontCheckoutError error)
        {
            return new CheckoutCart(new Dictionary<Guid, Product>(), [], 0m, 0m, 0m, error);
        }
    }

    private sealed record CheckoutCartItem(Product Product, int Quantity);
    private sealed record StorefrontPaymentMethodResult(ICheckoutPaymentMethod? Result, StorefrontCheckoutError? Error)
    {
        public static StorefrontPaymentMethodResult Succeeded(ICheckoutPaymentMethod result)
        {
            return new StorefrontPaymentMethodResult(result, null);
        }

        public static StorefrontPaymentMethodResult Failed(StorefrontCheckoutError error)
        {
            return new StorefrontPaymentMethodResult(null, error);
        }
    }

    private sealed record StorefrontPaymentValidationResult(PaymentValidationResult? Result, StorefrontCheckoutError? Error)
    {
        public static StorefrontPaymentValidationResult Succeeded(PaymentValidationResult result)
        {
            return new StorefrontPaymentValidationResult(result, null);
        }

        public static StorefrontPaymentValidationResult Failed(StorefrontCheckoutError error)
        {
            return new StorefrontPaymentValidationResult(null, error);
        }
    }
}

public sealed record StorefrontCheckoutError(int StatusCode, string Message)
{
    public static StorefrontCheckoutError BadRequest(string message)
    {
        return new StorefrontCheckoutError(StatusCodes.Status400BadRequest, message);
    }

    public static StorefrontCheckoutError BadGateway(string message)
    {
        return new StorefrontCheckoutError(StatusCodes.Status502BadGateway, message);
    }

    public static StorefrontCheckoutError ServiceUnavailable(string message)
    {
        return new StorefrontCheckoutError(StatusCodes.Status503ServiceUnavailable, message);
    }
}

public sealed record StorefrontOrderSubmissionResult(OrderResponse? Order, StorefrontCheckoutError? Error)
{
    public static StorefrontOrderSubmissionResult Succeeded(OrderResponse order)
    {
        return new StorefrontOrderSubmissionResult(order, null);
    }

    public static StorefrontOrderSubmissionResult Failed(StorefrontCheckoutError error)
    {
        return new StorefrontOrderSubmissionResult(null, error);
    }
}

public sealed record StorefrontPaymentPreparationResult(StorefrontPaymentIntentResponse? Payment, StorefrontCheckoutError? Error)
{
    public static StorefrontPaymentPreparationResult Succeeded(StorefrontPaymentIntentResponse payment)
    {
        return new StorefrontPaymentPreparationResult(payment, null);
    }

    public static StorefrontPaymentPreparationResult Failed(StorefrontCheckoutError error)
    {
        return new StorefrontPaymentPreparationResult(null, error);
    }
}
