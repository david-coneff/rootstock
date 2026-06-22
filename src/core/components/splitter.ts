import type { SettingsService } from '../services/settings.js';

/**
 * Web component: draggable divider that resizes an adjacent element along one axis.
 * Light DOM, composable with any child elements.
 *
 * Usage:
 *   <rs-splitter axis="horizontal" min="100" max="600">
 *     <div class="target-to-resize">Content</div>
 *   </rs-splitter>
 *
 * Attributes:
 *   - axis: 'horizontal' | 'vertical' (default: 'horizontal')
 *   - min: minimum size in px (default: 0)
 *   - max: maximum size in px (default: Infinity)
 *   - invert: 'true' to invert drag direction (default: false)
 *   - persist-key: localStorage key to persist size
 *
 * Events:
 *   - resize: fired with { detail: { size: number } }
 */
export class RSSplitter extends HTMLElement {
  private handle: HTMLElement | null = null;
  private target: HTMLElement | null = null;
  private settings?: SettingsService;
  private persistKey?: string;

  constructor() {
    super();
  }

  connectedCallback(): void {
    // Parse attributes
    const axis = (this.getAttribute('axis') || 'horizontal') as 'horizontal' | 'vertical';
    const min = parseInt(this.getAttribute('min') || '0', 10);
    const max = parseInt(this.getAttribute('max') || String(Number.POSITIVE_INFINITY), 10);
    const invert = this.getAttribute('invert') === 'true';
    this.persistKey = this.getAttribute('persist-key') || undefined;

    // Find or create handle
    this.handle = this.querySelector('[data-splitter-handle]') as HTMLElement;
    if (!this.handle) {
      this.handle = document.createElement('div');
      this.handle.className = 'rs-splitter-handle';
      this.handle.setAttribute('data-splitter-handle', '');
      this.appendChild(this.handle);
    }

    // Find target (direct child that's not the handle, or explicit target)
    this.target = this.querySelector('[data-splitter-target]') as HTMLElement;
    if (!this.target) {
      const children = Array.from(this.children);
      this.target = children.find((el) => el !== this.handle) as HTMLElement;
    }

    if (!this.target || !this.handle) return;

    // Restore persisted size if available
    if (this.persistKey && this.settings) {
      const saved = this.settings.get<number>(this.persistKey);
      if (typeof saved === 'number') {
        this.applySize(saved, axis, min, max);
      }
    }

    // Attach drag handler
    this.handle.addEventListener('mousedown', (e) => this.onDown(e, axis, min, max, invert));
  }

  private onDown(
    e: MouseEvent,
    axis: 'horizontal' | 'vertical',
    min: number,
    max: number,
    invert: boolean,
  ): void {
    if (!this.target || !this.handle) return;

    e.preventDefault();
    const horizontal = axis === 'horizontal';
    const start = horizontal ? e.clientX : e.clientY;
    const startSize = horizontal ? this.target.offsetWidth : this.target.offsetHeight;
    const sign = invert ? -1 : 1;

    const onMove = (ev: MouseEvent) => {
      const now = horizontal ? ev.clientX : ev.clientY;
      const newSize = startSize + sign * (now - start);
      this.applySize(newSize, axis, min, max);
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  private applySize(
    size: number,
    axis: 'horizontal' | 'vertical',
    min: number,
    max: number,
  ): void {
    if (!this.target) return;

    const clamped = Math.max(min, Math.min(max, size));
    if (axis === 'horizontal') {
      this.target.style.width = `${clamped}px`;
    } else {
      this.target.style.height = `${clamped}px`;
    }

    this.dispatchEvent(
      new CustomEvent('resize', {
        detail: { size: clamped },
        bubbles: true,
        composed: true,
      }),
    );

    if (this.persistKey && this.settings) {
      this.settings.set(this.persistKey, clamped);
    }
  }

  // Optional: set settings service for persistence
  setSettings(settings: SettingsService, key: string): void {
    this.settings = settings;
    this.persistKey = key;
  }
}

customElements.define('rs-splitter', RSSplitter);
