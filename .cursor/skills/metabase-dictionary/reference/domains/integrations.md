# Integrations Domain

**Table prefix:** `integrations_*`, `salesforce_integration_*`, `zendesk_*`, `slack_*`, `talkdesk_*`, `snowflake_integration_*`, `onelogin_*`, `googlesignon_*`, `google_drive_integration_*`, `gurucards_integration_*`
**Colossus table count:** ~30+
**Status:** EXPLORED (columns documented from Affirm schema, product concepts from Help Center)

Last updated: 2026-02-19

---

## Product Concept

Level AI connects to a customer's existing toolchain through its **Integration Hub** — a central management UI (Settings > Integrations) where Admins and Super Admins install, configure, pause, and uninstall third-party connections. Integrations fall into several categories based on their purpose: **conversation ingestion** (telephony/CRM platforms that feed conversations into Level AI), **data export** (pushing Level AI data outward), **writeback** (syncing Level AI outputs back to source systems), **SSO/authentication** (identity providers), and **knowledge base** (external documentation sources for Agent Assist).

**Conversation ingestion** is the largest category, covering 30+ vendor integrations. These pull conversations (voice, chat, email, SMS) into Level AI on an hourly cadence. Some are self-serve through the UI (Salesforce, Zendesk, Five9, Genesys Cloud, Nice InContact, SFTP) while others require an engineering task. The ingestion method varies: some use vendor APIs directly (Salesforce, Zendesk, Talkdesk, Twilio, Zoom), others use SFTP (Five9, Amazon Connect, Genesys On-Prem, Kustomer voice, Ujet), and some use S3-to-GCS sync. Each integration supports specific channels — Salesforce handles Chat/Email/Voice/Messaging Session, Zendesk handles Email/Chat/Call, Talkdesk handles Call, and Slack handles channel-based conversations. Custom fields from external systems can be mapped to Level AI fields via Settings > Custom Fields and displayed as columns/filters in the Interaction History screen.

**Data exports** use Level AI's internal Snowflake data warehouse to push data to external destinations: Snowflake-to-Snowflake (private sharing), Snowflake-to-S3, Snowflake-to-GCS, Snowflake-to-Azure, and Snowflake-to-SFTP. Exports run hourly and cover 50 table schemas (conversations, scores, users, QA, NLP outputs, coaching, calibrations). The export schema (v2.0) is documented separately. **Writeback** pushes Level AI outputs (Summary, Topic, Sub-Topic, Parent Category, Sub-Category) back to CRM systems — currently supported for Salesforce, Zendesk, Gladly, and Solepanel, triggered on-demand from Level AI.

**SSO integrations** allow users to log into Level AI using their existing identity provider. Supported providers include Okta (SAML, SP-initiated), Microsoft Azure AD (OAuth, SP-initiated), Google, OneLogin, Auth0, and JumpCloud. Advanced provisioning is available through Okta SCIM and Azure SCIM for automated user lifecycle management and role assignment. SSO configuration is done under Settings > Single Sign-on (SSO) by Super Admins.

**Knowledge base integrations** connect external documentation sources (Google Drive, Guru, ticketing systems) to Level AI's Knowledge Center for use by Agent Assist. These are configured under Settings > Knowledge Center > Integrations and make external articles, tickets, and documents available to agents during live conversations.

The integration framework in Colossus tracks all of this through a set of core tables: `integrations_integration` stores the connection configuration, `integrations_serviceauth` holds credentials and OAuth tokens, `integrations_pipelinerun` logs each hourly fetch execution, `integrations_integrationfetchaudit` records what was fetched, `integrations_externallog` stores the raw ingested conversation data before it becomes an ASR log, and `integrations_writebacklog` tracks outbound data syncs. Vendor-specific tables (Salesforce, Zendesk, Slack, Talkdesk) store data particular to each integration.

---

## Core Integration Framework

