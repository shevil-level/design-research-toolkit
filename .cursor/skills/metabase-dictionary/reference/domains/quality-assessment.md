# Quality Assessment Domain

**Table prefix:** `quality_assessment_*`
**Colossus table count:** ~71 (including historical and partitioned)
**Status:** VALIDATED (product concepts confirmed from Help Center articles)

Last updated: 2026-02-19

---

## Product Concept

Quality Assessment (QA) is the core evaluation workflow in Level AI. Managers and QA auditors evaluate agent conversations against **rubrics** (also called scorecards in the DB — `customform`). There are two types:

- **Manual rubrics** — QA auditors manually answer questions while reviewing the conversation
- **Instascore rubrics** (automated) — AI automatically evaluates conversations. Auditors can still override or add manual questions.

The product UI uses the term **"rubric"** throughout (Settings → Rubric Builder). The database uses `customform`. Questions can be manual, fully automated (Auto-QA Library), or manual questions automated using metric tags or AI guidelines.

**Rubric Assignment Rules** (separate from Case Assignment Rules): conditions on each rubric that determine which rubric applies to a conversation based on custom user fields, interaction fields, channels, and teams. If multiple rubrics match, the most recently created one wins.

The QA workflow:
1. Admin creates a **rubric** (Settings → Rubric Builder) with sections and questions
2. Admin sets **rubric assignment rules** (conditions determining which conversations get this rubric)
3. Admin creates **QA Case Assignment rules** that sample conversations and assign them to evaluators as tasks
4. Evaluators evaluate conversations by answering rubric questions → creates **evidence** records
5. Evaluation auto-saves as **Draft** during progress
6. Evaluator submits → **Acceptance Pending**
7. Agent views evaluation → can **Accept** or **Dispute** per-question
8. Evaluator resolves disputes → final status: Accepted / Rejected / Partially Accepted

**Manual Case Creation**: Admins/QA Auditors/Managers can also manually create cases (non-customer conversations like work items) for evaluation. These have channel = "Manual" and can have rubrics auto-assigned via assignment rules with `Channel = Manual` condition.

---

## QA Scorecards

### `quality_assessment_customform` — Scorecard Definition

Each row = one scorecard that users create and manage in the UI.

| Column | Type | Description |
|---|---|---|
| `id` | integer | PK |
| `title` | varchar | Scorecard name shown in UI |
| `is_active` | boolean | Whether scorecard is currently active |
| `scoring` | varchar | Scoring method (e.g., `percentage`) |
| `type` | varchar | `MANUAL` or `AUTO` (Instascore = AUTO) |
| `is_call` | boolean | Applies to voice interactions |
| `is_chat` | boolean | Applies to chat interactions |
| `is_email` | boolean | Applies to email interactions |
| `is_autofill_score` | boolean | AI auto-fills scores |
| `is_na_score_skip` | boolean | Whether N/A answers skip scoring |
| `outcome_type` | varchar | How outcomes are calculated |
| `max_score` | smallint | Maximum possible score |
| `agent_type` | jsonb | Which agent types this applies to |
| `sample` | jsonb | Sampling configuration |
| `default_options` | jsonb | Default answer options |
| `global_projects_access` | boolean | Accessible across all projects |
| `template_used` | varchar | Template this form was based on |
| `user_id` | integer | FK → `accounts_user` (creator) |
| `updated_by_id` | integer | FK → `accounts_user` (last editor) |
| `organization_id` | integer | FK → `accounts_organization` |
| `created` | timestamptz | Created timestamp |
| `modified` | timestamptz | Modified timestamp |
| `deleted` | timestamptz | Soft delete (NULL = active) |
| `description` | varchar | Description text |

**Active scorecard filter:** `deleted IS NULL AND is_active = true`

### `quality_assessment_customformsection` — Scorecard Section

| Column | Type | Description |
|---|---|---|
| `id` | integer | PK |
| `title` | varchar | Section name |
| `category_id` | integer | FK → `quality_assessment_customformcategory` |
| `organization_id` | integer | FK → `accounts_organization` |
| `order_id` | integer | Display order within scorecard |
| `created` | timestamptz | Created |
| `modified` | timestamptz | Modified |
| `deleted` | timestamptz | Soft delete |

