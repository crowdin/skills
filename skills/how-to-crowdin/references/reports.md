# How the built-in reports are calculated

The rules behind Crowdin's seven built-in reports: Cost estimate, Translation cost, Auto-Translation accuracy, Translator accuracy, Task usage, Time spent and Top members. For each: what it counts, which date puts work into the period, which settings change the result, and how the usual "why is this number what it is" questions resolve. Crowdin Store app reports, the Overview page and AI usage reports are not covered.

## Using this file

1. **Identify the report** from its page title, its API name or the symptom, using the table below. The report page's "Discuss with Copilot" button sends `Explain how the "<Report name>" report is calculated.`, or `Explain how my saved "<Report name>" report (ID: <ID>) is calculated.` when the result on the page was saved; that ID is the report archive ID. The project, if any, comes from the page Copilot was opened on, not from the text; a workspace or organization report names no scope.
2. **Pin the product and the level:** crowdin.com or Crowdin Enterprise, project or workspace (Enterprise only). When the answer differs and you cannot tell, give both.
3. **Read the archive when there is an archive ID.** The Crowdin connector's report archive tools do this: `get_report_archive` (or its organization variant in Crowdin Enterprise) returns the archive's `name`, `scopeType`, `scopeId`, `createdAt` and `scheme`, the settings it was generated with (dates, unit, languages, rates, options; Time spent leaves some out, see its section). For the numbers, export it (`export_report_archive`) and download the export (`download_report_archive`). An archive is a snapshot that is never recalculated, so generating the report again today can give different numbers.
4. **Without an archive ID, ask before you compute.** Task usage and Top members are never archived, and a report that was not generated or not saved has no ID. How a report is calculated needs no data: for that, go on to step 5 without asking for any. To explain the user's own numbers, first ask what their page shows: the period, the language and other filters, the workspace or projects when the report is not in a project, and which number puzzles them and its value. Say why you ask: there is no saved result to read back. Skip what their message already says. Then generate the same report through the connector or the API with those settings (API report names are in the table) and explain from that result in step 6. Never generate with defaults and present the result as theirs: without dates an API report covers everything since the project or workspace was created, while the page has its own default period (see The period). Even with the same settings the result can differ from the page: check its section here for what the API counts differently (Task usage's languages, for one), and data changed since the page was generated can change the numbers too (each section says which); say so when they do not match.
5. **Check the report's section in Crowdin's documentation.** This file was checked against the product in October 2026 and may fall behind; the documentation is maintained with the product. Fetch one page, chosen by product and by where the report was opened:
   - crowdin.com, in a project (any report but My Contribution): `https://support.crowdin.com/project-reports/`
   - crowdin.com, My Contribution: `https://support.crowdin.com/contributor-reports/`
   - Enterprise, in a project (any report but My activity): `https://support.crowdin.com/enterprise/project-reports/`
   - Enterprise, outside a project (a workspace or the whole organization; the documentation calls it Organization Reports): `https://support.crowdin.com/enterprise/organization-reports/`
   - Enterprise, My activity: `https://support.crowdin.com/enterprise/contributor-reports/`

   Read the section headed with the report's name (My Contribution and My Activity have their own). A fetch tool ignores the `#` part of a URL, so name the section in the request and ask for its settings, options and columns in the page's own words. Task usage has no section on the crowdin.com pages, and Cost estimate none on the organization page. When step 2 left the product or level open, fetch the page for each. Do not use the documentation text sets from `catalogs.md` here: they run to megabytes and keep the crowdin.com and Enterprise pages under the same titles.

   Weigh the two this way. For anything this file states (how something is counted, a default, who sees what), follow this file: it was checked against the product rule by rule, while the documentation describes reports more in outline, so do not repeat a documentation statement that contradicts this file. Follow the documentation for what this file does not name, such as a setting, option, column or report, or a setting in an archive's `scheme` that is missing here; it may be newer than this file. The user's own numbers outrank both: when an archive or a report generated with their settings contradicts a rule here, say this file may be out of date and explain from the numbers.
6. **Answer from the report's section here** and from the documentation where step 5 says so: the rule first, then the user's case or numbers. When a rule depends on a setting, name the setting and its value in the archive or in the settings the user gave. When something is not counted at all, say so plainly.
7. **Do not fill gaps from intuition.** These reports often behave differently from what their column names suggest; when neither this file nor the documentation answers a question, say so rather than guess.