### `integrations_integration` — Integration Configuration

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK, auto-increment |
| `integration` | varchar | NO | Integration identifier/name (e.g., "salesforce", "zendesk", "five9") |
| `cred_values` | jsonb | NO | Encrypted credential values for the integration connection |
| `task_id` | integer | YES | FK to periodic task that runs the data pull |
| `integration_type` | varchar | NO | Type classifier (e.g., "crm", "telephony", "sftp") |
| `organization_id` | integer | NO | FK → `accounts_organization` — which org owns this integration |
| `metadata` | jsonb | YES | Additional metadata (channel configs, filter settings, etc.) |
| `configs` | jsonb | NO | Integration-specific configuration (channels enabled, ingestion params) |
| `is_active` | boolean | NO | Whether the integration is currently active and pulling data |
| `is_ingestion_requested` | boolean | NO | Whether a data ingestion has been requested/queued |
| `linked_account` | smallint | NO | Linked account identifier for multi-account integrations |

#### What a Row Represents

One row = one configured integration connection for an organization. For example, an org might have one Salesforce integration, one Zendesk integration, and one Five9 integration — each would be a separate row. The `configs` JSONB field stores channel-specific settings (which channels to ingest, filters, etc.). An integration can be paused by setting `is_active = false` without deleting the row.

#### Active Integrations Filter

```sql
WHERE is_active = true
```

---

### `integrations_serviceauth` — Service Authentication Credentials

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK, auto-increment |
| `created` | timestamptz | NO | When the auth record was created |
| `modified` | timestamptz | NO | Last modification timestamp |
| `deleted` | timestamptz | YES | Soft delete — NULL = active |
| `service_user` | varchar | NO | Username/client ID for the external service |
| `service_key` | varchar | NO | API key or client secret (encrypted) |
| `service_type` | smallint | YES | Enum for service type (Salesforce, Zendesk, etc.) |
| `last_run_at` | timestamptz | YES | When the auth was last used for a data fetch |
| `failure_reason` | text | YES | Last failure message if auth failed |
| `last_failed_at` | timestamptz | YES | When the auth last failed |
| `total_run_count` | integer | NO | Total number of times this auth has been used |
| `refresh_token` | text | YES | OAuth refresh token for token-based auth |
| `expires_at` | timestamptz | YES | When the current auth token expires |
| `organization_id` | integer | NO | FK → `accounts_organization` |

#### What a Row Represents

One row = one set of authentication credentials for an external service. Stores OAuth tokens, API keys, and tracks auth health (failures, expiry). The `last_failed_at` and `failure_reason` columns are useful for diagnosing integration connection issues.

---

### `integrations_metadataconfig` — Metadata Field Mapping

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK, auto-increment |
| `created` | timestamptz | NO | Created timestamp |
| `modified` | timestamptz | NO | Last modified timestamp |
| `integration_source` | smallint | NO | Enum for which integration this config applies to |
| `config` | jsonb | NO | Mapping configuration (which external fields map to which Level AI fields) |
| `organization_id` | integer | NO | FK → `accounts_organization` |
| `user_id` | integer | NO | FK → `accounts_user` — who created/last modified this config |

#### What a Row Represents

One row = one metadata mapping configuration for an integration source within an org. The `config` JSONB stores the field-to-field mappings that determine which external system fields (e.g., Salesforce Case fields) become visible as custom columns in Level AI's Interaction History. Corresponds to the Settings > Custom Fields UI.

---

### `integrations_integrationprocess` — Processing Status Tracker

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK, auto-increment |
| `integration` | varchar | NO | Integration identifier |
| `uniq_id` | varchar | NO | Unique processing identifier (deduplication key) |
| `organization_id` | integer | NO | FK → `accounts_organization` |

#### What a Row Represents

One row = one processing record tracking a specific integration item. The `uniq_id` serves as a deduplication key to prevent the same conversation from being ingested twice.

---

### `integrations_integrationfetchaudit` — Fetch Audit Trail

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK, auto-increment |
| `created` | timestamptz | NO | When the audit record was created |
| `modified` | timestamptz | NO | Last modified timestamp |
| `fetch_timestamp` | timestamptz | NO | The point-in-time up to which data was fetched |
| `integration_id` | integer | NO | FK → `integrations_integration` |
| `data` | jsonb | NO | Fetch metadata (counts, errors, details) |
| `organization_id` | integer | NO | FK → `accounts_organization` |
| `status` | smallint | YES | Fetch status enum (success, partial, failed) |
| `pipeline_run_id` | integer | YES | FK → `integrations_pipelinerun` — which pipeline run triggered this fetch |

