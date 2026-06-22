import type {
  ButtonOptions,
  ComponentProvider,
  ComponentService,
  ControlFactories,
  ControlKind,
  SelectOptions,
  SliderOptions,
  TextInputOptions,
  ToggleOptions,
} from '../services/component.js';
import { nativeProvider } from './nativeProvider.js';

/**
 * Resolves logical controls to the best registered provider, with the native
 * provider as a guaranteed fallback. Registering a provider (e.g. tessel-ui or
 * Material) never pulls its dependencies into the bundle unless the scion
 * imports that provider's module — this registry only holds references the
 * scion handed it.
 */
export class ComponentRegistry implements ComponentService {
  private readonly chain: ComponentProvider[] = [];
  private readonly native = nativeProvider;
  private readonly preferences = new Map<ControlKind, string>();

  use(provider: ComponentProvider): void {
    this.chain.unshift(provider);
  }

  prefer(control: ControlKind, providerId: string): void {
    this.preferences.set(control, providerId);
  }

  providers(): string[] {
    return [...this.chain.map((p) => p.id), this.native.id];
  }

  button(options: ButtonOptions): HTMLElement {
    return this.resolve('button')(options);
  }
  toggle(options: ToggleOptions): HTMLElement {
    return this.resolve('toggle')(options);
  }
  slider(options: SliderOptions): HTMLElement {
    return this.resolve('slider')(options);
  }
  textInput(options: TextInputOptions): HTMLElement {
    return this.resolve('textInput')(options);
  }
  select(options: SelectOptions): HTMLElement {
    return this.resolve('select')(options);
  }

  private resolve<K extends ControlKind>(kind: K): ControlFactories[K] {
    const preferredId = this.preferences.get(kind);
    if (preferredId) {
      const provider = this.chain.find((p) => p.id === preferredId);
      const factory = provider?.factories[kind];
      if (factory) return factory as ControlFactories[K];
    }
    for (const provider of this.chain) {
      const factory = provider.factories[kind];
      if (factory) return factory as ControlFactories[K];
    }
    return this.native.factories[kind];
  }
}
