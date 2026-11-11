import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { PlaywrightRunner } from '../services/playwrightRunner';
import { VisualDiffEngine } from '../services/visualDiff';
import { DomNormalizer } from '../services/domNormalizer';
import { DomDiffContentProvider } from '../providers/domDiffContentProvider';
import { VisualDiffWebviewPanel } from '../providers/visualDiffWebview';
import { getDomSnapConfig } from '../utils/config';
import { Logger } from '../utils/logger';

export async function compareWithCurrentCommand(
  extensionUri: vscode.Uri,
  runner: PlaywrightRunner,
  diffProvider: DomDiffContentProvider,
  onComplete?: () => void
): Promise<void> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    vscode.window.showErrorMessage('DOM-Snap: Please open a workspace folder first.');
    return;
  }

  const workspaceRoot = workspaceFolders[0].uri.fsPath;
  const baselinesDir = path.join(workspaceRoot, '.dom-snap', 'baselines');
  const runsDir = path.join(workspaceRoot, '.dom-snap', 'runs');
  const diffsDir = path.join(workspaceRoot, '.dom-snap', 'diffs');

  const snapshotName = await vscode.window.showInputBox({
    prompt: 'Enter snapshot identifier to compare against',
    value: 'default',
  });
  if (!snapshotName) return;

  const baselineHtmlPath = path.join(baselinesDir, `${snapshotName}.html`);
  const baselineImgPath = path.join(baselinesDir, `${snapshotName}.png`);

  if (!fs.existsSync(baselineHtmlPath) || !fs.existsSync(baselineImgPath)) {
    vscode.window.showErrorMessage(
      `DOM-Snap: Baseline "${snapshotName}" not found. Please run "DOM-Snap: Capture Baseline" first.`
    );
    return;
  }

  const currentUrl = await vscode.window.showInputBox({
    prompt: 'Enter target/current URL to compare against baseline',
    value: 'http://localhost:3000',
  });
  if (!currentUrl) return;

  const config = getDomSnapConfig();

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `DOM-Snap: Comparing ${currentUrl} against baseline "${snapshotName}"...`,
      cancellable: false,
    },
    async () => {
      try {
        if (!fs.existsSync(diffsDir)) fs.mkdirSync(diffsDir, { recursive: true });

        // Capture current state
        const currentMeta = await runner.captureSnapshot(
          currentUrl,
          runsDir,
          `${snapshotName}-current`,
          config.defaultViewport,
          config.maskSelectors
        );

        // Visual Diff
        const diffImgPath = path.join(diffsDir, `${snapshotName}-diff.png`);
        const visualResult = VisualDiffEngine.compareImages(
          baselineImgPath,
          currentMeta.screenshotPath,
          diffImgPath,
          config.diffTolerance
        );

        // DOM Analysis
        const baselineHtml = fs.readFileSync(baselineHtmlPath, 'utf-8');
        const currentHtml = fs.readFileSync(currentMeta.htmlPath, 'utf-8');
        const missingTestIds = DomNormalizer.findMissingTestIds(baselineHtml, currentHtml);

        // Feed Virtual Document Provider for native VS Code diff
        const baselineUri = vscode.Uri.parse(`${DomDiffContentProvider.SCHEME}://baseline/${snapshotName}.html`);
        const currentUri = vscode.Uri.parse(`${DomDiffContentProvider.SCHEME}://current/${snapshotName}.html`);

        diffProvider.setDocument(baselineUri, baselineHtml);
        diffProvider.setDocument(currentUri, currentHtml);

        // Open native split diff editor
        await vscode.commands.executeCommand(
          'vscode.diff',
          baselineUri,
          currentUri,
          `DOM Diff: ${snapshotName} (Baseline ↔ Current)`
        );

        // Open Visual Webview
        VisualDiffWebviewPanel.render(extensionUri, visualResult);

        // Alert user of results
        if (visualResult.mismatchPercentage > 0 || missingTestIds.length > 0) {
          const testIdWarning = missingTestIds.length > 0
            ? ` | Dropped ${missingTestIds.length} data-testid(s): [${missingTestIds.join(', ')}]`
            : '';
          vscode.window.showWarningMessage(
            `DOM-Snap Regression: ${visualResult.mismatchPercentage}% visual mismatch${testIdWarning}`
          );
        } else {
          vscode.window.showInformationMessage('DOM-Snap: Pixel-perfect match! No regressions found.');
        }

        onComplete?.();
      } catch (err: any) {
        Logger.error('Failed to run comparison', err);
        vscode.window.showErrorMessage(`DOM-Snap Diff Error: ${err.message}`);
      }
    }
  );
}
