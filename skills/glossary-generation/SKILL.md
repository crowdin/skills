---
name: glossary-generation
description: Generates a starting glossary for a Crowdin project from the project's own source strings and uploads it with the Crowdin CLI. Use when someone wants to create a glossary, extract key terms or terminology from an app's strings, mark product and feature names as do-not-translate, or seed a Crowdin project with consistent vocabulary - including bare phrasings like "make a glossary for my project". Terms are drafted for review and never uploaded unseen, and translations are never invented. Not for managing an existing glossary's entries one by one, and not for the full internationalize-and-connect journey (that is i18n-setup, which delegates here).
---

# Glossary generation

Translators meet a product's vocabulary one string at a time, with no way to tell which words are the product's own. A glossary is where a term gets decided once — translated one way everywhere, or not translated at all — and it is worth most before the first translation is made rather than after fifty of them disagree.

The glossary this skill produces is a **starting point, not a finished asset**. Ten to thirty terms a localization manager can accept, edit, or delete beats two hundred that read as noise; the second kind gets deleted wholesale, which also throws away the few good entries in it. Treat forty terms as a hard ceiling, and prefer leaving a doubtful term out — a missing entry costs one inconsistent translation, a wrong one teaches every translator the wrong answer.

For the `glossary` command's full flag set, read the `crowdin-cli` skill's [commands reference](../crowdin-cli/references/commands.md#glossary); below are only the flags this skill passes.

## Inputs

Three things, resolved before any term is picked:

- **The source strings.** Read the **source catalog** — the file `crowdin.yml` uploads, at its resolved `source` pattern — not the source tree. Those are exactly the strings translators will see, already stripped of code. When there is no `crowdin.yml`, ask the user where the source-language strings live rather than scanning code for them.
- **A one-line product description.** This is what makes "brew" a domain term in a coffee-logging app and an ordinary verb anywhere else; without it, term selection degenerates into picking capitalized words. Ask for it if nothing in the conversation or repository supplies one.
- **A draft location outside version control** — a scratch directory, or a gitignored path the caller names — so a rejected draft never lands in the repository.

## What earns an entry

A term qualifies when a translator, seeing it in one string with no other context, could reasonably get it wrong. In practice that is four kinds:

- **Product and feature names.** Brand names, plan names, named surfaces — usually the entries that say *do not translate this*. This is the single most valuable category and the one most often missing.
- **Domain vocabulary the product leans on.** Words with a specific meaning in this product's world, particularly ones that recur across strings.
- **Words that are ambiguous out of context.** English's noun/verb pairs are the classic case: on its own, a `Log` label could be a record or an action, and a translator has to pick a word class before they can pick a word.
- **UI objects that must stay consistent with each other.** When a product distinguishes two similar things, translating them to the same word collapses a distinction the interface depends on.

Recurrence is the strongest signal: a term in two or more source strings is a candidate on frequency alone. A term appearing once needs one of the other reasons — a brand name earns its entry the first time it is used.

**What does not earn an entry:** ordinary UI verbs every translator has already translated a thousand times (`Save`, `Cancel`, `Delete`) unless this product uses one in a non-obvious way; whole sentences or message strings, which are strings to translate rather than terms to define; and anything you would be guessing at, including a term whose meaning you could not determine from the strings and the product description together.

Each entry carries a **description**, and it answers a practical question — what this is in this product, and whether it should be translated at all — rather than defining the English word. "The paid tier; a plan name, keep in English" is useful. "A plan is an intention to do something" is not.

Never invent translations. The glossary goes up with source-language terms only; translations are the translators' work, and a machine-guessed one in a glossary is a wrong answer wearing the authority of a decision.

## Draft the CSV

Write the terms to the draft location:

```csv
term_en,description_en
BrewLog,The product name. Keep in English everywhere.
brew,A single coffee preparation the user records. Not a beverage in general.
cup,One serving logged against a brew. Countable; appears in plural forms.
Home barista,Free plan name. Keep in English.
```

The header uses the **source locale's Crowdin language id** (`term_en`, `description_en` for an `en` source), which is the language id, not whatever code scheme the project spells its locale directories in — those two are allowed to differ, and the glossary API only ever speaks Crowdin ids.

Then show the user the terms and stop. This is a real gate: the file is small, plainly readable, and about to become an asset their translators treat as authoritative. Ask for an explicit go-ahead, and take edits before uploading rather than after.

## Upload

Both commands are authenticated: the token comes from the environment (`CROWDIN_PERSONAL_TOKEN`, or whatever `crowdin.yml`'s `api_token_env` names), and its value is never asked for, echoed, or written. A gitignored `.env` at the project root is enough to supply it — CLI v5 reads `.env` from its working directory natively.

**First, check for an existing glossary** — uploading without an id creates a *second* glossary rather than merging:

```bash
crowdin glossary list
```

- **A glossary already exists** — do not create another; import into it: `crowdin glossary upload <file> --id <id>`. Read its term count before saying anything about the merge. **`terms: 0` is an empty glossary Crowdin created with the project**, which happens on every new project and means there is nothing to preserve — import and move on. A **non-zero count is an asset somebody curated**: say plainly that the import merges into it, and let the user decline, which a project with a mature glossary usually should.

  `glossary list` is account-tier — it lists every glossary on the account, not this project's — so match on the project's name rather than expecting a short list.
- **No glossary exists** — create one: upload without `--id`, passing `--language` the Crowdin language id of the source locale:

```bash
crowdin glossary upload glossary.csv \
  --language en \
  --scheme term_en=0,description_en=1 \
  --first-line-contains-header
```

The upload prints the new glossary's id — report it back, and record it wherever the caller keeps decisions: it is what a later run passes to `--id` instead of creating a duplicate.

The import is asynchronous. `glossary upload` prints `Imported in #<id>` while `glossary list` can still report `terms: 0`; the count catches up moments later. Confirm the term count by re-reading it, so a race is not mistaken for a failed import.

## Failure and re-runs

- **The upload fails** — the terms survive in the draft CSV, so nothing has to be regenerated. Read the error before changing the file: an authentication or permission failure is not a malformed CSV.
- **The run repeats on the same project** — `glossary list` is what makes it idempotent. Without it, every re-run leaves another glossary behind, and a project with three glossaries called after the same file is worse off than one with none.
- **The user declines the upload** — that is a complete outcome, not a failure. Leave the CSV in place, tell them where it is and what command would upload it, and stop.

## Invoked by another workflow?

A calling workflow (the `i18n-setup` journey is one) may pass the inputs directly instead of being asked for them: the source catalog path, the product description, the draft path, and the source locale's Crowdin language id. Honor them as given. The contract back is small: the draft CSV at the path it named, the review gate still real (the caller's user, not the caller, says go), and one of two outcomes reported — the uploaded glossary's id, or "declined, draft kept at `<path>`". Both are complete outcomes.

## Related skills

- **`crowdin-cli`** — the authoritative surface for `crowdin glossary` and every other command this skill runs.
- **`i18n-setup`** — the full internationalize-and-connect journey; its phase 6 delegates its `generate_glossary` and `upload_glossary` steps here.
