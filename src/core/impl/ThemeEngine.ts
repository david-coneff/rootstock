import type { SettingsService } from '../services/settings.js';
import type { ThemeDescriptor, ThemeService, ThemeSlot } from '../services/theme.js';

export interface ThemeEngineOptions {
  /** Initially applied theme id. Defaults to the active slot's theme. */
  initial?: string;
  /** Persist custom themes, order, and slots here. */
  settings?: SettingsService;
}

const K_CUSTOM = 'theme:custom';
const K_ORDER = 'theme:order';
const K_SLOT_A = 'theme:slot-a';
const K_SLOT_B = 'theme:slot-b';
const K_ACTIVE_SLOT = 'theme:active-slot';

/**
 * Theme engine — applies the active theme to the document (a `data-theme`
 * attribute, a `dark` class, and an injected CSS-variable block), and owns the
 * tessel-style user-editing features: custom themes, display order, and an A/B
 * toggle pair, all persisted through the settings service.
 */
export class ThemeEngine implements ThemeService {
  private readonly builtins: ThemeDescriptor[];
  private readonly settings?: SettingsService;
  private custom: ThemeDescriptor[];
  private order: string[];
  private slots: Record<ThemeSlot, string>;
  private active: ThemeSlot;
  private applied: string;
  private previewId: string | null = null;
  private readonly listeners = new Set<(theme: ThemeDescriptor) => void>();

  constructor(themes: ThemeDescriptor[], options: ThemeEngineOptions = {}) {
    if (themes.length === 0) throw new Error('ThemeEngine requires at least one theme');
    this.builtins = [...themes];
    this.settings = options.settings;

    this.custom = this.settings?.get<ThemeDescriptor[]>(K_CUSTOM, []) ?? [];
    this.order = this.settings?.get<string[]>(K_ORDER, []) ?? [];
    const fallbackA = themes[0].id;
    const fallbackB = themes.find((t) => t.dark !== themes[0].dark)?.id ?? themes[0].id;
    this.slots = {
      a: this.settings?.get<string>(K_SLOT_A, fallbackA) ?? fallbackA,
      b: this.settings?.get<string>(K_SLOT_B, fallbackB) ?? fallbackB,
    };
    this.active = this.settings?.get<ThemeSlot>(K_ACTIVE_SLOT, 'a') ?? 'a';

    this.applied = options.initial ?? this.slots[this.active];
    if (!this.has(this.applied)) this.applied = this.builtins[0].id;
    this.apply(this.applied);
  }

  current(): string {
    return this.previewId ?? this.applied;
  }

  list(): ThemeDescriptor[] {
    const all = [...this.builtins, ...this.custom];
    if (this.order.length === 0) return all;
    const byId = new Map(all.map((t) => [t.id, t]));
    const result: ThemeDescriptor[] = [];
    for (const id of this.order) {
      const t = byId.get(id);
      if (t) {
        result.push(t);
        byId.delete(id);
      }
    }
    return [...result, ...byId.values()];
  }

  set(id: string): void {
    const theme = this.find(id);
    if (!theme) throw new Error(`Unknown theme "${id}"`);
    this.previewId = null;
    this.applied = id;
    this.apply(id);
    this.emit(theme);
  }

  onChange(listener: (theme: ThemeDescriptor) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  register(theme: ThemeDescriptor): void {
    this.custom = [...this.custom.filter((t) => t.id !== theme.id), theme];
    this.settings?.set(K_CUSTOM, this.custom);
    if (this.applied === theme.id) this.apply(theme.id);
  }

  remove(id: string): void {
    if (this.builtins.some((t) => t.id === id)) {
      throw new Error(`Built-in theme "${id}" cannot be removed`);
    }
    this.custom = this.custom.filter((t) => t.id !== id);
    this.settings?.set(K_CUSTOM, this.custom);
  }

  setOrder(ids: string[]): void {
    this.order = [...ids];
    this.settings?.set(K_ORDER, this.order);
  }

  slot(slot: ThemeSlot): string {
    return this.slots[slot];
  }

  setSlot(slot: ThemeSlot, id: string): void {
    if (!this.has(id)) throw new Error(`Unknown theme "${id}"`);
    this.slots[slot] = id;
    this.settings?.set(slot === 'a' ? K_SLOT_A : K_SLOT_B, id);
    if (slot === this.active && !this.previewId) this.set(id);
  }

  activeSlot(): ThemeSlot {
    return this.active;
  }

  toggleSlot(): void {
    this.active = this.active === 'a' ? 'b' : 'a';
    this.settings?.set(K_ACTIVE_SLOT, this.active);
    this.set(this.slots[this.active]);
  }

  preview(id: string): void {
    if (!this.has(id)) return;
    this.previewId = id;
    this.apply(id);
  }

  endPreview(): void {
    this.previewId = null;
    this.apply(this.applied);
  }

  private has(id: string): boolean {
    return this.find(id) !== undefined;
  }

  private find(id: string): ThemeDescriptor | undefined {
    return this.builtins.find((t) => t.id === id) ?? this.custom.find((t) => t.id === id);
  }

  private emit(theme: ThemeDescriptor): void {
    for (const listener of this.listeners) listener(theme);
  }

  private apply(id: string): void {
    if (typeof document === 'undefined') return;
    const theme = this.find(id);
    const root = document.documentElement;
    root.setAttribute('data-theme', id);
    root.classList.toggle('dark', !!theme?.dark);
    this.applyVars(theme?.vars);
  }

  private applyVars(vars?: Readonly<Record<string, string>>): void {
    let style = document.getElementById('rootstock-theme-vars') as HTMLStyleElement | null;
    if (!vars) {
      if (style) style.textContent = '';
      return;
    }
    if (!style) {
      style = document.createElement('style');
      style.id = 'rootstock-theme-vars';
      document.head.appendChild(style);
    }
    const body = Object.entries(vars)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join('\n');
    style.textContent = `:root {\n${body}\n}`;
  }
}
