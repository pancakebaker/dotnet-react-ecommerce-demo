# ADR 0005: Avoid a Pass-Through Repository Layer

## Context

EF Core already provides query composition, change tracking, entity sets, and unit-of-work behavior. A repository per entity would largely repeat those APIs without changing the persistence boundary.

## Decision

Allow endpoint modules and focused services to use `AppDbContext` directly. Do not introduce repositories that only forward CRUD operations. Add use-case-specific query or repository abstractions when they isolate real complexity, alternative persistence, or a stable domain boundary.

## Consequences

- The codebase has fewer abstractions and less mapping boilerplate.
- Query behavior remains visible near the use case.
- Endpoint and service code is coupled to EF Core.
- Tests use a configured `AppDbContext` rather than mocking repository interfaces.
- Complex reporting, multi-source data, or domain persistence may justify targeted abstractions later.
