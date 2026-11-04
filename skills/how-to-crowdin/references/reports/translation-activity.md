# Translation activity

This file covers only what cost and delay questions need from this report.

**What it shows.** Words, strings and characters translated, and approved, per language and per day (periods up to 62 days) or month, with the parts of the translated text that came from TM, MT or AI (pre-translations and suggestions inserted in the Editor alike) and the rest as human. API: `translation-activity` / `group-translation-activity`. No rates or costs.

**How to read it.** It counts every save, by every translator, re-saves included, so it is activity, not delivered words, and never progress on a past date. It covers the whole project, every branch and file. Through the API a `languageId` is accepted but not applied: take the language from the result. Use it for volume trends, the TM, MT and AI share of saved text, and MT volume, the only MT figure Crowdin has; the words of a price per word come from Translation cost.
