import { getServersFromConfig } from '../config/locations.js';
export function validateEnvVars(config, configPath) {
    const results = [];
    const servers = getServersFromConfig(config);
    if (!servers) {
        return results;
    }
    for (const [name, serverRaw] of Object.entries(servers)) {
        const server = serverRaw;
        if (!server.env)
            continue;
        for (const [key, value] of Object.entries(server.env)) {
            if (typeof value !== 'string')
                continue;
            // Check for ${VAR} or $VAR references
            const varRefs = value.match(/\$\{([A-Z_][A-Z0-9_]*)\}|\$([A-Z_][A-Z0-9_]*)/g) || [];
            for (const ref of varRefs) {
                const varName = ref.replace(/^\$\{?|\}?$/g, '');
                if (!process.env[varName]) {
                    results.push({
                        level: 'warning',
                        code: 'ENV_VAR_MISSING',
                        message: `Server "${name}": Environment variable ${varName} is not set`,
                        file: configPath,
                        suggestion: `Set it with: export ${varName}="your-value"`,
                    });
                }
            }
            // Check for empty values that look like they should be set
            if (value === '' || value === '""' || value === "''") {
                results.push({
                    level: 'warning',
                    code: 'ENV_VAR_EMPTY',
                    message: `Server "${name}": Environment variable ${key} is empty`,
                    file: configPath,
                    suggestion: 'This may cause authentication or configuration issues',
                });
            }
            // Warn about hardcoded secrets
            const secretKeyPatterns = [
                /^(api[_-]?key|secret|token|password|pwd|auth|credential)/i,
                /_(api[_-]?key|secret|token|password|pwd|auth|credential)$/i,
            ];
            const secretValuePatterns = [
                /^sk[-_][a-zA-Z0-9]{20,}$/, // OpenAI-style keys
                /^[a-f0-9]{32,}$/i, // Hex strings (32+ chars)
                /^eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/, // JWT tokens
                /^ghp_[a-zA-Z0-9]{36}$/, // GitHub tokens
                /^github_pat_[a-zA-Z0-9_]{22,}/, // GitHub PAT
                /^xoxb-[0-9]{10,}/, // Slack bot tokens
                /^xoxp-[0-9]{10,}/, // Slack user tokens
                /^AKIA[A-Z0-9]{16}$/, // AWS access keys
            ];
            const isSecretKey = secretKeyPatterns.some((p) => p.test(key));
            const looksLikeSecret = secretValuePatterns.some((p) => p.test(value));
            // Only warn if it's not a variable reference
            if ((isSecretKey || looksLikeSecret) && !value.includes('$')) {
                results.push({
                    level: 'warning',
                    code: 'HARDCODED_SECRET',
                    message: `Server "${name}": Possible hardcoded secret in ${key}`,
                    file: configPath,
                    suggestion: 'Use an environment variable reference like ${' + key.toUpperCase() + '} instead',
                });
            }
        }
    }
    return results;
}
//# sourceMappingURL=env-vars.js.map