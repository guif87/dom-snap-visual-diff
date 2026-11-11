import * as vscode from 'vscode';
import { PlaywrightRunner } from './services/playwrightRunner';
import { ActionRecorder } from './services/recorder';
import { DomDiffContentProvider } from './providers/domDiffContentProvider';
import { SnapshotsTreeProvider } from './providers/snapshotsTreeProvider';
import { captureBaselineCommand } from './commands/captureBaseline';
import { compareWithCurrentCommand } from './commands/compareWithCurrent';
import { recordTestCommand } from './commands/recordTest';
import { exportBugReportCommand } from './commands/exportBugReport';
import { Logger } from './utils/logger';

let playwrightRunner: PlaywrightRunner | null = null;

export function activate(context: vscode.ExtensionContext): void {
  Logger.initialize();
  Logger.info('DOM-Snap extension is activating...');

  playwrightRunner = new PlaywrightRunner();
  const actionRecorder = new ActionRecorder();

  // Register DOM Virtual Document Provider for split diff editor
  const diffProvider = new DomDiffContentProvider();
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider(
      DomDiffContentProvider.SCHEME,
      diffProvider
    )
  );

  // Register Snapshots Sidebar Tree Provider
  const workspaceRoot =
    vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : undefined;

  const snapshotsTree = new SnapshotsTreeProvider(workspaceRoot);
  vscode.window.registerTreeDataProvider('domSnapSnapshotsView', snapshotsTree);

  // Register Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('domSnap.captureBaseline', () =>
      captureBaselineCommand(playwrightRunner!, () => snapshotsTree.refresh())
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('domSnap.compareWithCurrent', () =>
      compareWithCurrentCommand(
        context.extensionUri,
        playwrightRunner!,
        diffProvider,
        () => snapshotsTree.refresh()
      )
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('domSnap.startRecordingTest', () =>
      recordTestCommand(actionRecorder)
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('domSnap.exportBugReport', () =>
      exportBugReportCommand()
    )
  );

  Logger.info('DOM-Snap extension activated successfully.');
}

export async function deactivate(): Promise<void> {
  if (playwrightRunner) {
    await playwrightRunner.close();
    playwrightRunner = null;
  }
}
