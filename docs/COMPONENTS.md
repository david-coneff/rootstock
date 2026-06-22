# Rootstock Web Components

Rootstock provides framework-agnostic web components (custom elements) for building cross-platform UI. All components use **light DOM** (no shadow DOM) and are themeable via **CSS custom properties**.

## Philosophy

- **Framework-agnostic**: Works in React, vanilla JS, Vue, Svelte, etc.
- **Composable**: Accepts Material Design and Shoelace components as children
- **Light DOM**: All styling is exposed to the document for easy theming and Penpot design
- **Platform-aware**: Per-target builds (web, pwa, tauri) expose only platform-available capabilities

## Components

### `<rs-splitter>` — Draggable Divider

Resizes an adjacent element along one axis, with optional persistence.

**Attributes:**
- `axis`: `'horizontal'` | `'vertical'` (default: `'horizontal'`)
- `min`: minimum size in px (default: `0`)
- `max`: maximum size in px (default: `Infinity`)
- `invert`: `'true'` to invert drag direction
- `persist-key`: localStorage key for persistence

**Events:**
- `resize`: `{ detail: { size: number } }`

**Usage:**
```html
<rs-splitter axis="horizontal" min="100" max="600">
  <div data-splitter-target>Resizable content</div>
</rs-splitter>
```

### `<rs-dialog>` — Modal Dialog

Alert, confirm, and prompt dialogs.

**Attributes:**
- `title`: dialog title
- `kind`: `'alert'` | `'confirm'` | `'prompt'`
- `ok-label`: OK button text (default: 'OK')
- `cancel-label`: Cancel button text (default: 'Cancel')
- `danger`: `'true'` to style OK as destructive
- `placeholder`: prompt input placeholder

**Methods:**
- `show()`: Promise<`'ok'` | `'cancel'`>
- `showPrompt(defaultValue?)`: Promise<`{ action, value }`>

**Usage:**
```html
<rs-dialog id="confirm" title="Delete?" kind="confirm" danger="true">
  This action cannot be undone.
</rs-dialog>

<script>
  const dialog = document.getElementById('confirm');
  const result = await dialog.show(); // 'ok' or 'cancel'
</script>
```

### `<rs-menubar>` & `<rs-menu>` — Menus

Menu bar and dropdown menus dispatching through a command system.

**Usage:**
```html
<rs-menubar id="main-menu"></rs-menubar>

<script>
  const menubar = document.getElementById('main-menu');
  menubar.setMenus([
    {
      label: 'File',
      items: [
        { label: 'New', action: () => {...} },
        { separator: true },
        { label: 'Exit', action: () => {...} },
      ],
    },
  ]);
</script>
```

**Menu Item Structure:**
```ts
interface MenuItem {
  label?: string;
  action?: () => void;
  disabled?: boolean;
  icon?: string;
  keybinding?: string;
  separator?: boolean;
  header?: string;
  submenu?: MenuItem[];
}
```

### `<rs-toast>` & `<rs-toast-container>` — Notifications

Toast notifications with auto-dismiss.

**Attributes:**
- `level`: `'info'` | `'success'` | `'warning'` | `'error'`
- `timeout`: ms before auto-dismiss (0 = manual only, default: 5000)
- `title`: optional title

**Events:**
- `dismiss`: fired when toast closes

**Usage:**
```html
<rs-toast-container id="toasts"></rs-toast-container>

<script>
  const container = document.getElementById('toasts');
  container.show('Operation complete!', 'success', 3000);
  // or manually:
  const toast = document.createElement('rs-toast');
  toast.setAttribute('level', 'success');
  toast.textContent = 'Saved!';
  container.appendChild(toast);
</script>
```

### `<rs-pane>` — Draggable Resizable Pane

Part of the docking system. Draggable header, resizable edges, floating support.

**Attributes:**
- `id`: required, pane identifier
- `data-zone`: initial zone (`'left'` | `'right'` | `'top'` | `'bottom'` | `'center'`)
- `floating`: `'true'` if initially floating
- `float-x`, `float-y`: initial position

**Slots:**
- Named slot for content
- `[data-pane-header]`: draggable header
- `[data-pane-grip]`: resize grip (bottom-right)

