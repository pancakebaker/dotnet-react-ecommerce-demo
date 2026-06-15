using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using EcommerceDemo.Api.Data;
using EcommerceDemo.Api.Endpoints;
using EcommerceDemo.Api.Services;
using EcommerceDemo.Api.Services.Permissions;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.Configure<StripeOptions>(builder.Configuration.GetSection("Stripe"));
builder.Services.Configure<HubSpotOptions>(builder.Configuration.GetSection("HubSpot"));
var jwtOptions = builder.Configuration.GetSection("Jwt").Get<JwtOptions>() ?? new JwtOptions();
if (builder.Environment.IsProduction() &&
    (jwtOptions.Secret.Contains("dev-only", StringComparison.OrdinalIgnoreCase) || jwtOptions.Secret.Length < 32))
{
    throw new InvalidOperationException("Production deployments must configure a strong Jwt__Secret outside source control.");
}

if (builder.Environment.IsProduction() && builder.Configuration["Database:Provider"]?.Equals("InMemory", StringComparison.OrdinalIgnoreCase) == true)
{
    throw new InvalidOperationException("Production deployments must use a persistent database provider.");
}

builder.Services.AddDbContext<AppDbContext>(options =>
{
    var provider = builder.Configuration["Database:Provider"] ?? "InMemory";
    if (provider.Equals("SqlServer", StringComparison.OrdinalIgnoreCase))
    {
        options.UseSqlServer(builder.Configuration.GetConnectionString("SqlServer"));
    }
    else if (provider.Equals("Postgres", StringComparison.OrdinalIgnoreCase))
    {
        options.UseNpgsql(builder.Configuration.GetConnectionString("Postgres"));
    }
    else
    {
        options.UseInMemoryDatabase(builder.Configuration["Database:Name"] ?? "EcommerceDemo");
    }
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("ClientApp", policy =>
    {
        var allowedOrigins = builder.Configuration
            .GetSection("Cors:AllowedOrigins")
            .Get<string[]>() ?? [
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:5174",
                "http://127.0.0.1:5174",
                "http://localhost:4173",
                "http://127.0.0.1:4173",
                "https://localhost:5173"
            ];

        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddScoped<IPasswordHasher, Pbkdf2PasswordHasher>();
builder.Services.AddSingleton<IPermissionService, PermissionService>();
builder.Services.AddMemoryCache();
builder.Services.AddScoped<JwtTokenService>();
builder.Services.AddScoped<OrderNumberService>();
builder.Services.AddSingleton<OrderItemFactory>();
builder.Services.AddSingleton<OrderMapper>();
builder.Services.AddSingleton<OrderPricingService>();
builder.Services.AddScoped<StorefrontCheckoutService>();
if (builder.Environment.IsEnvironment("Testing"))
{
    builder.Services.AddSingleton<IPaymentProvider, TestingPaymentProvider>();
    builder.Services.AddSingleton<IHubSpotOrderSyncService, TestingHubSpotOrderSyncService>();
}
else
{
    builder.Services.AddScoped<IPaymentProvider, StripePaymentService>();
    builder.Services.AddHttpClient<IHubSpotOrderSyncService, HubSpotOrderSyncService>();
}
builder.Services.AddScoped<ICheckoutPaymentMethod, CardCheckoutPaymentMethod>();
builder.Services.AddSingleton<ICheckoutPaymentMethod, CashOnDeliveryPaymentMethod>();
builder.Services.AddScoped<ICheckoutPaymentMethodRegistry, CheckoutPaymentMethodRegistry>();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Secret))
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    options.AddPolicy("StaffOrAdmin", policy => policy.RequireRole("Admin", "Staff"));
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "Ecommerce Demo API", Version = "v1" });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

app.Use(async (context, next) =>
{
    var headers = context.Response.Headers;
    headers.TryAdd("X-Content-Type-Options", "nosniff");
    headers.TryAdd("X-Frame-Options", "DENY");
    headers.TryAdd("Referrer-Policy", "no-referrer");
    headers.TryAdd("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

    if (!app.Environment.IsDevelopment())
    {
        headers.TryAdd("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
    }

    await next();
});

if (!app.Environment.IsDevelopment() && !app.Environment.IsEnvironment("Testing"))
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("ClientApp");
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => Results.Redirect("/swagger")).ExcludeFromDescription();
app.MapGet("/health", () => Results.Ok(new { status = "ok", service = "EcommerceDemo.Api" }))
    .WithTags("Health")
    .AllowAnonymous();
app.MapAuthEndpoints();
app.MapProfileEndpoints();
app.MapStorefrontEndpoints();
app.MapDashboardEndpoints();
app.MapCustomerEndpoints();
app.MapProductEndpoints();
app.MapOrderEndpoints();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
    await DemoDataSeeder.SeedAsync(db, passwordHasher);
}

app.Run();

public partial class Program;

public static class CurrentUser
{
    public static Guid Id(ClaimsPrincipal principal)
    {
        var value = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(value, out var id) ? id : Guid.Empty;
    }
}
