# Command outputs (Crowdin CLI 5.6.0, project 12345, the LQA app installed)

Agents cannot run commands in these evals. When an agent "runs" a command, it reads the output here. If a command is not recorded, it says what it expects and continues.

The LQA app's answers (the quality model, the pages, the recorded error, the scores and the refusals) have the shape and the messages the app gave in its own test suite on 2026-11-25; their content (the project, its strings, the numbers) is written for these evals. The method list and the method descriptions are what the CLI's text view prints for the app's manifest and OpenAPI document, put together from both. The outputs of the other commands are written for these evals. None of it is recorded from a live installation yet.

The project is "Flowdesk Web", source language English, target languages German (`de`), Polish (`pl`) and Ukrainian (`uk`). The working directory has no `crowdin.yml`; `CROWDIN_PROJECT_ID=12345` and a token with the `application.proxy` scope are in the environment.

## crowdin app list --verbose
◆  webflow Webflow (all projects) https://webflow.app.crowdin.net
◆  lqa-next Linguistic Quality Assurance (LQA) (all projects) https://lqa.example.com

## crowdin app methods lqa-next
◆  GET api-projects  Get Projects
◆  POST api-projects  Add Project
◆  DELETE api-projects  Delete Project
◆  GET api-models  Get Models
◆  POST api-models  Add Model
◆  DELETE api-models  Delete Model
◆  GET api-templates  Get Templates
◆  POST api-templates  Upload Template
◆  DELETE api-templates  Delete Template
◆  POST api-reports  Generate Report
◆  GET api-reports-status  Check Report Status
◆  GET api-reports-download  Download Report
◆  GET api-issues  Get Issues
◆  GET quality-model  Get Quality Model
◆  GET evaluation-scope  List Evaluation Scope
◆  POST errors  Report Error
◆  GET scores  Get Scores

## crowdin app methods lqa-next quality-model
GET quality-model  Get Quality Model
A project's quality model: its error types, its severities with their weights, the allowed penalty points
Docs: https://lqa.example.com/api-docs#tag/Evaluation/operation/evaluation.qualityModel
Parameters:
  projectId  query  integer  required  The Crowdin project id.
Example:
  crowdin app api lqa-next quality-model -F 'projectId=<integer>'

## crowdin app methods lqa-next evaluation-scope
GET evaluation-scope  List Evaluation Scope
The translations of a language, task or file to evaluate, page by page
Docs: https://lqa.example.com/api-docs#tag/Evaluation/operation/evaluation.scope
Parameters:
  projectId         query  integer  required  The Crowdin project id.
  languageId        query  string   required  The target language, a Crowdin language id such as `de` or `pt-BR`.
  taskId            query  integer            Only the strings of this task…
  fileId            query  integer            Only the strings of this file…
  onlyNotEvaluated  query  string             1 leaves out the translations already evaluated: those the app's AI checked, and those with an error an AI agent recorded through Report Error…
  cursor            query  string             The previous page's `nextCursor`…
  limit             query  integer            The page size, 25 by default and at most 50.
Example:
  crowdin app api lqa-next evaluation-scope -F 'projectId=<integer>' -F 'languageId=<string>'

## crowdin app methods lqa-next errors
POST errors  Report Error
Record an error an AI agent found in a translation
Docs: https://lqa.example.com/api-docs#tag/Evaluation/operation/evaluation.reportError
Body (application/json):
  projectId      integer      required  The Crowdin project id.
  languageId     string       required  The target language of the translation, a Crowdin language id such as `de` or `pt-BR`.
  stringId       integer      required  The source string: `stringId` of the List Evaluation Scope item.
  translationId  integer      required  The translation that has the error: `translationId` of the same item…
  scope          object                 What is being evaluated, the same as in List Evaluation Scope: `{ "taskId": <id> }`, `{ "fileId": <id> }` or `{}` for the whole language…, default {}
  errorType      string       required  An error type of the project's quality model, by `key` or `name` in any case…
  severity       string       required  A severity of the project's quality model, by `key` or `name` in any case.
  fragment       string       required  The wrong part of the translation, copied from it character for character (case-sensitive)…
  reason         string       required  One sentence that names the rule and what the fragment does wrong.
  source         string       required  The ground of the error, one of `glossary`, `style_guide`, `tm`, `source_text`, `language_rule`, `context`.
  comment        string|null            What a reviewer should know beyond the reason…, default null
