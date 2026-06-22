// Shell capability — OPTIONAL.
//
// Exposed as `Rootstock.shell`, which is `ShellService | null` (null unless
// `capabilities.shellAccess` is true). Browser targets have no shell, so the
// type forces a guard before use.

export interface OpenExternalOptions {
  /** Treat the target as a path rather than a URL where the host distinguishes. */
  asPath?: boolean;
}

export interface ShellService {
  /** Open a URL (or path) in the host's default handler. */
  openExternal(target: string, opts?: OpenExternalOptions): Promise<void>;
}
