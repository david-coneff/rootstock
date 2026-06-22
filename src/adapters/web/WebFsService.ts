import type {
  FileRef,
  FsService,
  OpenOptions,
  SaveOptions,
} from '../../core/services/fs.js';

// Minimal structural types for the File System Access API (not in lib.dom yet
// across all TS targets). Only the surface we use is declared.
interface FsAccessHandle {
  readonly name: string;
  getFile(): Promise<File>;
  createWritable(): Promise<{ write(data: string | BufferSource): Promise<void>; close(): Promise<void> }>;
}
interface FsAccessWindow {
  showOpenFilePicker?(opts?: unknown): Promise<FsAccessHandle[]>;
  showSaveFilePicker?(opts?: unknown): Promise<FsAccessHandle>;
}

/** Web `FileRef` carrying the live File System Access handle. */
interface WebFileRef extends FileRef {
  readonly _handle: FsAccessHandle;
}

/**
 * Filesystem via the File System Access API. Constructed only when the API is
 * present; otherwise the web adapter sets `fs` to null and reports
 * `filesystem: false`, so scions are forced to guard.
 */
export class WebFsService implements FsService {
  static isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof (window as unknown as FsAccessWindow).showOpenFilePicker === 'function'
    );
  }

  private get api(): FsAccessWindow {
    return window as unknown as FsAccessWindow;
  }

  async open(opts: OpenOptions = {}): Promise<FileRef | null> {
    if (!this.api.showOpenFilePicker) return null;
    try {
      const [handle] = await this.api.showOpenFilePicker({
        multiple: false,
        types: toAcceptTypes(opts.filters),
      });
      return wrap(handle);
    } catch {
      return null; // user cancelled
    }
  }

  async save(data: string | Uint8Array, opts: SaveOptions = {}): Promise<FileRef | null> {
    if (!this.api.showSaveFilePicker) return null;
    try {
      const handle = await this.api.showSaveFilePicker({
        suggestedName: opts.suggestedName,
        types: toAcceptTypes(opts.filters),
      });
      const writable = await handle.createWritable();
      await writable.write(typeof data === 'string' ? data : bufferOf(data));
      await writable.close();
      return wrap(handle);
    } catch {
      return null;
    }
  }

  async readText(ref: FileRef): Promise<string> {
    const file = await (ref as WebFileRef)._handle.getFile();
    return file.text();
  }

  async writeText(ref: FileRef, data: string): Promise<void> {
    const writable = await (ref as WebFileRef)._handle.createWritable();
    await writable.write(data);
    await writable.close();
  }
}

function wrap(handle: FsAccessHandle): WebFileRef {
  return { name: handle.name, _handle: handle };
}

function bufferOf(data: Uint8Array): ArrayBuffer {
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

function toAcceptTypes(filters?: { name: string; extensions: string[] }[]) {
  if (!filters?.length) return undefined;
  return filters.map((f) => ({
    description: f.name,
    accept: { 'application/octet-stream': f.extensions.map((e) => `.${e}`) },
  }));
}