Example:
  crowdin app api lqa-next errors -X POST -F 'projectId=<integer>' -F 'languageId=<string>' -F 'stringId=<integer>' -F 'translationId=<integer>' -F 'errorType=<string>' -F 'severity=<string>' -F 'fragment=<string>' -F 'reason=<string>' -F 'source=<string>'

## crowdin app methods lqa-next scores
GET scores  Get Scores
The score of a language, translator, task or an AI agent's evaluation
Docs: https://lqa.example.com/api-docs#tag/Evaluation/operation/evaluation.scores
Parameters:
  projectId        query  integer  required  The Crowdin project id.
  languageId       query  string   required  The target language, a Crowdin language id such as `de` or `pt-BR`.
  taskId           query  integer            A task: its errors whatever their date against its words…
  translatorId     query  integer            A translator, by user id: the errors in translations they made in the period against their translated words.
  fileId           query  integer            Only the errors and words of this file.
  dateStart        query  string             The start of the period, a UTC date-time such as `2026-01-31T00:00:00Z`…
  dateEnd          query  string             The end of the period, a UTC date-time, included.
  closeEvaluation  query  string             1 scores and closes the caller's running evaluation of the scope (`taskId`, `fileId` or neither) and answers with its numbers…
Example:
  crowdin app api lqa-next scores -F 'projectId=<integer>' -F 'languageId=<string>'

## crowdin file list -o json
```json
[
  { "id": 31, "path": "/web/messages.json" },
  { "id": 77, "path": "/web/onboarding.json" }
]
```

## crowdin task list -o json
```json
[
  { "id": 12, "targetLanguageId": "de", "title": "Proofread the onboarding flow" }
]
```

## crowdin app api lqa-next quality-model -F projectId=12345 -o json
```json
{
  "model": {
    "key": "mqm-core",
    "name": "MQM Core",
    "version": 1,
    "severities": [
      { "key": "minor", "name": "Minor", "weight": 1, "description": "Noticeable, but the meaning and use are intact" },
      { "key": "major", "name": "Major", "weight": 5, "description": "Changes the meaning or makes the text hard to use" },
      { "key": "critical", "name": "Critical", "weight": 25, "description": "Dangerous, misleading or blocks use" }
    ],
    "errorTypes": [
      { "key": "terminology", "name": "Terminology", "description": "A term is used that differs from the approved glossary or from the usual term of the domain." },
      { "key": "accuracy", "name": "Accuracy", "description": "The translation does not carry the meaning of the source: it adds, omits or changes content." },
      { "key": "linguistic-conventions", "name": "Linguistic conventions", "description": "The text breaks the grammar, spelling, punctuation or word-order rules of the target language." },
      { "key": "style", "name": "Style", "description": "The wording does not follow the style guide or reads awkwardly, though it is correct and clear." },
      { "key": "locale-conventions", "name": "Locale conventions", "description": "A format specific to the target locale, such as a date, number, currency or unit, is wrong." },
      { "key": "audience-appropriateness", "name": "Audience appropriateness", "description": "The content is unsuitable, offensive or culturally inappropriate for the target audience." },
      { "key": "design-and-markup", "name": "Design and markup", "description": "Formatting, tags or placeholders are broken, missing, moved or changed, or the text does not fit its layout." }
    ]
  },
  "allowedPenaltyPoints": 10
}
```

## crowdin glossary list --assigned -o json
```json
[
  { "id": 2, "name": "Flowdesk", "languageId": "en" }
]
```

