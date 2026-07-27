import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const pingTool: Tool = {
  name: "ping",
  description: "Health check tool — returns a confirmation that the SiteScout MCP server is connected and responsive.",
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },
};

export async function handlePing(): Promise<string> {
  return JSON.stringify({
    status: "ok",
    server: "SiteScout MCP",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
    message: "SiteScout MCP server is running and ready to find businesses without websites.",
  });
}