#### What a Row Represents

One row = one fetch operation audit record. Tracks what was fetched, when, and whether it succeeded. The `fetch_timestamp` acts as a watermark — the next fetch will pick up where this one left off. Useful for debugging data gaps.

---

### `integrations_pipelinerun` — Pipeline Execution Log

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK, auto-increment |
| `created` | timestamptz | NO | When the run record was created |
| `start_time` | timestamptz | YES | When pipeline execution started |
| `name` | integer | YES | Pipeline name enum |
| `error` | text | YES | Error message if the run failed |
| `end_time` | timestamptz | YES | When pipeline execution completed |
| `status` | smallint | YES | Run status enum (pending, running, success, failed) |
| `periodic_task_id` | integer | YES | FK to the Celery periodic task |
| `additional_info` | jsonb | NO | Additional run metadata (counts, timings, etc.) |
| `integration_id` | integer | YES | FK → `integrations_integration` |
| `organization_id` | integer | YES | FK → `accounts_organization` |
| `channel` | smallint | YES | Channel enum (voice, chat, email, etc.) |
| `is_recovery_run` | boolean | NO | Whether this was a recovery/backfill run vs. normal hourly |

#### What a Row Represents

One row = one execution of an integration data pipeline. The hourly ingestion cron creates one `pipelinerun` per integration per channel. The `is_recovery_run` flag distinguishes normal hourly pulls from manual backfill/recovery runs. Use `start_time`/`end_time` to measure pipeline duration, and `status` + `error` to diagnose failures.

---

### `integrations_processingbatchreport` — Batch Processing Report

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK, auto-increment |
| `created` | timestamptz | NO | Created timestamp |
| `modified` | timestamptz | NO | Last modified timestamp |
| `data` | jsonb | NO | Batch processing statistics (conversation counts, success/fail counts) |
| `organization_id` | integer | NO | FK → `accounts_organization` |
| `processing_batch_id` | integer | YES | FK to processing batch |

#### What a Row Represents

One row = one batch processing report summarizing the results of processing a batch of ingested conversations. The `data` JSONB contains counts of successfully processed vs. failed conversations.

---

## Data & Custom Fields

### `integrations_customfielddatamap` — Custom Field Mapping

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK, auto-increment |
| `created` | timestamptz | NO | Created timestamp |
| `modified` | timestamptz | NO | Last modified timestamp |
| `name` | varchar | NO | Display name of the custom field (shown in Interaction History) |
| `values` | jsonb | NO | Mapping values — which external field maps to this custom field |
| `integration_type` | varchar | NO | Source integration type (salesforce, zendesk, etc.) |
| `channel` | smallint | NO | Channel enum this field applies to |
| `organization_id` | integer | NO | FK → `accounts_organization` |

#### What a Row Represents

One row = one custom field mapping from an external system into Level AI. Created via Settings > Custom Fields > Add Interaction Field. The `name` becomes the column header in Interaction History, and the `values` JSONB stores the source field path from the external system. These fields can optionally be used as filters.

### Other Custom Field Tables (summary)

| Table | Description |
|---|---|
| `integrations_customfiltermeta` | Filter configuration metadata for custom fields |
| `integrations_multivaluecustomfields` | Custom fields that accept multiple values |
| `integrations_aggregatedcustomcolumn` | Aggregated/computed custom columns |

---

## Sync & Transfer

