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

   | Import            | Use                                          |
   | ----------------- | -------------------------------------------- |
   | `rootstock`       | Types + helpers only (no platform)           |
   | `rootstock/web`   | Standalone HTML / served browser runtime     |
   | `rootstock/pwa`   | Installable, offline runtime (superset of web) |
   | `rootstock/tauri` | Tauri desktop runtime                        |

2. **Per-target types.** Each build only exposes the capabilities its target can
   honor. Calling a desktop-only method from a browser build is a *compile
   error*, not a runtime surprise.

### Web delivery: standalone HTML vs PWA

`web` and `pwa` are separate entries because their *build* differs. `pwa` is a
capability **superset**: it registers a service worker and requests persistent
storage, enabling `offline`, `persistentStorage`, and `installable`. The finer
cliffs *within* the browser — `secureContext`, `filesystem` (File System Access)
— are **detected at runtime**, so a `web` build behaves correctly whether it's
served over https or opened as a single file from `file://` (where, like
tessel's own `StorageEngine`, secure-context APIs are unavailable). Read these
off `rootstock.platform.capabilities` rather than assuming them from the target.

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
| Docking      | `docking`           | zones + PiP pop-out         | zones + PiP\*    |
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
npm run build:demo  # esbuild → examples/playground.html (single-file demo)
```

### Playground demo (the "core HTML")

`npm run build:demo` runs `node build.mjs`: esbuild rolls the modular
`examples/playground/` source (TS + CSS) up into one self-contained
**`examples/playground.html`** that boots `rootstock/web` from `file://` with
zero network — a *runtime* proof to complement the *compile-time* proof in
`examples/capability-contract.ts`. It is the same single-file esbuild roll-up
the scion apps (docket, tessel) use, so every project under this stack shares
one build process (rhiz-Partition modality B / DS-002). The library packaging
above (tsup → `dist/`) is unaffected; `playground.html` is a generated output,
only `examples/playground/` is source.

## Docking

`rootstock.docking` is a first-class subsystem (present on every webview
target). It manages where each pane lives — a dock zone (`left/right/top/
bottom/center`), a floating rect, or a pop-out window — serializes that to a
`WorkspaceLayout`, and auto-persists it through `settings`:

```ts
rootstock.docking.configure({ zones: { left: leftEl, right: rightEl }, topOffset: 44 });
rootstock.docking.register({
  id: 'inspector', element: el, defaultZone: 'right',
  dragHandle: headerEl, resizeHandle: gripEl,   // draggable + resizable when floating
});
rootstock.docking.float('inspector', { x: 120, y: 120 });
await rootstock.docking.popOut('inspector', { mode: 'auto' }); // PiP, else satellite window
rootstock.docking.restorePersisted();                          // reapply saved layout
```

Floating drag/resize (lifted from tessel's `FloatingPane`) and both pop-out
paths are implemented: Document Picture-in-Picture, and a URL-`satellite` window
(via the target's window service — `window.open` on web, `WebviewWindow` on
Tauri) that the scion re-renders using `readSatelliteRequest()`. Splitters and
tabbed pane groups are the remaining lifts.

## Commands, palette & keybindings

`rootstock.commands` is a registry, a command palette, and a portable
keybinding engine (Mod = Cmd on macOS, Ctrl elsewhere):

```ts
rootstock.commands.register({
  id: 'editor.export', label: 'Export', category: 'Editor',
  keybinding: 'Mod+Shift+E', run: () => exportDoc(),
});
const dispose = rootstock.commands.installKeybindings(); // + Mod+Shift+P palette
rootstock.commands.openPalette();
```

## Menus

`rootstock.menus` renders menubars, dropdowns, and context menus from a
declarative model whose leaf items dispatch through the command system:

```ts
rootstock.menus.setMenuBar(barEl, [
  { label: 'File', items: [
    { label: 'Export', command: 'editor.export', keybinding: 'Mod+Shift+E' },
    { separator: true },
    { label: 'Recent', submenu: [/* … */] },
  ]},
]);
rootstock.menus.openContextMenu(items, x, y);
```

## Themes

`rootstock.theme` ships tessel's six-preset catalogue (`themeCatalogue`: dark,
light, nord, solarized-dark, warm-light, high-contrast). Each theme carries its
full CSS-variable map and also maps rootstock's own `--rs-*` chrome tokens, so
the framework's dialogs/toasts/palette theme in step with the app. It also
supports user editing — `register()`/`remove()` custom themes, `setOrder()`,
and tessel's A/B toggle (`setSlot`, `toggleSlot`, `preview`/`endPreview`) — all
persisted through settings.

## Components (`ui`) — mix systems without lock-in

`rootstock.ui` resolves logical controls (`button`, `toggle`, `slider`,
`textInput`, `select`) through a provider chain, with native HTML as the
always-available fallback. Scions register more providers (their own component
library, Material) and pin per control:

```ts
const slider = rootstock.ui.slider({ min: 0, max: 10, value: 5, onInput });

import { materialProvider, materialThemeBridge } from
  '@david-coneff/rootstock/providers/material';
rootstock.ui.use(materialProvider);
rootstock.ui.prefer('slider', 'material');   // Material slider, native elsewhere
materialThemeBridge(rootstock.theme);         // theme Material with the app
```

**Bundle cost is opt-in and granular.** Material lives behind the
`@david-coneff/rootstock/providers/material` subpath and is the only module that
references `@material/web` (an optional peer dependency). The core / web / pwa /
tauri entries contain **zero** Material (verified). Within the provider each
control is a *literal lazy `import()`*, so a scion that uses only the Material
slider bundles only the Material slider's module (plus the shared Lit/internals
floor, once) — never button/select/etc. A scion that never imports the provider
ships no Material at all. Theming bridges automatically: `materialThemeBridge`
emits `--md-sys-color-*` from the active rootstock theme.

## Status

The capability **contract**, the **web / pwa / tauri adapters**, the **docking
subsystem** (zones, floating drag/resize, tabbed pane groups, splitters, PiP +
satellite pop-out, layout persistence), the **command palette + keybindings**,
**menus**, the **theme engine** (catalogue + user editing + A/B slots), and the
**component layer** (`ui` with native fallback + optional, lazy-per-control
Material provider) are in place and type-checked. The contract surface is broad
enough for a real scion to adopt — tessel is the first consumer.
