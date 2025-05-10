import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { sendMessage } from '../client.js';
import { logger } from '../utils/logger.js';

export function registerAskCommand(program: Command): void {
  program
    .command('ask')
    .description('Ask Pierre to perform a task')
    .argument('[query]', 'The task or question for Pierre')
    .action(async (query) => {
      try {
        // If no query was provided, prompt the user for one
        if (!query) {
          const answers = await inquirer.prompt([
            {
              type: 'input',
              name: 'query',
              message: 'What would you like Pierre to do?',
              validate: (input) => input.trim().length > 0 || 'Please enter a task or question',
            },
          ]);
          
          query = answers.query;
        }
        
        logger.info(`Asking Pierre: ${query}`);
        
        const spinner = ora('Pierre is thinking...').start();
        
        // Send the query to Pierre
        const response = await sendMessage(query);
        
        spinner.succeed('Pierre has responded');
        console.log(chalk.green('\nResponse:'));
        console.log(response);
      } catch (error) {
        logger.error('Error asking Pierre:', error);
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
}