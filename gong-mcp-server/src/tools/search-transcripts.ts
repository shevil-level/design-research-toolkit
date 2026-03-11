import { z } from "zod";
import {
  listCalls,
  getTranscriptsBatch,
  formatTimestamp,
  handleApiError,
} from "../gong-client.js";
import { DEFAULT_MAX_CALLS, CHARACTER_LIMIT } from "../constants.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GongTranscriptEntry, TranscriptMatch } from "../types.js";

const SearchTranscriptsInputSchema = {
  query: z
    .string()
    .min(2, "Query must be at least 2 characters")
    .describe("Keyword or phrase to search for in transcripts"),
  fromDateTime: z
    .string()
    .describe("ISO-8601 start datetime, e.g. 2026-01-01T00:00:00Z"),
  toDateTime: z
    .string()
    .describe("ISO-8601 end datetime, e.g. 2026-01-31T23:59:59Z"),
  maxCalls: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(DEFAULT_MAX_CALLS)
    .describe(`Max calls to search through (default ${DEFAULT_MAX_CALLS})`),
};

function extractMatchesFromTranscript(
  entries: GongTranscriptEntry[],
  query: string,
  callId: string,
  callTitle: string,
  callDate: string
): TranscriptMatch[] {
  const matches: TranscriptMatch[] = [];
  const lowerQuery = query.toLowerCase();

  const allSentences = entries.flatMap((entry) =>
    entry.sentences.map((s) => ({
      speaker: entry.speaker,
      start: s.start,
      text: s.text,
    }))
  );

  for (let i = 0; i < allSentences.length; i++) {
    if (allSentences[i].text.toLowerCase().includes(lowerQuery)) {
      const contextStart = Math.max(0, i - 3);
      const contextEnd = Math.min(allSentences.length, i + 4);
      const contextSlice = allSentences.slice(contextStart, contextEnd);

      const quote = contextSlice
        .map((s) => `${s.speaker}: ${s.text}`)
        .join(" ");

      matches.push({
        callId,
        callTitle,
        callDate,
        speaker: allSentences[i].speaker,
        timestamp: allSentences[i].start,
        quote,
      });
    }
  }

  return matches;
}

export function registerSearchTranscripts(server: McpServer): void {
  server.registerTool(
    "gong_search_transcripts",
    {
      title: "Search Gong Transcripts",
      description: `Search across Gong call transcripts by keyword within a date range. Returns matching quotes with surrounding context.

Args:
  - query (string, required): Keyword or phrase to search for
  - fromDateTime (string, required): ISO-8601 start datetime
  - toDateTime (string, required): ISO-8601 end datetime
  - maxCalls (number, optional): Max calls to search, default ${DEFAULT_MAX_CALLS}

Returns: Matching transcript snippets with call metadata (callId, title, date, speaker, timestamp, quote with ±3 sentences of context).

Examples:
  - "Find mentions of onboarding in January calls" → query: "onboarding", fromDateTime/toDateTime for January
  - "Search for pricing discussions this quarter" → query: "pricing"`,
      inputSchema: SearchTranscriptsInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ query, fromDateTime, toDateTime, maxCalls }) => {
      try {
        const callLimit = maxCalls ?? DEFAULT_MAX_CALLS;
        const callResult = await listCalls(fromDateTime, toDateTime, undefined, callLimit);

        if (callResult.calls.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No calls found in this date range. Try expanding the range.",
              },
            ],
          };
        }

        const callIds = callResult.calls.map((c) => c.id);
        const callMap = new Map(
          callResult.calls.map((c) => [c.id, c])
        );
        const transcripts = await getTranscriptsBatch(callIds);

        const allMatches: TranscriptMatch[] = [];
        const failedCalls: string[] = [];

        for (const [callId, data] of transcripts) {
          if (data.error) {
            failedCalls.push(callId);
            continue;
          }
          const call = callMap.get(callId);
          if (!call) continue;

          const matches = extractMatchesFromTranscript(
            data.transcript,
            query,
            callId,
            call.title,
            call.started
          );
          allMatches.push(...matches);
        }

        const lines = [
          `# Search Results: "${query}"`,
          `_Searched ${callIds.length} calls from ${fromDateTime} to ${toDateTime}_`,
          `_Found ${allMatches.length} match(es)_`,
          "",
        ];

        for (const match of allMatches) {
          lines.push(`## ${match.callTitle} (${match.callDate})`);
          lines.push(`- **Call ID:** ${match.callId}`);
          lines.push(
            `- **Speaker:** ${match.speaker} at ${formatTimestamp(match.timestamp)}`
          );
          lines.push(`- **Quote:** ${match.quote}`);
          lines.push("");
        }

        if (allMatches.length === 0) {
          lines.push(
            `No mentions of "${query}" found. Try a broader keyword or wider date range.`
          );
        }

        if (failedCalls.length > 0) {
          lines.push(
            `_Note: Could not retrieve transcripts for ${failedCalls.length} call(s)._`
          );
        }

        let text = lines.join("\n");
        if (text.length > CHARACTER_LIMIT) {
          text =
            text.slice(0, CHARACTER_LIMIT) +
            "\n\n_Results truncated. Use a narrower date range or reduce maxCalls._";
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
