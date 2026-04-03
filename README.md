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

## Available Skills

### context-extraction

Fills `ai_context` in Crowdin JSONL files so translators get clear context. Covers which strings need context (ambiguous short words, plurals, inline tags, etc.), how to write 1–3 sentence descriptions (UI element type, placement), and safe editing rules (only edit `ai_context`, validity checklist).

### crowdin-context-cli

Documents `crowdin context download` and `crowdin context upload` for AI enrichment. Covers CLI options (filters, output path, overwrite/dryrun), JSONL format, and the workflow: download → fill `ai_context` (e.g. with context-extraction) → upload.

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
npx skills add crowdin/skills/context-extraction
npx skills add crowdin/skills/crowdin-context-cli
npx skills add crowdin/skills/croql
npx skills add crowdin/skills/graphql
```

## Compatibility

These skills are compatible with:
- [Cursor](https://cursor.sh)
- [Claude Code](https://claude.ai/product/claude-code)
- [Cline](https://cline.bot/)
- [Windsurf](https://codeium.com/windsurf)
- [GitHub Copilot](https://github.com/features/copilot)
- And other agents supporting the skills.sh format

## Resources

- [Crowdin Documentation](https://support.crowdin.com)
- [Crowdin GitHub](https://github.com/crowdin)
- [Skills.sh](https://skills.sh)