**Note:** Sections belong to a scorecard via `category_id` → `customformcategory`. STATUS: NEEDS PRODUCT INPUT — confirm the category→section→question hierarchy.

### `quality_assessment_customformquestion` — Scorecard Question

| Column | Type | Description |
|---|---|---|
| `id` | integer | PK |
| `title` | text | Question text |
| `description` | text | Help text / description |
| `scoring` | smallint | Score weight |
| `options` | jsonb | Answer options (labels, scores) |
| `section_id` | integer | FK → `customformsection` |
| `order_id` | integer | Display order within section |
| `is_autoscored` | boolean | AI auto-scores this question |
| `is_autoqa_active` | boolean | Auto-QA is active for this question |
| `is_universal` | boolean | Universal question across scorecards |
| `auto_qa_setup_type` | varchar | Type of auto-QA configuration |
| `automated_scoring_id` | integer | FK → `automatedquestiontemplate` |
| `prefill_option_index` | integer | Default answer option index |
| `option_selection_type` | smallint | Single-select vs multi-select |
| `parent_question_id` | integer | FK → self (for nested questions) |
| `question_level` | smallint | Nesting level |
| `organization_id` | integer | FK → `accounts_organization` |
| `created` | timestamptz | Created |
| `modified` | timestamptz | Modified |
| `deleted` | timestamptz | Soft delete |

### `quality_assessment_customformcategory` — Scorecard Category

Groups sections within a scorecard. STATUS: NEEDS PRODUCT INPUT — may correspond to "sections" in the UI while the DB sections are sub-groupings.

### Other Scorecard Tables

| Table | Purpose | Status |
|---|---|---|
| `quality_assessment_customformdraft` | Draft versions of scorecards | MAPPED |
| `quality_assessment_customformquestiondraft` | Draft versions of questions | MAPPED |
| `quality_assessment_customformanswerdraft` | Draft evaluation answers | MAPPED |
| `quality_assessment_customformoutcome` | Score outcome definitions | MAPPED |
| `quality_assessment_customformdatascope` | Data scope/filter for scorecards | MAPPED |
| `quality_assessment_customformthresholds` | Score thresholds (pass/fail levels) | MAPPED |
| `quality_assessment_customformquestionsectiontt` | Question-section join table | MAPPED |
| `quality_assessment_customformautoscoredsuggestions` | AI-suggested scores | MAPPED |
| `quality_assessment_qaversion` | Scorecard version tracking | MAPPED |
| `quality_assessment_questionlibrary` | Reusable question library | MAPPED |

---

## QA Evaluations & Evidence

### `quality_assessment_qaevidence` — Evaluation Response

Each row = one answer to one question for one conversation evaluation.

| Column | Type | Description |
|---|---|---|
| `id` | integer | PK |
| `evidence` | text | Evidence text / notes from evaluator |
| `question_id` | integer | FK → `customformquestion` |
| `rubric_id` | integer | FK → `customform` (the scorecard) |
| `asr_log_id` | integer | FK → `level_asr_asrlog` (conversation) |
| `cfa_id` | integer | FK → custom form answer record |
| `user_id` | integer | FK → `accounts_user` (evaluator) |
| `task_id` | integer | FK → `task_assignment_task` |
| `organization_id` | integer | FK → `accounts_organization` |
| `created` | timestamptz | Created |
| `modified` | timestamptz | Modified |
| `deleted` | timestamptz | Soft delete |

**Note:** `rubric_id` here refers to a `customform.id`, not a coaching rubric. Confusing naming.

### `quality_assessment_qaevidencefeedback` — Evidence Feedback

Feedback on individual evidence items. STATUS: MAPPED (columns not yet documented).

### `quality_assessment_qafeedback` — QA Feedback

