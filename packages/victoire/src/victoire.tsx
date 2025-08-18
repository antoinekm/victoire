import React from 'react';
import { render } from 'ink';
import { App } from './ui/app.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

function setupUnhandledRejectionHandler() {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled promise rejection:', reason);
    console.error('Promise:', promise);
    process.exit(1);
  });
}

export async function main() {
  setupUnhandledRejectionHandler();
  
  // Check if we're in an interactive terminal
  if (!process.stdin.isTTY) {
    console.error('Victoire CLI requires an interactive terminal.');
    console.error('Please run this command directly in your terminal, not through pipes or scripts.');
    process.exit(1);
  }
  
  // Simple start - just render the React app
  const { clear } = render(<App />);
  
  // Handle cleanup on exit
  process.on('SIGINT', () => {
    clear();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    clear();
    process.exit(0);
  });
}