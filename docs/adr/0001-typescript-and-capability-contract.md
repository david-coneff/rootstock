# ADR 0001 — TypeScript + a per-target capability contract

- **Status:** Accepted
- **Date:** 2026-06-22

## Context

Rootstock is a capability abstraction layer consumed by multiple scions
(tessel, docket, future apps), each of which may ship to several deployment
targets (web/PWA, Tauri, Electron). The core risk for a layer like this is
**capability drift**: an adapter diverging from the contract, or a scion calling
a capability the current target cannot provide. Both reintroduce exactly the
per-platform bugs Rootstock exists to eliminate.

Two questions had to be settled before building:

1. TypeScript (compiled) vs. vanilla JS ESM (matching tessel today).
2. How to model the fact that targets do **not** all share the same capabilities
   (a desktop build can touch the filesystem and shell; a sandboxed browser
   build cannot).

## Decision

### TypeScript, shipped as compiled ESM + `.d.ts`

The product *is* a multi-adapter contract consumed by repos that will be
refactored often. Types are the only mechanism that mechanically guarantees N
adapters honor 1 interface, and they travel into every scion for free via
`.d.ts`. The build cost is concentrated in Rootstock; consumers import plain
compiled JS and never see the toolchain.

### Two independent mechanisms, kept separate

**Layer 1 — per-target builds (bundling).** Each target has its own entry point,
exposed through the `package.json` `exports` map:

| Import              | Entry                          |
| ------------------- | ------------------------------ |
| `rootstock`         | core contract + types only     |
| `rootstock/web`     | Web/PWA adapter                |
| `rootstock/tauri`   | Tauri adapter                  |

`@tauri-apps/*` is marked `external` and reached only by the Tauri entry, so a
browser build provably contains **zero** desktop code. (Verified: the web bundle
has no `@tauri-apps` imports.)

**Layer 2 — per-target type surfaces (the contract).** Targets are *not*
required to share one capability set. Each adapter entry returns a runtime typed
with that target's **exact** optional-capability surface, derived automatically
from the adapter via `RootstockFromAdapter<A>` + `satisfies PlatformAdapter`:

- `createWebRootstock()` → `shell` is typed `null`; referencing
  `rootstock.shell.openExternal()` in a browser build is a **compile error**.
  `fs` is `WebFsService | null` (File System Access support is
  browser-dependent), so it must be guarded.
- `createTauriRootstock()` → `fs` and `shell` are **non-null**; a desktop build
  calls `rootstock.fs.open()` directly, no guard.

A target-agnostic `Rootstock` type (optional subsystems nullable) remains
available for library code that must run against any build; it forces a guard
the same way.

This is enforced as a compile-time test in
[`examples/capability-contract.ts`](../../examples/capability-contract.ts):
`@ts-expect-error` assertions fail the build if a browser surface ever gains a
desktop-only method.

## Consequences

- Adapters cannot silently drift: a missing/mis-shaped service is a build error
  in Rootstock itself, before any scion imports it.
- A browser bundle cannot call, and cannot even reference, a capability its
  target lacks.
- Scions may legitimately maintain per-target variants; the type system makes
  each variant only see what its build can do, instead of relying on discipline.
- Rootstock takes on a build step (`tsup`). Consumers do not.
