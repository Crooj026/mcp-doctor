# mcp-doctor

Diagnose and fix MCP configuration issues across Claude Desktop, Cursor, VS Code, Claude Code, and more.

## The Problem

MCP configuration is fragile:

- **Trailing commas** break JSON parsing silently
- **Wrong paths** cause "server not found" errors
- **Missing environment variables** lead to auth failures
- **Server crashes** happen with unhelpful error messages

You end up spending hours debugging issues that should take seconds to find.

## The Solution

```bash
npm install -g mcp-doctor
mcp-doctor
```

That's it. It scans your configs and tells you exactly what's wrong:

```
🩺 MCP Doctor

Found 2 config files:

  Claude Desktop
  ~/Library/Application Support/Claude/claude_desktop_config.json

  Cursor (project)
  ./.cursor/mcp.json

❌ 1 Error

  ~/.cursor/mcp.json:12
  Trailing comma detected (not allowed in JSON)

   10 │     "github": {
   11 │       "command": "npx",
 > 12 │       "args": ["-y", "@modelcontextprotocol/server-github"],
                                                                   ^
   13 │     },
   14 │   }

  💡 Remove the comma before the closing bracket/brace

⚠️  2 Warnings

  ~/.cursor/mcp.json
  Server "github": Environment variable GITHUB_TOKEN is not set
  💡 Set it with: export GITHUB_TOKEN="your-value"

  ~/.cursor/mcp.json
  Server "myserver": Using relative path "./server.js"
  💡 Consider using absolute path: /Users/you/project/server.js

🔌 Server Health: 3 healthy, 1 failed

  ✓ filesystem (120ms)
  ✓ fetch (89ms)
  ✓ github (340ms)
  ✗ broken-server
    Timeout after 10000ms

──────────────────────────────────────────────────

❌ Found 1 error that needs fixing
⚠️  3/4 servers responding
```

## What It Checks

| Check                     | Description                                             |
| ------------------------- | ------------------------------------------------------- |
| **JSON Syntax**           | Catches trailing commas, missing brackets, invalid JSON |
| **Path Validation**       | Verifies command paths exist and are executable         |
| **Environment Variables** | Detects missing or empty env vars                       |
| **Hardcoded Secrets**     | Warns about API keys in config files                    |
| **Server Health**         | Actually starts each server and tests MCP handshake     |

## Supported Clients

- ✅ Claude Desktop (macOS, Windows, Linux)
- ✅ Cursor
- ✅ VS Code (with MCP extension)
- ✅ Claude Code
- ✅ Windsurf

## Usage

```bash
# Check all configs (default)
mcp-doctor

# Same as above
mcp-doctor check

# Skip server health tests (faster)
mcp-doctor check --skip-health

# Validate a specific config file
mcp-doctor --file ./my-config.json
mcp-doctor --file ~/custom/location/config.json
```

## Installation

Requires Node.js 18 or later.

```bash
# npm
npm install -g mcp-doctor

# Or run directly with npx
npx mcp-doctor
```

## Config File Locations

| Client                   | Location                                                          |
| ------------------------ | ----------------------------------------------------------------- |
| Claude Desktop (macOS)   | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Claude Desktop (Windows) | `%APPDATA%/Claude/claude_desktop_config.json`                     |
| Claude Desktop (Linux)   | `~/.config/claude/claude_desktop_config.json`                     |
| Cursor                   | `~/.cursor/mcp.json`                                              |
| VS Code                  | `~/Library/Application Support/Code/User/settings.json`           |
| Claude Code              | `~/.claude.json` or `./.mcp.json`                                 |
| Windsurf                 | `~/.codeium/windsurf/mcp_config.json`                             |

## FAQ

**Q: It says "No MCP configuration files found"**

Make sure you have at least one MCP client configured. The tool looks in standard locations for each client.

**Q: Server health check is timing out**

Some servers take longer to start. The default timeout is 10 seconds. If your server needs more time, it might indicate a performance issue.

**Q: Can it auto-fix issues?**

Not yet. For now it tells you what's wrong and how to fix it. Auto-fix for simple issues (like trailing commas) is planned.

## Contributing

Issues and PRs welcome! https://github.com/Crooj026/mcp-doctor

## License

MIT
