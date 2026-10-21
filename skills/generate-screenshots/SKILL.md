---
name: generate-screenshots
description: Captures screenshots of a running web, mobile or desktop app and uploads them to Crowdin as visual context, auto-tagged to the strings they show. Use when someone wants to add screenshots to a Crowdin project, show translators where strings appear in the UI, or find which strings still have no screenshot - including bare phrasings like "translators can't see where this string is used". Works standalone on any project already connected to Crowdin, for web, iOS, Android, React Native and Flutter apps, and desktop apps where the agent can drive the screen; re-runs update existing screenshots instead of duplicating them. Not for `crowdin screenshot` command syntax on its own (that is `crowdin-cli`), not for textual string context or `ai_context` (that is `context-extraction`), and not for the full internationalize-and-connect journey (that is `i18n-setup`, which delegates its screenshots add-on here).
---

# Generate screenshots

Translators meet strings one at a time, sorted by file. A bare `Save` could be a button, a menu item, or a dialog title, and each reading translates differently. A screenshot is the strongest context Crowdin can attach to a string: the actual screen, the neighboring labels, the space the text has to fit. Crowdin tags strings to positions on the image, so one screenshot contextualizes every string visible on it.

This skill owns the Crowdin side of that, and it is the same on every platform: decide which screens are worth a shot, measured by which strings have none; get one folder of PNGs whose file names are the screenshot identities; upload the folder with one command; report what is still uncovered and why. Capturing is the platform's own business, done by a capture definition the skill writes into the project - a Playwright spec, Maestro flows, an XCUITest - so the next run is two commands, not a second conversation.

