// Lazy loader for Tauri plugins.
//
// Plugins are imported through a non-literal specifier so rootstock does not
// take a hard compile-time dependency on each @tauri-apps/plugin-* package; a
// scion installs only the plugins it actually enables. Returned modules are
// loosely typed by design — the strong typing lives at the rootstock contract
// boundary, not at this internal seam.

export async function loadPlugin<T = Record<string, unknown>>(
  name: string,
): Promise<T | null> {
  try {
    return (await import(/* @vite-ignore */ name)) as T;
  } catch {
    return null;
  }
}