## crowdin glossary download 2 --format csv --to <dir>/glossary-2.csv   (the saved file)
```csv
Term [en],Description [en],Term [de],Description [de],Term [uk],Description [uk]
Flowdesk,The product's name. Do not translate,,,,
workspace,The shared area where a team keeps its boards,Arbeitsbereich,,робочий простір,
invoice,The monthly bill of a paid plan,Rechnung,,рахунок-фактура,
trial,The free period of a paid plan,Testphase,,пробний період,
```

## crowdin style-guide list --assigned --verbose -o json
```json
[
  { "id": 4, "name": "Flowdesk German", "projectIds": "12345", "languageIds": "de" },
  { "id": 6, "name": "Flowdesk Ukrainian", "projectIds": "12345", "languageIds": "uk" }
]
```

## crowdin style-guide download 6   (it saves "Flowdesk Ukrainian.md" in the working directory; the file)
```markdown
# Flowdesk: українська

- Звертайтеся до користувача на «ви» з малої літери, ніколи на «ти».
- Лапки: «ялинки», не "прямі".
- Дати: ДД.ММ.РРРР.
- Назву продукту Flowdesk не перекладайте.
```

## crowdin app api lqa-next evaluation-scope -F projectId=12345 -f languageId=uk -F onlyNotEvaluated=1 -F fileId=77 -o json
```json
{
  "items": [
    { "stringId": 6021, "translationId": 91021, "source": "Open your workspace", "translation": "Відкрийте свою робочу область", "context": "Button", "file": "/web/onboarding.json", "translator": "translator.c", "evaluated": false },
    { "stringId": 6022, "translationId": 91022, "source": "You have %d unread messages", "translation": "У вас %s непрочитаних повідомлень", "context": "%d is a number", "file": "/web/onboarding.json", "translator": "translator.c", "evaluated": false },
    { "stringId": 6023, "translationId": 91023, "source": "Click \"Save\" to continue.", "translation": "Натисни \"Зберегти\", щоб продовжити.", "context": "Hint under the form", "file": "/web/onboarding.json", "translator": "translator.d", "evaluated": false },
    { "stringId": 6024, "translationId": 91024, "source": "Payment received", "translation": "Платіж отримано", "context": "Status label", "file": "/web/onboarding.json", "translator": "translator.d", "evaluated": false },
    { "stringId": 6025, "translationId": 91025, "source": "Your plan renews on 03/04/2026.", "translation": "Ваш план буде поновлено 03.04.2026.", "context": "The date is March 4, 2026: the source writes it as MM/DD/YYYY", "file": "/web/onboarding.json", "translator": "translator.c", "evaluated": false }
  ],
  "total": 5,
  "nextCursor": null
}
```

