using System.Globalization;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using EcommerceDemo.Api.Domain;

namespace EcommerceDemo.Api.Services;

public interface IHubSpotOrderSyncService
{
    Task<string?> CreateOrderAsync(Order order, CancellationToken cancellationToken);
    Task UpdateOrderAsync(Order order, CancellationToken cancellationToken);
}

public sealed class HubSpotOrderSyncService(
    HttpClient httpClient,
    IOptions<HubSpotOptions> options,
    ILogger<HubSpotOrderSyncService> logger) : IHubSpotOrderSyncService
{
    private readonly HubSpotOptions _options = options.Value;

    public async Task<string?> CreateOrderAsync(Order order, CancellationToken cancellationToken)
    {
        if (!IsConfigured)
        {
            return null;
        }

        try
        {
            using var request = CreateRequest(
                HttpMethod.Post,
                $"crm/v3/objects/{Uri.EscapeDataString(ObjectType)}",
                new HubSpotObjectRequest(BuildProperties(order)));

            using var response = await httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                await LogHubSpotFailure(response, "create", order.OrderNumber, cancellationToken);
                return null;
            }

            var body = await response.Content.ReadFromJsonAsync<HubSpotObjectResponse>(cancellationToken);
            return body?.Id;
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or InvalidOperationException or JsonException or UriFormatException)
        {
            logger.LogWarning(ex, "HubSpot order sync failed while creating order {OrderNumber}.", order.OrderNumber);
            return null;
        }
    }

    public async Task UpdateOrderAsync(Order order, CancellationToken cancellationToken)
    {
        if (!IsConfigured || string.IsNullOrWhiteSpace(order.HubSpotObjectId))
        {
            return;
        }

        try
        {
            using var request = CreateRequest(
                HttpMethod.Patch,
                $"crm/v3/objects/{Uri.EscapeDataString(ObjectType)}/{Uri.EscapeDataString(order.HubSpotObjectId)}",
                new HubSpotObjectRequest(BuildProperties(order)));

            using var response = await httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                await LogHubSpotFailure(response, "update", order.OrderNumber, cancellationToken);
            }
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or InvalidOperationException or JsonException or UriFormatException)
        {
            logger.LogWarning(ex, "HubSpot order sync failed while updating order {OrderNumber}.", order.OrderNumber);
        }
    }

    private bool IsConfigured =>
        _options.Enabled &&
        !string.IsNullOrWhiteSpace(_options.AccessToken) &&
        !string.IsNullOrWhiteSpace(_options.ObjectType);

    private string ObjectType => string.IsNullOrWhiteSpace(_options.ObjectType) ? "deals" : _options.ObjectType.Trim();

    private HttpRequestMessage CreateRequest(HttpMethod method, string path, HubSpotObjectRequest payload)
    {
        var request = new HttpRequestMessage(method, new Uri(new Uri(BaseUrl), path))
        {
            Content = JsonContent.Create(payload)
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.AccessToken.Trim());
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        return request;
    }

    private string BaseUrl
    {
        get
        {
            var baseUrl = string.IsNullOrWhiteSpace(_options.BaseUrl) ? "https://api.hubapi.com" : _options.BaseUrl.Trim();
            return baseUrl.EndsWith("/", StringComparison.Ordinal) ? baseUrl : $"{baseUrl}/";
        }
    }

    private Dictionary<string, string> BuildProperties(Order order)
    {
        var properties = new Dictionary<string, string>
        {
            ["dealname"] = $"{order.OrderNumber} - {order.Customer?.Name ?? "Customer"}",
            ["amount"] = order.Total.ToString("0.00", CultureInfo.InvariantCulture)
        };

        if (!string.IsNullOrWhiteSpace(_options.Pipeline))
        {
            properties["pipeline"] = _options.Pipeline.Trim();
        }

        var dealStage = ResolveDealStage(order.Status);
        if (!string.IsNullOrWhiteSpace(dealStage))
        {
            properties["dealstage"] = dealStage;
        }

        return properties;
    }

    private string? ResolveDealStage(string status)
    {
        if (_options.StatusDealStages.TryGetValue(status, out var mappedStage) && !string.IsNullOrWhiteSpace(mappedStage))
        {
            return mappedStage.Trim();
        }

        return string.IsNullOrWhiteSpace(_options.DealStage) ? null : _options.DealStage.Trim();
    }

    private async Task LogHubSpotFailure(
        HttpResponseMessage response,
        string action,
        string orderNumber,
        CancellationToken cancellationToken)
    {
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
        logger.LogWarning(
            "HubSpot order sync could not {Action} order {OrderNumber}. Status: {StatusCode}. Response: {ResponseBody}",
            action,
            orderNumber,
            (int)response.StatusCode,
            responseBody.Length > 500 ? responseBody[..500] : responseBody);
    }

    private sealed record HubSpotObjectRequest(
        [property: JsonPropertyName("properties")] IReadOnlyDictionary<string, string> Properties);

    private sealed record HubSpotObjectResponse(
        [property: JsonPropertyName("id")] string? Id);
}

public sealed class TestingHubSpotOrderSyncService : IHubSpotOrderSyncService
{
    public Task<string?> CreateOrderAsync(Order order, CancellationToken cancellationToken)
    {
        return Task.FromResult<string?>(null);
    }

    public Task UpdateOrderAsync(Order order, CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }
}
