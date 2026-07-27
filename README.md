# SiteScout MCP

An MCP (Model Context Protocol) server that gives Claude the ability to search for businesses without websites, gather photos and data about them, and generate ready-to-publish website code.

## Quick Start

### Prerequisites

You need a **Google Places API key** to use the `search_businesses` tool:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new API key (or use an existing one)
3. Enable the **Places API** for that key

Set the key as an environment variable:

```bash
export GOOGLE_PLACES_API_KEY="your-api-key-here"
```

When configuring Claude (below), include this environment variable so the MCP server can read it.

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
      "args": ["/absolute/path/to/SiteScout/dist/index.js"],
      "env": {
        "GOOGLE_PLACES_API_KEY": "your-api-key-here"
      }
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
      "args": ["/absolute/path/to/SiteScout/dist/index.js"],
      "env": {
        "GOOGLE_PLACES_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Verify It Works

Once configured and Claude is restarted, ask:

> "Use the ping tool to check if SiteScout is connected."

You should get back a confirmation with server status, version, and timestamp.

## Available Tools

| Tool                | Description |
|---------------------|-------------|
| `ping`              | Health check — confirms the server is connected and responsive |
| `search_businesses` | Search for businesses in a given location that do NOT have a website. Returns enriched results with photos, address, phone, and rating. |

### search_businesses

**Input:**
- `location` (required) — e.g. `"Austin, TX"`, `"Lower East Side, New York"`
- `radius` (optional) — search radius in meters, defaults to 5000
- `maxResults` (optional) — max businesses to return, defaults to 20

**Output:** JSON array of businesses. Each business includes: `name`, `address`, `phone`, `rating`, `types`, `place_id`, and `photos` (up to 5 photo URLs).

**Requires:** `GOOGLE_PLACES_API_KEY` environment variable.

## Development

```bash
npm install        # Install dependencies
npm run build      # Compile TypeScript
node dist/index.js # Start the server (stdio transport)
```

### Project Structure

```
src/
  index.ts                     # Server entry point — wires up tools and starts stdio transport
  tools/
    ping.ts                    # Ping tool (health check canary)
    search_businesses.ts       # Search for businesses without websites
```

### Adding a New Tool

1. Create `src/tools/<name>.ts`
2. Export a `Tool` definition and an async handler function
3. Register both in `src/index.ts` (add to `tools` array and `switch` statement)

## License

MIT
