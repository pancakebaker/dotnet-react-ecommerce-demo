# ADR 0001: Use ASP.NET Core and React

## Context

The platform needs a typed HTTP API, a responsive browser application, testable server-side business rules, and independent deployment of backend and frontend assets.

## Decision

Use .NET 8 ASP.NET Core minimal APIs for the backend and React with TypeScript and Vite for the frontend.

## Consequences

- Backend and frontend can be built, tested, scaled, and deployed independently.
- C# and TypeScript provide explicit contracts within each application.
- Cross-boundary contracts must remain synchronized and are not generated from one schema.
- Authentication, CORS, configuration, and error handling must account for separate origins.
