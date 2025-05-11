import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { sendMessage } from '../client.js';
import { logger } from '../utils/logger.js';
import { cancel, isCancel, log, outro, spinner, text } from '@clack/prompts';

export function registerChatCommand(program: Command): void {
  program
    .command('chat')
    .description('Start an interactive chat with Pierre')
    .action(async () => {
      log.info(chalk.blue(`Type "exit" to quit`));
      
      let chatActive = true;
      let chatHistory = '';
      
      while (chatActive) {
        try {
          const message = await text({
            message: chalk.magenta('You:'),
            placeholder: 'Type your message here...',
          });

          if (isCancel(message)) {
            cancel('Chat session cancelled.');
            process.exit(0);
          }
          
          // Check for exit command
          if (message.toString().toLowerCase() === 'exit') {
            outro(chalk.blue('Ending chat session.'));
            chatActive = false;
            process.exit(0);
          }
          
          // Add to chat history
          chatHistory += `\nUser: ${message.toString()}`;
          
          // Send message to Pierre
          const response = await sendMessage(message.toString());
          
          log.success(`${chalk.blue('Pierre:')}\n${response}`);
          
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