## Any crowdin app api lqa-next errors --input … -o json
Every Report Error call of these evals is answered like this one, with the values of the call; `id` counts up from 4201 and `duplicate` is `false`. The example answers the report of string 6021.
(abridged: the fields the previous version of the app's API had, at the end of the record, are left out)
```json
{
  "error": {
    "id": 4201,
    "languageId": "uk",
    "stringId": 6021,
    "fileId": 77,
    "fileName": "/web/onboarding.json",
    "translationId": 91021,
    "source": "Open your workspace",
    "translation": "Відкрийте свою робочу область",
    "fixed": null,
    "subsegment": "робочу область",
    "spanStart": 15,
    "spanEnd": 29,
    "errorType": "Terminology",
    "severity": "Major",
    "severityWeight": 5,
    "comment": null,
    "translatorId": 23,
    "translatorName": "translator.c",
    "proofreaderId": null,
    "proofreaderName": null,
    "authorId": 7,
    "authorName": "the.user",
    "origin": "copilot",
    "aiReason": "The glossary's approved term for \"workspace\" is \"робочий простір\"; the translation replaces it.",
    "aiSource": "glossary",
    "modelKey": "mqm-core",
    "modelVersion": 1,
    "occurredAt": "2026-11-25T10:14:03.770Z",
    "translatedAt": "2026-11-18T09:00:00.000Z",
    "taskIds": [],
    "createdAt": "2026-11-25T10:14:03.739Z",
    "updatedAt": "2026-11-25T10:14:03.739Z",
    "projectId": 12345
  },
  "duplicate": false
}
```

## crowdin app api lqa-next scores -F projectId=12345 -f languageId=uk -F fileId=77 -F closeEvaluation=1 -o json   (the first call)
Crowdin is still counting the file's words, so the run stays open.
```json
{
  "words": null,
  "wordsState": "pending",
  "retryAfterSeconds": 15,
  "wordsError": null,
  "penaltyPoints": 17,
  "perThousand": null,
  "score": null,
  "passed": null,
  "allowed": 10,
  "errors": {
    "total": 5,
    "bySeverity": {
      "Minor": 2,
      "Major": 3
    },
    "byType": {
      "Terminology": 1,
      "Style": 2,
      "Locale conventions": 1,
      "Design and markup": 1
    },
    "byAi": 5
  },
  "evaluationJobId": 319,
  "evaluation": null
}
```

## The same command, sent again after the wait
```json
{
  "words": 640,
  "wordsState": "ok",
  "wordsError": null,
  "penaltyPoints": 17,
  "perThousand": 26.57,
  "score": 97.34,
  "passed": false,
  "allowed": 10,
  "errors": {
    "total": 5,
    "bySeverity": {
      "Minor": 2,
      "Major": 3
    },
    "byType": {
      "Terminology": 1,
      "Style": 2,
      "Locale conventions": 1,
      "Design and markup": 1
    },
    "byAi": 5
  },
  "evaluationJobId": 319,
  "evaluation": null
}
```

## crowdin app api lqa-next scores -F projectId=12345 -f languageId=pl -o json
```json
{
  "words": 18400,
  "wordsState": "ok",
  "wordsError": null,
  "penaltyPoints": 219,
  "perThousand": 11.91,
  "score": 98.8,
  "passed": false,
  "allowed": 10,
  "errors": {
    "total": 39,
    "bySeverity": {
      "Minor": 14,
      "Major": 21,
      "Critical": 4
    },
    "byType": {
      "Terminology": 17,
      "Accuracy": 9,
      "Linguistic conventions": 8,
      "Style": 3,
      "Design and markup": 2
    },
    "byAi": 26
  },
  "evaluationJobId": null,
  "evaluation": null
}
```

## Refusals
The CLI prints the app's message and exits with a code.

| Call | What the CLI prints |
|---|---|
| Any call for a project where LQA is not enabled | `■  'lqa-next' returned 404: Project not found` (exit code 102) |
| Any call by a user who is not a member of the project | `■  'lqa-next' returned 403: You are not a member of this project` (exit code 103) |
| List Evaluation Scope or Get Scores for a language the user has no access to | `■  'lqa-next' returned 403: You have no access to this language in the project` (exit code 103) |
| Report Error by a user who is neither a proofreader of the language nor a project manager | `■  'lqa-next' returned 403: Only proofreaders of this language and project managers can annotate errors` (exit code 103) |
| Report Error with a fragment that is not in the translation | `■  'lqa-next' returned 422: The request cannot be applied. fragment: The fragment is not in the translation` (exit code 1) |
| Report Error with a reason over the limit | `■  'lqa-next' returned 400: Validation failed. reason: Too big: expected string to have <=300 characters` (exit code 1) |
| A write sent without `--input` and without `-X POST` | `■  Application 'lqa-next' declares 'errors' for POST, not GET. Pass -X POST or --input` (exit code 102) |
| A path the app does not declare | `■  Application 'lqa-next' does not declare 'GET <path>'. Run 'crowdin app methods lqa-next' to list its methods` (exit code 102) |
| An app that is not installed | `■  Application '<identifier>' is not installed` (exit code 102) |