For the `screenshot` and `string` commands' full flag sets, read the `crowdin-cli` skill's [commands reference](../crowdin-cli/references/commands.md#screenshot); this skill states only the flags it passes.

## Preconditions

- **A connected project**: `crowdin.yml` with a project id and `api_token_env`, sources already uploaded. Screenshots tag strings that exist in Crowdin, so upload order is not negotiable; without a `crowdin.yml`, the `i18n-setup` skill's connect-only path comes first.
- **The Crowdin CLI**, authorized. Exit code `101` means the user runs `crowdin login` in their own terminal. The token value stays out of the conversation: the CLI reads it from the environment variable `crowdin.yml` names, and the agent never reads, echoes, or writes it.
- **A shell.** The engines and the CLI run in one. From a connector-only assistant with no shell, say so and point the developer at this skill in a terminal.
- **A runnable app** and a capture engine. Which engine is below; what happens without one is "Publish-only mode".

## The contract: one folder, stable names

Every engine ends in the same place: `.crowdin/screenshots/`, a flat folder of PNGs inside the gitignored `.crowdin/` workspace (create it and add `.crowdin/` to `.gitignore` if `i18n-setup` has not already; show the one-line diff first when `.gitignore` has content). The images' durable home is Crowdin, never git.

- **The file name is the identity.** `crowdin screenshot upload` is an upsert keyed on the basename: `settings.png` replaces the project's existing `settings.png` in place, keeping its id. Names are kebab-case screen names - `dashboard`, `settings-profile`, `checkout-empty` - unique and stable. Renaming a screen orphans the old screenshot in Crowdin instead of replacing it.
- **Platform and state are suffixes.** The same screen on two platforms is two files, `settings-ios.png` and `settings-android.png`, because the CLI aborts a directory upload when two files share a basename, even across subfolders. A variant of a screen - empty, error, a tab - is `settings-empty.png`.
- **The folder is the batch.** Empty it before a run, so the upload touches exactly the screens captured this run. That matters because an `--auto-tag` upload re-derives a screenshot's tags from the image and discards the tags it had, including ones someone placed by hand in Crowdin. Only a screen that was re-shot gets re-tagged.
- **One framing per screen.** Capture in the **source language** - translators need the source text in view, and auto-tag matches the image against source strings - at one viewport or one device, light theme unless the app has no light theme. Re-shot images then replace old ones seamlessly. Device coverage is not the goal; context is.

## Screens, not strings

The unit of work is a **screen**: one capture-worthy UI state - a route, a modal, a drawer, each tab of a tab set, a select or menu open, a form after an empty submit and after a wrong one, an empty or error variant. Strings group under the screen that shows them, and shared chrome (navigation, tab bar, footer) is covered by whichever screen is shot first. Never plan one screenshot per string: an app with a thousand strings usually collapses to a few dozen screens, and one image contextualizes everything visible on it.

Screens come from the app's own structure, deep-linkable ones first: the router on the web (file-based routes, a route config), the navigator registrations or `app/` tree in React Native and Expo, storyboards, `NavigationStack` destinations or deep-link handlers on iOS, the navigation graph on Android. A screen a URL or deep link reaches is a one-line capture; a screen only a tap sequence reaches gets a flow. The agent's own browser or simulator, when it has one, is for scouting a screen before writing its flow - what renders, how it is reached - never for capture: a screenshot the agent looks at is not a file on disk. The same holds for an agent driving the desktop; there the capture is a command on the machine, as [references/computer-use.md](references/computer-use.md) lays out.

## The engine

Pick by what the project already has, in this order, and read only that reference:

| Project | Engine | Capture definition | Reference |
|---|---|---|---|
| Native iOS with an existing UI test target | XCUITest | a screenshot test in that target | [references/ios-xcuitest.md](references/ios-xcuitest.md) |
| Expo or React Native already running screenmap | screenmap | its output folder, renamed into the contract | [references/expo-screenmap.md](references/expo-screenmap.md) |
| Any mobile app - iOS, Android, React Native, Flutter | Maestro | YAML flows under `.maestro/crowdin/` | [references/mobile-maestro.md](references/mobile-maestro.md) |
| Web | Playwright | a spec file, one test per screen | [references/web-playwright.md](references/web-playwright.md) |
| A desktop app, a few one-off states, or no test code wanted - when the agent can drive the desktop | Computer use | none; the report carries the screen list | [references/computer-use.md](references/computer-use.md) |

Maestro is the mobile default because one YAML dialect covers every mobile stack and a flow reads as the list of taps it is. A project that already drives its UI with something else - Detox, Espresso, Flutter integration tests - keeps it: the contract is the folder, and any engine that writes named PNGs into it qualifies. Computer use is the one engine that leaves no definition behind, so it is offered with that cost named, after the others. Installing an engine is a change to the project's dev dependencies; say what gets installed and get a yes before installing.

## The journey

**1. Inventory - no engine yet.** Measure before planning:

```bash
crowdin string list --croql 'count of screenshots = 0' --verbose -o toon
```

CroQL cannot combine with other filters; `--verbose` widens the output to include `fileId`, `labelIds`, and `context`. On gettext-based projects that last field is the grouping shortcut: PO uploads carry each entry's `#:` source references into Crowdin, so the uncovered strings point straight at the components that render them. A key-value catalog (JSON, strings, XML) carries no references, so the key is looked up in the code and the screen is the route or component that uses it; that is the app's structure as above, walked from the strings. Either way the grouping is an import walk from each screen's entry file - a route module, a page component, a navigator registration; cut out whatever imports every one of them (a generated route manifest, a central router or navigator module), since through that edge every string would look shared by every screen. Then show the plan - screen name, how it is reached, which strings it covers - and **stop for the user's review**: they know which screens matter, which strings are dead, and what the app looks like when it is healthy. When the engine still has to be installed, the plan and the install are one question, so one yes covers both and no answer has to be read as more than it said. Nothing is written or captured before the plan is agreed.

**2. Session setup - the user's hands.** The user starts the app, or the engine starts it (Playwright's `webServer`, the simulator the user already built to), and the user signs in: once, interactively, into a session the engine reuses - Playwright's saved storage state, the simulator the flows launch into without clearing state. No credentials pass through the agent. Seeding test data is also the user's job: a screen faked with invented records is context that lies. Ask, don't fabricate.

**3. Write the capture definition.** One test or flow per screen in the plan, named after the screen, ending in a screenshot into the batch folder under the contract's name. The reference for the engine has the shape. It is project code, kept to the project's conventions: show it, and commit it only when the user says so - a calling workflow's approved plan counts as that word.

**4. Capture.** Empty the batch folder, run the definition, list the folder and confirm every planned screen produced its PNG. Then look at a sample of the images - every dialog, menu and scrolled section, and a few plain pages - before anything uploads. A capture that passed its test can still be wrong: content scrolled under a sticky header, a dialog or accordion caught mid-animation, a dev-tools overlay in the corner, a hover state on the last thing clicked. Each engine's reference says how to keep those out. A screen that failed to capture is fixed in the definition or dropped from the plan with a note, never papered over with an image from elsewhere.

