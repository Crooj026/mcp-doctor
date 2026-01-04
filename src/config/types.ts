export interface MCPServerConfig {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  // HTTP transport
  url?: string;
}

export interface MCPConfig {
  mcpServers?: Record<string, MCPServerConfig>;
  // VS Code style
  'mcp.servers'?: Record<string, MCPServerConfig>;
  // Claude Code style (servers at root)
  servers?: Record<string, MCPServerConfig>;
}

export interface ConfigLocation {
  client: string;
  scope: 'global' | 'project';
  path: string;
  exists: boolean;
}

export interface ValidationResult {
  level: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  file: string;
  line?: number;
  suggestion?: string;
}

export interface ServerTestResult {
  name: string;
  healthy: boolean;
  responseTime?: number;
  error?: string;
}

export interface CheckResults {
  configsFound: ConfigLocation[];
  validationResults: ValidationResult[];
  serverResults: ServerTestResult[];
}
