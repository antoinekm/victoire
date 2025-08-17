import { readFileTool } from './read';
import { writeFileTool } from './write';
import { shellTool } from './shell';
import { listDirectoryTool } from './list';
import { searchFilesTool, grepTool } from './search';

export function createDevelopmentTools() {
  return {
    readFile: readFileTool,
    writeFile: writeFileTool,
    shell: shellTool,
    listDirectory: listDirectoryTool,
    searchFiles: searchFilesTool,
    grep: grepTool,
  };
}

export {
  readFileTool,
  writeFileTool,
  shellTool,
  listDirectoryTool,
  searchFilesTool,
  grepTool,
};