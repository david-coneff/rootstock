import type { SettingsService } from '../services/settings.js';

/**
 * Settings backed by `localStorage`, namespaced under a key prefix. Works in
 * any webview (web, PWA, Tauri, Electron renderer). Native targets may swap in
 * an OPFS/native-store implementation later without touching the contract.
 */
export class LocalStorageSettings implements SettingsService {
  private readonly prefix: string;
  private readonly listeners = new Map<string, Set<(value: unknown) => void>>();

  constructor(prefix = 'rootstock:') {
    this.prefix = prefix;
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      // Cross-tab/window changes (pop-outs share an origin).
      window.addEventListener('storage', (e) => {
        if (!e.key || !e.key.startsWith(this.prefix)) return;
        const key = e.key.slice(this.prefix.length);
        this.emit(key, e.newValue === null ? undefined : safeParse(e.newValue));
      });
    }
  }

  get<T>(key: string, fallback: T): T;
  get<T>(key: string): T | undefined;
  get<T>(key: string, fallback?: T): T | undefined {
    const raw = this.store?.getItem(this.prefix + key);
    if (raw === null || raw === undefined) return fallback;
    const parsed = safeParse(raw);
    return (parsed === undefined ? fallback : parsed) as T | undefined;
  }

  set<T>(key: string, value: T): void {
    this.store?.setItem(this.prefix + key, JSON.stringify(value));
    this.emit(key, value);
  }

  delete(key: string): void {
    this.store?.removeItem(this.prefix + key);
    this.emit(key, undefined);
  }

  keys(): string[] {
    const store = this.store;
    if (!store) return [];
    const out: string[] = [];
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i);
      if (k && k.startsWith(this.prefix)) out.push(k.slice(this.prefix.length));
    }
    return out;
  }

  onChange<T>(key: string, listener: (value: T | undefined) => void): () => void {
    let set = this.listeners.get(key);
    if (!set) {
      set = new Set();
      this.listeners.set(key, set);
    }
    set.add(listener as (value: unknown) => void);
    return () => set?.delete(listener as (value: unknown) => void);
  }

  private get store(): Storage | undefined {
    return typeof localStorage !== 'undefined' ? localStorage : undefined;
  }

  private emit(key: string, value: unknown): void {
    const set = this.listeners.get(key);
    if (set) for (const l of set) l(value);
  }
}

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}
