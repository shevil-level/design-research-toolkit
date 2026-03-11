# Level NLP Domain (AI & NLP Features)

**Table prefix:** `level_nlp_*`
**Colossus table count:** ~62 (including historical)
**Status:** EXPLORED (columns documented from Colossus schema, product concepts from Help Center)

Last updated: 2026-02-19

---

## Product Concept

The Level NLP domain powers all AI and natural language processing features in Level AI. These capabilities analyze 100% of customer conversations across voice, chat, email, and SMS channels — far beyond the small sample traditional QA covers.

**Moments** are real-time detections of key events within a conversation. The NLP engine identifies patterns like compliance phrases, empathy expressions, hold time, escalation triggers, and business-specific behaviors. Each detected moment records both agent and customer context, linking back to the specific transcript segment where it occurred. Moments feed into QA scorecards (as evidence for Auto-QA questions) and are visible in the conversation review UI.

**Conversation Tags** (v2.0) are AI-powered tags that identify customer behaviors, agent behaviors, or agent responses to customer behaviors. Tags use two detection techniques: **intent match** (semantic understanding of the "why" behind words, using NLP to categorize diverse phrasings under a single intent) and **exact match** (literal string matching for specific keywords, product names, or error codes). Tags can be configured with example phrases, exclusion phrases, and must-have words. Each tag can be labeled as "Followed," "Not Followed," or "Just Trigger." Tags support an Advanced AI model for complex utterances and integrate with Agent Assist (hints/flags) and QA tagging. In the database, conversation tags are stored across two table families: `metrictagrule` (the older metric-tag system) and `scriptingrule` (the modern v2.0 system where `rule_json` holds the full tag configuration including phrases, exclusions, and settings).

**Topics & Categories** provide automatic categorization of conversations. Level AI auto-discovers categories based on topics discussed; manual category creation has been discontinued. Categories form a hierarchy with `parent_id` self-referencing for nesting. The `intenttopics` table links individual conversations to their detected category, enabling analytics grouping by conversation topic.

**Concern Mining (Voice of the Customer / VoC 2.0)** discovers customer pain points by analyzing what customers say across all channels. VoC uses a four-level taxonomy: **Head Topics** (broad buckets like Account, Payments, Returns — up to ~20), **Subtopics** (finer categories under each head topic — up to ~100), **Concern Themes** (pattern groups of similar concerns that refresh weekly), and **Customer Concerns** (interaction-level AI summaries of the exact issue). The VoC module surfaces Top Themes (highest volume), Emerging Themes (new concerns), and Themes Affecting iCSAT (lowest satisfaction). Data eligibility requires minimum utterance thresholds: calls/chats need >4 customer utterances and >5 total; emails need >1 customer utterance with >40 characters.

**Agent Assist & Manager Assist** provide real-time guidance during live conversations. Agent Assist (Copilot) includes: **AgentGPT** (conversational search across the knowledge base for instant answers), **Suggested Queries** (AI-generated query suggestions based on real-time conversation analysis), **Knowledge Cards** (auto-surfaced articles relevant to the current moment), **Tips** (proactive reminders of what to say/know now), **Flags** (red flags when agents miss required actions within a time window), and **Auto-Summary** (automatic conversation summaries for CRM). Manager Assist provides real-time tags, live sentiment, live summaries, and coaching triggers. Agent Assist rules in the DB define conditions (customer trigger phrases), actions (expected agent behavior), expectations, and time restrictions.

**AI Scores** are generated for every conversation with customer utterances. **Sentiment Score** (1–10, base 6.0 = neutral) uses NLP with differential emotion weighting and time sensitivity — anger has the highest negative weight; later-in-call emotions carry more significance. **Customer Effort Score (CES)** (base 5) measures interaction friction using factors like agent empathy, customer repetition, escalation, hold usage, response time, and follow-up need. **Resolution Score** (1–5) categorizes outcomes as Not Resolved (1), Partially Resolved (3), or Completely Resolved (5). **iCSAT** is a weighted composite of Sentiment, CES, and Resolution on a 0–10 scale. All scores are marked NA when no customer utterances exist. Sentiment tags in the DB define the emotion taxonomy (admiration, happiness, gratitude, anger, annoyance, disapproval, disappointment, worry) with category and description.

