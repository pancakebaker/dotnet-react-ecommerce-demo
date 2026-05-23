namespace EcommerceDemo.Api.Endpoints;

public static class EndpointExtensions
{
    public static TBuilder RequireAdmin<TBuilder>(this TBuilder builder)
        where TBuilder : IEndpointConventionBuilder
    {
        builder.RequireAuthorization("AdminOnly");
        return builder;
    }
}
