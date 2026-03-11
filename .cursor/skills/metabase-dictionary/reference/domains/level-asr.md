# Level ASR Domain (Conversations & Transcriptions)

**Table prefix:** `level_asr_*`
**Colossus table count:** ~85 (including partitioned)
**Status:** EXPLORED (columns documented from Chime schema, product concepts from Help Center)

Last updated: 2026-02-19

---

## Product Concept

In Level AI, a **conversation** (also called an **interaction**) is the foundational data unit. Every customer-agent interaction — whether a phone call, live chat, email, or SMS — is ingested into the platform and stored as an ASR log record. The product UI refers to these collectively as "conversations" or "interactions." Each conversation is assigned a unique **Conversation ID**, has a channel type, a primary agent, and timestamps for when it started and completed. CRM-sourced metadata (case number, custom fields from Salesforce, Freshdesk, etc.) is stored as JSON alongside each conversation.

The **Interaction History** screen is the primary surface for browsing conversations. By default it shows the last 30 days. Users can narrow results using the **Filters** panel (organized into categories: date range, channel, agent, team, QA status, conversation tags, CSAT, sentiment, and CRM-imported "Interaction Fields"). They can also full-text search transcripts with the **Search Transcript** feature, which supports keyword proximity matching, AND/OR/NOT operators, speaker-scoped queries (`agent:"refund"`, `customer:"cancel"`), and search by agent name or email. Filter combinations can be persisted as **Saved Views** for quick recall. Column display order is customizable via the **Column Customizer**.

Opening a conversation takes the user to the **Conversation Review** screen. This screen shows the full transcript (with customer/agent speaker labels), the audio player (for calls), QA evaluation scores (Manual QA Score, Instascore, CSAT, Sentiment), the assigned rubric with per-question evaluation, Key Events (metric tags and conversation tags with audio snippets), and the AI-generated **Smart Summary**. Smart Summaries are structured into four sections: Primary Reason for Conversation, Actions Taken by Agent, Overall Resolution (Completely Resolved / Partially Resolved / Not Resolved), and Follow-up Actions (for agent and customer). Summaries are not generated for conversations with no customer utterances. Users can add conversations to **Libraries** (curated folders shared across teams for training, coaching, and onboarding) or to **Coaching Sessions** directly from the review screen.

**Transcription** is generated for every ingested conversation regardless of channel. For voice calls, Level AI runs ASR (automatic speech recognition) producing word-level transcription with speaker tags and timestamps. The `text` field on asrlog holds the concatenated conversation text as an array, while individual transcription segments live in `asrtranscriptionlog` (partitioned by quarter for scale). Redacted versions of text are stored in `clean_text` / `original_text` columns. Admins can configure **Data Redaction** (PII/PCI masking for transcripts and audio) and **Booster Words** (custom vocabulary to improve ASR accuracy) under Settings > Transcript Tools. Redaction settings apply only to newly ingested conversations.

**Journeys** group multiple related conversations into a single customer experience timeline. When a customer's issue spans multiple calls, chats, or agents, Level AI links them under one Journey. Each Journey gets its own AI-generated summary with resolution scoring, iCSAT, and sentiment — updated dynamically as new conversations are added. In the DB, `asrlog.journey_id` links a conversation to its Journey. Journey summaries are stored separately in `level_asr_journeysummary`. Journeys are currently available for Salesforce and Amazon Connect integrations.

**Screen Recording** captures agent desktop activity during conversations. The Screen Recording app runs on agent machines, recording up to 4 monitors at 720p. Recordings are synchronized with audio for playback review. Redaction controls mask PCI/PII data and can black out entire screens when agents access sensitive URLs. The `has_screen_recording` and `requires_screen_recording` flags on asrlog track screen recording status, while `level_asr_asrlogtoscreenrecordingmapping` links conversations to their recordings.

---

## Core Tables

### `level_asr_asrlog` — Primary Conversation Record

