import chalk from "chalk";
export function printHeader(text) {
    console.log(chalk.bold(`\n${text}\n`));
}
export function printConfigsFound(configs) {
    const found = configs.filter((c) => c.exists);
    const notFound = configs.filter((c) => !c.exists);
    if (found.length === 0) {
        console.log(chalk.yellow("No MCP configuration files found.\n"));
        console.log(chalk.gray("Looked in:"));
        notFound.slice(0, 5).forEach((c) => {
            console.log(chalk.gray(`  ${c.client}: ${c.path}`));
        });
        if (notFound.length > 5) {
            console.log(chalk.gray(`  ... and ${notFound.length - 5} more locations`));
        }
        return;
    }
    console.log(chalk.green(`Found ${found.length} config file${found.length > 1 ? "s" : ""}:\n`));
    found.forEach((c) => {
        const scope = c.scope === "project" ? chalk.gray(" (project)") : "";
        console.log(`  ${chalk.cyan(c.client)}${scope}`);
        console.log(chalk.gray(`  ${c.path}\n`));
    });
}
export function printCodeContext(errorContext) {
    const { line: errorLine, column, surroundingLines } = errorContext;
    const lineNumWidth = Math.max(...surroundingLines.map((l) => l.num.toString().length));
    console.log("");
    for (const { num, content } of surroundingLines) {
        const lineNum = num.toString().padStart(lineNumWidth, " ");
        const isErrorLine = num === errorLine;
        if (isErrorLine) {
            console.log(chalk.red(`  > ${lineNum} │ ${content}`));
            // Print the pointer
            const pointerPadding = " ".repeat(4 + lineNumWidth + 3 + column - 1);
            console.log(chalk.red(`${pointerPadding}^`));
        }
        else {
            console.log(chalk.gray(`    ${lineNum} │ ${content}`));
        }
    }
    console.log("");
}
export function printValidationResults(results, errorContext) {
    const errors = results.filter((r) => r.level === "error");
    const warnings = results.filter((r) => r.level === "warning");
    if (errors.length > 0) {
        console.log(chalk.red(`❌ ${errors.length} Error${errors.length > 1 ? "s" : ""}\n`));
        errors.forEach((e, index) => {
            const location = e.line ? `:${e.line}` : "";
            console.log(chalk.red(`  ${shortPath(e.file)}${location}`));
            console.log(chalk.red(`  ${e.message}`));
            // Show code context for first JSON error
            if (errorContext &&
                index === 0 &&
                (e.code === "JSON_TRAILING_COMMA" || e.code === "JSON_SYNTAX")) {
                printCodeContext(errorContext);
            }
            if (e.suggestion) {
                console.log(chalk.gray(`  💡 ${e.suggestion}`));
            }
            console.log("");
        });
    }
    if (warnings.length > 0) {
        console.log(chalk.yellow(`⚠️  ${warnings.length} Warning${warnings.length > 1 ? "s" : ""}\n`));
        warnings.forEach((w) => {
            const location = w.line ? `:${w.line}` : "";
            console.log(chalk.yellow(`  ${shortPath(w.file)}${location}`));
            console.log(chalk.yellow(`  ${w.message}`));
            if (w.suggestion) {
                console.log(chalk.gray(`  💡 ${w.suggestion}`));
            }
            console.log("");
        });
    }
}
export function printServerResults(results) {
    if (results.length === 0) {
        console.log(chalk.gray("No servers to test.\n"));
        return;
    }
    const healthy = results.filter((s) => s.healthy);
    const unhealthy = results.filter((s) => !s.healthy);
    console.log(`🔌 Server Health: ${chalk.green(healthy.length)} healthy, ${unhealthy.length > 0
        ? chalk.red(unhealthy.length + " failed")
        : chalk.gray("0 failed")}\n`);
    healthy.forEach((s) => {
        const time = s.responseTime ? chalk.gray(` (${s.responseTime}ms)`) : "";
        console.log(chalk.green(`  ✓ ${s.name}${time}`));
    });
    unhealthy.forEach((s) => {
        console.log(chalk.red(`  ✗ ${s.name}`));
        if (s.error) {
            console.log(chalk.gray(`    ${s.error}`));
        }
    });
    console.log("");
}
export function printSummary(errors, warnings, healthyServers, totalServers) {
    console.log(chalk.gray("─".repeat(50)));
    if (errors === 0 && warnings === 0) {
        console.log(chalk.green("\n✓ All configurations valid"));
    }
    else if (errors === 0) {
        console.log(chalk.yellow(`\n⚠️  Configuration valid with ${warnings} warning${warnings > 1 ? "s" : ""}`));
    }
    else {
        console.log(chalk.red(`\n❌ Found ${errors} error${errors > 1 ? "s" : ""} that need${errors === 1 ? "s" : ""} fixing`));
    }
    if (totalServers > 0) {
        if (healthyServers === totalServers) {
            console.log(chalk.green(`✓ All ${totalServers} server${totalServers > 1 ? "s" : ""} responding`));
        }
        else {
            console.log(chalk.yellow(`⚠️  ${healthyServers}/${totalServers} servers responding`));
        }
    }
    console.log("");
}
function shortPath(path) {
    const home = process.env.HOME || process.env.USERPROFILE || "";
    if (home && path.startsWith(home)) {
        return "~" + path.slice(home.length);
    }
    return path;
}
//# sourceMappingURL=output.js.map