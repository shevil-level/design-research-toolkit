# Task Assignment Domain (Evaluation Tasks)

**Table prefix:** `task_assignment_*`, `task_engine_*`, `task_audit`
**Colossus table count:** ~8
**Status:** VALIDATED (product concepts confirmed from Help Center articles)
**Source:** Help Center articles: Evaluations Page, How to Evaluate a Conversation, How to Replace Conversations, Bulk Actions, Tracking Duration of Evaluations, How to Review/Accept Evaluations

Last updated: 2026-02-19

---

## Product Concept

A **task** (also called an "evaluation" in the UI) is a work item that represents one conversation assigned to one evaluator for quality review. Tasks are the output of QA Case Assignment rules (see [quality-assessment.md](quality-assessment.md) for rule configuration). Each task connects a conversation, an evaluator, and a rubric (scorecard).

### Where Evaluators See Tasks

Tasks appear in the **Evaluations page** (left nav → Evaluations), also called the **Task screen**. Evaluators can also find them via:
- **Homepage → Reminders widget** — alerts for pending evaluations, in-progress drafts, and disputed evaluations
- **Interaction History** — filter by QA Statuses (Evaluation Pending, Draft, etc.)

The Evaluations page provides: direct task delegation, priority management, status dashboard, overdue escalations, shared queue self-assignment, customizable notifications, and task filtering by agent name, call duration, evaluation status, etc.

### Evaluation Process (Evaluator's Perspective)

1. Evaluator opens a conversation from the Evaluations page by clicking the **Conversation ID**
2. The **Conversation Review screen** loads with the rubric (sections + questions)
3. For Instascore rubrics: auto-scored answers compute in background; evaluator can score manual questions right away
4. Evaluator answers each question using dropdowns, adds per-question feedback/comments and overall comments
5. **Auto-save**: Level AI saves progress every few seconds (indicated by a save icon). If the evaluator exits, the evaluation is saved as **Draft**
6. Evaluator clicks **Submit** → evaluation is registered, QA score is generated, status becomes **Acceptance Pending**

### Evaluation Timer

Level AI tracks how long each evaluation takes:
- **Starts** when any user with evaluation rights clicks the conversation ID
- **Pauses** on network disconnect or when the Conversation Review screen is closed
- **Resumes** when connectivity is restored and the conversation is reopened
- **Stops** when the evaluator clicks Submit
- If two evaluators evaluate the same conversation, the duration of whoever submits first is recorded
- Duration is visible in Interaction History (Evaluation Duration column) and the Conversation Review screen

### Agent's Perspective (Reviewing Evaluations)

1. Agent sees a task in their **Homepage → Evaluations panel** after the QA submits
2. Agent opens the conversation and sees: scores per section, overall score, rubric name, evaluator comments
3. Status shows **Acceptance Pending**
4. Agent can **Accept** (satisfied) or **Dispute** specific questions (dissatisfied)
5. Comments can be added per-question for clarification

### Replacement

Evaluators (or moderators for calibrations) can **replace a conversation** that isn't suitable for evaluation. Common reasons: agent was unavailable, training insufficient, conversation incomplete, technical issues, assigned incorrectly.

How it works:
1. Evaluator opens conversation → clicks ⋮ → **Replace conversation**
2. Must select a reason from a configured list (mandatory)
3. Level AI finds a new conversation handled by the **same agent**, within the **same time period** as the original rule's settings **at the time the conversation was first selected** (not the current rule settings if modified since)
4. If no match found, evaluator is notified
5. Replacement can happen multiple times (A → B → C)
6. Replaced conversations no longer appear in task lists but remain accessible in Analytics for reporting

### Bulk Actions (Admins Only)

Admins/Super Admins can perform bulk operations on the Evaluations page:
- **Re-assign evaluations** to a different evaluator (due date and rule name preserved)
- **Change due dates** in bulk
- **Delete evaluations** in bulk (with warning for completed evaluations that contain data)

### QA Statuses (Evaluation Lifecycle)

| Status | Meaning |
|---|---|
| **Evaluation Pending** | Conversation assigned but not yet opened by evaluator |
| **Draft** | Evaluator started answering but hasn't submitted (auto-saved; visible only to the evaluator) |
| **Acceptance Pending** | Evaluator submitted; waiting for agent to accept or dispute. Also applies after dispute resolution. |
| **Disputed** | Agent raised per-question disputes; pending evaluator review |
| **Accepted** | Agent viewed and accepted the evaluation |

### Dispute Status (Final Outcome)

| Status | Meaning |
|---|---|
| **Accepted** | Evaluator agreed with all disputes, modified original answers |
| **Rejected** | Evaluator disagreed with all disputes, original answers retained |
| **Partially Accepted** | Evaluator accepted some disputes, rejected others |

### Permission Matrix

