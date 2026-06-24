using System.Net;
using System.Net.Http.Json;
using System.Text;
using EcommerceDemo.Api.Dtos;

namespace EcommerceDemo.Api.Tests;

public sealed class OrderEndpointTests(ApiTestFactory factory) : IClassFixture<ApiTestFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Staff_Can_Create_Order_And_Update_Status()
    {
        await _client.AuthenticateAsync("staff@ecommerce-demo.test");

        var customers = await _client.GetFromJsonAsync<PagedResult<CustomerResponse>>("/api/customers?page=1&pageSize=1");
        var products = await _client.GetFromJsonAsync<PagedResult<ProductResponse>>("/api/products?page=1&pageSize=1");

        var customer = Assert.Single(customers!.Items);
        var product = Assert.Single(products!.Items);

        var createResponse = await _client.PostAsJsonAsync("/api/orders", new CreateOrderRequest(
            customer.Id,
            5m,
            [new OrderItemRequest(product.Id, 2)]));

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var created = await createResponse.Content.ReadFromJsonAsync<OrderResponse>();

        Assert.NotNull(created);
        Assert.Equal("Submitted", created.Status);
        Assert.Equal(decimal.Round(product.Price * 2, 2), created.Subtotal);
        Assert.Equal(decimal.Round(created.Subtotal * 0.12m, 2), created.Tax);
        Assert.Equal(created.Subtotal + created.Tax - 5m, created.Total);

        var updateResponse = await _client.PatchAsJsonAsync($"/api/orders/{created.Id}/status", new UpdateOrderStatusRequest("Completed"));

        Assert.Equal(HttpStatusCode.NoContent, updateResponse.StatusCode);

        var refreshed = await _client.GetFromJsonAsync<OrderResponse>($"/api/orders/{created.Id}");

        Assert.NotNull(refreshed);
        Assert.Equal("Completed", refreshed.Status);
    }

    [Fact]
    public async Task Updating_Order_To_Invalid_Status_Returns_BadRequest()
    {
        await _client.AuthenticateAsync();

        var orders = await _client.GetFromJsonAsync<PagedResult<OrderResponse>>("/api/orders?page=1&pageSize=1");
        var order = Assert.Single(orders!.Items);

        var response = await _client.PatchAsJsonAsync($"/api/orders/{order.Id}/status", new UpdateOrderStatusRequest("Archived"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Order_Create_Rejects_Hidden_Payment_Fields()
    {
        await _client.AuthenticateAsync("staff@ecommerce-demo.test");

        var customers = await _client.GetFromJsonAsync<PagedResult<CustomerResponse>>("/api/customers?page=1&pageSize=1");
        var products = await _client.GetFromJsonAsync<PagedResult<ProductResponse>>("/api/products?page=1&pageSize=1");

        var customer = Assert.Single(customers!.Items);
        var product = Assert.Single(products!.Items);

        var response = await _client.PostAsJsonAsync("/api/orders", new
        {
            customerId = customer.Id,
            discount = 0m,
            items = new[] { new { productId = product.Id, quantity = 1 } },
            paymentReferenceId = "pi_hidden_reference"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Staff_Can_Download_Razor_Generated_Order_Invoice_Pdf()
    {
        await _client.AuthenticateAsync("staff@ecommerce-demo.test");
        var orders = await _client.GetFromJsonAsync<PagedResult<OrderResponse>>("/api/orders?page=1&pageSize=1");
        var order = Assert.Single(orders!.Items);

        var response = await _client.GetAsync($"/api/orders/{order.Id}/invoice");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("application/pdf", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal($"commerce-platform-invoice-{order.OrderNumber}.pdf", response.Content.Headers.ContentDisposition?.FileNameStar);
        var pdf = await response.Content.ReadAsByteArrayAsync();
        Assert.StartsWith("%PDF-", Encoding.ASCII.GetString(pdf));
        Assert.Contains("Razor invoice rendered", Encoding.ASCII.GetString(pdf));
    }
}
