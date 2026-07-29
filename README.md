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

### Configure in Claude

Add this to your MCP configuration (`claude_desktop_config.json` or Claude Code settings):

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

## Walkthrough

Here's the full pipeline in Claude — find leads and build them a site:

```
> Find businesses without websites in Austin, TX

[Claude calls search_businesses → returns 12 leads]

> Generate a website for the first one

[Claude calls generate_site → writes index.html to disk]
```

Each generated site is a single `index.html` file with embedded CSS — no build step, no dependencies. Open it in a browser or deploy it anywhere.

## Available Tools

| Tool                | Description |
|---------------------|-------------|
| `ping`              | Health check — confirms the server is connected and responsive |
| `search_businesses` | Search for businesses in a given location that do NOT have a website. Returns enriched results with photos, address, phone, and rating. |
| `generate_site`     | Generate a complete, responsive single-page static HTML website for a business. Produces a ready-to-publish index.html. |

### search_businesses

**Input:**
- `location` (required) — e.g. `"Austin, TX"`, `"Lower East Side, New York"`
- `radius` (optional) — search radius in meters, defaults to 5000
- `maxResults` (optional) — max businesses to return, defaults to 20

**Output:** JSON array of businesses. Each business includes: `name`, `address`, `phone`, `rating`, `types`, `place_id`, and `photos` (up to 5 photo URLs — append `&key=YOUR_API_KEY` to use them).

**Requires:** `GOOGLE_PLACES_API_KEY` environment variable.

### generate_site

**Input:**
- `business_name` (required) — the business name
- `description` (optional) — tagline for the hero section
- `address` (optional) — shown in the contact section
- `phone` (optional) — shown in the contact section
- `photos` (optional) — array of photo URLs for the gallery
- `output_path` (optional) — where to write the site (defaults to `./sitescout-output/<slug>/`)

**Output:** `{ success: true, path: "/absolute/path", file: "index.html" }` — open the file or deploy it.

**Site features:** Sticky nav, hero with CTA, about section, 3 service cards, photo gallery, contact section, footer. Responsive at 768px and 480px. Dark navy + accent red color scheme.

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
    generate_site.ts           # Generate ready-to-publish business websites
```

### Adding a New Tool

1. Create `src/tools/<name>.ts`
2. Export a `Tool` definition and an async handler function
3. Register both in `src/index.ts` (add to `tools` array and `switch` statement)

## License

MIT
