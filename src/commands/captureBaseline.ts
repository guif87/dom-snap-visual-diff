import * as vscode from 'vscode';
import * as path from 'path';
import { PlaywrightRunner } from '../services/playwrightRunner';
import { getDomSnapConfig } from '../utils/config';
import { Logger } from '../utils/logger';

export async function captureBaselineCommand(
  runner: PlaywrightRunner,
  onComplete?: () => void
): Promise<void> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    const action = await vscode.window.showErrorMessage(
      'DOM-Snap requires an open folder to save snapshot baselines (.dom-snap/).',
      'Open Folder'
    );
    if (action === 'Open Folder') {
      await vscode.commands.executeCommand('vscode.openFolder');
    }
    return;
  }

  const defaultUrl = 'http://localhost:3000';
  const targetUrl = await vscode.window.showInputBox({
    prompt: 'Enter the URL to capture baseline snapshot',
    value: defaultUrl,
    placeHolder: 'http://localhost:3000 or https://example.com',
  });

  if (!targetUrl) return;

  const snapshotName = await vscode.window.showInputBox({
    prompt: 'Enter snapshot identifier name',
    value: 'default',
  });

  if (!snapshotName) return;

  const config = getDomSnapConfig();
  const workspaceRoot = workspaceFolders[0].uri.fsPath;
  const baselinesDir = path.join(workspaceRoot, '.dom-snap', 'baselines');

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `DOM-Snap: Capturing baseline for ${targetUrl}...`,
      cancellable: false,
    },
    async () => {
      try {
        const metadata = await runner.captureSnapshot(
          targetUrl,
          baselinesDir,
          snapshotName,
          config.defaultViewport,
          config.maskSelectors
        );

        Logger.info(`Baseline captured: ${metadata.htmlPath}`);
        vscode.window.showInformationMessage(
          `DOM-Snap: Baseline "${snapshotName}" saved successfully!`
        );
        onComplete?.();
      } catch (err: any) {
        Logger.error('Failed to capture baseline snapshot', err);
        vscode.window.showErrorMessage(`DOM-Snap Capture Error: ${err.message}`);
      }
    }
  );
}
