#!/usr/bin/env node

import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { platform } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const binDir = path.join(rootDir, 'bin');
const installerDir = path.join(binDir, 'installer');

/**
 * Execute shell command
 */
function execPromise(command, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command}`);
    
    const process = exec(command, {
      cwd: options.cwd || rootDir,
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
 * Main build function
 */
async function buildAll() {
  try {
    // Ensure bin and installer directories exist
    await fs.mkdir(binDir, { recursive: true });
    await fs.mkdir(installerDir, { recursive: true });
    
    // 1. Build the TypeScript project
    console.log("Building TypeScript project...");
    await execPromise("pnpm build");
    
    // 2. Create standalone executables
    console.log("\nPackaging executables...");
    await execPromise("node scripts/package.js");
    
    // 3. Build installers based on current platform
    const currentPlatform = platform();
    console.log(`\nBuilding installers for ${currentPlatform}...`);
    
    if (currentPlatform === 'win32') {
      // Windows installer (requires Inno Setup)
      try {
        // Check if iscc (Inno Setup) is available
        await execPromise("where iscc");
        await execPromise("iscc scripts/windows-installer.iss");
      } catch (error) {
        console.warn("Inno Setup not found. Windows installer not created.");
        console.warn("Please install Inno Setup from https://jrsoftware.org/isinfo.php to create Windows installers.");
      }
    } else if (currentPlatform === 'darwin') {
      // macOS installer
      try {
        await execPromise("chmod +x scripts/macos-installer.sh");
        await execPromise("./scripts/macos-installer.sh");
      } catch (error) {
        console.warn("Error creating macOS installer:", error.message);
        console.warn("Make sure you have Xcode command line tools installed.");
      }
    } else if (currentPlatform === 'linux') {
      // Linux installer (requires fpm)
      try {
        await execPromise("chmod +x scripts/linux-installer.sh");
        await execPromise("chmod +x scripts/linux-postinstall.sh");
        await execPromise("chmod +x scripts/linux-postrm.sh");
        await execPromise("./scripts/linux-installer.sh");
      } catch (error) {
        console.warn("Error creating Linux packages:", error.message);
        console.warn("Make sure you have fpm installed (gem install fpm).");
      }
    }
    
    console.log("\nBuild completed successfully!");
    console.log(`Executables available in: ${binDir}`);
    console.log(`Installers available in: ${installerDir}`);
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

buildAll();