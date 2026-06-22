# Penpot Design Workflow with Rootstock Components

This document describes how to design UIs in Penpot using rootstock web components, then implement them in code.

## Overview

**Design → Specify → Implement** workflow:

1. **Design in Penpot** — Visual mockups using component frames
2. **Export specs** — Share design file or document component structure
3. **Implement in code** — Build React/vanilla JS using actual web components
4. **Iterate** — Update Penpot design, refresh implementation

## Setup

### 1. Create a Penpot Project

Create a new Penpot project for your application. Name it after your app (e.g., "docket-ui").

### 2. Set Up Design System Library

Import rootstock component definitions into Penpot as your base component library:

1. Go to **Assets** → **Components** (right sidebar)
2. Create component groups for:
   - **Panes** (docked, floating, in various zones)
   - **Dialogs** (alert, confirm, prompt)
   - **Menus** (menu bar, context menu)
   - **Toasts** (info, success, warning, error)
   - **Material Design** (buttons, inputs, etc. — import from Material Design community kit)
   - **Shoelace** (icons, form controls, etc. — import from Shoelace community kit)

### 3. Color & Token System

Define design tokens that match your rootstock theme:

Go to **Color library**:
- Primary: `#007acc` (rootstock default)
- Surface: `#ffffff`
- Text: `#1c1c1e`
- Border: `#d8d8dc`
- Error: `#d23b3b`

These will map to your CSS custom properties in implementation.

## Design Workflow

### Step 1: Create Page Layouts

For each main view in your app (e.g., "Editor", "File Inspector"), create a page:

```
Pages:
├─ Dashboard
├─ Editor
│  ├─ Default layout
│  ├─ With sidebar collapsed
│  └─ Mobile layout
├─ Inspector
└─ Dialogs
```

### Step 2: Design Outer Structure (Zones)

Start with the docking structure. Most apps have:

```
┌─────────────────────────────┐
│ Menubar                     │
├────────┬──────────┬─────────┤
│ Left   │  Center  │ Right   │
│ Zone   │  (main)  │ Zone    │
│        │          │         │
└────────┴──────────┴─────────┘
```

In Penpot:

1. Create a frame for your main layout (e.g., 1400×900)
2. Add **zone** rectangles:
   - Left zone: 300×700
   - Center zone: 800×700 (flex-grow: 1)
   - Right zone: 300×700
3. Label each with zone name (left, center, right)

### Step 3: Design Pane Components

For each pane (left sidebar, inspector, etc.):

1. Create a component instance of `<rs-pane>`
2. Add:
   - Header with drag handle (can use Material button)
   - Content area (Shoelace form controls, Material cards, etc.)
   - Resize grip (small diagonal corner element)
3. Name the pane clearly (e.g., "Inspector Pane", "File Tree Pane")
4. Document its default zone (e.g., "default zone: right")

Example: **Inspector Pane**
```
┌─────────────────┐
│ Inspector  [×]  │  ← header (draggable, has close button)
├─────────────────┤
│                 │
│ Form controls   │  ← content (Material/Shoelace)
│                 │
└─────────────────┘ ← grip (resize handle)
```

### Step 4: Design Sub-Views (Tabs, States)

For complex panes with multiple states (e.g., diff view, code editor, properties):

1. Create separate artboards for each state:
   - **"Inspector - Properties Tab"**
   - **"Inspector - Styles Tab"**
   - **"Editor - Diff View"**
   - **"Editor - Code View"**

2. In each, show exactly what that state looks like
3. Use actual Material Design and Shoelace components in your design

### Step 5: Design Dialogs

Create a "Dialogs" page with examples:

- Confirm deletion dialog
- Prompt input dialog
- Alert notification dialog

Use the `<rs-dialog>` component frame, populate with actual buttons and text.

### Step 6: Design Toasts

Create toast examples:

- Success toast: "Saved successfully"
- Error toast: "Operation failed"
- Warning toast: "Unsaved changes"

## Documenting for Implementation

Export or share your design file. Include these notes:

