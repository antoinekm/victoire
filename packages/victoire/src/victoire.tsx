import { render } from 'ink';
import { App } from './app.js';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

function setupUnhandledRejectionHandler() {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled promise rejection:', reason);
    console.error('Promise:', promise);
    process.exit(1);
  });
}

export async function main() {
  setupUnhandledRejectionHandler();
  
  if (!process.stdin.isTTY) {
    console.error('Victoire CLI requires an interactive terminal.');
    console.error('Please run this command directly in your terminal, not through pipes or scripts.');
    process.exit(1);
  }
  
  const { clear } = render(<App />);
  
  process.on('SIGINT', () => {
    clear();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    clear();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Failed to start Victoire CLI:', error);
  process.exit(1);
});