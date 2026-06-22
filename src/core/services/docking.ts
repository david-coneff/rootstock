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
}

export interface DockingService {
  /** Provide the zone containers. Call once before registering panels. */
  configure(config: DockingConfig): void;

  register(panel: PanelDescriptor): void;
  unregister(id: string): void;

  dock(id: string, zone: DockZone): void;
  float(id: string, rect?: Partial<FloatRect>): void;
  /**
   * Detach a pane into its own window via Document Picture-in-Picture.
   * Requires the `popoutWindows` capability; throws {@link CapabilityError}
   * when no pop-out mechanism is available.
   */
  popOut(id: string): Promise<void>;
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