**5. Upload.**

```bash
crowdin screenshot upload .crowdin/screenshots --auto-tag
```

Run `crowdin screenshot list` first: the upload's echo does not say whether an image was created or updated, and the list before it is what tells the report. Then one command for the whole folder: each image is created or updates the same-named screenshot, and then tags are derived by matching the image's text against the project's source strings. With `--auto-tag` the images go one at a time, because tagging locks the project, at a few seconds each - dozens of images take minutes, so run it in the background and carry on. A failed image does not stop the rest, and the command exits non-zero at the end. When every string in the project lives in one Crowdin file, add `-f` with that file's path as `crowdin file list` prints it, to scope the matching and sharpen it; the flag applies to every image in the folder, so it is wrong when screens draw from different files.

**6. Residue.** Re-run the coverage query, and before reading the count, take out what no screenshot can cover: strings with placeholders or plural forms, which auto-tag never matches even when they are on screen, and strings that are never pixels - alt text, `aria-label`s, page titles. Name those two groups with their counts; what remains is the real residue. Uncovered strings that live in reachable states - a tab not yet opened, a select's options, a form's other error messages, empty states, toasts - become new screens in the plan, captured the same way when they are worth the trip. The rest end in the report **grouped by why they are unreachable** (rendered only on error paths, sent in emails or push notifications, behind feature flags, composed at runtime), not chased string by string. An honest residue report is the terminating condition; zero uncovered strings is not.

**7. Report.** Coverage before and after (the query's count), screenshots created and updated, screens whose upload echoed zero tags (an observation, see below), the unreachable groups, and the capture definition committed with the two commands that re-run it.

## Re-runs

A re-run is a top-up: the inventory diffs the app against the capture definition - new routes, new uncovered strings, screens whose UI changed - and the run captures only those, by running only their tests or flows. The definition plus Crowdin's own state are the entire memory; there are no other state files, no hashes, no timestamps to reconcile. A full re-shoot of every screen is a mode the user asks for after a redesign, never the default. And never delete screenshots in Crowdin unprompted: deletion removes context translators may be relying on, and the upsert makes it unnecessary for replacement anyway.

## Tags inform, never gate

The success condition is the upload. Auto-tag is OCR against source strings, and it legitimately misses interpolated text (`Hello {name}`), plural forms, icons-with-labels, and truncated or low-contrast text - a screenshot with zero tags still shows the translator the screen, which beats nothing. Report tag observations at the end; never retry-loop on tag counts, and never hold a screen hostage to its `tagsCount`.

## Publish-only mode

When no engine can run here - no Node for Playwright, no simulator on this machine, no desktop the agent can drive, a CI box with no display - say so plainly and fall back: the inventory still produces the plan, the user captures the screens themselves and drops the images into `.crowdin/screenshots/` under the plan's names, and the skill uploads and reports. Never claim a capture happened when it did not, and never generate or mock an image of the app: a fabricated screenshot teaches every translator a UI that does not exist.

## Failure modes

| Situation | Do this |
|---|---|
| App won't start, or the session is signed out | Stop and ask. Nothing uploads from a broken session. |
| No engine can run here | Publish-only mode, stated plainly - never silently skipped. |
| Two files share a basename | The CLI aborts before uploading anything and lists them. Rename with a platform or state suffix. |
| Upload warns "auto tag is currently in progress" | The image landed; tags were skipped. Note it in the report - the next run's upload re-tags. |
| Upload warns that several screenshots share the name | Duplicates predate this process; the CLI updates the oldest. Surface the warning; offer cleanup only when the user asks. |
| Project is full of stale screenshots from an old design | List them first. Same-named uploads replace images in place, so a fresh set usually needs no deletions; delete only what has no successor, and only on an explicit yes. |

## Related skills

- **`crowdin-cli`** - the authoritative surface for every `crowdin` command this skill runs and for `crowdin.yml` semantics.
- **`i18n-setup`** - the journey that gets a project internationalized and connected; run it first when there is no `crowdin.yml`. Its context phase delegates here when the user opts into the screenshots add-on: `ai_context` tells translators what a string means, a screenshot shows where it lives.
- **`context-extraction`** - the textual half of context. Complementary, never a substitute in either direction.
