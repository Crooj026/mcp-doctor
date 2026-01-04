#!/usr/bin/env node

import { Command } from 'commander';
import { checkCommand } from './commands/check.js';

const program = new Command();

program
  .name('mcp-doctor')
  .description('Diagnose and fix MCP configuration issues')
  .version('0.1.0');

program
  .command('check')
  .description('Validate all MCP configuration files')
  .option('--skip-health', 'Skip server health checks')
  .action(async (options) => {
    await checkCommand({
      skipHealth: options.skipHealth,
    });
  });

// Default command (no subcommand) runs check
program
  .action(async () => {
    await checkCommand();
  });

program.parse();
