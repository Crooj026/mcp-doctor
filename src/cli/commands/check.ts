import ora from 'ora';
import { getConfigLocations } from '../../config/locations.js';
import {
  validateJsonSyntax,
  validatePaths,
  validateEnvVars,
  testServerHealth,
} from '../../validators/index.js';
import {
  printHeader,
  printConfigsFound,
  printValidationResults,
  printServerResults,
  printSummary,
} from '../../utils/output.js';
import { ValidationResult, ServerTestResult } from '../../config/types.js';

interface CheckOptions {
  skipHealth?: boolean;
}

export async function checkCommand(options: CheckOptions = {}): Promise<void> {
  printHeader('🩺 MCP Doctor');

  const spinner = ora('Scanning for MCP configurations...').start();

  // Find all config files
  const locations = getConfigLocations();
  const foundConfigs = locations.filter((l) => l.exists);

  spinner.stop();

  // Show what we found
  printConfigsFound(locations);

  if (foundConfigs.length === 0) {
    process.exitCode = 0;
    return;
  }

  // Run validators on each config
  const allResults: ValidationResult[] = [];
  const allServerResults: ServerTestResult[] = [];
  const configsWithServers: Array<{ path: string; config: Record<string, unknown> }> = [];

  for (const configLoc of foundConfigs) {
    // JSON syntax check
    const { valid, results: syntaxResults, config } = validateJsonSyntax(configLoc.path);
    allResults.push(...syntaxResults);

    // If JSON is invalid, skip other validators for this file
    if (!valid || !config) {
      continue;
    }

    // Store for server health testing
    configsWithServers.push({ path: configLoc.path, config });

    // Path validation
    allResults.push(...validatePaths(config, configLoc.path));

    // Environment variable validation
    allResults.push(...validateEnvVars(config, configLoc.path));
  }

  // Print validation results
  printValidationResults(allResults);

  // Server health tests (unless skipped)
  if (!options.skipHealth && configsWithServers.length > 0) {
    const healthSpinner = ora('Testing server connectivity...').start();

    for (const { config } of configsWithServers) {
      const results = await testServerHealth(config);
      allServerResults.push(...results);
    }

    healthSpinner.stop();

    // Deduplicate servers by name (same server might be in multiple configs)
    const uniqueServers = new Map<string, ServerTestResult>();
    for (const result of allServerResults) {
      // Keep the healthy result if we have conflicting results
      if (!uniqueServers.has(result.name) || result.healthy) {
        uniqueServers.set(result.name, result);
      }
    }

    printServerResults(Array.from(uniqueServers.values()));
  }

  // Summary
  const errors = allResults.filter((r) => r.level === 'error').length;
  const warnings = allResults.filter((r) => r.level === 'warning').length;
  const healthyServers = allServerResults.filter((s) => s.healthy).length;

  printSummary(errors, warnings, healthyServers, allServerResults.length);

  // Set exit code
  if (errors > 0) {
    process.exitCode = 1;
  }
}