**Analytics** ties all NLP data together. The Analytics module lets users create charts using conversation tags, sentiment scores, topics, VoC data, and metric tags as measures, filters, and group-by dimensions. Out-of-the-box dashboards and custom dashboards expose these NLP signals to executives, managers, and agents.

---

## Moments

### `level_nlp_moment` — Detected Moment

Each row = one moment detected by the NLP engine in a conversation. Moments represent specific events or behaviors (e.g., compliance phrase spoken, empathy detected, hold initiated, escalation triggered).

**Note:** This is a partitioned table. Query the tenant schema (not `chime`) to see columns.

| Column | Type | Description |
|---|---|---|
| `id` | integer | PK |
| `moment_type` | varchar | Type of moment detected (e.g., empathy, compliance, hold, escalation) |
| `asr_transcription_log_id` | integer | FK → `level_asr_asrtranscriptionlog` (specific transcript segment where moment occurred) |
| `transcript_action_log_id` | integer | FK → `level_nlp_transcriptactionlog` (action log entry, if applicable) |
| `agent_context` | text | Transcript text from agent side at the moment |
| `customer_context` | text | Transcript text from customer side at the moment |
| `organization_id` | integer | FK → `accounts_organization` |
| `created` | timestamptz | When moment was detected |
| `modified` | timestamptz | Last modified |

### What a Row Represents

Each row = one detected moment in a conversation. A single conversation can produce many moments (one per detected event). Moments are created asynchronously after NLP processing completes.

---

## Topics & Categories

### `level_nlp_category` — Topic Category Definition

Each row = one auto-discovered or historically-created topic category. Categories form a hierarchy via `parent_id`.

| Column | Type | Description |
|---|---|---|
| `id` | integer | PK |
| `title` | varchar | Category name (e.g., "Billing", "Returns", "Technical Support") |
| `category_type` | varchar | Type of category |
| `phrases` | ARRAY | Associated phrases for this category |
| `example_terms` | ARRAY | Example terms used to define/train the category |
| `count` | integer | Number of conversations in this category |
| `level` | integer | Hierarchy depth (0 = top-level) |
| `parent_id` | integer | FK → self (parent category for nesting) |
| `nlp_id` | integer | FK → NLP model reference |
| `category_trained` | boolean | Whether NLP model has been trained on this category |
| `title_auto_generated` | boolean | Whether title was AI-generated (true) vs manually set |
| `is_enabled` | boolean | Whether category is active |
| `merged_categories` | ARRAY | IDs of categories that were merged into this one |
| `organization_id` | integer | FK → `accounts_organization` |
| `created` | timestamptz | Created |
| `modified` | timestamptz | Modified |
| `deleted` | timestamptz | Soft delete (NULL = active) |

**Active category filter:** `deleted IS NULL AND is_enabled = true`

**Note:** Manual category creation has been discontinued; all categories are now auto-discovered. The `title_auto_generated` flag distinguishes legacy manually-created categories from AI-generated ones.

### `level_nlp_intenttopics` — Conversation → Category Link

Each row = one conversation tagged with a specific category/topic.

| Column | Type | Description |
|---|---|---|
| `id` | integer | PK |
| `topics` | varchar | Topic text/label detected in the conversation |
| `asr_log_id` | integer | FK → `level_asr_asrlog` (the conversation) |
| `category_id` | integer | FK → `level_nlp_category` (the matched category) |
| `organization_id` | integer | FK → `accounts_organization` |
| `created` | timestamptz | Created |
| `modified` | timestamptz | Modified |
| `deleted` | timestamptz | Soft delete |

### What a Row Represents

Each row links a conversation (`asr_log_id`) to a detected topic category (`category_id`). A conversation can have multiple topic assignments.

---

## Concern Mining (Voice of the Customer)

VoC uses a four-level taxonomy: Head Topic → Subtopic → Concern Theme → Concern (per-conversation).

### `level_nlp_concernminingheadtopic` — Head Topic

Each row = one broad topic bucket (e.g., "Account", "Payments", "Returns"). Typically up to ~20 per organization.

