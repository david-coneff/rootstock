import { CapabilityError } from '../../core/errors.js';
import type { OpenExternalOptions, ShellService } from '../../core/services/shell.js';
import { loadPlugin } from './plugins.js';

interface OpenerPlugin {
  openUrl?(url: string): Promise<void>;
  openPath?(path: string): Promise<void>;
}

/** Open URLs/paths in the host's default handler via the Tauri opener plugin. */
export class TauriShellService implements ShellService {
  async openExternal(target: string, opts: OpenExternalOptions = {}): Promise<void> {
    const opener = await loadPlugin<OpenerPlugin>('@tauri-apps/plugin-opener');
    if (!opener) throw new CapabilityError('shellAccess', 'opener plugin not installed');
    if (opts.asPath && opener.openPath) {
      await opener.openPath(target);
    } else if (opener.openUrl) {
      await opener.openUrl(target);
    } else {
      throw new CapabilityError('shellAccess', 'opener plugin exposes no open method');
    }
  }
}
