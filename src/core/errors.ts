/**
 * Thrown when a scion invokes a capability the current adapter cannot provide.
 *
 * The type system prevents this for whole optional subsystems (a null `fs`
 * cannot be called without a guard). This error is the runtime backstop for
 * the finer-grained cases — e.g. `window.popOutPanel()` on a target whose
 * `popoutWindows` capability is false.
 */
export class CapabilityError extends Error {
  readonly capability: string;
  constructor(capability: string, detail?: string) {
    super(
      `Capability "${capability}" is not available on this platform` +
        (detail ? `: ${detail}` : ''),
    );
    this.name = 'CapabilityError';
    this.capability = capability;
  }
}