| Column | Type | Description |
|---|---|---|
| `id` | integer | PK |
| `name` | varchar | AI-generated head topic name |
| `customer_defined_name` | varchar | Customer-facing override name (may equal `name` if not customized) |
| `topic_type` | varchar | Type classification |
| `merged_head_topic_id` | integer | FK → self (points to the surviving topic when this one was merged) |
| `organization_id` | integer | FK → `accounts_organization` |
| `created` | timestamptz | Created |
| `modified` | timestamptz | Modified |
| `deleted` | timestamptz | Soft delete |

**Active filter:** `deleted IS NULL AND merged_head_topic_id IS NULL` (exclude merged/deleted topics)

### `level_nlp_concernminingsubtopic` — Subtopic

Each row = one finer-grained topic under a head topic (e.g., under "Account": "Login Issues", "Verification", "Profile Updates"). Typically up to ~100 per organization.

| Column | Type | Description |
|---|---|---|
| `id` | integer | PK |
| `name` | varchar | AI-generated subtopic name |
| `customer_defined_name` | varchar | Customer-facing override name |
| `topic_type` | varchar | Type classification |
| `merged_sub_topic_id` | integer | FK → self (points to the surviving subtopic when merged) |
| `organization_id` | integer | FK → `accounts_organization` |
| `created` | timestamptz | Created |
| `modified` | timestamptz | Modified |
| `deleted` | timestamptz | Soft delete |

**Active filter:** `deleted IS NULL AND merged_sub_topic_id IS NULL`

**Note:** The head topic → subtopic relationship is via `concernminingoutput`, not a direct FK on the subtopic table itself. Subtopics can belong to multiple head topics through output records.

### `level_nlp_concernminingoutput` — Concern per Conversation

Each row = one AI-generated concern summary for a specific conversation, classified into the VoC taxonomy.

| Column | Type | Description |
|---|---|---|
| `id` | integer | PK |
| `concern` | text | AI-generated summary of the customer's concern in this conversation |
| `asr_log_id` | integer | FK → `level_asr_asrlog` (the conversation) |
| `head_topic_id` | integer | FK → `level_nlp_concernminingheadtopic` |
| `sub_topic_id` | integer | FK → `level_nlp_concernminingsubtopic` |
| `theme_id` | integer | FK → `level_nlp_concerntheme` (weekly concern theme grouping) |
| `organization_id` | integer | FK → `accounts_organization` |
| `created` | timestamptz | Created |
| `modified` | timestamptz | Modified |
| `deleted` | timestamptz | Soft delete |

### `level_nlp_concerntheme` — Concern Theme

Each row = one pattern group of similar customer concerns. Themes refresh on a weekly window to reflect evolving trends.

| Column | Type | Description |
|---|---|---|
| `id` | integer | PK |
| `theme` | varchar | Theme label (e.g., "Slow refund processing", "App login failures") |
| `sub_topic_id` | integer | FK → `level_nlp_concernminingsubtopic` (parent subtopic) |
| `organization_id` | integer | FK → `accounts_organization` |
| `created` | timestamptz | Created |
| `modified` | timestamptz | Modified |
| `deleted` | timestamptz | Soft delete |

### `level_nlp_concernthemeoutput` — Theme → Conversation Link

Each row = one conversation's association with concern themes at different time granularities.

| Column | Type | Description |
|---|---|---|
| `id` | integer | PK |
| `asr_log_id` | integer | FK → `level_asr_asrlog` (the conversation) |
| `week_theme_id` | integer | FK → `level_nlp_concerntheme` (weekly theme) |
| `month_theme_id` | integer | FK → `level_nlp_concerntheme` (monthly theme) |
| `quarter_theme_id` | integer | FK → `level_nlp_concerntheme` (quarterly theme) |
| `organization_id` | integer | FK → `accounts_organization` |
| `created` | timestamptz | Created |
| `modified` | timestamptz | Modified |
| `deleted` | timestamptz | Soft delete |

---

## Agent Assist

### `level_nlp_agentassistrule` — Agent Assist Rule (Conversation Tag v1 / Scripting)

Each row = one agent assist rule defining a behavior to detect and/or prompt. In the product UI, these correspond to Tips, Flags, and Knowledge Card triggers. Rules can be tagged for QA.

