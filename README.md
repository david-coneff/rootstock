# rootstock

**Cross-platform workbench runtime and capability abstraction layer.**

Rootstock lets browser-based applications ("scions") also ship as desktop apps
(Tauri, later Electron) while solving common UI/UX and deployment concerns
**once** — windows, dialogs, notifications, filesystem, clipboard, settings,
themes, commands — behind a single typed contract. Each deployment target gets
its own adapter, so a consistent look, feel, and behavior reach every target
without each app re-solving the same problems.

> See [`docs/FOUNDING.md`](./docs/FOUNDING.md) for the full vision and
> [`docs/adr/0001`](./docs/adr/0001-typescript-and-capability-contract.md) for
> why this is TypeScript with per-target capability typing.

## The core idea

A scion programs against **capabilities**, never platform APIs:

```ts
// ❌ before — coupled to a target
window.confirm('Delete?');
__TAURI__.dialog.open();

// ✅ after — adapter decides the implementation
await rootstock.dialog.confirm('Delete?');
await rootstock.fs.open();
```

Two things make this safe across targets:

1. **Per-target builds.** Import the entry for your target; nothing else is
   bundled. A browser build contains zero desktop code.

   | Import            | Use                                |
   | ----------------- | ---------------------------------- |
   | `rootstock`       | Types + helpers only (no platform) |
   | `rootstock/web`   | Web / PWA runtime                  |
   | `rootstock/tauri` | Tauri desktop runtime              |

2. **Per-target types.** Each build only exposes the capabilities its target can
   honor. Calling a desktop-only method from a browser build is a *compile
   error*, not a runtime surprise.

## Usage

### Web / PWA

```ts
import 'rootstock/styles.css';
import { createWebRootstock } from 'rootstock/web';

const rootstock = createWebRootstock();

await rootstock.dialog.confirm('Continue?');
await rootstock.notify.show({ body: 'Saved', level: 'success' });

// `fs` is browser-dependent → guard it
if (rootstock.fs) {
  const file = await rootstock.fs.open({ filters: [{ name: 'Text', extensions: ['txt'] }] });
  if (file) console.log(await rootstock.fs.readText(file));
}

// rootstock.shell  ← does not exist on the web surface (compile error)
```

### Tauri desktop

```ts
import 'rootstock/styles.css';
import { createTauriRootstock } from 'rootstock/tauri';

const rootstock = createTauriRootstock();

// Native filesystem & shell are guaranteed on this target — no guard needed
const file = await rootstock.fs.open();
await rootstock.shell.openExternal('https://example.com');
```

### Target-agnostic library code

```ts
import type { Rootstock } from 'rootstock';

// Sees optional subsystems as nullable → must guard, runs on any build.
export async function exportData(rs: Rootstock, data: string) {
  if (rs.fs) await rs.fs.save(data, { suggestedName: 'export.txt' });
}
```

## Capabilities

| Capability   | Service             | Web                         | Tauri            |
| ------------ | ------------------- | --------------------------- | ---------------- |
| Window       | `window`            | `window.open` popups        | `WebviewWindow`  |
| Dialog       | `dialog`            | custom modal                | custom modal\*   |
| Notification | `notify`            | in-app toast                | in-app toast\*   |
| Clipboard    | `clipboard`         | async Clipboard API         | Clipboard API\*  |
| Settings     | `settings`          | localStorage                | localStorage\*   |
| Theme        | `theme`             | shared engine               | shared engine    |
| Commands     | `commands`          | shared registry             | shared registry  |
| Filesystem   | `fs` *(optional)*   | File System Access \| null  | native plugins   |
| Shell        | `shell` *(optional)*| **absent**                  | native plugin    |

\* Reused from the shared webview layer today; can be swapped for native Tauri
plugins behind the same contract without scion changes.

## Project layout

```
src/
  core/
    types.ts            PlatformTarget, Capabilities, PlatformInfo
    adapter.ts          PlatformAdapter — the contract every adapter implements
    rootstock.ts        Rootstock facade + createRootstock + per-target typing
    services/           capability interfaces (window, dialog, fs, notify, …)
    impl/               platform-agnostic subsystems (commands, theme, DOM dialogs…)
  adapters/
    web/                Web/PWA adapter
    tauri/              Tauri adapter
styles/rootstock.css    themeable baseline styles
examples/               compile-time proof of the capability contract
```

## Develop

```bash
npm install
npm run typecheck   # tsc --noEmit (includes the contract proof)
npm run build       # tsup → dist/ (per-target ESM + .d.ts)
```

## Status

Early scaffold. The capability **contract** and the **web + tauri adapters**
are in place and type-checked; richer subsystems from tessel (docking, floating
panes, workspace persistence, command palette UI, menus) are the next layers to
lift in behind these interfaces.
