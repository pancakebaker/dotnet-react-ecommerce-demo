# Contributing

## Branches

Create work from the latest `main` and use a descriptive branch:

- `feature/<description>`
- `fix/<description>`
- `docs/<description>`
- `chore/<description>`

Do not commit directly to `main`, force push shared branches, or include unrelated changes.

## Local Setup

```powershell
dotnet restore
dotnet run --project ./src/EcommerceDemo.Api/EcommerceDemo.Api.csproj --urls http://localhost:5088
```

In another terminal:

```powershell
cd client
npm ci
npm run dev
```

See [README.md](README.md) for configuration.

## Code Style

- Follow existing C# and TypeScript patterns.
- Keep endpoint modules focused on HTTP concerns.
- Put reusable business and integration behavior in services.
- Validate untrusted input at the API boundary.
- Keep frontend code close to its owning feature unless it is genuinely shared.
- Prefer small, focused changes over broad rewrites.
- Do not add dependencies without a clear maintenance benefit.

Run formatting before opening a pull request:

```powershell
dotnet format
```

The frontend does not currently define a dedicated formatter or lint script. Follow the established TypeScript style and do not claim formatter or lint validation unless those tools are added and configured.

## Tests

Before opening a pull request:

```powershell
dotnet build --configuration Release
dotnet test --configuration Release

cd client
npm test
npm run test:e2e
npm run build
```

Add focused tests for changed behavior. Use the existing test payment and HubSpot implementations; automated tests must not require real provider credentials.

## Commits

Use concise messages that describe the change:

```text
feat: add order filtering
fix: reject mismatched payment currency
docs: document release process
```

Review `git diff` and `git status` before committing. Do not commit `dist`, `bin`, `obj`, coverage, browser reports, local secret files, or logs.

## Pull Requests

Include:

- the problem and chosen approach;
- behavior and API changes;
- security, data, or operational impact;
- tests and validation performed;
- documentation updates;
- remaining limitations or follow-up work.

Wait for Backend and Frontend CI checks and code review before merge.

## Documentation

Update documentation whenever a change affects:

- setup or configuration;
- API contracts;
- business rules;
- architecture decisions;
- security assumptions;
- deployment or operations;
- known limitations.

Create an ADR in `docs/adr/` for significant architectural decisions.