| Role | Before Evaluation | After Evaluation | After Disputes | Post-Acceptance |
|---|---|---|---|---|
| **Agent** | N/A | Accept / Dispute | Accept | N/A |
| **QA Auditor** | Evaluate | Update evaluation | Accept/Reject dispute + Update | N/A |
| **Manager** | N/A | Accept / Dispute | Accept evaluation | Dispute (re-open) |
| **Admin/Super Admin** | Evaluate | Accept / Dispute / Update / Delete | Accept/Reject / Update / Delete | Dispute / Update / Delete |

---

## Tables

### `task_assignment_task` — Evaluation Task (The Core Record)

Each row = one evaluation task visible in the Evaluations page. Connects a conversation to an evaluator and a rubric. Created when a case assignment rule runs (or when an Admin/evaluator manually assigns from the Conversation Review screen).

| Column | Type | Description |
|---|---|---|
| `id` | integer | PK |
| `task_type` | integer | Type of task (enum) |
| `assignee_id` | integer | FK → `accounts_user` (primary auditor) |
| `conversation_id` | integer | FK → conversation record |
| `asr_log_id` | integer | FK → `level_asr_asrlog` (conversation) |
| `cf_id` | integer | FK → `quality_assessment_customform` (rubric/scorecard used for evaluation) |
| `cfa_id` | integer | FK → custom form answer record |
| `rule_id` | integer | FK → `quality_assessment_qaautomationrule` |
| `rule_run_at` | timestamptz | When the rule ran to create this task |
| `evaluation_status` | integer | Evaluation status — see QA Statuses table above (Evaluation Pending / Draft / Acceptance Pending / Disputed / Accepted) |
| `evaluation_duration_id` | integer | FK → evaluation duration tracking |
| `dispute_status` | integer | Dispute resolution outcome (Accepted / Rejected / Partially Accepted) — see Dispute Status table above |
| `dispute_at` | timestamptz | When dispute was filed |
| `feedback_at` | timestamptz | When feedback was provided |
| `feedback_by_id` | integer | FK → `accounts_user` (who gave feedback) |
| `is_visible` | boolean | Whether task is visible to the agent |
| `assigned_on` | timestamptz | When task was assigned |
| `due_date` | timestamptz | Task due date |
| `organization_id` | integer | FK → `accounts_organization` |
| `created` | timestamptz | Created |
| `modified` | timestamptz | Modified |
| `deleted` | timestamptz | Soft delete |

**Key relationships:**
- `cf_id` → `quality_assessment_customform.id` (which rubric the evaluator uses)
- `rule_id` → `quality_assessment_qaautomationrule.id` (which case assignment rule created this task; NULL for manually assigned)
- `assignee_id` → `accounts_user.id` (the evaluator who sees this in their Evaluations page)
- `asr_log_id` → `level_asr_asrlog.id` (the conversation being evaluated)

**Active task filter:** `deleted IS NULL`

### `task_assignment_tasksharedassignee` — Shared Assignees

Additional assignees on a task. In the "shared queue" assignment method, this tracks which evaluators have access to the queue. When using "assign to specific evaluators", this tracks moderators or secondary auditors on the same task.

| Column | Type | Description |
|---|---|---|
| `id` | integer | PK |
| `task_id` | integer | FK → `task_assignment_task` |
| `assignee_id` | integer | FK → `accounts_user` |
| `created` | timestamptz | Created |
| `modified` | timestamptz | Modified |

### `task_assignment_taskreplacementlog` — Task Replacement Log

Records when a manager replaces a conversation in an evaluator's queue with a different one. The replacement must match the same agent and same time period as the original conversation. Admins can configure replacement reasons under Settings → QA Case Assignment → Manage Replacement Reasons.

| Column | Type | Description |
|---|---|---|
| `id` | integer | PK |
| `task_id` | integer | FK → `task_assignment_task` |
| `rule_id` | integer | FK → `qaautomationrule` |
| `old_conversation_id` | integer | Original conversation |
| `new_conversation_id` | integer | Replacement conversation |
| `replaced_by_id` | integer | FK → `accounts_user` (who replaced) |
| `reason_id` | integer | FK → `taskreplacementreason` |
| `organization_id` | integer | FK → `accounts_organization` |
| `created` | timestamptz | Created |
| `modified` | timestamptz | Modified |

### `task_assignment_taskreplacementreason` — Replacement Reasons

Configurable lookup table for why a task's conversation was replaced. Level AI provides default reasons; Admins can add/edit/delete custom reasons. Deleted reasons are hidden from evaluators but preserved in historical data.

| Column | Type | Description |
|---|---|---|
| `id` | integer | PK |
| `reason` | varchar | Reason text |
| `organization_id` | integer | FK → `accounts_organization` |
| `created` | timestamptz | Created |
| `modified` | timestamptz | Modified |
| `deleted` | timestamptz | Soft delete |

### `task_engine_taskstate` — Background Task State Machine

Infrastructure table for tracking asynchronous background jobs (Celery tasks). NOT part of the QA evaluation workflow — this tracks the system-level execution of scheduled jobs like case assignment rule runs, data pipeline tasks, etc. Do not confuse with `task_assignment_task` which tracks QA evaluation tasks visible to users.