| Column | Type | Description |
|---|---|---|
| `id` | integer | PK |
| `title` | text | Rule name (shown as hint text to agents if agent_assist_enabled) |
| `description` | text | Detailed description of the rule |
| `link` | varchar | URL to related knowledge article |
| `time_restriction` | integer | Time window (seconds) in which the expected behavior must occur; 0 = anytime |
| `is_active` | boolean | Whether the rule is currently active |
| `is_hidden` | boolean | Whether the rule is hidden from the UI listing |
| `agent_assist_enabled` | boolean | Whether this rule surfaces hints/flags to agents in real-time |
| `is_tagged_for_qa` | boolean | Whether moments from this rule are tagged for QA review |
| `rule_audit_id` | integer | FK → `level_nlp_ruleaudit` (verification/audit trail) |
| `workspace_id` | integer | FK → workspace (multi-workspace support) |
| `organization_id` | integer | FK → `accounts_organization` |
| `created` | timestamptz | Created |
| `modified` | timestamptz | Modified |
| `deleted` | timestamptz | Soft delete |

**Active rule filter:** `deleted IS NULL AND is_active = true`

### `level_nlp_agentassistruleaction` — Rule Action (Expected Agent Behavior)

Each row = one expected agent action within a rule. Defines what the agent should say or do, and when.

| Column | Type | Description |
|---|---|---|
| `id` | integer | PK |
| `category` | varchar | Action type (e.g., "say", "intend" for intent-based matching) |
| `value` | text | The expected phrase or intent description |
| `after` | integer | Time delay (seconds) after trigger before this action is expected |
| `rule_id` | integer | FK → `level_nlp_agentassistrule` |
| `organization_id` | integer | FK → `accounts_organization` |
| `created` | timestamptz | Created |
| `modified` | timestamptz | Modified |
| `deleted` | timestamptz | Soft delete |

### `level_nlp_agentassistrulecondition` — Rule Condition (Customer Trigger)

Each row = one trigger condition that activates the rule (typically a customer behavior/phrase).

| Column | Type | Description |
|---|---|---|
| `id` | integer | PK |
| `category` | varchar | Condition type (e.g., "say", "intend") |
| `value` | text | The trigger phrase or intent description |
| `negate_subrule` | boolean | If true, this condition is negated (rule fires when this does NOT match) |
| `rule_id` | integer | FK → `level_nlp_agentassistrule` |
| `organization_id` | integer | FK → `accounts_organization` |
| `created` | timestamptz | Created |
| `modified` | timestamptz | Modified |
| `deleted` | timestamptz | Soft delete |

### `level_nlp_agentassistruleexpectation` — Rule Expectation

Each row = one expected behavior/outcome for the rule. Similar to conditions but represents what the agent is expected to achieve.

| Column | Type | Description |
|---|---|---|
| `id` | integer | PK |
| `category` | varchar | Expectation type (e.g., "say", "intend") |
| `value` | text | The expected phrase or intent |
| `negate_subrule` | boolean | If true, expectation is negated |
| `rule_id` | integer | FK → `level_nlp_agentassistrule` |
| `organization_id` | integer | FK → `accounts_organization` |
| `created` | timestamptz | Created |
| `modified` | timestamptz | Modified |
| `deleted` | timestamptz | Soft delete |

### `level_nlp_agentgptquery` — AgentGPT Search Query

Each row = one query submitted by an agent to AgentGPT during a live conversation.

| Column | Type | Description |
|---|---|---|
| `id` | integer | PK |
| `text` | text | The query text submitted by the agent |
| `user_id` | integer | FK → `accounts_user` (the agent) |
| `created` | timestamptz | When the query was submitted |
| `modified` | timestamptz | Modified |

---

## Conversation Tags (v2.0)

### `level_nlp_scriptingrule` — Conversation Tag (Modern)

Each row = one conversation tag definition (v2.0). This is the modern system where tag configuration (customer/agent behavior phrases, exclusions, must-have words, intent/exact match settings, channels, and tag logic) is stored in `rule_json`.

