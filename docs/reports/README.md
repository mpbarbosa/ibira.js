# `docs/reports`

Generated and authored reports produced during development, code review, and quality assessments.

## Structure

```text
reports/
├── analysis/       ← Architectural and quality analysis reports
├── bugfixes/       ← Post-mortem and fix-log reports for resolved bugs
├── implementation/ ← Implementation notes and migration reports
└── MIGRATION.md    ← Top-level migration guide (version-to-version upgrade paths)
```

## What belongs here

Reports are point-in-time artefacts. Prefer keeping them as-is rather than editing them — they serve as a historical record. If a finding from a report is acted on, record the action in `CONTRIBUTING.md` or the relevant source file, not by modifying the report.
