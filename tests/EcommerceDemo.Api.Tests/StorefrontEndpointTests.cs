using System.Net;
using System.Net.Http.Json;
using EcommerceDemo.Api.Dtos;

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

        var response = await _client.PostAsJsonAsync("/api/storefront/orders", new StorefrontCheckoutRequest(
            new StorefrontCustomerRequest(
                "Front Door Buyer",
                "Public Demo Co",
                "buyer@public-demo.test",
                "+1 555-0188",
                "15 Checkout Lane"),
            [new StorefrontOrderItemRequest(product.Id, 2)]));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var order = await response.Content.ReadFromJsonAsync<OrderResponse>();

        Assert.NotNull(order);
        Assert.Equal("Front Door Buyer", order.CustomerName);
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
}
