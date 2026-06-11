namespace EcommerceDemo.Api.Services;

public sealed class HubSpotOptions
{
    public bool Enabled { get; set; }
    public string AccessToken { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = "https://api.hubapi.com";
    public string ObjectType { get; set; } = "deals";
    public string Pipeline { get; set; } = string.Empty;
    public string DealStage { get; set; } = string.Empty;
    public Dictionary<string, string> StatusDealStages { get; set; } = new(StringComparer.OrdinalIgnoreCase);
}
