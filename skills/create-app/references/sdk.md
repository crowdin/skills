# SDK: verified snippets

Every snippet here is taken from a scaffold that builds and runs, not from memory. Prefer copying and adapting these over recalling the SDK surface, because the failure mode is expensive: a plausible method that does not exist costs a debug cycle, and a wrong registration shape produces a blank iframe with nothing in the console.

For the current surface - which methods exist, what the context carries, which editor actions are available - fetch the docs: [building-app/overview.md](https://crowdin.github.io/serverless-apps/building-app/overview.md), [context.md](https://crowdin.github.io/serverless-apps/building-app/context.md), [crowdin-api.md](https://crowdin.github.io/serverless-apps/building-app/crowdin-api.md), [host-actions.md](https://crowdin.github.io/serverless-apps/building-app/host-actions.md), [user-interface.md](https://crowdin.github.io/serverless-apps/building-app/user-interface.md), [i18n.md](https://crowdin.github.io/serverless-apps/building-app/i18n.md). This page is the empirical layer underneath them: shapes copied from a build that runs, and the failures the docs do not mention.

Import paths are partitioned on purpose. The root export is framework-free; React, the UI kit and Lingui live behind their own subpaths.

| Import | What it holds |
|---|---|
| `@crowdin/serverless-apps-sdk` | `prepare*`, `ModuleContract`, `resize`, `redirect`, host methods, editor RPCs |
| `@crowdin/serverless-apps-sdk/api` | `createCrowdinClient()` - a pre-authenticated Crowdin API client |
| `@crowdin/serverless-apps-sdk/react` | `useCrowdinContext()` |
| `@crowdin/serverless-apps-sdk/ui` | shadcn-style components, `AppUiProvider`, `ui/theme.css`, `ui/styles.css` |
| `@crowdin/serverless-apps-sdk/i18n` | `AppI18nProvider` |

## Entry point

`src/index.tsx` does nothing but register. Keep the calls at the top level: the dispatcher fires once in a single microtask, so anything registered inside a callback, a promise or a `useEffect` is simply never seen.

```tsx
import "./styles.css";
import {
  prepareOrganizationMenu,
  prepareProfileResourcesMenu,
} from "@crowdin/serverless-apps-sdk";
import dashboard from "./modules/dashboard";

prepareOrganizationMenu(dashboard);
prepareProfileResourcesMenu(dashboard);
```

## A module

A module is `{ render }`. Mount React into `#root` and wrap it in both providers - i18n resolves the host locale, and the UI provider injects the host's theme variables, without which the components look unthemed.

```tsx
import "@crowdin/serverless-apps-sdk/ui/styles.css";
import type { ModuleContract } from "@crowdin/serverless-apps-sdk";
import { AppI18nProvider } from "@crowdin/serverless-apps-sdk/i18n";
import { AppUiProvider } from "@crowdin/serverless-apps-sdk/ui";
import { createRoot } from "react-dom/client";
import { App } from "./app";

async function render() {
  const root = createRoot(document.getElementById("root") as Element);
  root.render(
    <AppI18nProvider>
      <AppUiProvider>
        <App />
      </AppUiProvider>
    </AppI18nProvider>,
  );
}

const dashboard: ModuleContract = { render };
export default dashboard;

if (import.meta.hot) {
  import.meta.hot.accept("./app", () => {
    void render();
  });
}
```

`src/styles.css` is two lines, and the order matters - Tailwind first, then the SDK theme:

```css
@import "tailwindcss";
@import "@crowdin/serverless-apps-sdk/ui/theme.css";
```

Import either `ui/theme.css` (raw Tailwind source, what CLI-built apps use) or `ui/styles.css` (prebuilt), never both.

## Calling the Crowdin API

`createCrowdinClient()` returns a real `@crowdin/crowdin-api-client` whose HTTP layer goes through the host bridge. There is no token to pass and nothing to configure: the host runs each call under the session of the user who opened the app, inside the manifest scopes.

```tsx
import { createCrowdinClient } from "@crowdin/serverless-apps-sdk/api";
import { useCrowdinContext } from "@crowdin/serverless-apps-sdk/react";
import { useEffect, useMemo, useState } from "react";

export function App() {
  const client = useMemo(() => createCrowdinClient(), []);
  const { isEnterprise } = useCrowdinContext();
  const [projects, setProjects] = useState<unknown[]>([]);

  useEffect(() => {
    client.projectsGroupsApi
      .withFetchAll()
      .listProjects({})
      .then((res) => setProjects(res.data.map((d) => d.data)));
  }, [client]);

  return <div>{projects.length}</div>;
}
```

Create the client once (`useMemo`) rather than per render. Use `.withFetchAll()` on list calls to page through everything instead of hand-rolling pagination.

Scopes do not always follow the verb of the operation. Some read-shaped endpoints are `POST` calls and the backend guards them at write level, so the narrow `:read` scope gets a 403: glossary concordance search (`POST /projects/{id}/glossaries/concordance`) needs the bare `glossary` scope, not `glossary:read`. When a call 403s despite an obviously read-only intent, widen that one scope from `:read` to the bare form rather than adding unrelated scopes.

Three hard limits of the proxy:

- **GraphQL is unavailable.** `client.graphql` throws: the bridge proxies REST `/api/v2` only.
- **`FormData` is rejected.** Pass a raw `Blob`, `File` or `ArrayBuffer`; no v2 endpoint needs multipart.
- **Calls run as the viewer.** A translator who opens the app can only do what that translator may do, regardless of who installed it. Design around that rather than assuming elevated rights.

## Host context and edition

`useCrowdinContext()` carries the host context, including `isEnterprise`. Detect the edition from that flag only - never from the URL, the module type or a hardcoded host, because Crowdin Enterprise is resolved by organization domain.

```tsx
const { isEnterprise } = useCrowdinContext();

const groups = isEnterprise
  ? await client.projectsGroupsApi.withFetchAll().listGroups({})
  : [];
```

Enterprise has groups and crowdin.com does not, so anything hierarchical needs both branches.

Two things about the context that cost a debugging cycle each:

- **Every id in the context is a string** (`app.id`, `project.id`, `organization.id`), while the REST API takes numeric ids. Coerce once at the boundary - `Number(context.project.id)` - or the call fails on a type the compiler was happy with.
- **`project` is `null` for organization- and profile-level modules.** The same bundle serves every module, so code that reaches for `project.id` has to handle the module types where there is no project at all.

```tsx
const { project, isEnterprise } = useCrowdinContext();
const projectId = project ? Number(project.id) : null;
```

## Sizing and navigation

The iframe does not grow with its content. Call `resize()` after any layout change - initial load, expanding a section, loading data - or the bottom of the app is simply cut off.

```tsx
import { redirect, resize } from "@crowdin/serverless-apps-sdk";

useEffect(() => {
  resize();
}, [rows]);

// send the user to a Crowdin page in the parent window
if (project.webUrl) redirect(project.webUrl);
```

Never use `window.location` for navigation: the app is in an iframe, so it would only navigate the iframe.

## The UI kit

`@crowdin/serverless-apps-sdk/ui` ships around 55 vendored shadcn "new-york" components - `Button`, `Card`, `Select`, `Badge`, `Alert`, `Breadcrumb`, `Skeleton`, `Tooltip`, `Table`, `Dialog` and so on - already themed by `AppUiProvider` from the host's CSS variables. Use them instead of writing your own: they make the app look native inside Crowdin, and they cost nothing to adopt.

```tsx
import { Button, Card, Skeleton } from "@crowdin/serverless-apps-sdk/ui";
```

Tailwind utilities work as usual. Colors resolve through `var(--crowdin-*)` at runtime, which is why components look unstyled when opened outside the Crowdin iframe - that is expected, not a bug.

## Editor modules

Inside the editor, the SDK exposes around 50 typed `editor.*` RPCs to the host - reading the current string, its translations and suggestions, inserting text into the translation box, and so on. When the app needs the string the user is on, reach for those rather than the REST API: they reflect what is on screen right now.

Check the type surface of the `editor` namespace for exact method names before writing a call; that is faster and safer than guessing, and TypeScript will refuse the guess anyway.

## i18n, always

Zero-config Lingui, wired up by the scaffold. Every app keeps it: wrap source strings in macros as you write them, then extract.

```tsx
import { Plural, Trans } from "@lingui/react/macro";

<Trans>Projects dashboard</Trans>
<Plural value={count} one="# string" other="# strings" />
```

```bash
npx crowdin-serverless-apps extract   # updates locales/*.po
```

Catalogs must be named after full host locales - `uk-UA.po`, never `uk.po` - because the runtime fallback does not try base languages. The build compiles them to `dist/locales/<locale>.json`, which the app fetches at runtime.

`AppI18nProvider` resolves the locale from the host context, so the app follows whatever language the user has Crowdin set to - which is why hardcoding strings is immediately visible to the people this platform is for. The provider is already in the scaffold's module file; keep it.

## Reloadable data without fighting the linter

The bundled Biome runs `useExhaustiveDependencies`, and the obvious "bump a token to refetch" pattern trips it - an effect that depends on a counter it does not use for anything else. This shows up on almost every app that has a refresh button, so reach for the shape that passes instead of discovering the failure: put the fetch in a `useCallback`, guard against out-of-order responses with a request-id ref, and call the callback from both the effect and the button.

```tsx
const client = useMemo(() => createCrowdinClient(), []);
const requestId = useRef(0);
const [rows, setRows] = useState<Row[]>([]);

const load = useCallback(async () => {
  const id = ++requestId.current;
  const res = await client.translationMemoryApi.withFetchAll().listTm({});
  if (id !== requestId.current) return;
  setRows(res.data.map((d) => d.data));
}, [client]);

useEffect(() => {
  void load();
}, [load]);

// refresh button
<Button onClick={() => void load()}>Refresh</Button>
```

## Traps that types do not catch

- **Registration not at the top level.** Types are fine, iframe is blank.
- **Manifest and `prepare*` disagree.** Same symptom, and the console says nothing useful.
- **Forgetting `resize()`.** Content silently clipped.
- **Assuming installer rights.** Calls run as the viewer.
- **`window.location`** instead of `redirect()`.
- **Reaching for GraphQL** because the REST call looks verbose.
