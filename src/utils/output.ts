import chalk from 'chalk';
import { ValidationResult, ServerTestResult, ConfigLocation } from '../config/types.js';

export function printHeader(text: string): void {
  console.log(chalk.bold(`\n${text}\n`));
}

export function printConfigsFound(configs: ConfigLocation[]): void {
  const found = configs.filter((c) => c.exists);
  const notFound = configs.filter((c) => !c.exists);

  if (found.length === 0) {
    console.log(chalk.yellow('No MCP configuration files found.\n'));
    console.log(chalk.gray('Looked in:'));
    notFound.slice(0, 5).forEach((c) => {
      console.log(chalk.gray(`  ${c.client}: ${c.path}`));
    });
    if (notFound.length > 5) {
      console.log(chalk.gray(`  ... and ${notFound.length - 5} more locations`));
    }
    return;
  }

  console.log(chalk.green(`Found ${found.length} config file${found.length > 1 ? 's' : ''}:\n`));
  found.forEach((c) => {
    const scope = c.scope === 'project' ? chalk.gray(' (project)') : '';
    console.log(`  ${chalk.cyan(c.client)}${scope}`);
    console.log(chalk.gray(`  ${c.path}\n`));
  });
}

export function printValidationResults(results: ValidationResult[]): void {
  const errors = results.filter((r) => r.level === 'error');
  const warnings = results.filter((r) => r.level === 'warning');

  if (errors.length > 0) {
    console.log(chalk.red(`❌ ${errors.length} Error${errors.length > 1 ? 's' : ''}\n`));
    errors.forEach((e) => {
      const location = e.line ? `:${e.line}` : '';
      console.log(chalk.red(`  ${shortPath(e.file)}${location}`));
      console.log(chalk.red(`  ${e.message}`));
      if (e.suggestion) {
        console.log(chalk.gray(`  💡 ${e.suggestion}`));
      }
      console.log('');
    });
  }

  if (warnings.length > 0) {
    console.log(chalk.yellow(`⚠️  ${warnings.length} Warning${warnings.length > 1 ? 's' : ''}\n`));
    warnings.forEach((w) => {
      const location = w.line ? `:${w.line}` : '';
      console.log(chalk.yellow(`  ${shortPath(w.file)}${location}`));
      console.log(chalk.yellow(`  ${w.message}`));
      if (w.suggestion) {
        console.log(chalk.gray(`  💡 ${w.suggestion}`));
      }
      console.log('');
    });
  }
}

export function printServerResults(results: ServerTestResult[]): void {
  if (results.length === 0) {
    console.log(chalk.gray('No servers to test.\n'));
    return;
  }

  const healthy = results.filter((s) => s.healthy);
  const unhealthy = results.filter((s) => !s.healthy);

  console.log(
    `🔌 Server Health: ${chalk.green(healthy.length)} healthy, ${
      unhealthy.length > 0 ? chalk.red(unhealthy.length + ' failed') : chalk.gray('0 failed')
    }\n`
  );

  healthy.forEach((s) => {
    const time = s.responseTime ? chalk.gray(` (${s.responseTime}ms)`) : '';
    console.log(chalk.green(`  ✓ ${s.name}${time}`));
  });

  unhealthy.forEach((s) => {
    console.log(chalk.red(`  ✗ ${s.name}`));
    if (s.error) {
      console.log(chalk.gray(`    ${s.error}`));
    }
  });

  console.log('');
}

export function printSummary(
  errors: number,
  warnings: number,
  healthyServers: number,
  totalServers: number
): void {
  console.log(chalk.gray('─'.repeat(50)));

  if (errors === 0 && warnings === 0) {
    console.log(chalk.green('\n✓ All configurations valid'));
  } else if (errors === 0) {
    console.log(chalk.yellow(`\n⚠️  Configuration valid with ${warnings} warning${warnings > 1 ? 's' : ''}`));
  } else {
    console.log(chalk.red(`\n❌ Found ${errors} error${errors > 1 ? 's' : ''} that need${errors === 1 ? 's' : ''} fixing`));
  }

  if (totalServers > 0) {
    if (healthyServers === totalServers) {
      console.log(chalk.green(`✓ All ${totalServers} server${totalServers > 1 ? 's' : ''} responding`));
    } else {
      console.log(
        chalk.yellow(`⚠️  ${healthyServers}/${totalServers} servers responding`)
      );
    }
  }

  console.log('');
}

function shortPath(path: string): string {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  if (home && path.startsWith(home)) {
    return '~' + path.slice(home.length);
  }
  return path;
}
