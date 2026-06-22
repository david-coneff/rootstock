// Compile-time proof of the capability contract.
//
// This file is type-checked (see tsconfig `include`). The `@ts-expect-error`
// lines assert that misuse is REJECTED — if a future change accidentally made
// the browser build able to call a desktop-only method, `tsc` would fail here.
//
// Scions would import from 'rootstock/web' or 'rootstock/tauri'; we import the
// sources directly so the example is self-contained.

import { createWebRootstock } from '../src/adapters/web/index.js';
import { createPwaRootstock } from '../src/adapters/pwa/index.js';
import { createTauriRootstock } from '../src/adapters/tauri/index.js';
import { Splitter } from '../src/index.js';
import { materialProvider, materialThemeBridge } from '../src/providers/material/index.js';
import type { Rootstock } from '../src/index.js';

// --- Web build -------------------------------------------------------------
const web = createWebRootstock();

// `shell` is categorically absent in the browser → typed `null`.
// @ts-expect-error  browser builds cannot reach a shell
web.shell.openExternal('https://example.com');

// `fs` is browser-dependent → must be guarded before use.
// @ts-expect-error  'fs' is possibly null
web.fs.open();

if (web.fs) {
  void web.fs.open(); // ✅ narrowed
}

// Always-present subsystems need no guard on any target.
void web.dialog.confirm('Proceed?');
void web.notify.show({ body: 'hello' });

// --- PWA build (superset of web) -------------------------------------------
const pwa = await createPwaRootstock({ serviceWorkerUrl: '/sw.js' });

// Same browser surface as web: shell still absent, fs still guarded.
// @ts-expect-error  PWA builds have no shell either
pwa.shell.openExternal('https://example.com');
if (pwa.fs) void pwa.fs.open();

// ...but the extra delivery capabilities are visible and true.
void pwa.platform.capabilities.offline;
void pwa.platform.capabilities.installable;

// --- Tauri build -----------------------------------------------------------
const tauri = createTauriRootstock();

// Native capabilities are guaranteed on this target → call directly.
void tauri.fs.open();
void tauri.shell.openExternal('https://example.com');

// --- Docking subsystem (present on every target) ---------------------------
const inspectorEl =
  typeof document !== 'undefined' ? document.createElement('div') : ({} as HTMLElement);
web.docking.configure({ zones: {}, topOffset: 44 });
web.docking.register({
  id: 'inspector',
  element: inspectorEl,
  defaultZone: 'right',
  dragHandle: inspectorEl,
  resizeHandle: inspectorEl,
});
web.docking.dock('inspector', 'left');
web.docking.float('inspector', { x: 120, y: 120 });
void web.docking.popOut('inspector', { mode: 'auto' }); // PiP, else satellite
web.docking.groupAsTabs('side', ['inspector'], 'left'); // tabbed pane group
web.docking.activateTab('side', 'inspector');
const layout = web.docking.saveLayout(); // serializable workspace snapshot
web.docking.loadLayout(layout);

// A resizable splitter (zone divider / pane grip)
const handleEl =
  typeof document !== 'undefined' ? document.createElement('div') : ({} as HTMLElement);
new Splitter(handleEl, { target: inspectorEl, axis: 'horizontal', min: 160, max: 600 });

// --- Commands: registry, keybindings, palette ------------------------------
web.commands.register({
  id: 'editor.export',
  label: 'Export Document',
  category: 'Editor',
  keybinding: 'Mod+Shift+E',
  run: () => undefined,
});
const disposeKeys = web.commands.installKeybindings(); // binds Mod+Shift+P palette
web.commands.openPalette({ placeholder: 'Run a command…' });
disposeKeys();

// --- Menus: menubar + context menu, dispatching commands -------------------
const barEl =
  typeof document !== 'undefined' ? document.createElement('div') : ({} as HTMLElement);
web.menus.setMenuBar(barEl, [
  {
    label: 'File',
    items: [
      { label: 'Export', command: 'editor.export', keybinding: 'Mod+Shift+E' },
      { separator: true },
      { label: 'More', submenu: [{ label: 'Nested', action: () => undefined }] },
    ],
  },
]);
web.menus.openContextMenu([{ label: 'Copy', action: () => undefined }], 10, 10);

// --- Theme catalogue + user editing + A/B slots ----------------------------
web.theme.set('nord');
void web.theme.list().map((t) => t.id);
web.theme.register({ id: 'mine', label: 'Mine', dark: true, vars: { '--rs-accent': '#f0f' } });
web.theme.setSlot('a', 'dark');
web.theme.setSlot('b', 'light');
web.theme.toggleSlot(); // switch a↔b
web.theme.preview('nord');
web.theme.endPreview();

// --- UI components: native by default, Material opt-in per control ----------
// Native fallback — always available, no extra deps:
const slider = web.ui.slider({ min: 0, max: 10, value: 5, onInput: () => undefined });
const button = web.ui.button({ label: 'Run', variant: 'filled', onClick: () => undefined });
void [slider, button];

// Opt into Material for just the slider; everything else stays native. Only a
// scion that imports the material provider bundles any Material (and only the
// slider's Material module, loaded lazily on first use).
web.ui.use(materialProvider);
web.ui.prefer('slider', 'material');
materialThemeBridge(web.theme); // theme Material with the active rootstock theme
void web.ui.providers(); // ['material', 'native']

// --- Target-agnostic library code -----------------------------------------
// Code written against the wide `Rootstock` type must guard optional subsystems
// regardless of which build it ends up in.
export async function saveSomewhere(rs: Rootstock, data: string): Promise<boolean> {
  if (!rs.fs) return false; // capability absent on this target
  await rs.fs.save(data, { suggestedName: 'export.txt' });
  return true;
}
