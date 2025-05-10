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
    .option('-c, --chat', 'Enter chat mode after initial response to continue conversation')
    .action(async (query, options) => {
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
        
        // If chat option was provided, enter chat mode
        if (options.chat) {
          console.log(chalk.blue('\nEntering chat mode. Type "exit" to quit.'));
          console.log(chalk.blue('─────────────────────────────────────────────────────────'));
          
          let chatActive = true;
          
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
        logger.error('Error asking Pierre:', error);
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
}