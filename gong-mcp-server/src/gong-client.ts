import axios, { AxiosError, AxiosInstance } from "axios";
import {
  GONG_API_BASE_URL,
  DEFAULT_PAGE_SIZE,
  CONCURRENT_TRANSCRIPT_FETCHES,
  MAX_RETRIES,
  RETRY_BASE_DELAY_MS,
} from "./constants.js";
import type {
  GongCall,
  GongCallRaw,
  GongListCallsResponse,
  GongTranscriptEntry,
  GongTranscriptResponse,
} from "./types.js";

function buildAuthHeader(): string {
  const key = process.env.GONG_ACCESS_KEY;
  const secret = process.env.GONG_ACCESS_SECRET;

  if (!key || !secret) {
    throw new Error(
      "Missing Gong credentials. Set GONG_ACCESS_KEY and GONG_ACCESS_SECRET environment variables."
    );
  }

  return "Basic " + Buffer.from(`${key}:${secret}`).toString("base64");
}

function createClient(): AxiosInstance {
  return axios.create({
    baseURL: GONG_API_BASE_URL,
    timeout: 30_000,
    headers: {
      Authorization: buildAuthHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(
  fn: () => Promise<T>,
  context: string
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (error instanceof AxiosError && error.response?.status === 429) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
        console.error(
          `Rate limited on ${context}, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
        );
        await sleep(delay);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

function normalizeCall(raw: GongCallRaw): GongCall {
  return {
    id: raw.id,
    title: raw.title ?? "Untitled call",
    started: raw.started ?? "",
    duration: raw.duration ?? 0,
    participants: (raw.parties ?? []).map((p) => ({
      name: p.name ?? "Unknown",
      email: p.emailAddress,
      role: p.affiliation,
    })),
  };
}

export function handleApiError(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          return "Error: Authentication failed. Check GONG_ACCESS_KEY and GONG_ACCESS_SECRET.";
        case 403:
          return "Error: Permission denied. Your Gong API credentials may lack the required scope.";
        case 404:
          return "Error: Resource not found. Check the call ID is correct.";
        case 429:
          return "Error: Rate limit exceeded after retries. Try again in a few minutes or reduce maxCalls.";
        default:
          return `Error: Gong API returned status ${error.response.status}. ${error.response.data?.errors?.[0]?.message ?? ""}`;
      }
    } else if (error.code === "ECONNABORTED") {
      return "Error: Request to Gong API timed out. Try again.";
    } else if (error.code === "ENOTFOUND") {
      return `Error: Cannot reach Gong API at ${GONG_API_BASE_URL}. Check your network connection.`;
    }
  }
  return `Error: ${error instanceof Error ? error.message : String(error)}`;
}

export async function listCalls(
  fromDateTime: string,
  toDateTime: string,
  cursor?: string,
  pageSize: number = DEFAULT_PAGE_SIZE
): Promise<{ calls: GongCall[]; total: number; cursor?: string }> {
  const client = createClient();

  const params: Record<string, string> = {
    fromDateTime,
    toDateTime,
  };
  if (cursor) {
    params.cursor = cursor;
  }

  const response = await withRetry(
    () => client.get<GongListCallsResponse>("/v2/calls", { params }),
    "listCalls"
  );

  const data = response.data;
  const calls = (data.calls ?? []).map(normalizeCall).slice(0, pageSize);

  return {
    calls,
    total: data.records?.totalRecords ?? calls.length,
    cursor: data.records?.cursor,
  };
}

export async function getTranscript(
  callId: string
): Promise<{ callId: string; transcript: GongTranscriptEntry[] }> {
  const client = createClient();

  const body = {
    filter: { callIds: [callId] },
  };

  const response = await withRetry(
    () => client.post<GongTranscriptResponse>("/v2/calls/transcript", body),
    `getTranscript(${callId})`
  );

  const entry = response.data.callTranscripts?.[0];
  if (!entry) {
    throw new Error(`No transcript found for call ${callId}`);
  }

  return {
    callId: entry.callId,
    transcript: entry.transcript ?? [],
  };
}

export async function getTranscriptsBatch(
  callIds: string[]
): Promise<
  Map<string, { transcript: GongTranscriptEntry[]; error?: string }>
> {
  const results = new Map<
    string,
    { transcript: GongTranscriptEntry[]; error?: string }
  >();

  const chunks: string[][] = [];
  for (let i = 0; i < callIds.length; i += CONCURRENT_TRANSCRIPT_FETCHES) {
    chunks.push(callIds.slice(i, i + CONCURRENT_TRANSCRIPT_FETCHES));
  }

  for (const chunk of chunks) {
    const promises = chunk.map(async (callId) => {
      try {
        const result = await getTranscript(callId);
        results.set(callId, { transcript: result.transcript });
      } catch (error) {
        results.set(callId, {
          transcript: [],
          error: handleApiError(error),
        });
      }
    });
    await Promise.all(promises);
  }

  return results;
}

export function flattenTranscript(
  entries: GongTranscriptEntry[]
): string {
  return entries
    .flatMap((entry) =>
      entry.sentences.map(
        (s) => `[${formatTimestamp(s.start)}] ${entry.speaker}: ${s.text}`
      )
    )
    .join("\n");
}

export function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