| Column | Type | Description |
|---|---|---|
| `id` | integer | PK |
| `rule_json` | jsonb | Full tag configuration: behavior type, example phrases, exclusion phrases, must-have words, intent/exact match settings, tag label (followed/not followed/just trigger), channel filters, AI model selection (standard/advanced) |
| `rule_type` | varchar | Tag behavior type (e.g., "customer_behavior", "agent_behavior", "agent_response_on_customer_behavior") |
| `rule_audit_id` | integer | FK → `level_nlp_ruleaudit` (verification audit) |
| `workspace_id` | integer | FK → workspace |
| `alert_enabled` | boolean | Whether alerts fire for this tag |
| `rubric_applicable` | boolean | Whether this tag can be used in rubric assignment rules |
| `is_llm_tag` | boolean | Whether this tag uses the Advanced (LLM) AI model |
| `organization_id` | integer | FK → `accounts_organization` |
| `created` | timestamptz | Created |
| `modified` | timestamptz | Modified |
| `deleted` | timestamptz | Soft delete |

**Active tag filter:** `deleted IS NULL`

### `level_nlp_metrictagrule` — Metric Tag Rule (Legacy Conversation Tag)

Each row = one metric tag rule. This is the older tag system; newer tags use `scriptingrule`.

| Column | Type | Description |
|---|---|---|
| `id` | integer | PK |
| `title` | text | Tag name |
| `description` | text | Tag description |
| `is_active` | boolean | Whether tag is active |
| `is_active_description` | text | Description of activation status |
| `channel` | smallint | Channel filter (encoded as integer) |
| `card_message` | text | Agent Assist card message to show when tag triggers |
| `tag_audit_id` | integer | FK → audit trail for verification |
| `metric_template_id` | integer | FK → `level_nlp_metrictemplate` (pre-built template, if based on one) |
| `workspace_id` | integer | FK → workspace |
| `organization_id` | integer | FK → `accounts_organization` |
| `created` | timestamptz | Created |
| `modified` | timestamptz | Modified |
| `deleted` | timestamptz | Soft delete |

**Active filter:** `deleted IS NULL AND is_active = true`

### `level_nlp_metrictagrulecondition` — Metric Tag Condition

Each row = one condition within a metric tag rule. Conditions define the metric thresholds that trigger the tag.

| Column | Type | Description |
|---|---|---|
| `id` | integer | PK |
| `metric_name` | varchar | Name of the metric to evaluate (e.g., "sentiment_score", "hold_time") |
| `metric_description` | text | Human-readable description of the metric |
| `threshold` | double precision | Numeric threshold value |
| `operator` | varchar | Comparison operator (e.g., ">=", "<=", "==") |
| `unit` | varchar | Unit of measurement |
| `threshold_options` | ARRAY | Predefined threshold options |
| `channel` | smallint | Channel-specific override |
| `rule_id` | integer | FK → `level_nlp_metrictagrule` |
| `organization_id` | integer | FK → `accounts_organization` |
| `created` | timestamptz | Created |
| `modified` | timestamptz | Modified |
| `deleted` | timestamptz | Soft delete |

---

## Sentiment & Scoring

### `level_nlp_sentimenttag` — Sentiment Emotion Definition

Each row = one sentiment emotion definition in the taxonomy. These define the emotion types the AI model detects.

| Column | Type | Description |
|---|---|---|
| `id` | integer | PK |
| `title` | varchar | Display name (e.g., "Strongly Negative", "Mildly Positive") |
| `category` | varchar | Emotion category: "positive" or "negative" |
| `emotion` | varchar | Specific emotion (e.g., "anger", "annoyance", "disapproval", "disappointment", "worry", "happiness", "admiration", "gratitude") |
| `emotion_description` | text | Detailed description of this emotion in customer context |
| `is_active` | boolean | Whether this tag is active |
| `organization_id` | integer | FK → `accounts_organization` |
| `created` | timestamptz | Created |
| `modified` | timestamptz | Modified |
| `deleted` | timestamptz | Soft delete |

**Note:** Sentiment scores themselves (iCSAT, CES, Resolution, Sentiment) are stored on the conversation record in `level_asr_asrlog`, not in this table. This table only defines the emotion taxonomy used for tagging.

### `level_nlp_vocalertmeasure` — VoC Alert Rule

Each row = one alert rule for VoC data. Triggers notifications when concern volumes or patterns exceed thresholds.

