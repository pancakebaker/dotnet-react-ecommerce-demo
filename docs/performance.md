# Performance Characteristics

## Server-Side Pagination

Customer, product, and order list endpoints paginate on the server. Page values are normalized to at least `1`, and page sizes default to `10` and are bounded to `50`.

This prevents administrative list endpoints from returning an unbounded result set. The current frontend requests fixed page sizes and does not yet expose complete pagination controls for every list.

## Query Efficiency

- Read-only queries use `AsNoTracking()` where entities are not modified.
- Order queries that include customers and item collections use `AsSplitQuery()` to avoid large joined result sets.
- Search and list queries apply filtering before `Skip` and `Take`.
- The EF Core model declares indexes for product SKU/name/activity, customer email/name, order status/date/customer/payment reference, order item relationships, and activity-log lookups.

Database-provider query plans should be reviewed with production-scale data. The repository does not currently include benchmark datasets or query-performance gates.

## DTO Shaping

List endpoints project database entities into explicit response DTOs. This reduces accidental data exposure and avoids serializing full tracked entity graphs.

Some order queries load entities before mapping because the response contains customer and item data. Additional projection optimization can be considered if profiling shows material allocation or query cost.

## Storefront Caching

The default active-product catalog is cached in `IMemoryCache` for five minutes.

- Search requests bypass the cache.
- Product create, update, and delete operations invalidate the cache.
- Cache state is process-local.

Multi-instance deployments require a distributed cache or coordinated invalidation strategy.

## Frontend Builds

The production build runs TypeScript validation followed by Vite bundling. Feature views are lazy-loaded from the application shell, reducing initial back-office code loading.

## Static Assets

- Product and hero images include WebP and responsive-size variants.
- Vite fingerprints built JavaScript and CSS assets for long-lived caching.
- The nginx container serves the compiled static application.

Image budgets, CDN delivery, compression policy, and cache headers should be validated in the target hosting environment.

## Roadmap

- Add realistic load and database datasets.
- Capture API latency percentiles and slow-query telemetry.
- Add frontend bundle-size budgets.
- Add CDN and immutable-cache policy for static assets.
- Add distributed caching for multiple API instances.
- Move retriable external synchronization off request paths.
- Add database migration and index review against target providers.
- Add performance regression checks for high-volume endpoints.
