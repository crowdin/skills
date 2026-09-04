#!/usr/bin/env node
// The OpenAI plugin directory limits that can drift as skills are added or edited
// (https://developers.openai.com/plugins/deploy/submission-errors). Everything else
// in the manifest is set once and is checked by the portal on upload.
// Usage: node scripts/openai/validate.mjs [plugin-root]
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? path.join(import.meta.dirname, "../.."));
const errors = [];

const manifest = JSON.parse(fs.readFileSync(path.join(root, ".codex-plugin/plugin.json"), "utf8"));
if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/.test(manifest.version ?? "")) errors.push(`version "${manifest.version}" is not semver`);

const skills = fs.readdirSync(path.join(root, "skills"), { withFileTypes: true }).filter((d) => d.isDirectory());
for (const { name: dir } of skills) {
  const rel = `skills/${dir}/SKILL.md`;
  if (!fs.existsSync(path.join(root, rel))) { errors.push(`${rel} is missing`); continue; }
  const fm = fs.readFileSync(path.join(root, rel), "utf8").match(/^---\n([\s\S]*?)\n---\n/)?.[1] ?? "";
  const field = (k) => fm.match(new RegExp(`^${k}:[ \\t]*(.+)$`, "m"))?.[1].trim() ?? "";
  const name = field("name"), description = field("description");
  if (!name || !description) errors.push(`${rel}: front matter needs name and description`);
  if (description.length > 1024) errors.push(`${rel}: description is ${description.length} chars; maximum 1024`);
  if (`${manifest.name}:${name}`.length > 64) errors.push(`${rel}: "${manifest.name}:${name}" is longer than 64 chars`);
}

for (const e of errors) console.error(`error: ${e}`);
console.log(`${errors.length ? "FAILED" : "OK"}: ${skills.length} skills — ${manifest.name}@${manifest.version}`);
process.exit(errors.length ? 1 : 0);
