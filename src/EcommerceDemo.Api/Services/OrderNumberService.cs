using Microsoft.EntityFrameworkCore;
using EcommerceDemo.Api.Data;

namespace EcommerceDemo.Api.Services;

public sealed class OrderNumberService(AppDbContext db)
{
    public async Task<string> NextAsync(CancellationToken cancellationToken)
    {
        var count = await db.Orders.CountAsync(cancellationToken) + 1;
        return $"OF-{DateTime.UtcNow:yyyyMMdd}-{count:0000}";
    }
}
