import type { Command, CommandService } from '../services/command.js';

/**
 * Platform-agnostic command registry — a subsystem rootstock solves once and
 * reuses across every adapter. Keybinding *resolution* (Mod → host modifier)
 * is left to the shell layer; this owns registration and dispatch.
 */
export class CommandRegistry implements CommandService {
  private readonly commands = new Map<string, Command>();

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
}