| Column | Type | Description |
|---|---|---|
| `id` | integer | PK |
| `feedback_type` | varchar | Type of feedback |
| `value` | integer | Numeric feedback value |
| `comment` | varchar | Text comment |
| `asr_log_id` | integer | FK → `level_asr_asrlog` (conversation) |
| `user_id` | integer | FK → `accounts_user` (who gave feedback) |
| `organization_id` | integer | FK → `accounts_organization` |
| `created` | timestamptz | Created |
| `modified` | timestamptz | Modified |
| `deleted` | timestamptz | Soft delete |

---

## QA Disputes

### `quality_assessment_qadisputetrack` — Dispute Record

Agents (or Managers/Admins) raise per-question disputes when dissatisfied with an evaluation. Evaluators then accept or reject each dispute. If a QA is unavailable, Admins can resolve disputes on their behalf. Managers can re-open disputes even after acceptance.

| Column | Type | Description |
|---|---|---|
| `id` | integer | PK |
| `status` | integer | Dispute resolution: Accepted (evaluator changed answer) / Rejected (original retained) / Partially Accepted (mixed) |
| `option_selected` | varchar | Single option selected in dispute |
| `options_selected` | ARRAY | Multiple options selected |
| `question_id` | integer | FK → `customformquestion` (disputed question) |
| `cf_answer_id` | integer | FK → custom form answer |
| `asr_log_id` | integer | FK → `level_asr_asrlog` (conversation) |
| `user_id` | integer | FK → `accounts_user` (who disputed) |
| `organization_id` | integer | FK → `accounts_organization` |
| `created` | timestamptz | Created |
| `modified` | timestamptz | Modified |
| `deleted` | timestamptz | Soft delete |

### `quality_assessment_qadisputecomment` — Dispute Comments

Comments on disputes. STATUS: MAPPED (columns not yet documented).

### `quality_assessment_qadisputedraft` — Dispute Drafts

Draft disputes before submission. STATUS: MAPPED (columns not yet documented).

---

## QA Automation Rules ( QA Case Assignment Config)

These tables define HOW conversations get assigned for QA review. See also [task-assignment.md](task-assignment.md) for the complete task lifecycle, QA statuses, dispute workflow, replacement, and permission matrix.

In the UI: Settings → QA Case Assignment → New Rule. Each rule contains sections for Name/Type, Assignment Method, Schedule, Agents, Evaluators, Conditions, Goals, Evaluator Workload, and a real-time Summary.

### `quality_assessment_qaautomationrule` — Case Assignment Rule

Each row = one case assignment rule configured by an Admin. The rule defines what conversations to sample, who evaluates them, on what schedule, and with what goals.

