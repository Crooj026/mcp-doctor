import { homedir, platform } from 'os';
import { join } from 'path';
import { existsSync } from 'fs';
export function getConfigLocations(projectDir) {
    const home = homedir();
    const os = platform();
    const cwd = projectDir || process.cwd();
    const locations = [];
    // ============================================
    // Claude Desktop
    // ============================================
    if (os === 'darwin') {
        locations.push({
            client: 'Claude Desktop',
            scope: 'global',
            path: join(home, 'Library/Application Support/Claude/claude_desktop_config.json'),
        });
    }
    else if (os === 'win32') {
        locations.push({
            client: 'Claude Desktop',
            scope: 'global',
            path: join(process.env.APPDATA || join(home, 'AppData/Roaming'), 'Claude/claude_desktop_config.json'),
        });
    }
    else {
        // Linux
        locations.push({
            client: 'Claude Desktop',
            scope: 'global',
            path: join(home, '.config/claude/claude_desktop_config.json'),
        });
    }
    // ============================================
    // Claude Code
    // ============================================
    locations.push({
        client: 'Claude Code',
        scope: 'global',
        path: join(home, '.claude.json'),
    });
    locations.push({
        client: 'Claude Code',
        scope: 'project',
        path: join(cwd, '.mcp.json'),
    });
    // ============================================
    // Cursor
    // ============================================
    if (os === 'darwin') {
        locations.push({
            client: 'Cursor',
            scope: 'global',
            path: join(home, 'Library/Application Support/Cursor/User/globalStorage/cursor.mcp/mcp.json'),
        });
    }
    else if (os === 'win32') {
        locations.push({
            client: 'Cursor',
            scope: 'global',
            path: join(process.env.APPDATA || join(home, 'AppData/Roaming'), 'Cursor/User/globalStorage/cursor.mcp/mcp.json'),
        });
    }
    else {
        locations.push({
            client: 'Cursor',
            scope: 'global',
            path: join(home, '.config/Cursor/User/globalStorage/cursor.mcp/mcp.json'),
        });
    }
    // Also check older Cursor location
    locations.push({
        client: 'Cursor',
        scope: 'global',
        path: join(home, '.cursor/mcp.json'),
    });
    locations.push({
        client: 'Cursor',
        scope: 'project',
        path: join(cwd, '.cursor/mcp.json'),
    });
    // ============================================
    // VS Code (MCP extension)
    // ============================================
    if (os === 'darwin') {
        locations.push({
            client: 'VS Code',
            scope: 'global',
            path: join(home, 'Library/Application Support/Code/User/settings.json'),
        });
    }
    else if (os === 'win32') {
        locations.push({
            client: 'VS Code',
            scope: 'global',
            path: join(process.env.APPDATA || join(home, 'AppData/Roaming'), 'Code/User/settings.json'),
        });
    }
    else {
        locations.push({
            client: 'VS Code',
            scope: 'global',
            path: join(home, '.config/Code/User/settings.json'),
        });
    }
    locations.push({
        client: 'VS Code',
        scope: 'project',
        path: join(cwd, '.vscode/settings.json'),
    });
    // ============================================
    // Windsurf
    // ============================================
    locations.push({
        client: 'Windsurf',
        scope: 'global',
        path: join(home, '.codeium/windsurf/mcp_config.json'),
    });
    // Check existence and return
    return locations.map((loc) => ({
        ...loc,
        exists: existsSync(loc.path),
    }));
}
export function getServersFromConfig(config) {
    // Try different config formats
    if (config.mcpServers && typeof config.mcpServers === 'object') {
        return config.mcpServers;
    }
    if (config['mcp.servers'] && typeof config['mcp.servers'] === 'object') {
        return config['mcp.servers'];
    }
    if (config.servers && typeof config.servers === 'object') {
        return config.servers;
    }
    return null;
}
//# sourceMappingURL=locations.js.map