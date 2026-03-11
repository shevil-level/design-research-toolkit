---
name: gong-research
description: Deep research across Gong call transcripts to find customer conversations about a specific topic, problem, or feature. Use when asked to research what customers are saying on calls, find customer pain points in Gong, do a Gong deep dive, analyze call transcripts for a feature or problem, or investigate customer conversations. Covers search, theme extraction, account-specific analysis, confidence scoring, and synthesis into a factual report with verbatims.
---

# Gong Research

Research Gong call transcripts to find what customers said about a specific topic. Produces a factual report with call links, per-call summaries, untruncated verbatims, and timestamps.

## Invocation

The user asks to research customer conversations in Gong — about a product feature, customer pain point, competitive topic, or any subject that would appear in call transcripts.

## Phase 1: Context Gathering

Before planning subagents, understand what you're researching.

### Step 1 — Read project context

If the user references a project, feature, or problem statement, read all related files first. Extract:

- The specific problem or feature being investigated
- What counts as relevant (the pain points, failure modes, user needs)
- What does NOT count (generic setup talk, training, tangential mentions)
- Key terminology customers might use
- Named accounts of interest

### Step 2 — Build the search query set

Derive search queries from the project context. Organize into tiers:

- **Tier 1 — Core terms:** The most direct keywords (3–5 queries). Always run these.
- **Tier 2 — Pain-point terms:** Words customers use to describe the problem's symptoms (5–8 queries).
- **Tier 3 — Visibility/discovery terms:** Less common, more specific phrases that would be strong signals if found (3–5 queries).

Present the query set to the user for approval before proceeding.

### Step 3 — Build the relevance filter

Define what counts as relevant and what does not. Write this out explicitly:

**Relevant (include):** List the specific pain points, failure modes, or requests that qualify.

**Not relevant (exclude):** List the types of discussion that should be filtered out (training, setup, demos, tangential mentions).

Present the filter to the user for approval.

## Phase 2: Subagent Planning

Ask the user how to structure the subagents. Present a proposed plan and let them adjust.

### What to ask

Use the AskQuestion tool to confirm:

1. **Date range:** How far back to search? (Default: 6 months)
2. **Time-period subagents:** How many periods to split the date range into? (Default: 3 equal periods, one subagent each)
3. **Account-specific subagents:** Are there specific accounts to dedicate a subagent to? (e.g., "Wealthsimple" — the subagent lists all calls for that account and searches within them)
4. **Theme extraction subagent:** Should a theme extraction subagent run in parallel? (Default: yes)
5. **Anything else:** Any additional subagent types the user wants (e.g., a subagent focused on a specific competitor mention, a specific team, or a specific call type)

### Subagent types

**Time-period search subagent:** Covers one date window. Runs all Tier 1–3 queries using `gong_search_transcripts` with maxCalls=100. Scores every verbatim. Returns qualifying verbatims.

**Account-focus subagent:** Uses `gong_list_calls` to find all calls with the account name in the title across the full date range. Then searches within those calls for relevant discussion. Retrieves full transcripts for high-signal calls.

**Theme extraction subagent:** Uses `gong_extract_themes` across the full date range with 3–4 topic strings derived from the research question. Scores every returned chunk.

### Subagent limits

Maximum 4 subagents in parallel (tool constraint). If more are needed, run in batches.

## Phase 3: Confidence Scoring

Every subagent applies a 1–5 confidence score to each verbatim before returning it.

### Default rubric

Customize this rubric based on the specific research topic. The structure stays the same; the examples and criteria change per project.

| Score | Criteria |
|-------|----------|
| **5 — Direct hit** | Speaker explicitly describes the problem, requests the feature, or narrates a failure that the feature would solve |
| **4 — Strong signal** | Speaker describes manual workarounds, operational pain from the problem, escalation to support, or coverage/quality gaps caused by the problem |
| **3 — Moderate signal** | Speaker discusses symptoms that imply the problem without naming it directly |
| **2 — Weak** | Ambiguous — could be about this problem or about something else (e.g., generic config) |
| **1 — Not relevant** | Generic setup, training, onboarding, demos, or tangential use of the same keywords |

### Inclusion threshold

- **Score 4–5:** Always include
- **Score 3:** Include only if the same call also contains a score 4 or 5 verbatim
- **Score 1–2:** Exclude entirely

Each subagent returns the score and a 1–2 sentence rationale for every included verbatim.

## Phase 4: Subagent Execution

### Subagent prompt template

Each subagent receives:

1. The research question and problem context
2. The full query set (Tier 1–3)
3. Its specific date range or account filter
4. The confidence scoring rubric (customized for this research)
5. The inclusion threshold
6. Instructions to return: `callId, callTitle, callDate, speaker, timestamp, verbatim (full, untruncated), query, confidenceScore, scoreRationale`
7. Instructions to return an excluded summary (count of calls excluded, most common exclusion reason)

### Execution

Spawn all subagents in parallel (up to 4 at a time). Wait for all to complete before synthesis.

## Phase 5: Synthesis

After all subagents return:

1. **Re-validate scores** — Spot-check a sample of verbatims across subagents for scoring consistency. Adjust any that were scored too generously.
2. **Drop below-threshold** — Remove any verbatim that doesn't meet the inclusion threshold after re-validation.
3. **Deduplicate** — Same callId + same verbatim from multiple subagents = one entry.
4. **Build call index** — Table of all qualifying calls with Gong links (`https://app.gong.io/call?id={callId}`).
5. **Write per-call summaries** — 1–2 sentences per call stating what was discussed about the research topic. Use the `writing-clearly-and-concisely` skill for summaries only.
6. **Preserve verbatims** — Untruncated, with speaker, timestamp, and confidence score.
7. **No opinions** — The report states what was said, by whom, when. No recommendations, no editorial.

## Phase 6: Report

Write the report to `docs/reports/YYYY-MM-DD-[topic-slug]-gong-research.md`.

### Report structure

```
# [Topic] — Gong Research Report

## Scope
- Date range, queries used, subagent structure, match counts
- Confidence scoring method summary

## Call Index
| # | Call ID | Title | Date | Gong Link | Peak Score | Summary |

## Verbatims by Call
### Call 1 — [Title]
(grouped verbatims with speaker, timestamp, score)

## [Account Name] Section (if account-specific subagent ran)
- Full call list for that account
- Qualifying verbatims
- Narrative arc across qualifying calls

## Theme Summary
- Themes stated as facts, with per-theme call count
- Representative callIds per theme

## Excluded Summary
- Count of calls searched but excluded
- Most common exclusion reason
```

### Report rules

- Verbatims are never truncated or paraphrased
- Summaries use active voice, concrete language, no puffery
- Confidence scores appear next to every verbatim
- Gong links use the format `https://app.gong.io/call?id={callId}`
- If an account-specific subagent ran, that account gets its own section with the full call list (qualifying and non-qualifying) and a narrative arc
- Theme summaries state what was said, not what it means for the product

## Skills Used

- `writing-clearly-and-concisely` — applied to summary sections only (verbatims stay untouched)
- Gong MCP tools: `gong_search_transcripts`, `gong_list_calls`, `gong_get_transcript`, `gong_extract_themes`