### `integrations_externallog` — External Conversation Log

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK, auto-increment |
| `created` | timestamptz | NO | When this log entry was created in Level AI |
| `integration_type` | smallint | YES | Source integration type enum |
| `integration_id` | varchar | NO | External system's ID for this conversation/record |
| `data` | jsonb | NO | Raw conversation data from the external system |
| `custom_fields` | jsonb | NO | Custom field values extracted during ingestion |
| `organization_id` | integer | NO | FK → `accounts_organization` |
| `modified` | timestamptz | NO | Last modified timestamp |
| `agent_id` | varchar | YES | External agent identifier |
| `channel` | smallint | YES | Channel enum (voice, chat, email, etc.) |
| `ext_created` | timestamptz | NO | When the conversation was created in the external system |
| `external_session_id` | varchar | YES | External session/case/ticket ID |
| `processing_batch_id` | integer | YES | FK to processing batch |
| `pipeline_run_id` | integer | YES | FK → `integrations_pipelinerun` |

#### What a Row Represents

One row = one conversation record fetched from an external system, before it is fully processed into a Level AI ASR log. This is the staging table — raw data lands here first, then gets processed into `level_asr_asrlog`. The `integration_id` is the external system's own ID for the record (e.g., Salesforce Case ID, Zendesk Ticket ID).

---

### `integrations_externaltranscriptionlog` — External Transcription Import

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK, auto-increment |
| `created` | timestamptz | NO | Created timestamp |
| `integration_id` | varchar | NO | External system's transcription ID |
| `integration_type` | smallint | YES | Source integration type enum |
| `data` | jsonb | NO | Raw transcription data |
| `external_log_id` | integer | NO | FK → `integrations_externallog` — parent conversation |
| `organization_id` | integer | NO | FK → `accounts_organization` |
| `external_request_id` | varchar | YES | External request/job ID for the transcription |

#### What a Row Represents

One row = one transcription record imported from an external system, linked to its parent external log entry. Used when the external system provides its own transcription (e.g., vendor ASR) that Level AI imports alongside the audio.

---

### `integrations_externaluserlog` — External User Sync

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK, auto-increment |
| `created` | timestamptz | NO | Created timestamp |
| `modified` | timestamptz | NO | Last modified timestamp |
| `deleted` | timestamptz | YES | Soft delete |
| `integration_type` | smallint | YES | Source integration type enum |
| `data` | jsonb | NO | External user data (name, email, role, etc.) |
| `user_id` | integer | NO | FK → `accounts_user` — the Level AI user this maps to |

#### What a Row Represents

One row = one mapping between an external system's user and a Level AI user. Populated when integrations sync agent/user data from CRM or telephony platforms into Level AI's user directory.

---

### `integrations_writebacklog` — Writeback to External Systems

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK, auto-increment |
| `created` | timestamptz | NO | Created timestamp |
| `modified` | timestamptz | NO | Last modified timestamp |
| `deleted` | timestamptz | YES | Soft delete |
| `status` | smallint | NO | Writeback status enum (pending, success, failed) |
| `writeback_type` | smallint | YES | Type of writeback (summary, topic, category, etc.) |
| `data` | jsonb | NO | Payload sent to the external system |
| `message` | text | YES | Response/error message from the external system |
| `retry_count` | smallint | NO | Number of retry attempts |
| `asr_log_id` | integer | NO | FK → `level_asr_asrlog` — the conversation being written back |
| `organization_id` | integer | NO | FK → `accounts_organization` |

#### What a Row Represents

One row = one writeback attempt for a specific conversation. Level AI pushes enriched data (Summary, Topic, Sub-Topic, Parent Category, Sub-Category) back to the source CRM system. Currently supported for Salesforce, Zendesk, Gladly, and Solepanel. Triggered on-demand from Level AI, not on a cron. The `status` and `retry_count` columns track delivery reliability.

### Other Sync Tables (summary)

| Table | Description |
|---|---|
| `integrations_meetingesindexlog` | Tracks ES indexing of meeting data |
| `integrations_summarydispatch` | Tracks dispatch of AI summaries to external systems |

---

## Additional Core Tables (summary)

| Table | Description |
|---|---|
| `integrations_historicalintegration` | Integration configuration change history / audit trail |

---

## Vendor-Specific Tables

### Salesforce

