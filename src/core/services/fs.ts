// Filesystem capability — OPTIONAL.
//
// Exposed as `Rootstock.fs`, which is `FsService | null`. It is null whenever
// `capabilities.filesystem` is false, so the type system forces a scion to
// guard before use:
//
//   if (rootstock.fs) { await rootstock.fs.open(); }   // ✅
//   rootstock.fs.open();                                // ✗ possibly null
//
// Backends vary (File System Access API, native fs, Node fs) but a `FileRef`
// always abstracts the underlying handle/path.

export interface FileFilter {
  name: string;
  /** Extensions without the dot, e.g. ['tvs', 'json']. */
  extensions: string[];
}

export interface OpenOptions {
  filters?: FileFilter[];
  multiple?: boolean;
}

export interface SaveOptions {
  filters?: FileFilter[];
  /** Suggested file name in the save dialog. */
  suggestedName?: string;
}

/** An opaque reference to a file the user has granted access to. */
export interface FileRef {
  /** Display name of the file. */
  readonly name: string;
  /** Absolute path when the backend exposes one (native targets). */
  readonly path?: string;
}

export interface FsService {
  /** Prompt for a file to open. Resolves null when the user cancels. */
  open(opts?: OpenOptions): Promise<FileRef | null>;
  /** Prompt for a location to save to. Resolves null when the user cancels. */
  save(data: string | Uint8Array, opts?: SaveOptions): Promise<FileRef | null>;
  readText(ref: FileRef): Promise<string>;
  writeText(ref: FileRef, data: string): Promise<void>;
}
