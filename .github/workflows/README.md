# `.github/workflows`

GitHub Actions workflow definitions. Each file is a CI/CD pipeline triggered by push, pull-request, or manual dispatch.

## Workflows

| File | Trigger | Purpose |
| ---- | ------- | ------- |
| `publish.yml` | Push to `main` | Lint, type-check, test, audit, then publish to npm |
| `release.yml` | Manual dispatch | Lint, type-check, test, audit, build, then create a GitHub release |
| `sync-version.yml` | Push to `main` | Runs `npm run version:check` to assert `package.json` and `version.ts` are in sync |
| `cdn-update.yml` | Push to `main` | Regenerates `cdn-urls.txt` after a version bump |
| `update-bessa.yml` | Schedule / manual | Opens a Dependabot-style PR when `bessa_patterns.ts` publishes a new version |

## Conventions

- Workflows run on `ubuntu-latest`.
- Secrets (`NPM_TOKEN`, `GITHUB_TOKEN`) are injected via repository Settings → Secrets.
- Add `[skip ci]` to a commit message to bypass all workflows for that push.