Each row = one conversation/interaction (call, chat, email, SMS, or manual case).

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK |
| `deleted` | timestamptz | YES | Soft delete (NULL = active) |
| `created` | timestamptz | NO | Record creation timestamp (ingestion time) |
| `modified` | timestamptz | NO | Last modified timestamp |
| `text` | ARRAY | NO | Concatenated conversation text as text array |
| `is_correct` | boolean | YES | Whether transcription has been verified as correct |
| `corrected_text` | ARRAY | NO | Manually corrected transcript text array |
| `audio_id` | integer | YES | FK → `level_asr_audiolog` (call audio file) |
| `user_id` | integer | YES | FK → `accounts_user` (primary agent) |
| `transcription_uuid` | uuid | YES | UUID linking to transcription session |
| `conversation_status` | varchar | YES | Conversation processing status |
| `channel` | smallint | NO | Channel type (call/chat/email/SMS/manual) |
| `agent_joined_in` | smallint | NO | Point at which agent joined the conversation |
| `transcript_id` | varchar | YES | External transcript identifier |
| `is_force_end` | boolean | NO | Whether conversation was force-ended |
| `is_blacklisted_for_analytics` | boolean | NO | Excluded from analytics/reporting |
| `customer_email` | varchar | YES | Customer email address |
| `summary` | text | YES | Legacy paragraph-style summary text |
| `email_summaries` | ARRAY | NO | Email thread summaries (for email channel) |
| `version` | varchar | NO | Record schema version |
| `workspace_id` | integer | YES | FK → workspace |
| `organisation_id` | integer | YES | Legacy org FK (British spelling — deprecated, use `organization_id`) |
| `custom_fields` | jsonb | NO | CRM-imported custom fields (Salesforce, Freshdesk, etc.) |
| `processing_batch_id` | integer | YES | FK → processing batch |
| `offline_asr_payload_id` | integer | YES | FK → `level_asr_offlineasrpayload` |
| `completed_at` | timestamptz | YES | When conversation ended |
| `external_log_id` | integer | YES | FK → external log record |
| `clean_text` | text | YES | Transcript text after PII/PCI redaction |
| `language` | varchar | YES | Detected or configured language code |
| `organization_id` | integer | NO | FK → `accounts_organization` (canonical org FK) |
| `is_sampled` | boolean | NO | Whether conversation was selected by QA sampling |
| `banking_conversation_id` | integer | YES | FK → banking-specific conversation record |
| `qa_status` | integer | NO | Overall QA evaluation status |
| `has_screen_recording` | boolean | NO | Whether a screen recording exists |
| `persona_id` | integer | YES | FK → `level_asr_persona` (speaker role configuration) |
| `journey_id` | integer | YES | FK → Journey (groups multi-agent/multi-channel conversations) |
| `project_id` | integer | YES | FK → project |
| `requires_screen_recording` | boolean | NO | Whether screen recording is required for this conversation |
| `manual_conversation_status` | integer | NO | QA status for manual rubric evaluation |
| `instascore_conversation_status` | integer | NO | QA status for Instascore (automated) evaluation |
| `instascore_conversations_count` | integer | NO | Number of Instascore evaluations |
| `manual_conversations_count` | integer | NO | Number of manual QA evaluations |
| `ingestion_status` | smallint | NO | Pipeline ingestion status |

**Active conversation filter:** `deleted IS NULL`

### What a Row Represents

Each row is one conversation/interaction in the Level AI platform. For voice calls, a conversation begins when the call connects and ends when it disconnects (or is force-ended). For chat and email, the conversation covers the full thread. The `channel` smallint distinguishes the type. The `user_id` field points to the primary agent; if a call is transferred, the conversation is split and a new asrlog row is created for each agent segment. The `custom_fields` jsonb column carries all CRM-imported metadata that users see as "Interaction Fields" in the Filters panel. QA status fields (`qa_status`, `manual_conversation_status`, `instascore_conversation_status`) track evaluation lifecycle and are used by the QA workflow.

---

### `level_asr_asrtranscriptionlog` — Transcription Segments

**Note:** This table is partitioned by quarter (e.g., `level_asr_asrtranscriptionlog_partitioned_2025_01`). The base table exists but data lives in partitions. Always query the base table name — PostgreSQL routes to the correct partition.

