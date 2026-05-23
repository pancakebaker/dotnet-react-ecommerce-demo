using Microsoft.EntityFrameworkCore;
using EcommerceDemo.Api.Data;
using EcommerceDemo.Api.Domain;
using EcommerceDemo.Api.Dtos;
using EcommerceDemo.Api.Services;
using EcommerceDemo.Api.Validation;

namespace EcommerceDemo.Api.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Authentication");

        group.MapPost("/register", async (
            RegisterRequest request,
            AppDbContext db,
            IPasswordHasher passwordHasher,
            JwtTokenService jwtTokenService) =>
        {
            if (!InputValidation.TryRegister(request.FirstName, request.LastName, request.Email, request.Password, request.Role, out var input, out var errors))
            {
                return Results.ValidationProblem(errors);
            }

            var exists = await db.Users.AnyAsync(user => user.Email == input.Email);
            if (exists)
            {
                return Results.Conflict(new { message = "Email is already registered." });
            }

            var user = new User
            {
                FirstName = input.FirstName,
                LastName = input.LastName,
                Email = input.Email,
                Role = input.Role,
                PasswordHash = passwordHasher.Hash(input.Password)
            };

            db.Users.Add(user);
            await db.SaveChangesAsync();

            return Results.Created($"/api/users/{user.Id}", ToAuthResponse(user, jwtTokenService));
        });

        group.MapPost("/login", async (
            LoginRequest request,
            AppDbContext db,
            IPasswordHasher passwordHasher,
            JwtTokenService jwtTokenService) =>
        {
            if (!InputValidation.TryLogin(request.Email, request.Password, out var input, out var errors))
            {
                return Results.ValidationProblem(errors);
            }

            var user = await db.Users.SingleOrDefaultAsync(x => x.Email == input.Email);
            if (user is null || !passwordHasher.Verify(input.Password, user.PasswordHash))
            {
                return Results.Unauthorized();
            }

            return Results.Ok(ToAuthResponse(user, jwtTokenService));
        });

        return app;
    }

    private static AuthResponse ToAuthResponse(User user, JwtTokenService jwtTokenService)
    {
        return new AuthResponse(
            jwtTokenService.CreateToken(user),
            new UserResponse(user.Id, user.FirstName, user.LastName, user.Email, user.Role));
    }
}
