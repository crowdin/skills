---
name: translate
description: Drafts translations into a project's local resource files from the terminal, in whatever format the project's crowdin.yml uploads (PO, JSON, YAML, Android XML, Apple strings, ARB and the rest), consistent with the project's Crowdin glossary, translation memory and style guide, and uploads them to Crowdin as suggestions for review. Use when a developer asks to translate their app's strings, fill in the missing translations for a locale, translate the strings they just added, or translate a catalog into a newly added language. Not for translating prose documents or loose text, not for Crowdin's server-side pre-translation (that is `crowdin auto-translate`, covered by crowdin-cli), and not for the full internationalize-and-connect journey (i18n-setup, which can delegate here).
---

# Translate

A developer adds twelve strings and wants to see them in German today, not after the next translation cycle. This skill is the translator seat for that moment: it drafts translations into the project's own resource files, keeps them consistent with what the project's Crowdin resources already say, checks them mechanically, and uploads them to Crowdin as **unapproved suggestions**. Reviewers in Crowdin see ordinary suggestions and decide; the next sync brings back what they decided. Nothing this skill writes is the final word.

Its one real advantage over Crowdin's server-side pre-translation is that the agent has the code. A source reference or a translator comment leads to the component a string renders in, and that is where `Order` turns out to be a button rather than a noun. For bulk work that advantage costs more than it earns, and the skill says so (see "Large runs").

Every `crowdin` command below belongs to the `crowdin-cli` skill — syntax, credentials, exit codes, `crowdin.yml`. This file names only the flags it passes.

## Preconditions

- **`crowdin.yml` exists** in the working directory. Without it, stop: say that the skill would be drafting with no glossary, no TM and no review in Crowdin, and offer the `i18n-setup` skill's connect-only path instead.
- **The CLI is installed and authorized.** Exit code `101` means the user runs `crowdin login` in their own terminal; the token value never passes through the conversation.
- **The CLI is current.** `--assigned`, `language list --verbose` and `style-guide` are what this skill leans on; an unknown-option or unknown-command error means an older install, and `npm install -g @crowdin/cli` is the fix.

## The run

Six steps, in order. Steps 1–3 and 5–6 run on the main thread; step 4 may fan out per language (see "Large runs").

### 1. Resolve

- **Files.** `crowdin config sources` and `crowdin config translations` print the resolved local source and translation paths per language. Never re-implement the pattern resolution.
- **Languages.** The ones the user named, otherwise every project language. Run `crowdin language list --verbose -o json` once and keep three things per language: the locale code the `translation` pattern resolves to, the language id that `-l` takes, and `pluralCategoryNames`. The last one feeds the plural check in step 5.
- **Gaps.** One rule for every format: an entry present in the source file with no non-empty counterpart in the target file, in that format's own notion of an entry, plus any entry the format marks as needing work (a fuzzy PO entry). A target file that does not exist yet is all gaps. [references/formats.md](references/formats.md) shows the rule in each common format family, the fallback for one it does not list, and the library checks that count gaps for you where they exist (Lingui's `lingui check missing --locale <locale> --mode catalog`).

### 2. Sync

Two commands, in this order, for the languages in scope:

```bash
crowdin upload sources --cache
crowdin download translations -l <language id> --skip-untranslated-strings
```

Before the upload, a library that can prove its source catalog is current gets asked: `lingui check sync` for Lingui, and a failure means `lingui extract` first, so the strings that reach Crowdin are the ones in the code. Upload first, so every string about to be translated exists in Crowdin — translations uploaded for a string Crowdin has never seen are ignored. Download second, so the local files reflect what reviewers have already decided. `--skip-untranslated-strings` makes untranslated entries come back absent instead of filled with source text; without it a key-value gap becomes invisible. When the project syncs a Crowdin branch, both commands take the same `-b`; whether it does is something the user or the CI workflow says, never a guess.

**Gate:** the target files are clean in git before the download, because the download overwrites them. Dirty target files are a stop-and-ask, never a silent stash.

Then recount the gaps and show a table per language. Strings a human translated since the last pull are no longer gaps. Server-side TM matching is not part of this step: `crowdin auto-translate --method tm` exists for projects with TM history, and the crowdin-cli skill owns it.

### 3. Fetch resources

Only what the run needs, into `.crowdin/resources/` (gitignored — add `.crowdin/` to `.gitignore` if it is not there, showing the one-line diff first). Files already present are reused; the user asks for a refresh by saying so. [references/resources.md](references/resources.md) has the commands and the lookup pattern.

| Resource | When | Why |
|---|---|---|
| The target catalog's own translations | Always | Same product, same language, same voice — the strongest consistency signal, and free. |
| Glossary | Always | Small; a term decided once, everywhere. |
| TM language pair | When the target catalog is thin (fewer than roughly fifty existing translations), or the user wants consistency with legacy content | Grepped for a phrase, never read whole. |
| Style guide | Always, when one is assigned to the project and covers the language | Tone, formality, formatting conventions. |

### 4. Draft

Per string, the sources of truth apply in this order, and an earlier one wins:

