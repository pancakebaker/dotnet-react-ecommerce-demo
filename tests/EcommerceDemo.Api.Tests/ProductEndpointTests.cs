using System.Net;
using System.Net.Http.Json;
using EcommerceDemo.Api.Dtos;

namespace EcommerceDemo.Api.Tests;

public sealed class ProductEndpointTests(ApiTestFactory factory) : IClassFixture<ApiTestFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Products_Require_Authentication()
    {
        var response = await _client.GetAsync("/api/products?page=1&pageSize=5");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Admin_Can_Create_And_Search_Product_By_Sku()
    {
        await _client.AuthenticateAsync();

        var createResponse = await _client.PostAsJsonAsync("/api/products", new UpsertProductRequest(
            "Warehouse Tablet Stand",
            "tab-900",
            "Adjustable stand for packing stations",
            79.95m,
            18,
            true));

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var created = await createResponse.Content.ReadFromJsonAsync<ProductResponse>();

        Assert.NotNull(created);
        Assert.Equal("TAB-900", created.Sku);

        var searchResponse = await _client.GetFromJsonAsync<PagedResult<ProductResponse>>("/api/products?search=tab-900&page=1&pageSize=5");

        Assert.NotNull(searchResponse);
        Assert.Contains(searchResponse.Items, product => product.Sku == "TAB-900");
    }

    [Fact]
    public async Task Staff_Cannot_Create_Product()
    {
        await _client.AuthenticateAsync("staff@ecommerce-demo.test");

        var response = await _client.PostAsJsonAsync("/api/products", new UpsertProductRequest(
            "Restricted Product",
            "RST-001",
            null,
            10m,
            1,
            true));

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Product_Create_Rejects_Invalid_Sku_And_Markup()
    {
        await _client.AuthenticateAsync();

        var response = await _client.PostAsJsonAsync("/api/products", new UpsertProductRequest(
            "Unsafe <b>Product</b>",
            "BAD SKU!",
            "Markup should not be stored.",
            10m,
            1,
            true));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
