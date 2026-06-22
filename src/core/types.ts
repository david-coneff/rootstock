// Core platform types shared by every adapter.
//
// These describe *what environment* a scion is running in and *what it is
// allowed to do* there. They contain no platform code — only the vocabulary
// that the rest of the contract is expressed in.

/** A concrete deployment target an adapter is written for. */
export type PlatformTarget = 'web' | 'tauri' | 'electron';

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
  /** OS-level notifications can be raised. */
  readonly notifications: boolean;
  /** Programmatic clipboard read/write is permitted. */
  readonly clipboard: boolean;
}

/** Everything a scion can learn about where it is running. */
export interface PlatformInfo {
  readonly target: PlatformTarget;
  readonly capabilities: Capabilities;
}
