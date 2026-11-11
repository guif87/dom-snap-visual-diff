import * as fs from 'fs';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { VisualDiffResult } from '../types';

export class VisualDiffEngine {
  /**
   * Compares two PNG images pixel-by-pixel using pixelmatch and pngjs.
   */
  static compareImages(
    baselinePath: string,
    currentPath: string,
    diffOutputPath: string,
    threshold: number = 0.1
  ): VisualDiffResult {
    const img1 = PNG.sync.read(fs.readFileSync(baselinePath));
    const img2 = PNG.sync.read(fs.readFileSync(currentPath));

    const width = Math.max(img1.width, img2.width);
    const height = Math.max(img1.height, img2.height);

    // Normalize buffers to the max dimensions if heights or widths differ
    const normalizedImg1 = this.padImage(img1, width, height);
    const normalizedImg2 = this.padImage(img2, width, height);

    const diff = new PNG({ width, height });

    const diffPixels = pixelmatch(
      normalizedImg1.data,
      normalizedImg2.data,
      diff.data,
      width,
      height,
      {
        threshold,
        includeAA: true,
        diffColor: [255, 0, 96], // High-visibility magenta for QA regressions
      }
    );

    fs.writeFileSync(diffOutputPath, PNG.sync.write(diff));

    const totalPixels = width * height;
    const mismatchPercentage = totalPixels > 0 ? Number(((diffPixels / totalPixels) * 100).toFixed(2)) : 0;

    return {
      diffPixels,
      totalPixels,
      mismatchPercentage,
      diffImagePath: diffOutputPath,
      baselineImagePath: baselinePath,
      currentImagePath: currentPath,
    };
  }

  private static padImage(source: PNG, targetWidth: number, targetHeight: number): PNG {
    if (source.width === targetWidth && source.height === targetHeight) {
      return source;
    }

    const padded = new PNG({ width: targetWidth, height: targetHeight });
    // Fill transparent by default
    padded.data.fill(0);

    for (let y = 0; y < source.height; y++) {
      for (let x = 0; x < source.width; x++) {
        const srcIdx = (source.width * y + x) << 2;
        const dstIdx = (targetWidth * y + x) << 2;

        padded.data[dstIdx] = source.data[srcIdx];
        padded.data[dstIdx + 1] = source.data[srcIdx + 1];
        padded.data[dstIdx + 2] = source.data[srcIdx + 2];
        padded.data[dstIdx + 3] = source.data[srcIdx + 3];
      }
    }

    return padded;
  }
}
