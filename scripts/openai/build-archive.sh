#!/usr/bin/env bash
# Packs the skills-only ZIP for the OpenAI plugin directory: .codex-plugin/plugin.json
# (without mcpServers, which the directory does not accept), assets/, skills/ without
# the eval harnesses, and LICENSE. Usage: scripts/openai/build-archive.sh [out-dir]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="${1:-$ROOT/dist}"
MANIFEST="$ROOT/.codex-plugin/plugin.json"

node "$ROOT/scripts/openai/validate.mjs" "$ROOT"
read -r NAME VERSION < <(node -p 'const m = require(process.argv[1]); `${m.name} ${m.version}`' "$MANIFEST")

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
mkdir -p "$STAGE/.codex-plugin"
node -p 'const m = require(process.argv[1]); delete m.mcpServers; JSON.stringify(m, null, 2)' "$MANIFEST" > "$STAGE/.codex-plugin/plugin.json"
cp -R "$ROOT/assets" "$STAGE/assets"
cp "$ROOT/LICENSE" "$STAGE/LICENSE"
rsync -a --exclude evals --exclude evals.json --exclude '*-workspace' --exclude .DS_Store "$ROOT/skills/" "$STAGE/skills/"

mkdir -p "$OUT"
ZIP="$OUT/$NAME-plugin-$VERSION.zip"
rm -f "$ZIP"
(cd "$STAGE" && zip -qrX "$ZIP" .codex-plugin assets skills LICENSE)
echo "Built $ZIP ($(unzip -Z1 "$ZIP" | grep -c .) entries)"
