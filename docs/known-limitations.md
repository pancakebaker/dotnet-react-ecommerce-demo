# Known Limitations

- **Payment lifecycle:** Card orders use synchronous PaymentIntent verification. Stripe webhook processing, asynchronous reconciliation, disputes, refunds, and settlement reporting are not implemented.
- **Inventory:** Active products are checked during order creation, but stock is not reserved or decremented transactionally. Overselling prevention is not implemented.
- **Order workflow:** Target statuses and permissions are validated, but there is no current-status transition matrix.
- **Audit retention:** Activity records are created, but retention, tamper resistance, export, and compliance policy are not defined.
- **Identity lifecycle:** MFA, account lockout, password reset, token revocation, and session administration are not implemented.
- **Observability:** A basic health endpoint exists; metrics, tracing, centralized logs, alerts, and external error reporting are not configured.
- **Database lifecycle:** EF Core provider configuration exists, but managed migrations, backup automation, and restore testing are not included.
- **Caching:** The storefront catalog cache is process-local and not coordinated across API instances.
- **External synchronization:** HubSpot calls occur from the request path and do not use a durable retry queue.
- **Localization:** UI copy, currency presentation, and catalog content are not localized.
- **Commerce scope:** Multi-vendor settlement, warehouse management, returns, tax-provider integration, promotions, subscriptions, and multi-currency catalogs are outside the current scope.
- **Invoice rendering:** Server invoice generation requires a compatible Chrome/Chromium runtime and does not currently persist generated documents or template versions.
