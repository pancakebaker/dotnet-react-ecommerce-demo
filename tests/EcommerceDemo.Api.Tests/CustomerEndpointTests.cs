using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using EcommerceDemo.Api.Dtos;

namespace EcommerceDemo.Api.Tests;

public sealed class CustomerEndpointTests(ApiTestFactory factory) : IClassFixture<ApiTestFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Staff_Can_Create_And_Search_Customers()
    {
        await AuthenticateAsync("staff@ecommerce-demo.test", "Password123!");

        var createResponse = await _client.PostAsJsonAsync("/api/customers", new UpsertCustomerRequest(
            "Luna Office Supply",
            "Luna Co",
            "hello@luna.test",
            "+1 555-0199",
            "9 Paper Trail"));

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        var searchResponse = await _client.GetFromJsonAsync<PagedResult<CustomerResponse>>("/api/customers?search=luna&page=1&pageSize=5");

        Assert.NotNull(searchResponse);
        Assert.Contains(searchResponse.Items, customer => customer.Email == "hello@luna.test");
    }

    [Fact]
    public async Task Staff_Cannot_Delete_Customers()
    {
        await AuthenticateAsync("staff@ecommerce-demo.test", "Password123!");

        var response = await _client.DeleteAsync($"/api/customers/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Customer_Create_Rejects_Script_Like_Input()
    {
        await AuthenticateAsync("staff@ecommerce-demo.test", "Password123!");

        var response = await _client.PostAsJsonAsync("/api/customers", new UpsertCustomerRequest(
            "<script>alert(1)</script>",
            "Unsafe Co",
            "unsafe@example.test",
            "+1 555-0199",
            "1 Main Street"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private async Task AuthenticateAsync(string email, string password)
    {
        var login = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest(email, password));
        login.EnsureSuccessStatusCode();
        var auth = await login.Content.ReadFromJsonAsync<AuthResponse>();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);
    }
}
