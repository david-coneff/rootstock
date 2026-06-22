import type {
  NotificationOptions,
  NotificationService,
} from '../services/notify.js';

/**
 * In-app toast notifications rendered into a fixed container. The default for
 * webview targets; native adapters may override with OS notifications when the
 * `notifications` capability is backed by the platform.
 */
export class DomNotifier implements NotificationService {
  async show(opts: NotificationOptions): Promise<void> {
    if (typeof document === 'undefined') return;

    const container = this.container();
    const toast = document.createElement('div');
    toast.className = `rootstock-toast rootstock-toast-${opts.level ?? 'info'}`;

    if (opts.title) {
      const title = document.createElement('div');
      title.className = 'rootstock-toast-title';
      title.textContent = opts.title;
      toast.appendChild(title);
    }
    const body = document.createElement('div');
    body.className = 'rootstock-toast-body';
    body.textContent = opts.body;
    toast.appendChild(body);

    container.appendChild(toast);

    const timeout = opts.timeoutMs ?? 4000;
    if (timeout > 0) {
      setTimeout(() => toast.remove(), timeout);
    }
  }

  private container(): HTMLElement {
    let el = document.getElementById('rootstock-toasts');
    if (!el) {
      el = document.createElement('div');
      el.id = 'rootstock-toasts';
      el.className = 'rootstock-toasts';
      document.body.appendChild(el);
    }
    return el;
  }
}
