# Markdown Linting Guide

This guide explains how Markdown linting works in ibira.js, what rules are
enforced, and how to keep your documentation clean.

## Quick start

```bash
npm run lint:md          # check all .md files — exits non-zero on any error
```

The same check runs automatically as a **pre-commit hook** (via Husky) and as
a **CI step** in both `publish.yml` and `release.yml`.

## Tool

[markdownlint-cli2](https://github.com/DavidAnson/markdownlint-cli2) is used
with the config in `.markdownlint-cli2.jsonc` at the repo root.

## Enabled rules (selected)

| Rule | Description | Rationale |
| ---- | ----------- | --------- |
| MD007 | Unordered list indentation | Consistent 2-space nesting |
| MD022 | Headings should be surrounded by blank lines | Readability |
| MD026 | Trailing punctuation in headings | Style consistency |
| MD031 | Fenced code blocks surrounded by blank lines | Readability |
| MD032 | Lists surrounded by blank lines | Readability |
| MD040 | Fenced code blocks must specify a language | Syntax highlighting |
| MD051 | Link fragments must be valid | No broken in-page anchors |

## Disabled rules

| Rule | Reason |
| ---- | ------ |
| MD013 | Line length — technical docs contain long URLs and tables |
| MD033 | Inline HTML — intentional use for badges |
| MD034 | Bare URLs — common in technical references |
| MD041 | First-line heading — skill files start with `## Overview` by design |

## Rule customisations

| Rule | Setting | Why |
| ---- | ------- | --- |
| MD010 | `code_blocks: false` | Shell scripts inside fences use literal tabs intentionally |
| MD024 | `siblings_only: true` | API docs repeat headings like "Constructor" across classes |
| MD060 | `style: leading_and_trailing` | Consistent table cell padding |

## Common violations and fixes

### MD040 — fenced code block has no language

````markdown
<!-- ✗ wrong -->
```
npm install
```

<!-- ✓ correct -->
```bash
npm install
```
````

Use `bash` for shell commands, `typescript` / `javascript` for code, `text`
for plain output or diagrams, `json` / `yaml` for config snippets.

### MD026 — heading ends with punctuation

```markdown
<!-- ✗ wrong -->
## Getting Started?

<!-- ✓ correct -->
## Getting Started
```

### MD051 — broken link fragment

When you add an anchor link like `[Section](#my-section)`, verify that a
heading `## My Section` exists in the same file. GitHub converts headings to
anchors by lowercasing and replacing spaces with hyphens.

## Ignoring specific lines

Use inline disable comments sparingly:

```markdown
<!-- markdownlint-disable-next-line MD026 -->
## Are you sure?
```

Or wrap a block:

```markdown
<!-- markdownlint-disable MD013 -->
This line is intentionally very long because it contains a URL that cannot be shortened.
<!-- markdownlint-enable MD013 -->
```

## Ignored paths

The following are excluded from linting (configured in `.markdownlint-cli2.jsonc`):

- `node_modules/`
- `coverage/`
- `dist/`
- `.ai_workflow/`
