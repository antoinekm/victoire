import { readFileTool } from './read.js';
import { writeFileTool } from './write.js';
import { shellTool } from './shell.js';
import { listDirectoryTool } from './list.js';
import { searchFilesTool, grepTool } from './search.js';

export function createDevelopmentTools() {
  return {
    Read: readFileTool,
    Write: writeFileTool,
    Shell: shellTool,
    List: listDirectoryTool,
    Search: searchFilesTool,
    Grep: grepTool,
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