# ADR 0002 — Authoring/IDE boundary: Penpot is the design surface; rootstock is parts + runtime

- **Status:** Accepted
- **Date:** 2026-06-29

## Context

Rootstock describes itself as a "workbench runtime **and** capability abstraction
layer." That phrasing bundles two things, and a recurring question is whether a
**third** thing — a point-and-click IDE to assemble rootstock-based application
layouts — should be a separate project. The Shoelace analogy frames it: Shoelace
ships the parts, not the page builder that assembles them.

Separating the concern out, there are three layers:

1. **Parts** — the `<rs-*>` web components, the capability contract, and the
   per-target adapters (web/pwa/tauri/electron). Reusable primitives. *Shoelace's
   analogue.*
2. **Runtime workbench** — docking, pane groups, command palette, menus, theme
   engine, persistence: an assembled, running shell a scion instantiates and fills
   **in code** at runtime. Reusable runtime machinery. *Lumino-under-JupyterLab /
   GoldenLayout's analogue.*
3. **Authoring IDE** — a design-time, point-and-click tool where a human drags
   panels, defines zones, wires commands/menus, edits themes, and hands a design
   off to implementation. *Figma/Webflow/Penpot's analogue.*

Rootstock is layers 1 + 2. The open question was layer 3: build a new IDE project,
fold it into tessel's WYSIWYG studio, or use something external.

## Decision

**Rootstock stays parts + runtime (layers 1–2) and is NOT the authoring IDE. The
layer-3 design/authoring surface is [Penpot](https://penpot.app), an external
open-source design tool, used via the documented design→specify→implement
workflow ([`PENPOT_WORKFLOW.md`](../PENPOT_WORKFLOW.md)). No separate IDE project
is created, and the IDE is not folded into tessel.**

The cut is **runtime vs. design-time**, not "workbench vs. not":

- The **runtime** workbench (live docking/panes/commands/persistence) is reusable
  library machinery and **stays in rootstock**. A scion assembles its UI against it
  in code.
- The **design-time** point-and-click authoring (mockups, component layout, zone
  structure, tokens) is **Penpot**. Rootstock components are imported into Penpot
  as a design library; designs are specified and then implemented against the real
  web components.

Penpot is **optional**: a scion is fully hand-codable against the capability
contract without ever opening Penpot. Penpot is sugar over the same components, not
a dependency of them.

## Consequences

- Rootstock remains a pure library/runtime — broadly reusable, no editor weight,
  no IDE codebase to maintain. The ecosystem avoids a redundant project.
- The design→code step is, today, **manual** (design in Penpot, document specs,
  hand-implement). Tightening that seam is roadmap work, not a new product: a
  published rootstock **Penpot component kit**, **design-token round-trip** (Penpot
  tokens ↔ `--rs-*` CSS variables), and eventually **spec→scaffold** generation
  and/or a declarative layout format the runtime can load. See
  [`rhiz-memory/roadmap/rootstock-roadmap.md`](../../rhiz-memory/roadmap/rootstock-roadmap.md).
- tessel keeps authoring **Tessel-language documents/programs**; it does not become
  the rootstock app-layout IDE. The two authoring surfaces stay distinct (different
  artifacts).
- This boundary is now recorded so it is not re-litigated — the question had been
  decided (Penpot) and then forgotten.
