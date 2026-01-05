#!/usr/bin/env node

import { Command } from "commander";
import { checkCommand } from "./commands/check.js";

const program = new Command();

program
  .name("mcp-doctor")
  .description("Diagnose and fix MCP configuration issues")
  .version("0.1.1");

program
  .command("check")
  .description("Validate MCP configuration files")
  .option("--skip-health", "Skip server health checks")
  .option("--file <path>", "Validate a specific config file")
  .action(async (options) => {
    await checkCommand({
      skipHealth: options.skipHealth,
      filePath: options.file,
    });
  });

// Default command (no subcommand) runs check
program
  .option("--skip-health", "Skip server health checks")
  .option("--file <path>", "Validate a specific config file")
  .action(async (options) => {
    await checkCommand({
      skipHealth: options.skipHealth,
      filePath: options.file,
    });
  });

program.parse();
