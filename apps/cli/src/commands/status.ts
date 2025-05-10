import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { sendMessage } from '../client.js';
import { logger } from '../utils/logger.js';

export function registerStatusCommand(program: Command): void {
  program
    .command('status')
    .description('Check the status of Pierre')
    .action(async () => {
      const spinner = ora('Checking Pierre status...').start();
      
      try {
        logger.info('Checking Pierre status');
        
        // Format the instruction for Pierre
        const instruction = 'What is your current status?';
        
        // Send the instruction to Pierre
        const response = await sendMessage(instruction);
        
        spinner.succeed('Status checked');
        console.log(chalk.green('\nPierre Status:'));
        console.log(response);
      } catch (error) {
        spinner.fail('Failed to check status');
        logger.error('Error checking status:', error);
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
        console.error(chalk.yellow('Pierre server might be offline or unreachable.'));
      }
    });
}