| Report | Levels | API report name (project / workspace) | Archived |
|---|---|---|---|
| Cost estimate | project | `costs-estimation-pe` / none | yes |
| Translation cost | project, workspace | `translation-costs-pe` / `group-translation-costs-pe` | yes |
| Auto-Translation accuracy | project, workspace | `pre-translate-accuracy` / `group-pre-translate-accuracy` | yes |
| Translator accuracy | project, workspace | `translator-accuracy` / `group-translator-accuracy` | yes |
| Task usage (Enterprise only) | project, workspace | `task-usage` / `group-task-usage` | no |
| Time spent | project, workspace | `time-spent` / `group-time-spent` | yes |
| Top members | project, workspace | `top-members` / `group-top-members` | no |

crowdin.com capitalizes the page names (Cost Estimate, Top Members). Members who are neither managers nor language coordinators see Translation cost as My Contribution (crowdin.com) or My activity (Enterprise), and Cost estimate only by task: it covers all of the task's strings, not only their share. Auto-Translation accuracy archives saved before match scores existed show older metrics (Edit rate, Average Edit Distance), not covered here, under the same API name; `pre-translate-efficiency` is only a deprecated API alias that generates the current report.

## Rules shared by all reports

### Two kinds of data

- **A record of actions.** Translation cost and Top members read their own records, written when someone saved a translation, approved one, or voted (not the project's Activity feed). Deleting the translation, removing the approval or cancelling the vote later removes nothing, so the work still counts.
- **The current state.** Cost estimate, Auto-Translation accuracy and Translator accuracy read strings, translations and approvals as they are at generation time, so a removed approval or deleted translation changes the next run (a Cost estimate generated again with the same settings can reuse a recent result; see its section).
- Task usage reads tasks, and Time spent reads time logged in task comments; neither looks at translations.

### Units

- Words, strings and characters are counted on the **source text**, not the translation; the only exception is Top members' Target column.
- Each Chinese or Japanese character is a word, a URL is one word, punctuation alone is not a word. Tags are left out according to the project's tag detection setting. Characters never include line breaks; "characters" also leaves out spaces and tabs.
- Plural strings: in Translation cost, Translator accuracy and Top members every translated plural form is a separate entry that carries the volume of the string's main source text (the other source forms are not added), so in the strings unit one plural string counts once per form. Cost estimate and Auto-Translation accuracy count a plural string once.

### The period

- The UI sends whole days in the viewer's time zone and defaults to the last 30 days (Cost estimate: since the project was created). Through the API dates are UTC, and without them the period runs from the project's or workspace's creation to now. Both ends are included.
- Each report decides with its own date:

| Report | The date that puts something into the period |
|---|---|
| Cost estimate | the string was added or its source last changed |
| Translation cost | the person's first save of a translation for that string; the approver's first approval |
| Auto-Translation accuracy | the auto-translation was created, or last edited in place |
| Translator accuracy | the person's translation was created, or last edited in place |
| Task usage | the task was created; the Resolved line uses the task's resolved date (set when it is first marked Done or Closed, or entered on the task) |
| Time spent | time was first logged on that task comment |
| Top members | first translation, first approval, first vote; votes received use the voter's first vote on the string, and Winning the approver's first approval of it |

### Rates and currency

- The currency is a label. Nothing is converted.
- A rate is a price per selected unit (per hour in Time spent). A Net Rate Scheme row is a percentage of the full translation rate; 101% (perfect) means a 100% match whose context also matches. A match outside every row is No match, priced at 100%.
- Custom rates are checked in list order and the **first** matching row wins, even when a more specific row follows. A row for a member and language matches; so does a row for a member with no languages, or for a language with no members.
- Rate templates only fill the form; an archive's `scheme` holds what was actually used.

### Access, languages and labels

- Members who are neither managers nor language coordinators see only their own work in Translation cost and Time spent. A language coordinator sees everyone's work in their languages, except in Time spent on crowdin.com.
- At project level, "all languages" means the project's current target languages, or a language coordinator's own languages, so work in a language later removed from the project drops out. Top members and the Task usage page (not its export) ignore both limits.
- At workspace level "all languages" has no such limit, except in Auto-Translation accuracy and Translator accuracy, which cover only languages that are still a target of at least one of the workspace's projects.
- Label filters: "with selected labels" keeps strings that have all of them; "without selected labels" drops only strings that have all of them.

### Workspace level (Enterprise)

A workspace report covers the projects of the workspace and its nested workspaces; the organization level covers all projects. The rules are the same, one person's numbers are summed across projects, and there are no file, branch, label or workflow step filters. Cost estimate has no workspace level.

## Cost estimate

**What it shows.** What the remaining work will cost, per target language or per task: **Translation** for strings not translated yet, **Proofreading** for strings not approved yet, a Subtotal per language and the Total, plus TM Savings, Weighted units and a breakdown by match category and file. Nobody's past work is counted.

**Settings that change the result.**
- Strings added (date range): strings created **or** last modified in the range. It is not the date of any translation.
- Language, files, folders and branches, labels, the Workflow step filter (Enterprise). Tasks: one estimate per task in its language, without the other filters.
- Unit, currency, Full translation and Proofread rates, custom rates per language. Net Rate Scheme for TM only: 101% (perfect), 100%, ranges from 40% to 99%.
- **Calculate internal fuzzy matches** and **Include auto-translated strings**.
- Project settings: assigned TMs with their priorities and penalties, TM suggestions from dialects, auto-substitution, the duplicates strategy, tag detection, languages excluded per file.

**How it counts.**
- *Translation:* visible strings in active files not fully translated in that language (a plural string until every form is). Any existing translation takes the string out, whoever made it and however. *Include auto-translated strings* (off by default) adds unapproved strings whose only translations are TM, MT or AI pre-translations.
- Each such string is looked up in the project's TM by source text and context; the best match is rounded down, and below 40% is no match. When it is below 100%, the string is also compared with strings added earlier (in the selected files, or the task): an exact repeat is a **Repetition**, priced at the TM 100% row (perfect when the context matches too); with internal fuzzy matches on, a 40% or closer earlier string is an **Internal match**, priced with the TM rows, used only when higher than the TM match.
- Translation = units × Full translation rate × row percentage, summed. An estimate has no MT or AI categories.
- *Proofreading:* the units of every visible string in scope without an approved translation, translated or not, × the Proofread rate, with no TM discount. A string nobody has translated yet counts both here and in Translation.
- Total = Translation + Proofreading. TM Savings = units × Full translation rate × (100% − row percentage) over the TM rows and the Repetition and Internal match rows; it is already taken off Translation and is shown separately (under each language's or task's Subtotal on the page, in its own column in the export), never added to the Total or subtracted from it. Weighted = units × row percentage, rounded up per row and file.
- *Task mode:* a translation task gets only Translation, a proofreading task only Proofreading. A task created with **Create Cost Estimate Report** and a rates template gets the result as its Estimated cost when the task is created (a follow-up task that waits for the previous one: when it starts) and again whenever an edit changes its strings, not as work progresses and not when it is reopened. A newer estimate for the task generated by a manager and saved to the archive also replaces it.

**Common questions.**
- *A string has several translations.* None is counted: the estimate prices remaining work. The first translation takes the string out of Translation; it stays in Proofreading until approved.
- *The string was translated in different ways.* Typed, inserted from a TM, MT or AI suggestion, uploaded or added through the API, it is translated and not estimated. The one exception is a string whose only translations are auto-translations (pre-translations, or translations added through the API as pre-translated), with Include auto-translated strings on and no approval.
- *Several people, or one person several times.* There are no people in this report; each string counts at most once per language in each part.
- *Approvals.* Who approved does not matter, so self-approval changes nothing. A removed approval returns the string to Proofreading in the next estimate; a deleted last translation returns it to Translation too.
- *Generated again, same numbers.* An estimate with the same settings can reuse the earlier counts instead of recounting: when there has been no activity in the project since then (uploading to a TM is not activity), or when the earlier run is very recent (within ten times its generation time, at most an hour). Changing the date range, language, files, labels or options forces a recount.
- *Hidden strings and duplicates.* Hidden strings, including duplicates hidden by the duplicates strategy, are not counted. When the project translates duplicates automatically, a duplicate follows its main string; otherwise each duplicate is counted, and later copies land in Repetitions unless the TM already has a 100% or perfect match for them.
- *Why the later Translation cost differs.* The estimate knows only TM and repetitions at generation time and prices the rest as No match, counts each string once with one proofreading pass, has per-language rates only, and filters by when strings were added, not when work was done.

**crowdin.com and Enterprise.** On crowdin.com a string counts as approved when its translation has been approved. On Enterprise one approval is enough even when the workflow has several proofreading steps, so the estimate budgets one pass. Enterprise only: the Workflow step filter, and on steps after **Switch source language** (or for tasks on them) the intermediate language's translation is the source text, so strings not yet translated into that language are left out. There is no workspace level.

## Translation cost

**What it shows.** What to pay translators and proofreaders for the period, per member and language. **Translation & Post-editing** splits translated source volume into No match, TM match, MT match, AI match and Other translations match rows, each with its rate and price; **Proofreading** prices approvals; Total adds both. **Savings (TM, MT and AI)**, **Weighted** and **Auto-translated** are informational. My activity (Enterprise) and My Contribution (crowdin.com) are this report limited to the viewer's own work.

**Settings that change the result.**
- Date range, or Tasks for task mode. Languages, members, files, folders and branches, labels, the Workflow step filter (Enterprise project), projects (workspace). Group by changes only the layout.
- Unit, currency, Full translation and Proofread rates, custom rates by member and/or language.
- Net Rate Schemes: TM (perfect, 100%, ranges from 40%), MT, AI and Other translations (ranges from 1% to 100%).
- **Use category-based approval rates**, **Exclude approvals for edited translations**, **Use specific categories for auto-translations**, **Use edit distance for TM Net Rate Scheme**. On the page they start from the saved rates or the rates template applied; when nothing has been saved, the first three are on and the last off (rates saved before these options existed load Use category-based approval rates off and the other two on; a new rates template starts with all four off). Through the API all four default to off, so pass them when generating the report again. Exclude approvals for edited translations and Use specific categories for auto-translations are announced to become always on, with no way to turn them off, from January 4, 2027.

**How it counts.**
- It reads its record of actions, not the current translations.
- *One paid translation per person, string, language, plural form and source version.* Saving again does not pay again; the date and the match values stay from the first save. If the source text changes, the new version is paid again.
- *Pre-translations are never paid.* TM, MT or AI pre-translation, manual or automatic, shows only in Auto-translated, under the account the pre-translation ran under.
- *Matches, recorded at the first save in the Editor:* **TM match** is measured in one of two ways, chosen by **Use edit distance for TM Net Rate Scheme**. With the option off, it is how similar the **source** is to the best TM suggestion Crowdin showed this translator for the string (or, if it showed them none, the best one shown to anyone for that string), whatever the translator then saved, so even a translation unlike every suggestion gets that TM row. With the option on, it is how similar the **saved text** is to the closest translation among the TM suggestions in this translator's Editor at their first save, whichever one they used: a TM translation saved unchanged is 100%, and a text unlike all of them falls below the TM rows. **MT**, **AI** and **Other translations match** are how similar the saved text is to the MT suggestions, AI suggestions and existing translations shown. Unchanged text is 100%. The API records only the TM match, by source; uploads record no match at all, so an uploaded translation is always No match, at 100% of the Full translation rate.
- *The row:* each match is looked up in its own scheme, matches outside every row drop out, and the **cheapest** remaining row wins (ties: TM, MT, AI, Other); none left is No match at 100%. Cost = units × Full translation rate × row percentage.
- *Approvals:* one paid approval per approver, string, language, plural form and source version, at the Proofread rate per unit. With category-based approval rates (on by default on the page, off through the API), an approval is priced as an identical translation at the 100% row of the approved translation's category: TM perfect stays perfect (TM 100% with Use edit distance for TM Net Rate Scheme), other TM matches use TM 100%, and an approved No match translation uses Other translations 100%.
- *Exclude approvals for edited translations* drops an approval when the approver has any translation record on the same string, language and plural form: at any time, by any method (including an upload or a pre-translation run under their account), whichever version they approved.
- *Use specific categories for auto-translations:* when the closest existing translation is a pre-translation, the Other translations match is priced in the TM, MT or AI scheme instead.
- *Use edit distance for TM Net Rate Scheme:* the TM match compares the saved text with the TM suggestions this translator had in the Editor (see Matches), not with those shown to others. The perfect row is not used: every TM match is capped at 100%, also for approvals priced with category-based approval rates. Translations saved before the option existed, saved with no TM suggestion in the Editor, or added through the API fall back to source similarity, still capped at 100%. The option changes only Translation cost's TM rows, and with them its Savings and Weighted; Cost estimate is unaffected.
- *Savings:* for the first translation of each string (per language, plural form and source version) across all people, not counting pre-translations, Full translation rate × units × (100% − row percentage); plus the full value of an approved pre-translation when nobody had translated the string before it was approved. Later translators of the same string add no savings. Despite the name, Other translations matches count too.
- *Task mode:* the work of everyone, not only assignees, on strings ever in the task, in the task's language, from the task's creation until now. A task created with **Create Translation Cost Report** and a rates template gets this as its Actual cost when it becomes Done or Closed; a newer task report generated by a manager and saved to the archive replaces it.

**Common questions.**
- *A string has several translations.* Every person who saved a translation of it is paid once for it, whether their translation was approved, top-voted, or later deleted. Votes are not read. Three translators on one string are three paid translations. There is no setting to pay only for the approved translation, and Top members' Winning does not replace one: it is source volume with no rates and no TM, MT or AI rows, dated by the approval, counted once per approver, and kept after the approval is removed. One string can also have several approved translations: on Enterprise each proofreader holds one approval per string, language and plural form, so two proofreaders can approve two different translations; on crowdin.com each proofreading step holds one. So do not offer Winning, an export or another report as a way to pay only for approved work; if paying several translators for one string is the concern, the fix is in how the work is assigned (one translator per string), not in the report.
- *The string was translated in different ways.*

| How | Paid? | Row |
|---|---|---|
| Typed by hand in the Editor | yes, to the translator | the cheapest that applies: TM by source match (with Use edit distance, by similarity to the TM translations shown), MT, AI or Other by similarity to what was shown; otherwise No match |
| TM suggestion inserted | yes | TM row of the source match (with Use edit distance: TM 100% if unchanged, the row of the remaining similarity if edited), unless a cheaper row applies |
| MT or AI suggestion, unchanged | yes | MT or AI 100%, unless a cheaper row applies |
| MT or AI suggestion, edited | yes | the MT or AI row of the remaining similarity |
| A pre-translation edited in the Editor | yes | Other translations by similarity to it; TM, MT or AI with Use specific categories for auto-translations |
| TM, MT or AI pre-translation, also one added through the API as pre-translated | no | Auto-translated only |
| Uploaded translation file | yes, to the uploader | No match (100%) |
| Added through the API | yes, to the token's owner | TM row by source match (at most TM 100% with Use edit distance) or No match |

- *Several people, or one person several times.* Each person is paid once per string. A later translator's text is compared with the translations already there, so it often lands in a cheaper Other translations row. A later translation unlike the others is not therefore No match: by default it still gets the TM row of its source match, or an MT or AI row; No match is only when no row applies. One person re-translating, or editing their translation in place with Replace in translations, is not paid again, and their match values stay as written at their first save: later saves never update them.
- *Approvals.* Each approver is paid once, even across several workflow steps, at the Proofread rate or, with category-based approval rates (on by default on the page), at the 100% row of the approved translation's category; approving again adds nothing. Removing the approval or deleting the approved translation does not take the payment back. Self-approval is paid unless Exclude approvals for edited translations is on.
- *Deleted and hidden strings* still count, including strings deleted from files in the file filter. Work in the project's source review language does not.
- *Which date.* Translated in March and approved in May: the translation is in March's report, the approval in May's.

**crowdin.com and Enterprise.** Same calculation; crowdin.com has the project level only and names the option Use category-based proofread rates. Enterprise adds the workspace level (grouped by member or language, a person's work is summed across projects; grouped by project, each project shows separately with its languages and members, with the same cost totals; Weighted units are rounded up per row, so their total can come out slightly higher) and the Workflow step filter, which keeps strings linked to that step without checking at which step the work was done; on steps after Switch source language, the intermediate language's text is the source.

## Auto-Translation accuracy

**What it shows.** How often auto-translations were approved unchanged, and how much the others were edited, in sections for AI (per prompt), MT (per engine) and TM (all memories together): Total, 100% Match, {lowest}-99% Match, Avg. Match Score, No Match, Quality Score, and a chart by the auto-translation's date. The page lists at most 10 prompts and 10 MT engines, those with the most strings; the export includes all of them. No people, rates or costs.

**Settings that change the result.**
- The period, language, files and labels (project), projects (workspace), unit, and **Match Score Categories** (web UI defaults: 99-90% on Enterprise; 99-90% and 89-80% on crowdin.com). A report generated through the API without `matchScoreCategories` has no bands, so every edited string is No Match; the archive's `scheme` shows the categories actually used.
- **Tasks** replace the period, language, files and labels: the report takes the strings of each selected task in that task's language, with no date limit. Each task is counted separately and the page adds them up, so a string in two selected tasks counts twice. Enterprise lets you select several tasks; crowdin.com one task or all tasks that are not closed.

**How it counts.**
- *Counted:* strings whose current translation is approved and that have an auto-translation created in the period, no later than that approval. An auto-translation is a TM, MT or AI pre-translation, run by hand, automatically, by a workflow step, or added through the API as pre-translated.
- *The reference* is the current approved translation. Enterprise picks the one with the most approvals, then votes, then the latest approval; crowdin.com the one approved at the furthest workflow step, then the latest approval, then votes.
- The approved translation is the auto-translation itself, or has identical text: **100% Match**. Otherwise the match score is the character similarity of the two texts, 100% × (1 − changed characters ÷ length of the longer text), rounded down; case, spaces, punctuation and tags count, and a text over 3000 characters scores 0. The score falls into a Match Score Category, or into **No Match** below all of them.
- One result per string and language (or task). When a string has several auto-translations from the period (for example MT, then AI added alongside it) or several approved plural forms, their match scores are averaged, but the whole string is credited to only one of them: its section (TM, MT engine or AI prompt), its chart date, and whether it counts as 100% Match or edited. Which one is not fixed, so such a string can appear under MT as edited even though the AI translation was approved unchanged.
- Avg. Match Score averages the edited strings within the bands; Quality Score is roughly (unchanged + edited × their score) ÷ Total, No Match counting as zero.

**Common questions.**
- *A string has several translations.* Only auto-translations are evaluated, and several of them on one string are merged into one result as described above. Human translations count only when one is approved, as the reference. Votes only break ties when choosing the reference.
- *The string was translated in different ways.* Accepting an MT or AI suggestion in the Editor, typing, uploading and copying the source are human translations and are not evaluated.
- *Several people.* Not applicable: results belong to TM, an MT engine or an AI prompt, never to a person.
- *Approvals.* Not approved yet means not counted. A removed approval drops the string from the next run. Pre-translations approved automatically (TM pre-translation with auto-approve, AI Pipeline auto-approve) count as 100% Match without any human check. If the approved translation is replaced, the next run compares with the new one. On Enterprise one approval is enough.
- *Edited in place* (Replace in translations in the Editor, or editing a translation through the API), an auto-translation stays the same auto-translation, dated by the edit, so approving it afterwards gives 100% Match: the report never sees the text as it was auto-translated. Edited after its approval, it drops out.
- *Which date.* The auto-translation's creation date, or its last in-place edit; the approval may come after the period, as long as it is before the report is generated. With tasks selected there is no date limit.
- *Hidden strings* are counted.

**crowdin.com and Enterprise.** Same calculation; the reference choice and default bands differ as above. Enterprise adds the workspace level, which sums each language across projects.

## Translator accuracy

**What it shows.** How close each translator's translations are to the final approved text: per language and translator, the share of 100% Match, of each match band and of No Match. No rates or costs.

**Settings that change the result.** The period, language, members (the translators), files and labels (project), projects (workspace), unit, and Match Score Categories with the same defaults as Auto-Translation accuracy. The chart labels the bands "Edit distance", but they are match score ranges.

**How it counts.**
- *Counted:* strings whose current translation is approved; for each, every translation a person added in the period and no later than the approval, except TM, MT and AI pre-translations. The reference is chosen as in Auto-Translation accuracy.
- The person's translation is the approved one: 100% Match. Otherwise its character similarity to the approved text puts it in a band or in No Match.
- *One result per person, string, plural form and language:* their approved version, or else their closest one.

**Common questions.**
- *A string has several translations.* Each author is scored once against the approved text: the author of the approved one gets 100% Match, the others get their similarity. The page shows only per-translator charts; in exports, a language's Total counts the string once per translator.
- *The string was translated in different ways.* Typing, copying the source, and inserting a TM, MT or AI suggestion in the Editor all count as the person's own translation. Uploaded translations count for the uploader, API translations for the token's owner, unless the API call marks them as pre-translated. Pre-translations are no one's work, but an approved one serves as the reference.
- *Several people, or one person several times.* Each person is counted separately, once per string. A translator whose version lost to another translator's still gets a match score against the approved text, so it lands in a band or in No Match even though nobody edited it.
- *Approvals.* The report does not check who approved, so a self-approved translation is a 100% Match. On Enterprise one approval is enough, even when the workflow asks for more. If the approved translation is later replaced, the next run scores everyone against the new one; when the string no longer has an approved translation, it drops out. A translation added after the approval is ignored.
- *Deleted and hidden.* Deleted translations are not counted; hidden strings are.
- *Which date.* The person's translation's creation date. Editing it in place (Replace in translations) moves the date to the edit and keeps the author, so a translation edited after its string was approved drops out.

**crowdin.com and Enterprise.** Same calculation. crowdin.com filters one member at a time; Enterprise allows several. Enterprise adds the workspace level, which merges each translator's results per language across projects.

## Task usage (Enterprise only)

**What it shows.** Statistics about **tasks**, not translations, in five views with their own filters and exports: **Workload**, **Created vs resolved**, **Task performance**, **Task completion time** and **Task cost**. Not archived.

**Settings that change the result.** The period, group by, language, task type, created by, assignee, task size in words (completion time), statuses (Task cost), projects (workspace). On the page, all languages covers tasks in every language; a project-level export or API report covers only the project's current target languages (or a language coordinator's languages).

**How it counts.**
- Each task counts once in each figure; only Workload grouped by member counts it for each of its assignees. The period selects tasks by **creation date** in every view; only the Resolved line of Created vs resolved selects by the task's resolved date.
- Words are the task's size recorded when it was created or its strings last changed, not the live word count on the task page.
- *Workload:* tasks created in the period, by current status (To Do, In Progress, Done, Closed); Total also includes Pending and For Approval tasks, so it can exceed the four columns, and their words are in neither volume. Active volume is the words of To Do and In Progress tasks, throughput volume of Done and Closed. Grouped by member, a task counts fully for each assignee.
- *Created vs resolved:* tasks created and tasks resolved in the period. The page's graph shows running totals from the start of the period (each point is everything created or resolved up to that day, or month for long periods); the export and the API give per-day counts. The comparison with the previous period shows only in the UI.
- *Task performance:* tasks with a due date. Open overdue: still open and past due when the report is generated. Closed on time or overdue: resolved before or after the due date (exactly at it counts as neither). On-time rate, on the page only: closed on time ÷ (closed on time + closed overdue), rounded to a whole percent.
- *Task completion time:* completion = resolved − created, waiting = started − created, active work = resolved − started, overdue = resolved − due date for tasks resolved after it. Completion time is shown as average, median, 80th percentile and maximum; waiting, active work and overdue time as averages. Each figure uses only the tasks that have the dates it needs.
- Started is set at the first move to In Progress, Done or Closed, and resolved at the first move to Done or Closed; reopening resets neither, but both dates can be set or changed on the task (started and resolved dates) or through the API, and the report uses the stored dates.
- *Task cost:* only tasks with a saved cost, summed per currency. A task gets a saved cost when someone with manager access generates a Translation cost or Cost estimate report for tasks, or automatically through the task's Create Cost Estimate Report and Create Translation Cost Report options. The Actual cost (the task's translation plus proofreading total from the latest Translation cost report for it) wins over the Estimated cost (from the latest Cost estimate for it: the translation part for translation tasks, the proofreading part for proofreading tasks). Active columns cover only To Do and In Progress tasks; words are task sizes.

