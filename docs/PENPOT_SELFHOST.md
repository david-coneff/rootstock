# Self-hosting Penpot locally (for rootstock component testing)

Penpot is rootstock's design/authoring surface (see
[ADR 0002](adr/0002-authoring-ide-boundary-penpot.md)). Unlike a hosted design
tool, Penpot needs a **server-level (Docker) install** to run. This guide stands a
local instance up and defines the loop for **testing that rootstock `<rs-*>`
components behave as expected in Penpot and in the pages designed from it**.

This is the current rootstock priority: the design IDE has to run locally before
component compatibility can be tested or its output validated. See
[`rhiz-memory/roadmap/rootstock-roadmap.md`](../rhiz-memory/roadmap/rootstock-roadmap.md)
Track 4.

> Versions below track Penpot 2.16 (frontend served on **:9001**, Postgres 15 +
> Valkey 8). Penpot evolves — the canonical instructions are
> [help.penpot.app](https://help.penpot.app/technical-guide/getting-started/docker/);
> we **download** their compose rather than pin a copy that would drift.

---

## 1 — Prerequisites

- **Docker** + **Docker Compose v2** (`docker compose version` works).
- ~2 GB free RAM for the stack; ports **9001** (web UI) and 1080 (mailcatcher)
  free.

## 2 — One-command bring-up

From the rootstock checkout:

```bash
tools/penpot/penpot-up.sh      # downloads the official compose (once) + starts the stack
# → open http://localhost:9001
```

`penpot-down.sh` stops it; `penpot-up.sh --pull` re-fetches the compose. The script
is a thin wrapper around the official compose so we always run Penpot's real stack;
nothing about Penpot is copied into this repo (data + the downloaded compose are
git-ignored under `tools/penpot/.run/`).

Equivalent manual steps (what the script does):

```bash
mkdir -p tools/penpot/.run && cd tools/penpot/.run
curl -fsSL -o docker-compose.yaml \
  https://raw.githubusercontent.com/penpot/penpot/main/docker/images/docker-compose.yaml
docker compose -p penpot up -d        # first run pulls images; gives it a minute
```

The stack: `penpot-frontend` (UI on :9001→8080), `penpot-backend`, `penpot-exporter`
(PNG/PDF export), `penpot-mcp`, `penpot-postgres` (v15), `penpot-valkey` (Redis-API
cache), `penpot-mailcatch` (catches sign-up mail at http://localhost:1080).

## 3 — First account (registration)

Penpot ships with registration **disabled** in some builds. If the login page at
http://localhost:9001 has no "Create account":

1. In the downloaded `docker-compose.yaml`, find `PENPOT_FLAGS` and ensure it
   contains `enable-registration` (remove `disable-registration` if present).
2. `docker compose -p penpot restart penpot-backend penpot-frontend`.
3. Register your user. Email verification is off by default
   (`disable-email-verification`), so the account is usable immediately; otherwise
   grab the link from mailcatcher (:1080).
4. Optional: revert to `disable-registration` and restart, so the local instance is
   single-user.

Telemetry is opt-in; leave `enable-telemetry` **out** for a private local instance.

## 4 — The rootstock compatibility loop (the actual goal)

Penpot is a **design** tool: it doesn't run your web components on its canvas, and
its "output" is a design file plus inspectable CSS/measurements and exports (SVG/PNG,
and W3C design tokens) — not a live page. So "do the components work in the IDE and
in the pages it outputs" is validated as **design-fidelity** + **token-fidelity** +
**implement-and-compare**, not by expecting Penpot to render `<rs-*>` directly.

The loop (follow [`PENPOT_WORKFLOW.md`](PENPOT_WORKFLOW.md) for the design steps):

1. **Reference the real components.** Open the rootstock single-file
   [`examples/playground.html`](../examples/playground.html) — the ground truth for
   how `<rs-pane>`, `<rs-zone>`, `<rs-dialog>`, `<rs-menubar>`, `<rs-toast>`,
   `<rs-splitter>` actually render and theme.
2. **Build the Penpot library** from those real renders (the kit the workflow asks
   you to create), so designs are drawn with faithful component frames — not
   approximations.
3. **Design a representative page** in Penpot — menubar + left/center/right zones +
   a docked pane + a dialog — i.e. the structures `PENPOT_WORKFLOW.md` documents.
4. **Implement that page** with the real components (extend the playground or a small
   harness) from the Penpot spec (component IDs, zones, min/max, tokens).
5. **Compare.** Does the implemented page match the Penpot design? Where it can't,
   you've found either a **component gap** (the real `<rs-*>` can't express the
   design → Track 3 backlog) or a **workflow gap** (Penpot can't faithfully
   represent the component → Track 4 backlog). Record each.
6. **Tokens.** Export Penpot's color tokens and check they map cleanly to rootstock's
   `--rs-*` CSS custom properties; mismatches are the design-token round-trip
   (Track 4).

The deliverable of a full pass is a short compatibility report (what rendered
faithfully, what didn't, which side owns the fix) feeding the roadmap.

## 5 — Housekeeping

- **Stop:** `tools/penpot/penpot-down.sh` (or `docker compose -p penpot down`).
- **Wipe** (drop all Penpot data): `docker compose -p penpot down -v`.
- **Upgrade:** `penpot-up.sh --pull` then restart; Penpot requires a stop/start on
  version or config change.
- The local instance, its data volumes, and the downloaded compose are **not**
  committed — `tools/penpot/.run/` is git-ignored.

## 6 — Provenance

Added 2026-06-29 when standing up the design IDE was identified as the immediate
rootstock priority: components and the pages designed from them can't be validated
until Penpot runs locally. Scaffolding only (a wrapper over Penpot's official
compose + the validation loop); no Penpot code is vendored.
