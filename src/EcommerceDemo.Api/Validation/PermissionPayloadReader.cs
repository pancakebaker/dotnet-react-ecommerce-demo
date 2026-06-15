using System.Text.Json;
using EcommerceDemo.Api.Services.Permissions;

namespace EcommerceDemo.Api.Validation;

public sealed record PermissionPayload<T>(T? Value, IResult? Error)
{
    public bool IsValid => Error is null && Value is not null;
}

public static class PermissionPayloadReader
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static async Task<PermissionPayload<T>> ReadAsync<T>(
        HttpContext httpContext,
        IPermissionService permissions,
        string resource,
        CancellationToken cancellationToken = default)
    {
        JsonDocument document;

        try
        {
            document = await JsonDocument.ParseAsync(httpContext.Request.Body, cancellationToken: cancellationToken);
        }
        catch (JsonException)
        {
            return new PermissionPayload<T>(default, Results.BadRequest(new { message = "Request body must be valid JSON." }));
        }

        using (document)
        {
            if (document.RootElement.ValueKind != JsonValueKind.Object)
            {
                return new PermissionPayload<T>(default, Results.BadRequest(new { message = "Request body must be a JSON object." }));
            }

            var role = permissions.RoleFor(httpContext.User);
            var submittedFields = document.RootElement.EnumerateObject().Select(property => property.Name);
            var fieldErrors = permissions.ValidateEditableFields(role, resource, submittedFields);

            if (fieldErrors.Count > 0)
            {
                return new PermissionPayload<T>(default, Results.ValidationProblem(fieldErrors.ToDictionary()));
            }

            var payload = document.RootElement.Deserialize<T>(JsonOptions);
            return payload is null
                ? new PermissionPayload<T>(default, Results.BadRequest(new { message = "Request body could not be read." }))
                : new PermissionPayload<T>(payload, null);
        }
    }
}
