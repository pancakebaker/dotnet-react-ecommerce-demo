# ADR 0002: Use EF Core as the Persistence Boundary

## Context

The API needs relational persistence, provider choice, entity relationships, query composition, change tracking, and transaction-oriented writes.

## Decision

Use Entity Framework Core and `AppDbContext` as the persistence boundary. Support PostgreSQL and SQL Server for durable environments and the in-memory provider for local development and automated tests.

## Consequences

- Query, mapping, relationship, and unit-of-work capabilities come from one maintained abstraction.
- Provider selection is configuration-driven.
- API and service code depends on EF Core behavior.
- Production operation still requires migrations, backup procedures, and provider-specific performance validation.
- In-memory tests do not reproduce every relational database behavior.
