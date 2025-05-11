#!/usr/bin/env node

import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkg = require('../package.json');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const binDir = path.join(rootDir, 'bin');
const assetsDir = path.join(rootDir, 'assets');

// Platforms to build for
const targets = [
  { name: 'win', target: 'node18-win-x64', ext: '.exe' },
  { name: 'mac', target: 'node18-macos-x64', ext: '' },
  { name: 'linux', target: 'node18-linux-x64', ext: '' }
];

/**
 * Execute shell command
 */
function execPromise(command, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command}`);
    
    const process = exec(command, {
      cwd: rootDir,
      ...options
    });
    
    process.stdout.on('data', (data) => console.log(data.toString().trim()));
    process.stderr.on('data', (data) => console.error(data.toString().trim()));
    
    process.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
  });
}

/**
 * Main packaging function
 */
async function packageApp() {
  try {
    // Ensure dist directory exists
    try {
      await fs.access(distDir);
    } catch (err) {
      console.log('Building project first...');
      await execPromise('pnpm build');
    }
    
    // Ensure bin directory exists
    try {
      await fs.access(binDir);
    } catch (err) {
      await fs.mkdir(binDir);
    }
    
    // Create assets directory if it doesn't exist
    try {
      await fs.access(assetsDir);
    } catch (err) {
      await fs.mkdir(assetsDir);
    }
    
    // Copy .env.example to assets
    try {
      await fs.copyFile(
        path.join(rootDir, '.env.example'), 
        path.join(assetsDir, '.env.example')
      );
    } catch (err) {
      console.warn('Warning: Could not copy .env.example', err);
    }
    
    // Package for all platforms
    for (const platform of targets) {
      const outputName = `pierre-${platform.name}${platform.ext}`;
      const outputPath = path.join(binDir, outputName);
      
      console.log(`\nPackaging for ${platform.name}...`);
      
      await execPromise(
        `npx pkg . --target ${platform.target} --output ${outputPath}`
      );
      
      console.log(`Created executable: ${outputPath}`);
    }
    
    console.log('\nPackaging complete! Executables are in the bin/ directory.');
  } catch (error) {
    console.error('Packaging failed:', error);
    process.exit(1);
  }
}

packageApp();