---
name: generate-screenshots
description: Captures screenshots of a running app and uploads them to Crowdin as visual context, auto-tagged to the strings they show. Use when someone wants to add screenshots to a Crowdin project, show translators where strings appear in the UI, or find which strings still have no screenshot - including bare phrasings like "translators can't see where this string is used". Works standalone on any project already connected to Crowdin; re-runs update existing screenshots instead of duplicating them. Not for `crowdin screenshot` command syntax on its own (that is `crowdin-cli`), not for textual string context or `ai_context` (that is `context-extraction`), and not for the full internationalize-and-connect journey (that is `i18n-setup`, which delegates its screenshots add-on here).
---

# Generate screenshots

Translators meet strings one at a time, sorted by file. A bare `Save` could be a button, a menu item, or a dialog title, and each reading translates differently. A screenshot is the strongest context Crowdin can attach to a string: the actual screen, the neighboring labels, the space the text has to fit. Crowdin tags strings to positions on the image, so one screenshot contextualizes every string visible on it.

This skill captures the user's running app with a browser the agent drives, uploads the images with the Crowdin CLI, and keeps the process continuous: a committed screen map records what exists, uploads are keyed so a re-run updates images in place, and a coverage query measures what is still missing.

For the `screenshot` and `string` commands' full flag sets, read the `crowdin-cli` skill's [commands reference](../crowdin-cli/references/commands.md#screenshot); this skill states only the flags it passes.

## Preconditions

- **A connected project**: `crowdin.yml` with a project id and `api_token_env`, sources already uploaded. When there is no `crowdin.yml`, this is a job for `i18n-setup` first — screenshots tag strings that exist in Crowdin, so upload order is not negotiable.
- **The Crowdin CLI.** `crowdin screenshot upload` is an upsert keyed on the image's basename: an existing screenshot with the exact same name is updated in place. That upsert is this skill's entire continuity mechanism.
- **The token stays invisible.** Same rule as every Crowdin skill: the CLI reads it from the environment variable `crowdin.yml` names; the agent never reads, echoes, or writes the value.
- **A runnable app**, and for the capture half a browser the agent can drive. What happens without one is below — never a silent skip.

## Screens, not strings

The unit of work is a **screen**: one capture-worthy UI state — a route, a modal, a drawer, a distinct tab, an empty or error variant. Strings group under the screen that shows them, and shared chrome (navigation, footer) is covered by whichever screen is shot first. Never plan one screenshot per string: an app with a thousand strings usually collapses to a few dozen screens, and one image contextualizes everything visible on it.

## The screen map — `.agents/crowdin-screens.md`

The map is a committed project file, the durable record of which screens exist and how to reach them. Confirm it is not gitignored (`git check-ignore .agents/crowdin-screens.md` must fail); a map only one machine can see defeats its purpose.

```markdown
# Crowdin screenshots — screen map

- App URL: http://localhost:3000
- Start: npm run dev
- Viewport: 1440x900
- Theme: light
- Locale: en — always capture the source language

## dashboard
- Route: /
- Reach: land here after login
- Strings: nav.*, dashboard.title, dashboard.empty-hint
- Last shot: 2026-09-03

## settings-profile
- Route: /settings
- Reach: avatar menu → Settings → Profile tab
- Strings: settings.profile.*
- Last shot: never
```

Rules for it:

- **The heading is the identity.** `## dashboard` names the file `dashboard.png`, and that basename is what Crowdin's upsert keys on. Kebab-case, unique within the map, and stable — renaming a heading orphans the old screenshot in Crowdin instead of replacing it.
- **The header block pins the framing.** Every shot in a project shares one viewport, theme, and locale, so re-shot images replace old ones seamlessly. Capture in the **source locale**: translators need the source text in view, and auto-tag matches the image against source strings.
- **`Strings` is for planning, not parsing.** Identifiers or prefixes, enough to guide the capture walk and the residue analysis; nothing consumes it strictly.
- **The app beats the map.** A session starts by spot-verifying the map against the running app — routes exist, reach steps work, expected strings render. Where they disagree, the map is what gets fixed.

Images live in `.crowdin/screenshots/<heading>.png` — working files, not repository content. Reuse the gitignored `.crowdin/` workspace if `i18n-setup` created one; otherwise create it and add `.crowdin/` to `.gitignore`, showing the one-line diff first when `.gitignore` already has content. The images' durable home is Crowdin.

## When there is no browser to drive

Probe the capability honestly, the way `create-app` verifies a preview: if you can drive a browser, run the full journey; if you cannot, say so plainly and fall back to **publish-only mode** — the inventory still produces the map, the user captures the screens themselves and drops the images into `.crowdin/screenshots/` named after the map's headings, and the skill uploads and reports. Never claim a capture happened when it did not, and never generate or mock an image of the app: a fabricated screenshot teaches every translator a UI that does not exist.

## The journey

**1. Inventory — no browser yet.** Measure before planning:

```bash
crowdin string list --croql 'count of screenshots = 0' --verbose -o toon
```

CroQL cannot combine with other filters; `--verbose` widens the output to include `fileId`, `labelIds`, and `context`. That last field is the grouping shortcut on gettext-based projects: PO uploads carry each entry's `#:` source references into Crowdin, so the uncovered strings point straight at the components that render them. Otherwise group by static analysis — router configuration, page components, which strings live under each subtree. Write or update the map, then **stop for the user's review**: they know which screens matter, which strings are dead, and what the app looks like when it is healthy. No browser opens before the map is agreed.

**2. Session setup — the user's hands.** The user starts the app and logs in inside the agent's browser session; the agent confirms it sees an authenticated page before walking anywhere. Seeding test data is also the user's job — a screen faked with invented records is context that lies. Ask, don't fabricate.

**3. Capture walk.** Per screen: verify the map's claim (repair the map when the app disagrees), reach the state, shoot at the pinned framing, save as `.crowdin/screenshots/<heading>.png`.

**4. Upload.**

```bash
crowdin screenshot upload .crowdin/screenshots/dashboard.png --auto-tag
```

Creates the screenshot or updates the same-named one in place, then tags strings by matching the image's text against the project's source strings. When everything on a screen comes from one source file, add `-f <crowdin file path>` to scope the matching and sharpen it. Update each screen's `Last shot` date as it lands.

**5. Residue.** Re-run the coverage query. Uncovered strings that live in reachable states — validation errors, empty states, toasts — become new screens in the map, captured the same way when they are worth the trip. The rest end in the report **grouped by why they are unreachable** (rendered only on error paths, sent in emails, behind feature flags, composed at runtime), not chased string by string. An honest residue report is the terminating condition; zero uncovered strings is not.

**6. Report.** Coverage before → after (the query's count), screenshots created and updated, screens whose upload echoed zero tags (an observation — see below), the unreachable groups, and the map committed.

## Re-runs

A re-run is a top-up: the inventory diffs the app against the map — new routes, new uncovered strings, screens whose UI changed — and the walk visits only those. The map plus Crowdin's own state are the entire memory; there are no other state files, no hashes, no timestamps to reconcile. A full re-shoot of every screen is a mode the user asks for after a redesign, never the default. And never delete screenshots in Crowdin unprompted — deletion removes context translators may be relying on, and the upsert makes it unnecessary for replacement anyway.

## Tags inform, never gate

The success condition is the upload. Auto-tag is OCR against source strings, and it legitimately misses interpolated text (`Hello {name}`), plural forms, and truncated or low-contrast text — a screenshot with zero tags still shows the translator the screen, which beats nothing. Report tag observations at the end; never retry-loop on tag counts, and never hold a screen hostage to its `tagsCount`.

## Failure modes

| Situation | Do this |
|---|---|
| App won't start, or login fails | Stop and ask. Nothing uploads from a broken session. |
| No drivable browser | Publish-only mode, stated plainly — never silently skipped. |
| Upload warns "auto tag is currently in progress" | The image landed; tags were skipped. Note it in the report — the next run's upload re-tags. |
| Upload warns that several screenshots share the name | Duplicates predate this process; the CLI updates one deterministically. Surface the warning; offer cleanup only when the user asks. |

## Related skills

- **`crowdin-cli`** — the authoritative surface for every `crowdin` command this skill runs and for `crowdin.yml` semantics.
- **`i18n-setup`** — the journey that gets a project internationalized and connected; run it first when there is no `crowdin.yml`. Its context phase delegates here when the user opts into the screenshots add-on: `ai_context` tells translators what a string means, a screenshot shows where it lives.
- **`context-extraction`** — the textual half of context. Complementary, never a substitute in either direction.
