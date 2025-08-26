import { execSync } from 'node:child_process';
import os from 'node:os';
import process from 'node:process';

export function getEnvironmentInfo(): string {
  const platform = os.platform();
  const arch = os.arch();
  const nodeVersion = process.version;
  
  let pythonInfo = 'Not available';
  try {
    const pythonVersion = execSync('python3 --version 2>/dev/null', { encoding: 'utf-8', timeout: 5000 }).trim();
    pythonInfo = pythonVersion.replace('Python ', '');
  } catch {
    try {
      const pythonVersion = execSync('python --version 2>/dev/null', { encoding: 'utf-8', timeout: 5000 }).trim();
      pythonInfo = pythonVersion.replace('Python ', '');
    } catch {
      // Python not available
    }
  }
  
  let osName: string = platform;
  if (platform === 'darwin') osName = 'macOS';
  else if (platform === 'win32') osName = 'Windows';
  else if (platform === 'linux') osName = 'Linux';
  
  return `<environment>
OS: ${osName} (${platform}) ${arch}
Node.js: ${nodeVersion}
Python: ${pythonInfo}
</environment>

`;
}