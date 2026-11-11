import * as vscode from 'vscode';

export class Logger {
  private static channel: vscode.OutputChannel | null = null;

  static initialize(): void {
    if (!this.channel) {
      this.channel = vscode.window.createOutputChannel('DOM-Snap');
    }
  }

  static info(message: string): void {
    this.log(`[INFO] ${message}`);
  }

  static warn(message: string): void {
    this.log(`[WARN] ${message}`);
  }

  static error(message: string, error?: unknown): void {
    const errorDetails = error instanceof Error ? ` - ${error.stack || error.message}` : '';
    this.log(`[ERROR] ${message}${errorDetails}`);
  }

  private static log(formattedMessage: string): void {
    const timestamp = new Date().toISOString().split('T')[1].replace('Z', '');
    const entry = `[${timestamp}] ${formattedMessage}`;
    if (this.channel) {
      this.channel.appendLine(entry);
    } else {
      console.log(entry);
    }
  }

  static show(): void {
    this.channel?.show(true);
  }
}
