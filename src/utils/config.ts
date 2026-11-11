import * as vscode from 'vscode';
import { DomSnapConfig, ViewportConfig } from '../types';

export function getDomSnapConfig(): DomSnapConfig {
  const config = vscode.workspace.getConfiguration('domSnap');

  const defaultViewport = config.get<ViewportConfig>('defaultViewport', {
    width: 1280,
    height: 720,
  });

  const maskSelectors = config.get<string[]>('maskSelectors', [
    '[data-volatile]',
    '.timestamp',
    '.dynamic-token',
  ]);

  const diffTolerance = config.get<number>('diffTolerance', 0.1);

  return {
    defaultViewport,
    maskSelectors,
    diffTolerance,
  };
}
