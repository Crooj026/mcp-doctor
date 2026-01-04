import { existsSync, accessSync, constants } from 'fs';
import { isAbsolute, resolve, dirname } from 'path';
import { ValidationResult, MCPServerConfig } from '../config/types.js';
import { getServersFromConfig } from '../config/locations.js';

export function validatePaths(
  config: Record<string, unknown>,
  configPath: string
): ValidationResult[] {
  const results: ValidationResult[] = [];
  const servers = getServersFromConfig(config);

  if (!servers) {
    return results;
  }

  const configDir = dirname(configPath);

  for (const [name, serverRaw] of Object.entries(servers)) {
    const server = serverRaw as MCPServerConfig;

    // Skip HTTP/URL-based servers
    if (server.url) continue;

    // Skip if no command specified
    if (!server.command) {
      results.push({
        level: 'error',
        code: 'MISSING_COMMAND',
        message: `Server "${name}": No command specified`,
        file: configPath,
        suggestion: 'Add a "command" field specifying how to start the server',
      });
      continue;
    }

    const command = server.command;

    // Check if command is a path (contains / or \)
    if (command.includes('/') || command.includes('\\')) {
      const resolvedPath = isAbsolute(command)
        ? command
        : resolve(configDir, command);

      // Check existence
      if (!existsSync(resolvedPath)) {
        results.push({
          level: 'error',
          code: 'PATH_NOT_FOUND',
          message: `Server "${name}": Command path does not exist: ${command}`,
          file: configPath,
          suggestion: `Check the path is correct. Resolved to: ${resolvedPath}`,
        });
      } else {
        // Check executable permission (Unix only)
        if (process.platform !== 'win32') {
          try {
            accessSync(resolvedPath, constants.X_OK);
          } catch {
            results.push({
              level: 'error',
              code: 'PATH_NOT_EXECUTABLE',
              message: `Server "${name}": Command is not executable: ${command}`,
              file: configPath,
              suggestion: `Run: chmod +x "${resolvedPath}"`,
            });
          }
        }
      }

      // Warn about relative paths
      if (!isAbsolute(command)) {
        results.push({
          level: 'warning',
          code: 'PATH_RELATIVE',
          message: `Server "${name}": Using relative path "${command}"`,
          file: configPath,
          suggestion: `Consider using absolute path: ${resolvedPath}`,
        });
      }
    } else {
      // Command is not a path (e.g., "npx", "node", "python")
      // We can't easily validate these as they depend on PATH
      // But we can warn if it looks like a typo

      const commonCommands = ['npx', 'node', 'python', 'python3', 'uv', 'uvx', 'deno', 'bun'];
      const looksLikePath = command.includes('.') && !commonCommands.includes(command);

      if (looksLikePath) {
        results.push({
          level: 'warning',
          code: 'POSSIBLE_PATH_TYPO',
          message: `Server "${name}": "${command}" looks like a filename but isn't a path`,
          file: configPath,
          suggestion: 'If this is a file, use a full path like "./server.js" or "/path/to/server.js"',
        });
      }
    }

    // Check cwd if specified
    if (server.cwd) {
      const cwdPath = isAbsolute(server.cwd)
        ? server.cwd
        : resolve(configDir, server.cwd);

      if (!existsSync(cwdPath)) {
        results.push({
          level: 'error',
          code: 'CWD_NOT_FOUND',
          message: `Server "${name}": Working directory does not exist: ${server.cwd}`,
          file: configPath,
          suggestion: `Create the directory or update the path. Resolved to: ${cwdPath}`,
        });
      }
    }

    // Check args for paths
    if (server.args && Array.isArray(server.args)) {
      for (const arg of server.args) {
        // If arg looks like an absolute path, check it exists
        if (typeof arg === 'string' && isAbsolute(arg) && (arg.includes('/') || arg.includes('\\'))) {
          // Only check if it looks like a file path (not a URL or flag)
          if (!arg.startsWith('-') && !arg.startsWith('http')) {
            if (!existsSync(arg)) {
              results.push({
                level: 'warning',
                code: 'ARG_PATH_NOT_FOUND',
                message: `Server "${name}": Argument path may not exist: ${arg}`,
                file: configPath,
                suggestion: 'Verify this path is correct',
              });
            }
          }
        }
      }
    }
  }

  return results;
}
