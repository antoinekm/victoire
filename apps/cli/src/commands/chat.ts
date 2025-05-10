import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { sendMessage } from '../client.js';
import { logger } from '../utils/logger.js';

export function registerChatCommand(program: Command): void {
  program
    .command('chat')
    .description('Start an interactive chat with Pierre')
    .action(async () => {
      console.log(chalk.blue('Starting interactive chat with Pierre. Type "exit" to quit.'));
      console.log(chalk.blue('─────────────────────────────────────────────────────────'));
      
      let chatActive = true;
      let chatHistory = '';
      
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
          
          // Add to chat history
          chatHistory += `\nUser: ${message}`;
          
          // Send message to Pierre
          console.log(chalk.yellow('Pierre is thinking...'));
          const response = await sendMessage(message);
          
          // Display response
          console.log(chalk.cyan('Pierre:'), response);
          
          // Add to chat history
          chatHistory += `\nPierre: ${response}`;
          
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
    });
}