// Theme capability — consistent styling across scions and targets.
//
// rootstock owns the active theme name and the CSS-variable contract; the
// adapter is responsible only for applying it to the host document.

export interface ThemeDescriptor {
  readonly id: string;
  readonly label: string;
  readonly dark: boolean;
  /**
   * Optional CSS custom-property values for this theme. When present, the
   * engine injects them as `:root { … }` so a theme is self-contained (the
   * tessel model); when absent, the theme relies on the scion's own stylesheet
   * keyed off `[data-theme]` / `.dark`.
   */
  readonly vars?: Readonly<Record<string, string>>;
}

/** The two-theme toggle slots (e.g. a dark/light pair), lifted from tessel. */
export type ThemeSlot = 'a' | 'b';

export interface ThemeService {
  /** The currently active theme id (the previewed one while previewing). */
  current(): string;
  /** All themes (built-in + custom), in the user's saved order. */
  list(): ThemeDescriptor[];
  /** Activate a theme by id. */
  set(id: string): void;
  /** Subscribe to theme changes. Returns an unsubscribe function. */
  onChange(listener: (theme: ThemeDescriptor) => void): () => void;

  // --- user theme editing (persisted) -------------------------------------
  /** Add or replace a custom theme (persisted). */
  register(theme: ThemeDescriptor): void;
  /** Remove a custom theme by id (built-ins cannot be removed). */
  remove(id: string): void;
  /** Persist a custom display order for `list()`. */
  setOrder(ids: string[]): void;

  // --- A/B slots ----------------------------------------------------------
  /** The theme id assigned to a slot. */
  slot(slot: ThemeSlot): string;
  /** Assign a theme to a slot (applies immediately if it's the active slot). */
  setSlot(slot: ThemeSlot, id: string): void;
  /** Which slot is currently active. */
  activeSlot(): ThemeSlot;
  /** Switch the active slot (a↔b) and apply its theme. */
  toggleSlot(): void;
  /** Temporarily apply a theme without changing slots (e.g. hover preview). */
  preview(id: string): void;
  /** End a preview, reverting to the active slot's theme. */
  endPreview(): void;
}
