# Architecture and Request Flows

This document is designed for a short technical walkthrough. It describes the code that exists today and calls out deliberate simplifications.

## System Architecture

```mermaid
flowchart TB
  subgraph Browser["Browser"]
    Customer["Public customer"]
    Operator["Staff / Admin"]
    React["React application"]
    Features["Feature views, components, hooks"]
    ApiClient["Typed API client"]
    Customer --> React
    Operator --> React
    React --> Features
    Features --> ApiClient
  end

  subgraph Backend["ASP.NET Core API"]
    Endpoints["Minimal API endpoint modules"]
    Auth["JWT authentication"]
    Permissions["Role, action, and field permissions"]
    Validation["DTO and payload validation"]
    Services["Checkout, pricing, mapping, numbering"]
    Data["EF Core AppDbContext"]
    ApiClient --> Endpoints
    Endpoints --> Auth
    Endpoints --> Permissions
    Endpoints --> Validation
    Endpoints --> Services
    Endpoints --> Data
    Services --> Data
  end

  Data --> Database["PostgreSQL / SQL Server / InMemory"]
  Services --> Stripe["Stripe PaymentIntent API"]
  Services --> HubSpot["Optional HubSpot API"]
```

The API is organized by endpoint modules instead of MVC controllers. Endpoint handlers own routing and HTTP results, while services hold reusable business and integration logic. EF Core's `AppDbContext` is the data-access boundary; a separate repository layer is not currently necessary and would add indirection without removing meaningful complexity.

## Login Flow

```mermaid
sequenceDiagram
  actor User
  participant UI as React login screen
  participant API as POST /api/auth/login
  participant DB as AppDbContext
  participant Hash as PBKDF2 hasher
  participant JWT as JWT token service

  User->>UI: Submit email and password
  UI->>API: LoginRequest
  API->>API: Validate and normalize input
  API->>DB: Find user by normalized email
  DB-->>API: User and password hash
  API->>Hash: Verify password in constant time
  Hash-->>API: Valid
  API->>JWT: Create signed token with identity and role
  JWT-->>API: Bearer token
  API-->>UI: Token and user profile
  UI->>UI: Store session and show permitted navigation
```

The browser includes the token in the `Authorization` header for protected calls. The API remains the authorization authority; hiding navigation in React is only a usability measure.

## Product Browsing and Cart Flow

```mermaid
sequenceDiagram
  actor Customer
  participant UI as Storefront
  participant API as GET /api/storefront/products
  participant Cache as Memory cache
  participant DB as AppDbContext
  participant Cart as useStorefrontCart

  Customer->>UI: Open storefront or search
  UI->>API: Request active products
  API->>Cache: Check default catalog cache
  alt Cached unfiltered catalog
    Cache-->>API: Active products
  else Search or cache miss
    API->>DB: Query active products
    DB-->>API: Product DTOs
    API->>Cache: Cache unfiltered catalog for 5 minutes
  end
  API-->>UI: Product list
  Customer->>Cart: Add product or change quantity
  Cart->>Cart: Update local cart and display estimates
```

The cart is browser state for responsiveness. At checkout, the API reloads active products and recalculates totals from server-side prices, so client totals are never authoritative.

## Checkout and Payment Flow

```mermaid
sequenceDiagram
  actor Customer
  participant UI as Checkout UI
  participant API as Storefront API
  participant Checkout as Checkout service
  participant DB as AppDbContext
  participant Stripe as Stripe

  Customer->>UI: Confirm customer, cart, and card payment
  UI->>API: POST /payments/prepare
  API->>API: Validate allowed fields and customer input
  API->>Checkout: PreparePaymentAsync
  Checkout->>DB: Reload active products and prices
  Checkout->>Checkout: Calculate tax and total
  Checkout->>Stripe: Create PaymentIntent with idempotency key
  Stripe-->>UI: Client secret via API
  UI->>Stripe: Confirm payment using Stripe Elements
  Stripe-->>UI: Payment succeeded
  UI->>API: POST /storefront/orders with PaymentIntent ID
  API->>Stripe: Retrieve and verify status, amount, currency
  Stripe-->>API: Verified PaymentIntent
```

Stripe Elements handles card details directly. The frontend receives a publishable client secret; the API secret key stays on the server.

## Order Creation Flow

```mermaid
sequenceDiagram
  participant UI as Storefront or staff UI
  participant API as Order endpoint
  participant Service as Checkout / order services
  participant DB as AppDbContext
  participant CRM as Optional HubSpot sync

  UI->>API: Submit customer and product selections
  API->>API: Validate payload and permissions
  API->>DB: Load customer/products as applicable
  DB-->>API: Current persisted data
  API->>Service: Build line items and recalculate totals
  Service-->>API: Valid order aggregate
  API->>DB: Save customer, order, items, and activity logs
  DB-->>API: Persisted order
  API->>CRM: Create deal when integration is enabled
  CRM-->>API: Optional CRM object ID
  API-->>UI: Created order response
```

Storefront card orders add payment verification before persistence. Staff-created orders require JWT authentication and configured resource permissions.

## Backend Structure

```text
src/EcommerceDemo.Api/
|-- Data/          EF Core context and demo seeding
|-- Domain/        Entities, order statuses, and domain state
|-- Dtos/          Explicit API request and response contracts
|-- Endpoints/     Route groups, HTTP orchestration, authorization
|-- Services/      Checkout, pricing, auth, mapping, and integrations
|-- Validation/    Input normalization and allowed-field enforcement
|-- Program.cs     Dependency injection, middleware, auth, and startup
```

- `Endpoints` play the controller role and remain grouped by API resource.
- `Services` isolate reusable business rules and external integrations from HTTP transport details.
- `Data` centralizes persistence configuration. EF Core provides change tracking, querying, and the unit of work.
- `Dtos` prevent persistence entities from becoming the public API contract.
- `Domain` represents persisted ecommerce concepts and relationships.
- `Validation` provides shared server-side trust-boundary checks.
- Middleware configured in `Program.cs` applies security headers, HTTPS behavior, CORS, authentication, and authorization.

## Frontend Structure

```text
client/src/
|-- app/           Application shell, navigation, and shared app styles
|-- components/    Reusable UI, forms, tables, charts, and loading states
|-- features/      Workflow-focused screens, components, hooks, and helpers
|-- helpers/       Cross-feature formatting, exports, validation, and PDFs
|-- models/        Shared TypeScript API and UI types
|-- permissions/   Client-side permission-aware presentation
|-- services/      Typed HTTP API client and error normalization
|-- test/          Shared Vitest setup
|-- main.tsx       Browser entry point
```

Feature folders keep checkout, storefront, dashboard, orders, products, customers, authentication, and profile code close to the workflow that owns it. Shared components and models reduce duplication, while hooks separate stateful behavior from presentation. The project uses a small app shell rather than a routing or global-state framework because its current navigation and state needs remain modest.

## Maintainability and Scaling

- Clear HTTP, business, persistence, and UI boundaries make focused tests possible.
- Server-owned pricing and authorization keep trust decisions out of the browser.
- Interfaces around payment and HubSpot integrations allow deterministic test doubles.
- Feature folders make new workflow-specific components easy to add without expanding a global component directory.
- If query complexity or multiple persistence mechanisms grow, dedicated query/repository abstractions can be introduced around specific use cases rather than added preemptively.
