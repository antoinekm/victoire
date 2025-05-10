import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { sendMessage } from '../client.js';
import { logger } from '../utils/logger.js';

export function registerExecCommand(program: Command): void {
  program
    .command('exec')
    .description('Execute a system command through Pierre')
    .argument('<command>', 'The command to execute')
    .action(async (command) => {
      const spinner = ora('Executing command...').start();
      
      try {
        logger.info(`Executing command: ${command}`);
        
        // Format the instruction for Pierre
        const instruction = `Execute the following command: ${command}`;
        
        // Send the instruction to Pierre
        const response = await sendMessage(instruction);
        
        spinner.succeed('Command executed');
        console.log(chalk.green('\nResponse:'));
        console.log(response);
      } catch (error) {
        spinner.fail('Command execution failed');
        logger.error('Error executing command:', error);
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
}