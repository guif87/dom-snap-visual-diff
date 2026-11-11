import { chromium, Browser, Page } from 'playwright';
import { RecordedAction } from '../types';
import { Logger } from '../utils/logger';

export class ActionRecorder {
  private browser: Browser | null = null;
  private actions: RecordedAction[] = [];

  async startRecording(targetUrl: string): Promise<RecordedAction[]> {
    this.actions = [];
    Logger.info(`Starting interactive recorder session on ${targetUrl}...`);

    this.browser = await chromium.launch({ headless: false });
    const context = await this.browser.newContext();
    const page: Page = await context.newPage();

    this.actions.push({
      type: 'navigate',
      selector: '',
      value: targetUrl,
      timestamp: Date.now(),
      description: `Navigate to ${targetUrl}`,
    });

    // Expose action collector binding into browser window
    await page.exposeFunction('__domSnapRecordAction', (action: RecordedAction) => {
      this.actions.push(action);
      Logger.info(`Action captured: ${action.type} -> ${action.selector}`);
    });

    // Inject event listener script that derives resilient selectors
    await page.addInitScript(() => {
      function getResilientSelector(element: HTMLElement): string {
        // Priority 1: data-testid
        const testId = element.getAttribute('data-testid');
        if (testId) {
          return `getByTestId('${testId}')`;
        }

        // Priority 2: ARIA role with accessible name
        const role = element.getAttribute('role') || element.tagName.toLowerCase();
        const ariaLabel = element.getAttribute('aria-label') || element.innerText?.trim();
        if (['button', 'link', 'textbox', 'checkbox', 'radio'].includes(role) && ariaLabel && ariaLabel.length < 30) {
          return `getByRole('${role}', { name: '${ariaLabel.replace(/'/g, "\\'")}' })`;
        }

        // Priority 3: Unique ID
        if (element.id && !element.id.match(/\d{4,}/)) {
          return `locator('#${element.id}')`;
        }

        // Priority 4: Distinct text content for interactive tags
        if (['BUTTON', 'A', 'LABEL'].includes(element.tagName) && element.innerText?.trim()) {
          const text = element.innerText.trim();
          if (text.length < 25) {
            return `getByText('${text.replace(/'/g, "\\'")}')`;
          }
        }

        // Fallback: simplified tag and class name
        const className = element.className && typeof element.className === 'string'
          ? `.${element.className.trim().split(/\s+/).slice(0, 2).join('.')}`
          : '';
        return `locator('${element.tagName.toLowerCase()}${className}')`;
      }

      document.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        if (!target) return;
        const selector = getResilientSelector(target);
        (window as any).__domSnapRecordAction({
          type: 'click',
          selector,
          timestamp: Date.now(),
          description: `Click ${selector}`,
        });
      }, true);

      document.addEventListener('change', (event) => {
        const target = event.target as HTMLInputElement;
        if (!target) return;
        const selector = getResilientSelector(target);
        (window as any).__domSnapRecordAction({
          type: 'input',
          selector,
          value: target.value,
          timestamp: Date.now(),
          description: `Fill ${selector} with "${target.value}"`,
        });
      }, true);
    });

    await page.goto(targetUrl);

    // Keep session open until browser is closed by user
    await new Promise<void>((resolve) => {
      page.on('close', () => resolve());
    });

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }

    return this.actions;
  }

  static generatePlaywrightTestCode(testName: string, actions: RecordedAction[]): string {
    const actionLines: string[] = [];

    for (const action of actions) {
      if (action.type === 'navigate' && action.value) {
        actionLines.push(`  await page.goto('${action.value}');`);
      } else if (action.type === 'click') {
        actionLines.push(`  await page.${action.selector}.click();`);
      } else if (action.type === 'input') {
        const escapedValue = (action.value || '').replace(/'/g, "\\'");
        actionLines.push(`  await page.${action.selector}.fill('${escapedValue}');`);
      }
    }

    return `import { test, expect } from '@playwright/test';

test.describe('DOM-Snap Recorded Flow', () => {
  test('${testName.replace(/'/g, "\\'")}', async ({ page }) => {
${actionLines.join('\n')}

    // Assert baseline visual state or key element visibility
    await expect(page).toHaveScreenshot('${testName.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}.png');
  });
});
`;
  }
}
