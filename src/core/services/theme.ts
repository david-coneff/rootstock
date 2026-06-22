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

export interface ThemeService {
  /** The currently active theme id. */
  current(): string;
  /** All themes registered with the engine. */
  list(): ThemeDescriptor[];
  /** Activate a theme by id. */
  set(id: string): void;
  /** Subscribe to theme changes. Returns an unsubscribe function. */
  onChange(listener: (theme: ThemeDescriptor) => void): () => void;
}
