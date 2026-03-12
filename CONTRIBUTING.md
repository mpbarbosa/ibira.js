# Contributing to ibira.js

Thank you for your interest in contributing! This document covers how to set up the project, the code standards we follow, and how to submit changes.

## Development Setup

```bash
git clone https://github.com/your-org/ibira.js.git
cd ibira.js
npm install
npm test          # run all tests
npm run lint      # ESLint check
npm run test:coverage  # coverage report
```

## Code Standards

- **ES Modules** — all source files use `import`/`export` syntax.
- **No var** — use `const` or `let`.
- **Semicolons** — always.
- **Tabs** — for indentation (not spaces).
- **Curly braces** — required on all `if`/`else`/`for` blocks (ESLint enforces this).
- **Immutability** — all class instances are frozen with `Object.freeze(this)`. Never mutate instance state; return new values instead.
- **JSDoc** — every class, method, and typedef must have full JSDoc including `@param`, `@returns`, `@throws`, and `@example`.

## Testing Guidelines

- One test file per source module in `__tests__/` (e.g. `IbiraAPIFetcher.test.js`).
- Test names start with `"should"`.
- `describe` blocks group tests by behaviour.
- Coverage thresholds: **75% minimum** on branches, functions, lines, and statements (currently >90%).

See [`__tests__/README.md`](./__tests__/README.md) for full testing conventions.

## Submitting Changes

1. Fork the repository and create a feature branch.
2. Make your changes, add tests, and confirm all tests pass.
3. Run `npm run lint` — fix any reported errors before submitting.
4. Open a pull request against `main` with a clear description of what changed and why.

## Architecture Overview

See [`src/README.md`](./src/README.md) and [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for the module layout and design principles.

## Reporting Issues

Please open a GitHub Issue with:
- A minimal reproduction case.
- The version of ibira.js you're using (`npm list ibira.js`).
- Node.js version (`node --version`).
