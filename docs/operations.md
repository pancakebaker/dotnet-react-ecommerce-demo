# Operational Considerations

This document separates current runtime behavior from operational capabilities required for a managed environment.

## Health Checks

**Current:** `GET /health` returns a basic process-level service response.

**Recommended:** Add readiness checks for the configured database and critical dependencies. Keep liveness checks independent from temporary external-provider failures.

## Observability

### Logging

**Current:** ASP.NET Core logging is available, and the HubSpot integration logs provider failures. Order and entity changes create application activity records.

**Recommended:**

- adopt structured logs with correlation and request IDs;
- define sensitive-field redaction rules;
- centralize log collection and retention;
- distinguish application audit events from diagnostic logs.

### Metrics, Monitoring, and Alerts

**Current:** No metrics backend, dashboard, alert manager, or external error-reporting service is configured.

**Recommended metrics:**

- request rate, latency, and error rate by route;
- checkout preparation and order-creation success rates;
- payment-provider failures and verification mismatches;
- database connection and query latency;
- HubSpot synchronization failures;
- process CPU, memory, restarts, and health-check state.

Alert thresholds should be based on service objectives and routed to an owned response channel.

### Tracing and Error Reporting

**Current:** Distributed tracing and centralized error reporting are not configured.

**Recommended:** Add trace propagation across the frontend/API boundary and instrument database and external HTTP operations. Add centralized exception handling before connecting an error-reporting provider.

## Backups and Recovery

**Current:** The repository does not automate production backups or restore validation. The in-memory provider is non-durable.

**Recommended:**

- use PostgreSQL or SQL Server managed backups;
- define recovery point and recovery time objectives;
- test restores on a schedule;
- document data ownership, retention, and deletion requirements;
- keep application deployment rollback separate from database recovery.

## Secrets Management

**Current:** Local secret files are ignored by Git and production configuration is environment-based. Production startup rejects weak JWT defaults and in-memory persistence.

**Recommended:** Store credentials in a managed secret service, restrict access by workload identity, rotate keys, audit access, and scan commits and images for accidental exposure.

## Scaling

**Current:** The API can use a persistent relational database, but the storefront cache is process-local. Background integration work executes in the request path.

**Recommended for multiple instances:**

- replace or coordinate process-local cache state;
- use a shared data-protection and secret strategy where required;
- move retriable external synchronization to a durable queue;
- add database connection-pool and query monitoring;
- keep API instances stateless beyond process-local optimizations.

## Disaster Recovery

Define:

- infrastructure recreation steps;
- database restore procedure;
- secret and certificate recovery;
- external-provider configuration recovery;
- DNS and frontend rollback;
- post-recovery integrity and payment-reconciliation checks.

The repository does not currently automate these procedures.

## Maintenance Tasks

- Review dependency updates and security advisories.
- Rotate API credentials and JWT signing material.
- Verify database backups and restore tests.
- Review failed payments and external synchronization.
- Reconcile activity/audit retention with policy.
- Re-run performance and accessibility checks after material frontend changes.
- Keep the configured Chromium package current and monitor invoice-generation latency and failures.
- Validate production configuration before each release.