#### `salesforce_integration_salesforcecasenote` — Salesforce Case Notes

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK, auto-increment |
| `case_id` | varchar | NO | Salesforce Case ID |
| `note_name` | varchar | NO | Name/title of the case note |
| `note_id` | varchar | NO | Salesforce Note ID |
| `text` | text | YES | Note body text |
| `created_date` | timestamptz | YES | When the note was created in Salesforce |
| `asrlog_id` | integer | NO | FK → `level_asr_asrlog` — linked conversation |
| `created_by_user_id` | integer | NO | FK → `accounts_user` — who created the note |

##### What a Row Represents

One row = one case note from Salesforce linked to a Level AI conversation. Salesforce integration pulls case notes alongside conversations when ingesting Chat, Email, and Voice channels. Data is pulled hourly via Salesforce API. The note is tied to both the Salesforce Case (via `case_id`) and the Level AI conversation (via `asrlog_id`).

#### Other Salesforce Tables (summary)

| Table | Description |
|---|---|
| `salesforce_integration_salesforcecaserawdata` | Raw Salesforce case data before processing |
| `salesforce_integration_salesforceemaillogs` | Email ingestion log from Salesforce |
| `salesforce_integration_salesforceemaillogs_emails_threads` | Email thread linkage (M2M) |
| `salesforce_integration_salesforceemailrawdata` | Raw Salesforce email data |
| `salesforce_integration_salesforceemailsynclog` | Email sync status tracking |
| `salesforce_integration_salesforceemailthreadslog` | Email thread processing logs |
| `salesforce_integration_salesforcefilestatslog` | File/attachment stats from Salesforce |
| `salesforce_integration_salesforceticketsynclog` | Ticket sync status tracking |

---

### Zendesk

#### `zendesk_zendeskticket` — Zendesk Ticket

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK, auto-increment |
| `created` | timestamptz | NO | Created in Level AI |
| `modified` | timestamptz | NO | Last modified in Level AI |
| `ticket_id` | varchar | NO | Zendesk Ticket ID |
| `uuid` | uuid | YES | Level AI UUID for the ticket |
| `subject` | text | NO | Ticket subject line |
| `channel` | smallint | NO | Channel enum — Email (Zendesk Email/Web/API), Chat (Live Chat/Messaging), Call (Voice) |
| `agent` | varchar | YES | Assigned agent identifier |
| `organization_id` | integer | NO | FK → `accounts_organization` |

##### What a Row Represents

One row = one Zendesk ticket imported into Level AI. Zendesk integration is self-serve and supports Email, Chat, and Call channels. Configuration includes tag/group/brand/form filters, comment flow control (Bot/Admin/Private comments), metadata exclusion, and redaction/booster words. Data pulls hourly; historical imports require TAM assistance.

##### Channel Mapping (Zendesk → Level AI)

| Level AI Channel | Zendesk Sources |
|---|---|
| Email | Zendesk Email, Web, API |
| Chat | Live Chat, Messaging |
| Call | Voice Calls |

#### Other Zendesk Tables (summary)

| Table | Description |
|---|---|
| `zendesk_zendeskemail` | Email records from Zendesk |
| `zendesk_zendeskfilestatslog` | File/attachment stats |
| `zendesk_zendeskticketcomment` | Individual ticket comments/messages |
| `zendesk_zendeskticketsynclog` | Ticket sync status tracking |
| `zendesk_zendeskwebhooklog` | Webhook event logs |

---

### Slack

#### `slack_slackauth` — Slack Authentication

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK, auto-increment |
| `created` | timestamptz | NO | Created timestamp |
| `modified` | timestamptz | NO | Last modified timestamp |
| `deleted` | timestamptz | YES | Soft delete |
| `data` | jsonb | NO | OAuth tokens, workspace info, bot tokens |
| `organization_id` | integer | NO | FK → `accounts_organization` |

##### What a Row Represents

One row = one Slack workspace OAuth connection for an organization. The `data` JSONB stores the OAuth access token, bot token, workspace ID, and team info. Slack integration requires channels:history, channels:join, channels:manage, channels:read, chat:write, groups:history, groups:read, mpim:read, users.profile:read, users:read, and users:read.email scopes. After auth, admins select which Slack channels to ingest. Initial load pulls 30 days of history; subsequent syncs are hourly.

#### Other Slack Tables (summary)

