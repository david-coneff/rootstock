/**
 * Web component: modal dialog (alert, confirm, prompt).
 * Light DOM, renders as overlay + dialog box.
 *
 * Usage:
 *   <rs-dialog id="my-dialog" title="Confirm" kind="confirm">
 *     Delete this item?
 *   </rs-dialog>
 *
 *   In JS:
 *     const dialog = document.getElementById('my-dialog');
 *     dialog.show().then(result => console.log(result)); // 'ok' or 'cancel'
 *
 * Attributes:
 *   - title: dialog title (optional)
 *   - kind: 'alert' | 'confirm' | 'prompt' (default: 'alert')
 *   - ok-label: text for OK button (default: 'OK')
 *   - cancel-label: text for Cancel button (default: 'Cancel')
 *   - danger: 'true' to style OK button as danger (default: false)
 *
 * Methods:
 *   - show(): Promise<'ok' | 'cancel'> - show dialog and wait for response
 *   - showPrompt(defaultValue?: string): Promise<{ action: 'ok' | 'cancel'; value: string }>
 */
export class RSDialog extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback(): void {
    this.style.display = 'none';
  }

  show(): Promise<'ok' | 'cancel'> {
    const kind = this.getAttribute('kind') || 'alert';
    const title = this.getAttribute('title');
    const message = this.textContent || '';
    const okLabel = this.getAttribute('ok-label') || 'OK';
    const cancelLabel = this.getAttribute('cancel-label') || 'Cancel';
    const danger = this.getAttribute('danger') === 'true';

    const buttons = kind === 'alert' ? ['ok'] : ['cancel', 'ok'];

    return this.renderDialog(message, title, buttons as any, {
      okLabel,
      cancelLabel,
      danger,
    });
  }

  showPrompt(
    defaultValue = '',
  ): Promise<{ action: 'ok' | 'cancel'; value: string }> {
    const title = this.getAttribute('title');
    const message = this.textContent || '';
    const okLabel = this.getAttribute('ok-label') || 'OK';
    const cancelLabel = this.getAttribute('cancel-label') || 'Cancel';
    const danger = this.getAttribute('danger') === 'true';
    const placeholder = this.getAttribute('placeholder') || '';

    return this.renderDialog(
      message,
      title,
      ['cancel', 'ok'],
      {
        okLabel,
        cancelLabel,
        danger,
        input: true,
        defaultValue,
        placeholder,
      },
    ) as Promise<any>;
  }

  private renderDialog(
    message: string,
    title: string | null,
    buttons: ('ok' | 'cancel')[],
    opts: any,
  ): Promise<any> {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'rs-dialog-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');

      const box = document.createElement('div');
      box.className = 'rs-dialog';

      if (title) {
        const h = document.createElement('div');
        h.className = 'rs-dialog-title';
        h.textContent = title;
        box.appendChild(h);
      }

      const body = document.createElement('div');
      body.className = 'rs-dialog-body';
      body.textContent = message;
      box.appendChild(body);

      let input: HTMLInputElement | undefined;
      if (opts.input) {
        input = document.createElement('input');
        input.className = 'rs-dialog-input';
        input.value = opts.defaultValue;
        if (opts.placeholder) input.placeholder = opts.placeholder;
        box.appendChild(input);
      }

      const actions = document.createElement('div');
      actions.className = 'rs-dialog-actions';

      const finish = (action: 'ok' | 'cancel') => {
        overlay.remove();
        document.removeEventListener('keydown', onKey);
        resolve(opts.input ? { action, value: input?.value ?? '' } : action);
      };

      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && buttons.includes('cancel')) finish('cancel');
        else if (e.key === 'Enter') finish('ok');
      };

      for (const kind of buttons) {
        const btn = document.createElement('button');
        btn.className = `rs-dialog-btn rs-dialog-btn-${kind}`;
        if (kind === 'ok') {
          btn.textContent = opts.okLabel || 'OK';
          if (opts.danger) btn.classList.add('rs-dialog-btn-danger');
        } else {
          btn.textContent = opts.cancelLabel || 'Cancel';
        }
        btn.addEventListener('click', () => finish(kind));
        actions.appendChild(btn);
      }

      box.appendChild(actions);
      overlay.appendChild(box);
      document.body.appendChild(overlay);
      document.addEventListener('keydown', onKey);
      const toFocus = input ?? actions.querySelector('button');
      (toFocus as HTMLElement | null)?.focus();
    });
  }
}

customElements.define('rs-dialog', RSDialog);
