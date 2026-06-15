namespace EcommerceDemo.Api.Endpoints;

using EcommerceDemo.Api.Services.Permissions;

public static class EndpointExtensions
{
    public static TBuilder RequireAdmin<TBuilder>(this TBuilder builder)
        where TBuilder : IEndpointConventionBuilder
    {
        builder.RequireAuthorization("AdminOnly");
        return builder;
    }

    public static RouteHandlerBuilder RequirePermission(this RouteHandlerBuilder builder, string resource, string action)
    {
        builder.AddEndpointFilter(async (context, next) =>
        {
            var permissions = context.HttpContext.RequestServices.GetRequiredService<IPermissionService>();
            var role = permissions.RoleFor(context.HttpContext.User);

            return permissions.CanAccess(role, resource, action)
                ? await next(context)
                : Results.Forbid();
        });

        return builder;
    }
}
