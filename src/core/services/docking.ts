// Docking capability — docked panes, floating panes, pop-out, and layout
// persistence. A first-class rootstock subsystem (the founding "Docking
// System"), shaped to absorb tessel's DockSystem/FloatingPane behaviour:
//
//   - zones: left / right / top / bottom / center
//   - per-pane state: docked(zone) | floating(rect) | popped-out
//   - layout serialization for workspace persistence & restoration
//   - pop-out via Document Picture-in-Picture, capability-gated
//
// It is DOM-based and therefore shared across every webview target (web, pwa,
// tauri); only pop-out feasibility varies by capability.

export type DockZone = 'left' | 'right' | 'top' | 'bottom' | 'center';

export interface FloatRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The placement of a single pane. Serializable (no DOM references). */
export type PaneState =
  | { mode: 'docked'; zone: DockZone }
  | { mode: 'floating'; rect: FloatRect }
  | { mode: 'popped-out' };

export interface PanelDescriptor {
  /** Stable id; also the persistence key suffix. */
  id: string;
  /** The element this subsystem moves between zones / windows. */
  element: HTMLElement;
  title?: string;
  /** Placement used when no saved state exists. Defaults to 'left'. */
  defaultZone?: DockZone;
  /** Element that initiates drag while floating (e.g. the pane header). */
  dragHandle?: HTMLElement;
  /** Element that initiates resize while floating (e.g. a corner grip). */
  resizeHandle?: HTMLElement;
  /** Minimum floating size, in px. */
  minWidth?: number;
  minHeight?: number;
}

/** A serializable snapshot of the whole workspace. */
export interface WorkspaceLayout {
  version: 1;
  panes: Record<string, PaneState>;
}

/** Runtime wiring supplied by the scion (the zone containers in its DOM). */
export interface DockingConfig {
  /** Map of zone → container element the panes are docked into. */
  zones: Partial<Record<DockZone, HTMLElement>>;
  /** Pixels reserved at the top (e.g. a toolbar) that floats won't overlap. */
  topOffset?: number;
}

/**
 * How a pane detaches into its own window.
 * - `pip`: Document Picture-in-Picture (moves the live element; same process).
 * - `satellite`: a new window/WebviewWindow at the app URL + a marker param,
 *   which re-renders the panel (capability `popoutWindows`).
 * - `auto` (default): PiP when available, else satellite.
 */
export type PopOutMode = 'auto' | 'pip' | 'satellite';

export interface PopOutOptions {
  mode?: PopOutMode;
  width?: number;
  height?: number;
}

export interface DockingService {
  /** Provide the zone containers. Call once before registering panels. */
  configure(config: DockingConfig): void;

  register(panel: PanelDescriptor): void;
  unregister(id: string): void;

  dock(id: string, zone: DockZone): void;
  float(id: string, rect?: Partial<FloatRect>): void;
  /**
   * Detach a pane into its own window (see {@link PopOutOptions} for modes).
   * Throws {@link CapabilityError} when no pop-out mechanism is available.
   */
  popOut(id: string, opts?: PopOutOptions): Promise<void>;
  /** Return a floating/popped-out pane to its last docked zone. */
  dockBack(id: string): void;

  state(id: string): PaneState | undefined;

  /** Serialize the current layout (for persistence / workspace switching). */
  saveLayout(): WorkspaceLayout;
  /** Apply a previously serialized layout. */
  loadLayout(layout: WorkspaceLayout): void;
  /** Restore the layout previously auto-persisted to settings, if any. */
  restorePersisted(): void;

  onLayoutChange(listener: (layout: WorkspaceLayout) => void): () => void;
}
