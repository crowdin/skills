# Recorded CLI outputs (crowdin CLI, project 12345, Webflow app installed)

Agents cannot run commands in these evals. When an agent "runs" a command, it reads the recorded output here. If a command is not recorded, it says what it expects and continues.

## crowdin app --help (subcommands)
  list                     List installed apps
  install <identifier>     Install the application
  uninstall <identifier>   Uninstall the application
  methods <identifier> [path]  List the application's API methods, or describe one
  api <identifier> <path>  Call one of the application's API methods

## crowdin app api --help
Usage: crowdin app api [options] <identifier> <path>
Call one of the application's API methods
Arguments:
  identifier                  Application identifier, as printed by 'crowdin app list'
  path                        API method path, optionally with a query string
Options:
  -X, --method <method>       HTTP method: GET, POST, PUT, PATCH or DELETE
  -f, --field <field...>      Add a string field as key=value. Repeat 'key[]=value' to send an array
  -F, --typed-field <field...> Add a field as key=value, converting true, false, null and integers, and reading @file
  --input <input>             Read the JSON request body from a file, or '-' for stdin
  --dryrun                    Print the request without sending it
  -o, --output <format>       text | plain | json | toon
  -v, --verbose

## crowdin app list --verbose
webflow Webflow (all own projects) https://webflow.crowdin-apps.com
zendesk-guide Zendesk Guide (projects 12, 12345) https://zendesk-guide.crowdin-apps.com

## crowdin app methods webflow
GET     crowdin-files       Get Crowdin Files
GET     file-progress       File Translation Progress
GET     integration-files   Get Integration Files
POST    crowdin-update      Update Crowdin
POST    integration-update  Update Integration
GET     all-jobs            Job List
GET     job-info            Job Info
DELETE  jobs                Cancel Job
GET     settings/schema     Get App Settings Schema
GET     settings            Get App Settings
POST    settings            Update App Settings
GET     sync-settings       Get Auto-Sync Files
POST    sync-settings       Update Auto-Sync Files

## crowdin app methods webflow crowdin-update
POST crowdin-update  Update Crowdin
Update crowdin data
Body:
  projectId           integer   required  Project Identifier
  files               array               List of integration files and folders
  entryIds            array               List of integration file IDs to sync. Takes precedence over files. Returns 501 if the integration does not support filtering by entry ID.
  uploadTranslations  boolean             Upload exist translation from integration
Example: crowdin app api webflow crowdin-update -X POST -F projectId=<integer>

## crowdin app methods webflow integration-update
POST integration-update  Update Integration
Update integration data
Body:
  projectId  integer  required  Project Id
  files      object   required  {fileId: [languageCode, ...]}, e.g. {"102": ["de","fr"]}
Example: crowdin app api webflow integration-update -X POST -F projectId=<integer>

## crowdin app methods webflow sync-settings -X POST
POST sync-settings  Update Auto-Sync Files
Configure which files should be automatically synchronized based on schedule. Returns a job ID.
Body:
  projectId  integer  required
  provider   string   required  crowdin | integration
  files      array    required

