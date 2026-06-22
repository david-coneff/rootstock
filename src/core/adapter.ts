import type { Capabilities, PlatformTarget } from './types.js';
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
 * The contract every platform adapter must satisfy.
 *
 * This is the linchpin of rootstock: because each adapter is typed as a
 * `PlatformAdapter`, the compiler guarantees all targets expose the *same*
 * service surface. An adapter cannot silently drift from the contract — a
 * missing or mis-shaped service is a build error in rootstock itself, before
 * any scion ever imports it.
 *
 * Optional subsystems (`fs`, `shell`) are nullable here and on
 * {@link Rootstock}; an adapter sets them to a real service exactly when it
 * advertises the matching capability.
 */
export interface PlatformAdapter {
  readonly target: PlatformTarget;
  readonly capabilities: Capabilities;

  readonly window: WindowService;
  readonly dialog: DialogService;
  readonly notify: NotificationService;
  readonly clipboard: ClipboardService;
  readonly settings: SettingsService;
  readonly theme: ThemeService;
  readonly commands: CommandService;
  readonly docking: DockingService;
  readonly menus: MenuService;

  /** Non-null iff `capabilities.filesystem`. */
  readonly fs: FsService | null;
  /** Non-null iff `capabilities.shellAccess`. */
  readonly shell: ShellService | null;
}
