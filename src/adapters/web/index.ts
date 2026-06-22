// rootstock/web — standalone HTML / served browser adapter.
//
// The plain browser target: a single-file HTML build or a served page with no
// service worker. Capabilities are *detected* (secure context, File System
// Access), so the same entry behaves correctly whether opened from file:// or
// served over https. The service-worker-driven extras (offline, persistent
// storage, installability) are off — see rootstock/pwa for those.

import { createRootstock } from '../../core/rootstock.js';
import type { PlatformAdapter } from '../../core/adapter.js';
import type { Capabilities } from '../../core/types.js';
import { createWebServices, detectWebCapabilities, type WebBuildOptions } from './services.js';

export type WebRootstockOptions = WebBuildOptions;

/**
 * The Web/standalone-HTML runtime surface. `shell` is typed `null` — a browser
 * build cannot reach a shell, and referencing `rootstock.shell.openExternal()`
 * here is a compile error. `fs` is `WebFsService | null` because File System
 * Access support is context-dependent, so it must be guarded.
 */
export type WebRootstock = ReturnType<typeof createWebRootstock>;

/** Build the Web/standalone-HTML runtime. */
export function createWebRootstock(options: WebRootstockOptions = {}) {
  const detected = detectWebCapabilities();
  const services = createWebServices(options);

  const capabilities: Capabilities = {
    popoutWindows: detected.popoutWindows,
    nativeDecorations: false,
    filesystem: detected.filesystem,
    shellAccess: false,
    notifications: detected.notifications,
    clipboard: detected.clipboard,
    secureContext: detected.secureContext,
    // No service worker in a plain web/standalone build.
    serviceWorker: false,
    persistentStorage: false,
    offline: false,
    installable: false,
  };

  // `satisfies` (not `: PlatformAdapter`) so the literal `shell: null` and
  // `fs: WebFsService | null` types flow through to the returned runtime.
  const adapter = {
    target: 'web' as const,
    capabilities,
    window: services.window,
    dialog: services.dialog,
    notify: services.notify,
    clipboard: services.clipboard,
    settings: services.settings,
    theme: services.theme,
    commands: services.commands,
    fs: services.fs,
    shell: null,
  } satisfies PlatformAdapter;

  return createRootstock(adapter);
}
