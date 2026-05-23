using Microsoft.EntityFrameworkCore;
using EcommerceDemo.Api.Data;
using EcommerceDemo.Api.Domain;
using EcommerceDemo.Api.Dtos;
using EcommerceDemo.Api.Validation;

namespace EcommerceDemo.Api.Endpoints;

public static class CustomerEndpoints
{
    public static IEndpointRouteBuilder MapCustomerEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/customers")
            .RequireAuthorization("StaffOrAdmin")
            .WithTags("Customers");

        group.MapGet("/", async (string? search, int page, int pageSize, AppDbContext db) =>
        {
            page = Math.Max(page, 1);
            pageSize = Math.Clamp(pageSize == 0 ? 10 : pageSize, 1, 50);
            var query = db.Customers.AsNoTracking();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLowerInvariant();
                query = query.Where(customer =>
                    customer.Name.ToLower().Contains(term) ||
                    customer.Email.ToLower().Contains(term) ||
                    (customer.CompanyName != null && customer.CompanyName.ToLower().Contains(term)));
            }

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderBy(customer => customer.Name)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(customer => ToResponse(customer))
                .ToListAsync();

            return Results.Ok(new PagedResult<CustomerResponse>(items, page, pageSize, totalCount));
        });

        group.MapGet("/{id:guid}", async (Guid id, AppDbContext db) =>
        {
            var customer = await db.Customers.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id);
            return customer is null ? Results.NotFound() : Results.Ok(ToResponse(customer));
        });

        group.MapPost("/", async (UpsertCustomerRequest request, AppDbContext db, HttpContext httpContext) =>
        {
            if (!InputValidation.TryCustomer(request.Name, request.CompanyName, request.Email, request.Phone, request.Address, out var input, out var errors))
            {
                return Results.ValidationProblem(errors);
            }

            var customer = new Customer
            {
                Name = input.Name,
                CompanyName = input.CompanyName,
                Email = input.Email,
                Phone = input.Phone,
                Address = input.Address
            };

            db.Customers.Add(customer);
            AddLog(db, "Customer", customer.Id, "Created", $"Customer {customer.Name} was created.", CurrentUser.Id(httpContext.User));
            await db.SaveChangesAsync();

            return Results.Created($"/api/customers/{customer.Id}", ToResponse(customer));
        });

        group.MapPut("/{id:guid}", async (Guid id, UpsertCustomerRequest request, AppDbContext db, HttpContext httpContext) =>
        {
            if (!InputValidation.TryCustomer(request.Name, request.CompanyName, request.Email, request.Phone, request.Address, out var input, out var errors))
            {
                return Results.ValidationProblem(errors);
            }

            var customer = await db.Customers.FindAsync(id);
            if (customer is null)
            {
                return Results.NotFound();
            }

            customer.Name = input.Name;
            customer.CompanyName = input.CompanyName;
            customer.Email = input.Email;
            customer.Phone = input.Phone;
            customer.Address = input.Address;
            customer.UpdatedAt = DateTimeOffset.UtcNow;
            AddLog(db, "Customer", customer.Id, "Updated", $"Customer {customer.Name} was updated.", CurrentUser.Id(httpContext.User));
            await db.SaveChangesAsync();

            return Results.Ok(ToResponse(customer));
        });

        group.MapDelete("/{id:guid}", async (Guid id, AppDbContext db, HttpContext httpContext) =>
        {
            var customer = await db.Customers.FindAsync(id);
            if (customer is null)
            {
                return Results.NotFound();
            }

            db.Customers.Remove(customer);
            AddLog(db, "Customer", customer.Id, "Deleted", $"Customer {customer.Name} was deleted.", CurrentUser.Id(httpContext.User));
            await db.SaveChangesAsync();

            return Results.NoContent();
        }).RequireAdmin();

        return app;
    }

    private static CustomerResponse ToResponse(Customer customer)
    {
        return new CustomerResponse(customer.Id, customer.Name, customer.CompanyName, customer.Email, customer.Phone, customer.Address, customer.CreatedAt);
    }

    private static void AddLog(AppDbContext db, string entityType, Guid entityId, string action, string description, Guid userId)
    {
        db.ActivityLogs.Add(new ActivityLog
        {
            EntityType = entityType,
            EntityId = entityId,
            Action = action,
            Description = description,
            UserId = userId
        });
    }
}
