// Component capability — a provider-resolved control factory layer.
//
// Formalizes tessel-ui's "override → Shoelace → native" resolution into a
// registry: a scion calls one stable factory (e.g. `ui.slider(opts)`) and the
// registry resolves it to the best available provider. Providers are supplied
// by the scion (tessel-ui) or shipped as optional subpath entries (Material).
//
// Material lives behind `@david-coneff/rootstock/providers/material` and is the
// ONLY module that references @material/web, lazy-loading each control's module
// on first use — so a scion that doesn't import that entry bundles zero
// Material, and one that uses only the slider bundles only the Material slider.

export interface ButtonOptions {
  label?: string;
  icon?: string;
  variant?: 'filled' | 'outlined' | 'text';
  disabled?: boolean;
  onClick?: () => void;
}

export interface ToggleOptions {
  checked?: boolean;
  label?: string;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}

export interface SliderOptions {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  onInput?: (value: number) => void;
}

export interface TextInputOptions {
  value?: string;
  placeholder?: string;
  type?: string;
  onInput?: (value: string) => void;
}

export interface SelectChoice {
  value: string;
  label: string;
}

export interface SelectOptions {
  value?: string;
  choices: SelectChoice[];
  onChange?: (value: string) => void;
}

/** The logical controls the registry knows how to resolve. */
export interface ControlFactories {
  button(options: ButtonOptions): HTMLElement;
  toggle(options: ToggleOptions): HTMLElement;
  slider(options: SliderOptions): HTMLElement;
  textInput(options: TextInputOptions): HTMLElement;
  select(options: SelectOptions): HTMLElement;
}

export type ControlKind = keyof ControlFactories;

/** A component provider supplies some or all of the control factories. */
export interface ComponentProvider {
  readonly id: string;
  readonly factories: Partial<ControlFactories>;
}

export interface ComponentService extends ControlFactories {
  /** Register a provider at the front of the resolution chain. */
  use(provider: ComponentProvider): void;
  /** Pin a control to a specific provider id (overrides chain order). */
  prefer(control: ControlKind, providerId: string): void;
  /** Provider ids currently registered, front (highest priority) first. */
  providers(): string[];
}
