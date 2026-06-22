# Rootstock: Cross-Platform Workbench Runtime

## Purpose

Rootstock is a reusable application **workbench and capability abstraction
layer** for browser-based applications that may also be deployed as desktop
applications via Tauri (and potentially Electron or other targets).

The objective is not simply to provide UI components, but to establish a stable,
modular runtime environment for common application behaviors so that individual
applications do not repeatedly solve the same problems in slightly different
ways.

Applications built on Rootstock ("**scions**") should inherit a consistent user
experience and deployment behavior while remaining free to implement their own
domain-specific functionality.

## Problem Statement

Most web applications accumulate handcrafted solutions for: window decorations,
dialogs, notifications, menus, dockable panels, floating windows, persistence,
settings, keyboard shortcuts, file operations, clipboard access, pop-out
windows, and theme management.

These implementations become tightly coupled to a particular deployment target:

- Browser APIs differ from Tauri APIs.
- Tauri APIs differ from Electron APIs.
- Window management behavior differs across environments.
- Native title bars and decorations require platform-specific handling.
- Dialogs and notifications often require entirely different implementations.

As a result, every application ends up re-solving the same problems and chasing
environment-specific bugs.

## Philosophy

Applications should interact with **abstract capabilities** rather than directly
with platform APIs.

Instead of:

```ts
window.open()
window.confirm()
__TAURI__.dialog.open()
```

applications should use:

```ts
rootstock.window.create()
rootstock.dialog.confirm()
rootstock.fs.open()
rootstock.notify.show()
```

and allow Rootstock adapters to determine the correct implementation for the
current environment.

## Design Goals

### Single application codebase (per target family)

A scion should run under Browser, PWA, Tauri desktop, Electron desktop, and
future platforms with minimal application changes. Where targets genuinely
differ in capability, the difference is expressed in the **types** — a build
only ever sees the capabilities its target can honor (see
[ADR 0001](./adr/0001-typescript-and-capability-contract.md)).

### Stable UX behaviors

Common interactions — docking, floating panes, workspace persistence, dialog
behavior, notifications, theme switching, settings storage, keyboard shortcuts —
are solved once and reused everywhere.

### Capability-based architecture

Features are exposed through capabilities rather than environment checks:

```ts
rootstock.platform.capabilities
// → { popoutWindows, nativeDecorations, filesystem, shellAccess, ... }
```

Components adapt based on capabilities rather than hardcoded platform
assumptions.

## Conceptual Architecture

```
Scion Application
        │
        ▼
──────────────────────────────
   Rootstock (capability contract)
   shell · workspace · docking · panels · commands · menus
   dialog · notifications · theme · settings · persistence · plugins
──────────────────────────────
   Platform Adapters
   web · tauri · electron · mobile · future
──────────────────────────────
   Underlying APIs
   Browser · Tauri · Electron · Native services
```

## Rootstock Is Not

- A component library only.
- A docking library only.
- A CSS framework.
- A replacement for application logic.

It is a **cross-platform workbench runtime and capability abstraction layer**.

## Inspiration

Rootstock occupies a space between JupyterLab, the VS Code Workbench,
GoldenLayout, FlexLayout, Tauri, and Shoelace — while aiming to stay
lightweight, modular, deployment-agnostic, and reusable across many
applications.

## Desired Outcome

Scions focus exclusively on their domain-specific functionality. Instead of
repeatedly solving infrastructure concerns, applications inherit a stable
workbench environment from Rootstock. Solve common UI, UX, and deployment
problems once; encapsulate them into reusable subsystems; and continuously
improve those solutions rather than maintaining many slightly different copies.
