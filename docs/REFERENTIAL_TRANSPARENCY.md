# Referential Transparency — Document Hub

This page is the entry point for all referential transparency documentation in the
ibira.js repository. Five documents cover the topic from different angles; start
here, then follow the link that matches your goal.

## Document Map

| Document | Location | Purpose |
| -------- | -------- | ------- |
| **This page** | `docs/REFERENTIAL_TRANSPARENCY.md` | Entry point and navigation hub |
| [Concept Guide](./../.github/REFERENTIAL_TRANSPARENCY.md) | `.github/REFERENTIAL_TRANSPARENCY.md` | What referential transparency is, best practices, common pitfalls, and resources — start here if you're new to the concept |
| [Achievement]( ./referential_transparency/REFERENTIAL_TRANSPARENCY.md) | `docs/referential_transparency/REFERENTIAL_TRANSPARENCY.md` | How ibira.js was architecturally transformed to achieve perfect RT (10/10); dual-layer design explained |
| [Pure Solution](./referential_transparency/PURE_SOLUTION.md) | `docs/referential_transparency/PURE_SOLUTION.md` | The concrete `fetchDataPure` / `fetchData` solution with code examples and the full score breakdown |
| [Verification Report](./referential_transparency/VERIFICATION_REPORT.md) | `docs/referential_transparency/VERIFICATION_REPORT.md` | Formal verification: test results, mathematical compliance, and production-ready approval |

## Quick Summary

**ibira.js achieves perfect referential transparency (10/10)** through a
**dual-layer architecture**:

- **Pure core** — `fetchDataPure(cacheState, time, networkProvider?, signal?)` has
  zero side effects, accepts all state as parameters, and returns a frozen
  `FetchResult` describing what _should_ happen (data, events, cache operations).
- **Practical wrapper** — `fetchData(cacheOverride?, signal?)` calls the pure core
  then applies its side effects (mutates cache, fires observer events, retries).

This split means the pure core is fully deterministic and testable without mocks,
while `fetchData` provides the ergonomics callers expect.

## Reading Order

1. [Concept Guide](./../.github/REFERENTIAL_TRANSPARENCY.md) — understand the principle
2. [Achievement](./referential_transparency/REFERENTIAL_TRANSPARENCY.md) — see how it was applied
3. [Pure Solution](./referential_transparency/PURE_SOLUTION.md) — examine the implementation
4. [Verification Report](./referential_transparency/VERIFICATION_REPORT.md) — review the evidence
