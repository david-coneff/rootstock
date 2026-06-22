// rootstock/tauri — Tauri 2.x desktop adapter.
//
// Native windows, filesystem and shell; the webview-safe subsystems
// (dialogs, notifications, clipboard, settings, theme, commands) are reused
// from the shared layer. Import this entry from a Tauri build so no browser-
// only assumptions and no other adapter code are bundled.

import { createRootstock } from '../../core/rootstock.js';
import type { PlatformAdapter } from '../../core/adapter.js';
import type { Capabilities } from '../../core/types.js';
import type { ThemeDescriptor } from '../../core/services/theme.js';
import {
  CommandRegistry,
  ThemeEngine,
  LocalStorageSettings,
  DomDialogs,
  DomNotifier,
  NavigatorClipboard,
} from '../../core/impl/index.js';
import { TauriWindowService } from './TauriWindowService.js';
import { TauriFsService } from './TauriFsService.js';
import { TauriShellService } from './TauriShellService.js';

export interface TauriRootstockOptions {
  themes?: ThemeDescriptor[];
  initialTheme?: string;
  settingsPrefix?: string;
}

const DEFAULT_THEMES: ThemeDescriptor[] = [
  { id: 'light', label: 'Light', dark: false },
  { id: 'dark', label: 'Dark', dark: true },
];

/**
 * The Tauri runtime surface. `fs` and `shell` are non-null here, so a Tauri
 * build calls `rootstock.fs.open()` / `rootstock.shell.openExternal()`
 * directly — no capability guard, because this target always has them.
 */
export type TauriRootstock = ReturnType<typeof createTauriRootstock>;

/** Build the Tauri desktop runtime. */
export function createTauriRootstock(options: TauriRootstockOptions = {}) {
  const capabilities: Capabilities = {
    popoutWindows: true,
    nativeDecorations: true,
    filesystem: true,
    shellAccess: true,
    notifications: true,
    clipboard: true,
    // Native webview: secure context, no service worker needed — the app is
    // already installed and works offline against the native filesystem.
    secureContext: true,
    serviceWorker: false,
    persistentStorage: true,
    offline: true,
    installable: false,
  };

  // `satisfies` keeps the non-null `fs`/`shell` types so the Tauri surface
  // exposes them without a guard.
  const adapter = {
    target: 'tauri' as const,
    capabilities,
    window: new TauriWindowService(),
    // Reused from the shared layer — they run unchanged in the webview.
    dialog: new DomDialogs(),
    notify: new DomNotifier(),
    clipboard: new NavigatorClipboard(),
    settings: new LocalStorageSettings(options.settingsPrefix),
    theme: new ThemeEngine(options.themes ?? DEFAULT_THEMES, options.initialTheme),
    commands: new CommandRegistry(),
    // Native, capability-backed subsystems.
    fs: new TauriFsService(),
    shell: new TauriShellService(),
  } satisfies PlatformAdapter;

  return createRootstock(adapter);
}
