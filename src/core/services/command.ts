// Command capability — registry + keyboard shortcuts + palette source.
//
// Modelled after VS Code / JupyterLab: everything actionable is a command with
// a stable id, so menus, toolbars, the palette and keybindings all dispatch
// through one path.

export interface Command {
  /** Stable, namespaced id, e.g. 'editor.export'. */
  id: string;
  /** Human label for menus and the command palette. */
  label: string;
  /** Optional grouping/category for the palette. */
  category?: string;
  /**
   * Default keybinding in portable form, e.g. 'Mod+S' (Mod = Cmd on macOS,
   * Ctrl elsewhere). Adapters resolve Mod to the host modifier.
   */
  keybinding?: string;
  run(...args: unknown[]): unknown | Promise<unknown>;
  /** Optional guard; when it returns false the command is inert/hidden. */
  isEnabled?(): boolean;
}

export interface CommandService {
  /** Register a command. Returns a disposer that unregisters it. */
  register(command: Command): () => void;
  /** Execute a registered command by id. */
  execute(id: string, ...args: unknown[]): Promise<unknown>;
  /** All registered commands (palette source). */
  list(): ReadonlyArray<Omit<Command, 'run'>>;
}
