import * as vscode from 'vscode';

export class DomDiffContentProvider implements vscode.TextDocumentContentProvider {
  static readonly SCHEME = 'dom-snap';
  private documents = new Map<string, string>();
  private onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();

  readonly onDidChange = this.onDidChangeEmitter.event;

  provideTextDocumentContent(uri: vscode.Uri): string {
    return this.documents.get(uri.toString()) || '<!-- [DOM-Snap] No snapshot document loaded -->';
  }

  setDocument(uri: vscode.Uri, content: string): void {
    this.documents.set(uri.toString(), content);
    this.onDidChangeEmitter.fire(uri);
  }

  dispose(): void {
    this.documents.clear();
    this.onDidChangeEmitter.dispose();
  }
}
