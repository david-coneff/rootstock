/**
 * Web component: toast notification.
 * Light DOM, dismissible notification that auto-hides.
 *
 * Usage:
 *   <rs-toast level="success" timeout="3000">
 *     Operation completed successfully!
 *   </rs-toast>
 *
 * Attributes:
 *   - level: 'info' | 'success' | 'warning' | 'error' (default: 'info')
 *   - timeout: milliseconds before auto-dismiss (0 = manual dismiss only, default: 5000)
 *   - title: optional title text
 *
 * Methods:
 *   - dismiss(): void - close the toast
 *
 * Events:
 *   - dismiss: fired when toast is closed
 */
export class RSToast extends HTMLElement {
  private timeoutId: number | null = null;

  constructor() {
    super();
  }

  connectedCallback(): void {
    const level = this.getAttribute('level') || 'info';
    const timeout = parseInt(this.getAttribute('timeout') || '5000', 10);
    const title = this.getAttribute('title');

    this.className = `rs-toast rs-toast-${level}`;
    this.setAttribute('role', 'status');
    this.setAttribute('aria-live', 'polite');

    // Build content
    if (title) {
      const titleEl = document.createElement('div');
      titleEl.className = 'rs-toast-title';
      titleEl.textContent = title;
      this.insertBefore(titleEl, this.firstChild);
    }

    // Add dismiss button
    const dismissBtn = document.createElement('button');
    dismissBtn.className = 'rs-toast-dismiss';
    dismissBtn.setAttribute('aria-label', 'Dismiss');
    dismissBtn.textContent = '×';
    dismissBtn.addEventListener('click', () => this.dismiss());
    this.appendChild(dismissBtn);

    // Auto-dismiss
    if (timeout > 0) {
      this.timeoutId = window.setTimeout(() => this.dismiss(), timeout);
    }
  }

  dismiss(): void {
    if (this.timeoutId) clearTimeout(this.timeoutId);
    this.dispatchEvent(new CustomEvent('dismiss', { bubbles: true }));
    this.remove();
  }
}

/**
 * Container for toast notifications (bottom-right by default).
 * Usage:
 *   <rs-toast-container id="toasts"></rs-toast-container>
 *
 *   In JS:
 *     const container = document.getElementById('toasts');
 *     const toast = document.createElement('rs-toast');
 *     toast.setAttribute('level', 'success');
 *     toast.textContent = 'Saved!';
 *     container.appendChild(toast);
 */
export class RSToastContainer extends HTMLElement {
  connectedCallback(): void {
    this.className = 'rs-toast-container';
  }

  show(message: string, level: 'info' | 'success' | 'warning' | 'error' = 'info', timeout = 5000): void {
    const toast = document.createElement('rs-toast');
    toast.setAttribute('level', level);
    toast.setAttribute('timeout', String(timeout));
    toast.textContent = message;
    this.appendChild(toast);
  }

  showWithTitle(message: string, title: string, level: 'info' | 'success' | 'warning' | 'error' = 'info', timeout = 5000): void {
    const toast = document.createElement('rs-toast');
    toast.setAttribute('level', level);
    toast.setAttribute('title', title);
    toast.setAttribute('timeout', String(timeout));
    toast.textContent = message;
    this.appendChild(toast);
  }
}

customElements.define('rs-toast', RSToast);
customElements.define('rs-toast-container', RSToastContainer);
