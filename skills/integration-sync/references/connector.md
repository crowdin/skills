# Connector path

The loop in SKILL.md, run with the Crowdin MCP server's tools. The tools wrap the shared method set and nothing else: there is no discovery and no generic call, and every tool takes `applicationIdentifier` and `projectId`.

## Which apps these tools drive

`list_application_installations` with `fields: ["permissions", "modules"]` (neither is in the default fields). An app whose `modules` contain both `api` and `project-integrations` exposes the shared set, and the tools below work on it: Webflow, Contentful, Braze, Iterable, MoEngage and the other store integrations. An app with `project-integrations` alone (GitHub, GitLab and the other repository integrations) is a native integration these tools do not drive; its sync is configured in the Crowdin UI. An app with `api` but not `project-integrations` has methods of its own outside the shared set, and this path cannot call them: with no shell in the session, answer in one line that this app needs the Crowdin CLI (`crowdin app methods` lists what it offers); with a shell, follow `references/cli.md`.

## Tool per step

| Step | Tool | What to know |
|---|---|---|
| 1. Find the app | `list_application_installations`, `get_application_installation` | `permissions.project` as SKILL.md describes |
| 2. Discover | none | the set is fixed; see above |
| 3. Read the tree | `list_integration_files` | entries carry `id`, `name`, `parentId`, `type`, `path`, `tooltip`, `isNew`, `notSynced`, `synced`, `isUpdated`; folders lack `type` |
| 4. Import | `update_crowdin_files` | `files` is an array of trimmed entries, see below; returns `data.jobId` |
| 5. Follow the job | `get_job_info` with `jobId`, repeated; `list_jobs` for history; `cancel_job` to stop one | `list_jobs` returns more than its `limit` asks for |
| 6. Map to Crowdin files | `list_crowdin_files` | IDs are strings here and integers in the tools that take a `fileId` |
| 7. Translate | `apply_pre_translation` and `pre_translation_status`, only when the user asked for pre-translation; `get_integration_file_sync_progress` with the Crowdin `fileId` for progress | |
| 8. Push back | `update_integration_files` | `files` is the map of Crowdin file ID to language codes, `{"34790": ["uk"]}`; overwrites the platform's content |
| Auto-sync | `get_sync_settings`, `update_sync_settings`, each with `provider` | `files` is the array shape for `integration`, the map shape for `crowdin`; the read returns `[]` or `{}` when nothing is scheduled |
| App settings | `get_application_settings`, `update_application_settings` | see "Changing settings" |

## Rules

- **Direction.** `update_crowdin_files` imports from the platform into Crowdin. `update_integration_files` pushes translations out and overwrites what the platform has. Name the direction before calling either.
- **Trim import entries.** `update_crowdin_files` accepts exactly `id`, `name`, `parentId`, `type` per entry (and the aliases `node_type`, `parent_id`) and rejects any other key, so an entry copied whole from `list_integration_files` fails. Select by `path`, then send those four keys with the `id` byte for byte. There is no entry-ID form on this path.
- **Show, then send.** There is no dry run. The confirmation protocol's "show the exact command" is "show the exact tool input as JSON in the conversation", and the call goes out on the user's yes.
- **Follow a job by repeating `get_job_info`.** An agent that cannot wait reports the job as running with its ID.
- **A settings write is a job too.** `update_application_settings` and the sync-settings write return `data.jobId`, of type `integrationSettingsSave`; it finishes at once.

## Changing settings

A settings write replaces the whole settings object, and `update_application_settings` takes `config` as a map of strings: every value is stored as the string it was sent, and the app reads a non-empty string such as `"false"` as true. A boolean setting therefore cannot be written correctly through this tool, and an app's settings are mostly booleans (`translateHidden`, `new-integration-files`, `autoApproveImported`). Change app settings on the app's page in the Crowdin project, and tell the user which setting to flip; use the tool only for an app whose settings are all strings, and then send the full current settings plus the change. There is no settings-schema tool: field meanings come from `get_application_settings` and the app's documentation.

`update_sync_settings` is different: its `files` shapes carry booleans and arrays as JSON, so the auto-sync lists in SKILL.md are written through it, as the current list plus the change.
