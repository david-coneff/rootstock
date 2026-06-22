// Window management capability.
//
// Unifies window.open() (browser), WebviewWindow() (Tauri) and BrowserWindow()
// (Electron) behind one shape. A `ManagedWindow` mirrors the subset of the
// browser window handle the dock system actually relies on (`.close()` and a
// `.closed` flag), so existing call sites port without behavioural change.

export interface WindowOptions {
  /** Stable id used to dedupe / re-focus an already-open window. */
  id?: string;
  title?: string;
  /** Content to load. Defaults to the current document for pop-outs. */
  url?: string;
  width?: number;
  height?: number;
  resizable?: boolean;
}

/** A handle to a window this scion created. */
export interface ManagedWindow {
  readonly id: string;
  readonly closed: boolean;
  focus(): void;
  close(): void;
}

/** Controls for the window the scion is currently running in. */
export interface WindowControls {
  minimize(): void;
  maximize(): void;
  unmaximize(): void;
  close(): void;
  setTitle(title: string): void;
}

export interface WindowService {
  /** Open a new top-level window. */
  create(opts: WindowOptions): Promise<ManagedWindow>;
  /** Controls for the current window frame. */
  current(): WindowControls;
  /**
   * Detach a panel into its own window (the "satellite" / pop-out flow).
   * Requires the `popoutWindows` capability; throws {@link CapabilityError}
   * otherwise. Check `platform.capabilities.popoutWindows` first.
   */
  popOutPanel(panelId: string, opts?: WindowOptions): Promise<ManagedWindow>;
}
