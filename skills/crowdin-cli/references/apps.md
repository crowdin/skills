# Crowdin apps and integrations

Integrations (Webflow, HubSpot, Contentful, Zendesk Guide and the like) are Crowdin apps that expose API methods for importing content into Crowdin and pushing translations back. `crowdin app methods` lists and describes an installed app's methods; `crowdin app api` calls them. Syntax for every `app` subcommand: [commands.md](commands.md#app) and `crowdin app api --help`.

Both need a CLI release that has them: `unknown command 'methods'` means an older install, fixed with `npm install -g @crowdin/cli`. The token needs the `application.proxy` scope.

## The integration loop

Most integrations are built on Crowdin's app framework and share one set of methods: `integration-files`, `crowdin-files`, `crowdin-update`, `integration-update`, `job-info`, `all-jobs`, `jobs`, `file-progress`, `settings`, `sync-settings`. Every call takes `projectId`. Work through the steps in order; each ends on its done condition. An app whose methods are not this set is driven through discovery (step 2) and its own list method, with the same rules for bodies, jobs and state changes.

1. **Find the app and the project.** `crowdin app list --verbose -o json`. `permissions.project` says which projects the app may serve: `own` (every project the user owns) or `restricted` with a list of IDs. It does not say which project the integration is connected in, and an unconnected project answers 403. With one ID in a `restricted` list, use it; otherwise ask the user for the project. Done when you hold the app identifier and the project ID.
2. **Discover.** `crowdin app methods <app>`, then `crowdin app methods <app> <path>` for each method you will call. Done when every planned call has its path, verb and required parameters from a description. When a description has no parameters (the app publishes no OpenAPI document), read its documentation link or ask the user. A write goes out with field names taken from a description, the app's documentation, or the user.
3. **Read the integration tree.** `crowdin app api <app> integration-files -F projectId=<id> -o json`. Files carry a `type`; folders do not. Done when each item to import is matched to exactly one entry with a `type`; match on `path`, since names repeat. An entry's `notSynced: true` marks an item never imported into Crowdin, and it turns false after the import; `synced` stays false after an import, so "not yet in Crowdin" is `select(.type and .notSynced)`.
4. **Import into Crowdin.** Build the body from step 3's output with jq and send it with `--input` (see "Request bodies"). Send `entryIds` first; when the app answers 501, send the `files` form. Done when the call returns a `jobId`.
5. **Follow the job.** `crowdin app api <app> job-info -F projectId=<id> -f jobId=<jobId>`, repeated until `status` is `finished` or `failed`. Done when you have seen that status. Report a failed job with its `info`; report a job you stopped polling as still running, with the command to check it. `failed` with `info` "Finished with errors. See error logs." can still have delivered part of the work, and those logs are not in the API: send the user to the app's page in the Crowdin project to read them.
6. **Map to Crowdin files.** `crowdin app api <app> crowdin-files -F projectId=<id> -o json`, matched by name under the right parent folder. Crowdin file IDs are different from the integration's IDs. Done when each imported item has its Crowdin file ID.
7. **Translate.** In Crowdin: `crowdin auto-translate` (see SKILL.md) or the project's translators. `auto-translate --file` takes the file's Crowdin path, not its ID: `crowdin file list -o json` pairs each `id` with its `path`. `file-progress -F fileId=<crowdinFileId>` reports translation and approval progress per language, keyed by the file ID: `jq --arg id <crowdinFileId> '.[$id][] | {languageId, translationProgress, approvalProgress}'`. Done when every target language shows the progress the user asked for, or the user says to push as is.
8. **Push back.** `integration-update` with `{"projectId": <id>, "files": {"<crowdinFileId>": ["uk"]}}` through `--input`, then step 5 again. Done when the push job is `finished`.

## Request bodies

- **The verb comes from `-X` or `--input` only.** Without either the call is GET, whatever fields it carries. Writes (`crowdin-update`, `integration-update`, settings) need `-X POST` or `--input`.
- **Fields build flat bodies** (`-f`, `-F`, `key[]=value` for arrays; see `--help`). Put them after `<app> <path>`: a field flag takes every following word as a value.
- **Nested bodies go through `--input`**: a file, or `-` for stdin. That covers `files` arrays of objects and `integration-update`'s map.
- **Opaque IDs are copied, never written.** An entry ID is whatever string the app returned, and it can be JSON text full of quotes and apostrophes (Webflow's is). A Webflow, HubSpot or other platform ID on its own matches nothing. Select entries with jq from the app's own output so every byte survives:

```bash
crowdin app api webflow integration-files -F projectId=12345 -o json \
  | jq --argjson p 12345 --arg path "/Example Site/Collections/Blog Posts/5 Principles Of Effective Web Design" \
      '{projectId: $p, files: [.files[] | select(.type and .path == $path)]}' \
  > body.json
crowdin app api webflow crowdin-update --input body.json --dryrun   # shows the request, sends nothing
crowdin app api webflow crowdin-update --input body.json
```

Webflow takes this `files` form, whole entries as the app returned them. An app that syncs by entry ID takes their `id` instead: `entryIds: [.files[] | select(...) | .id]`. Pass names and paths with `--arg`, never inside the jq program, so quotes in them cannot break the shell.

## Calls that change state

`crowdin-update` and `integration-update` change content in Crowdin or in the external platform. `settings` POST, `sync-settings` POST and `jobs` DELETE change the app's configuration or stop work. Run a state-changing call only when the user asked for that change.

### Auto-sync and schedules

`sync-settings` holds two lists, one per `provider`:

| `provider` | Direction | `files` shape |
|---|---|---|
| `integration` | Platform to Crowdin: these items are imported on schedule | Array of entries from `integration-files`, each with `"schedule": true` |
| `crowdin` | Crowdin to platform: these files' translations are pushed on schedule | Map of Crowdin file ID to languages, `{"1024": ["uk"]}` |

A POST **replaces** the whole list for its provider and turns on a sync schedule when none is set. The schedule's frequency is in `settings` (`settings/schema` describes the fields), and a `settings` POST replaces the settings too. When the app offers `new-integration-files` in its settings schema, turning it on adds new platform items to auto-sync as they appear; that is how "every new blog post" is expressed.

A settings change goes out only after the user has seen it in the conversation:

1. GET the current value: `sync-settings` with the same `provider`, or `settings`.
2. Build the new body as the current value plus the change, with jq from the GET output.
3. Show the user the before and after and the exact command, with `--dryrun` output.
4. Send it when the user confirms. When the user is away, the run ends at step 3: report the prepared body and the command to send it.

## Errors

The CLI prints the app's own message when the app sends one. Exit codes are the CLI's usual ones (SKILL.md).

| What you see | Meaning | Next |
|---|---|---|
| `'<app>' returned 4xx: <message>` | The app rejected the request | Fix the request per the message |
| `'<app>' returned 501: ... does not support syncing by entry ID` | The app cannot filter by entry ID | Send the `files` form (step 4) |
| `... is not installed or does not declare 'GET <path>'` (exit 102) | Wrong verb far more often than a missing app | Add `-X POST` or `--input`; `crowdin app methods <app>` lists the declared verbs |
| Exit 103 | The token lacks `application.proxy` | A token with that scope |
| `Request to '<app>' failed with status N` | The response carried no readable message | Report the status and the command; the app gave no details |

## Job results

`job-info` returns `status`, `progress`, `info` and the job's `payload` and `data`. Some apps store `payload` and `data` as JSON text, sometimes encoded more than once; decode with `jq '.payload | fromjson'`, repeating `fromjson` while the result is still a string.
