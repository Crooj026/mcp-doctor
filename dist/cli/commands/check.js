import ora from "ora";
import { existsSync } from "fs";
import { resolve } from "path";
import { getConfigLocations } from "../../config/locations.js";
import { validateJsonSyntax, validatePaths, validateEnvVars, testServerHealth, } from "../../validators/index.js";
import { printHeader, printConfigsFound, printValidationResults, printServerResults, printSummary, } from "../../utils/output.js";
export async function checkCommand(options = {}) {
    printHeader("🩺 MCP Doctor");
    let foundConfigs;
    // If --file is specified, use that instead of scanning
    if (options.filePath) {
        const resolvedPath = resolve(options.filePath);
        if (!existsSync(resolvedPath)) {
            console.log(`\n❌ File not found: ${resolvedPath}\n`);
            process.exitCode = 1;
            return;
        }
        foundConfigs = [
            {
                client: "Custom",
                scope: "global",
                path: resolvedPath,
                exists: true,
            },
        ];
        console.log(`Validating: ${resolvedPath}\n`);
    }
    else {
        const spinner = ora("Scanning for MCP configurations...").start();
        // Find all config files
        const locations = getConfigLocations();
        foundConfigs = locations.filter((l) => l.exists);
        spinner.stop();
        // Show what we found
        printConfigsFound(locations);
        if (foundConfigs.length === 0) {
            process.exitCode = 0;
            return;
        }
    }
    // Run validators on each config
    const allResults = [];
    const allServerResults = [];
    const configsWithServers = [];
    let firstErrorContext;
    for (const configLoc of foundConfigs) {
        // JSON syntax check
        const { valid, results: syntaxResults, config, errorContext, } = validateJsonSyntax(configLoc.path);
        allResults.push(...syntaxResults);
        // Capture first error context for display
        if (errorContext && !firstErrorContext) {
            firstErrorContext = errorContext;
        }
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
    printValidationResults(allResults, firstErrorContext);
    // Server health tests (unless skipped)
    if (!options.skipHealth && configsWithServers.length > 0) {
        const healthSpinner = ora("Testing server connectivity...").start();
        for (const { config } of configsWithServers) {
            const results = await testServerHealth(config);
            allServerResults.push(...results);
        }
        healthSpinner.stop();
        // Deduplicate servers by name (same server might be in multiple configs)
        const uniqueServers = new Map();
        for (const result of allServerResults) {
            // Keep the healthy result if we have conflicting results
            if (!uniqueServers.has(result.name) || result.healthy) {
                uniqueServers.set(result.name, result);
            }
        }
        printServerResults(Array.from(uniqueServers.values()));
    }
    // Summary
    const errors = allResults.filter((r) => r.level === "error").length;
    const warnings = allResults.filter((r) => r.level === "warning").length;
    const healthyServers = allServerResults.filter((s) => s.healthy).length;
    printSummary(errors, warnings, healthyServers, allServerResults.length);
    // Set exit code
    if (errors > 0) {
        process.exitCode = 1;
    }
}
//# sourceMappingURL=check.js.map