| Column | Type | Description |
|---|---|---|
| `id` | integer | PK |
| `name` | varchar | Alert name |
| `description` | varchar | Alert description |
| `frequency` | smallint | How often to check (encoded as integer) |
| `channels` | ARRAY | Which channels to monitor |
| `priority` | smallint | Alert priority level |
| `status` | smallint | Alert status (active/inactive/etc.) |
| `alert_source` | varchar | Source of the alert trigger |
| `rule_config` | jsonb | Full alert rule configuration (thresholds, conditions) |
| `activation_time_period_config` | jsonb | Time window configuration for activation |
| `sub_topic_ids` | ARRAY | FK refs → `concernminingsubtopic` IDs to monitor |
| `conversation_tags` | ARRAY | Conversation tag IDs to include |
| `user_roles` | ARRAY | User roles that receive the alert |
| `user_ids` | ARRAY | Specific user IDs that receive the alert |
| `organization_id` | integer | FK → `accounts_organization` |
| `created` | timestamptz | Created |
| `modified` | timestamptz | Modified |
| `deleted` | timestamptz | Soft delete |

---

## Supporting Tables

### Moment Feedback & Bookmarks

| Table | Purpose | Status |
|---|---|---|
| `level_nlp_momentfeedback` | User feedback on moment detection accuracy | MAPPED |
| `level_nlp_conversationmomentaifeedback` | AI model feedback on detected moments | MAPPED |
| `level_nlp_conversationmomentbookmarks` | Bookmarked moments for later review | MAPPED |
| `level_nlp_conversationmomentfeedback` | General user feedback on conversation moments | MAPPED |

### Topics & Categories (Extended)

| Table | Purpose | Status |
|---|---|---|
| `level_nlp_journeycategory` | Journey-level categories (multi-conversation) | MAPPED |
| `level_nlp_journeyintenttopics` | Journey-level intent topic assignments | MAPPED |
| `level_nlp_transcriptkeywords` | Extracted keywords from transcripts | MAPPED |
| `level_nlp_transcripttopics` | Extracted topics from transcripts | MAPPED |

### Concern Mining (Extended)

| Table | Purpose | Status |
|---|---|---|
| `level_nlp_concernresolution` | Resolution tracking for concerns | MAPPED |
| `level_nlp_concernaifeedback` | AI model feedback on concern detection | MAPPED |
| `level_nlp_concernminingaimodelimprovement` | Model improvement tracking for concerns | MAPPED |
| `level_nlp_journeyconcernminingoutput` | Journey-level concern mining results | MAPPED |
| `level_nlp_journeyconcernaifeedback` | Journey-level concern AI feedback | MAPPED |
| `level_nlp_journeyconcernminingaimodelimprovement` | Journey concern model improvement | MAPPED |

### Agent Assist (Extended)

| Table | Purpose | Status |
|---|---|---|
| `level_nlp_agentassistcard` | Knowledge cards shown to agents during conversations | MAPPED |
| `level_nlp_agentassistfaq` | FAQ cards for common questions | MAPPED |
| `level_nlp_agentassistintent` | Intent detection records for assist triggers | MAPPED |
| `level_nlp_assistcardfeedback` | Agent feedback on assist card relevance | MAPPED |
| `level_nlp_suggestedsolution` | AI-suggested solutions for agents | MAPPED |

### Metrics & Scoring (Extended)

| Table | Purpose | Status |
|---|---|---|
| `level_nlp_metrictemplate` | Pre-built metric tag templates | MAPPED |
| `level_nlp_vocalertmeasurerunlog` | VoC alert execution history | MAPPED |
| `level_nlp_aimetricscontributorsoutput` | AI metrics contributor analysis output | MAPPED |
| `level_nlp_channelthresholdconfig` | Per-channel threshold configuration | MAPPED |
| `level_nlp_channelunitconfig` | Per-channel unit configuration | MAPPED |

### Scripting & Business Rules (Extended)

| Table | Purpose | Status |
|---|---|---|
| `level_nlp_businesskeyword` | Business-specific keywords for detection | MAPPED |
| `level_nlp_checklistphrases` | Checklist phrases for compliance checks | MAPPED |
| `level_nlp_ruleaudit` | Audit trail for rule verification (draft → verified → trained) | MAPPED |

