import type {
  ButtonOptions,
  ComponentProvider,
  ControlFactories,
  SelectOptions,
  SliderOptions,
  TextInputOptions,
  ToggleOptions,
} from '../services/component.js';

// Native HTML control factories — the always-available fallback at the end of
// every resolution chain. Styled via the `--rs-*` theme tokens.

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = cls;
  return node;
}

const factories: ControlFactories = {
  button(o: ButtonOptions): HTMLElement {
    const btn = el('button', `rootstock-control rootstock-button rootstock-button-${o.variant ?? 'filled'}`);
    if (o.label) btn.textContent = o.label;
    if (o.disabled) btn.disabled = true;
    if (o.onClick) btn.addEventListener('click', o.onClick);
    return btn;
  },

  toggle(o: ToggleOptions): HTMLElement {
    const label = el('label', 'rootstock-control rootstock-toggle');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = !!o.checked;
    input.disabled = !!o.disabled;
    input.addEventListener('change', () => o.onChange?.(input.checked));
    label.appendChild(input);
    if (o.label) {
      const span = document.createElement('span');
      span.textContent = o.label;
      label.appendChild(span);
    }
    return label;
  },

  slider(o: SliderOptions): HTMLElement {
    const input = el('input', 'rootstock-control rootstock-slider');
    input.type = 'range';
    if (o.min != null) input.min = String(o.min);
    if (o.max != null) input.max = String(o.max);
    if (o.step != null) input.step = String(o.step);
    if (o.value != null) input.value = String(o.value);
    input.addEventListener('input', () => o.onInput?.(Number(input.value)));
    return input;
  },

  textInput(o: TextInputOptions): HTMLElement {
    const input = el('input', 'rootstock-control rootstock-textinput');
    input.type = o.type ?? 'text';
    if (o.value != null) input.value = o.value;
    if (o.placeholder) input.placeholder = o.placeholder;
    input.addEventListener('input', () => o.onInput?.(input.value));
    return input;
  },

  select(o: SelectOptions): HTMLElement {
    const select = el('select', 'rootstock-control rootstock-select');
    for (const choice of o.choices) {
      const opt = document.createElement('option');
      opt.value = choice.value;
      opt.textContent = choice.label;
      select.appendChild(opt);
    }
    if (o.value != null) select.value = o.value;
    select.addEventListener('change', () => o.onChange?.(select.value));
    return select;
  },
};

export const nativeProvider: ComponentProvider & { readonly factories: ControlFactories } = {
  id: 'native',
  factories,
};
