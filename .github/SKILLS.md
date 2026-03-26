# GitHub Skills

**Package:** `ibira.js`
**Language:** JavaScript (ESM, zero dependencies)
**License:** MIT

> **See also:** [API Reference](../docs/API.md) | [Architecture](../docs/ARCHITECTURE.md)

---

## Overview

GitHub Skills are reusable GitHub Actions workflows that automate recurring
engineering tasks for this repository. Each skill is a self-contained
`.yml` file under `.github/workflows/` and is designed to be idempotent —
running it multiple times with the same inputs always converges to the same
repository state.

---

## Skills Index

| Skill | File | Trigger | Purpose |
|-------|------|---------|---------|
| [Update bessa_patterns.ts](#update-bessayml) | `update-bessa.yml` | Weekly (Tue) / manual | Bump bessa_patterns.ts GitHub reference |
| [Sync version strings](#sync-versionyml) | `sync-version.yml` | Push to main (`package.json`) / manual | Propagate version from package.json to all files |
| [CDN Update](#cdn-updateyml) | `cdn-update.yml` | Manual | Update CDN delivery URLs |
| [Publish](#publishyml) | `publish.yml` | Release / manual | Publish package |
| [Verify workflow efficacy](#verify-workflow-efficacy) | _(Copilot skill)_ | Manual | Assess the most recent ai_workflow.js run; produce an efficacy score (0–100) |
| [Validate logs](#validate-logs) | _(Copilot skill)_ | Manual | Validate `.ai_workflow/logs` against codebase; write `plan.md` |
| [Fix log issues](#fix-log-issues) | _(Copilot skill)_ | Manual (after validate-logs) | Consume `plan.md`, apply fixes, update roadmap |
| [Audit and fix](#audit-and-fix) | _(Copilot skill)_ | Manual | Run verify-workflow-efficacy → validate-logs → fix-log-issues → purge-workflow-logs in one pass |
| [Purge workflow logs](#purge-workflow-logs) | _(Copilot skill)_ | Manual | Delete transient `.ai_workflow/` artefacts (logs/, backlog/, summaries/) |

---

## update-bessa.yml

**File:** `.github/workflows/update-bessa.yml`
**Trigger:** Weekly (Tuesday 09:00 UTC) or `workflow_dispatch`
**Skill docs:** `.github/skills/update-bessa/SKILL.md`

Updates `bessa_patterns.ts` from `github:mpbarbosa/bessa_patterns.ts#<TAG>`
to the latest (or a specified) release. Validates TypeScript, runs the full
test suite, adjusts version strings in `src/` and docs, and opens a PR.

### Steps

| # | Step | Notes |
|---|------|-------|
| 1 | Checkout repository | `actions/checkout@v4` |
| 2 | Set up Node.js 20 | npm cache enabled |
| 3 | Resolve target version | GitHub API or `workflow_dispatch` input |
| 4 | Check current version | Early-exit if already up to date |
| 5 | Update `package.json` | Replace `#OLD_TAG` with `#NEW_TAG` |
| 6 | Install dependencies | `npm ci` |
| 7 | Validate TypeScript | `npm run validate` (`tsc --noEmit`) |
| 8 | Run tests | `npm test` |
| 9 | Adjust related code | Replace version strings in `src/` |
| 10 | Update documentation | Replace version tags in `*.md` files |
| 11 | Adjust related tests | Replace version strings in `test/` + `__tests__/` |
| 12 | Open pull request | `peter-evans/create-pull-request@v7` |

### Trigger manually

```bash
gh workflow run update-bessa.yml --field version=v0.13.0-alpha
```

---

## sync-version.yml

**File:** `.github/workflows/sync-version.yml`
**Trigger:** Push to `main` (when `package.json` changes) or `workflow_dispatch`
**Skill docs:** `.github/skills/sync-version/SKILL.md`

Reads `package.json → version` as the single source of truth and propagates
it to every file that carries a version string. Validates TypeScript and runs
the full test suite before committing. Idempotent — if all strings already
agree, no commit is made.

### Files checked

| File | What is checked |
|------|----------------|
| `src/config/version.ts` | `major`, `minor`, `patch`, `prerelease` fields + `@example` comment |
| `src/index.ts` | `@version` JSDoc tag |
| `src/utils/debounce.ts` | `@since` JSDoc tag |
| `src/utils/throttle.ts` | `@since` JSDoc tag |
| `README.md` | Version badge, CDN `<script>` and `import` URLs |
| `docs/API.md` | Version badge, example output comment |
| `docs/INDEX.md` | CDN production URL |
| `.workflow-config.yaml` | `version:` field |
| `ROADMAP.md` | `> **Current version:**` header line only |

### Steps

| # | Step | Notes |
|---|------|-------|
| 1 | Checkout | `fetch-depth: 2` to detect previous version via `git diff` |
| 2 | Set up Node.js 20 | npm cache enabled |
| 3 | Resolve canonical version | `package.json` or `workflow_dispatch` input |
| 4 | Detect previous version | `git diff HEAD~1` or file scan fallback |
| 5 | Install dependencies | `npm ci` |
| 6 | Fix `src/config/version.ts` | Node script — field-level precision |
| 7 | Fix all other files | `sed` — global replacement of old → new version |
| 8 | Validate TypeScript | `npm run validate` |
| 9 | Run tests | `npm test` — catches `version.test.ts` regressions |
| 10 | Commit | Staged diff; skips commit if nothing changed |

### Trigger manually

```bash
gh workflow run sync-version.yml
```

---



**File:** `.github/workflows/cdn-update.yml`
**Trigger:** Manual (`workflow_dispatch`)

Updates CDN delivery URLs for the published package.

---

## Publish

**File:** `.github/workflows/publish.yml`
**Trigger:** Release creation or `workflow_dispatch`

Publishes the ibira.js package.

---

## Copilot Skills

The following skills are invoked via GitHub Copilot CLI and have no
corresponding `.yml` workflow file.

### Sync version

**Skill docs:** `.github/skills/sync-version/SKILL.md`

Reads `package.json → version` and checks it against all files that carry
a version string. Fixes any mismatch, validates JavaScript, runs tests, and
commits. Also available as `.github/workflows/sync-version.yml`.

### Verify workflow efficacy

**Skill docs:** `.github/skills/verify-workflow-efficacy/SKILL.md`

Reads the most recent `.ai_workflow/` run (logs, backlog, summaries) and
produces an efficacy score (0–100) with classification (High / Medium / Low).
Use before running `audit-and-fix` to confirm the workflow produced meaningful
output worth acting on.

### Validate logs

**Skill docs:** `.github/skills/validate-logs/SKILL.md`

Validates `.ai_workflow/logs/` against the live codebase and writes a
structured issue list to `.ai_workflow/plan.md`.

### Fix log issues

**Skill docs:** `.github/skills/fix-log-issues/SKILL.md`

Consumes `.ai_workflow/plan.md` and applies each confirmed fix, then
updates the project roadmap in `ROADMAP.md`.

### Audit and fix

**Skill docs:** `.github/skills/audit-and-fix/SKILL.md`

Orchestrates the full log-remediation pipeline: verify-workflow-efficacy →
validate-logs → fix-log-issues → purge-workflow-logs in a single pass.
Low-efficacy runs pause for confirmation before proceeding.

### Purge workflow logs

**Skill docs:** `.github/skills/purge-workflow-logs/SKILL.md`

Deletes all transient artefacts under `.ai_workflow/` (logs/, backlog/,
summaries/) while retaining plan.md and other permanent files.
