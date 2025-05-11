import path from 'path';
import { promises as fs } from 'fs';
import screenshot from 'screenshot-desktop';
import { logger } from '../utils/logger.js';

// Type for region to capture
type CaptureRegion = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

// Ensure the screenshots directory exists
async function ensureScreenshotsDir(): Promise<string> {
  const screenshotsDir = path.join(process.cwd(), 'screenshots');
  
  try {
    await fs.mkdir(screenshotsDir, { recursive: true });
  } catch (error) {
    logger.error('Error creating screenshots directory:', error);
    throw error;
  }
  
  return screenshotsDir;
}

/**
 * Captures the screen or a specific region of it
 * @param region Optional region to capture
 * @param outputPath Optional specific path to save the screenshot
 * @returns Path to the saved screenshot
 */
export async function captureScreen(region?: CaptureRegion, outputPath?: string): Promise<string> {
  try {
    const screenshotsDir = await ensureScreenshotsDir();
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = outputPath ? path.basename(outputPath) : `screenshot-${timestamp}.png`;
    const filepath = outputPath || path.join(screenshotsDir, filename);
    
    logger.info(`Capturing screen${region ? ' with region' : ''}`);
    
    // If a specific region is requested, we need to capture the full screen first
    // and then crop it, as screenshot-desktop doesn't support region capture directly
    if (region) {
      const imgBuffer = await screenshot({ format: 'png' });
      
      // TODO: Add image manipulation to crop the region
      // For now, we'll just save the full screenshot
      await fs.writeFile(filepath, imgBuffer);
      logger.warn('Region capture is not fully implemented, saving full screenshot');
    } else {
      // Capture full screen
      try {
        await screenshot({ filename: filepath });
      } catch (error) {
        // Try alternative method if the first one fails
        const imgBuffer = await screenshot({ format: 'png' });
        await fs.writeFile(filepath, imgBuffer);
      }
    }
    
    logger.info(`Screenshot saved to: ${filepath}`);
    return filepath;
  } catch (error) {
    logger.error('Error capturing screen:', error);
    throw error;
  }
}