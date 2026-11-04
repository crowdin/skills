# Translation Savings

This file covers only what cost questions need from this report.

**What it shows.** What TM, MT engines and AI prompts saved, per day. API: `saving-activity` / `group-saving-activity`. Without a savings rates template on the project or workspace only the `relative` mode exists, which counts savings in units at a fixed discount table, not money; the `currency` mode needs that template and takes its rates and currency from it, never from the request.

**How it counts.** Only the first translation of each string version saves, plus approved pre-translations at their full value, and each saving goes to one source in a fixed order (MT engine, then TM, then AI prompt) rather than to the cheapest row, so its AI figure is not Translation cost's AI savings, and Translation cost's figures cannot be produced or checked with it. Savings are gross: the AI bill, MT fees and paid proofreading are not subtracted, so never add savings to costs or call them net.
