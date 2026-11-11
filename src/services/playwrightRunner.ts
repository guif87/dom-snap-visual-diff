import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { ViewportConfig, SnapshotMetadata } from '../types';
import { DomNormalizer } from './domNormalizer';
import { Logger } from '../utils/logger';

export class PlaywrightRunner {
  private browser: Browser | null = null;

  async initBrowser(): Promise<Browser> {
    if (!this.browser) {
      Logger.info('Launching Playwright Chromium instance...');
      this.browser = await chromium.launch({ headless: true });
    }
    return this.browser;
  }

  async captureSnapshot(
    url: string,
    outputDirectory: string,
    snapshotName: string,
    viewport: ViewportConfig,
    maskSelectors: string[] = []
  ): Promise<SnapshotMetadata> {
    const browser = await this.initBrowser();
    const context = await browser.newContext({
      viewport: {
        width: viewport.width,
        height: viewport.height,
      },
    });

    const page: Page = await context.newPage();
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
    });

    Logger.info(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Apply visual masking for dynamic/volatile selectors
    if (maskSelectors.length > 0) {
      const cssRules = `${maskSelectors.join(', ')} { visibility: hidden !important; }`;
      await page.addStyleTag({ content: cssRules });
    }

    // Capture and normalize DOM
    const rawHtml = await page.content();
    const normalizedHtml = DomNormalizer.normalize(rawHtml);

    if (!fs.existsSync(outputDirectory)) {
      fs.mkdirSync(outputDirectory, { recursive: true });
    }

    const htmlPath = path.join(outputDirectory, `${snapshotName}.html`);
    const screenshotPath = path.join(outputDirectory, `${snapshotName}.png`);

    fs.writeFileSync(htmlPath, normalizedHtml, 'utf-8');
    await page.screenshot({ path: screenshotPath, fullPage: true });

    await context.close();

    const metadata: SnapshotMetadata = {
      id: `${Date.now()}`,
      name: snapshotName,
      url,
      timestamp: new Date().toISOString(),
      htmlPath,
      screenshotPath,
      consoleErrors,
      viewport,
    };

    return metadata;
  }

  async close(): Promise<void> {
    if (this.browser) {
      Logger.info('Closing Playwright browser...');
      await this.browser.close();
      this.browser = null;
    }
  }
}
