# CLI path

SKILL.md's requests, run with `crowdin app api`. Syntax for every `app` subcommand: `crowdin app --help` and `crowdin app api --help`; the `crowdin-cli` skill's command reference lists them, and the read commands used below.

## Requirements

- `crowdin app methods` and `crowdin app api` need the Crowdin CLI 5.4.0 or later: `unknown command 'methods'` means an older install, fixed with `npm install -g @crowdin/cli`.
- The token needs the `application.proxy` scope; exit code 103 means it lacks it, or the user has no access to the app.
- An app call names its project in the request (`projectId`). The other commands below take the project from `crowdin.yml` or from `CROWDIN_PROJECT_ID` in the environment; `file` and `task` also take `-i <projectId>`.

## Calling the app

| Method | Command |
|---|---|
| Get Projects | `crowdin app api lqa-next api-projects -o json` |
| Get Models | `crowdin app api lqa-next api-models -o json` |
| Get Issues | `crowdin app api lqa-next api-issues -F projectId=<id> -F limit=10 -o json` to quote a few, plus the filters the user asked for: a list of IDs with `-f` (`-f languages=<language>`, `-f taskIds=<id>,<id>`), `-F evaluationJobId=<id>`; for the list itself, a larger `-F limit=<n>` and `-F offset=<n>` for the next page |
| Get Quality Model | `crowdin app api lqa-next quality-model -F projectId=<id> -o json` |
| List Evaluation Scope | `crowdin app api lqa-next evaluation-scope -F projectId=<id> -f languageId=<language> -F onlyNotEvaluated=1 -o json`, plus `-F taskId=<id>` or `-F fileId=<id>`, and `-f cursor=<nextCursor>` for the next page |
| Report Error | `crowdin app api lqa-next errors --input - -o json`, with the body on stdin |
| Get Scores | `crowdin app api lqa-next scores -F projectId=<id> -f languageId=<language> -o json`, plus the scope's `-F taskId=<id>` or `-F fileId=<id>`, and `-F closeEvaluation=1` only to end a run |

- **The answer is the app's JSON as it is**: the CLI takes Crowdin's `data` wrapper off, so the fields SKILL.md names are at the top.
- **The verb comes from `-X` or `--input` only.** Without either the call is GET, whatever fields it carries, and its fields go into the query string. `--input` makes it POST, which is what Report Error needs.
- **Put fields after `<app> <path>`**: a field flag takes every following word as a value. `-F` turns integers into numbers; `-f` keeps a value a string, which a language ID and a cursor are.
- **`--dryrun`** prints the request and sends nothing.

## Step by step

1. **Find the app**: `crowdin app methods lqa-next`. It lists the methods the installed app declares; the seven of SKILL.md are `GET api-projects`, `GET api-models`, `GET api-issues`, `GET quality-model`, `GET evaluation-scope`, `POST errors` and `GET scores`, and the others are not for this skill. `Application 'lqa-next' is not installed` (exit code 102) means what it says: `crowdin app list` shows what is installed (the earlier app is `lqa`).
   `crowdin app methods lqa-next errors` describes one method, its parameters and body fields, from the app's own OpenAPI document. The text view cuts each description at its first sentence (`…`); `-o json` carries the full text. This is the description to follow where it differs from SKILL.md.
2. **Scope**: Get Projects gives the projects with LQA, their languages and what the user can do in each; `crowdin task list -o json` gives each task's `id`, `targetLanguageId` and `title`; `crowdin file list -o json` pairs each file's `id` with its `path`.
3. **Quality model**: Get Quality Model.
4. **Rules.** Download them once into a temporary directory, or into `.crowdin/resources/` when the working directory is a project with `crowdin.yml` (the `translate` skill keeps the same files there).
   - Glossary: `crowdin glossary list --assigned -o json`, then `crowdin glossary download <id> --format csv --to <dir>/glossary-<id>.csv` for each. The CSV has one row per concept with a term and a description column per language, small enough to read whole.
   - Style guide: `crowdin style-guide list --assigned --verbose -o json`, then `crowdin style-guide download <id>`, which prints where it saved the file. Keep a guide when its `languageIds` is empty (every language) or holds the target language as a whole item (`en` is not `en-GB`). The CLI gives the guide's document, not its separate AI instructions, so the document is what you read.
   - An empty list means the project has none assigned: that source is unavailable, and no error may rest on it.
