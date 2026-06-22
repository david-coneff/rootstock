// rootstock/pwa — installable, offline-capable browser adapter.
//
// A capability superset of rootstock/web: the same browser services, plus a
// registered service worker and a persistent-storage request, which turn on the
// offline / persistent / installable capabilities a plain web build lacks.
// Async because registering the service worker is.

import { createRootstock } from '../../core/rootstock.js';
import type { PlatformAdapter } from '../../core/adapter.js';
import type { Capabilities } from '../../core/types.js';
import { createWebServices, detectWebCapabilities, type WebBuildOptions } from '../web/services.js';

export interface PwaRootstockOptions extends WebBuildOptions {
  /** Service worker script URL to register (e.g. '/sw.js'). */
  serviceWorkerUrl?: string;
  serviceWorkerScope?: string;
  /** Request non-evictable storage. Default true. */
  requestPersistentStorage?: boolean;
}

/**
 * The PWA runtime surface. Same shape as the web surface (`shell` is `null`,
 * `fs` is nullable), but its capabilities report the offline/persistent/
 * installable extras once the service worker is registered.
 */
export type PwaRootstock = Awaited<ReturnType<typeof createPwaRootstock>>;

/** Build the PWA runtime (registers the service worker first). */
export async function createPwaRootstock(options: PwaRootstockOptions = {}) {
  const detected = detectWebCapabilities();
  const services = createWebServices(options);

  const serviceWorker = await registerServiceWorker(
    options.serviceWorkerUrl,
    options.serviceWorkerScope,
  );
  const persistentStorage =
    options.requestPersistentStorage === false ? false : await requestPersistent();
  const swSupported =
    typeof navigator !== 'undefined' && 'serviceWorker' in navigator;

  const capabilities: Capabilities = {
    popoutWindows: detected.popoutWindows,
    nativeDecorations: false,
    filesystem: detected.filesystem,
    shellAccess: false,
    notifications: detected.notifications,
    clipboard: detected.clipboard,
    secureContext: detected.secureContext,
    serviceWorker,
    persistentStorage,
    // An offline shell exists once the worker is active.
    offline: serviceWorker,
    installable: detected.secureContext && swSupported,
  };

  const adapter = {
    target: 'pwa' as const,
    capabilities,
    window: services.window,
    dialog: services.dialog,
    notify: services.notify,
    clipboard: services.clipboard,
    settings: services.settings,
    theme: services.theme,
    commands: services.commands,
    docking: services.docking,
    menus: services.menus,
    fs: services.fs,
    shell: null,
  } satisfies PlatformAdapter;

  return createRootstock(adapter);
}

async function registerServiceWorker(url?: string, scope?: string): Promise<boolean> {
  if (!url || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }
  try {
    await navigator.serviceWorker.register(url, scope ? { scope } : undefined);
    return true;
  } catch {
    return false;
  }
}

async function requestPersistent(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) return false;
  try {
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