### Content & Coverage

| Table | Purpose | Status |
|---|---|---|
| `level_nlp_article` | Knowledge base articles used by Agent Assist | MAPPED |
| `level_nlp_bookmarks` | User bookmarks on conversations or moments | MAPPED |
| `level_nlp_coverage` | NLP processing coverage tracking | MAPPED |

### Logs & Infrastructure

| Table | Purpose | Status |
|---|---|---|
| `level_nlp_nlpservicelogs` | NLP service execution logs | MAPPED |
| `level_nlp_nlptraininfo` | NLP model training information | MAPPED |
| `level_nlp_debuglog` | Debug logs for NLP processing | MAPPED |
| `level_nlp_historicalrunlog` | Historical NLP run tracking | MAPPED |
| `level_nlp_historicalreplaylog` | Historical replay tracking (re-processing) | MAPPED |
| `level_nlp_rerunerrortracelog` | Rerun error tracking | MAPPED |
| `level_nlp_categoryhistoricalrunlog` | Category processing run history | MAPPED |
| `level_nlp_concernhistoricalrunlog` | Concern mining run history | MAPPED |
| `level_nlp_concernthemehistoricalrunlog` | Concern theme processing run history | MAPPED |

### Feedback & Corrections

| Table | Purpose | Status |
|---|---|---|
| `level_nlp_resolutionfeedback` | Feedback on resolution score accuracy | MAPPED |
| `level_nlp_asrphrasecorrectionmetadata` | ASR phrase correction metadata | MAPPED |
| `level_nlp_asrtranscriptionlogaifeedback` | AI feedback on transcription quality | MAPPED |
| `level_nlp_transcriptactionlog` | Transcript-level action log | MAPPED |
| `level_nlp_transcriptactionlogfeedback` | Feedback on transcript action log entries | MAPPED |

---

## Relationships

```
Conversation Tags (v2.0):
  scriptingrule (modern tag definition)
    └── rule_json contains full config (phrases, exclusions, settings)
    └── ruleaudit (verification: draft → verified → trained)

Conversation Tags (legacy):
  metrictagrule (metric tag definition)
    └── metrictagrulecondition (threshold conditions)
    └── metrictemplate (pre-built template)

Agent Assist:
  agentassistrule (rule definition)
    ├── agentassistrulecondition (customer trigger)
    ├── agentassistruleaction (expected agent behavior)
    ├── agentassistruleexpectation (expected outcome)
    └── ruleaudit (verification)
  agentassistcard (surfaced knowledge cards)
  agentassistfaq (FAQ cards)
  agentgptquery (agent search queries)

VoC / Concern Mining:
  concernminingheadtopic (broad bucket)
    └── [via concernminingoutput.head_topic_id]
  concernminingsubtopic (finer category)
    └── concerntheme (pattern group, weekly refresh)
        └── concernthemeoutput (conversation → theme at week/month/quarter)
  concernminingoutput (per-conversation concern)
    ├── → head_topic_id
    ├── → sub_topic_id
    ├── → theme_id
    └── → asr_log_id (conversation)

Topics:
  category (topic definition, hierarchical via parent_id)
    └── intenttopics (conversation → category link)
        └── → asr_log_id (conversation)

Moments:
  moment → asr_transcription_log_id (transcript segment)
  moment → transcript_action_log_id (action log)

Sentiment:
  sentimenttag (emotion taxonomy definition)
  [Actual scores stored on level_asr_asrlog, not here]
```

---

## Key Gotchas

1. **Partitioned tables:** `level_nlp_moment` is partitioned. When querying across tenants, you must UNION ALL from each tenant schema; the `chime` schema does not contain these tables.

2. **Moment detection is async:** Moments are created after NLP processing completes, not during the live conversation. There can be a delay between conversation end and moment availability.

3. **Two tag systems coexist:** `scriptingrule` (modern v2.0, `rule_json` contains everything) and `metrictagrule` + `metrictagrulecondition` (legacy). New tags are created as `scriptingrule` records; older tags may still exist as `metrictagrule` records.

4. **Conversation tag verification flow:** New tags and edits remain in "draft" status until an admin verifies them. Only verified tags can be trained. Only trained tags are active. Track this via `ruleaudit`.

