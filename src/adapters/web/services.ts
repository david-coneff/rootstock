// Shared browser building blocks for the `web` and `pwa` adapters.
//
// Both targets run in a browser and share every service; they differ only in
// the service-worker-driven capability extras (offline, persistent storage,
// installability), which the `pwa` entry layers on top.

import type { ThemeDescriptor } from '../../core/services/theme.js';
import {
  CommandRegistry,
  ThemeEngine,
  LocalStorageSettings,
  DomDialogs,
  DomNotifier,
  NavigatorClipboard,
  DomDockingSystem,
} from '../../core/impl/index.js';
import { WebWindowService } from './WebWindowService.js';
import { WebFsService } from './WebFsService.js';

export interface WebBuildOptions {
  /** Theme catalogue. Defaults to a light/dark pair. */
  themes?: ThemeDescriptor[];
  initialTheme?: string;
  /** localStorage namespace for settings. */
  settingsPrefix?: string;
}

export const DEFAULT_THEMES: ThemeDescriptor[] = [
  { id: 'light', label: 'Light', dark: false },
  { id: 'dark', label: 'Dark', dark: true },
];

/** The full browser service set, shared by `web` and `pwa`. */
export function createWebServices(options: WebBuildOptions) {
  const fsSupported = WebFsService.isSupported();
  const settings = new LocalStorageSettings(options.settingsPrefix);
  return {
    fsSupported,
    window: new WebWindowService(),
    dialog: new DomDialogs(),
    notify: new DomNotifier(),
    clipboard: new NavigatorClipboard(),
    settings,
    theme: new ThemeEngine(options.themes ?? DEFAULT_THEMES, options.initialTheme),
    commands: new CommandRegistry(),
    docking: new DomDockingSystem({ settings }),
    fs: fsSupported ? new WebFsService() : null,
  };
}

/**
 * Capability flags detectable in any browser, independent of whether a service
 * worker is registered. The `pwa` entry overrides the SW-driven flags after it
 * registers its worker and requests persistent storage.
 */
export function detectWebCapabilities(): {
  popoutWindows: boolean;
  filesystem: boolean;
  notifications: boolean;
  clipboard: boolean;
  secureContext: boolean;
} {
  const hasWindow = typeof window !== 'undefined';
  const secureContext = hasWindow && !!window.isSecureContext;
  return {
    popoutWindows: hasWindow && typeof window.open === 'function',
    filesystem: WebFsService.isSupported(),
    // Notifications need the API and (in practice) a secure context.
    notifications: typeof Notification !== 'undefined' && secureContext,
    clipboard: typeof navigator !== 'undefined' && !!navigator.clipboard && secureContext,
    secureContext,
  };
}
