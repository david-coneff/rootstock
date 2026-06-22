// Menu capability — menubars, dropdowns, and context menus.
//
// A declarative menu model whose leaf items dispatch through the command
// system (by `command` id) or an inline `action`. Generalizes tessel's
// InsertMenu/dropdown rendering. DOM-based; shared across webview targets.

export interface MenuItem {
  id?: string;
  label?: string;
  icon?: string;
  /** Command id to execute on click (preferred — keeps dispatch unified). */
  command?: string;
  /** Inline handler, when not backed by a command. */
  action?: () => void;
  /** Keybinding hint shown alongside the label. */
  keybinding?: string;
  /** Nested submenu. */
  submenu?: MenuItem[];
  /** Render as a divider (other fields ignored). */
  separator?: boolean;
  /** Render as a non-clickable section header. */
  header?: string;
  disabled?: boolean;
}

export interface MenuBarItem {
  label: string;
  items: MenuItem[];
}

export interface MenuService {
  /** Render a menubar into the given container element. */
  setMenuBar(container: HTMLElement, menus: MenuBarItem[]): void;
  /** Open a context menu at viewport coordinates. */
  openContextMenu(items: MenuItem[], x: number, y: number): void;
  /** Close any open dropdown or context menu. */
  closeAll(): void;
}
