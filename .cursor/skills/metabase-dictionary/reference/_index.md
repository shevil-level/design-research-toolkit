# Metabase Database Index

Master index of all databases available in Metabase. Use this to find which database to query and which domain file documents its tables.

Last updated: 2026-02-19

---

## Production Databases (use these for real data)

### Colossus Family — Multi-Tenant Customer Data

All Colossus databases share the same schema-per-tenant structure. See [colossus-overview.md](colossus-overview.md) for architecture details.

| Database | ID | Engine | Region | Notes |
|---|---|---|---|---|
| Colossus Production 2 | 107 | PostgreSQL 15.3 | US | **Primary** — most US customers |
| Colossus Production | 2 | PostgreSQL | US | Older US customers |
| Colossus Production 3 | 112 | PostgreSQL | US | Overflow / additional |
| Colossus Production Canada | 116 | PostgreSQL | Canada | Canadian customers |
| EU Colossus Production | 108 | PostgreSQL | EU | EU customers |
| AI AQ Colossus Production | 120 | PostgreSQL | US | AI auto-QA specific |

**Domain files for Colossus tables:**

| Domain File | Table Prefix(es) | Table Count | Description | Status |
|---|---|---|---|---|
| [quality-assessment.md](quality-assessment.md) | `quality_assessment_*` | ~71 | QA scorecards, evaluations, disputes, automation, Instascore | VALIDATED |
| [task-assignment.md](task-assignment.md) | `task_assignment_*`, `task_engine_*`, `task_audit` | ~8 | Evaluation tasks (the work items evaluators see), replacements, task state | VALIDATED |
| [agent-coaching.md](agent-coaching.md) | `agent_coaching_*` | ~24 | Coaching rubrics, sessions | VALIDATED |
| [level-asr.md](level-asr.md) | `level_asr_*` | ~85 | Conversations, transcriptions, ASR | EXPLORED |
| [level-nlp.md](level-nlp.md) | `level_nlp_*` | ~62 | NLP: moments, topics, concerns, AI features | EXPLORED |
| [accounts.md](accounts.md) | `accounts_*`, `account_*` | ~34 | Users, teams, organizations, roles, permissions | EXPLORED |
| [qa-calibrations.md](qa-calibrations.md) | `qa_calibrations_*`, `private_calibrations_*` | ~37 | QA and private calibration sessions | EXPLORED |
| [integrations.md](integrations.md) | `integrations_*`, `salesforce_*`, `zendesk_*`, `slack_*`, etc. | ~30+ | External integrations | EXPLORED |

**Other Colossus table groups (not yet in domain files):**

- `instascoring_internal_*` (~23 tables) — Instascoring execution logs (partitioned)
- `rubric_accuracy_*` (~22 tables) — Rubric accuracy testing (RAT)
- `agent_assist_*` (~14 tables) — Real-time agent assist
- `analytics_*` (~10 tables) — Alerts, dashboards, analytics queries
- `notification_delivery_*` (~20 tables) — Notification delivery (partitioned)
- `banking_*` (~10 tables) — Conversation UI metadata
- `journey_*` (~8 tables) — Customer journeys
- `automation_*` (~2 tables) — Workflow automation
- `ai_credits_*` (~3 tables) — AI credit tracking
- Various single-table or small groups: `meeting_*`, `annotation_*`, `business_units_*`, `offline_audio_*`, etc.

---

### Other Production Databases

| Database | ID | Engine | Domain File | Description |
|---|---|---|---|---|
| Nexus Prod | 113 | PostgreSQL | — | Nexus service (separate from Colossus) |
| Eu Nexus Prod | 110 | PostgreSQL | — | EU Nexus |
| Task Scheduler Production | 123 | PostgreSQL | — | Background task scheduling |
| Orchestrator Production | 118 | PostgreSQL | — | Workflow orchestration |
| Studio Production | 109 | PostgreSQL | — | Studio features |
| SFTP Production | 36 | PostgreSQL | — | SFTP file transfer logs |
| aa-analytics | 101 | PostgreSQL | — | Analytics/reporting |
| Marketing Emails CS | 124 | PostgreSQL | — | Marketing email data |

---

### Development / Staging (not for production queries)

| Database | ID | Engine | Notes |
|---|---|---|---|
| Colossus Development | 4 | PostgreSQL | Dev |
| Colossus Development 2 | 104 | PostgreSQL | Dev |
| Colossus Stagex | 33 | PostgreSQL | Staging |
| Colossus Platform | 37 | PostgreSQL | Platform |
| AA-Knowledge-Preprod | 102 | PostgreSQL | Pre-prod |
| AA-Node-BE-StageX | 69 | MongoDB | Staging (only Mongo DB) |
| Nexus Dev | 103 | PostgreSQL | Dev |
| Nexus Staging | 111 | PostgreSQL | Staging |
| Nexus UberLoadTest | 115 | PostgreSQL | Load test |
| Task Scheduler Development | 121 | PostgreSQL | Dev |
| Task Scheduler Staging | 122 | PostgreSQL | Staging |
| Orchestrator Development | 117 | PostgreSQL | Dev |
| Orchestrator Staging | 119 | PostgreSQL | Staging |
| SFTP Staging | 34 | PostgreSQL | Staging |
| Load Test DB | 114 | PostgreSQL | Load testing |
| Sample Database | 1 | H2 | Metabase built-in sample |
