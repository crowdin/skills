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

<!-- TODO: Add a description of the context-extraction skill -->

### crowdin-context-cli

<!-- TODO: Add a description of the crowdin-context-cli skill -->

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
