import type { ClipboardService } from '../services/clipboard.js';

/** Clipboard via the async Clipboard API, with a legacy execCommand fallback. */
export class NavigatorClipboard implements ClipboardService {
  async readText(): Promise<string> {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
      return navigator.clipboard.readText();
    }
    return '';
  }

  async writeText(text: string): Promise<void> {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    if (typeof document === 'undefined') return;
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
    } finally {
      ta.remove();
    }
  }
}
