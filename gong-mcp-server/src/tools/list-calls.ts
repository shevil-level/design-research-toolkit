import { z } from "zod";
import { listCalls, handleApiError } from "../gong-client.js";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, CHARACTER_LIMIT } from "../constants.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const ListCallsInputSchema = {
  fromDateTime: z
    .string()
    .describe("ISO-8601 start datetime, e.g. 2026-01-01T00:00:00Z"),
  toDateTime: z
    .string()
    .describe("ISO-8601 end datetime, e.g. 2026-01-31T23:59:59Z"),
  cursor: z
    .string()
    .optional()
    .describe("Pagination cursor from a previous response"),
  limit: z
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE)
    .describe(`Page size (default ${DEFAULT_PAGE_SIZE}, max ${MAX_PAGE_SIZE})`),
};

export function registerListCalls(server: McpServer): void {
  server.registerTool(
    "gong_list_calls",
    {
      title: "List Gong Calls",
      description: `List Gong calls in a date range. Use this first to browse calls and get call IDs for transcript retrieval.

Args:
  - fromDateTime (string, required): ISO-8601 start datetime
  - toDateTime (string, required): ISO-8601 end datetime
  - cursor (string, optional): Pagination cursor from previous response
  - limit (number, optional): Page size, default ${DEFAULT_PAGE_SIZE}, max ${MAX_PAGE_SIZE}

Returns: List of calls (id, title, date, duration, participants) with pagination metadata.

Examples:
  - "Show me calls from last week" → fromDateTime: 7 days ago, toDateTime: now
  - "Get the next page" → pass the cursor from previous response`,
      inputSchema: ListCallsInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ fromDateTime, toDateTime, cursor, limit }) => {
      try {
        const result = await listCalls(
          fromDateTime,
          toDateTime,
          cursor,
          limit ?? DEFAULT_PAGE_SIZE
        );

        const lines = [
          `# Gong Calls (${result.calls.length} of ${result.total})`,
          "",
        ];

        for (const call of result.calls) {
          const participants = call.participants
            .map((p) => p.name)
            .join(", ");
          const durationMin = Math.round(call.duration / 60);
          lines.push(`## ${call.title}`);
          lines.push(`- **Call ID:** ${call.id}`);
          lines.push(`- **Date:** ${call.started}`);
          lines.push(`- **Duration:** ${durationMin} min`);
          lines.push(`- **Participants:** ${participants || "Unknown"}`);
          lines.push("");
        }

        if (result.cursor) {
          lines.push(
            `_More calls available. Use cursor \`${result.cursor}\` to get the next page._`
          );
        }

        if (result.calls.length === 0) {
          lines.push(
            "No calls found in this date range. Try expanding the range."
          );
        }

        let text = lines.join("\n");
        if (text.length > CHARACTER_LIMIT) {
          text =
            text.slice(0, CHARACTER_LIMIT) +
            "\n\n_Response truncated. Use a narrower date range or smaller limit._";
        }

        return { content: [{ type: "text" as const, text }] };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: handleApiError(error) }],
          isError: true,
        };
      }
    }
  );
}