Each row = one transcription segment (a block of speech from one speaker within a conversation).

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK |
| `deleted` | timestamptz | YES | Soft delete |
| `created` | timestamptz | NO | Record creation timestamp |
| `modified` | timestamptz | NO | Last modified |
| `uuid` | uuid | NO | Unique identifier for this transcription segment |
| `text` | text | YES | Transcription text of this segment |
| `asr_event` | smallint | NO | ASR event type (e.g., interim vs final transcription) |
| `pub_sub_log_id` | integer | YES | FK → `level_asr_asrpubsublogs` (ingestion message) |
| `speaker_tags` | jsonb | NO | Speaker identification (agent vs customer, speaker index) |
| `timestamps` | jsonb | NO | Word-level timing data for audio synchronization |
| `asr_log_created` | timestamptz | NO | When the parent asrlog was created |
| `sentiment` | text | YES | Detected sentiment for this segment |
| `polarity` | double precision | YES | Sentiment polarity score (-1 to 1) |
| `ext_created_datetime` | timestamptz | YES | External system creation time |
| `active_user_id` | integer | YES | FK → `accounts_user` (speaker if agent) |
| `external_transcription_log_id` | integer | YES | FK → external transcription source |
| `clean_text` | text | YES | Text after PII/PCI redaction |
| `original_text` | text | YES | Original text before redaction |
| `session_audio_log_id` | integer | YES | FK → `level_asr_sessionaudiolog` |
| `organization_id` | integer | NO | FK → `accounts_organization` |

Linked to `level_asr_asrlog` via the M2M table `level_asr_asrlog_transcription_logs`.

---

### `level_asr_asrlog_transcription_logs` — M2M: Conversation ↔ Transcription

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK |
| `asrlog_id` | integer | NO | FK → `level_asr_asrlog` |
| `asrtranscriptionlog_id` | integer | NO | FK → `level_asr_asrtranscriptionlog` |

---

### `level_asr_audiolog` — Audio File Records

Each row = one audio file associated with a voice conversation.

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK |
| `deleted` | timestamptz | YES | Soft delete |
| `created` | timestamptz | NO | Upload/creation timestamp |
| `modified` | timestamptz | NO | Last modified |
| `file` | varchar | YES | Audio file path or storage URL |
| `duration` | double precision | YES | Audio duration in seconds |
| `organization_id` | integer | NO | FK → `accounts_organization` |
| `file_deleted_timestamp` | timestamptz | YES | When the audio file was deleted from storage |
| `is_file_deleted` | boolean | NO | Whether the audio file has been purged (data retention) |
| `policy_reference_id` | integer | YES | FK → `level_asr_dataretentionpolicy` |

Referenced by `level_asr_asrlog.audio_id`.

---

### `level_asr_asrlogsummary` — AI-Generated Summary Sections

Each row = one section of a Smart Summary for a conversation. A complete Smart Summary has multiple rows (one per section type).

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK |
| `created` | timestamptz | NO | Created |
| `modified` | timestamptz | NO | Modified |
| `summary_section` | smallint | NO | Section type: Primary Reason / Agent Actions / Resolution / Follow-up |
| `summary_text` | text | NO | The summary text for this section |
| `asr_log_id` | integer | NO | FK → `level_asr_asrlog` |
| `asr_log_summary_metadata_id` | integer | NO | FK → `level_asr_asrlogsummarymetadata` |
| `organization_id` | integer | NO | FK → `accounts_organization` |

---

### `level_asr_asrlogsummarymetadata` — Summary Resolution Metadata

Each row = resolution and follow-up metadata for a conversation's Smart Summary.

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK |
| `created` | timestamptz | NO | Created |
| `modified` | timestamptz | NO | Modified |
| `resolution_type` | smallint | YES | Completely Resolved / Partially Resolved / Not Resolved |
| `agent_followup` | smallint | YES | Whether agent follow-up actions exist |
| `customer_followup` | smallint | YES | Whether customer follow-up actions exist |
| `asr_log_id` | integer | NO | FK → `level_asr_asrlog` |
| `organization_id` | integer | NO | FK → `accounts_organization` |

