# CLI reference

`@crowdin/serverless-apps-cli`, binary `crowdin-serverless-apps`. Outside an app directory, run it with `npx @crowdin/serverless-apps-cli@latest`; inside one, `npx @crowdin/serverless-apps-cli` without a version runs the copy pinned as the app's own devDependency - faster, and guaranteed to match the scaffold - once the app's dependencies are installed. Always name the package: the binary name alone is not a package on npm, so without `node_modules` npx would look it up there.

## Interactive versus non-interactive

The CLI renders a terminal UI when it can and plain text when it cannot. It switches to plain text under `--lite`, when `CI` is set, or when stdio is not a TTY - which is the normal case for an agent shell, so the terminal UI is not something you will hit.

What you do have to handle: commands that need an answer will still wait for one. `create` without `--template` and `--yes` waits on a picker. Pass the flags and nothing blocks.

## Commands

### Develop

| Command | Notes |
|---|---|
| `create [name]` | `--template`, `--yes`. Always pass `--template projects-dashboard-cli`; `projects-dashboard-standalone` exists for apps that own their build and is not what this workflow assumes. Downloads the template, gives the app and all its modules the name you passed, installs the dependencies (pnpm, else bun, else npm), builds the app, registers it and writes `CROWDIN_APP_ID` into `.env`. All or nothing: after a failure it removes the folder it made and has registered nothing, unless Crowdin did not confirm the registration - then the folder stays and the message says how to check and link the app. The install and the build take minutes on a cold cache. No `delete` counterpart exists, so confirm with the user first. |
| `dev` | `--port <n>`, `-y`, `--no-manifest-sync`. Local server with hot reload. It points the registered app at your machine and sends `manifest.json` to Crowdin on start and on every valid save. Leave this to the user; publishing is what an agent should do. |
| `preview` | `--module <key>`, `--project <id\|identifier>`. Opens the app's page in Crowdin, starts no server. Prints `Opening <url>` and attempts to open a browser. For project modules and `editor-right-panel`, omitting `--project` falls back to your first accessible project. |

### Build and publish

| Command | Notes |
|---|---|
| `build` | `--no-extract`, `--no-bundle`. Produces `dist/app.js` and packs it, with `manifest.json` and the rest of `dist/`, into the app file `dist/<slug>.crowdinapp`; the slug comes from the manifest `name`. Crowdin takes app files up to 5 MB, and `build` warns above that. `--no-bundle` skips the app file. |
| `extract` | Scans source for translatable text, updates `locales/*.po`. |
| `publish` | `--no-build`, `-y`, `--no-manifest-sync`. Builds, uploads the app file - manifest and build in one request - and switches Crowdin to serving it. `-y` skips the confirmation; `--no-manifest-sync` uploads without changing where Crowdin loads the app from. |
| `lint` / `format` | Runs the bundled Biome with the shipped config against the app. App-local Biome configs are ignored. |

### Manage

| Command | Notes |
|---|---|
| `list` | `--print`, `--json`. Lists your apps. Doubles as a read-only auth probe. |
| `link` | `--app-id <id>`. Links the working directory to an app that already exists. |
| `manifest validate` | Checks `manifest.json` against the manifest schema, plus forbidden root keys, unknown module types and duplicate keys - and checks `scopes` against the API calls in `src/`, read through the TypeScript compiler and the `@requiredScope` tag of each method in the app's installed `@crowdin/crowdin-api-client`. Offline: no login, no app link; the scope check needs `node_modules` and is skipped with a note without them. **Exit code 1** when invalid, not valid JSON, or a call lacks its scope. Run it after every manifest edit and after writing API calls, before `publish`. |
| `login` | `--file-storage`, `--port <n>` (one of 26140-26144). OAuth in the browser; stores the token. |
| `logout` | Removes the stored token. |

## What reaches Crowdin when

A published app that does not show up usually means Crowdin is still on an older manifest.

- `publish` uploads `manifest.json` and the build together, so `modules`, `scopes`, `name`, `logo` and the rest change on Crowdin with each `publish` and not before. `list --json` shows the manifest Crowdin holds.
- `dev` sends the manifest on start and on every valid save, and points Crowdin at your machine; `publish` points it back at the upload.
- Neither command rewrites `manifest.json`: where Crowdin loads the app from belongs to the installation, not to the file.

So: edit the manifest, run `manifest validate`, then publish.

## Authentication

Credential precedence: OS keychain, then an encrypted file at `~/.crowdin/serverless-apps-cli.json`, then `CROWDIN_PERSONAL_TOKEN` from the environment. The env token is never refreshed, which is fine for a short automated run.

`login` runs OAuth PKCE against `accounts.crowdin.com` with a loopback callback on ports 26140-26144, waits five minutes, and in a non-interactive shell prints the authorize URL as plain text - `open this link (https://accounts.crowdin.com/oauth/authorize?...)`. Start it in the background so you can read that URL and hand it to the user while the command waits.

Crowdin versus Crowdin Enterprise is resolved from the `domain` claim in the token, so there is no `--enterprise` flag to pass. `CROWDIN_BASE_URL` overrides the host if a run needs to target something else.

If the keychain is unavailable in your environment, `login --file-storage` writes to the encrypted file store instead.

## Environment variables

| Variable | Effect |
|---|---|
| `CROWDIN_APP_ID` | Written into the app's `.env` by `create` or `link`; ties the directory to the registered app. |
| `CROWDIN_PERSONAL_TOKEN` | Auth without `login`. Not refreshed. |
| `CROWDIN_BASE_URL` | Override the API host. |
| `CROWDIN_TEMPLATES_REPO` / `CROWDIN_TEMPLATES_REF` | Fetch scaffolding templates from somewhere other than the default repo. |
| `CROWDIN_DEV_CORS_ORIGIN` | Extra allowed origin for the dev server. |
| `CI` | Forces the plain-text path. |

## Toolchain the CLI owns

For `projects-dashboard-cli` apps the CLI supplies Vite, Tailwind, Lingui, Biome and the base tsconfig, and its build settings cannot be overridden: the output is always a single IIFE bundle at `dist/app.js` with CSS injected by JS, because `<bundle-url>/app.js` is the contract the host loads.

A local `vite.config.ts` is merged with those enforced settings; a local `lingui.config.ts` replaces the defaults. Neither is needed unless the user wants something specific, and adding them without a reason only creates a surface that can break. The app's `tsconfig.json` extends `@crowdin/serverless-apps-cli/tsconfig.base.json`.

## App scripts in the scaffold

```bash
pnpm install
pnpm dev            # user-facing local loop
pnpm build
pnpm run publish    # note "run": publish is also an npm builtin
pnpm extract
pnpm lint
pnpm format
pnpm typecheck      # tsc --noEmit
```

`create` has already run the install and the first build. When it installed with npm or bun - the lockfile says which: `pnpm-lock.yaml`, `package-lock.json` or `bun.lock` - run these through that manager: `npm run build`, `npm run typecheck`.

There are no tests in the scaffold, so `typecheck`, `lint` and `manifest validate` are the whole automated safety net. All three must be green before the app goes to the user.
