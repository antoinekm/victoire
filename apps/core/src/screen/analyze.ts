import { readFileSync, writeFileSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { logger } from '../utils/logger.js';

const execPromise = promisify(exec);

/**
 * Reads a screenshot file and returns its base64 encoding
 * @param imagePath Path to the screenshot image
 * @returns Base64 encoded image data
 */
export function getScreenshotBase64(imagePath: string): string {
  try {
    logger.info(`Reading screenshot from: ${imagePath}`);
    const imageBuffer = readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    return base64Image;
  } catch (error) {
    logger.error('Error reading screenshot:', error);
    throw error;
  }
}

/**
 * Resizes a screenshot to fit within the specified dimensions
 * @param imagePath Path to the screenshot
 * @param maxWidth Maximum width of the resized image
 * @param maxHeight Maximum height of the resized image
 * @returns Path to the resized image
 */
export async function resizeScreenshot(
  imagePath: string,
  maxWidth: number = 1024,
  maxHeight: number = 768
): Promise<string> {
  try {
    logger.info(`Resizing screenshot: ${imagePath} to max ${maxWidth}x${maxHeight}`);
    
    // Determine if ImageMagick is available
    try {
      await execPromise('convert -version');
      return await resizeWithImageMagick(imagePath, maxWidth, maxHeight);
    } catch (error) {
      logger.info('ImageMagick not available, using Sharp for resizing');
      return await resizeWithNodeJS(imagePath, maxWidth, maxHeight);
    }
  } catch (error) {
    logger.error('Error resizing screenshot:', error);
    // Return the original image if resizing fails
    return imagePath;
  }
}

/**
 * Resize image using ImageMagick (if available)
 */
async function resizeWithImageMagick(
  imagePath: string,
  maxWidth: number,
  maxHeight: number
): Promise<string> {
  const outputPath = imagePath.replace(/\.(png|jpg|jpeg)$/, '_resized.jpg');
  
  // Use ImageMagick to resize the image with high quality and optimized file size
  await execPromise(
    `convert "${imagePath}" -resize ${maxWidth}x${maxHeight}\\> -quality 85 -strip "${outputPath}"`
  );
  
  logger.info(`Screenshot resized with ImageMagick: ${outputPath}`);
  return outputPath;
}

/**
 * Fallback resize method using Node.js (no external dependencies)
 * This is a very basic implementation that simply returns the original image
 * In a real implementation, you would use a library like Sharp
 */
async function resizeWithNodeJS(
  imagePath: string,
  maxWidth: number,
  maxHeight: number
): Promise<string> {
  // For this implementation, we'll just create a copy of the original image
  // In a real implementation, you would use a library like Sharp for proper resizing
  const outputPath = imagePath.replace(/\.(png|jpg|jpeg)$/, '_resized.jpg');
  
  // Copy the file (in a real implementation, you would properly resize it)
  const imageBuffer = readFileSync(imagePath);
  writeFileSync(outputPath, imageBuffer);
  
  logger.warn('Image resizing not implemented in Node.js fallback. Using original image size.');
  logger.info(`Image copied to: ${outputPath}`);
  
  return outputPath;
}

/**
 * Analyzes the content of a screenshot using basic techniques
 * This function is kept for backward compatibility
 */
export async function analyzeScreenContent(imagePath: string): Promise<string> {
  try {
    logger.info(`Processing screenshot: ${imagePath}`);
    return "Screenshot captured successfully. The AI will analyze the visual content directly.";
  } catch (error) {
    logger.error('Error processing screenshot:', error);
    return `Error processing screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

/**
 * This function is kept for backward compatibility
 */
export async function identifyUIElements(imagePath: string): Promise<any[]> {
  logger.info('UI element identification requested');
  return [];
}