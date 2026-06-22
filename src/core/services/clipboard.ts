// Clipboard capability — text read/write.

export interface ClipboardService {
  readText(): Promise<string>;
  writeText(text: string): Promise<void>;
}
