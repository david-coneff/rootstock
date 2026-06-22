import type { MenuItem, MenuBarItem } from '../services/menu.js';

/**
 * Web components: menu bar, dropdown menu, context menu.
 *
 * <rs-menubar> - renders a menu bar from a menu structure
 * <rs-menu> - renders a dropdown or context menu
 *
 * Usage:
 *   <rs-menubar id="main-menu"></rs-menubar>
 *
 *   In JS:
 *     menubar.setMenus([
 *       { label: 'File', items: [
 *         { label: 'New', action: () => {...} },
 *         { label: 'Open', action: () => {...} },
 *       ]},
 *     ]);
 *
 * Context menu:
 *   document.addEventListener('contextmenu', (e) => {
 *     const menu = document.createElement('rs-menu');
 *     menu.setItems([...]);
 *     menu.open(e.clientX, e.clientY);
 *   });
 */

export class RSMenubar extends HTMLElement {
  private menus: MenuBarItem[] = [];
  private openDropdown: RSMenu | null = null;

  connectedCallback(): void {
    this.className = 'rs-menubar';
  }

  setMenus(menus: MenuBarItem[]): void {
    this.menus = menus;
    this.render();
  }

  private render(): void {
    this.replaceChildren();

    for (const menu of this.menus) {
      const btn = document.createElement('button');
      btn.className = 'rs-menubar-item';
      btn.textContent = menu.label;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const wasOpen = this.openDropdown !== null;
        this.closeAll();
        if (!wasOpen) {
          const rect = btn.getBoundingClientRect();
          this.openDropdownMenu(menu.items, rect.left, rect.bottom);
        }
      });
      this.appendChild(btn);
    }
  }

  private openDropdownMenu(items: MenuItem[], x: number, y: number): void {
    const dropdown = document.createElement('rs-menu') as RSMenu;
    dropdown.setItems(items);
    dropdown.open(x, y);
    this.openDropdown = dropdown;

    const handler = () => {
      this.closeAll();
    };
    document.addEventListener('mousedown', handler);
    dropdown.addEventListener('close', () => {
      document.removeEventListener('mousedown', handler);
      this.openDropdown = null;
    });
  }

  closeAll(): void {
    this.openDropdown?.close();
    this.openDropdown = null;
  }
}

export class RSMenu extends HTMLElement {
  private items: MenuItem[] = [];
  private el: HTMLElement | null = null;

  connectedCallback(): void {
    this.className = 'rs-menu';
  }

  setItems(items: MenuItem[]): void {
    this.items = items;
  }

  open(x: number, y: number): void {
    this.el = document.createElement('div');
    this.el.className = 'rs-menu-popup';
    this.el.style.left = `${x}px`;
    this.el.style.top = `${y}px`;

    this.buildMenuContent(this.items, this.el);
    document.body.appendChild(this.el);

    const closeHandler = (e: Event) => {
      if (
        e instanceof KeyboardEvent && e.key !== 'Escape' ||
        (e instanceof MouseEvent && this.el?.contains(e.target as Node))
      ) {
        if (!(e instanceof KeyboardEvent && e.key === 'Escape')) return;
      }
      this.close();
    };

    document.addEventListener('mousedown', closeHandler);
    document.addEventListener('keydown', closeHandler);

    this.addEventListener('close-menu', () => {
      document.removeEventListener('mousedown', closeHandler);
      document.removeEventListener('keydown', closeHandler);
    });
  }

  close(): void {
    this.el?.remove();
    this.el = null;
    this.dispatchEvent(new CustomEvent('close', { bubbles: true }));
  }

  private buildMenuContent(items: MenuItem[], container: HTMLElement): void {
    for (const item of items) {
      if (item.separator) {
        const hr = document.createElement('div');
        hr.className = 'rs-menu-separator';
        container.appendChild(hr);
        continue;
      }

      if (item.header) {
        const h = document.createElement('div');
        h.className = 'rs-menu-header';
        h.textContent = item.header;
        container.appendChild(h);
        continue;
      }

      const row = document.createElement('div');
      row.className = 'rs-menu-item';
      if (item.disabled) row.classList.add('rs-menu-item-disabled');

      if (item.icon) {
        const icon = document.createElement('span');
        icon.className = 'rs-menu-icon';
        icon.textContent = item.icon;
        row.appendChild(icon);
      }

      const label = document.createElement('span');
      label.className = 'rs-menu-label';
      label.textContent = item.label || '';
      row.appendChild(label);

      if (item.keybinding) {
        const kb = document.createElement('kbd');
        kb.className = 'rs-menu-kbd';
        kb.textContent = item.keybinding;
        row.appendChild(kb);
      }

      if (item.submenu && item.submenu.length) {
        row.classList.add('rs-menu-item-submenu');
        const caret = document.createElement('span');
        caret.className = 'rs-menu-caret';
        caret.textContent = '›';
        row.appendChild(caret);

        let flyout: HTMLElement | null = null;
        row.addEventListener('mouseenter', () => {
          if (flyout) return;
          flyout = document.createElement('div');
          flyout.className = 'rs-menu-submenu';
          this.buildMenuContent(item.submenu!, flyout);
          const rect = row.getBoundingClientRect();
          flyout.style.left = `${rect.right}px`;
          flyout.style.top = `${rect.top}px`;
          document.body.appendChild(flyout);
        });

        row.addEventListener('mouseleave', () => {
          flyout?.remove();
          flyout = null;
        });
      } else if (!item.disabled && item.action) {
        row.addEventListener('click', (e) => {
          e.stopPropagation();
          item.action?.();
          this.close();
        });
      }

      container.appendChild(row);
    }
  }
}

customElements.define('rs-menubar', RSMenubar);
customElements.define('rs-menu', RSMenu);
