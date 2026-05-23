namespace EcommerceDemo.Api.Services;

public sealed class JwtOptions
{
    public string Issuer { get; set; } = "EcommerceDemo";
    public string Audience { get; set; } = "EcommerceDemo.Client";
    public string Secret { get; set; } = "dev-only-change-this-secret-before-production-use";
    public int ExpiresMinutes { get; set; } = 120;
}
