// Notification capability — transient user-facing messages.
//
// Adapters pick the best available mechanism (in-app toast, OS notification).

export type NotificationLevel = 'info' | 'success' | 'warning' | 'error';

export interface NotificationOptions {
  title?: string;
  body: string;
  level?: NotificationLevel;
  /** Auto-dismiss after this many ms. 0 / omitted = sticky where supported. */
  timeoutMs?: number;
}

export interface NotificationService {
  show(opts: NotificationOptions): Promise<void>;
}
