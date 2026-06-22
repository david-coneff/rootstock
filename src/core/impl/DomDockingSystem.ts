import { CapabilityError } from '../errors.js';
import type { SettingsService } from '../services/settings.js';
import type { WindowService } from '../services/window.js';
import { buildSatelliteUrl } from '../docking-satellite.js';
import type {
  DockZone,
  DockingConfig,
  DockingService,
  FloatRect,
  PaneState,
  PanelDescriptor,
  PopOutOptions,
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
  /** Drag/resize handlers wired once, lazily, the first time the pane floats. */
  interactionsWired?: boolean;
}

export interface DomDockingOptions {
  /** When provided, the layout is auto-persisted here on every change. */
  settings?: SettingsService;
  /** Settings key for the persisted layout. */
  persistKey?: string;
  /** Window service used for satellite pop-out (a new window at the app URL). */
  window?: WindowService;
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
  private readonly windowService?: WindowService;
  private topOffset = 0;

  constructor(opts: DomDockingOptions = {}) {
    this.settings = opts.settings;
    this.persistKey = opts.persistKey ?? 'workspace-layout';
    this.windowService = opts.window;
  }

  configure(config: DockingConfig): void {
    this.zones = { ...config.zones };
    this.topOffset = config.topOffset ?? 0;
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
    this.wireInteractions(p);
    this.changed();
  }

  async popOut(id: string, opts: PopOutOptions = {}): Promise<void> {
    const p = this.require(id);
    const mode = opts.mode ?? 'auto';
    const usePip = (mode === 'auto' || mode === 'pip') && pipApi() !== undefined;

    if (mode === 'pip' && !usePip) {
      throw new CapabilityError('popoutWindows', 'Document Picture-in-Picture is unavailable');
    }
    if (usePip) {
      await this.popOutPip(p, opts);
    } else {
      await this.popOutSatellite(p, opts);
    }
  }

  private async popOutPip(p: Registered, opts: PopOutOptions): Promise<void> {
    const pip = pipApi();
    if (!pip) throw new CapabilityError('popoutWindows', 'Picture-in-Picture unavailable');
    const el = p.descriptor.element;
    const rect = el.getBoundingClientRect();
    const pipWin = await pip.requestWindow({
      width: opts.width ?? (Math.round(rect.width) || DEFAULT_FLOAT.width),
      height: opts.height ?? (Math.round(rect.height) || DEFAULT_FLOAT.height),
    });
    copyStyles(pipWin);
    pipWin.document.body.appendChild(el);
    p.pipWindow = pipWin;
    p.state = { mode: 'popped-out' };
    pipWin.addEventListener('pagehide', () => this.dockBack(p.descriptor.id));
    this.changed();
  }

  private async popOutSatellite(p: Registered, opts: PopOutOptions): Promise<void> {
    if (!this.windowService) {
      throw new CapabilityError('popoutWindows', 'no window service for satellite pop-out');
    }
    const el = p.descriptor.element;
    const rect = el.getBoundingClientRect();
    const id = p.descriptor.id;
    // Hide the in-place pane while the satellite renders its own copy.
    el.style.visibility = 'hidden';
    try {
      await this.windowService.create({
        id: `satellite-${id}`,
        title: p.descriptor.title ?? id,
        url: buildSatelliteUrl(id),
        width: opts.width ?? (Math.round(rect.width) || DEFAULT_FLOAT.width),
        height: opts.height ?? (Math.round(rect.height) || DEFAULT_FLOAT.height),
      });
      p.state = { mode: 'popped-out' };
      this.changed();
    } catch (e) {
      el.style.visibility = '';
      throw e;
    }
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
    el.style.visibility = '';
  }

  private changed(): void {
    const layout = this.saveLayout();
    this.settings?.set(this.persistKey, layout);
    for (const l of this.listeners) l(layout);
  }

  // --- floating drag/resize (lifted from tessel's FloatingPane) -----------

  private wireInteractions(p: Registered): void {
    if (p.interactionsWired) return;
    const { dragHandle, resizeHandle, element } = p.descriptor;
    if (dragHandle) this.setupDrag(p, dragHandle, element);
    if (resizeHandle) this.setupResize(p, resizeHandle, element);
    p.interactionsWired = true;
  }

  private setupDrag(p: Registered, handle: HTMLElement, el: HTMLElement): void {
    handle.addEventListener('mousedown', (e: MouseEvent) => {
      if (p.state.mode !== 'floating') return;
      const rect = el.getBoundingClientRect();
      const offX = e.clientX - rect.left;
      const offY = e.clientY - rect.top;
      const onMove = (ev: MouseEvent) => {
        const pos = this.clamp(el, ev.clientX - offX, ev.clientY - offY);
        el.style.left = `${pos.x}px`;
        el.style.top = `${pos.y}px`;
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        this.commitRect(p);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      e.preventDefault();
    });
  }

  private setupResize(p: Registered, handle: HTMLElement, el: HTMLElement): void {
    const minW = p.descriptor.minWidth ?? 160;
    const minH = p.descriptor.minHeight ?? 120;
    handle.addEventListener('mousedown', (e: MouseEvent) => {
      if (p.state.mode !== 'floating') return;
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startY = e.clientY;
      const startW = el.offsetWidth;
      const startH = el.offsetHeight;
      const onMove = (ev: MouseEvent) => {
        el.style.width = `${Math.max(minW, startW + ev.clientX - startX)}px`;
        el.style.height = `${Math.max(minH, startH + ev.clientY - startY)}px`;
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        this.commitRect(p);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  private commitRect(p: Registered): void {
    if (p.state.mode !== 'floating') return;
    const el = p.descriptor.element;
    p.state = {
      mode: 'floating',
      rect: {
        x: parseFloat(el.style.left) || 0,
        y: parseFloat(el.style.top) || 0,
        width: el.offsetWidth,
        height: el.offsetHeight,
      },
    };
    this.changed();
  }

  /** Clamp a position so the pane stays within the viewport, below topOffset. */
  private clamp(el: HTMLElement, x: number, y: number): { x: number; y: number } {
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const vw = typeof window !== 'undefined' ? window.innerWidth : w;
    const vh = typeof window !== 'undefined' ? window.innerHeight : h;
    return {
      x: Math.max(0, Math.min(vw - w, x)),
      y: Math.max(this.topOffset, Math.min(vh - h, y)),
    };
  }
}

function pipApi(): PictureInPicture | undefined {
  if (typeof window === 'undefined') return undefined;
  const api = (window as unknown as { documentPictureInPicture?: PictureInPicture })
    .documentPictureInPicture;
  return api && typeof api.requestWindow === 'function' ? api : undefined;
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