| Table | Description |
|---|---|
| `slack_slackchannellogs` | Channel-level ingestion logs |
| `slack_sharedslackchannel` | Shared channel configurations |
| `slack_integration_slackchannels` | Selected Slack channels for ingestion |

---

### Talkdesk

#### `talkdesk_talkdeskevent` — Talkdesk Event

| Column | Type | Nullable | Description |
|---|---|---|---|
| `created` | timestamptz | NO | Created timestamp |
| `modified` | timestamptz | NO | Last modified timestamp |
| `deleted` | timestamptz | YES | Soft delete |
| `id` | integer | NO | PK, auto-increment |
| `app_id` | varchar | NO | Talkdesk App ID for Level AI |
| `installation_id` | varchar | NO | Talkdesk installation ID |
| `data` | jsonb | NO | Event payload data |
| `links` | jsonb | NO | Related resource links from Talkdesk |
| `type` | varchar | YES | Event type (e.g., call completed, recording ready) |
| `external_id` | varchar | YES | Talkdesk's external reference ID |
| `organization_id` | integer | NO | FK → `accounts_organization` |

##### What a Row Represents

One row = one event received from Talkdesk. Level AI has a dedicated app in the Talkdesk AppConnect marketplace. The integration imports call conversations and user data. Events include call lifecycle events, recording availability, and user sync events. The `type` column differentiates event kinds.

#### Other Talkdesk Tables (summary)

| Table | Description |
|---|---|
| `talkdesk_talkdeskinstallation` | Talkdesk app installation configuration |
| `talkdesk_talkdeskuser` | Talkdesk user-to-Level AI user mapping |

---

### Other Vendor Tables

| Table | Vendor | Description |
|---|---|---|
| `snowflake_integration_snowflakemeta` | Snowflake | Data export integration metadata (S3, GCS, Azure, Snowflake destinations) |
| `onelogin_oneloginintegration` | OneLogin | OneLogin SSO configuration |
| `googlesignon_googlesignonintegration` | Google | Google SSO configuration |
| `google_drive_integration_shareddrivefilelog` | Google Drive | File-level logs for Google Drive Knowledge Center integration |
| `google_drive_integration_shareddrivefolderlog` | Google Drive | Folder-level logs for Google Drive Knowledge Center integration |
| `gurucards_integration_gurucardsfilestatslog` | Guru | File stats for Guru knowledge card imports |
| `gurucards_integration_gurucardsynclog` | Guru | Sync status tracking for Guru card ingestion |

---

## Relationships

```
integrations_integration (the connection config)
  ├── integrations_serviceauth (credentials / OAuth tokens)
  ├── integrations_metadataconfig (custom field mapping rules)
  ├── integrations_integrationprocess (processing dedup tracker)
  ├── integrations_pipelinerun (hourly execution logs)
  │     └── integrations_integrationfetchaudit (what was fetched per run)
  ├── integrations_customfielddatamap (custom field definitions)
  └── integrations_processingbatchreport (batch stats)

integrations_externallog (raw ingested conversations)
  ├── integrations_externaltranscriptionlog (vendor transcriptions)
  └── → level_asr_asrlog (processed into conversation records)

integrations_writebacklog → level_asr_asrlog (enriched data pushed back to CRM)

integrations_externaluserlog → accounts_user (external user mapping)
```

### Cross-Domain Links

| This Domain | Links To | Via |
|---|---|---|
| `integrations_externallog` | `level_asr_asrlog` (Conversations) | Processed into ASR logs during ingestion |
| `integrations_writebacklog` | `level_asr_asrlog` (Conversations) | `asr_log_id` FK |
| `integrations_externaluserlog` | `accounts_user` (Accounts) | `user_id` FK |
| `integrations_integration` | `accounts_organization` (Accounts) | `organization_id` FK |
| `salesforce_integration_salesforcecasenote` | `level_asr_asrlog` (Conversations) | `asrlog_id` FK |
| `zendesk_zendeskticket` | `accounts_organization` (Accounts) | `organization_id` FK |

---

## Key Gotchas