**Common questions.**
- *Translations, approvals, people translating a string.* Not read, except through a task's saved cost, which follows Translation cost or Cost estimate rules.
- *Created before the period, finished in it:* only in the Resolved line.
- *No cost:* the task is absent from Task cost, not even zero. Deleting a cost report from the archive removes the cost it saved; the task then uses its other saved cost, if any, or drops out of Task cost (an older report's cost does not come back). A deleted task disappears everywhere.

**Project and workspace.** A workspace (or the organization) covers its projects and nested workspaces and can group by project; grouped by member, a person gets one row per project.

## Time spent

**What it shows.** Time members logged on tasks in the period and its cost at your hourly rates.

**Settings that change the result.** The period, tasks, language, task type, members, the Workflow step filter (Enterprise project), projects (workspace), the base hourly rate (0 by default) and custom hourly rates by member and/or language. Group by changes only the layout, except for time from deleted tasks (below); the currency is only a label.

**How it counts.**
- **Nothing is tracked automatically.** The report sums only time typed into **Log time** on a task comment, or sent as time spent with a task comment through the API. Crowdin has no Editor timer of its own and no per-string time.
- Each comment is one entry, credited to the comment's author, with the task's language, project, type and workflow step.
- Cost of a row = seconds × hourly rate ÷ 3600, rounded to 4 decimals; totals add the rounded rows. The UI shows time rounded to minutes; exports show it exactly.

**Common questions.**
- *Several translations, translation methods, approvals.* Not applicable: the report never looks at translations, and automatic work logs no time.
- *Several people on a task, or one person coming back.* Each entry counts for whoever logged it, managers included; a person's entries add up, with no deduplication or cap.
- *Which date.* When time was first logged on that comment. Changing the amount later keeps the entry in its original period; setting it to zero or deleting the comment removes it from every report generated afterwards, past periods included, while archived results keep it.
- *A deleted task* keeps its logged time. Grouped by task, all of it appears in one row labelled REMOVED_TASKS, where per-language rates cannot apply. Selecting All tasks lists existing tasks, so that time drops out.
- *The task page total differs:* it sums its assignees' time ever logged; the report covers the period, its filters and every author.
- *Reading an archive.* Its saved settings never show the language or task type filter, and when tasks were selected they also leave out the period, members and workflow step, although all of these were applied. A missing value there does not mean the filter was off; say it is unknown.

**crowdin.com and Enterprise.** Same calculation. Managers see everyone's time; on Enterprise, project language coordinators do too, limited to their languages. Other members, including language coordinators on crowdin.com, see only their own time. Enterprise adds the workspace and organization levels and the Workflow step filter.

## Top members

**What it shows.** Members ranked by activity in the period: Translated, Target, Approved, Voted, "+" and "−" votes received, Winning, Languages, and Joined (crowdin.com) or Given access (Enterprise). No rates or costs; not archived.

**Settings that change the result.** The period, language, unit (words by default), projects (workspace), and sorting, which changes the rank only. A search by name or username narrows the list before ranking, so a member found by it can show as rank 1.

**How it counts.**
- It reads its record of actions, not the project's Activity feed.
- **Translated:** source volume of strings the person translated, once per string, language, plural form and source version, dated by their first save; pre-translations are not counted.
- **Target:** words or characters of the person's latest translation of those strings, even one made after the period.
- **Approved:** source volume of strings the person approved, dated by their first approval, including approvals of pre-translations, auto-approval on upload and pre-translation with auto-approve (credited to whoever ran it).
- **Voted:** the number of strings the person voted on, up or down, once per string and language (each plural form separately), dated by their first vote on it.
- **Votes received:** for each voter, only their latest vote on a string counts, and only when it is on the person's latest translation of that string; it is dated by the voter's first vote on that string. Votes on a pre-translation go to the account that ran it.
- **Winning:** source volume of the person's translations that were approved, once per approver, dated by that approver's first approval of the string. It counts only while the approved translation is still the person's latest translation of the string and the approver's latest approval there; approved pre-translations give no Winning.

**Common questions.**
- *A string has several translations.* Every author gets Translated for it; Approved goes to each approver, and Winning to the author of each approved translation, once per approver. On Enterprise different proofreaders can approve different translations of one string, so several authors can get Winning for it.
- *The string was translated in different ways.* Typing, TM, MT or AI suggestions in the Editor, copying the source, the API and uploads all count as Translated for whoever saved or uploaded. Pre-translations, including translations added through the API as pre-translated, give no one Translated or Winning; approving one still counts as Approved (also for whoever ran a pre-translation with auto-approve), and votes on one go to the account that ran it.
- *Several people, or one person several times.* Each person counts once per string and language; re-translating adds nothing. A person who first translated the string before the period and rewrote it in the period does not get it in that period.
- *Approvals.* Several approvers each get Approved, and the author gets Winning once per approver. Self-approval counts as both Approved and Winning. A removed approval, a deleted translation or a cancelled vote subtracts nothing.
- *Past periods can change:* Target, votes received and Winning follow each person's latest action on the string; Translated, Approved and Voted do not change.
- *Who is listed.* With all languages, every listed member, including those with no activity; with one language, members with no activity in it are hidden.

**crowdin.com and Enterprise.** Same calculation. crowdin.com lists everyone who has ever been a member of the project, including removed ones. Enterprise lists current members plus the project owner, managers, owners of parent workspaces, organization administrators and technical accounts; members removed from the project are not listed, so their work is not shown. Enterprise also adds the workspace level, which sums across projects.