---

### `level_asr_asrlogtocsatmapping` — Conversation → CSAT Score

Each row = one CSAT score linked to a conversation.

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK |
| `created` | timestamptz | NO | Created |
| `modified` | timestamptz | NO | Modified |
| `csat_score` | double precision | YES | Customer Satisfaction score (typically 1-5 or 1-10) |
| `asr_log_id` | integer | NO | FK → `level_asr_asrlog` (unique per conversation) |
| `organization_id` | integer | NO | FK → `accounts_organization` |

---

### `level_asr_asrlogtocasemapping` — Conversation → Support Case

Each row = link between a conversation and an external CRM support case.

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK |
| `created` | timestamptz | NO | Created |
| `modified` | timestamptz | NO | Modified |
| `ext_id` | varchar | YES | External case ID from CRM (Salesforce Case ID, etc.) |
| `preview_link` | varchar | YES | URL to view the case in the CRM |
| `channel` | smallint | NO | Channel type of the case |
| `asr_log_id` | integer | NO | FK → `level_asr_asrlog` |
| `status` | varchar | NO | Case status (open, closed, etc.) |
| `case_number` | varchar | YES | Human-readable case number |
| `organization_id` | integer | NO | FK → `accounts_organization` |

---

### `level_asr_asrlogtoscreenrecordingmapping` — Conversation → Screen Recording

Each row = link between a conversation and a screen recording session.

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK |
| `created` | timestamptz | NO | Created |
| `modified` | timestamptz | NO | Modified |
| `case_recording_id` | varchar | YES | Screen recording case identifier |
| `channel` | smallint | NO | Channel type |
| `integration_type` | smallint | YES | Recording integration provider (AWS/Twilio/Five9, etc.) |
| `agent_id` | uuid | YES | Agent UUID in the recording system |
| `sr_case_id` | varchar | YES | Screen recording case ID |
| `asr_modified` | timestamptz | YES | ASR log modified timestamp at time of mapping |
| `sr_modified` | timestamptz | YES | Screen recording modified timestamp |
| `asr_log_id` | integer | YES | FK → `level_asr_asrlog` |
| `organization_id` | integer | NO | FK → `accounts_organization` |
| `recording_version` | varchar | YES | Recording app version |
| `sr_created` | timestamptz | YES | Screen recording creation timestamp |

---

## Summaries & Custom Fields

### `level_asr_customsummaryfieldconfig` — Custom Summary Field Configuration

Admins configure custom summary fields that extract specific information from conversations using AI prompts.

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK |
| `created` | timestamptz | NO | Created |
| `modified` | timestamptz | NO | Modified |
| `deleted` | timestamptz | YES | Soft delete |
| `customer_defined_name` | varchar | NO | Display name set by the customer admin |
| `internal_name` | varchar | NO | Internal system identifier |
| `field_type` | smallint | NO | Type of custom field |
| `data_type` | smallint | NO | Data type of the output (text, number, etc.) |
| `metadata` | jsonb | NO | Additional field configuration |
| `prompt` | text | NO | AI prompt used to extract the field value from transcripts |
| `is_archived` | boolean | NO | Whether the field config is archived |
| `created_by_id` | integer | NO | FK → `accounts_user` |
| `deleted_by_id` | integer | YES | FK → `accounts_user` (who deleted) |
| `organization_id` | integer | NO | FK → `accounts_organization` |

### `level_asr_customsummaryoutput` — Custom Summary Results

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK |
| `created` | timestamptz | NO | Created |
| `modified` | timestamptz | NO | Modified |
| `deleted` | timestamptz | YES | Soft delete |
| `output` | jsonb | NO | AI-extracted output values for all custom summary fields |
| `asr_log_id` | integer | NO | FK → `level_asr_asrlog` |
| `organization_id` | integer | NO | FK → `accounts_organization` |

---

## Journey Summaries

### `level_asr_journeysummary` — Journey-Level Summary Sections

