import type { ThemeDescriptor, ThemeService } from '../services/theme.js';

/**
 * Theme engine — applies the active theme by setting `data-theme` (and a
 * `dark` class) on the document root, the convention scion stylesheets key
 * their CSS custom properties off. Shared by every webview-based adapter
 * (web, Tauri, Electron renderer) since they all have a DOM.
 */
export class ThemeEngine implements ThemeService {
  private readonly themes: ThemeDescriptor[];
  private active: string;
  private readonly listeners = new Set<(theme: ThemeDescriptor) => void>();

  constructor(themes: ThemeDescriptor[], initial?: string) {
    if (themes.length === 0) throw new Error('ThemeEngine requires at least one theme');
    this.themes = [...themes];
    this.active = initial && this.has(initial) ? initial : themes[0].id;
    this.apply(this.active);
  }

  current(): string {
    return this.active;
  }

  list(): ThemeDescriptor[] {
    return [...this.themes];
  }

  set(id: string): void {
    const theme = this.themes.find((t) => t.id === id);
    if (!theme) throw new Error(`Unknown theme "${id}"`);
    this.active = id;
    this.apply(id);
    for (const listener of this.listeners) listener(theme);
  }

  onChange(listener: (theme: ThemeDescriptor) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private has(id: string): boolean {
    return this.themes.some((t) => t.id === id);
  }

  private apply(id: string): void {
    if (typeof document === 'undefined') return;
    const theme = this.themes.find((t) => t.id === id);
    const root = document.documentElement;
    root.setAttribute('data-theme', id);
    root.classList.toggle('dark', !!theme?.dark);
  }
}