1. **Integration type is stored as strings AND enums.** `integrations_integration.integration_type` is a varchar (e.g., "crm") while `integrations_externallog.integration_type` is a smallint enum. Do not assume the same column name means the same encoding across tables.

2. **`externallog` is a staging table, not the final conversation.** Raw data lands in `integrations_externallog` first, then gets processed into `level_asr_asrlog`. To count conversations, query `level_asr_asrlog`, not `externallog`.

3. **JSONB-heavy schema.** Many columns (`configs`, `metadata`, `cred_values`, `data`, `values`) are JSONB. The actual field names and structure vary per integration type. You cannot write a generic SQL query across all integration types without knowing the JSONB structure for each.

4. **`is_active` vs `deleted`.** An integration can be paused (`is_active = false`) without being deleted. Soft-deleted integrations have `deleted IS NOT NULL`. For "current integrations," filter: `is_active = true` on `integrations_integration` (this table lacks a `deleted` column).

5. **Channel enums are shared but not consistent.** The `channel` smallint enum (voice=0, chat=1, email=2, etc.) is used across multiple tables but channel mapping differs per vendor — Zendesk "Email" includes Web and API tickets; Salesforce "Email" is just EmailMessages.

6. **Historical data imports are separate.** Normal hourly pulls use `is_recovery_run = false` in `integrations_pipelinerun`. Backfills/historical loads use `is_recovery_run = true`. Zendesk historical imports are not self-serve and require TAM assistance.

7. **Writeback is on-demand, not cron-based.** Unlike ingestion (hourly), writeback to CRM systems is triggered per-conversation from Level AI. Check `integrations_writebacklog.status` and `retry_count` for delivery tracking.

8. **Multi-account support.** Some integrations (Zendesk) support connecting multiple accounts to a single Level AI instance. Each account gets its own `integrations_integration` row.

---

## Common Queries

### Count active integrations per organization

```sql
SELECT
  o.name AS org_name,
  i.integration,
  i.integration_type,
  i.is_active
FROM {schema}.integrations_integration i
JOIN {schema}.accounts_organization o ON o.id = i.organization_id
WHERE i.is_active = true
ORDER BY o.name, i.integration
```

### Check recent pipeline run health for a specific integration

```sql
SELECT
  pr.id,
  pr.start_time,
  pr.end_time,
  pr.status,
  pr.channel,
  pr.is_recovery_run,
  pr.error
FROM {schema}.integrations_pipelinerun pr
WHERE pr.integration_id = {integration_id}
  AND pr.created > NOW() - INTERVAL '7 days'
ORDER BY pr.created DESC
LIMIT 20
```

### Count writeback success/failure by type

```sql
SELECT
  writeback_type,
  status,
  COUNT(*) AS cnt
FROM {schema}.integrations_writebacklog
WHERE deleted IS NULL
  AND created > NOW() - INTERVAL '30 days'
GROUP BY writeback_type, status
ORDER BY writeback_type, status
```

---

## Disambiguation

| User Says | DB Table | Filter / Notes |
|---|---|---|
| "integration" / "connection" | `integrations_integration` | `is_active = true` for current |
| "integration credentials" / "auth" | `integrations_serviceauth` | `deleted IS NULL` for active |
| "pipeline run" / "data pull" | `integrations_pipelinerun` | `is_recovery_run = false` for normal runs |
| "fetch audit" / "what was fetched" | `integrations_integrationfetchaudit` | — |
| "custom fields" / "external data" | `integrations_customfielddatamap` | Maps to Settings > Custom Fields UI |
| "external log" / "raw conversation" | `integrations_externallog` | Staging data, not final conversations |
| "writeback" / "sync to CRM" | `integrations_writebacklog` | `deleted IS NULL`, check `status` |
| "Salesforce" | `salesforce_integration_*` tables | Integration type = salesforce |
| "Salesforce case notes" | `salesforce_integration_salesforcecasenote` | Linked via `asrlog_id` |
| "Zendesk" / "Zendesk tickets" | `zendesk_zendeskticket` | Channel mapping differs from Zendesk native |
| "Slack" | `slack_slackauth` + `slack_*` tables | Auth + channel selection |
| "Talkdesk" | `talkdesk_talkdeskevent` | Events from Talkdesk AppConnect |
| "SSO" / "Okta" / "Azure AD" | `onelogin_*`, `googlesignon_*` tables | Config only, not user sessions |
| "data export" / "Snowflake export" | `snowflake_integration_snowflakemeta` | Export config, not the exported data itself |
| "Guru" / "knowledge cards" | `gurucards_integration_*` | Knowledge Center integration |
| "Google Drive" | `google_drive_integration_*` | Knowledge Center integration |

