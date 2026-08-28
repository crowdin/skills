---
name: crowdin-context-cli
description: Documents the Crowdin CLI context commands (download, upload, status, reset) for AI enrichment. Use when downloading or uploading strings context for Crowdin, checking context coverage, resetting AI-generated context, managing context files, or running crowdin context commands.
---

# Crowdin Context CLI

Use the Crowdin CLI for context download and upload. Config is read from `crowdin.yml` by default; override with `-c, --config=<path>` if needed.

```
crowdin context <command> [options]
```

## context download

Download strings context to a separate file for enrichment by AI Agent.

```
crowdin context download [CONFIG OPTIONS] [OPTIONS]
```

- `--to=<path>` — File path to download the context to. Default: `crowdin-context.jsonl`
- `-f, --file=<glob>` — Filter strings by Crowdin file paths (glob). Multiple paths can be specified
- `--label=<label>` — Filter strings by labels. Multiple labels can be specified
- `-b, --branch=<name>` — Filter by branch name
- `--croql=<expr>` — CroQL expression (cannot be combined with the other filter options)
- `--since=<YYYY-MM-DD>` — Only strings created after this date
- `--status=<value>` — Which kind of context a string already has: `empty` (none of any kind), `manual` (source context, no AI context), `ai` (AI context written). See below — this is not a filter for "still needs context"

Config options (if not using a config file): `-T, --token`, `-i, --project-id`, `--base-url`, `--base-path`. Use `-c, --config=<path>` to override config file (default: `crowdin.yml` or `crowdin.yaml`).

**Which `--status` selects the strings needing AI context depends on the source format, so prefer omitting it.** A format that carries source references into Crowdin — PO `#:` lines, for one — leaves every string holding manual context, so `empty` matches nothing and `manual` matches everything; a format carrying no context at all inverts that. With no `--status` the download covers both cases in one call, and costs nothing extra: `context upload` writes back only the records whose `ai_context` was actually filled.

## context upload

Upload strings context. Only files previously downloaded by `context download` are supported.

```
crowdin context upload [CONFIG OPTIONS] [OPTIONS]
```

- `--from=<path>` — File path to upload the context from. Default: `crowdin-context.jsonl`
- `--overwrite` — Also update strings where `ai_context` is empty (removes their AI section). Default: false
- `--dryrun` — Print command output without execution

## context status

Show context coverage statistics — how many strings have manual, AI, or no context.

```
crowdin context status [CONFIG OPTIONS] [OPTIONS]
```

- `-f, --file=<glob>` — Filter strings by Crowdin file paths (glob). Multiple paths can be specified
- `--label=<label>` — Filter strings by labels. Multiple labels can be specified
- `-b, --branch=<name>` — Filter by branch name
- `--croql=<expr>` — CroQL expression (cannot be combined with the other filter options)
- `--since=<YYYY-MM-DD>` — Only strings created after this date
- `--by-file` — Break statistics down per file

## context reset

Remove AI-generated context from strings; manually written context is preserved.

```
crowdin context reset [CONFIG OPTIONS] [OPTIONS]
```

- `-f, --file=<glob>` — Only reset strings from matching file paths. Multiple paths can be specified
- `--label=<label>` — Only reset strings with matching labels. Multiple labels can be specified
- `-b, --branch=<name>` — Only reset strings from the matching branch
- `--croql=<expr>` — Only reset strings matching the CroQL expression (cannot be combined with the other filter options)
- `--since=<YYYY-MM-DD>` — Only reset strings created after this date
- `--dryrun` — Print command output without execution
- `--all` — Required safety flag when no filter is specified

## JSONL format

One JSON object per line. Fields:

- `id` — String ID in Crowdin
- `key` — String key
- `text` — Source text
- `file` — Crowdin file path
- `context` — Existing source context
- `ai_context` — AI context to set (**edit this field before uploading**)

Example line:

```json
{"file":"/src/locales/en.po","ai_context":"","context":"#: src/App.tsx:54","id":3125833,"text":"Click on the Vite and React logos to learn more","key":"Click on the Vite and React logos to learn more"}
```

## Typical Workflow

1. Check coverage (optional): `crowdin context status` — the split between manual, AI and no context. Read it before picking a `--status` filter for the next step, or skip the filter and take everything.
2. Download: `crowdin context download` (writes to `crowdin-context.jsonl` by default) or `crowdin context download --to=path/to/file.jsonl`
3. Edit the file - fill in `ai_context` for each string (use [context-extraction](../context-extraction/SKILL.md) to help).
4. Upload: `crowdin context upload` (reads from `crowdin-context.jsonl` by default) or `crowdin context upload --from=path/to/file.jsonl`

To discard AI-generated context later (e.g. before re-running enrichment from scratch), use `crowdin context reset` with a filter, or `crowdin context reset --all`.
