import * as vscode from 'vscode';
import { VisualDiffResult } from '../types';

export class VisualDiffWebviewPanel {
  public static currentPanel: VisualDiffWebviewPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, diffResult: VisualDiffResult) {
    this.panel = panel;
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.update(diffResult);
  }

  public static render(extensionUri: vscode.Uri, diffResult: VisualDiffResult): void {
    if (VisualDiffWebviewPanel.currentPanel) {
      VisualDiffWebviewPanel.currentPanel.panel.reveal(vscode.ViewColumn.Beside);
      VisualDiffWebviewPanel.currentPanel.update(diffResult);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'domSnapVisualDiff',
      `Visual Diff (${diffResult.mismatchPercentage}%)`,
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.file('/')],
      }
    );

    VisualDiffWebviewPanel.currentPanel = new VisualDiffWebviewPanel(panel, diffResult);
  }

  public update(diffResult: VisualDiffResult): void {
    const webview = this.panel.webview;
    const baselineUri = webview.asWebviewUri(vscode.Uri.file(diffResult.baselineImagePath));
    const currentUri = webview.asWebviewUri(vscode.Uri.file(diffResult.currentImagePath));
    const diffUri = webview.asWebviewUri(vscode.Uri.file(diffResult.diffImagePath));

    this.panel.title = `Visual Diff (${diffResult.mismatchPercentage}%)`;
    this.panel.webview.html = this.getHtmlForWebview(baselineUri, currentUri, diffUri, diffResult);
  }

  private getHtmlForWebview(
    baselineUri: vscode.Uri,
    currentUri: vscode.Uri,
    diffUri: vscode.Uri,
    diffResult: VisualDiffResult
  ): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DOM-Snap Visual Diff</title>
  <style>
    body {
      font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
      margin: 0;
      padding: 16px;
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    .stats {
      font-size: 14px;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
      background: ${diffResult.mismatchPercentage > 0 ? '#d32f2f' : '#388e3c'};
      color: #fff;
    }
    .controls {
      margin-bottom: 16px;
      display: flex;
      gap: 12px;
      align-items: center;
    }
    button {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      padding: 6px 12px;
      cursor: pointer;
      border-radius: 2px;
    }
    button:hover {
      background: var(--vscode-button-hoverBackground);
    }
    .viewer-container {
      position: relative;
      overflow: auto;
      border: 1px solid var(--vscode-panel-border);
      max-width: 100%;
      height: 75vh;
      background: repeating-conic-gradient(#80808020 0% 25%, transparent 0% 50%) 50% / 20px 20px;
    }
    .layer-image {
      max-width: 100%;
      display: block;
    }
    .side-by-side {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
    }
    .side-col {
      text-align: center;
    }
    .side-col h4 {
      margin: 4px 0 8px;
    }
    .side-col img {
      max-width: 100%;
      border: 1px solid var(--vscode-panel-border);
    }
  </style>
</head>
<body>
  <div class="header">
    <h2>DOM-Snap Visual Diff</h2>
    <div class="stats">
      Mismatch: <span class="badge">${diffResult.mismatchPercentage}%</span>
      (${diffResult.diffPixels.toLocaleString()} divergent pixels)
    </div>
  </div>

  <div class="controls">
    <button onclick="setViewMode('diff')">Diff Highlight</button>
    <button onclick="setViewMode('sideBySide')">3-Way Comparison</button>
  </div>

  <div id="diffView" class="viewer-container">
    <img src="${diffUri}" class="layer-image" alt="Pixel Diff Overlay" />
  </div>

  <div id="sideBySideView" class="viewer-container side-by-side" style="display: none;">
    <div class="side-col">
      <h4>Baseline</h4>
      <img src="${baselineUri}" alt="Baseline" />
    </div>
    <div class="side-col">
      <h4>Current</h4>
      <img src="${currentUri}" alt="Current" />
    </div>
    <div class="side-col">
      <h4>Diff</h4>
      <img src="${diffUri}" alt="Diff" />
    </div>
  </div>

  <script>
    function setViewMode(mode) {
      document.getElementById('diffView').style.display = mode === 'diff' ? 'block' : 'none';
      document.getElementById('sideBySideView').style.display = mode === 'sideBySide' ? 'grid' : 'none';
    }
  </script>
</body>
</html>`;
  }

  public dispose(): void {
    VisualDiffWebviewPanel.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      const item = this.disposables.pop();
      if (item) {
        item.dispose();
      }
    }
  }
}