---

## Supported Integration Vendors (Product Reference)

### Conversation Ingestion (Import Data Pipelines)

| Vendor | Channels | Frequency | Self-Serve | Method |
|---|---|---|---|---|
| Salesforce | Chat, Email, Voice, Messaging | Hourly | Yes (UI) | Salesforce API |
| SFTP | Chat, Email, SMS, Call | Hourly | Yes (UI) | SFTP |
| Five9 | Voice, Chat, Email, SMS | Hourly | Yes (UI) | SFTP |
| Nice InContact | Call, Chat | Hourly | Yes (UI) | Nice API |
| Zendesk | Chat, Email, Voice | Hourly | Yes (UI) | Zendesk API |
| Genesys Pure Cloud | Voice, Chat, Email, Messaging | Hourly | Yes (UI) | Genesys API |
| Sprinklr | Chat | Hourly | Engineering | Sprinklr API |
| Amazon Connect | Call, Chat | Hourly | Engineering | SFTP |
| Talkdesk | Call | Hourly | Engineering | Talkdesk API |
| Twilio | Call, Chat | Hourly | Engineering | Twilio API |
| Zoom | Phone, Call, SMS | Hourly | Engineering | Zoom API |
| Slack | Slack Channels | Hourly | Engineering | Slack API |
| Intercom | Email, Chat | Hourly | Engineering | — |
| Kustomer | Call, Chat, SMS | Hourly | Engineering | SFTP / Kustomer API |
| Dialpad | Call | Hourly | Engineering | — |
| Freshcaller | Call | Hourly | Engineering | — |
| Freshchat | Chat | Hourly | Engineering | — |
| Freshdesk | Ticketing, Email | Hourly | Engineering | — |
| LiveChat | Chat | Hourly | Engineering | LiveChat API |
| LivePerson | Chat | Hourly | Engineering | LivePerson API |
| Gorgias | Call, Chat, Email | Hourly | Engineering | Gorgias API |
| Gladly | Chat, Email, SMS | Hourly | Engineering | Gladly API |
| Front | Email, SMS, Chat | Hourly | Engineering | Front API |

### Data Exports (Snowflake → External)

| Destination | Frequency | Method |
|---|---|---|
| Snowflake (private sharing) | Hourly | Snowflake share |
| AWS S3 | Hourly | Snowflake external stage |
| GCP Cloud Storage | Hourly | Snowflake external stage |
| Azure Storage | Hourly | Snowflake external stage |
| SFTP | Hourly | Snowflake → Level AI bucket → client bucket |

### Writeback (Level AI → CRM)

| CRM | Fields | Trigger |
|---|---|---|
| Salesforce | Summary, Topic, Sub-Topic, Parent Category, Sub-Category | On-demand from Level AI |
| Zendesk | Summary, Topic, Sub-Topic, Parent Category, Sub-Category | On-demand from Level AI |
| Gladly | Summary, Topic, Sub-Topic, Parent Category, Sub-Category | On-demand from Level AI |
| Solepanel | Summary, Topic, Sub-Topic, Parent Category, Sub-Category | On-demand from Level AI |

### SSO Providers

| Provider | Protocol | Provisioning |
|---|---|---|
| Okta | SAML (SP-initiated) | SSO + SCIM |
| Microsoft Azure AD | OAuth (SP-initiated) | SSO + SCIM |
| Google | OAuth | SSO only |
| OneLogin | SAML | SSO only |
| Auth0 | SAML | SSO only |
| JumpCloud | SAML | SSO only |
