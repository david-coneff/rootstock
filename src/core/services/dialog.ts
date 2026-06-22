// Dialog capability — modal prompts.
//
// Browser adapters render custom modal components; native adapters may use OS
// dialogs. The return shapes are identical so scions never branch on target.

export interface DialogOptions {
  title?: string;
  /** Label for the confirming action (default: "OK"). */
  okLabel?: string;
  /** Label for the dismissing action (default: "Cancel"). */
  cancelLabel?: string;
  /** Visual emphasis for destructive confirmations. */
  danger?: boolean;
}

export interface PromptOptions extends DialogOptions {
  placeholder?: string;
}

export interface DialogService {
  alert(message: string, opts?: DialogOptions): Promise<void>;
  /** Resolves true when confirmed, false when dismissed. */
  confirm(message: string, opts?: DialogOptions): Promise<boolean>;
  /** Resolves the entered text, or null when dismissed. */
  prompt(message: string, defaultValue?: string, opts?: PromptOptions): Promise<string | null>;
}
