# SiteScout MCP

An MCP (Model Context Protocol) server that gives Claude the ability to search for businesses without websites, gather photos and data about them, and generate ready-to-publish website code.

## Quick Start

### Install

```bash
git clone https://github.com/IDKMANPLS/SiteScout.git
cd SiteScout
npm install
npm run build
```

### Configure in Claude Code

Add this to your Claude Code MCP configuration (`~/.claude/claude_desktop_config.json` or the Claude Code settings):

```json
{
  "mcpServers": {
    "sitescout": {
      "command": "node",
      "args": ["/absolute/path/to/SiteScout/dist/index.js"]
    }
  }
}
```

### Configure in Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "sitescout": {
      "command": "node",
      "args": ["/absolute/path/to/SiteScout/dist/index.js"]
    }
  }
}
```

## Verify It Works

Once configured and Claude is restarted, ask:

> "Use the ping tool to check if SiteScout is connected."

You should get back a confirmation with server status, version, and timestamp.

## Available Tools

| Tool   | Description |
|--------|-------------|
| `ping` | Health check — confirms the server is connected and responsive |

More tools coming soon: `search_businesses`, `generate_site`.

## Development

```bash
npm install        # Install dependencies
npm run build      # Compile TypeScript
node dist/index.js # Start the server (stdio transport)
```

### Project Structure

```
src/
  index.ts          # Server entry point — wires up tools and starts stdio transport
  tools/
    ping.ts         # Ping tool (health check canary)
```

### Adding a New Tool

1. Create `src/tools/<name>.ts`
2. Export a `Tool` definition and an async handler function
3. Register both in `src/index.ts` (add to `tools` array and `switch` statement)

## License

MIT