Same structure as `asrlogsummary` but at the Journey level. Updated dynamically as conversations are added to a Journey.

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK |
| `created` | timestamptz | NO | Created |
| `modified` | timestamptz | NO | Modified |
| `summary_section` | smallint | NO | Section type (same enum as asrlogsummary) |
| `summary_text` | text | NO | Journey-level summary text |
| `journey_id` | integer | NO | FK → Journey record |
| `journey_summary_metadata_id` | integer | NO | FK → `level_asr_journeysummarymetadata` |
| `organization_id` | integer | NO | FK → `accounts_organization` |

---

## Configuration Tables

### `level_asr_organisation` — ASR Organization Config

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK |
| `created` | timestamptz | NO | Created |
| `modified` | timestamptz | NO | Modified |
| `name` | varchar | NO | Organization name within ASR context |
| `organization_id` | integer | NO | FK → `accounts_organization` |

### `level_asr_persona` — Speaker Personas

Personas define speaker roles in a conversation (e.g., "Agent", "Customer", "Bot", "Supervisor").

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK |
| `created` | timestamptz | NO | Created |
| `modified` | timestamptz | NO | Modified |
| `display_name` | varchar | NO | Human-readable persona name (e.g., "Agent", "Customer") |
| `value` | varchar | NO | Internal persona key |
| `organization_id` | integer | NO | FK → `accounts_organization` |

### `level_asr_personaconfiguration` — Persona Settings

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK |
| `created` | timestamptz | NO | Created |
| `modified` | timestamptz | NO | Modified |
| `configuration` | jsonb | NO | Persona identification rules (per integration) |
| `integration_type` | integer | YES | Which telephony/chat integration this applies to |
| `organization_id` | integer | NO | FK → `accounts_organization` |

### `level_asr_dataretentionpolicy` — Data Retention Rules

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK |
| `created` | timestamptz | NO | Created |
| `modified` | timestamptz | NO | Modified |
| `channel` | smallint | NO | Channel this policy applies to |
| `retention_duration` | jsonb | NO | Duration rules (e.g., days/months to retain audio, transcripts) |
| `enabled` | boolean | NO | Whether the policy is active |
| `organization_id` | integer | NO | FK → `accounts_organization` |
| `set_by_id` | integer | NO | FK → `accounts_user` (who configured the policy) |

---

## Supporting Tables

### Audio & Transcription

| Table | Purpose | Key Columns |
|---|---|---|
| `level_asr_sessionaudiolog` | Per-session audio segments (before stitching) | `file`, `duration`, `asr_log_id`, `stitched` |
| `level_asr_asrtranscriptionwordlog` | Word-level transcription (partitioned by quarter) | Granular word timing data |
| `level_asr_asyncaudiotranscriptionlog` | Async transcription processing jobs | Job status tracking |
| `level_asr_asyncaudiosegmentationlog` | Audio segmentation jobs | Segmentation pipeline tracking |

### Modification & Status Tracking

| Table | Purpose | Key Columns |
|---|---|---|
| `level_asr_asrlogmodified` | Tracks when asrlog records were last modified | `asr_log_id`, `modified`, `is_deleted` |
| `level_asr_casestatus` | Case status tracking for CRM-linked conversations | Status history |
| `level_asr_csatsyncstatus` | CSAT synchronization status with external systems | Sync state tracking |

### Summaries & AI

| Table | Purpose | Key Columns |
|---|---|---|
| `level_asr_journeysummarymetadata` | Journey-level resolution and follow-up metadata | `resolution_type`, `journey_id` |

### Integration & Sync Logs

| Table | Purpose | Key Columns |
|---|---|---|
| `level_asr_asrpubsublogs` | Pub/sub message logs for conversation ingestion | Message tracking |
| `level_asr_gmailpubsublogs` | Gmail pub/sub integration logs | Gmail-specific ingestion |
| `level_asr_helpshiftlogs` | Helpshift integration logs | Helpshift ingestion tracking |
| `level_asr_helpshiftsenderuuidlog` | Helpshift sender UUID mapping | Sender identity |
| `level_asr_twiliochannellogs` | Twilio channel logs | Twilio integration |
| `level_asr_twiliosenderuuidlog` | Twilio sender UUID mapping | Sender identity |
| `level_asr_offlineasrpayload` | Offline/batch ASR processing payloads | Batch processing |
| `level_asr_redactionlog` | PII/PCI redaction audit log | What was redacted and when |

