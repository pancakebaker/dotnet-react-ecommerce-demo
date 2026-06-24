# Release Process

## 1. Create a Branch

Create a focused branch from the latest `main`:

```powershell
git switch main
git pull --ff-only
git switch -c feature/<short-description>
```

Use `fix/`, `docs/`, or `chore/` when those prefixes describe the change more accurately.

## 2. Implement and Verify

- Keep changes scoped to one concern.
- Update tests and documentation with behavior changes.
- Do not commit generated build, coverage, or browser-report directories.
- Review the full diff before staging.

Minimum checks:

```powershell
dotnet format
dotnet build --configuration Release
dotnet test --configuration Release

cd client
npm test
npm run test:e2e
npm run build
```

Run dependency audits when lockfiles or packages change.

## 3. Commit and Push

Use a concise imperative or conventional commit message:

```powershell
git add .
git commit -m "type: concise change summary"
git push -u origin <branch>
```

## 4. Pull Request and Review

- Explain behavior, risk, validation, and operational impact.
- Link related issues.
- Require successful Backend and Frontend CI checks.
- Resolve review comments with additional commits; do not rewrite shared history unless coordinated.

## 5. Merge

Merge only after required review and CI checks pass. Do not force push or bypass branch protections. Retain or delete the source branch according to repository policy.

## 6. Deployment

The current workflow does not deploy automatically. A deployment process should:

1. build immutable API and frontend artifacts;
2. scan dependencies and container images;
3. apply reviewed database changes;
4. inject environment-specific configuration and secrets;
5. deploy to a pre-production environment;
6. run smoke tests;
7. promote the same artifacts to production with approval.

## 7. Smoke Testing

Verify:

- API health;
- public product retrieval;
- authentication and a protected read;
- payment preparation in the intended provider mode;
- order creation and retrieval;
- frontend static assets and API connectivity;
- absence of new high-severity logs or alerts.

## 8. Rollback

Keep the previous application artifacts available. Define whether database changes are backward compatible before release. If rollback cannot safely reverse a data migration, use a forward-fix plan and restore procedure reviewed before deployment.
