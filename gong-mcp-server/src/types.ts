export interface GongCall {
  id: string;
  title: string;
  started: string;
  duration: number;
  participants: GongParticipant[];
}

export interface GongParticipant {
  name: string;
  email?: string;
  role?: string;
}

export interface GongTranscriptEntry {
  speaker: string;
  topic?: string;
  sentences: GongSentence[];
}

export interface GongSentence {
  start: number;
  end: number;
  text: string;
}

export interface GongListCallsResponse {
  requestId: string;
  records: {
    totalRecords: number;
    currentPageSize: number;
    currentPageNumber: number;
    cursor?: string;
  };
  calls: GongCallRaw[];
}

export interface GongCallRaw {
  id: string;
  title?: string;
  started?: string;
  duration?: number;
  parties?: Array<{
    name?: string;
    emailAddress?: string;
    affiliation?: string;
  }>;
}

export interface GongTranscriptResponse {
  requestId: string;
  records: {
    totalRecords: number;
    currentPageSize: number;
    currentPageNumber: number;
    cursor?: string;
  };
  callTranscripts: Array<{
    callId: string;
    transcript: GongTranscriptEntry[];
  }>;
}

export interface TranscriptMatch {
  callId: string;
  callTitle: string;
  callDate: string;
  speaker: string;
  timestamp: number;
  quote: string;
}

export interface PaginationMeta {
  total: number;
  count: number;
  has_more: boolean;
  next_cursor?: string;
}
