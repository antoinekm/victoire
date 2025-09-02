import { readFileTool } from './read.js';
import { writeFileTool } from './write.js';
import { shellTool } from './shell.js';
import { listDirectoryTool } from './list.js';
import { searchFilesTool, grepTool } from './search.js';
import { webSearchTool } from './websearch.js';
import { webFetchTool } from './webfetch.js';

export function createDevelopmentTools() {
  return {
    Read: readFileTool,
    Write: writeFileTool,
    Shell: shellTool,
    List: listDirectoryTool,
    Search: searchFilesTool,
    Grep: grepTool,
    WebSearch: webSearchTool,
    WebFetch: webFetchTool,
  };
}

export {
  readFileTool,
  writeFileTool,
  shellTool,
  listDirectoryTool,
  searchFilesTool,
  grepTool,
  webSearchTool,
  webFetchTool,
};