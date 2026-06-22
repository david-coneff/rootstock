// rootstock/web — Web & PWA adapter.
//
// Assembles a Rootstock from browser-native services plus the shared,
// platform-agnostic subsystems (commands, theme, settings). Import this entry
// from a browser/PWA build so no desktop adapter code is bundled.

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
import { WebWindowService } from './WebWindowService.js';
import { WebFsService } from './WebFsService.js';

export interface WebRootstockOptions {
  /** Theme catalogue. Defaults to a light/dark pair. */
  themes?: ThemeDescriptor[];
  initialTheme?: string;
  /** localStorage namespace for settings. */
  settingsPrefix?: string;
}

const DEFAULT_THEMES: ThemeDescriptor[] = [
  { id: 'light', label: 'Light', dark: false },
  { id: 'dark', label: 'Dark', dark: true },
];

/**
 * The Web/PWA runtime surface. Note `shell` is typed `null` — a browser build
 * cannot reach a shell, and referencing `rootstock.shell.openExternal()` here
 * is a compile error. `fs` is `WebFsService | null` because File System Access
 * support is browser-dependent, so it must be guarded.
 */
export type WebRootstock = ReturnType<typeof createWebRootstock>;

/** Build the Web/PWA runtime. */
export function createWebRootstock(options: WebRootstockOptions = {}) {
  const fsSupported = WebFsService.isSupported();

  const capabilities: Capabilities = {
    popoutWindows: typeof window !== 'undefined' && typeof window.open === 'function',
    nativeDecorations: false,
    filesystem: fsSupported,
    shellAccess: false,
    notifications: true,
    clipboard: typeof navigator !== 'undefined' && !!navigator.clipboard,
  };

  // `satisfies` (not `: PlatformAdapter`) so the literal `shell: null` and
  // `fs: WebFsService | null` types flow through to the returned runtime.
  const adapter = {
    target: 'web' as const,
    capabilities,
    window: new WebWindowService(),
    dialog: new DomDialogs(),
    notify: new DomNotifier(),
    clipboard: new NavigatorClipboard(),
    settings: new LocalStorageSettings(options.settingsPrefix),
    theme: new ThemeEngine(options.themes ?? DEFAULT_THEMES, options.initialTheme),
    commands: new CommandRegistry(),
    fs: fsSupported ? new WebFsService() : null,
    shell: null,
  } satisfies PlatformAdapter;

  return createRootstock(adapter);
}
