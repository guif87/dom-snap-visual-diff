import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class SnapshotItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly filePath?: string,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);
    if (filePath) {
      this.tooltip = filePath;
      this.description = path.basename(filePath);
    }
  }
}

export class SnapshotsTreeProvider implements vscode.TreeDataProvider<SnapshotItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<SnapshotItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private workspaceRoot: string | undefined) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: SnapshotItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: SnapshotItem): Thenable<SnapshotItem[]> {
    if (!this.workspaceRoot) {
      return Promise.resolve([new SnapshotItem('No active workspace', vscode.TreeItemCollapsibleState.None)]);
    }

    const domSnapDir = path.join(this.workspaceRoot, '.dom-snap');

    if (!element) {
      return Promise.resolve([
        new SnapshotItem('Baselines', vscode.TreeItemCollapsibleState.Expanded),
        new SnapshotItem('Runs & Diffs', vscode.TreeItemCollapsibleState.Expanded),
      ]);
    }

    if (element.label === 'Baselines') {
      const baselinesDir = path.join(domSnapDir, 'baselines');
      return Promise.resolve(this.listSnapshotFiles(baselinesDir));
    }

    if (element.label === 'Runs & Diffs') {
      const diffsDir = path.join(domSnapDir, 'diffs');
      return Promise.resolve(this.listSnapshotFiles(diffsDir));
    }

    return Promise.resolve([]);
  }

  private listSnapshotFiles(dir: string): SnapshotItem[] {
    if (!fs.existsSync(dir)) {
      return [new SnapshotItem('Empty (run capture first)', vscode.TreeItemCollapsibleState.None)];
    }

    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.png') || f.endsWith('.html'));
    if (files.length === 0) {
      return [new SnapshotItem('No snapshots recorded', vscode.TreeItemCollapsibleState.None)];
    }

    return files.map((file) => {
      const filePath = path.join(dir, file);
      return new SnapshotItem(
        file,
        vscode.TreeItemCollapsibleState.None,
        filePath,
        {
          command: 'vscode.open',
          title: 'Open File',
          arguments: [vscode.Uri.file(filePath)],
        }
      );
    });
  }
}
