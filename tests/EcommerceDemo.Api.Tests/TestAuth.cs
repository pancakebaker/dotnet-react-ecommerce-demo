using System.Net.Http.Headers;
using System.Net.Http.Json;
using EcommerceDemo.Api.Dtos;

namespace EcommerceDemo.Api.Tests;

internal static class TestAuth
{
    public static async Task AuthenticateAsync(this HttpClient client, string email = "admin@ecommerce-demo.test", string password = "Password123!")
    {
        var login = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(email, password));
        login.EnsureSuccessStatusCode();
        var auth = await login.Content.ReadFromJsonAsync<AuthResponse>();

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);
    }
}
