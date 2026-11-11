# DOM-Snap: AI Visual & DOM Regression for VS Code

An AI-assisted visual regression and DOM-diffing extension for Visual Studio Code, powered by Playwright and TypeScript.

---

## Key Features

1. **Visual & DOM Tree Diffing**:
   - Captures baseline and target build states with Playwright.
   - Highlights structural DOM shifts and dropped `data-testid` attributes in VS Code's native split diff editor (`vscode.diff`).
   - Generates pixel-level visual diff overlays using `pixelmatch` + `pngjs` in an interactive Webview.

2. **Instant Test Generator**:
   - Spawns an interactive browser session to record manual clicks and inputs.
   - Automatically prioritizes resilient selectors (`data-testid`, accessible ARIA roles, stable IDs) over brittle CSS XPaths.
   - Emits `@playwright/test` code directly into an active editor window.

3. **Smart Dynamic Data Masking**:
   - Scrubs volatile tokens (ISO timestamps, UUIDs, relative times, session tokens) before diffing to eliminate false positives.
   - Visually hides configurable volatile CSS selectors (`[data-volatile]`, `.timestamp`) before screenshot capture.

4. **One-Click Defect Payload Generator**:
   - Generates structured Markdown bug reports with environment telemetry, steps to reproduce, console errors, and DOM diff snippets ready for Jira, GitHub, or Linear.

---

## Getting Started

### 1. Prerequisites
- Node.js 18+ (tested on Node 20 & 22)
- VS Code 1.85+

### 2. Installation
```bash
# Install dependencies
npm install

# Install Playwright browser binaries
npx playwright install chromium
```

### 3. Build & Watch
```bash
# Compile bundle using esbuild
npm run compile

# Or run in watch mode
npm run watch
```

### 4. Running & Debugging the Extension
1. Open this repository in Visual Studio Code.
2. Press **`F5`** (or go to **Run and Debug** -> **Run DOM-Snap Extension**).
3. In the new Extension Development Host window:
   - Open Command Palette (`Cmd+Shift+P` or `Ctrl+Shift+P`).
   - Run **`DOM-Snap: Capture Baseline Snapshot`** to record an initial page state.
   - Run **`DOM-Snap: Compare Current URL Against Baseline`** to perform visual and DOM diffing.
   - Run **`DOM-Snap: Record User Actions to Playwright Test`** to interactively record tests.
   - Run **`DOM-Snap: Generate One-Click Defect Payload`** to copy a formatted bug report.

---

## Extension Commands

| Command | Identifier | Description |
|---|---|---|
| Capture Baseline | `domSnap.captureBaseline` | Captures normalized DOM and full-page screenshot into `.dom-snap/baselines/` |
| Compare Current | `domSnap.compareWithCurrent` | Compares current URL against baseline, opening `vscode.diff` and visual diff webview |
| Record Test | `domSnap.startRecordingTest` | Records browser interactions and emits resilient `@playwright/test` scripts |
| Export Bug Report | `domSnap.exportBugReport` | Creates ready-to-paste markdown bug report with console logs & mismatch statistics |

---

## Configuration Settings

You can customize DOM-Snap in your VS Code settings (`settings.json`):

```json
{
  "domSnap.defaultViewport": {
    "width": 1280,
    "height": 720
  },
  "domSnap.maskSelectors": [
    "[data-volatile]",
    ".timestamp",
    ".dynamic-token"
  ],
  "domSnap.diffTolerance": 0.1
}
```
