namespace EcommerceDemo.Api.Services;

public sealed class StripeOptions
{
    public string SecretKey { get; set; } = string.Empty;
    public string Currency { get; set; } = "usd";
}
