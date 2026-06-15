using Microsoft.EntityFrameworkCore;
using EcommerceDemo.Api.Data;
using EcommerceDemo.Api.Domain;
using EcommerceDemo.Api.Dtos;

namespace EcommerceDemo.Api.Endpoints;

public static class DashboardEndpoints
{
    public static IEndpointRouteBuilder MapDashboardEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/dashboard")
            .RequireAuthorization("StaffOrAdmin")
            .WithTags("Dashboard");

        group.MapGet("/summary", async (AppDbContext db) =>
        {
            var monthStart = new DateTimeOffset(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, TimeSpan.Zero);
            var totalCustomers = await db.Customers.CountAsync();
            var totalOrders = await db.Orders.CountAsync();
            var pendingOrders = await db.Orders.CountAsync(order => order.Status != OrderStatuses.Completed && order.Status != OrderStatuses.Cancelled);
            var completedOrders = await db.Orders.CountAsync(order => order.Status == OrderStatuses.Completed);
            var monthlyRevenue = await db.Orders
                .Where(order => order.CreatedAt >= monthStart && order.Status != OrderStatuses.Cancelled)
                .SumAsync(order => order.Total);
            var recentActivity = await db.ActivityLogs
                .OrderByDescending(log => log.CreatedAt)
                .Take(8)
                .Select(log => new ActivityResponse(log.EntityType, log.EntityId, log.Action, log.Description, log.CreatedAt))
                .ToListAsync();

            return Results.Ok(new DashboardSummaryResponse(
                totalCustomers,
                totalOrders,
                pendingOrders,
                completedOrders,
                monthlyRevenue,
                recentActivity));
        }).RequirePermission("dashboard", "view");

        return app;
    }
}
