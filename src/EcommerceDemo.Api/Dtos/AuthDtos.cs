namespace EcommerceDemo.Api.Dtos;

public sealed record RegisterRequest(string FirstName, string LastName, string Email, string Password, string Role);
public sealed record LoginRequest(string Email, string Password);
public sealed record AuthResponse(string Token, UserResponse User);
public sealed record UserResponse(Guid Id, string FirstName, string LastName, string Email, string Role);
public sealed record UpdateProfileRequest(string FirstName, string LastName);
