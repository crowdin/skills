---
name: crowdin-context-cli
description: Documents Crowdin CLI context download and upload. Use when downloading or uploading strings context for Crowdin, or when working with files, context management.
---

# Crowdin Context CLI

Use the Crowdin CLI for context download and upload. Config is read from `crowdin.yml` by default; override with `-c, --config=<path>` if needed.

```
crowdin context <command> [options]
```

## context download

```
crowdin context download <to> [OPTIONS]
```

`<to>` - output file path (e.g. `crowdin-context.jsonl`)

| Option | Description |
|--------|-------------|
| `-f, --file=<glob>` | Filter by Crowdin file path (repeatable) |
| `--label=<label>` | Filter by label (repeatable) |
| `-b, --branch=<name>` | Filter by branch |
| `--croql=<expr>` | CroQL filter expression |
| `--since=<YYYY-MM-DD>` | Only strings created after this date |
| `--format=jsonl` | Output format (only `jsonl` supported) |
| `--status=<value>` | Filter by context status: `empty`, `ai`, `manual` |

Config options (if not using a config file): `-T, --token`, `-i, --project-id`, `--base-url`, `--base-path`.

## context upload

```
crowdin context upload <file> [OPTIONS]
```

`<file>` - path to the JSONL context file to upload (e.g. `crowdin-context.jsonl`)

| Option | Description |
|--------|-------------|
| `--overwrite` | Also update strings where `ai_context` is empty |
| `--dry-run` | Preview changes without applying them |
| `--batch-size=<n>` | Strings per API batch request (default: 100) |

## JSONL format

One JSON object per line. Fields:

| Field | Description |
|-------|-------------|
| `id` | String ID in Crowdin |
| `key` | String key |
| `text` | Source text |
| `file` | Crowdin file path |
| `context` | Existing source context |
| `ai_context` | AI context to set - **edit this field before uploading** |

Example line:

```json
{"file":"/src/locales/en.po","ai_context":"","context":"#: src/App.tsx:54","id":3125833,"text":"Click on the Vite and React logos to learn more","key":"Click on the Vite and React logos to learn more"}
```

## Typical workflow

1. Download: `crowdin context download crowdin-context.jsonl`
2. Edit the file - fill in `ai_context` for each string.
3. Upload: `crowdin context upload crowdin-context.jsonl`