## crowdin app api webflow integration-files -F projectId=12345   (abridged; real output has 25 entries)
{
  "files": [
    {"id": "5f3c2a1b9d8e7f6a0b1ccfda", "name": "Example Site", "path": "/Example Site"},
    {"id": "pages", "name": "Pages", "parentId": "5f3c2a1b9d8e7f6a0b1ccfda", "path": "/Example Site/Pages"},
    {"id": "collections", "name": "Collections", "parentId": "5f3c2a1b9d8e7f6a0b1ccfda", "path": "/Example Site/Collections"},
    {"id": "{\"type\":\"dom\",\"id\":\"5f3c2a1b9d8e7f6a0b1cd013\",\"name\":\"About\",\"slug\":\"about\",\"siteId\":\"5f3c2a1b9d8e7f6a0b1ccfda\",\"siteName\":\"Example Site\",\"primaryLocale\":\"5f3c2a1b9d8e7f6a0b1cd020\"}", "name": "About", "parentId": "pages", "type": "webxml", "path": "/Example Site/Pages/About", "isNew": false, "notSynced": true, "synced": false},
    {"id": "{\"type\":\"collection-item\",\"id\":\"5f3c2a1b9d8e7f6a0b1cd02a\",\"name\":\"Blog Posts\",\"slug\":\"post\",\"siteId\":\"5f3c2a1b9d8e7f6a0b1ccfda\",\"siteName\":\"Example Site\",\"primaryLocale\":\"5f3c2a1b9d8e7f6a0b1cd020\"}", "name": "Blog Posts", "parentId": "collections", "path": "/Example Site/Collections/Blog Posts"},
    {"id": "{\"type\":\"collection-item\",\"id\":\"5f3c2a1b9d8e7f6a0b1cd060\",\"name\":\"10 Quick Tips About Blogging\",\"slug\":\"10-quick-tips-about-blogging\",\"siteId\":\"5f3c2a1b9d8e7f6a0b1ccfda\",\"siteName\":\"Example Site\",\"primaryLocale\":\"5f3c2a1b9d8e7f6a0b1cd020\",\"collectionId\":\"5f3c2a1b9d8e7f6a0b1cd02a\",\"collectionName\":\"Blog Posts\",\"collectionSlug\":\"post\"}", "name": "10 Quick Tips About Blogging", "parentId": "{...Blog Posts id...}", "type": "webxml", "path": "/Example Site/Collections/Blog Posts/10 Quick Tips About Blogging", "isNew": false, "notSynced": true, "synced": false},
    {"id": "{\"type\":\"collection-item\",\"id\":\"5f3c2a1b9d8e7f6a0b1cd061\",\"name\":\"5 Principles Of Effective Web Design\",\"slug\":\"5-principles-of-effective-web-design\",\"siteId\":\"5f3c2a1b9d8e7f6a0b1ccfda\",\"siteName\":\"Example Site\",\"primaryLocale\":\"5f3c2a1b9d8e7f6a0b1cd020\",\"collectionId\":\"5f3c2a1b9d8e7f6a0b1cd02a\",\"collectionName\":\"Blog Posts\",\"collectionSlug\":\"post\"}", "name": "5 Principles Of Effective Web Design", "parentId": "{...Blog Posts id...}", "type": "webxml", "path": "/Example Site/Collections/Blog Posts/5 Principles Of Effective Web Design", "isNew": false, "notSynced": true, "synced": false}
  ],
  "message": ""
}

## Any crowdin-update call that sends entryIds
Error: 'webflow' returned 501: This integration does not support syncing by entry ID. Use the files parameter instead.
(exit code 1)

## Any crowdin-update call without -X POST and without --input
Error: Application 'webflow' is not installed or does not declare 'GET crowdin-update'. Run 'crowdin app methods webflow' to list its methods, and pass --method for anything but GET
(exit code 102)

## crowdin app api webflow crowdin-update --input <file>   (when the body has projectId and a files array of file objects)
{ "jobId": "0f8e7d6c-1111-4222-8333-444455556666" }

## crowdin app api webflow job-info -F projectId=12345 -f jobId=0f8e7d6c-1111-4222-8333-444455556666
{
  "id": "0f8e7d6c-1111-4222-8333-444455556666",
  "info": null,
  "data": "{}",
  "payload": "[{\"id\":\"{\\\"type\\\":\\\"collection-item\\\",...}\",\"name\":\"5 Principles Of Effective Web Design\",...}]",
  "progress": 100,
  "status": "finished",
  "title": "Sync files to Crowdin",
  "type": "updateCrowdin"
}

## crowdin app api webflow crowdin-files -F projectId=12345 -o json   (abridged)
[
  {"id": "1022", "name": "Blog Posts"},
  {"id": "1024", "parentId": "1022", "name": "5 Principles Of Effective Web Design", "type": "webxml", "excludedTargetLanguages": null}
]

## crowdin app api webflow file-progress -F projectId=12345 -F fileId=1024
{ "1024": [ {"languageId": "uk", "name": "Ukrainian", "translationProgress": 100, "approvalProgress": 0} ] }

## crowdin app api webflow integration-update --input <file>   (body {projectId, files: {"1024": ["uk"]}})
{ "jobId": "d1e2f3a4-0000-4000-8000-000000000001" }

## crowdin app api webflow sync-settings -F projectId=12345 -f provider=integration
[ {"id": "{...About page id...}", "name": "About", "schedule": true} ]
