using Microsoft.EntityFrameworkCore;
using EcommerceDemo.Api.Data;
using EcommerceDemo.Api.Dtos;
using EcommerceDemo.Api.Services.Permissions;
using EcommerceDemo.Api.Validation;

namespace EcommerceDemo.Api.Endpoints;

public static class ProfileEndpoints
{
    public static IEndpointRouteBuilder MapProfileEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/profile")
            .RequireAuthorization("StaffOrAdmin")
            .WithTags("Profile");

        group.MapGet("/", async (AppDbContext db, HttpContext httpContext) =>
        {
            var id = CurrentUser.Id(httpContext.User);
            var user = await db.Users.FindAsync(id);
            return user is null
                ? Results.NotFound()
                : Results.Ok(new UserResponse(user.Id, user.FirstName, user.LastName, user.Email, user.Role));
        }).RequirePermission("profile", "view");

        group.MapPut("/", async (HttpContext httpContext, AppDbContext db, IPermissionService permissions, CancellationToken cancellationToken) =>
        {
            var payload = await PermissionPayloadReader.ReadAsync<UpdateProfileRequest>(httpContext, permissions, "profile", cancellationToken);
            if (!payload.IsValid)
            {
                return payload.Error!;
            }

            var request = payload.Value!;
            if (!InputValidation.TryProfile(request.FirstName, request.LastName, out var input, out var errors))
            {
                return Results.ValidationProblem(errors);
            }

            var id = CurrentUser.Id(httpContext.User);
            var user = await db.Users.FindAsync(id);
            if (user is null)
            {
                return Results.NotFound();
            }

            user.FirstName = input.FirstName;
            user.LastName = input.LastName;
            user.UpdatedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync();

            return Results.Ok(new UserResponse(user.Id, user.FirstName, user.LastName, user.Email, user.Role));
        }).RequirePermission("profile", "update");

        return app;
    }
}
