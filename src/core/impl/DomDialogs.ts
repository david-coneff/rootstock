import type {
  DialogOptions,
  DialogService,
  PromptOptions,
} from '../services/dialog.js';

/**
 * Custom modal dialogs rendered into the DOM — the browser implementation the
 * founding statement calls for (vs. blocking native `window.confirm`). One
 * lightweight overlay, no dependencies. Native adapters may override with OS
 * dialogs while keeping this exact contract.
 */
export class DomDialogs implements DialogService {
  async alert(message: string, opts: DialogOptions = {}): Promise<void> {
    await this.show(message, opts, ['ok']);
  }

  async confirm(message: string, opts: DialogOptions = {}): Promise<boolean> {
    const result = await this.show(message, opts, ['cancel', 'ok']);
    return result === 'ok';
  }

  async prompt(
    message: string,
    defaultValue = '',
    opts: PromptOptions = {},
  ): Promise<string | null> {
    const result = await this.show(message, opts, ['cancel', 'ok'], {
      input: true,
      defaultValue,
      placeholder: opts.placeholder,
    });
    return result.action === 'ok' ? result.value : null;
  }

  private show(
    message: string,
    opts: DialogOptions,
    buttons: Array<'ok' | 'cancel'>,
  ): Promise<'ok' | 'cancel'>;
  private show(
    message: string,
    opts: DialogOptions,
    buttons: Array<'ok' | 'cancel'>,
    field: { input: true; defaultValue: string; placeholder?: string },
  ): Promise<{ action: 'ok' | 'cancel'; value: string }>;
  private show(
    message: string,
    opts: DialogOptions,
    buttons: Array<'ok' | 'cancel'>,
    field?: { input: true; defaultValue: string; placeholder?: string },
  ): Promise<unknown> {
    if (typeof document === 'undefined') {
      // Headless fallback so the contract still resolves.
      return Promise.resolve(field ? { action: 'cancel', value: '' } : 'cancel');
    }

    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'rootstock-dialog-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');

      const box = document.createElement('div');
      box.className = 'rootstock-dialog';

      if (opts.title) {
        const h = document.createElement('div');
        h.className = 'rootstock-dialog-title';
        h.textContent = opts.title;
        box.appendChild(h);
      }

      const body = document.createElement('div');
      body.className = 'rootstock-dialog-body';
      body.textContent = message;
      box.appendChild(body);

      let input: HTMLInputElement | undefined;
      if (field) {
        input = document.createElement('input');
        input.className = 'rootstock-dialog-input';
        input.value = field.defaultValue;
        if (field.placeholder) input.placeholder = field.placeholder;
        box.appendChild(input);
      }

      const actions = document.createElement('div');
      actions.className = 'rootstock-dialog-actions';

      const finish = (action: 'ok' | 'cancel') => {
        overlay.remove();
        document.removeEventListener('keydown', onKey);
        resolve(field ? { action, value: input?.value ?? '' } : action);
      };

      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && buttons.includes('cancel')) finish('cancel');
        else if (e.key === 'Enter') finish('ok');
      };

      for (const kind of buttons) {
        const btn = document.createElement('button');
        btn.className = `rootstock-dialog-btn rootstock-dialog-btn-${kind}`;
        if (kind === 'ok') {
          btn.textContent = opts.okLabel ?? 'OK';
          if (opts.danger) btn.classList.add('rootstock-dialog-btn-danger');
        } else {
          btn.textContent = opts.cancelLabel ?? 'Cancel';
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
