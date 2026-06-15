using System.Security.Claims;
using System.Text.Json;

namespace EcommerceDemo.Api.Services.Permissions;

public interface IPermissionService
{
    string RoleFor(ClaimsPrincipal principal);
    bool CanAccess(string role, string resource, string action);
    bool CanViewField(string role, string resource, string field);
    bool CanEditField(string role, string resource, string field);
    IReadOnlyDictionary<string, string[]> ValidateEditableFields(string role, string resource, IEnumerable<string> submittedFields);
    IReadOnlyDictionary<string, object?> FilterReadableFields(string role, string resource, object response);
}

public sealed class PermissionService : IPermissionService
{
    private const string AnonymousRole = "Anonymous";
    private readonly PermissionConfig _config;

    public PermissionService(IWebHostEnvironment environment)
    {
        _config = LoadConfig(environment);
    }

    public string RoleFor(ClaimsPrincipal principal)
    {
        return principal.FindFirstValue(ClaimTypes.Role) ?? AnonymousRole;
    }

    public bool CanAccess(string role, string resource, string action)
    {
        return _config.Resources.TryGetValue(resource, out var permission) &&
            permission.Actions.TryGetValue(action, out var roles) &&
            HasRole(roles, role);
    }

    public bool CanViewField(string role, string resource, string field)
    {
        return HasFieldRole(role, resource, field, fieldPermission => fieldPermission.View);
    }

    public bool CanEditField(string role, string resource, string field)
    {
        return HasFieldRole(role, resource, field, fieldPermission => fieldPermission.Edit);
    }

    public IReadOnlyDictionary<string, string[]> ValidateEditableFields(string role, string resource, IEnumerable<string> submittedFields)
    {
        var errors = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase);

        foreach (var field in submittedFields)
        {
            if (!CanEditField(role, resource, field))
            {
                errors[field] = [$"The '{field}' field cannot be submitted for {resource} by {role}."];
            }
        }

        return errors;
    }

    public IReadOnlyDictionary<string, object?> FilterReadableFields(string role, string resource, object response)
    {
        var readable = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);

        foreach (var property in response.GetType().GetProperties())
        {
            var field = JsonNamingPolicy.CamelCase.ConvertName(property.Name);
            if (CanViewField(role, resource, field))
            {
                readable[field] = property.GetValue(response);
            }
        }

        return readable;
    }

    private bool HasFieldRole(string role, string resource, string field, Func<FieldPermission, IReadOnlyList<string>> selectRoles)
    {
        return _config.Resources.TryGetValue(resource, out var permission) &&
            permission.Fields.TryGetValue(field, out var fieldPermission) &&
            HasRole(selectRoles(fieldPermission), role);
    }

    private static bool HasRole(IReadOnlyList<string> roles, string role)
    {
        return roles.Any(allowed => allowed.Equals(role, StringComparison.OrdinalIgnoreCase));
    }

    private static PermissionConfig LoadConfig(IWebHostEnvironment environment)
    {
        var outputPath = Path.Combine(AppContext.BaseDirectory, "permissions.config.json");
        var sourcePath = Path.GetFullPath(Path.Combine(environment.ContentRootPath, "..", "..", "shared", "permissions.config.json"));
        var configPath = File.Exists(outputPath) ? outputPath : sourcePath;

        if (!File.Exists(configPath))
        {
            throw new FileNotFoundException("The shared permission configuration was not found.", configPath);
        }

        var json = File.ReadAllText(configPath);
        return JsonSerializer.Deserialize<PermissionConfig>(json, new JsonSerializerOptions(JsonSerializerDefaults.Web))
            ?? throw new InvalidOperationException("The shared permission configuration is empty or invalid.");
    }
}

public sealed record PermissionConfig(
    IReadOnlyList<string> Roles,
    IReadOnlyDictionary<string, ResourcePermission> Resources);

public sealed record ResourcePermission(
    IReadOnlyDictionary<string, IReadOnlyList<string>> Actions,
    IReadOnlyDictionary<string, FieldPermission> Fields);

public sealed record FieldPermission(
    IReadOnlyList<string> View,
    IReadOnlyList<string> Edit);
