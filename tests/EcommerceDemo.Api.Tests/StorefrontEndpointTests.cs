using System.Net;
using System.Net.Http.Json;
using EcommerceDemo.Api.Dtos;
using EcommerceDemo.Api.Services;

namespace EcommerceDemo.Api.Tests;

public sealed class StorefrontEndpointTests(ApiTestFactory factory) : IClassFixture<ApiTestFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Anonymous_Visitor_Can_List_Products_And_Place_Order_With_Customer_Details()
    {
        var products = await _client.GetFromJsonAsync<List<ProductResponse>>("/api/storefront/products");

        Assert.NotNull(products);
        var product = Assert.Single(products.Where(item => item.IsActive).Take(1));

        var payment = await _client.PostAsJsonAsync("/api/storefront/payments/create-intent", new StorefrontPaymentIntentRequest(
            new StorefrontCustomerRequest(
                "Front Door Buyer",
                "Public Demo Co",
                "buyer@public-demo.test",
                "+1 555-0188",
                "15 Checkout Lane"),
            [new StorefrontOrderItemRequest(product.Id, 2)],
            "test-checkout-payment"));
        payment.EnsureSuccessStatusCode();
        var paymentIntent = await payment.Content.ReadFromJsonAsync<StorefrontPaymentIntentResponse>();

        var response = await _client.PostAsJsonAsync("/api/storefront/orders", new StorefrontCheckoutRequest(
            new StorefrontCustomerRequest(
                "Front Door Buyer",
                "Public Demo Co",
                "buyer@public-demo.test",
                "+1 555-0188",
                "15 Checkout Lane"),
            [new StorefrontOrderItemRequest(product.Id, 2)],
            paymentIntent!.PaymentIntentId));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var order = await response.Content.ReadFromJsonAsync<OrderResponse>();

        Assert.NotNull(order);
        Assert.Equal("Front Door Buyer", order.CustomerName);
        Assert.Equal("Submitted", order.Status);
        Assert.True(order.Total > 0);
    }

    [Fact]
    public async Task Storefront_Checkout_Requires_Card_Payment_By_Default()
    {
        var products = await _client.GetFromJsonAsync<List<ProductResponse>>("/api/storefront/products");
        var product = Assert.Single(products!.Where(item => item.IsActive).Take(1));

        var response = await _client.PostAsJsonAsync("/api/storefront/orders", new StorefrontCheckoutRequest(
            new StorefrontCustomerRequest(
                "Front Door Buyer",
                "Public Demo Co",
                "buyer@public-demo.test",
                "+1 555-0188",
                "15 Checkout Lane"),
            [new StorefrontOrderItemRequest(product.Id, 2)]));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Anonymous_Visitor_Can_Place_Cash_On_Delivery_Order()
    {
        var products = await _client.GetFromJsonAsync<List<ProductResponse>>("/api/storefront/products");
        var product = Assert.Single(products!.Where(item => item.IsActive).Take(1));

        var response = await _client.PostAsJsonAsync("/api/storefront/orders", new StorefrontCheckoutRequest(
            new StorefrontCustomerRequest(
                "COD Buyer",
                "Public Demo Co",
                "cod@public-demo.test",
                "+1 555-0189",
                "21 Delivery Lane"),
            [new StorefrontOrderItemRequest(product.Id, 1)],
            PaymentMethod: PaymentMethodIds.CashOnDelivery));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var order = await response.Content.ReadFromJsonAsync<OrderResponse>();

        Assert.NotNull(order);
        Assert.Equal("COD Buyer", order.CustomerName);
        Assert.Equal("Submitted", order.Status);
        Assert.True(order.Total > 0);
    }

    [Fact]
    public async Task Storefront_Checkout_Rejects_Invalid_Customer_Details()
    {
        var products = await _client.GetFromJsonAsync<List<ProductResponse>>("/api/storefront/products");
        var product = Assert.Single(products!.Where(item => item.IsActive).Take(1));

        var response = await _client.PostAsJsonAsync("/api/storefront/orders", new StorefrontCheckoutRequest(
            new StorefrontCustomerRequest(
                "Front Door Buyer",
                "Public Demo Co",
                "not-an-email",
                "<img src=x onerror=alert(1)>",
                "15 Checkout Lane"),
            [new StorefrontOrderItemRequest(product.Id, 2)]));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Storefront_Checkout_Rejects_Unexpected_Payment_Reference_Field()
    {
        var products = await _client.GetFromJsonAsync<List<ProductResponse>>("/api/storefront/products");
        var product = Assert.Single(products!.Where(item => item.IsActive).Take(1));

        var response = await _client.PostAsJsonAsync("/api/storefront/orders", new
        {
            customer = new
            {
                name = "Front Door Buyer",
                companyName = "Public Demo Co",
                email = "buyer@public-demo.test",
                phone = "+1 555-0188",
                address = "15 Checkout Lane"
            },
            items = new[] { new { productId = product.Id, quantity = 1 } },
            paymentMethod = PaymentMethodIds.CashOnDelivery,
            paymentReferenceId = "legacy-reference"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Storefront_Product_Search_Rejects_Overlong_Terms()
    {
        var response = await _client.GetAsync($"/api/storefront/products?search={new string('a', 101)}");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Storefront_Products_Endpoint_Returns_Active_Products_Only()
    {
        await _client.AuthenticateAsync();
        var inactiveSku = $"INACTIVE-{Guid.NewGuid():N}"[..20];
        var createResponse = await _client.PostAsJsonAsync("/api/products", new UpsertProductRequest(
            "Inactive Storefront Item",
            inactiveSku,
            "Should not be visible to storefront shoppers",
            25m,
            10,
            false));
        createResponse.EnsureSuccessStatusCode();

        _client.DefaultRequestHeaders.Authorization = null;
        var products = await _client.GetFromJsonAsync<List<ProductResponse>>($"/api/storefront/products?search={inactiveSku}");

        Assert.NotNull(products);
        Assert.Empty(products);
    }

    [Fact]
    public async Task Storefront_Checkout_Rejects_Missing_Product()
    {
        var response = await _client.PostAsJsonAsync("/api/storefront/orders", new StorefrontCheckoutRequest(
            ValidCustomer(),
            [new StorefrontOrderItemRequest(Guid.NewGuid(), 1)],
            PaymentMethod: PaymentMethodIds.CashOnDelivery));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Storefront_Checkout_Rejects_PaymentIntent_That_Is_Not_Succeeded()
    {
        var product = await FirstStorefrontProductAsync();
        var paymentIntent = await PreparePaymentAsync(product, 1, "not-succeeded-payment");

        var response = await _client.PostAsJsonAsync("/api/storefront/orders", new StorefrontCheckoutRequest(
            ValidCustomer(),
            [new StorefrontOrderItemRequest(product.Id, 1)],
            paymentIntent.PaymentIntentId));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Storefront_Checkout_Rejects_PaymentIntent_Amount_Mismatch()
    {
        var product = await FirstStorefrontProductAsync();
        var paymentIntent = await PreparePaymentAsync(product, 1, "amount-mismatch-payment");

        var response = await _client.PostAsJsonAsync("/api/storefront/orders", new StorefrontCheckoutRequest(
            ValidCustomer(),
            [new StorefrontOrderItemRequest(product.Id, 2)],
            paymentIntent.PaymentIntentId));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Storefront_Checkout_Rejects_PaymentIntent_Currency_Mismatch()
    {
        var product = await FirstStorefrontProductAsync();
        var paymentIntent = await PreparePaymentAsync(product, 1, "currency-mismatch-payment");

        var response = await _client.PostAsJsonAsync("/api/storefront/orders", new StorefrontCheckoutRequest(
            ValidCustomer(),
            [new StorefrontOrderItemRequest(product.Id, 1)],
            paymentIntent.PaymentIntentId));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private async Task<ProductResponse> FirstStorefrontProductAsync()
    {
        var products = await _client.GetFromJsonAsync<List<ProductResponse>>("/api/storefront/products");
        return Assert.Single(products!.Where(item => item.IsActive).Take(1));
    }

    private async Task<StorefrontPaymentIntentResponse> PreparePaymentAsync(ProductResponse product, int quantity, string idempotencyKey)
    {
        var response = await _client.PostAsJsonAsync("/api/storefront/payments/prepare", new StorefrontPaymentIntentRequest(
            ValidCustomer(),
            [new StorefrontOrderItemRequest(product.Id, quantity)],
            idempotencyKey,
            PaymentMethodIds.Card));
        response.EnsureSuccessStatusCode();
        var paymentIntent = await response.Content.ReadFromJsonAsync<StorefrontPaymentIntentResponse>();

        Assert.NotNull(paymentIntent);
        Assert.StartsWith("pi_", paymentIntent.PaymentIntentId);
        Assert.StartsWith($"{paymentIntent.PaymentIntentId}_secret_", paymentIntent.ClientSecret);
        return paymentIntent;
    }

    private static StorefrontCustomerRequest ValidCustomer()
    {
        return new StorefrontCustomerRequest(
            "Front Door Buyer",
            "Public Demo Co",
            "buyer@public-demo.test",
            "+1 555-0188",
            "15 Checkout Lane");
    }
}