5. **A page**: List Evaluation Scope. Look the page's terms up in the glossary CSV, by the source-language column.
6. **Doubts**: only when a doubt needs it and the project's source language is known, a TM language pair: `crowdin tm list --assigned -o json`, then `crowdin tm download <id> --source-language-id <source> --target-language-id <target> --format csv --to <dir>/tm-<id>.csv`, and `grep -i -F -- '<phrase>'` in it. An exact source match shows how the same source was translated before. `crowdin string list --filter '<text>' -o json` finds a string and its context.
7. **Record**: Report Error, see "The error body".
8. **Score**: Get Scores. On `wordsState: "pending"`, `sleep <retryAfterSeconds>` and send the same command again.

The other requests of SKILL.md:

- **A question about a score**: Get Scores. A question about a translator needs their user ID, which the CLI does not list: ask the user for it, or answer for the language, a task or a file.
- **The errors**: Get Issues. `crowdin task list` and `crowdin file list` give the IDs of its `taskIds` and `files` filters; its `translators` filter needs user IDs, as a question about a translator does.
- **Which projects have LQA**: Get Projects.
- **The quality models**: Get Models.

## The error body

The fragment has to reach the app character for character, so the shell must not touch it. Write the body in a heredoc with a quoted delimiter, which turns off every expansion, and escape only what JSON needs (`"` and `\`):

```bash
crowdin app api lqa-next errors --input - -o json <<'EOF'
{
  "projectId": 12345,
  "languageId": "de",
  "stringId": 5012,
  "translationId": 90412,
  "scope": { "taskId": 12 },
  "errorType": "terminology",
  "severity": "major",
  "fragment": "Arbeitsbereich",
  "reason": "The glossary's approved term for \"workspace\" is \"Workspace\"; the translation replaces it.",
  "source": "glossary"
}
EOF
```

A page usually has several errors. Write them as one JSON object per line and send them in one go; each answer is one line with the error's ID and `duplicate`:

```bash
cat > "$dir/errors.jsonl" <<'EOF'
{"projectId":12345,"languageId":"de","stringId":5012,"translationId":90412,"scope":{"taskId":12},"errorType":"terminology","severity":"major","fragment":"Arbeitsbereich","reason":"…","source":"glossary"}
{"projectId":12345,"languageId":"de","stringId":5015,"translationId":90418,"scope":{"taskId":12},"errorType":"accuracy","severity":"major","fragment":"30 Tage","reason":"…","source":"source_text"}
EOF
while IFS= read -r body; do
  printf '%s' "$body" | crowdin app api lqa-next errors --input - -o json | jq -c '{id: .error.id, duplicate}'
done < "$dir/errors.jsonl"
```

A refused line prints the app's message instead and the loop goes on: count the lines answered against the lines sent, and handle each refusal by SKILL.md's table.

## Refusals

The CLI prints the app's own message and exits with a code. The app repeats every reason in the message, so read it rather than guess.

| What you see | Row of SKILL.md's table |
|---|---|
| `Application 'lqa-next' is not installed`, or `Application 'lqa-next' does not declare 'GET <path>'` (exit code 102) | The app or the method is not found. The second one can also be a typo in the path, or a write sent as GET: `declares '<path>' for POST, not GET` asks for `--input` |
| `'lqa-next' returned 404: <message>` (exit code 102 as well: the text tells it from the row above) | 404 from the app |
| `'lqa-next' returned 403: <message>` (exit code 103) | 403 |
| Exit code 103 with `Crowdin refused the call`, and no message of the app | The token lacks the `application.proxy` scope, or the user has no access to the app: a token with that scope, or an organization admin |
| `'lqa-next' returned 400: <message>`, `returned 422: <message>` | 400, 422 |
| `'lqa-next' returned 5xx`, `Crowdin returned 5xx for 'lqa-next'`, or `Request to 'lqa-next' failed with status N` | 5xx |
