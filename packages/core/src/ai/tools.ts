import { tool } from 'ai';
import { z } from 'zod';
import { executeCommand } from '../system/commands.js';
import { simulateKeyboard, pressKey, releaseKey, tapKey } from '../system/keyboard.js';
import { moveMouse, clickMouse, scrollMouse, dragMouse, getMousePosition } from '../system/mouse.js';
import { captureScreen } from '../screen/capture.js';
import { getScreenshotBase64, resizeScreenshot } from '../screen/analyze.js';
import { logger } from '../utils/logger.js';

export const computerTools = {
  executeCommand: tool({
    description: 'Execute a system command',
    parameters: z.object({
      command: z.string().describe('The command to execute')
    }),
    execute: async ({ command }) => {
      logger.info(`Executing command: ${command}`);
      try {
        const result = await executeCommand(command);
        return {
          stdout: result.stdout,
          stderr: result.stderr
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error executing command: ${command}`, error);
        return { 
          stdout: '', 
          stderr: `Error executing command: ${errorMessage}`
        };
      }
    }
  }),
  
  typeText: tool({
    description: 'Type text using the keyboard',
    parameters: z.object({
      text: z.string().describe('The text to type')
    }),
    execute: async ({ text }) => {
      logger.info(`Typing text: ${text}`);
      try {
        await simulateKeyboard(text);
        return { success: true, message: `Typed: ${text}` };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error typing text: ${text}`, error);
        return { 
          success: false, 
          message: `Error typing text: ${errorMessage}`
        };
      }
    }
  }),
  
  moveMouse: tool({
    description: 'Move the mouse to a specific position',
    parameters: z.object({
      x: z.number().describe('X coordinate'),
      y: z.number().describe('Y coordinate'),
      smooth: z.boolean().optional().default(true).describe('Whether to move smoothly')
    }),
    execute: async ({ x, y, smooth }) => {
      logger.info(`Moving mouse to: ${x}, ${y} (smooth: ${smooth})`);
      try {
        moveMouse(x, y, smooth);
        return { success: true, message: `Moved mouse to (${x}, ${y})` };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error moving mouse to: ${x}, ${y}`, error);
        return { 
          success: false, 
          message: `Error moving mouse: ${errorMessage}`
        };
      }
    }
  }),
  
  clickMouse: tool({
    description: 'Click the mouse',
    parameters: z.object({
      button: z.enum(['left', 'right', 'middle']).default('left').describe('Mouse button to click'),
      double: z.boolean().default(false).describe('Whether to double-click')
    }),
    execute: async ({ button, double }) => {
      logger.info(`Clicking mouse: ${button}, double: ${double}`);
      try {
        clickMouse(button, double);
        return { success: true, message: `Clicked ${button} button ${double ? 'twice' : 'once'}` };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error clicking mouse: ${button}, double: ${double}`, error);
        return { 
          success: false, 
          message: `Error clicking mouse: ${errorMessage}`
        };
      }
    }
  }),
  
  dragMouse: tool({
    description: 'Drag the mouse from current position to target position',
    parameters: z.object({
      x: z.number().describe('Target X coordinate'),
      y: z.number().describe('Target Y coordinate'),
      button: z.enum(['left', 'right', 'middle']).default('left').describe('Mouse button to use for dragging')
    }),
    execute: async ({ x, y, button }) => {
      logger.info(`Dragging mouse to: ${x}, ${y} with ${button} button`);
      try {
        dragMouse(x, y, button);
        return { success: true, message: `Dragged mouse to (${x}, ${y})` };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error dragging mouse to: ${x}, ${y}`, error);
        return { 
          success: false, 
          message: `Error dragging mouse: ${errorMessage}`
        };
      }
    }
  }),

  scrollMouse: tool({
    description: 'Scroll the mouse wheel',
    parameters: z.object({
      amount: z.number().describe('Amount to scroll, positive for down, negative for up')
    }),
    execute: async ({ amount }) => {
      logger.info(`Scrolling mouse: ${amount}`);
      try {
        scrollMouse(amount);
        return { success: true, message: `Scrolled mouse by ${amount}` };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error scrolling mouse`, error);
        return { 
          success: false, 
          message: `Error scrolling mouse: ${errorMessage}`
        };
      }
    }
  }),

  pressKey: tool({
    description: 'Press and hold a key',
    parameters: z.object({
      key: z.string().describe('Key to press'),
      modifiers: z.array(z.string()).optional().describe('Modifier keys (ctrl, alt, shift, etc.)')
    }),
    execute: async ({ key, modifiers }) => {
      logger.info(`Pressing key: ${key}${modifiers ? ` with modifiers: ${modifiers.join(', ')}` : ''}`);
      try {
        pressKey(key, modifiers);
        return { success: true, message: `Pressed key: ${key}` };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error pressing key ${key}`, error);
        return { 
          success: false, 
          message: `Error pressing key: ${errorMessage}`
        };
      }
    }
  }),

  releaseKey: tool({
    description: 'Release a previously pressed key',
    parameters: z.object({
      key: z.string().describe('Key to release'),
      modifiers: z.array(z.string()).optional().describe('Modifier keys (ctrl, alt, shift, etc.)')
    }),
    execute: async ({ key, modifiers }) => {
      logger.info(`Releasing key: ${key}${modifiers ? ` with modifiers: ${modifiers.join(', ')}` : ''}`);
      try {
        releaseKey(key, modifiers);
        return { success: true, message: `Released key: ${key}` };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error releasing key ${key}`, error);
        return { 
          success: false, 
          message: `Error releasing key: ${errorMessage}`
        };
      }
    }
  }),

  tapKey: tool({
    description: 'Tap a key (press and release)',
    parameters: z.object({
      key: z.string().describe('Key to tap'),
      modifiers: z.array(z.string()).optional().describe('Modifier keys (ctrl, alt, shift, etc.)')
    }),
    execute: async ({ key, modifiers }) => {
      logger.info(`Tapping key: ${key}${modifiers ? ` with modifiers: ${modifiers.join(', ')}` : ''}`);
      try {
        tapKey(key, modifiers);
        return { success: true, message: `Tapped key: ${key}` };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error tapping key ${key}`, error);
        return { 
          success: false, 
          message: `Error tapping key: ${errorMessage}`
        };
      }
    }
  }),
  
  captureScreen: tool({
    description: 'Capture the screen and return a screenshot',
    parameters: z.object({
      region: z.object({
        x: z.number().optional().describe('X coordinate of the top-left corner'),
        y: z.number().optional().describe('Y coordinate of the top-left corner'),
        width: z.number().optional().describe('Width of the region'),
        height: z.number().optional().describe('Height of the region')
      }).optional().describe('Region to capture, capture full screen if not provided'),
      maxWidth: z.number().optional().default(1920).describe('Maximum width of the resized screenshot'),
      maxHeight: z.number().optional().default(1080).describe('Maximum height of the resized screenshot')
    }),
    execute: async ({ region, maxWidth, maxHeight }) => {
      logger.info(`Capturing screen${region ? ' with region' : ''} (max size: ${maxWidth}x${maxHeight})`);
      try {
        const imagePath = await captureScreen(region);
        
        const resizedImagePath = await resizeScreenshot(imagePath, maxWidth, maxHeight);
        const base64Image = getScreenshotBase64(resizedImagePath);
        
        logger.info(`Screenshot resized to max dimensions: ${maxWidth}x${maxHeight}`);
        
        return { 
          success: true, 
          screenshotPath: imagePath,
          resizedScreenshotPath: resizedImagePath,
          base64Image: base64Image,
          message: "Screenshot captured successfully. You can ask me questions about what's visible in it."
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error capturing screen`, error);
        return { 
          success: false, 
          message: `Error capturing screen: ${errorMessage}`
        };
      }
    }
  }),

  getMousePosition: tool({
    description: 'Get the current mouse position',
    parameters: z.object({}),
    execute: async () => {
      try {
        const position = getMousePosition();
        return { 
          success: true, 
          x: position.x,
          y: position.y,
          message: `Current mouse position: (${position.x}, ${position.y})`
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Error getting mouse position`, error);
        return { 
          success: false, 
          message: `Error getting mouse position: ${errorMessage}`
        };
      }
    }
  })
};