# Rootstock — General Roadmap

The forward plan for rootstock. Rootstock is a **cross-platform workbench runtime
and capability abstraction layer** — the reusable *parts + runtime* a scion
programs against, never the application itself and never the design IDE (see
[ADR 0002](../../docs/adr/0002-authoring-ide-boundary-penpot.md): Penpot is the
design surface). This roadmap is organized by track; within each, items are
ordered roughly by priority.

**Status legend:** ✅ done · 🔜 next · 📋 planned · 🔭 later/exploratory

---

## Where rootstock stands

Mature library + runtime, type-checked, ready for a real consumer. In place: the
capability **contract** (per-target builds + per-target type surfaces, ADR 0001),
the **web / pwa / tauri** adapters, **docking** (zones, floating drag/resize,
tabbed pane groups, splitters, PiP + satellite pop-out, layout persistence), the
**command palette + keybindings**, **menus**, the **theme engine** (catalogue +
user editing + A/B slots), and the **component layer** (`<rs-*>` web components
with native fallback + optional lazy Material provider). tessel and docket are the
named first consumers.

The honest gap is not capability breadth — it's **proof in a real app**, the
**Electron target**, and **tightening the Penpot→code seam**.

---

## Track 1 — Deployment targets (adapters)

The capability contract already names the target family `web · tauri · electron ·
mobile · future`; only the first three are built.

- ✅ Web, PWA, Tauri adapters (with the layer-1 build guarantee: a browser bundle
  provably contains zero desktop code).
- 🔜 **Electron adapter.** The most concrete near-term gap — an adapter slot exists
  in the contract but is unimplemented. Mirror the Tauri adapter's non-null
  `fs`/`shell` surface; verify the layer-1/layer-2 guarantees hold (build
  isolation + compile-time capability surface) exactly as ADR 0001 requires.
- 🔭 **Mobile / future targets.** Capacitor or a native shell. Likely a reduced
  capability surface (no `shell`, constrained `fs`); the type system should express
  the reduction, not work around it.

## Track 2 — Capability surface depth

The contract is broad; several capabilities are shallow or browser-dependent.

- 📋 Deepen **filesystem / clipboard / shell** per target, keeping the nullable
  typing honest (File System Access is browser-dependent; `shell` is desktop-only).
- 📋 **Settings / persistence** depth — durable, namespaced, migratable storage
  across targets (layout persistence exists; generalize it).
- 📋 **Capability detection** ergonomics — `rootstock.platform.capabilities`
  refinements so components adapt by capability, never by environment check.
- 🔭 **Plugin capability** — the conceptual architecture lists `plugins`; define the
  contract for third-party capability extension.

## Track 3 — Component layer (`<rs-*>`)

Current set: `rs-splitter`, `rs-dialog`, `rs-menubar`/`rs-menu`, `rs-toast`,
`rs-pane`, `rs-zone`. Framework-agnostic web components with theming via `--rs-*`.

- 📋 Grow the component set as real scions demand it (don't speculate — pull from
  tessel/docket usage).
- 📋 **Accessibility pass** (focus management, ARIA, keyboard) across all `<rs-*>`.
- 📋 Mature the **Material / Shoelace composition** story (the lazy-per-control
  optional provider) — document and test the "native fallback vs. provider" matrix.
- 📋 Component **docs + live examples** beyond `COMPONENTS.md` (the single-file
  `playground.html` is the seed).

## Track 4 — Penpot authoring workflow (the "IDE" track)

Per ADR 0002, Penpot **is** the design surface; rootstock is not an IDE. Today the
workflow ([`PENPOT_WORKFLOW.md`](../../docs/PENPOT_WORKFLOW.md)) is **manual**:
design mockups in Penpot, document specs, hand-implement against the real
components. The roadmap tightens that seam without building an IDE.

