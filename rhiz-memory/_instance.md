# rhiz-memory — Rootstock Instance

**Protocol**: david-coneff/rhizome  
**Instance type**: Child repository (consumed package — the "scion runtime")  
**Project**: Rootstock — cross-platform workbench runtime and capability abstraction layer

---

## Session startup

When starting a session on rootstock under the Rhizome methodology:

1. `david-coneff/rhizome` — `protocol/core/rhiz-core.md` (always loaded)
2. `david-coneff/rhizome` — `protocol/core/rhiz-core.manifest.yaml` (select modules for task)
3. `rhiz-memory/_instance.md` (this file — project identity + the knowledge map)
4. `rhiz-memory/state/SESSION_HANDOFF.md` (current work context — create when first needed)

The Rhizome protocol specs and tooling live in `david-coneff/rhizome`. This
repository contains only project work and its own instance state under
`rhiz-memory/`.

---

## Project identity

Rootstock is a reusable application **workbench runtime and capability
abstraction layer**. Browser-based applications ("scions") program against
abstract capabilities — windows, dialogs, notifications, filesystem, clipboard,
settings, themes, commands, docking, menus — never platform APIs, and a
per-target adapter (web, pwa, tauri, later electron) decides the implementation.
It is shipped as a consumed package (TypeScript compiled to ESM + `.d.ts`);
tessel and docket are its first consumers.

Two mechanisms keep it safe across targets: per-target **builds** (a browser
build provably contains zero desktop code) and per-target **type surfaces** (a
build only exposes the capabilities its target can honor, so calling a
desktop-only method from a browser build is a compile error). See
[ADR 0001](../docs/adr/0001-typescript-and-capability-contract.md).

| Area | Directories | Description |
|------|-------------|-------------|
| Core contract | `src/core/` | `types.ts`, `adapter.ts`, `rootstock.ts`, capability interfaces + platform-agnostic subsystems |
| Adapters | `src/adapters/` | Web/PWA and Tauri adapters |
| Styles | `styles/` | Themeable `--rs-*` baseline styles |
| Examples | `examples/` | Compile-time contract proof (`capability-contract.ts`) + single-file `playground.html` |
| Build | `build.mjs`, `tsup.config.ts` | esbuild single-file demo roll-up (rhiz-Partition modality B) + tsup library packaging → `dist/` |

---

## Knowledge map

The docs that describe rootstock, all discoverable from this entry point:

- [README.md](../README.md) — overview, usage per target, capabilities, project layout, status
- [docs/FOUNDING.md](../docs/FOUNDING.md) — full vision, problem statement, philosophy, design goals
- [docs/COMPONENTS.md](../docs/COMPONENTS.md) — the framework-agnostic web components (`<rs-*>`) and their theming
- [docs/PENPOT_WORKFLOW.md](../docs/PENPOT_WORKFLOW.md) — design → specify → implement workflow for those components in Penpot
- [docs/adr/0001-typescript-and-capability-contract.md](../docs/adr/0001-typescript-and-capability-contract.md) — why TypeScript + a per-target capability contract

---

## Memory structure

| Category | Location |
|---|---|
| Governance | `rhiz-memory/_instance.md` (this file) |
| Decisions | `docs/adr/` (architecture decision records) |
| State | `rhiz-memory/state/SESSION_HANDOFF.md` (create when needed) |
| Documentation | `README.md`, `docs/` |
| Contracts | The capability contract (`src/core/adapter.ts`, `src/core/rootstock.ts`); compile-time proof in `examples/capability-contract.ts` |
| Testing | `npm run typecheck` (the contract proof is type-checked) |
| Dependencies | `package.json` (tsup, esbuild; optional `@material/web` peer); rhiz tooling run via `tools/rhiz` against the rhizome `tools-stable` channel (rhiz-lint/rhiz-search/doc-graph live in rhizome, not copied here) |
| Oversight | rhiz-lint (knowledge-base linkage integrity), run via `tools/rhiz` against the rhizome `tools-stable` channel |
