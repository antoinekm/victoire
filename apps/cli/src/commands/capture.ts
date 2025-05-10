import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { sendMessage } from '../client.js';
import { logger } from '../utils/logger.js';

export function registerCaptureCommand(program: Command): void {
  program
    .command('capture')
    .description('Capture the screen and analyze its content')
    .option('-r, --region <x,y,width,height>', 'Capture a specific region instead of the full screen')
    .option('-w, --width <pixels>', 'Maximum width of the captured screenshot (default: 1024)', '1024')
    .option('-h, --height <pixels>', 'Maximum height of the captured screenshot (default: 768)', '768')
    .action(async (options) => {
      const spinner = ora('Capturing screen...').start();
      
      try {
        logger.info('Capturing screen');
        
        // Format the instruction for Pierre
        let instruction = 'Capture the screen and analyze what you see.';
        
        // Add dimensions if specified
        const maxWidth = parseInt(options.width);
        const maxHeight = parseInt(options.height);
        
        if (options.region) {
          const [x, y, width, height] = options.region.split(',').map(Number);
          instruction = `Capture the screen region at x=${x}, y=${y}, width=${width}, height=${height} and analyze what you see. Use maximum dimensions of ${maxWidth}x${maxHeight}.`;
        } else {
          instruction = `Capture the screen and analyze what you see. Use maximum dimensions of ${maxWidth}x${maxHeight}.`;
        }
        
        // Send the instruction to Pierre
        const response = await sendMessage(instruction);
        
        spinner.succeed('Screen captured and analyzed');
        console.log(chalk.green('\nAnalysis:'));
        console.log(response);
      } catch (error) {
        spinner.fail('Screen capture failed');
        logger.error('Error capturing screen:', error);
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
}