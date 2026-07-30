# Scopes

`scopes` in the manifest is the list of Crowdin REST permissions the host will allow the app to exercise. The host runs every call under the session of whoever opened the app and rejects anything outside this list, so a wrong or missing scope does not fail `typecheck`, `lint`, `manifest validate` or `publish` - it 403s at runtime, inside the iframe, where nothing in the build checks. Get it right from this list rather than from memory.

Keep the list to what the app's calls actually need. A reviewer sees it, and so does every admin who installs the app.

## Postfixes

Most scopes take `:read` or `:write`. `:write` does **not** imply read, so an app that lists and edits needs both or the bare scope. Read-only scopes take no postfix at all - adding one is invalid.

Verbs in the request are a decent first guess (`shows` is read, `adds` or `changes` is write) but not a rule: see [when read needs write](#when-a-read-looking-call-needs-the-write-scope).

## The list

The authority is [understanding-scopes](https://support.crowdin.com/developer/understanding-scopes/) - fetch it when a scope you need is not below, since the catalogue grows. The table is an orientation copy, and the sections after it are what the docs do not tell you.

| Scope | Covers |
|---|---|
| `project` | Accessible projects |
| `project.settings` | View, create and update project settings |
| `project.status` | Translation status. Read-only |
| `project.member` | Project members and teams |
| `project.task` | Project tasks |
| `project.report` | Generate and export project reports |
| `project.source` | Branches, files, source strings |
| `project.translation` | Add and manage translations |
| `project.screenshot` | Screenshots and tags |
| `project.webhook` | Project webhook configuration |
| `tm` | Translation memories |
| `glossary` | Glossaries and terms |
| `group` | Project groups (Enterprise) |
| `language` | Organization languages |
| `user` | Users (Enterprise) |
| `team` | User teams (Enterprise) |
| `field` | Organization fields (Enterprise) |
| `vendor` | Organization vendors (Enterprise). Read-only |
| `client` | Organization clients (Enterprise). Read-only |
| `organization` | Organization info (Enterprise). Read-only |
| `notification` | Notification settings and subscriptions |
| `mt` | Machine translation engines |
| `ai`, `ai.provider`, `ai.prompt`, `ai.fine-tuning` | AI providers, prompts, fine-tuning |
| `ai.proxy` | Proxying requests to AI providers. Read-only |
| `security-log` | Security logs. Read-only |
| `application` | Installing applications |
| `webhook` | Organization webhooks |
| `automation`, `automation.rule`, `automation.rule.execution` | Automation rules (Enterprise) |
| `custom-spellchecker`, `external-qa-check` | Enterprise, read-only |
| `*` | Everything. Never declare this in an app you ship |

Finer-grained sub-scopes exist beyond this table - the scaffold ships `project.status.progress:read`, a narrower slice of `project.status`. When a narrower form fits, prefer it.

## Common combinations

Taken from apps that work, not composed here:

- projects and progress dashboard - `project.settings:read`, `project.status.progress:read`, `group:read`
- translation memories - `tm:read`
- glossary lookup in the editor - `glossary` (see below)
- untranslated counts per language - `project.status.progress:read`
- comments and issues on strings - a `project.source` scope is required; `project.translation` alone returns a uniform 403. Two runs hit this and reported it slightly differently (`project.source.string` versus `project.source:read` alongside `project.translation:read`), so treat the exact minimal pair as unsettled: start from the narrowest that has actually worked for someone (`project.source.string:read`) and widen only on a real 403 rather than guessing
- who translated how much - `project.report`, plus `project.member:read` for names

## When a read-looking call needs the write scope

Some read-shaped endpoints are `POST` calls that the backend guards at write level, so the narrow `:read` form gets a 403 on an obviously read-only feature. The known case: glossary concordance search (`POST /projects/{id}/glossaries/concordance`) needs the bare `glossary`, not `glossary:read`.

Confirmed by a second run: **translation-memory concordance search behaves the same way** - the bare `tm`, not `tm:read`. Treat concordance endpoints as write-guarded in general.

The general rule: when a call 403s despite a read-only intent, widen that one scope from `:read` to the bare form rather than adding unrelated scopes. Do not paper over it with `*`.

## Checking what an installed app actually got

```bash
npx crowdin-serverless-apps list --json
```

Each app carries its `scopes` and its resolved `permissions`, so this is how you confirm what the organization granted rather than what the manifest asked for.
