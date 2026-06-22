import type { CommandService } from '../services/command.js';
import type { MenuBarItem, MenuItem, MenuService } from '../services/menu.js';

/**
 * DOM menu subsystem — renders menubars, dropdowns and context menus from a
 * declarative model, dispatching leaf items through the command service.
 */
export class DomMenus implements MenuService {
  private openMenu: HTMLElement | null = null;
  private outsideHandler: ((e: Event) => void) | null = null;

  constructor(private readonly commands: CommandService) {}

  setMenuBar(container: HTMLElement, menus: MenuBarItem[]): void {
    if (typeof document === 'undefined') return;
    container.replaceChildren();
    container.classList.add('rootstock-menubar');
    for (const menu of menus) {
      const btn = document.createElement('button');
      btn.className = 'rootstock-menubar-item';
      btn.textContent = menu.label;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const wasOpen = this.openMenu !== null;
        this.closeAll();
        if (!wasOpen) {
          const rect = btn.getBoundingClientRect();
          this.openDropdown(menu.items, rect.left, rect.bottom);
        }
      });
      container.appendChild(btn);
    }
  }

  openContextMenu(items: MenuItem[], x: number, y: number): void {
    this.closeAll();
    this.openDropdown(items, x, y);
  }

  closeAll(): void {
    this.openMenu?.remove();
    this.openMenu = null;
    if (this.outsideHandler) {
      document.removeEventListener('mousedown', this.outsideHandler);
      document.removeEventListener('keydown', this.outsideHandler);
      this.outsideHandler = null;
    }
  }

  private openDropdown(items: MenuItem[], x: number, y: number): HTMLElement {
    const menu = this.buildMenu(items);
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    document.body.appendChild(menu);
    this.openMenu = menu;

    this.outsideHandler = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key !== 'Escape') return;
      if (e instanceof MouseEvent && this.openMenu?.contains(e.target as Node)) return;
      this.closeAll();
    };
    document.addEventListener('mousedown', this.outsideHandler);
    document.addEventListener('keydown', this.outsideHandler);
    return menu;
  }

  private buildMenu(items: MenuItem[]): HTMLElement {
    const menu = document.createElement('div');
    menu.className = 'rootstock-menu';
    for (const item of items) {
      if (item.separator) {
        const hr = document.createElement('div');
        hr.className = 'rootstock-menu-sep';
        menu.appendChild(hr);
        continue;
      }
      if (item.header) {
        const h = document.createElement('div');
        h.className = 'rootstock-menu-header';
        h.textContent = item.header;
        menu.appendChild(h);
        continue;
      }
      menu.appendChild(this.buildItem(item));
    }
    return menu;
  }

  private buildItem(item: MenuItem): HTMLElement {
    const row = document.createElement('div');
    row.className = 'rootstock-menu-item';
    if (item.disabled) row.classList.add('disabled');

    if (item.icon) {
      const icon = document.createElement('span');
      icon.className = 'rootstock-menu-icon';
      icon.textContent = item.icon;
      row.appendChild(icon);
    }
    const label = document.createElement('span');
    label.className = 'rootstock-menu-label';
    label.textContent = item.label ?? '';
    row.appendChild(label);

    if (item.keybinding) {
      const kb = document.createElement('kbd');
      kb.className = 'rootstock-menu-kbd';
      kb.textContent = item.keybinding;
      row.appendChild(kb);
    }

    if (item.submenu && item.submenu.length) {
      row.classList.add('has-submenu');
      const caret = document.createElement('span');
      caret.className = 'rootstock-menu-caret';
      caret.textContent = '›';
      row.appendChild(caret);
      let flyout: HTMLElement | null = null;
      row.addEventListener('mouseenter', () => {
        if (flyout || !item.submenu) return;
        flyout = this.buildMenu(item.submenu);
        flyout.classList.add('rootstock-submenu');
        const rect = row.getBoundingClientRect();
        flyout.style.left = `${rect.right}px`;
        flyout.style.top = `${rect.top}px`;
        document.body.appendChild(flyout);
      });
      row.addEventListener('mouseleave', () => {
        flyout?.remove();
        flyout = null;
      });
    } else if (!item.disabled) {
      row.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeAll();
        if (item.command) void this.commands.execute(item.command);
        else item.action?.();
      });
    }
    return row;
  }
}
