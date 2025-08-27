import { readFileTool } from './read';
import { writeFileTool } from './write';
import { shellTool } from './shell';
import { listDirectoryTool } from './list';
import { searchFilesTool, grepTool } from './search';

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