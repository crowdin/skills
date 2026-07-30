# Crowdin Skills

This repository contains Agent Skills for [Crowdin](https://crowdin.com), an AI-powered localization platform for teams and businesses.

## What are Agent Skills?

Skills are reusable capabilities for AI coding agents. They provide procedural knowledge and best practices that help AI agents implement features correctly and efficiently.

## Installation

Install all Crowdin skills with a single command:

```bash
npx skills add crowdin/skills
```

This gives your AI coding agent access to comprehensive Crowdin knowledge including best practices, common pitfalls, and configuration patterns.

### Claude Code Plugin

Alternatively, install the skills as a [Claude Code plugin](https://code.claude.com/docs/en/discover-plugins). In Claude Code, run:

```
/plugin marketplace add crowdin/skills
/plugin install crowdin@crowdin-skills
```

All skills load automatically and stay up to date via `/plugin marketplace update`.

The plugin also includes the [Crowdin MCP Server](https://support.crowdin.com/developer/crowdin-mcp-server/), giving your agent direct access to Crowdin projects. Authenticate via the browser OAuth flow on first use (`/mcp` in Claude Code). Crowdin Enterprise users should connect their organization endpoint (`https://{organization}.mcp.crowdin.com/v2/mcp`) manually instead.

### Other Agent Tools (Plugin Install)

The repo is also installable as a plugin via the [`plugins` CLI](https://npmx.dev/package/plugins), which auto-detects your installed agent tools (Claude Code, Cursor, Codex, Grok Build, Kimi Code, GitHub Copilot CLI, VS Code) and installs through each tool's native plugin system:

```bash
npx plugins add crowdin/skills
```

### Gemini CLI

The repo is a [Gemini CLI extension](https://geminicli.com/docs/extensions/) — install it with:

```bash
gemini extensions install https://github.com/crowdin/skills
```

### GitHub CLI

The [GitHub CLI](https://cli.github.com) (v2.90+) can install the skills for GitHub Copilot or any other supported agent:

```bash
gh skill install crowdin/skills --all
```

Use `--agent <name>` (e.g. `--agent cursor`) to target a specific tool, and `gh skill update` to pull newer versions.

## Available Skills

### context-extraction

Fills `ai_context` in Crowdin JSONL files so translators get clear context. Covers which strings need context (ambiguous short words, plurals, inline tags, etc.), how to write 1–3 sentence descriptions (UI element type, placement), and safe editing rules (only edit `ai_context`, validity checklist).

### crowdin-context-cli

Documents `crowdin context download` and `crowdin context upload` for AI enrichment. Covers CLI options (filters, output path, overwrite/dryrun), JSONL format, and the workflow: download → fill `ai_context` (e.g. with context-extraction) → upload.

### crowdin-api-client

Guides practical usage of `@crowdin/crowdin-api-client` for production workflows. Covers client/module selection, pagination with `.withFetchAll()`, uploads via storage + file creation, translation build/download flow, runtime options (`fetch`, retries, timeout), and error handling patterns (`CrowdinValidationError` vs `CrowdinError`).

### croql

Helps build, validate, and optimize Crowdin CroQL expressions for strings, translations, TM segments, and glossary terms. Includes operator guidance, context-specific fields, editor-filter equivalents, and API endpoint templates with URL-encoding reminders.

### graphql

Helps write and debug valid Crowdin GraphQL queries with schema-aware arguments, pagination, filtering/sorting, and node/rate-limit safety checks. Includes a troubleshooting pattern for common Playground errors like unsupported field arguments.

## Quick Start

1. **Install all Crowdin skills:**
   ```bash
   npx skills add crowdin/skills
   ```

2. **Use with your AI coding agent:**
   The skills will automatically be available when working on projects that use Crowdin, or when you mention terms that fall under the scope of the skills.

3. **Manual trigger:**
   You can explicitly reference the skills in your prompts:
   ```
   "Using the Crowdin skills, help me enrich the context of strings before translation starts"
   ```

### Installing Individual Skills

If you prefer, you can install specific skills:
```bash
npx skills add crowdin/skills --skill context-extraction
npx skills add crowdin/skills --skill crowdin-context-cli
npx skills add crowdin/skills --skill crowdin-api-client
npx skills add crowdin/skills --skill croql
npx skills add crowdin/skills --skill graphql
```

## Compatibility

These skills are compatible with:
- [Claude Code](https://claude.ai/product/claude-code)
- [Cursor](https://cursor.sh)
- [OpenAI Codex](https://openai.com/codex/)
- [Gemini CLI](https://geminicli.com)
- [GitHub Copilot](https://github.com/features/copilot)
- [OpenCode](https://opencode.ai)
- [Cline](https://cline.bot/)
- [Windsurf](https://codeium.com/windsurf)
- And other agents supporting the [Agent Skills](https://agentskills.io) format

## Resources

- [Crowdin Documentation](https://support.crowdin.com)
- [Crowdin GitHub](https://github.com/crowdin)
- [Skills.sh](https://skills.sh)
