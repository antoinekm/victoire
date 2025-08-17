export interface ToolExecutionContext {
  workingDirectory: string;
  environment: Record<string, string>;
  signal?: AbortSignal;
}