### Configuration & Keywords

| Table | Purpose | Key Columns |
|---|---|---|
| `level_asr_keywordboost` | Booster words for ASR accuracy improvement | Custom vocabulary terms |

### Other

| Table | Purpose | Key Columns |
|---|---|---|
| `level_asr_snowflakeagentassistrules` | Snowflake agent assist rules | Rule definitions |
| `level_asr_snowflakeagentassistrules_whitelisted_users` | Whitelisted users for agent assist | User allow-list |
| `level_asr_upsellaccounthistory` | Upsell tracking per account | Account history |

---

## Relationships

```
level_asr_asrlog (the "conversation")
  ├── level_asr_asrlog_transcription_logs (M2M → asrtranscriptionlog)
  │     └── level_asr_asrtranscriptionlog (partitioned by quarter)
  ├── level_asr_audiolog (via audio_id FK — 1:1 for voice calls)
  │     └── level_asr_dataretentionpolicy (via policy_reference_id)
  ├── level_asr_sessionaudiolog (1:many — pre-stitching audio segments)
  ├── level_asr_asrlogsummary (1:many — one row per summary section)
  │     └── level_asr_asrlogsummarymetadata (resolution + follow-up metadata)
  ├── level_asr_customsummaryoutput (1:1 — AI-extracted custom fields)
  ├── level_asr_asrlogtocsatmapping (1:1 — CSAT score)
  ├── level_asr_asrlogtocasemapping (1:1 — CRM case link)
  ├── level_asr_asrlogtoscreenrecordingmapping (1:1 — screen recording)
  ├── level_asr_asrlogmodified (1:1 — modification tracking)
  ├── level_asr_persona (via persona_id FK)
  ├── accounts_user (via user_id FK — primary agent)
  └── journey (via journey_id FK)
        └── level_asr_journeysummary (1:many — journey-level summaries)
              └── level_asr_journeysummarymetadata

level_asr_organisation
  └── accounts_organization (via organization_id)

level_asr_customsummaryfieldconfig (definition)
  └── level_asr_customsummaryoutput (output per conversation)

level_asr_personaconfiguration
  └── Per-integration persona identification rules
```

---

## Key Gotchas

1. **Partitioned tables.** `level_asr_asrtranscriptionlog` and `level_asr_asrtranscriptionwordlog` are range-partitioned by quarter (e.g., `_partitioned_2025_01`). Query the base table name — PostgreSQL routes automatically. Direct partition queries are needed only for targeted performance optimization.

2. **Soft deletes.** `asrlog`, `audiolog`, and `asrtranscriptionlog` use `deleted IS NULL` for active records. Some tables like `asrlogmodified` use `is_deleted` boolean instead. Always filter for active records unless explicitly analyzing deletions.

3. **Two org columns.** `asrlog` has both `organisation_id` (legacy, British spelling) and `organization_id` (canonical). Always use `organization_id`. The legacy column exists for backward compatibility.

4. **Transcript storage is split.** The `text` array on `asrlog` is a denormalized concatenation. The actual per-segment transcription with speaker tags, timestamps, and sentiment lives in `asrtranscriptionlog` (linked via M2M table). For full transcript reconstruction, join through the M2M.

5. **Redacted text.** Both `asrlog` and `asrtranscriptionlog` carry `clean_text` (post-redaction) and `original_text` (pre-redaction, on transcription log only). If redaction is configured, `clean_text` is what the UI displays. Redaction settings are not retroactive — only conversations ingested after configuration are affected.

6. **Summary sections are rows, not columns.** A single conversation's Smart Summary is stored as multiple rows in `asrlogsummary`, one per `summary_section` value (Primary Reason, Agent Actions, Resolution, Follow-up). To get the full summary, query all rows for a given `asr_log_id`.