5. **VoC data eligibility thresholds:** Not all conversations appear in VoC. Calls/chats need >4 customer utterances and >5 total utterances. Emails need >1 customer utterance with >40 characters total.

6. **Concern theme refresh cadence:** Themes refresh on a weekly window. `concernthemeoutput` tracks which theme a conversation belongs to at weekly, monthly, and quarterly granularity.

7. **Head topic / subtopic merging:** Both tables have `merged_*_id` columns. When topics are merged, the merged record points to the surviving topic. Always filter on `merged_head_topic_id IS NULL` (or `merged_sub_topic_id IS NULL`) to get active topics.

8. **Sentiment scores are NOT in this domain:** iCSAT, Sentiment Score, CES, and Resolution Score values live on the conversation record in `level_asr_asrlog`. The `sentimenttag` table here only defines the emotion taxonomy.

9. **Historical run/replay tables:** Multiple `*historicalrunlog` and `*replaylog` tables track NLP reprocessing. These are infrastructure tables, not user-facing data.

10. **`rule_json` in scriptingrule:** The modern conversation tag stores ALL configuration in a single JSONB column. To query tag properties (e.g., "find all tags with intent match on customer behavior"), you must parse this JSON.

---

## Common Queries

### Count active conversation tags by type (v2.0)

```sql
SELECT
  rule_type,
  COUNT(*) AS tag_count
FROM {schema}.level_nlp_scriptingrule
WHERE deleted IS NULL
GROUP BY rule_type
```

### Get top VoC head topics by conversation volume

```sql
SELECT
  ht.name,
  ht.customer_defined_name,
  COUNT(co.id) AS concern_count
FROM {schema}.level_nlp_concernminingoutput co
JOIN {schema}.level_nlp_concernminingheadtopic ht
  ON co.head_topic_id = ht.id
WHERE co.deleted IS NULL
  AND ht.deleted IS NULL
  AND ht.merged_head_topic_id IS NULL
GROUP BY ht.name, ht.customer_defined_name
ORDER BY concern_count DESC
```

### List agent assist rules with their trigger conditions

```sql
SELECT
  r.title AS rule_name,
  r.time_restriction,
  r.agent_assist_enabled,
  c.category AS trigger_type,
  c.value AS trigger_phrase
FROM {schema}.level_nlp_agentassistrule r
JOIN {schema}.level_nlp_agentassistrulecondition c
  ON r.id = c.rule_id
WHERE r.deleted IS NULL
  AND r.is_active = true
  AND c.deleted IS NULL
ORDER BY r.title
```

---

## Disambiguation

| User Says | DB Table | Filter / Notes |
|---|---|---|
| "moment" | `level_nlp_moment` | Partitioned; query tenant schema |
| "topic" or "category" | `level_nlp_category` | `deleted IS NULL AND is_enabled = true` |
| "conversation tag" (v2) | `level_nlp_scriptingrule` | Modern system; config in `rule_json` |
| "conversation tag" (legacy) or "metric tag" | `level_nlp_metrictagrule` | Older system; `deleted IS NULL AND is_active = true` |
| "concern" or "VoC concern" | `level_nlp_concernminingoutput` | `deleted IS NULL` |
| "head topic" or "VoC topic" | `level_nlp_concernminingheadtopic` | `deleted IS NULL AND merged_head_topic_id IS NULL` |
| "subtopic" | `level_nlp_concernminingsubtopic` | `deleted IS NULL AND merged_sub_topic_id IS NULL` |
| "concern theme" | `level_nlp_concerntheme` | `deleted IS NULL` |
| "agent assist rule" | `level_nlp_agentassistrule` | `deleted IS NULL AND is_active = true` |
| "AgentGPT query" | `level_nlp_agentgptquery` | — |
| "sentiment" or "emotion" | `level_nlp_sentimenttag` | Defines emotion taxonomy; scores on `level_asr_asrlog` |
| "iCSAT" or "sentiment score" | `level_asr_asrlog` | Scores stored on conversation, not in NLP tables |
| "VoC alert" | `level_nlp_vocalertmeasure` | `deleted IS NULL` |
| "scripting rule" or "compliance check" | `level_nlp_scriptingrule` | `rule_type` distinguishes tag types |
