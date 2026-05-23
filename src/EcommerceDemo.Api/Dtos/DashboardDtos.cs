namespace EcommerceDemo.Api.Dtos;

public sealed record DashboardSummaryResponse(
    int TotalCustomers,
    int TotalOrders,
    int PendingOrders,
    int CompletedOrders,
    decimal MonthlyRevenue,
    IReadOnlyCollection<ActivityResponse> RecentActivity);

public sealed record ActivityResponse(string EntityType, Guid EntityId, string Action, string Description, DateTimeOffset CreatedAt);
