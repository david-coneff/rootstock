import { CapabilityError } from '../../core/errors.js';
import type {
  ManagedWindow,
  WindowControls,
  WindowOptions,
  WindowService,
} from '../../core/services/window.js';

/**
 * Browser window service. New windows are `window.open()` popups; pop-out
 * panels reuse the same mechanism. Capability `popoutWindows` is true whenever
 * `window.open` exists (most browsers, subject to popup blockers).
 */
export class WebWindowService implements WindowService {
  async create(opts: WindowOptions): Promise<ManagedWindow> {
    return this.openWindow(opts.id ?? `win-${Date.now()}`, opts);
  }

  async popOutPanel(panelId: string, opts: WindowOptions = {}): Promise<ManagedWindow> {
    if (typeof window === 'undefined' || typeof window.open !== 'function') {
      throw new CapabilityError('popoutWindows', 'window.open is unavailable');
    }
    return this.openWindow(panelId, { ...opts, id: panelId });
  }

  current(): WindowControls {
    return {
      minimize: () => {},
      maximize: () => {},
      unmaximize: () => {},
      close: () => window.close(),
      setTitle: (title: string) => {
        if (typeof document !== 'undefined') document.title = title;
      },
    };
  }

  private openWindow(id: string, opts: WindowOptions): ManagedWindow {
    const features = [
      opts.width ? `width=${opts.width}` : '',
      opts.height ? `height=${opts.height}` : '',
      opts.resizable === false ? 'resizable=no' : 'resizable=yes',
    ]
      .filter(Boolean)
      .join(',');

    const handle = window.open(opts.url ?? '', id, features);
    if (!handle) throw new CapabilityError('popoutWindows', 'popup was blocked');
    if (opts.title) {
      try {
        handle.document.title = opts.title;
      } catch {
        // Cross-origin or not-yet-loaded; ignore.
      }
    }

    return {
      id,
      get closed() {
        return handle.closed;
      },
      focus: () => handle.focus(),
      close: () => handle.close(),
    };
  }
}