| Column | Type | Description |
|---|---|---|
| `id` | integer | PK |
| `task_type` | varchar | Type of task |
| `queue_name` | varchar | Processing queue |
| `task_name` | varchar | Task identifier |
| `status` | varchar | Current status |
| `task_fields` | jsonb | Task payload/parameters |
| `retries_count` | integer | Number of retries |
| `max_retries` | integer | Max allowed retries |
| `last_scheduled_at` | timestamptz | Last scheduling time |
| `completed_at` | timestamptz | Completion time |
| `errors` | jsonb | Error details |
| `cancelled_reason` | text | Why task was cancelled |
| `organization_id` | integer | FK → `accounts_organization` |
| `created` | timestamptz | Created |
| `modified` | timestamptz | Modified |
| `deleted` | timestamptz | Soft delete |

### `task_audit` — Background Task Audit Trail

Low-level audit log for Celery background job execution. Tracks publish/pick/completion timing for debugging infrastructure performance. NOT related to QA evaluations or user-facing audit logs (those are in `quality_assessment_evaluationauditlog`).

| Column | Type | Description |
|---|---|---|
| `id` | integer | PK |
| `task_uuid` | uuid | Task unique identifier |
| `task_name` | varchar | Celery task name |
| `task_arguments` | jsonb | Task arguments |
| `status` | integer | Execution status |
| `result` | text | Task result |
| `error` | text | Error message |
| `message_reference_id` | varchar | Message queue reference |
| `publish_delay` | integer | Delay before publishing (ms) |
| `pick_delay` | integer | Delay before pickup (ms) |
| `terminal_delay` | integer | Total delay to completion (ms) |
| `created` | timestamptz | Created |
| `modified` | timestamptz | Modified |

---

## Relationships

```
qaautomationrule (rule config, in quality_assessment domain)
  │
  └── creates → task_assignment_task
                  ├── assignee_id → accounts_user (auditor)
                  ├── asr_log_id → level_asr_asrlog (conversation)
                  ├── cf_id → quality_assessment_customform (scorecard)
                  ├── tasksharedassignee (additional assignees)
                  ├── taskreplacementlog → taskreplacementreason
                  └── qaevidence (evaluation answers, in quality_assessment domain)
```

---

## Common Queries

### Count active tasks per customer

```sql
SELECT COUNT(*) AS active_tasks
FROM {schema}.task_assignment_task
WHERE deleted IS NULL
```

### Count tasks by evaluation status

```sql
SELECT evaluation_status, COUNT(*) AS count
FROM {schema}.task_assignment_task
WHERE deleted IS NULL
GROUP BY evaluation_status
ORDER BY count DESC
```

### Tasks created by a specific rule

```sql
SELECT t.*
FROM {schema}.task_assignment_task t
WHERE t.rule_id = <rule_id>
  AND t.deleted IS NULL
ORDER BY t.created DESC
```

### Task replacement rate

```sql
SELECT
  COUNT(DISTINCT r.task_id) AS replaced_tasks,
  COUNT(DISTINCT t.id) AS total_tasks,
  ROUND(100.0 * COUNT(DISTINCT r.task_id) / NULLIF(COUNT(DISTINCT t.id), 0), 1) AS replacement_pct
FROM {schema}.task_assignment_task t
LEFT JOIN {schema}.task_assignment_taskreplacementlog r ON r.task_id = t.id
WHERE t.deleted IS NULL
```

---

## Disambiguation

| User Says | DB Table | Notes |
|---|---|---|
| "task" or "evaluation task" | `task_assignment_task` | One row per conversation-evaluator-rubric assignment |
| "evaluations page" or "task screen" | `task_assignment_task` | Left nav → Evaluations; filters by evaluator |
| "evaluation pending" | `task_assignment_task` | `evaluation_status` = pending |
| "draft evaluation" | `task_assignment_task` | `evaluation_status` = draft (auto-saved, not submitted) |
| "overdue evaluation" | `task_assignment_task` | `due_date < now()` and not completed |
| "shared queue" task | `task_assignment_task` + `tasksharedassignee` | Task not yet claimed by any evaluator |
| "replacement" or "replaced conversation" | `task_assignment_taskreplacementlog` | Same agent + same time period as original |
| "replacement reasons" | `task_assignment_taskreplacementreason` | Configurable by Admins under Settings → QA Case Assignment |
| "evaluation duration" or "how long did evaluation take" | `quality_assessment_evaluationduration` | Timer tracked in quality-assessment domain |
| "case assignment rule" (how tasks are created) | `quality_assessment_qaautomationrule` | See [quality-assessment.md](quality-assessment.md) |
| "task queue" or "background task" or "celery task" | `task_engine_taskstate` | Infrastructure, NOT the Evaluations page |
| "audit log" (infrastructure) | `task_audit` | Celery job tracking, NOT the UI audit log |
| "audit log" (user-facing) | `quality_assessment_evaluationauditlog` | In quality-assessment domain |
