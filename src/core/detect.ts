import type { PlatformTarget } from './types.js';

/**
 * Best-effort detection of the current deployment target.
 *
 * Note: a scion's *bundle* should normally import the specific entry for its
 * build (`rootstock/web`, `rootstock/tauri`) so dead adapter code is never
 * shipped. This helper is for the rare case of a single bundle that must
 * decide at runtime (it cannot, by itself, keep the unused adapter out of the
 * bundle — that is the job of the per-target entry points).
 */
export function detectTarget(): PlatformTarget {
  const g = globalThis as Record<string, unknown>;

  if (typeof g.window !== 'undefined') {
    const w = g.window as Record<string, unknown>;
    if (w.__TAURI_INTERNALS__ || w.__TAURI__) return 'tauri';
  }

  const proc = g.process as { versions?: Record<string, string> } | undefined;
  if (proc?.versions?.electron) return 'electron';

  return 'web';
}
