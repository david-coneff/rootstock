// Core platform types shared by every adapter.
//
// These describe *what environment* a scion is running in and *what it is
// allowed to do* there. They contain no platform code — only the vocabulary
// that the rest of the contract is expressed in.

/**
 * A concrete deployment target an adapter is written for.
 *
 * `web` and `pwa` are distinct because their *build* differs: `pwa` registers a
 * service worker and requests persistent storage, turning on offline/installable
 * extras that a plain `web` (including a single standalone HTML file) does not
 * have. The finer capability cliffs *within* the browser — secure context,
 * File System Access — are detected at runtime, not assumed from the target.
 */
export type PlatformTarget = 'web' | 'pwa' | 'tauri' | 'electron';

/**
 * The set of optional behaviours a target may or may not provide.
 *
 * These flags exist so a scion can *narrow at runtime* before reaching for an
 * optional subsystem. They are the runtime mirror of the nullable services on
 * {@link Rootstock} (e.g. `fs` is non-null exactly when `filesystem` is true).
 */
export interface Capabilities {
  /** Can spawn additional OS/browser windows (pop-out panels, satellites). */
  readonly popoutWindows: boolean;
  /** The host draws native title bars / window decorations. */
  readonly nativeDecorations: boolean;
  /** A real filesystem is reachable (vs. sandboxed browser storage only). */
  readonly filesystem: boolean;
  /** Arbitrary shell/process execution is available. */
  readonly shellAccess: boolean;
  /** OS-level or in-app notifications can be raised. */
  readonly notifications: boolean;
  /** Programmatic clipboard read/write is permitted. */
  readonly clipboard: boolean;

  // --- Web delivery axis (standalone HTML → served → PWA) -----------------

  /**
   * Running in a secure context (https / localhost / native webview). Many
   * browser APIs (OPFS, File System Access, async clipboard) require this; a
   * standalone HTML file opened from `file://` does not have it.
   */
  readonly secureContext: boolean;
  /** A service worker is active — an offline app shell is available. */
  readonly serviceWorker: boolean;
  /** Storage is persistent (won't be evicted under pressure). */
  readonly persistentStorage: boolean;
  /** The app functions without a network connection. */
  readonly offline: boolean;
  /** The app can be installed to the home screen / run standalone. */
  readonly installable: boolean;
}

/** Everything a scion can learn about where it is running. */
export interface PlatformInfo {
  readonly target: PlatformTarget;
  readonly capabilities: Capabilities;
}
