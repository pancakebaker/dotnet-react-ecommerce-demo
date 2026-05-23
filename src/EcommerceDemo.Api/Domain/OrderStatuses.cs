namespace EcommerceDemo.Api.Domain;

public static class OrderStatuses
{
    public const string Draft = "Draft";
    public const string Submitted = "Submitted";
    public const string Processing = "Processing";
    public const string Completed = "Completed";
    public const string Cancelled = "Cancelled";

    public static readonly string[] All = [Draft, Submitted, Processing, Completed, Cancelled];
}
