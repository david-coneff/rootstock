import { CapabilityError } from '../../core/errors.js';
import type {
  FileRef,
  FsService,
  OpenOptions,
  SaveOptions,
} from '../../core/services/fs.js';
import { loadPlugin } from './plugins.js';

interface DialogPlugin {
  open(opts?: unknown): Promise<string | string[] | null>;
  save(opts?: unknown): Promise<string | null>;
}
interface FsPlugin {
  readTextFile(path: string): Promise<string>;
  writeTextFile(path: string, contents: string): Promise<void>;
}

function baseName(path: string): string {
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 1] || path;
}

/**
 * Native filesystem via Tauri's dialog + fs plugins. Real OS file pickers and
 * direct disk read/write — the same {@link FsService} contract the web adapter
 * fulfils with the File System Access API.
 */
export class TauriFsService implements FsService {
  async open(opts: OpenOptions = {}): Promise<FileRef | null> {
    const dialog = await loadPlugin<DialogPlugin>('@tauri-apps/plugin-dialog');
    if (!dialog) throw new CapabilityError('filesystem', 'dialog plugin not installed');
    const selected = await dialog.open({
      multiple: false,
      filters: opts.filters?.map((f) => ({ name: f.name, extensions: f.extensions })),
    });
    const path = Array.isArray(selected) ? selected[0] : selected;
    return path ? { name: baseName(path), path } : null;
  }

  async save(data: string | Uint8Array, opts: SaveOptions = {}): Promise<FileRef | null> {
    const dialog = await loadPlugin<DialogPlugin>('@tauri-apps/plugin-dialog');
    if (!dialog) throw new CapabilityError('filesystem', 'dialog plugin not installed');
    const path = await dialog.save({
      defaultPath: opts.suggestedName,
      filters: opts.filters?.map((f) => ({ name: f.name, extensions: f.extensions })),
    });
    if (!path) return null;
    const ref: FileRef = { name: baseName(path), path };
    await this.writeText(ref, typeof data === 'string' ? data : new TextDecoder().decode(data));
    return ref;
  }

  async readText(ref: FileRef): Promise<string> {
    const fs = await this.fs();
    return fs.readTextFile(this.pathOf(ref));
  }

  async writeText(ref: FileRef, data: string): Promise<void> {
    const fs = await this.fs();
    await fs.writeTextFile(this.pathOf(ref), data);
  }

  private async fs(): Promise<FsPlugin> {
    const fs = await loadPlugin<FsPlugin>('@tauri-apps/plugin-fs');
    if (!fs) throw new CapabilityError('filesystem', 'fs plugin not installed');
    return fs;
  }

  private pathOf(ref: FileRef): string {
    if (!ref.path) throw new CapabilityError('filesystem', 'file reference has no path');
    return ref.path;
  }
}
