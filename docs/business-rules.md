# Business Rules

This document records server-enforced commerce invariants and identifies workflow rules that still require stronger enforcement.

## Catalog

- Only active products are returned by the public storefront endpoint.
- Storefront and back-office order creation reject missing or inactive products.
- Product SKU values are unique.
- Product search and list endpoints apply bounded input and page-size limits.
- Product mutations invalidate the process-local storefront catalog cache.

## Pricing

- The API reloads products and prices from persistence when preparing a payment or creating an order.
- Client-provided totals are not accepted as order totals.
- Subtotal, tax, discount, line totals, and final total are calculated server-side.
- Payment amounts are represented in minor currency units before being sent to a payment provider.
- Back-office discounts must be within the configured numeric range.

## Checkout and Payments

- An order requires between 1 and 50 line items.
- Item quantities must be between 1 and 1,000.
- Card checkout requires a PaymentIntent reference.
- Card orders are created only when Stripe reports `succeeded` and the provider amount and currency match the current server-calculated cart.
- Payment preparation uses an idempotency key supplied by the client or derived from the customer, cart, amount, and payment method.
- Cash on delivery does not require provider confirmation.
- The API does not accept a legacy `paymentReferenceId` in place of `paymentIntentId`.

## Customers and Identity

- Customer, profile, product, authentication, and search inputs are normalized and validated at the API boundary.
- Passwords are stored as salted PBKDF2-SHA256 hashes.
- Staff/Admin API actions require a valid JWT and the configured resource/action permission.
- Submitted editable fields are checked against the caller's role.
- Frontend permission checks affect presentation only; backend authorization is authoritative.

## Orders

- New storefront and back-office orders begin in `Submitted`.
- Status updates accept only `Draft`, `Submitted`, `Processing`, `Completed`, or `Cancelled`.
- Completing, cancelling, or otherwise updating an order requires the corresponding permission.
- Order creation and status changes add activity-log records.
- HubSpot synchronization is optional and does not determine whether the local order is valid.
- Server invoice PDFs are generated from persisted order/customer/item data and exclude provider payment reference IDs.

> [!NOTE]
> The current API validates the target status and caller permission, but it does not enforce a state-transition matrix. For example, it does not prevent every logically invalid transition based on the current status. A transition policy is listed in [Known Limitations](known-limitations.md).
