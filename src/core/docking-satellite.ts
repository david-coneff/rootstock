// Satellite pop-out coordination.
//
// The non-PiP pop-out path opens a *new document* (browser window or Tauri
// WebviewWindow) pointed at the app's own URL with a marker query param. That
// satellite document re-runs the scion, which calls `readSatelliteRequest()`
// to learn it is a satellite and which panel to render in isolation.
//
// This mirrors tessel's `?satellite=<panelId>` flow, generalised behind the
// docking subsystem.

export const SATELLITE_PARAM = 'rootstock-satellite';

/**
 * If the current document was opened as a satellite, return the panel id it
 * should render; otherwise null. Pass an explicit search string in non-browser
 * contexts.
 */
export function readSatelliteRequest(search?: string): string | null {
  const query =
    search ?? (typeof location !== 'undefined' ? location.search : '');
  if (!query) return null;
  const params = new URLSearchParams(query);
  return params.get(SATELLITE_PARAM);
}

/** Build the satellite URL for a panel from a base URL. */
export function buildSatelliteUrl(panelId: string, baseHref?: string): string {
  const base =
    baseHref ?? (typeof location !== 'undefined' ? location.href : 'http://localhost/');
  const url = new URL(base);
  url.searchParams.set(SATELLITE_PARAM, panelId);
  return url.toString();
}
