// @david-coneff/rootstock/providers/material — optional Material Web provider.
//
// This is the ONLY module in rootstock that references @material/web. It is a
// separate subpath entry, so a scion that never imports it bundles zero
// Material. Each control's Material module is loaded via a *literal* dynamic
// import on first use, so the scion's bundler splits each into its own lazy
// chunk — using only the slider pulls only the Material slider (plus the shared
// Lit/internals floor, once), never button/select/etc.
//
// Usage in a scion:
//   import { materialProvider, materialThemeBridge } from
//     '@david-coneff/rootstock/providers/material';
//   rootstock.ui.use(materialProvider);
//   rootstock.ui.prefer('slider', 'material');
//   materialThemeBridge(rootstock.theme);   // theme Material with the app

import type {
  ButtonOptions,
  ComponentProvider,
  SelectOptions,
  SliderOptions,
  TextInputOptions,
  ToggleOptions,
} from '../../core/services/component.js';
import type { ThemeService } from '../../core/services/theme.js';

/** Memoize a loader so each Material module is imported at most once. */
function once(loader: () => Promise<unknown>): () => Promise<unknown> {
  let p: Promise<unknown> | undefined;
  return () => (p ??= loader());
}

// Each loader is a distinct literal dynamic import → a distinct lazy chunk.
const load = {
  filledButton: once(() => import('@material/web/button/filled-button.js')),
  outlinedButton: once(() => import('@material/web/button/outlined-button.js')),
  textButton: once(() => import('@material/web/button/text-button.js')),
  switch: once(() => import('@material/web/switch/switch.js')),
  slider: once(() => import('@material/web/slider/slider.js')),
  textField: once(() => import('@material/web/textfield/filled-text-field.js')),
  select: once(() => import('@material/web/select/filled-select.js')),
  selectOption: once(() => import('@material/web/select/select-option.js')),
};

function make(tag: string): HTMLElement & Record<string, unknown> {
  return document.createElement(tag) as HTMLElement & Record<string, unknown>;
}

export const materialProvider: ComponentProvider = {
  id: 'material',
  factories: {
    button(o: ButtonOptions): HTMLElement {
      const variant = o.variant ?? 'filled';
      const tag =
        variant === 'outlined' ? 'md-outlined-button' : variant === 'text' ? 'md-text-button' : 'md-filled-button';
      void (variant === 'outlined' ? load.outlinedButton() : variant === 'text' ? load.textButton() : load.filledButton());
      const el = make(tag);
      if (o.label) el.textContent = o.label;
      if (o.disabled) el.setAttribute('disabled', '');
      if (o.onClick) el.addEventListener('click', o.onClick);
      return el;
    },

    toggle(o: ToggleOptions): HTMLElement {
      void load.switch();
      const el = make('md-switch');
      el.selected = !!o.checked;
      if (o.disabled) el.setAttribute('disabled', '');
      el.addEventListener('change', () => o.onChange?.(Boolean(el.selected)));
      if (!o.label) return el;
      const label = document.createElement('label');
      label.className = 'rootstock-control rootstock-toggle';
      label.append(el, document.createTextNode(o.label));
      return label;
    },

    slider(o: SliderOptions): HTMLElement {
      void load.slider();
      const el = make('md-slider');
      if (o.min != null) el.setAttribute('min', String(o.min));
      if (o.max != null) el.setAttribute('max', String(o.max));
      if (o.step != null) el.setAttribute('step', String(o.step));
      if (o.value != null) el.setAttribute('value', String(o.value));
      el.addEventListener('input', () => o.onInput?.(Number(el.value)));
      return el;
    },

    textInput(o: TextInputOptions): HTMLElement {
      void load.textField();
      const el = make('md-filled-text-field');
      if (o.value != null) el.setAttribute('value', o.value);
      if (o.placeholder) el.setAttribute('placeholder', o.placeholder);
      if (o.type) el.setAttribute('type', o.type);
      el.addEventListener('input', () => o.onInput?.(String(el.value ?? '')));
      return el;
    },

    select(o: SelectOptions): HTMLElement {
      void load.select();
      void load.selectOption();
      const el = make('md-filled-select');
      for (const choice of o.choices) {
        const opt = make('md-select-option');
        opt.setAttribute('value', choice.value);
        opt.textContent = choice.label;
        el.appendChild(opt);
      }
      if (o.value != null) el.setAttribute('value', o.value);
      el.addEventListener('change', () => o.onChange?.(String(el.value ?? '')));
      return el;
    },
  },
};

/**
 * Bridge rootstock's theme to Material 3 tokens, so Material controls theme in
 * step with the active rootstock theme (and the A/B toggle). Returns a disposer.
 * Only emits the `--md-sys-*` tokens when this (optional) module is used.
 */
export function materialThemeBridge(theme: ThemeService): () => void {
  if (typeof document === 'undefined') return () => undefined;

  const styleId = 'rootstock-md-bridge';
  const apply = () => {
    const current = theme.current();
    const vars = theme.list().find((t) => t.id === current)?.vars ?? {};
    const pick = (k: string, fallback: string) => vars[k] ?? fallback;
    const tokens: Record<string, string> = {
      '--md-sys-color-primary': pick('--rs-accent', '#5b8af0'),
      '--md-sys-color-on-primary': pick('--rs-accent-text', '#ffffff'),
      '--md-sys-color-surface': pick('--rs-surface', '#1f1f23'),
      '--md-sys-color-surface-container': pick('--rs-surface-elevated', '#2a2a30'),
      '--md-sys-color-on-surface': pick('--rs-text', '#f2f2f4'),
      '--md-sys-color-outline': pick('--rs-border', '#3a3a42'),
    };
    let style = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }
    const body = Object.entries(tokens)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join('\n');
    style.textContent = `:root {\n${body}\n}`;
  };

  apply();
  const off = theme.onChange(apply);
  return () => {
    off();
    document.getElementById(styleId)?.remove();
  };
}