### 1. **Component Mapping**

Document which Penpot frames map to which code components:

```markdown
## Layout Components

### Main Layout
- **Penpot page**: "Editor / Default Layout"
- **Code component**: `<MainEditor />`
- **Structure**:
  - `<rs-menubar id="main-menu"></rs-menubar>` (top)
  - `<rs-zone name="left">` → file tree pane
  - `<rs-zone name="center">` → editor pane
  - `<rs-zone name="right">` → inspector pane

### Panes
- **Inspector Pane**: `<rs-pane id="inspector" data-zone="right">`
  - Penpot frame: "Inspector Pane"
  - Default zone: right
  - Can float/dock
  - Content: property form (Material/Shoelace)
```

### 2. **Pane Specifications**

For each pane, document:

```markdown
### Inspector Pane
- **ID**: `inspector`
- **Default Zone**: right
- **Min Width**: 250px
- **Max Width**: 600px
- **States**:
  - Empty: "No selection"
  - Properties: showing form fields
  - Styles: showing CSS editor
- **Interactions**:
  - Can float/dock/pop-out
  - Tabs switch between states
  - Close button dismisses
```

### 3. **Dialog Specifications**

```markdown
### Delete Confirmation
- **Component**: `<rs-dialog>`
- **Kind**: confirm
- **Title**: "Delete?"
- **Danger**: true (OK button is red)
- **Content**: "This action cannot be undone."
- **OK Label**: "Delete"
- **Cancel Label**: "Cancel"
```

## Implementation Checklist

When implementing from a Penpot design:

- [ ] Outer structure (zones) matches layout
- [ ] Panes have correct default zones
- [ ] Pane IDs match design documentation
- [ ] Sub-view states are all implemented (tabs wire to state)
- [ ] Material Design & Shoelace components match design
- [ ] Dragging/resizing panes works
- [ ] Theme colors apply correctly
- [ ] Responsive layouts work on smaller screens

## Iterating on Design

1. **Minor layout tweaks** (spacing, sizing):
   - Update Penpot design
   - Update CSS in code
   - No component structure change

2. **Adding a pane**:
   - Add to Penpot design
   - Document zone and ID
   - Implement as `<rs-pane>` in code

3. **Changing a sub-view**:
   - Update Penpot artboards for that state
   - Update tab/state handler in code

4. **Theme adjustments**:
   - Update color tokens in Penpot
   - Update CSS custom properties in code

## Best Practices

### Design

- ✅ Label all frames and components clearly
- ✅ Use actual Material Design & Shoelace symbols
- ✅ Show multiple states in separate artboards
- ✅ Document constraints (min/max sizes, zones)
- ✅ Keep zones clearly separated in layout

### Implementation

- ✅ Component IDs match Penpot names
- ✅ Default zones match design
- ✅ CSS custom properties match Penpot color tokens
- ✅ Comments reference Penpot frame names for easy lookup

## Example: Multi-Tab Pane

**Penpot design:**
- Frame: "Inspector Pane"
- Contains:
  - Header: "Inspector" with 3 tab buttons (Properties, Styles, Layout)
  - Content area (changes per tab)
  - Resize grip

**Implementation:**

```tsx
export function InspectorPane() {
  const [tab, setTab] = useState('properties');

  return (
    <rs-pane id="inspector" data-zone="right">
      <div data-pane-header>
        <h2>Inspector</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['Properties', 'Styles', 'Layout'].map((name) => (
            <button
              key={name}
              onClick={() => setTab(name.toLowerCase())}
              style={{
                fontWeight: tab === name.toLowerCase() ? 'bold' : 'normal',
              }}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
      <div data-pane-content>
        {tab === 'properties' && <PropertiesPanel />}
        {tab === 'styles' && <StylesPanel />}
        {tab === 'layout' && <LayoutPanel />}
      </div>
      <div data-pane-grip></div>
    </rs-pane>
  );
}
```

This maps directly to the Penpot design: outer structure matches, tab switching is local state, content changes reflect different artboards in Penpot.
