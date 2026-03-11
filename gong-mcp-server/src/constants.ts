export const GONG_API_BASE_URL = (
  process.env.GONG_API_BASE_URL || "https://api.gong.io"
).replace(/\/$/, "");

export const CHARACTER_LIMIT = 25_000;
export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_MAX_CALLS = 30;
export const CONCURRENT_TRANSCRIPT_FETCHES = 5;
export const MAX_RETRIES = 3;
export const RETRY_BASE_DELAY_MS = 1_000;