7. **Persona ≠ Person.** `level_asr_persona` defines speaker role types (Agent, Customer, Bot), not individual people. `persona_id` on asrlog identifies which persona configuration applies to the conversation.

8. **Audio file lifecycle.** `audiolog.is_file_deleted` and `file_deleted_timestamp` track whether the actual audio file has been purged per data retention policy, even though the DB record persists. Check `is_file_deleted` before attempting audio playback.

9. **Channel is a smallint enum.** The `channel` column uses integer codes, not strings. Common values represent Voice, Chat, Email, SMS, and Manual. "Manual" channel indicates a manually-created case (not a customer interaction).

10. **QA status fields.** `asrlog` carries three QA-related status fields: `qa_status` (overall), `manual_conversation_status` (manual rubric), and `instascore_conversation_status` (automated). These are integer enums tracking evaluation lifecycle (pending, in-progress, completed, etc.).

---

## Common Queries

### Count conversations per agent in the last 30 days

```sql
SELECT u.email, COUNT(*) AS conversation_count
FROM {schema}.level_asr_asrlog a
JOIN {schema}.accounts_user u ON u.id = a.user_id
WHERE a.deleted IS NULL
  AND a.created >= NOW() - INTERVAL '30 days'
GROUP BY u.email
ORDER BY conversation_count DESC
```

### Find conversations with CSAT scores

```sql
SELECT a.id AS conversation_id, a.created, c.csat_score, a.channel
FROM {schema}.level_asr_asrlog a
JOIN {schema}.level_asr_asrlogtocsatmapping c ON c.asr_log_id = a.id
WHERE a.deleted IS NULL
  AND c.csat_score IS NOT NULL
ORDER BY a.created DESC
LIMIT 100
```

### Reconstruct full Smart Summary for a conversation

```sql
SELECT s.summary_section, s.summary_text,
       m.resolution_type, m.agent_followup, m.customer_followup
FROM {schema}.level_asr_asrlogsummary s
JOIN {schema}.level_asr_asrlogsummarymetadata m
  ON m.id = s.asr_log_summary_metadata_id
WHERE s.asr_log_id = {conversation_id}
ORDER BY s.summary_section
```

---

## Disambiguation

| User Says | DB Table | Filter / Notes |
|---|---|---|
| "conversation" or "interaction" | `level_asr_asrlog` | `deleted IS NULL` |
| "transcript" | `level_asr_asrtranscriptionlog` | Partitioned by quarter; join via M2M |
| "summary" or "smart summary" | `level_asr_asrlogsummary` | Multiple rows per conversation (one per section) |
| "custom summary field" | `level_asr_customsummaryfieldconfig` (config) / `customsummaryoutput` (values) | `deleted IS NULL` |
| "CSAT" or "customer satisfaction" | `level_asr_asrlogtocsatmapping` | `csat_score IS NOT NULL` |
| "case" or "ticket" (CRM) | `level_asr_asrlogtocasemapping` | Maps to external CRM case |
| "screen recording" | `level_asr_asrlogtoscreenrecordingmapping` | Also check `asrlog.has_screen_recording` |
| "journey" or "customer journey" | `level_asr_asrlog` with `journey_id IS NOT NULL` | Journey summaries in `journeysummary` |
| "audio" or "recording" (call audio) | `level_asr_audiolog` | `is_file_deleted = false` for available audio |
| "agent" (on a conversation) | `level_asr_asrlog.user_id` → `accounts_user` | Primary agent for the conversation |
| "channel" | `level_asr_asrlog.channel` | Smallint enum (Voice/Chat/Email/SMS/Manual) |
| "booster words" | `level_asr_keywordboost` | ASR vocabulary customization |
| "redaction" | `level_asr_redactionlog` | Audit trail; also check `clean_text` columns |
| "data retention" | `level_asr_dataretentionpolicy` | `enabled = true` for active policies |
| "persona" | `level_asr_persona` | Speaker role types, not individual people |
| "manual case" | `level_asr_asrlog` | `channel` = Manual enum value |
