# Connector path

The loop in SKILL.md, run with the Crowdin MCP server's tools. Two generic tools forward a call to an installed app; Crowdin's own tools read the project's rules.

## Calling the app

Both tools take `applicationIdentifier: "lqa-next"` and `path`: the method's path with its query string and no leading slash.

| Method | Tool | `path` |
|---|---|---|
| Get Quality Model | `get_application_data` | `quality-model?projectId=<id>` |
| List Evaluation Scope | `get_application_data` | `evaluation-scope?projectId=<id>&languageId=<language>&onlyNotEvaluated=1`, plus `&taskId=<id>` or `&fileId=<id>`, and `&cursor=<nextCursor>` for the next page |
| Report Error | `add_application_data` | `errors`, with the error as `body` |
| Get Scores | `get_application_data` | `scores?projectId=<id>&languageId=<language>`, plus the scope's `&taskId=<id>` or `&fileId=<id>`, and `&closeEvaluation=1` only to end a run |

- **The answer is wrapped** as `{ "data": … }`: the fields SKILL.md names are inside `data`.
- **`add_application_data` is a write tool.** A session that has only read tools can read the quality model, the translations and the scores but cannot record errors. Say that recording needs a session that can write, and stop there unless the user wants to see what you would report for a few translations.
- **A tool that is not in the session** may belong to a toolset that is not loaded: these two are in `applications`. When the session has `discover_toolsets`, load the toolset with it. Tool names and parameters are as of this writing; if one differs in this session, use the tool that does the same job and read its schema.

## Tool per step

| Step | Tool | What to know |
|---|---|---|
| 1. Find the app | `get_application_installation` with `identifier: "lqa-next"` | Its `modules.api` holds one entry per method, each with a `key`, a `description` and a `documentationUrl`. The four keys are `get-quality-model-api`, `list-evaluation-scope-api`, `report-error-api` and `get-scores-api`. A 404 means the app is not installed: `list_application_installations` with `limit: 500` shows what is (the earlier app is `lqa`) |
| 2. Scope | `get_project_task` for a task's target language; `list_project_tasks` and `list_files` to find the ID of a task or a file the user names | The language can also be the one of the editor the user works in |
| 3. Quality model | Get Quality Model | |
| 4. Rules | `get_project` for the source language, which the concordance tools need. `list_style_guides` with `limit: 500` and `fields: ["aiInstructions"]`, then `get_style_guide` for a whole guide | The listing leaves the instructions out unless they are asked for. Keep the guides of this project (`projectIds` holds it, or is null) and this language (`languageIds` holds it, or is null) and read their `aiInstructions`. The glossary is searched page by page in step 5, not read whole |
| 5. A page | List Evaluation Scope, then `concordance_search_in_glossaries` with `projectId`, `sourceLanguageId`, `targetLanguageId` and `expressions`: the source texts of the page | One call answers with the approved terms those texts contain; split it if the tool refuses that many expressions |
| 6. Doubts | `concordance_search_in_tms` (it also takes `autoSubstitution` and `minRelevant`, for example `false` and `60`), `get_string`, `list_translations` | How the same source was translated before; the string's whole context and its length limit; its other translations |
| 7. Record | Report Error | One call per error; the `body` is the JSON object of SKILL.md step 7 |
| 8. Score | Get Scores | See "Waiting" |
| A question about a score | Get Scores; `list_project_members` finds a translator's user ID | |

## Refusals

A refused call is a failed tool call that carries the HTTP status and the app's `message` and `code`. The app repeats every reason in `message`, so read it rather than guess.

| Answer | Row of SKILL.md's table |
|---|---|
| 404 or 405 with no `code` of the app | The app or the method is not found: Crowdin found no such method in the installation. Step 1's tool shows whether the app is missing or only older |
| 404 `not_found` | 404 from the app |
| 403 `forbidden` | 403 |
| 400 `validation`, 422 `unprocessable` | 400, 422 |
| 5xx, or `crowdin_api` | 5xx |

## Waiting

`wordsState: "pending"` and a 5xx both ask for a pause. A session with a shell pauses with `sleep`. A session without one cannot wait: make the call once more, and if the words are still `pending`, report the errors and say that the same Get Scores call, sent in a minute, closes the run and gives the score.
