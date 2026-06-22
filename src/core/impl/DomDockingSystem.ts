import { CapabilityError } from '../errors.js';
import type { SettingsService } from '../services/settings.js';
import type {
  DockZone,
  DockingConfig,
  DockingService,
  FloatRect,
  PaneState,
  PanelDescriptor,
  WorkspaceLayout,
} from '../services/docking.js';

const DEFAULT_FLOAT: FloatRect = { x: 80, y: 80, width: 360, height: 280 };

const ZONE_CLASSES = [
  'rootstock-dock-left',
  'rootstock-dock-right',
  'rootstock-dock-top',
  'rootstock-dock-bottom',
  'rootstock-dock-center',
];

interface Registered {
  descriptor: PanelDescriptor;
  state: PaneState;
  /** Zone to return to on dockBack. */
  lastZone: DockZone;
  pipWindow?: Window | null;
}

export interface DomDockingOptions {
  /** When provided, the layout is auto-persisted here on every change. */
  settings?: SettingsService;
  /** Settings key for the persisted layout. */
  persistKey?: string;
}

/**
 * DOM-based docking subsystem shared by every webview target. Manages where
 * each pane element lives (zone container, floating, or a Picture-in-Picture
 * window), serializes that to a {@link WorkspaceLayout}, and auto-persists it.
 *
 * This is the lift target for tessel's DockSystem/FloatingPane: drag, resize,
 * splitters and URL-satellite pop-out layer on top of this state core.
 */
export class DomDockingSystem implements DockingService {
  private zones: Partial<Record<DockZone, HTMLElement>> = {};
  private readonly panels = new Map<string, Registered>();
  private readonly listeners = new Set<(layout: WorkspaceLayout) => void>();
  private readonly settings?: SettingsService;
  private readonly persistKey: string;

  constructor(opts: DomDockingOptions = {}) {
    this.settings = opts.settings;
    this.persistKey = opts.persistKey ?? 'workspace-layout';
  }

  configure(config: DockingConfig): void {
    this.zones = { ...config.zones };
    // Re-place any panels registered before configuration.
    for (const [id, p] of this.panels) {
      if (p.state.mode === 'docked') this.placeDocked(id, p.state.zone);
    }
  }

  register(panel: PanelDescriptor): void {
    const zone = panel.defaultZone ?? 'left';
    this.panels.set(panel.id, {
      descriptor: panel,
      state: { mode: 'docked', zone },
      lastZone: zone,
    });
    this.placeDocked(panel.id, zone);
    this.changed();
  }

  unregister(id: string): void {
    this.panels.delete(id);
    this.changed();
  }

  dock(id: string, zone: DockZone): void {
    const p = this.require(id);
    this.clearFloat(p);
    p.state = { mode: 'docked', zone };
    p.lastZone = zone;
    this.placeDocked(id, zone);
    this.changed();
  }

  float(id: string, rect?: Partial<FloatRect>): void {
    const p = this.require(id);
    const prev = p.state.mode === 'floating' ? p.state.rect : DEFAULT_FLOAT;
    const r: FloatRect = { ...prev, ...rect };
    p.state = { mode: 'floating', rect: r };

    const el = p.descriptor.element;
    el.classList.remove(...ZONE_CLASSES);
    el.classList.add('rootstock-pane-float');
    el.style.position = 'fixed';
    el.style.left = `${r.x}px`;
    el.style.top = `${r.y}px`;
    el.style.width = `${r.width}px`;
    el.style.height = `${r.height}px`;
    if (typeof document !== 'undefined') document.body.appendChild(el);
    this.changed();
  }

  async popOut(id: string): Promise<void> {
    const p = this.require(id);
    const pip =
      typeof window !== 'undefined'
        ? (window as unknown as { documentPictureInPicture?: PictureInPicture }).documentPictureInPicture
        : undefined;
    if (!pip || typeof pip.requestWindow !== 'function') {
      throw new CapabilityError('popoutWindows', 'Document Picture-in-Picture is unavailable');
    }

    const el = p.descriptor.element;
    const rect = el.getBoundingClientRect();
    const pipWin = await pip.requestWindow({
      width: Math.round(rect.width) || DEFAULT_FLOAT.width,
      height: Math.round(rect.height) || DEFAULT_FLOAT.height,
    });
    copyStyles(pipWin);
    pipWin.document.body.appendChild(el);
    p.pipWindow = pipWin;
    p.state = { mode: 'popped-out' };
    pipWin.addEventListener('pagehide', () => this.dockBack(id));
    this.changed();
  }

  dockBack(id: string): void {
    const p = this.require(id);
    if (p.pipWindow && !p.pipWindow.closed) {
      try {
        p.pipWindow.close();
      } catch {
        /* already gone */
      }
    }
    p.pipWindow = null;
    this.dock(id, p.lastZone);
  }

  state(id: string): PaneState | undefined {
    return this.panels.get(id)?.state;
  }

  saveLayout(): WorkspaceLayout {
    const panes: Record<string, PaneState> = {};
    for (const [id, p] of this.panels) panes[id] = p.state;
    return { version: 1, panes };
  }

  loadLayout(layout: WorkspaceLayout): void {
    if (!layout || layout.version !== 1) return;
    for (const [id, st] of Object.entries(layout.panes)) {
      if (!this.panels.has(id)) continue;
      if (st.mode === 'docked') this.dock(id, st.zone);
      else if (st.mode === 'floating') this.float(id, st.rect);
      else if (st.mode === 'popped-out') void this.popOut(id).catch(() => undefined);
    }
  }

  restorePersisted(): void {
    if (!this.settings) return;
    const saved = this.settings.get<WorkspaceLayout>(this.persistKey);
    if (saved) this.loadLayout(saved);
  }

  onLayoutChange(listener: (layout: WorkspaceLayout) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private require(id: string): Registered {
    const p = this.panels.get(id);
    if (!p) throw new Error(`Unknown panel "${id}"`);
    return p;
  }

  private placeDocked(id: string, zone: DockZone): void {
    const p = this.require(id);
    const el = p.descriptor.element;
    this.clearFloat(p);
    el.classList.remove(...ZONE_CLASSES);
    el.classList.add(`rootstock-dock-${zone}`);
    const container = this.zones[zone];
    if (container) container.appendChild(el);
  }

  private clearFloat(p: Registered): void {
    const el = p.descriptor.element;
    el.classList.remove('rootstock-pane-float');
    el.style.position = '';
    el.style.left = '';
    el.style.top = '';
    el.style.width = '';
    el.style.height = '';
  }

  private changed(): void {
    const layout = this.saveLayout();
    this.settings?.set(this.persistKey, layout);
    for (const l of this.listeners) l(layout);
  }
}

interface PictureInPicture {
  requestWindow(opts: { width: number; height: number }): Promise<Window>;
}

function copyStyles(win: Window): void {
  if (typeof document === 'undefined') return;
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const css = Array.from(sheet.cssRules)
        .map((r) => r.cssText)
        .join('');
      const style = win.document.createElement('style');
      style.textContent = css;
      win.document.head.appendChild(style);
    } catch {
      // Cross-origin stylesheet — link it by href instead.
      if (sheet.href) {
        const link = win.document.createElement('link');
        link.rel = 'stylesheet';
        link.href = sheet.href;
        win.document.head.appendChild(link);
      }
    }
  }
}
