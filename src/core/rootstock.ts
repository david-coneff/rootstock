import type { PlatformInfo } from './types.js';
import type { PlatformAdapter } from './adapter.js';
import type {
  WindowService,
  DialogService,
  FsService,
  NotificationService,
  ClipboardService,
  SettingsService,
  ThemeService,
  CommandService,
  ShellService,
  DockingService,
  MenuService,
} from './services/index.js';

/**
 * The capabilities present on *every* target. A scion can always reach these
 * regardless of where it runs.
 */
export interface RootstockCore {
  readonly platform: PlatformInfo;
  readonly window: WindowService;
  readonly dialog: DialogService;
  readonly notify: NotificationService;
  readonly clipboard: ClipboardService;
  readonly settings: SettingsService;
  readonly theme: ThemeService;
  readonly commands: CommandService;
  readonly docking: DockingService;
  readonly menus: MenuService;
}

/**
 * The runtime an adapter entry hands back, carrying that target's *exact*
 * optional-capability surface.
 *
 * This is the heart of the per-target contract: the types of `fs`/`shell` are
 * read straight off the adapter, so a build inherits precisely what its target
 * provides. The Tauri adapter's `fs` is a non-null `FsService` (call it with no
 * guard); the Web adapter's `shell` is `null` (referencing it is a *compile
 * error* in a browser build — the misuse the project exists to prevent).
 */
export type RootstockFromAdapter<A extends PlatformAdapter> = RootstockCore & {
  readonly fs: A['fs'];
  readonly shell: A['shell'];
};

/**
 * The target-agnostic view, for libraries that must run against any build.
 * Here the optional subsystems are nullable, so consumers are forced to guard
 * — the same protection, expressed for code that doesn't know its target.
 */
export type Rootstock = RootstockCore & {
  readonly fs: FsService | null;
  readonly shell: ShellService | null;
};

/**
 * Assemble a frozen runtime from a platform adapter, preserving that adapter's
 * concrete optional-capability types (see {@link RootstockFromAdapter}).
 *
 * Adapter entries build their adapter with `satisfies PlatformAdapter` (not an
 * annotation) so the literal `fs`/`shell` types survive to the return value.
 */
export function createRootstock<A extends PlatformAdapter>(adapter: A): RootstockFromAdapter<A> {
  const platform: PlatformInfo = {
    target: adapter.target,
    capabilities: Object.freeze({ ...adapter.capabilities }),
  };

  const rootstock = {
    platform,
    window: adapter.window,
    dialog: adapter.dialog,
    notify: adapter.notify,
    clipboard: adapter.clipboard,
    settings: adapter.settings,
    theme: adapter.theme,
    commands: adapter.commands,
    docking: adapter.docking,
    menus: adapter.menus,
    fs: adapter.fs,
    shell: adapter.shell,
  } as RootstockFromAdapter<A>;

  return Object.freeze(rootstock);
}
