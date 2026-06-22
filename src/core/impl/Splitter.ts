import type { SettingsService } from '../services/settings.js';

export interface SplitterOptions {
  /** The element whose size the splitter adjusts. */
  target: HTMLElement;
  /** 'horizontal' drags change width; 'vertical' drags change height. */
  axis?: 'horizontal' | 'vertical';
  /** Handle sits on the opposite edge (drag direction inverted). */
  invert?: boolean;
  min?: number;
  max?: number;
  /** Persist the size here (keyed) when provided. */
  settings?: SettingsService;
  persistKey?: string;
  /** Called after each resize with the new size in px. */
  onResize?: (size: number) => void;
}

/**
 * A draggable divider that resizes an adjacent element along one axis, with
 * optional persistence. Generalizes tessel's pane-width/height resize grips.
 */
export class Splitter {
  private readonly handle: HTMLElement;
  private readonly opts: Required<Pick<SplitterOptions, 'axis' | 'invert' | 'min' | 'max'>> &
    SplitterOptions;

  constructor(handle: HTMLElement, opts: SplitterOptions) {
    this.handle = handle;
    this.opts = {
      axis: opts.axis ?? 'horizontal',
      invert: opts.invert ?? false,
      min: opts.min ?? 0,
      max: opts.max ?? Number.POSITIVE_INFINITY,
      ...opts,
    };
    this.restore();
    this.handle.addEventListener('mousedown', this.onDown);
  }

  /** Remove listeners. */
  dispose(): void {
    this.handle.removeEventListener('mousedown', this.onDown);
  }

  private apply(size: number): void {
    const clamped = Math.max(this.opts.min, Math.min(this.opts.max, size));
    if (this.opts.axis === 'horizontal') this.opts.target.style.width = `${clamped}px`;
    else this.opts.target.style.height = `${clamped}px`;
    this.opts.onResize?.(clamped);
    if (this.opts.settings && this.opts.persistKey) {
      this.opts.settings.set(this.opts.persistKey, clamped);
    }
  }

  private restore(): void {
    if (!this.opts.settings || !this.opts.persistKey) return;
    const saved = this.opts.settings.get<number>(this.opts.persistKey);
    if (typeof saved === 'number') this.apply(saved);
  }

  private readonly onDown = (e: MouseEvent): void => {
    e.preventDefault();
    const horizontal = this.opts.axis === 'horizontal';
    const start = horizontal ? e.clientX : e.clientY;
    const startSize = horizontal ? this.opts.target.offsetWidth : this.opts.target.offsetHeight;
    const sign = this.opts.invert ? -1 : 1;

    const onMove = (ev: MouseEvent) => {
      const now = horizontal ? ev.clientX : ev.clientY;
      this.apply(startSize + sign * (now - start));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };
}
