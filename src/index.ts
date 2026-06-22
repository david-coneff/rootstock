// rootstock — cross-platform workbench runtime (core contract).
//
// This entry contains ZERO platform code. It exports only the capability
// contract and the helpers to assemble a runtime from an adapter. Scions
// import a per-target entry (`rootstock/web`, `rootstock/tauri`) for an
// actual runtime; libraries that only need the types import from here.

export type {
  PlatformTarget,
  PlatformInfo,
  Capabilities,
} from './core/types.js';

export type { PlatformAdapter } from './core/adapter.js';
export type { Rootstock } from './core/rootstock.js';

export * from './core/services/index.js';

export { createRootstock } from './core/rootstock.js';
export { detectTarget } from './core/detect.js';
export { CapabilityError } from './core/errors.js';
