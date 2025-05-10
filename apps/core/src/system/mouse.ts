import robot from 'robotjs';
import { logger } from '../utils/logger.js';

type MouseButton = 'left' | 'right' | 'middle';

/**
 * Moves the mouse to a specific position
 */
export function moveMouse(x: number, y: number, smooth: boolean = true): void {
  try {
    if (smooth) {
      const currentPos = robot.getMousePos();
      const steps = 10;
      
      for (let i = 1; i <= steps; i++) {
        const newX = Math.round(currentPos.x + (x - currentPos.x) * (i / steps));
        const newY = Math.round(currentPos.y + (y - currentPos.y) * (i / steps));
        robot.moveMouse(newX, newY);
        // Small delay for smoother movement
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10);
      }
    } else {
      robot.moveMouse(x, y);
    }
    
    logger.debug(`Moved mouse to position: (${x}, ${y})`);
  } catch (error) {
    logger.error(`Error moving mouse to (${x}, ${y}):`, error);
    throw error;
  }
}

/**
 * Clicks the mouse with the specified button
 */
export function clickMouse(button: MouseButton = 'left', double: boolean = false): void {
  try {
    if (double) {
      robot.mouseClick(button, true);
    } else {
      robot.mouseClick(button, false);
    }
    
    logger.debug(`Clicked mouse button: ${button}${double ? ' (double-click)' : ''}`);
  } catch (error) {
    logger.error(`Error clicking mouse button ${button}:`, error);
    throw error;
  }
}

/**
 * Scrolls the mouse wheel
 */
export function scrollMouse(amount: number): void {
  try {
    robot.scrollMouse(0, amount);
    logger.debug(`Scrolled mouse: ${amount}`);
  } catch (error) {
    logger.error(`Error scrolling mouse:`, error);
    throw error;
  }
}

/**
 * Gets the current mouse position
 */
export function getMousePosition(): { x: number; y: number } {
  return robot.getMousePos();
}

/**
 * Drags the mouse from current position to target position
 */
export function dragMouse(x: number, y: number, button: MouseButton = 'left'): void {
  try {
    robot.mouseToggle('down', button);
    moveMouse(x, y, true);
    robot.mouseToggle('up', button);
    
    logger.debug(`Dragged mouse to position: (${x}, ${y})`);
  } catch (error) {
    // Ensure we release the button even if there's an error
    try {
      robot.mouseToggle('up', button);
    } catch {}
    
    logger.error(`Error dragging mouse to (${x}, ${y}):`, error);
    throw error;
  }
}