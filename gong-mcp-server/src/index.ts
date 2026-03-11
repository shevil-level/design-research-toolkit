#!/usr/bin/env node

/**
 * Gong MCP Server
 *
 * Provides tools to search and analyze Gong customer conversation
 * transcripts via the Model Context Protocol.
 *
 * Transport: stdio (local, single user)
 * Auth: GONG_ACCESS_KEY + GONG_ACCESS_SECRET env vars
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerListCalls } from "./tools/list-calls.js";
import { registerGetTranscript } from "./tools/get-transcript.js";
import { registerSearchTranscripts } from "./tools/search-transcripts.js";
import { registerExtractThemes } from "./tools/extract-themes.js";

const server = new McpServer({
  name: "gong-mcp-server",
  version: "1.0.0",
});

registerListCalls(server);
registerGetTranscript(server);
registerSearchTranscripts(server);
registerExtractThemes(server);

async function main(): Promise<void> {
  if (!process.env.GONG_ACCESS_KEY || !process.env.GONG_ACCESS_SECRET) {
    console.error(
      "ERROR: GONG_ACCESS_KEY and GONG_ACCESS_SECRET environment variables are required.\n" +
        "Set them in the .env file at the project root."
    );
    process.exit(1);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("gong-mcp-server running via stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
