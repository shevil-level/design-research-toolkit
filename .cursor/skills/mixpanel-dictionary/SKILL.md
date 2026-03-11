---
name: mixpanel-dictionary
description: Translation layer between Level AI product concepts and Mixpanel event tracking. Read before calling any Mixpanel MCP tool to ensure queries use the correct event names, properties, and parameters.
---

# Mixpanel Dictionary — Level AI

## When to Use

Before calling **any** Mixpanel MCP tool (`Run-Segmentation-Query`, `Run-Funnels-Query`, `Run-Retention-Query`, `Run-Frequency-Query`, `Run-Report-Query`, etc.), read the relevant reference files to translate product-level questions into correct Mixpanel queries.

## Reference Files

| File | Purpose |
|---|---|
| [projects.md](./reference/projects.md) | Project IDs, workspaces — which `project_id` to use |
| [events.md](./reference/events.md) | Master event catalog grouped by product domain — find the right event name |
| [properties.md](./reference/properties.md) | Event and user properties, filter/group expression syntax |
| [query-recipes.md](./reference/query-recipes.md) | Validated MCP tool call examples per query type |

## Workflow

1. User asks a product analytics question (e.g., "how many users evaluated conversations last week?")
2. Check **[events.md](./reference/events.md)** to find the correct event name(s) for the question.
3. Check **[properties.md](./reference/properties.md)** for available filters (`where`) and groupings (`on`).
4. Check **[query-recipes.md](./reference/query-recipes.md)** for the right MCP tool and parameter pattern.
5. Call the MCP tool with `project_id` (default: `2995973`), event(s), date range, and filters.

## Key Gotcha

Event names in Mixpanel do NOT always match Level AI UI feature names. For example:
- "Rubric" in the UI = `Rubric Edited`, `Rubric add new question` in Mixpanel (not "Scorecard")
- Conversation review events use the `Convo` prefix (e.g., `Convo Submit Evaluation`, `Convo Play Recording Audio`)
- Agent Assist real-time events use ALL_CAPS naming (e.g., `KNOWLEDGE_CARD_PUSHED`, `CHAT_WITH_KB_RESPONSE`)
- Analytics events use the `AN` prefix (e.g., `AN Run Query Clicks`, `AN Chart Expanded View`)

Always look up the exact event name in events.md before querying.

## Updating the Dictionary

When a query produces unexpected results, or when new events are tracked:
- Update **events.md** with new or corrected event entries.
- Add validated queries to **query-recipes.md**.
- Re-extract raw data using the scripts in `scripts/extract-mixpanel-*.py`.
