---
name: metabase-dictionary
description: Translation layer between Level AI product concepts and the Colossus database schema. Read before writing any Metabase SQL query to ensure results match what users see in the product UI.
---

# Metabase Dictionary — Level AI

## When to Use

Before writing **any** SQL query against Metabase (especially Colossus Production databases), read the relevant reference files to translate product-level questions into correct database queries.

## Reference Files

### Structure

1. **[Database Index](_index.md)** — Master list of all 30 Metabase databases with IDs and what they contain.
2. **[Colossus Overview](colossus-overview.md)** — Multi-tenant architecture, schema-per-tenant pattern, common column patterns, cross-tenant query pattern.
3. **Domain files** (one per feature area) — see below.
4. **[Query Patterns](query-patterns.md)** — Validated, reusable SQL patterns for common questions.

### Domain Files

| Domain | File | Status | Covers |
|---|---|---|---|
| Quality Assessment | [quality-assessment.md](quality-assessment.md) | EXPLORED | QA scorecards, evaluations, disputes, automation rules, Instascore |
| Task Assignment | [task-assignment.md](task-assignment.md) | EXPLORED | QA case assignment, tasks, replacements |
| Agent Coaching | [agent-coaching.md](agent-coaching.md) | VALIDATED | Coaching rubrics, sessions |
| Conversations (ASR) | [level-asr.md](level-asr.md) | EXPLORED | Conversations, transcriptions, audio, summaries, journeys, CSAT, screen recordings |
| NLP / AI | [level-nlp.md](level-nlp.md) | EXPLORED | Moments, topics, concerns, agent assist, conversation tags, VoC, sentiment, AI scores |
| Accounts | [accounts.md](accounts.md) | EXPLORED | Users, teams, organizations, roles |
| QA Calibrations | [qa-calibrations.md](qa-calibrations.md) | EXPLORED | Calibration sessions, group & evaluator calibrations, responses, analytics, evidence, replacement |
| Integrations | [integrations.md](integrations.md) | EXPLORED | Salesforce, Zendesk, Slack, Talkdesk, SSO, exports, writeback, custom fields |

**Status key:** VALIDATED = confirmed against real data; EXPLORED = columns documented, sample data checked; MAPPED = columns documented; STUB = table list only.

## Workflow

1. User asks a data question (e.g., "how many active scorecards per customer?")
2. **Check the [Database Index](_index.md)** to find which database and domain file applies.
3. **Read the domain file** to find the correct tables, columns, and filters.
4. **Check [Query Patterns](query-patterns.md)** for a validated pattern.
5. For cross-tenant queries, follow the UNION ALL pattern in [Colossus Overview](colossus-overview.md).
6. Sanity-check results: if numbers seem unreasonable, re-examine the mapping.

## Updating the Dictionary

When a query produces surprising results, or when you discover a new mapping:
- Update the relevant domain file with corrected mappings.
- Add validated queries to `query-patterns.md`.
- Change status from STUB → MAPPED → EXPLORED → VALIDATED as knowledge grows.
- Mark sections needing user confirmation as `STATUS: NEEDS PRODUCT INPUT`.

## Key Gotcha

The database schema does NOT map 1:1 to product UI concepts. Tables often contain templates + instances, per-session copies, or per-organization duplicates. Always check what a row actually represents before counting.
