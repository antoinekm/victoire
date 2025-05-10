import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { sendMessage } from '../client.js';
import { logger } from '../utils/logger.js';

export function registerCaptureCommand(program: Command): void {
  program
    .command('capture')
    .description('Capture the screen and analyze its content')
    .option('-r, --region <x,y,width,height>', 'Capture a specific region instead of the full screen')
    .option('-w, --width <pixels>', 'Maximum width of the captured screenshot (default: 800)', '800')
    .option('-h, --height <pixels>', 'Maximum height of the captured screenshot (default: 600)', '600')
    .option('-c, --chat', 'Enter chat mode after capture to continue conversation')
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
        
        // If chat option was provided, enter chat mode
        if (options.chat) {
          console.log(chalk.blue('\nEntering chat mode. You can ask questions about the screenshot. Type "exit" to quit.'));
          console.log(chalk.blue('─────────────────────────────────────────────────────────'));
          
          let chatActive = true;
          
          // Provide some example questions
          console.log(chalk.yellow('Example questions you can ask:'));
          console.log(chalk.yellow('- "What can you see in the screenshot?"'));
          console.log(chalk.yellow('- "Describe what\'s on my screen"'));
          console.log(chalk.yellow('- "Can you identify any text in the image?"'));
          console.log();
          
          while (chatActive) {
            try {
              // Get user input
              const { message } = await inquirer.prompt([
                {
                  type: 'input',
                  name: 'message',
                  message: chalk.green('You:'),
                  validate: (input) => input.trim().length > 0 || 'Please enter a message',
                },
              ]);
              
              // Check for exit command
              if (message.toLowerCase() === 'exit') {
                console.log(chalk.blue('Ending chat session.'));
                chatActive = false;
                break;
              }
              
              // Send message to Pierre
              console.log(chalk.yellow('Pierre is thinking...'));
              const chatResponse = await sendMessage(message);
              
              // Display response
              console.log(chalk.cyan('Pierre:'), chatResponse);
              
            } catch (error) {
              logger.error('Error in chat:', error);
              console.error(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
              
              // Ask if they want to continue
              const { continueChat } = await inquirer.prompt([
                {
                  type: 'confirm',
                  name: 'continueChat',
                  message: 'Would you like to continue the chat?',
                  default: true,
                },
              ]);
              
              if (!continueChat) {
                chatActive = false;
              }
            }
          }
        }
      } catch (error) {
        spinner.fail('Screen capture failed');
        logger.error('Error capturing screen:', error);
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
}