using System.Net;
using System.Net.Http.Json;
using EcommerceDemo.Api.Dtos;

namespace EcommerceDemo.Api.Tests;

public sealed class AuthTests(ApiTestFactory factory) : IClassFixture<ApiTestFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Login_Returns_Jwt_For_Seeded_Admin()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest(
            "admin@ecommerce-demo.test",
            "Password123!"));

        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<AuthResponse>();

        Assert.NotNull(body);
        Assert.False(string.IsNullOrWhiteSpace(body.Token));
        Assert.Equal("Admin", body.User.Role);
    }

    [Fact]
    public async Task Register_Requires_Authentication()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(
            "Ava",
            "Morgan",
            $"new-user-{Guid.NewGuid():N}@example.test",
            "Apply123!",
            " staff "));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Admin_Can_Register_Staff_User()
    {
        await _client.AuthenticateAsync();

        var email = $"new-user-{Guid.NewGuid():N}@example.test";
        var response = await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(
            "Ava",
            "Morgan",
            email,
            "Apply123!",
            " staff "));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<AuthResponse>();

        Assert.NotNull(body);
        Assert.False(string.IsNullOrWhiteSpace(body.Token));
        Assert.Equal(email, body.User.Email);
        Assert.Equal("Staff", body.User.Role);
    }

    [Fact]
    public async Task Register_Rejects_Weak_Password_Invalid_Role_And_Incomplete_Email_Domain()
    {
        await _client.AuthenticateAsync();

        var response = await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(
            "Ava",
            "Morgan",
            "ava@example",
            "password",
            "Owner"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();

        Assert.Contains("Email must include a valid domain.", body);
        Assert.Contains("Password must contain at least one uppercase letter.", body);
        Assert.Contains("Password must contain at least one number.", body);
        Assert.Contains("Role is invalid.", body);
    }

    [Fact]
    public async Task Register_Rejects_Public_Admin_Role()
    {
        await _client.AuthenticateAsync();

        var response = await _client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(
            "Ava",
            "Morgan",
            $"admin-request-{Guid.NewGuid():N}@example.test",
            "Apply123!",
            "Admin"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();

        Assert.Contains("Admin users must be created from an authorized admin workflow.", body);
    }

    [Fact]
    public async Task Profile_Requires_Authentication()
    {
        var response = await _client.GetAsync("/api/profile");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Health_Response_Includes_Security_Headers()
    {
        var response = await _client.GetAsync("/health");

        response.EnsureSuccessStatusCode();
        Assert.True(response.Headers.Contains("X-Content-Type-Options"));
        Assert.True(response.Headers.Contains("X-Frame-Options"));
        Assert.True(response.Headers.Contains("Referrer-Policy"));
    }
}
