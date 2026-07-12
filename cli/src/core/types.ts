export interface ToolResult {
  ok: true;
  outputPath: string;
  message: string;
}

export interface ToolFailure {
  ok: false;
  error: string;
}

export type ToolOutcome = ToolResult | ToolFailure;
