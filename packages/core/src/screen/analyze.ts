import { readFileSync, writeFileSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { logger } from '../utils/logger.js';
// Import sharp for image resizing
import sharp from 'sharp';

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
      return await resizeWithSharp(imagePath, maxWidth, maxHeight);
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
 * Resize image using Sharp library (Node.js native solution)
 */
async function resizeWithSharp(
  imagePath: string,
  maxWidth: number,
  maxHeight: number
): Promise<string> {
  const outputPath = imagePath.replace(/\.(png|jpg|jpeg)$/, '_resized.jpg');
  
  try {
    // Read the image using sharp
    const image = sharp(imagePath);
    
    // Get metadata to calculate proper dimensions
    const metadata = await image.metadata();
    const originalWidth = metadata.width || 1920;  // Default to 1920 if width is undefined
    const originalHeight = metadata.height || 1080;  // Default to 1080 if height is undefined
    
    // Calculate new dimensions while maintaining aspect ratio
    let newWidth = maxWidth;
    let newHeight = Math.round((originalHeight * maxWidth) / originalWidth);
    
    // If height is still too large, resize based on height instead
    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = Math.round((originalWidth * maxHeight) / originalHeight);
    }
    
    logger.info(`Resizing from ${originalWidth}x${originalHeight} to ${newWidth}x${newHeight}`);
    
    // Process and save the image with proper compression
    await image
      .resize(newWidth, newHeight)
      .jpeg({ quality: 70, progressive: true }) // Use more aggressive compression for LLM context
      .toFile(outputPath);
    
    logger.info(`Screenshot resized with Sharp: ${outputPath}`);
    return outputPath;
  } catch (error) {
    logger.error('Error resizing with Sharp:', error);
    throw error;
  }
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