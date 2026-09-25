# Format families

Reached from `SKILL.md` step 1 (finding the gaps), step 4 (writing drafts and the ledger) and step 5 (validating the file). One rule covers every format; this file shows what the rule looks like in the families that come up most, so the agent recognizes it faster, and says what to do with a format it does not list.

## The rule

A **gap** is an entry present in the source file with no non-empty counterpart in the target file, in that format's own notion of an entry — plus any entry the format itself marks as needing work. A target file that does not exist yet is all gaps. A target value that merely equals the source is **not** a gap by itself: `OK` is `OK` in German, and a CI export made without `--skip-untranslated-strings` fills every untranslated key-value entry with source text, which is exactly why step 2 passes that flag before counting.

A **draft** is written into the target file in place, mirroring the source file's structure: same entry order, quoting, indentation, headers and comments, changed only where the translated text goes. A new target file mirrors the source file's structure entirely. The source file is never touched.

A **plural** is written in the format's own plural mechanism, with exactly the categories `crowdin language list --verbose` printed for the target language.

## The families

| Family | Typical files | A gap looks like | Plurals look like | Also preserve | Validate with |
|---|---|---|---|---|---|
| gettext PO | `messages.po`, `*.po` | `msgstr ""`, any empty `msgstr[n]`, or a `#, fuzzy` flag (re-draft it and drop the flag); `#~` obsolete entries are left alone | `msgid_plural` with `msgstr[0]…msgstr[n-1]` in the order the header's `Plural-Forms` defines — that header must agree with the CLI's categories | header block, `#:` references, `#.` comments, `msgctxt`, line wrapping style | the library's compile step (`lingui compile` for Lingui), else `msgfmt -c` |
| key-value: JSON, YAML, `.properties`, Apple `.strings` | `en.json`, `en.yml`, `messages.properties`, `Localizable.strings` | key missing from the target, or present with an empty value | ICU inside one string (`{count, plural, one {…} other {…}}`) or the library's own sibling keys (`_one`, `_other`, `one:`/`other:`) — follow whichever the source uses | key order, nesting, escapes, trailing newline | `jq` for JSON, `yq` for YAML, `plutil -lint` for `.strings` |
| Android XML | `res/values*/strings.xml` | `<string name="…">` absent from the target file | `<plurals name="…"><item quantity="one">…</item>…</plurals>`, one `item` per category | `translatable="false"` strings are never gaps; escaped apostrophes, `\n`, `%1$s` ordering | `xmllint --noout` |
| Apple stringsdict and xcstrings | `Localizable.stringsdict`, `Localizable.xcstrings` | a key with no entry for the language, or an empty `stringUnit` value | stringsdict: `NSStringPluralRuleType` dictionaries with one key per category; xcstrings: `variations.plural` with one key per category | `NSStringFormatSpecTypeKey`, `%#@variable@` names | `plutil -lint` |
| ARB | `app_en.arb` | key missing from the target | ICU inside the string, as in key-value | `@key` metadata blocks are source-only, never copied into the target unless the source's target files already carry them | `jq` |

## Library checks

Some libraries ship a catalog check that applies the rule for you, and when one exists it beats reading the files. Lingui, from 6.8 on, has two:

- `lingui check sync` proves the source catalog matches the code. A failure means `lingui extract` has not run; run it before the upload in step 2, because uploading a stale catalog and drafting against it is wasted work. Mirror the flags the team extracts with (`--clean`, `--overwrite`), or the check compares against output the team never produces.
- `lingui check missing --locale <locale> --mode catalog --verbose` lists that locale's gaps before drafting, and after the write it must exit `0`: that is the proof that no gap was left behind. `--mode catalog` matters: the default resolved mode hides a gap whenever a fallback locale covers it.

An older Lingui reports an unknown command; then the rule above applies as for any PO file. What the two commands do in depth belongs to the `lingui-best-practices` skill, not to this file.

## A format not listed here

Read the source file and its target sibling (if one exists) and apply the same rule: what is one entry, what makes it empty, how does this format spell a plural, and what surrounds the text that must survive. When the format's notion of an entry is unclear — a document format, a binary, a custom syntax — stop and ask rather than guess. Document formats (Markdown, HTML, DOCX) are outside this skill by design: they are documents, not keyed strings.

## The drafts ledger

Every draft is appended to `.crowdin/translate/drafts-<language id>.jsonl` before it is written into the target file, one JSON object per line:

```json
{"file":"src/locales/de/messages.po","key":"Order","source":"Order","target":"Bestellen"}
{"file":"res/values-uk/strings.xml","key":"items_count","source":{"one":"%d item","other":"%d items"},"target":{"one":"%d елемент","few":"%d елементи","many":"%d елементів","other":"%d елемента"}}
{"file":"src/locales/de/messages.po","key":"Log","skipped":"noun or verb; no reference into the code"}
```

- `file` is the target file path; `key` is the format's own identifier for the entry (msgid, JSON path, XML `name`).
- `source` and `target` are strings for plain entries and category-keyed objects for plurals. For ICU-in-a-string plurals, the ledger holds the branch texts by category, not the whole ICU expression — that is what lets the check compare placeholders per form.
- A skipped entry carries a `skipped` reason and no `target`.

The ledger is format-neutral, so `scripts/check-drafts.sh` checks a PO catalog and an Android file identically. It is the audit trail, the input to step 5, the source of the per-language table, and what a per-language worker hands back. It is transient: the next run for that language overwrites it.
