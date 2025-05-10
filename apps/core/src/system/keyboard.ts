import robot from 'robotjs';
import { logger } from '../utils/logger.js';

/**
 * Types text using keyboard simulation
 */
export async function simulateKeyboard(text: string): Promise<void> {
  try {
    logger.info(`Typing text: ${text}`);
    robot.typeString(text);
  } catch (error) {
    logger.error('Error simulating keyboard:', error);
    throw error;
  }
}

/**
 * Presses a key down
 */
export function pressKey(key: string, modifier?: string | string[]): void {
  try {
    if (modifier) {
      const modifiers = Array.isArray(modifier) ? modifier : [modifier];
      robot.keyToggle(key, 'down', modifiers);
    } else {
      robot.keyToggle(key, 'down');
    }
    logger.debug(`Pressed key: ${key}${modifier ? ` with modifier(s): ${modifier}` : ''}`);
  } catch (error) {
    logger.error(`Error pressing key ${key}:`, error);
    throw error;
  }
}

/**
 * Releases a key
 */
export function releaseKey(key: string, modifier?: string | string[]): void {
  try {
    if (modifier) {
      const modifiers = Array.isArray(modifier) ? modifier : [modifier];
      robot.keyToggle(key, 'up', modifiers);
    } else {
      robot.keyToggle(key, 'up');
    }
    logger.debug(`Released key: ${key}${modifier ? ` with modifier(s): ${modifier}` : ''}`);
  } catch (error) {
    logger.error(`Error releasing key ${key}:`, error);
    throw error;
  }
}

/**
 * Taps a key (press and release)
 */
export function tapKey(key: string, modifier?: string | string[]): void {
  pressKey(key, modifier);
  releaseKey(key, modifier);
  logger.debug(`Tapped key: ${key}${modifier ? ` with modifier(s): ${modifier}` : ''}`);
}