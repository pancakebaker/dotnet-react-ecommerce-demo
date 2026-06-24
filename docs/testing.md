# Testing Checklist

Use this checklist before release and after checkout, payment, permission, or validation changes.

## Automated Commands

- Backend build: `dotnet build`
- Backend tests: `dotnet test`
- Frontend build: `npm run build` from `client/`
- Frontend tests: `npm test` from `client/`
- Frontend lint check: `npm run lint --if-present` from `client/`
- End-to-end tests: `npm run test:e2e` from `client/`

## Regression Checklist

- Backend builds.
- Frontend builds.
- Backend unit and integration tests pass.
- Frontend unit and component tests pass.
- Storefront product listing shows active products only.
- Cart add, quantity update, and remove flows work.
- Checkout validation rejects invalid customer details.
- Stripe PaymentIntent client secret begins with `pi_` and contains `_secret_`.
- Order submission sends `paymentIntentId` for card checkout.
- Backend rejects missing or invalid card payment.
- Backend rejects PaymentIntent status values other than `succeeded`.
- Backend rejects PaymentIntent amount or currency mismatches.
- Backend creates an order after valid payment verification.
- Razor invoice rendering includes order, customer, and line-item values and tolerates missing optional contact fields.
- Authenticated order invoice endpoint returns an `application/pdf` attachment.
- Admin/staff protected API flows still require authentication and role permissions.
- No Checkout Session flow is reintroduced.

## Test Doubles

- API tests run in the `Testing` environment with an EF Core in-memory database.
- Automated tests use `TestingPaymentProvider` instead of Stripe, so no real Stripe API calls or secrets are required.
- API tests use `TestingInvoicePdfGenerator` so CI does not launch or download Chromium; Razor HTML rendering still uses the real template.
- Frontend tests mock API client methods and use the existing e2e payment bypass for PaymentIntent order submission.