**Methods:**
- `float(x, y)`: float to coordinates
- `dock(zone)`: move to zone
- `popOut(mode)`: pop out to satellite window (`'pip'` | `'satellite'` | `'auto'`)
- `getZone()`: current zone or `'floating'`
- `isFloating()`: boolean

**Events:**
- `pane-drag-start`, `pane-drag-end`: drag lifecycle
- `pane-resize`: `{ detail: { width?, height? } }`
- `pane-float`: `{ detail: { x, y } }`
- `pane-dock`: `{ detail: { zone } }`

**Usage:**
```html
<rs-pane id="inspector" data-zone="right">
  <div data-pane-header>Inspector</div>
  <div data-pane-content><!-- content --></div>
  <div data-pane-grip></div>
</rs-pane>

<script>
  const pane = document.getElementById('inspector');
  pane.float(100, 100);
  pane.addEventListener('pane-resize', (e) => {
    console.log(e.detail.width, e.detail.height);
  });
</script>
```

### `<rs-zone>` — Zone Container

Container for docked panes. Managed by the docking system.

**Attributes:**
- `name`: zone name (`'left'` | `'right'` | `'top'` | `'bottom'` | `'center'`)

**Methods:**
- `addPane(el)`: add pane element
- `removePane(id)`: remove pane by id
- `getPanes()`: HTMLElement[]
- `getZoneName()`: string

## Theming

All components use CSS custom properties for styling. Define at `:root`:

```css
/* Colors */
--rs-surface: background color
--rs-text-primary: primary text
--rs-text-secondary: secondary text
--rs-border-color: borders
--rs-primary: accent color

/* Specific */
--rs-dialog-bg: dialog background
--rs-menu-bg: menu background
--rs-splitter-bg: splitter handle
```

Example theme:

```css
:root {
  --rs-surface: #ffffff;
  --rs-text-primary: #000000;
  --rs-text-secondary: #666666;
  --rs-border-color: #e0e0e0;
  --rs-primary: #007acc;
}

:root.dark {
  --rs-surface: #1f1f23;
  --rs-text-primary: #f2f2f4;
  --rs-text-secondary: #aaaaaa;
  --rs-border-color: #3a3a42;
  --rs-primary: #5b8dff;
}
```

## Using in React

Web components work natively in React, but require a small bridge for controlled state:

```tsx
import { useState } from 'react';

export function MyDialog() {
  const dialogRef = useRef<HTMLElement>(null);

  const handleClick = async () => {
    const result = await dialogRef.current.show();
    if (result === 'ok') {
      // handle confirmation
    }
  };

  return (
    <>
      <button onClick={handleClick}>Delete</button>
      <rs-dialog ref={dialogRef} kind="confirm" title="Delete?">
        Are you sure?
      </rs-dialog>
    </>
  );
}
```

## Composing with Material Design & Shoelace

Since components use light DOM, you can freely mix Material Design and Shoelace elements:

```html
<rs-pane id="inspector" data-zone="right">
  <div data-pane-header>
    <h2>Inspector</h2>
  </div>
  <div data-pane-content>
    <!-- Material Design components -->
    <md-filled-button>Save</md-filled-button>
    <md-outlined-text-field label="Name"></md-outlined-text-field>
    
    <!-- Shoelace components -->
    <sl-button variant="primary">Submit</sl-button>
    <sl-input label="Email"></sl-input>
  </div>
</rs-pane>
```

## Designing in Penpot

Components are designable in Penpot because they use light DOM and expose all styling via CSS:

1. Import the `rootstock/styles.css` into your Penpot project
2. Create frames for each component state (pane docked, floating, etc.)
3. Use the actual Material Design and Shoelace symbols in your designs
4. Export the layout structure and implement as web components

See [`PENPOT_WORKFLOW.md`](./PENPOT_WORKFLOW.md) for detailed design workflow.

## Platform-Specific APIs

Per-target builds expose only platform-available capabilities:

### `rootstock/web` — Browser

- Dialogs, menus, toasts, panes (floating only via PiP or satellite window)
- No filesystem or shell

### `rootstock/pwa` — Installable web app

Superset of web with offline support and persistent storage.

### `rootstock/tauri` — Desktop

All capabilities: native dialogs, windows, filesystem, shell.

Components detect target and adjust behavior accordingly. For example, `pane.popOut()` uses Document Picture-in-Picture on web but native WebviewWindow on Tauri.