| Column | Type | Description |
|---|---|---|
| `id` | integer | PK |
| `name` | varchar | Rule name |
| `active` | boolean | Whether rule is active |
| `assignment_type` | varchar | Rule type: "Agent Evaluation" or "Evaluator Calibration" |
| `assignment_method` | varchar | "Assign to specific evaluators" or "Place in a shared queue" |
| `data_from` | varchar | Data source type |
| `data_pull_range` | integer | "Sample conversations from" — how far back to pull (e.g., last 7 days) |
| `data_pull_from_start` | timestamptz | Fixed start date for data pull |
| `data_pull_from_end` | timestamptz | Fixed end date for data pull |
| `due_days` | integer | "Set due date" — days until evaluation is due (24/7/30 for daily/weekly/monthly, or custom) |
| `one_off` | boolean | Run once (if true) vs recurring per schedule |
| `start_time` | timestamptz | Rule start time |
| `end_time` | timestamptz | Rule end time |
| `timezone` | varchar | Timezone for scheduling |
| `clocked_schedule` | timestamptz | Specific scheduled time |
| `max_run_count` | integer | "After a set number of occurrences" — end condition |
| `total_run_count` | integer | Total times rule has actually run so far |
| `next_run_at` | timestamptz | Next scheduled execution |
| `last_run_at` | timestamptz | Last execution time |
| `agent_group` | jsonb | Section (D) Agents: dynamic selection filter conditions (team name, manager, user status, etc.) |
| `agent_sample` | jsonb | Manually selected agents list (when not using dynamic selection) |
| `teams` | jsonb | Team filter for agent selection |
| `evaluator_sample` | jsonb | Section (E) Evaluators: selected evaluators or dynamic selection config |
| `auditor_sample` | jsonb | Auditor sampling/distribution configuration |
| `moderator_sample` | jsonb | Moderator sampling (for evaluator calibration type rules) |
| `goals` | jsonb | Section (G) Goals: N conversations or X% of eligible, per agent or collectively, per day/week/month. Also "this rule" vs "any rule" stop condition. |
| `assignee_workload_limit` | jsonb | Section (H) Evaluator Workload: distribute evenly or custom limits per evaluator (Limit mode reduces one evaluator's share, remainder auto-distributed to others) |
| `allow_cross_team_assignment` | boolean | Whether evaluators can receive conversations from agents outside their team |
| `sample_id` | integer | FK → `interactionsamplemeta` |
| `cron_schedule_id` | integer | FK → `qaautomationcronschedule` |
| `beat_task_id` | integer | FK → Celery beat task |
| `created_by_id` | integer | FK → `accounts_user` (creator) |
| `organization_id` | integer | FK → `accounts_organization` |
| `created` | timestamptz | Created |
| `modified` | timestamptz | Modified |
| `deleted` | timestamptz | Soft delete |

**Active rule filter:** `active = true AND deleted IS NULL`

### `quality_assessment_qaautomationcronschedule` — Cron Schedule

| Column | Type | Description |
|---|---|---|
| `id` | integer | PK |
| `minute` | varchar | Cron minute field |
| `hour` | varchar | Cron hour field |
| `day_of_week` | varchar | Cron day-of-week field |
| `day_of_month` | varchar | Cron day-of-month field |
| `month_of_year` | varchar | Cron month field |
| `timezone` | varchar | Timezone |
| `organization_id` | integer | FK → `accounts_organization` |
| `created` | timestamptz | Created |
| `modified` | timestamptz | Modified |

### `quality_assessment_qaautomationrule_agents` — M2M: Rule → Agents

| Column | Type | Description |
|---|---|---|
| `id` | integer | PK |
| `qaautomationrule_id` | integer | FK → `qaautomationrule` |
| `user_id` | integer | FK → `accounts_user` (agent) |

### `quality_assessment_qaautomationrule_auditors` — M2M: Rule → Auditors

| Column | Type | Description |
|---|---|---|
| `id` | integer | PK |
| `qaautomationrule_id` | integer | FK → `qaautomationrule` |
| `user_id` | integer | FK → `accounts_user` (auditor) |

### `quality_assessment_qaautomationrule_moderators` — M2M: Rule → Moderators

| Column | Type | Description |
|---|---|---|
| `id` | integer | PK |
| `qaautomationrule_id` | integer | FK → `qaautomationrule` |
| `user_id` | integer | FK → `accounts_user` (moderator) |

### `quality_assessment_qaautomationruleexecutionaudit` — Rule Execution Log

| Column | Type | Description |
|---|---|---|
| `id` | integer | PK |
| `status` | varchar | Execution status (success/failure) |
| `error_message` | text | Error details if failed |
| `users_to_evaluate` | jsonb | Agents selected for evaluation |
| `assignees` | jsonb | Auditors assigned |
| `filter_conversation_map` | jsonb | Conversation selection results |
| `users_goals_map` | jsonb | Goal tracking per user |
| `users_without_assignee` | jsonb | Agents without available auditor |
| `extra_data` | jsonb | Additional execution metadata |
| `rule_id` | integer | FK → `qaautomationrule` |
| `organization_id` | integer | FK → `accounts_organization` |
| `created` | timestamptz | Created |
| `modified` | timestamptz | Modified |

### `quality_assessment_interactionsamplemeta` — Sampling Config

| Column | Type | Description |
|---|---|---|
| `id` | integer | PK |
| `filters_meta` | jsonb | Conversation filter/sampling criteria |
| `organization_id` | integer | FK → `accounts_organization` |

---

## Instascore / Auto-QA

### `quality_assessment_autoqaconfiguration` — Auto-QA Setup

Configuration for AI auto-scoring. STATUS: MAPPED (columns not yet documented).

### `quality_assessment_automatedquestiontemplate` — Auto-Score Templates

Pre-built AI scoring templates for common question types. STATUS: MAPPED (columns not yet documented).

### `quality_assessment_deletedautoqaevidence` — Deleted Auto-QA Evidence

Deleted auto-QA evidence records. STATUS: MAPPED.

### `quality_assessment_instascoringstatuslog` — Instascoring Status

Tracks Instascore execution status per conversation. STATUS: MAPPED (columns not yet documented).

### `quality_assessment_instareviewtags` — InstaReview Tags

Tags used in InstaReview feature. STATUS: MAPPED.

### `quality_assessment_instareviewthresholds` — InstaReview Thresholds

Score thresholds for InstaReview. STATUS: MAPPED.

---

## Library & Folders

### `quality_assessment_libraryfolder` — QA Library Folders

Folders for organizing QA content. STATUS: MAPPED.

### `quality_assessment_libraryitem` — QA Library Items

Items within library folders. STATUS: MAPPED.

### `quality_assessment_foldershareemailnotification` — Folder Share Notifications

Email notifications for shared folders. STATUS: MAPPED.

---

## Evaluation Tracking

### `quality_assessment_evaluationauditlog` — Evaluation Audit

Audit trail for evaluation actions. STATUS: MAPPED.

### `quality_assessment_evaluationduration` — Evaluation Duration

How long each evaluation took. STATUS: MAPPED.

### `quality_assessment_evaluationdurationeventtracking` — Duration Events

Granular event tracking during evaluations. STATUS: MAPPED.

---

## Relationships

```
customform (scorecard)
  ├── customformcategory
  │     └── customformsection
  │           └── customformquestion
  │                 ├── qaevidence (per conversation evaluation)
  │                 ├── qadisputetrack (disputes)
  │                 └── automatedquestiontemplate (auto-scoring)
  ├── customformthresholds
  ├── customformoutcome
  └── customformdatascope

qaautomationrule (assignment rule)
  ├── qaautomationcronschedule (schedule)
  ├── qaautomationrule_agents (M2M → accounts_user)
  ├── qaautomationrule_auditors (M2M → accounts_user)
  ├── qaautomationrule_moderators (M2M → accounts_user)
  ├── qaautomationruleexecutionaudit (run log)
  ├── interactionsamplemeta (filters)
  └── → task_assignment_task (output)
```

---

## Disambiguation

| User Says | DB Table | Filter |
|---|---|---|
| "rubric" or "scorecard" (QA context) | `quality_assessment_customform` | `deleted IS NULL` |
| "manual rubric" | `quality_assessment_customform` | `deleted IS NULL AND type = 'MANUAL'` |
| "Instascore rubric" or "automated rubric" | `quality_assessment_customform` | `deleted IS NULL AND type = 'AUTO'` |
| "active rubric" | `quality_assessment_customform` | `deleted IS NULL AND is_active = true` |
| "rubric assignment rule" (which rubric applies to which conversation) | Stored within `customform` config | Conditions on custom fields, channels, teams |
| "QA question" | `quality_assessment_customformquestion` | `deleted IS NULL` |
| "Auto-QA question" or "automated question" | `quality_assessment_customformquestion` | `is_autoscored = true OR is_autoqa_active = true` |
| "evaluation" or "QA score" | `quality_assessment_qaevidence` | `deleted IS NULL` |
| "dispute" | `quality_assessment_qadisputetrack` | `deleted IS NULL` |
| "case assignment rule" or "automation rule" | `quality_assessment_qaautomationrule` | `active = true AND deleted IS NULL` |
| "manual case" | `level_asr_asrlog` | Channel = Manual (created via Manual Case Creation) |
| "InstaReview" | `quality_assessment_instareviewtags` / `instareviewthresholds` | Auto-flagged conversations for review |
