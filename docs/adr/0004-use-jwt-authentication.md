# ADR 0004: Use JWT Bearer Authentication

## Context

The separately hosted React application needs to call protected API endpoints for Staff and Admin workflows without server-side UI sessions.

## Decision

Issue signed JWT bearer tokens after PBKDF2 credential verification. Validate issuer, audience, lifetime, and signature at the API. Apply role policies and resource/action permissions to protected endpoints.

## Consequences

- API authentication remains stateless and works across separate frontend/API hosts.
- Authorization rules remain server-side and explicit.
- Token storage in browser-accessible storage increases the impact of frontend script compromise.
- Revocation, rotation, recovery, MFA, and account lockout require additional identity features.
- Hosting must protect signing material and enforce HTTPS.
