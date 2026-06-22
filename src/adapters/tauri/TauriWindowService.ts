import { getCurrentWindow } from '@tauri-apps/api/window';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import type {
  ManagedWindow,
  WindowControls,
  WindowOptions,
  WindowService,
} from '../../core/services/window.js';

/**
 * Tauri window service. New windows are real OS windows via `WebviewWindow`;
 * the `ManagedWindow` handle is shaped to match the browser one (a `.closed`
 * flag flipped by the `tauri://destroyed` event), so dock/satellite call sites
 * ported from tessel behave identically. Mirrors tessel's TauriBridge.
 */
export class TauriWindowService implements WindowService {
  async create(opts: WindowOptions): Promise<ManagedWindow> {
    return this.spawn(opts.id ?? `win-${Date.now()}`, opts);
  }

  async popOutPanel(panelId: string, opts: WindowOptions = {}): Promise<ManagedWindow> {
    const label = `satellite-${panelId.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
    return this.spawn(label, {
      title: panelId.replace(/-(pane|panel)$/, '').replace(/-/g, ' '),
      ...opts,
    });
  }

  current(): WindowControls {
    const win = getCurrentWindow();
    // Contract methods are sync; Tauri's are async — fire and forget.
    return {
      minimize: () => void win.minimize(),
      maximize: () => void win.maximize(),
      unmaximize: () => void win.unmaximize(),
      close: () => void win.close(),
      setTitle: (title: string) => void win.setTitle(title),
    };
  }

  private spawn(label: string, opts: WindowOptions): ManagedWindow {
    const webview = new WebviewWindow(label, {
      url: opts.url,
      title: opts.title,
      width: opts.width,
      height: opts.height,
      resizable: opts.resizable ?? true,
      decorations: true,
    });

    const handle = {
      id: label,
      closed: false,
      focus: () => void webview.setFocus(),
      close: () => void webview.close(),
    };
    webview.once('tauri://destroyed', () => {
      handle.closed = true;
    });
    return handle;
  }
}
