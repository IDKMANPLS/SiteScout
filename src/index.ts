#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { pingTool, handlePing } from "./tools/ping.js";
import {
  searchBusinessesTool,
  handleSearchBusinesses,
} from "./tools/search_businesses.js";

const server = new Server(
  {
    name: "sitescout-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [pingTool, searchBusinessesTool],
  };
});

// Register tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "ping": {
      const result = await handlePing();
      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    }
    case "search_businesses": {
      const result = await handleSearchBusinesses(args as {
        location: string;
        radius?: number;
        maxResults?: number;
      });
      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
      };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr so stdout stays clean for MCP protocol
  console.error("SiteScout MCP server running on stdio transport");
}

main().catch((err) => {
  console.error("Fatal error starting SiteScout MCP server:", err);
  process.exit(1);
});
