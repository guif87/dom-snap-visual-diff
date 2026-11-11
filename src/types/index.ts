export interface ViewportConfig {
  width: number;
  height: number;
}

export interface DomSnapConfig {
  defaultViewport: ViewportConfig;
  maskSelectors: string[];
  diffTolerance: number;
}

export interface SnapshotMetadata {
  id: string;
  name: string;
  url: string;
  timestamp: string;
  htmlPath: string;
  screenshotPath: string;
  consoleErrors: string[];
  viewport: ViewportConfig;
}

export interface VisualDiffResult {
  diffPixels: number;
  totalPixels: number;
  mismatchPercentage: number;
  diffImagePath: string;
  baselineImagePath: string;
  currentImagePath: string;
}

export interface DomDiffResult {
  hasDifferences: boolean;
  baselineHtml: string;
  currentHtml: string;
  missingTestIds: string[];
  changedAttributesCount: number;
}

export interface RecordedAction {
  type: 'click' | 'input' | 'navigate';
  selector: string;
  value?: string;
  timestamp: number;
  description: string;
}