- 🔜 **Stand up a local self-hosted Penpot — THE immediate task.** Penpot needs a
  server-level (Docker) install to run; without a live instance, none of the rest of
  this track can be exercised. The point is to **actually test rootstock component
  compatibility inside the IDE** and to **validate that the interfaces/pages Penpot
  outputs render correctly with the real `<rs-*>` components**. Deliver a one-command
  local stack and a validation loop (see [`PENPOT_SELFHOST.md`](../../docs/PENPOT_SELFHOST.md)).
  This gates the three items below and is the rootstock priority right now.
- 📋 **Publish a rootstock Penpot kit.** Today the workflow says "create the
  component groups yourself." Ship an actual shared Penpot library (panes, dialogs,
  menus, toasts, zones) so designers import rootstock instead of rebuilding it.
- 📋 **Design-token round-trip.** Penpot color/tokens ↔ rootstock `--rs-*` CSS
  custom properties is hand-synced in both directions today. Define one source of
  truth and an export/import path so a token edit propagates instead of drifting.
- 🔭 **Spec → scaffold.** The pane/zone/dialog specs the workflow documents are
  regular enough to **generate code stubs** from (`<rs-zone>`/`<rs-pane>` skeletons
  with IDs/zones/min-max wired). Reduces the manual implement step.
- 🔭 **Declarative layout format.** The frontier item: a serialized workspace
  description (zones, default pane placement, command/menu wiring) the **runtime can
  load directly** — the bridge from a Penpot static design to a live rootstock
  workbench. This is what would make Penpot output *runnable*, not just a reference.

## Track 5 — Consumer adoption & dogfooding

The contract is only proven when a real app leans on it hard.

- 🔜 **Land tessel (and docket) as real scions.** First-consumer adoption is the
  validation engine: every gap a real app hits becomes a Track 2/3 item. Treat
  consumer friction as the primary backlog source.
- 📋 Capture adoption friction back into rootstock (ADRs + roadmap), so the contract
  evolves from real use rather than speculation.

## Track 6 — Packaging & distribution

- ✅ tsup library packaging → `dist/` (ESM + `.d.ts`); installable git dependency;
  esbuild single-file `playground.html` roll-up (rhiz-Partition modality B / DS-002).
- 📋 Decide the **distribution channel**: published package (npm/registry) vs.
  git-dependency-only, with per-target `exports` and versioning discipline.
- 📋 **Release/versioning** policy for a contract many scions pin against — semver on
  the capability surface; a breaking-capability change is a major.

## Track 7 — Methodology & ops

- ✅ Rhizome child-repo conformance: `rhiz-memory/`, `.rhiz-lint.json`, the
  `tools/rhiz` bootstrap on the `tools-stable` channel, the `report` step.
- 📋 Keep rhiz-lint green; add `rhiz-memory/state/SESSION_HANDOFF.md` when a
  multi-session thread warrants it.
- 🔭 Partition oversized docs (README/FOUNDING) via doc-graph if they grow past the
  line threshold — not yet needed.

---

## Near-term focus (if picking up next)

1. **Stand up local self-hosted Penpot** (Track 4) — **the immediate priority.** The
   design IDE must run locally before component compatibility can be tested or its
   output pages validated against the real `<rs-*>` components. Everything else in the
   Penpot track waits on this.
2. **Electron adapter** (Track 1) — the one named, contract-shaped gap.
3. **tessel as a real scion** (Track 5) — turn the contract from proven-by-types to
   proven-by-use; let it drive Tracks 2–3.
4. **Penpot kit + token round-trip** (Track 4) — once Penpot runs, make the documented
   design workflow real, not just a how-to.

## Provenance

Authored 2026-06-29, the first consolidated rootstock roadmap (previously the
forward plan was implicit across README §Status, FOUNDING, and `_instance.md`).
Written alongside [ADR 0002](../../docs/adr/0002-authoring-ide-boundary-penpot.md),
which settled the authoring-IDE boundary (Penpot, not a new project) that frames
Track 4.
