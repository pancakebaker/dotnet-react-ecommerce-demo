# Performance Notes

## Storefront Catalog Cache

The anonymous storefront product catalog caches the default active product list in `IMemoryCache` for five minutes.

- Search requests are not cached, so shoppers always query the latest filtered data.
- Product create, update, and delete endpoints remove the active catalog cache key after successful writes.
- The cache is process-local and intentionally lightweight for the current single-instance configuration. Multi-instance deployments would need a shared cache or cache-busting strategy.

## Query Shape

- Read-only list/detail queries use `AsNoTracking()` where entities are not updated.
- Order queries that include customer and item collections use split queries to avoid large joined result sets as order item counts grow.
- Admin list endpoints keep bounded page sizes so large tables are not returned in one response.

## Indexes

The EF Core model declares indexes for common lookup, filter, and sort fields such as product SKU/name/activity, customer email/name, order status/date/customer/payment reference, order item relationships, and activity log entity/user/date fields.

This project does not currently include EF Core migrations, so no migration was added with these model changes.
