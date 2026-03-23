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
| [CDN Update](#cdn-updateyml) | `cdn-update.yml` | Manual | Update CDN delivery URLs |
| [Publish](#publishyml) | `publish.yml` | Release / manual | Publish package |
| [Validate logs](#validate-logs) | _(Copilot skill)_ | Manual | Validate `.ai_workflow/logs` against codebase; write `plan.md` |
| [Fix log issues](#fix-log-issues) | _(Copilot skill)_ | Manual (after validate-logs) | Consume `plan.md`, apply fixes, update roadmap |
| [Audit and fix](#audit-and-fix) | _(Copilot skill)_ | Manual | Run validate-logs then fix-log-issues in one pass |

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

## CDN Update

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

### Validate logs

**Skill docs:** `.github/skills/validate-logs/SKILL.md`

Validates `.ai_workflow/logs/` against the live codebase and writes a
structured issue list to `.ai_workflow/plan.md`.

### Fix log issues

**Skill docs:** `.github/skills/fix-log-issues/SKILL.md`

Consumes `.ai_workflow/plan.md` and applies each confirmed fix, then
updates the project roadmap in `docs/FUNCTIONAL_REQUIREMENTS.md`.

### Audit and fix

**Skill docs:** `.github/skills/audit-and-fix/SKILL.md`

Runs validate-logs then fix-log-issues in a single pass.
