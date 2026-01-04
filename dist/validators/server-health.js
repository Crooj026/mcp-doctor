import { spawn } from 'child_process';
import { getServersFromConfig } from '../config/locations.js';
export async function testServerHealth(config, timeout = 10000) {
    const results = [];
    const servers = getServersFromConfig(config);
    if (!servers) {
        return results;
    }
    const testPromises = Object.entries(servers).map(async ([name, serverRaw]) => {
        const server = serverRaw;
        const startTime = Date.now();
        // Skip URL-based servers for now
        if (server.url) {
            return {
                name,
                healthy: true, // Assume healthy for HTTP servers
                responseTime: undefined,
                error: 'HTTP servers not tested (coming soon)',
            };
        }
        // Skip if no command
        if (!server.command) {
            return {
                name,
                healthy: false,
                error: 'No command specified',
            };
        }
        try {
            const healthy = await testStdioServer(server.command, server.args || [], server.env, timeout);
            const responseTime = Date.now() - startTime;
            return {
                name,
                healthy,
                responseTime: healthy ? responseTime : undefined,
                error: healthy ? undefined : `Timeout after ${timeout}ms`,
            };
        }
        catch (error) {
            return {
                name,
                healthy: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    });
    return Promise.all(testPromises);
}
async function testStdioServer(command, args, env, timeout = 10000) {
    return new Promise((resolve) => {
        let proc;
        try {
            proc = spawn(command, args, {
                stdio: ['pipe', 'pipe', 'pipe'],
                env: { ...process.env, ...env },
                shell: process.platform === 'win32', // Use shell on Windows for npx etc
            });
        }
        catch (error) {
            resolve(false);
            return;
        }
        const timer = setTimeout(() => {
            proc.kill();
            resolve(false);
        }, timeout);
        let buffer = '';
        let initialized = false;
        proc.stdout?.on('data', (data) => {
            buffer += data.toString();
            // Try to parse complete JSON-RPC messages
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
                if (!line.trim())
                    continue;
                try {
                    const message = JSON.parse(line);
                    // Handle initialize response
                    if (message.id === 1 && message.result && !initialized) {
                        initialized = true;
                        clearTimeout(timer);
                        proc.kill();
                        resolve(true);
                    }
                    // Handle error response
                    if (message.id === 1 && message.error) {
                        clearTimeout(timer);
                        proc.kill();
                        resolve(false);
                    }
                }
                catch {
                    // Not valid JSON, might be partial or non-JSON output
                }
            }
        });
        proc.on('error', (error) => {
            clearTimeout(timer);
            // Check for common issues
            if (error.code === 'ENOENT') {
                // Command not found - this is expected for some setups
            }
            resolve(false);
        });
        proc.on('exit', (code) => {
            if (!initialized) {
                clearTimeout(timer);
                // Non-zero exit before responding is a failure
                if (code !== 0 && code !== null) {
                    resolve(false);
                }
            }
        });
        // Send initialize request
        const initRequest = JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: {
                protocolVersion: '2024-11-05',
                capabilities: {},
                clientInfo: { name: 'mcp-doctor', version: '1.0.0' },
            },
        });
        try {
            proc.stdin?.write(initRequest + '\n');
        }
        catch {
            clearTimeout(timer);
            resolve(false);
        }
    });
}
//# sourceMappingURL=server-health.js.map