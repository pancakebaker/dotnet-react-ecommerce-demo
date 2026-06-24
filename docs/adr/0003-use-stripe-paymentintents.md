# ADR 0003: Use Stripe PaymentIntents

## Context

Card checkout requires provider-managed card handling, support for modern payment authentication, idempotent payment creation, and server-side verification before local order creation.

## Decision

Use Stripe Elements in the browser and Stripe PaymentIntents through the API. The API calculates the amount, creates the intent, and verifies status, amount, and currency before creating a card order.

## Consequences

- Raw card data does not pass through the application API.
- Payment state is verified against Stripe rather than trusted from the browser.
- Stripe credentials and availability become operational dependencies.
- Synchronous verification covers the current checkout path.
- Webhooks, reconciliation, refunds, disputes, and asynchronous payment states require additional implementation.
