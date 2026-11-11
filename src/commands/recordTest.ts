import * as vscode from 'vscode';
import { ActionRecorder } from '../services/recorder';
import { Logger } from '../utils/logger';

export async function recordTestCommand(recorder: ActionRecorder): Promise<void> {
  const startUrl = await vscode.window.showInputBox({
    prompt: 'Enter starting URL for interactive recorder',
    value: 'http://localhost:3000',
  });
  if (!startUrl) return;

  const testName = await vscode.window.showInputBox({
    prompt: 'Enter name for generated Playwright test',
    value: 'user checkout flow verification',
  });
  if (!testName) return;

  vscode.window.showInformationMessage(
    'DOM-Snap: Browser opened. Perform your manual clicks/inputs, then close the browser window to generate test code.'
  );

  try {
    const actions = await recorder.startRecording(startUrl);

    if (actions.length === 0) {
      vscode.window.showWarningMessage('DOM-Snap: No actions recorded.');
      return;
    }

    const testCode = ActionRecorder.generatePlaywrightTestCode(testName, actions);

    // Create a new untitled document with typescript language mode
    const doc = await vscode.workspace.openTextDocument({
      language: 'typescript',
      content: testCode,
    });

    await vscode.window.showTextDocument(doc);
    vscode.window.showInformationMessage(
      `DOM-Snap: Generated Playwright test with ${actions.length} resilient action(s)!`
    );
  } catch (err: any) {
    Logger.error('Failed recording session', err);
    vscode.window.showErrorMessage(`DOM-Snap Recorder Error: ${err.message}`);
  }
}
