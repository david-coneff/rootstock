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
export { themeCatalogue, DEFAULT_THEME_ID } from './core/themes/catalogue.js';
export { readSatelliteRequest, buildSatelliteUrl } from './core/docking-satellite.js';

// Legacy API (vanilla JS classes)
export { Splitter } from './core/impl/Splitter.js';
export type { SplitterOptions } from './core/impl/Splitter.js';

// Web components API
export * from './core/components/index.js';

export type { RootstockCore, RootstockFromAdapter } from './core/rootstock.js';
