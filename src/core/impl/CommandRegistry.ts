import type {
  Command,
  CommandPaletteOptions,
  CommandService,
  KeybindingOptions,
} from '../services/command.js';

/**
 * Platform-agnostic command registry — a subsystem rootstock solves once and
 * reuses across every adapter. Owns registration, dispatch, the command
 * palette UI, and portable keybinding resolution (Mod → Cmd on macOS, Ctrl
 * elsewhere).
 */
export class CommandRegistry implements CommandService {
  private readonly commands = new Map<string, Command>();
  private paletteEl: HTMLElement | null = null;

  register(command: Command): () => void {
    if (this.commands.has(command.id)) {
      throw new Error(`Command "${command.id}" is already registered`);
    }
    this.commands.set(command.id, command);
    return () => {
      if (this.commands.get(command.id) === command) {
        this.commands.delete(command.id);
      }
    };
  }

  async execute(id: string, ...args: unknown[]): Promise<unknown> {
    const command = this.commands.get(id);
    if (!command) throw new Error(`Unknown command "${id}"`);
    if (command.isEnabled && !command.isEnabled()) {
      throw new Error(`Command "${id}" is disabled`);
    }
    return command.run(...args);
  }

  list(): ReadonlyArray<Omit<Command, 'run'>> {
    return [...this.commands.values()].map((command) => {
      const clone: Partial<Command> = { ...command };
      delete clone.run;
      return clone as Omit<Command, 'run'>;
    });
  }

  installKeybindings(options: KeybindingOptions = {}): () => void {
    if (typeof document === 'undefined') return () => undefined;
    const target = options.target ?? document;
    const paletteKey =
      options.paletteKeybinding === undefined ? 'Mod+Shift+P' : options.paletteKeybinding;

    const onKey = (e: Event) => {
      const ev = e as KeyboardEvent;
      if (paletteKey && matchesKeybinding(ev, paletteKey)) {
        ev.preventDefault();
        this.openPalette();
        return;
      }
      for (const cmd of this.commands.values()) {
        if (cmd.keybinding && matchesKeybinding(ev, cmd.keybinding)) {
          if (cmd.isEnabled && !cmd.isEnabled()) continue;
          ev.preventDefault();
          void this.execute(cmd.id);
          return;
        }
      }
    };

    target.addEventListener('keydown', onKey);
    return () => target.removeEventListener('keydown', onKey);
  }

  openPalette(options: CommandPaletteOptions = {}): void {
    if (typeof document === 'undefined') return;
    this.closePalette();

    const overlay = document.createElement('div');
    overlay.className = 'rootstock-dialog-overlay rootstock-palette-overlay';

    const box = document.createElement('div');
    box.className = 'rootstock-palette';

    const input = document.createElement('input');
    input.className = 'rootstock-palette-input';
    input.placeholder = options.placeholder ?? 'Type a command…';

    const listEl = document.createElement('div');
    listEl.className = 'rootstock-palette-list';

    box.append(input, listEl);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    this.paletteEl = overlay;

    const commands = this.list();
    let active = 0;

    const render = () => {
      const q = input.value.trim().toLowerCase();
      const matches = commands.filter(
        (c) => !q || c.label.toLowerCase().includes(q) || c.id.toLowerCase().includes(q),
      );
      active = Math.min(active, Math.max(0, matches.length - 1));
      listEl.replaceChildren();
      matches.forEach((c, i) => {
        const item = document.createElement('div');
        item.className = 'rootstock-palette-item' + (i === active ? ' active' : '');
        const label = document.createElement('span');
        label.textContent = c.category ? `${c.category}: ${c.label}` : c.label;
        item.appendChild(label);
        if (c.keybinding) {
          const kb = document.createElement('kbd');
          kb.className = 'rootstock-palette-kbd';
          kb.textContent = c.keybinding;
          item.appendChild(kb);
        }
        item.addEventListener('click', () => run(c.id));
        listEl.appendChild(item);
      });
      return matches;
    };

    const run = (id: string) => {
      this.closePalette();
      void this.execute(id);
    };

    input.addEventListener('input', render);
    input.addEventListener('keydown', (e) => {
      const matches = render();
      if (e.key === 'ArrowDown') {
        active = Math.min(active + 1, matches.length - 1);
        render();
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        active = Math.max(active - 1, 0);
        render();
        e.preventDefault();
      } else if (e.key === 'Enter') {
        if (matches[active]) run(matches[active].id);
      } else if (e.key === 'Escape') {
        this.closePalette();
      }
    });
    overlay.addEventListener('mousedown', (e) => {
      if (e.target === overlay) this.closePalette();
    });

    render();
    input.focus();
  }

  closePalette(): void {
    this.paletteEl?.remove();
    this.paletteEl = null;
  }
}

/** Does a keyboard event match a portable keybinding like 'Mod+Shift+P'? */
function matchesKeybinding(e: KeyboardEvent, binding: string): boolean {
  const parts = binding.split('+').map((p) => p.trim().toLowerCase());
  const key = parts[parts.length - 1];
  const isMac =
    typeof navigator !== 'undefined' && /mac|iphone|ipad/i.test(navigator.platform);
  const want = {
    mod: parts.includes('mod'),
    ctrl: parts.includes('ctrl') || parts.includes('control'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt') || parts.includes('option'),
    meta: parts.includes('meta') || parts.includes('cmd'),
  };
  const modActive = isMac ? e.metaKey : e.ctrlKey;
  if (want.mod && !modActive) return false;
  if (want.ctrl && !e.ctrlKey) return false;
  if (want.meta && !e.metaKey) return false;
  if (want.shift !== e.shiftKey) return false;
  if (want.alt !== e.altKey) return false;
  return e.key.toLowerCase() === key;
}
