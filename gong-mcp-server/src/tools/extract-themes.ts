import { z } from "zod";
import {
  listCalls,
  getTranscriptsBatch,
  formatTimestamp,
  handleApiError,
} from "../gong-client.js";
import { DEFAULT_MAX_CALLS, CHARACTER_LIMIT } from "../constants.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { GongTranscriptEntry } from "../types.js";

const ExtractThemesInputSchema = {
  topic: z
    .string()
    .min(2, "Topic must be at least 2 characters")
    .describe(
      "What to look for, e.g. 'onboarding friction', 'pricing concerns'"
    ),
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
    .describe(`Max calls to analyze (default ${DEFAULT_MAX_CALLS})`),
};

interface ChunkWithContext {
  callId: string;
  callTitle: string;
  callDate: string;
  speaker: string;
  timestamp: number;
  text: string;
}

function extractRelevantChunks(
  entries: GongTranscriptEntry[],
  topic: string,
  callId: string,
  callTitle: string,
  callDate: string
): ChunkWithContext[] {
  const chunks: ChunkWithContext[] = [];
  const lowerTopic = topic.toLowerCase();
  const topicWords = lowerTopic.split(/\s+/);

  const allSentences = entries.flatMap((entry) =>
    entry.sentences.map((s) => ({
      speaker: entry.speaker,
      start: s.start,
      text: s.text,
    }))
  );

  for (let i = 0; i < allSentences.length; i++) {
    const lowerText = allSentences[i].text.toLowerCase();
    const isMatch = topicWords.some((word) => lowerText.includes(word));

    if (isMatch) {
      const contextStart = Math.max(0, i - 2);
      const contextEnd = Math.min(allSentences.length, i + 3);
      const contextSlice = allSentences.slice(contextStart, contextEnd);

      const text = contextSlice
        .map((s) => `${s.speaker}: ${s.text}`)
        .join(" ");

      chunks.push({
        callId,
        callTitle,
        callDate,
        speaker: allSentences[i].speaker,
        timestamp: allSentences[i].start,
        text,
      });
    }
  }

  return chunks;
}

export function registerExtractThemes(server: McpServer): void {
  server.registerTool(
    "gong_extract_themes",
    {
      title: "Extract Themes from Gong Calls",
      description: `Collect topic-relevant transcript chunks from Gong calls in a date range. Returns all matching passages so you can synthesize themes, pain points, frequency, and evidence.

This tool does NOT synthesize themes itself — it returns the raw evidence chunks. Use the output to identify patterns, group by theme, and assess frequency and severity.

Args:
  - topic (string, required): What to look for, e.g. "onboarding friction", "pricing concerns"
  - fromDateTime (string, required): ISO-8601 start datetime
  - toDateTime (string, required): ISO-8601 end datetime
  - maxCalls (number, optional): Max calls to analyze, default ${DEFAULT_MAX_CALLS}

Returns: Topic-relevant transcript chunks with call metadata (callId, title, date, speaker, timestamp, text with surrounding context). Chunks are grouped by call.

Suggested synthesis approach:
  1. Group chunks by emerging theme
  2. Count frequency (how many calls mention each theme)
  3. Assess severity (impact on customer) and confidence (evidence strength)
  4. Note product implications

Examples:
  - "What are customers saying about onboarding?" → topic: "onboarding"
  - "Find pricing pain points this quarter" → topic: "pricing"`,
      inputSchema: ExtractThemesInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ topic, fromDateTime, toDateTime, maxCalls }) => {
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

        const allChunks: ChunkWithContext[] = [];
        const failedCalls: string[] = [];
        let callsWithMatches = 0;

        for (const [callId, data] of transcripts) {
          if (data.error) {
            failedCalls.push(callId);
            continue;
          }
          const call = callMap.get(callId);
          if (!call) continue;

          const chunks = extractRelevantChunks(
            data.transcript,
            topic,
            callId,
            call.title,
            call.started
          );

          if (chunks.length > 0) {
            callsWithMatches++;
            allChunks.push(...chunks);
          }
        }

        const lines = [
          `# Theme Extraction: "${topic}"`,
          `_Analyzed ${callIds.length} calls from ${fromDateTime} to ${toDateTime}_`,
          `_Found ${allChunks.length} relevant passage(s) across ${callsWithMatches} call(s)_`,
          "",
          "Use these passages to synthesize themes. Group by pattern, assess frequency and severity, note product implications.",
          "",
        ];

        let currentCallId = "";
        for (const chunk of allChunks) {
          if (chunk.callId !== currentCallId) {
            currentCallId = chunk.callId;
            lines.push(`## ${chunk.callTitle} (${chunk.callDate})`);
            lines.push(`Call ID: ${chunk.callId}`);
            lines.push("");
          }
          lines.push(
            `**[${formatTimestamp(chunk.timestamp)}] ${chunk.speaker}:**`
          );
          lines.push(`> ${chunk.text}`);
          lines.push("");
        }

        if (allChunks.length === 0) {
          lines.push(
            `No passages about "${topic}" found. Try a broader keyword or wider date range.`
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
            "\n\n_Results truncated. Reduce maxCalls or narrow the date range for complete output._";
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
