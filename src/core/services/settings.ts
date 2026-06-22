// Settings capability — durable, typed key/value storage.
//
// Backends vary (OPFS, localStorage, native store) but the contract is a
// synchronous-feeling typed KV map. Values must be JSON-serialisable.

export interface SettingsService {
  get<T>(key: string, fallback: T): T;
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  delete(key: string): void;
  keys(): string[];
  /** Subscribe to changes for a key. Returns an unsubscribe function. */
  onChange<T>(key: string, listener: (value: T | undefined) => void): () => void;
}
