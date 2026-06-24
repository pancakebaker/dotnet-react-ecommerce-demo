# API Reference

The API uses ASP.NET Core minimal APIs and JSON request/response bodies. Swagger/OpenAPI is available at `/swagger` in the Development environment.

Protected endpoints expect:

```http
Authorization: Bearer <jwt>
Content-Type: application/json
```

`Staff/Admin` below means the caller must have a valid JWT and the required resource/action permission from `shared/permissions.config.json`.

## Health and Authentication

| Method | Endpoint | Purpose | Auth | Request / response summary |
| --- | --- | --- | --- | --- |
| `GET` | `/health` | Service health check | No | Returns service status metadata. |
| `POST` | `/api/auth/login` | Authenticate a staff/admin user | No | Accepts email/password; returns JWT and user profile. |
| `POST` | `/api/auth/register` | Create a staff/admin account | Admin | Accepts name, email, password, and supported role; returns JWT and user profile. |

## Storefront

| Method | Endpoint | Purpose | Auth | Request / response summary |
| --- | --- | --- | --- | --- |
| `GET` | `/api/storefront/products?search=` | Browse active products | No | Returns active product summaries; optional validated search term. |
| `POST` | `/api/storefront/payments/prepare` | Prepare the selected checkout payment method | No | Accepts customer, items, payment method, and optional idempotency key; returns payment preparation data. |
| `POST` | `/api/storefront/payments/create-intent` | Prepare a Stripe card PaymentIntent | No | Card-specific compatibility route; returns client secret, PaymentIntent ID, amount, currency, and status. |
| `POST` | `/api/storefront/orders` | Submit a storefront order | No | Accepts customer, items, payment method, and PaymentIntent ID when required; returns the created order. |

The server reloads active products, applies server prices, recalculates totals, and verifies card payments before persistence.

## Dashboard and Profile

| Method | Endpoint | Purpose | Auth | Request / response summary |
| --- | --- | --- | --- | --- |
| `GET` | `/api/dashboard/summary` | Load operational metrics and recent activity | Staff/Admin | Returns customer/order counts, monthly revenue, and activity. |
| `GET` | `/api/profile` | Load the current user profile | Staff/Admin | Returns name, email, and role for the JWT subject. |
| `PUT` | `/api/profile` | Replace editable profile fields | Staff/Admin | Accepts first and last name; returns the updated profile. |

## Customers

| Method | Endpoint | Purpose | Auth | Request / response summary |
| --- | --- | --- | --- | --- |
| `GET` | `/api/customers?search=&page=&pageSize=` | List and search customers | Staff/Admin | Returns a bounded paged result. |
| `GET` | `/api/customers/{id}` | Load one customer | Staff/Admin | Returns customer details or `404`. |
| `POST` | `/api/customers` | Create a customer | Staff/Admin | Accepts name, company, email, phone, and address; returns created customer. |
| `PUT` | `/api/customers/{id}` | Replace editable customer fields | Staff/Admin | Accepts the complete customer edit payload; returns updated customer. |
| `DELETE` | `/api/customers/{id}` | Delete a customer | Admin | Returns `204` or `404`. |

## Products

| Method | Endpoint | Purpose | Auth | Request / response summary |
| --- | --- | --- | --- | --- |
| `GET` | `/api/products?search=&page=&pageSize=` | List and search all products | Staff/Admin | Returns a bounded paged result. |
| `POST` | `/api/products` | Create a product | Admin | Accepts name, SKU, description, price, stock, and active state. |
| `PUT` | `/api/products/{id}` | Replace editable product fields | Admin | Accepts the complete product edit payload; returns updated product. |
| `DELETE` | `/api/products/{id}` | Delete a product | Admin | Returns `204` or `404`; invalidates storefront catalog cache. |

## Orders

| Method | Endpoint | Purpose | Auth | Request / response summary |
| --- | --- | --- | --- | --- |
| `GET` | `/api/orders?status=&page=&pageSize=` | List and filter orders | Staff/Admin | Returns orders with customer and line-item summaries. |
| `GET` | `/api/orders/{id}` | Load one order | Staff/Admin | Returns the order or `404`. |
| `POST` | `/api/orders` | Create a back-office order | Staff/Admin | Accepts customer ID, discount, and product quantities; prices are loaded server-side. |
| `GET` | `/api/orders/{id}/invoice` | Download an order invoice | Staff/Admin | Requires `orders:view`; returns `application/pdf` with an attachment filename. |
| `PATCH` | `/api/orders/{id}/status` | Update only order status | Staff/Admin | Accepts `{ "status": "..." }`; checks status-specific permission and returns `204`. |

The invoice endpoint loads the persisted order, customer, and line items; renders `Templates/Invoices/Invoice.cshtml`; and converts the resulting HTML to PDF. It returns `404` when the order does not exist, `401` without a valid JWT, and `403` when the caller lacks order-view permission. Payment reference IDs are not included in the document.

## Error Behavior

- Invalid request data returns ASP.NET validation problem details or a clear `400` response.
- Missing resources return `404`.
- Duplicate unique values may return `409`.
- Missing or invalid authentication returns `401`; insufficient permission returns `403`.
- Payment provider failures are translated to controlled `400`, `502`, or `503` responses rather than exposing provider exception details.

The frontend `ApiClient` normalizes these responses into user-facing errors and uses a generic message for unexpected server failures.
