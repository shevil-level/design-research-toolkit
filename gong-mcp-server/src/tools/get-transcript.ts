import { z } from "zod";
import {
  getTranscript,
  flattenTranscript,
  handleApiError,
} from "../gong-client.js";
import { CHARACTER_LIMIT } from "../constants.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const GetTranscriptInputSchema = {
  callId: z.string().min(1).describe("Gong call ID"),
};

export function registerGetTranscript(server: McpServer): void {
  server.registerTool(
    "gong_get_transcript",
    {
      title: "Get Gong Call Transcript",
      description: `Retrieve the full transcript for a single Gong call. Returns speaker-labeled text with timestamps.

Args:
  - callId (string, required): Gong call ID (get this from gong_list_calls)

Returns: Speaker-labeled transcript with timestamps.

Examples:
  - "Show me the transcript for call abc123" → callId: "abc123"`,
      inputSchema: GetTranscriptInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ callId }) => {
      try {
        const result = await getTranscript(callId);
        const flat = flattenTranscript(result.transcript);

        let text = `# Transcript: Call ${callId}\n\n${flat}`;

        if (text.length > CHARACTER_LIMIT) {
          text =
            text.slice(0, CHARACTER_LIMIT) +
            "\n\n_Transcript truncated due to length._";
        }

        if (!result.transcript.length) {
          text = `No transcript available for call ${callId}. The call may not have been recorded or processed yet.`;
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