1. **Glossary term.** A term in the string binds its translation; a do-not-translate term stays in the source language verbatim. A glossary term with no translation in the target language is one to keep consistent with the TM and the catalog — never one to invent a translation for.
2. **Existing translation** of the same source string elsewhere in the target catalog, or of a near-identical one. Match it.
3. **TM hit.** An exact source match is reused as is; a partial match is a style reference.
4. **Context.** The translator comment, the `ai_context` if the project wrote one, and the source reference — which the agent follows into the code when the string is ambiguous. This is the step no server-side engine can do.
5. **Style guide**, for tone, formality and formatting conventions.

Every draft is recorded first as one line in the language's ledger, `.crowdin/translate/drafts-<language id>.jsonl` ([format](references/formats.md#the-drafts-ledger)), then written into the target file in place, mirroring the source file's structure: same entry order, quoting, indentation, headers and comments. A new target file mirrors the source file's structure entirely. The source catalog is never touched.

If the project has a catalog build step (a compile, a codegen), run it after the write so the running app shows the drafts. Which command that is belongs to the library's own skill or to the rules file `i18n-setup` rendered; this skill does not restate it.

### 5. Verify

Three checks, all mechanical, before anything is uploaded:

1. **Placeholders and plurals**, over the ledger, with the `scripts/check-drafts.sh` that ships beside this file:

   ```bash
   scripts/check-drafts.sh .crowdin/translate/drafts-uk.jsonl --categories one,few,many,other
   ```

   `--categories` is the language's `pluralCategoryNames` from step 1. Exit `0` is clean; `1` prints one line per mismatch; `2` means `jq` is missing or the ledger is not valid JSONL — then review the placeholders by hand from the ledger, and never report the skip as a pass.
2. **Format validity** of every touched target file, through whatever parser the project already has: the library's own catalog step when there is one, otherwise a format tool at hand (`jq` for JSON, `msgfmt -c` for PO, `xmllint` for XML, `plutil -lint` for Apple property lists, `yq` for YAML). When none is available, read the file back and say so in the report; a missing validator is never a pass. Where the library also counts gaps (`lingui check missing --locale <locale> --mode catalog` for Lingui), its exit `0` after the write is the proof that none was left behind.
3. **PO plural header.** For PO, the target file's `Plural-Forms` header must agree with the language's categories; a disagreement is reported, not resolved silently.

Then a table per language — drafted, skipped (with the reason), flagged — and flagged entries are fixed or reverted to gaps. They never ship.

### 6. Upload

```bash
crowdin upload translations -l <language id>
```

Once per touched language, with the same `-b` as the sync. Never `--auto-approve-imported` (drafts are suggestions) and never `--import-eq-suggestions` (a draft identical to its source is not worth a suggestion). Show the per-language counts and get a go first; in an `i18n-setup` run the approved plan is the go. Close with `crowdin status` for the languages touched.

Say two things plainly in the report: the suggestions appear under the account that owns the token, because the CLI has no way to mark a suggestion as machine-drafted; and reviewers will find them as ordinary unapproved suggestions. Offer, once, a proofread task per language — `crowdin task add <title> --type proofread --language <id> --file <path>` — as the explicit handoff to a human. It is an offer, not a default.

## The rules

These are hard, because they are where agent translation actually breaks production.

- **Placeholders are byte-identical.** `{count}`, `{0}`, `%s`, `%1$d`, `{{name}}`, `<0>…</0>`, `#` in a plural form: same spelling, same count, same case. Reordering to fit the target grammar is fine; renaming is not.
- **Plurals use the target language's categories** — the ones `language list --verbose` printed, never the source language's. `one`/`other` becomes four forms in Ukrainian and collapses to `other` in Japanese.
- **Tags, entities, escape sequences and edge whitespace survive.** A trailing space or newline in the source is in the target too.
- **`max_length` is respected** when the format or the string carries one.
- **Do-not-translate terms stay in the source language:** brand and product names per the glossary, URLs, identifiers, and anything the project's rules file lists as non-translatable.
- **Never write the source catalog. Never approve. Never overwrite an existing non-fuzzy translation** unless the user names the string.
- **Never invent a glossary translation.** A missing target term is the translators' work.
- **No fuzzy marking of drafts.** Review state lives in Crowdin; a fuzzy PO entry reads as untranslated to the app, which defeats drafting locally.
- **Ambiguity is a skip with a reason, never a guess.** A reviewer can answer a question; nobody can spot a confident wrong translation among two hundred right ones.

## Large runs

The count table always appears. When the total number of translations exceeds 200, add two sentences before waiting for the go: cost scales with the count, and later strings get less care than earlier ones in a single pass; `crowdin auto-translate --method ai` is the cheaper route for bulk work, and the crowdin-cli skill owns it. Then proceed on a yes. Never refuse on size.

Languages are independent. In an environment with a subagent tool, step 4 may dispatch one worker per target language after step 3; each worker writes only its own language's target files and ledger and returns its table, and the main thread runs steps 5 and 6 for all of them. Without subagent support the same work runs serially with an identical end state. Never required.

## Invoked by another workflow?

The `i18n-setup` journey delegates its `draft_translations` step here. A caller passes the target languages, the resolved catalog paths, and the go from its approved plan; this skill asks nothing twice, runs steps 1–6, and reports the per-language table back. The rules above hold unchanged — the caller's plan never waives the counts shown before upload or the "never approve" rule.

## Related skills

- **`crowdin-cli`** — every command this skill runs.
- **`glossary-generation`** — produces the glossary this skill consumes.
- **`i18n-setup`** — the full journey; its phase 6 delegates here when the user asked for translations.
