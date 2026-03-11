# QA Calibrations Domain

**Table prefix:** `qa_calibrations_*`, `private_calibrations_*`
**Colossus table count:** 37 (including historical)
**Status:** EXPLORED (columns documented from schema, product concepts from Help Center)
**Schema queried:** per-tenant (e.g. `auth`) — tables exist in every tenant schema

Last updated: 2026-02-19

---

## Product Concept

**QA Calibration** is a module in Level AI that helps contact center QA teams align their evaluation standards. In traditional QA, each analyst brings their own perspective, which can lead to inconsistent scoring of the same conversation. Calibration sessions address this by having multiple evaluators score the same conversation(s) using the same scorecard, then comparing results to measure inter-rater reliability and identify areas where guidelines need clarification.

Level AI supports two types of calibration: **Group Calibrations** and **Evaluator Calibrations**. In a Group Calibration, a moderator creates a session, selects one or more conversations and a scorecard, and invites multiple participants. Each participant independently evaluates the conversation. The moderator also submits a response and marks "correct answers" for each rubric question. Once all responses are in, Level AI generates a calibration report showing each participant's QA score and their calibration score (percentage of answers matching the correct answers). The moderator then completes the session after team discussion.

**Evaluator Calibrations** (also called Private Calibrations in the database) focus on individual evaluator accuracy rather than team alignment. Instead of manual session creation, admins set up automatic assignment rules that instruct Level AI to sample completed QA evaluations and assign them to a designated moderator. The moderator independently re-evaluates the conversation, and Level AI generates a comparison report between the original evaluator's scores and the moderator's scores, producing a calibration score that indicates alignment with organizational QA standards. These sessions have a single participant (the original evaluator) and a moderator.

**Replacement** allows admins to swap out conversations in an evaluator calibration session — for example, if a conversation becomes invalid or if different conversations are needed. Replacement logs track old vs. new conversation IDs and the reason for swapping. **Session Analytics** capture aggregate metrics: overall calibration score and average QA score for the session. Role-based permissions control who can create sessions (Admins/Super Admins), who can participate (Managers, QA Auditors), and data scope (My Data, My Team, My Org) determines visibility.

---

## Group Calibrations

### `qa_calibrations_calibrationsession` — Calibration Session

| Column | Type | Nullable | Description |
|---|---|---|---|
| id | integer | NO | Primary key |
| created | timestamptz | NO | Row creation timestamp |
| modified | timestamptz | NO | Last modification timestamp |
| name | varchar | YES | Session name (user-provided) |
| status | smallint | NO | Session status (0 = pending, 1 = completed — inferred) |
| calibration_type | integer | NO | Distinguishes group vs evaluator calibration |
| start_time | timestamptz | YES | Due date — deadline for participant responses ("Meeting Date" in UI) |
| completed_at | timestamptz | YES | When the session was marked complete |
| completed_by_id | integer | YES | FK → `accounts_user`. User who completed the session |
| moderator_id | integer | YES | FK → `accounts_user`. Session creator / primary moderator |
| co_moderator_id | integer | YES | FK → `accounts_user`. Optional secondary moderator |
| organization_id | integer | NO | FK → organization (tenant scoping) |
| rubric | jsonb | NO | Snapshot of the scorecard used for this session |
| analytics_id | integer | YES | FK → `qa_calibrations_sessionanalytics` |
| automation_rule_id | integer | YES | FK → QA case assignment rule (set for evaluator calibrations) |
| feedback | text | YES | Moderator feedback / notes |
| discussion | text | YES | Session discussion notes |
| deleted | timestamptz | YES | Soft-delete timestamp (NULL = active) |
| is_carry_forwarded | boolean | NO | Whether this session was carry-forwarded from a prior rule run |
| moderator_can_skip_response | boolean | NO | Whether the moderator can skip submitting their own response |
| cf_answer_id | integer | YES | FK to carry-forwarded answer record |
| rule_run_at | timestamptz | YES | When the automation rule last ran (evaluator calibrations) |

**What a row represents:** One calibration session. For group calibrations, the session has multiple participants evaluating the same conversation. For evaluator calibrations, the session has a single participant (original evaluator) + moderator. The `calibration_type` column distinguishes between the two types.

### `qa_calibrations_calibrationsessionconversation` — Session Conversation Detail

| Column | Type | Nullable | Description |
|---|---|---|---|
| id | integer | NO | Primary key |
| conversation_id | integer | NO | FK → conversation being calibrated |
| participant_id | integer | NO | FK → `accounts_user` |
| response_id | integer | YES | FK → `sessionparticipantresponse` (linked after response is submitted) |
| session_id | integer | NO | FK → `calibrationsession` |
| is_moderator | boolean | NO | Whether this row represents the moderator's entry |
| comment | text | YES | Per-conversation comment from this participant |
| organization_id | integer | NO | FK → organization |

**What a row represents:** One participant's relationship to a conversation within a session. There is one row per participant per conversation per session. Links a participant to their response for that conversation.

### `qa_calibrations_calibrationsession_conversations` — M2M: Session ↔ Conversations

| Column | Type | Nullable | Description |
|---|---|---|---|
| id | integer | NO | Primary key |
| calibrationsession_id | integer | NO | FK → `calibrationsession` |
| bankingconversation_id | integer | NO | FK → `level_asr_asrlog` (conversation) |

**What a row represents:** Junction table linking sessions to the conversations included in them. The FK column `bankingconversation_id` is a legacy name; it references the ASR log (conversation) table.

### `qa_calibrations_calibrationsession_participants` — M2M: Session ↔ Participants

| Column | Type | Nullable | Description |
|---|---|---|---|
| id | integer | NO | Primary key |
| calibrationsession_id | integer | NO | FK → `calibrationsession` |
| user_id | integer | NO | FK → `accounts_user` |

**What a row represents:** Junction table linking sessions to invited participants (evaluators). Does not include the moderator.

### `qa_calibrations_calibrationsessionsharedmoderator` — Shared Moderator

| Column | Type | Nullable | Description |
|---|---|---|---|
| id | integer | NO | Primary key |
| created | timestamptz | NO | Row creation timestamp |
| modified | timestamptz | NO | Last modification timestamp |
| moderator_id | integer | NO | FK → `accounts_user` |
| calibration_id | integer | NO | FK → `calibrationsession` |

**What a row represents:** An additional moderator who has shared access to a calibration session beyond the primary and co-moderator.

---

## Participant Responses

### `qa_calibrations_sessionparticipantresponse` — Evaluation Response

| Column | Type | Nullable | Description |
|---|---|---|---|
| id | integer | NO | Primary key |
| created | timestamptz | NO | Row creation timestamp |
| modified | timestamptz | NO | Last modification timestamp |
| score | numeric | NO | Computed QA score for this participant's evaluation |
| raw_score | numeric | NO | Raw (unweighted) score |
| max_score | numeric | NO | Maximum possible score for the rubric |
| scoring | varchar | NO | Scoring method identifier (e.g. weighted, percentage) |
| outcome | varchar | YES | Pass/fail outcome if applicable |
| calibration_score | double precision | YES | Percentage of answers matching the "correct answers" |
| session_id | integer | NO | FK → `calibrationsession` |
| rubric_id | integer | NO | FK → scorecard/rubric used |
| organization_id | integer | NO | FK → organization |
| deleted | timestamptz | YES | Soft-delete timestamp |
| nested_calibration_scores | jsonb | NO | Per-section/category calibration score breakdown |
| nested_qa_scores | jsonb | NO | Per-section/category QA score breakdown |

**What a row represents:** One participant's complete evaluation response within a session. Contains the aggregate scores. Individual question-level answers are in `sessionparticipantanswer`.

### `qa_calibrations_sessionparticipantresponse_answers` — M2M: Response ↔ Answers

| Column | Type | Nullable | Description |
|---|---|---|---|
| id | integer | NO | Primary key |
| sessionparticipantresponse_id | integer | NO | FK → `sessionparticipantresponse` |
| sessionparticipantanswer_id | integer | NO | FK → `sessionparticipantanswer` |

**What a row represents:** Junction table linking a response to its individual question answers.

### `qa_calibrations_sessionparticipantanswer` — Individual Question Answer

| Column | Type | Nullable | Description |
|---|---|---|---|
| id | integer | NO | Primary key |
| created | timestamptz | NO | Row creation timestamp |
| modified | timestamptz | NO | Last modification timestamp |
| selected_option | text | YES | The answer option selected (single-select) |
| selected_options | ARRAY | YES | Answer options selected (multi-select questions) |
| score | numeric | YES | Score awarded for this question |
| category_id | integer | NO | FK → scorecard category |
| section_id | integer | NO | FK → scorecard section |
| question_id | integer | NO | FK → scorecard question |
| participant_id | integer | NO | FK → `accounts_user` who answered |
| session_id | integer | NO | FK → `calibrationsession` |
| organization_id | integer | NO | FK → organization |
| deleted | timestamptz | YES | Soft-delete timestamp |

**What a row represents:** One participant's answer to one rubric question in a calibration session. The `selected_option` (or `selected_options` for multi-select) is what the participant chose; the moderator's "correct answers" are stored separately and used to compute calibration scores.

### `qa_calibrations_sessionparticipantanswerdraft` — Draft Answer

| Column | Type | Nullable | Description |
|---|---|---|---|
| id | integer | NO | Primary key |
| created | timestamptz | NO | Row creation timestamp |
| modified | timestamptz | NO | Last modification timestamp |
| answer | jsonb | NO | Draft answer state (full JSON blob) |
| comment | text | YES | Draft comment |
| organization_id | integer | NO | FK → organization |
| session_id | integer | NO | FK → `calibrationsession` |
| user_id | integer | YES | FK → `accounts_user` who is drafting |

**What a row represents:** A work-in-progress answer saved before the participant submits. Allows participants to save and return later.

### `qa_calibrations_participantresponsecomment` — Response Comment

| Column | Type | Nullable | Description |
|---|---|---|---|
| id | integer | NO | Primary key |
| created | timestamptz | NO | Row creation timestamp |
| modified | timestamptz | NO | Last modification timestamp |
| deleted | timestamptz | YES | Soft-delete timestamp |
| content | text | NO | Comment text |
| edit_comment | text | YES | Edited version of the comment (if modified) |
| is_draft | boolean | NO | Whether this comment is still a draft |
| conversation_id | integer | NO | FK → conversation |
| participant_id | integer | NO | FK → `accounts_user` |
| question_id | integer | NO | FK → scorecard question |
| session_id | integer | NO | FK → `calibrationsession` |
| user_id | integer | NO | FK → `accounts_user` who authored the comment |
| organization_id | integer | NO | FK → organization |

**What a row represents:** A comment attached to a specific rubric question within a calibration session. Both participants and moderators can add comments while drafting their response; these appear in the final calibration report.

---

## Report Comments

### `qa_calibrations_reportquestioncomment` — Report Question Comment

| Column | Type | Nullable | Description |
|---|---|---|---|
| id | integer | NO | Primary key |
| created | timestamptz | NO | Row creation timestamp |
| modified | timestamptz | NO | Last modification timestamp |
| comment | text | NO | Comment text |
| edit_comment | text | YES | Edited version of the comment |
| is_draft | boolean | NO | Whether this is still a draft |
| conversation_id | integer | NO | FK → conversation |
| question_id | integer | NO | FK → scorecard question |
| session_id | integer | NO | FK → `calibrationsession` |
| user_id | integer | NO | FK → `accounts_user` who authored |
| organization_id | integer | NO | FK → organization |
| deleted | timestamptz | YES | Soft-delete timestamp |

**What a row represents:** A moderator's remark on a rubric question added during session completion ("Add Remark" in the UI). These explain the rationale behind the selected correct answer and appear in the final calibration report.

---

## Evidence & Feedback

### `qa_calibrations_qacalibrationevidence` — Calibration Evidence

| Column | Type | Nullable | Description |
|---|---|---|---|
| id | integer | NO | Primary key |
| created | timestamptz | NO | Row creation timestamp |
| modified | timestamptz | NO | Last modification timestamp |
| deleted | timestamptz | YES | Soft-delete timestamp |
| evidence | text | YES | Evidence text provided by the user |
| edit_evidence | text | YES | Edited version of the evidence |
| is_draft | boolean | NO | Whether this evidence is still a draft |
| conversation_id | integer | NO | FK → conversation |
| question_id | integer | NO | FK → scorecard question |
| session_id | integer | NO | FK → `calibrationsession` |
| user_id | integer | NO | FK → `accounts_user` who submitted |
| organization_id | integer | NO | FK → organization |

**What a row represents:** Supporting evidence a participant attaches to a specific rubric question to justify their answer selection.

### `qa_calibrations_qacalibrationevidencefeedback` — Evidence Feedback

| Column | Type | Nullable | Description |
|---|---|---|---|
| id | integer | NO | Primary key |
| created | timestamptz | NO | Row creation timestamp |
| modified | timestamptz | NO | Last modification timestamp |
| deleted | timestamptz | YES | Soft-delete timestamp |
| feedback | integer | NO | Feedback rating/type (integer enum) |
| additional_notes | ARRAY | YES | Additional feedback notes |
| conversation_id | integer | NO | FK → conversation |
| question_id | integer | NO | FK → scorecard question |
| session_id | integer | NO | FK → `calibrationsession` |
| user_id | integer | NO | FK → `accounts_user` |
| organization_id | integer | NO | FK → organization |

**What a row represents:** Feedback on a piece of evidence submitted for a calibration question (e.g. upvote/downvote or correctness rating).

---

## Analytics

### `qa_calibrations_sessionanalytics` — Session Analytics

| Column | Type | Nullable | Description |
|---|---|---|---|
| id | integer | NO | Primary key |
| calibration_score | double precision | YES | Overall calibration score for the session (% agreement) |
| average_qa_score | double precision | YES | Average QA score across all participant responses |
| organization_id | integer | NO | FK → organization |
| deleted | timestamptz | YES | Soft-delete timestamp |

**What a row represents:** Aggregate analytics for a single calibration session. Linked from `calibrationsession.analytics_id`. The `calibration_score` represents inter-rater reliability — how consistently participants answered relative to the correct answers. The `average_qa_score` is the mean QA score across all participants.

---

## Replacement

### `qa_calibrations_calibrationreplacementlog` — Conversation Replacement Log

| Column | Type | Nullable | Description |
|---|---|---|---|
| id | integer | NO | Primary key |
| created | timestamptz | NO | Row creation timestamp |
| modified | timestamptz | NO | Last modification timestamp |
| calibration_id | integer | NO | FK → `calibrationsession` |
| rule_id | integer | NO | FK → automation rule that generated the original assignment |
| replaced_by_id | integer | NO | FK → `accounts_user` who performed the replacement |
| old_conversation_id | integer | NO | FK → original conversation |
| old_cf_answer_id | integer | NO | FK → original carry-forward answer |
| new_conversation_id | integer | NO | FK → replacement conversation |
| new_cf_answer_id | integer | NO | FK → new carry-forward answer |
| reason_id | integer | NO | FK → `calibrationreplacementreason` |
| organization_id | integer | NO | FK → organization |

**What a row represents:** A log entry each time a conversation is swapped out of a calibration session. Used in evaluator calibrations where admins can replace assigned conversations.

### `qa_calibrations_calibrationreplacementreason` — Replacement Reason

| Column | Type | Nullable | Description |
|---|---|---|---|
| id | integer | NO | Primary key |
| created | timestamptz | NO | Row creation timestamp |
| modified | timestamptz | NO | Last modification timestamp |
| deleted | timestamptz | YES | Soft-delete timestamp |
| reason | varchar | NO | Reason text (e.g. "Conversation invalid", "Wrong team") |
| organization_id | integer | NO | FK → organization |

**What a row represents:** A predefined or custom reason for replacing a conversation in a calibration session. Per-organization lookup table.

---

## Private Calibrations (Evaluator Calibrations)

In the database, **evaluator calibrations** use a separate set of `private_calibrations_*` tables that mirror the `qa_calibrations_*` structure but are scoped to a single participant + moderator rather than a group. The UI labels these "Evaluator Calibrations"; the database prefix "private_calibrations" is a legacy name.

### `private_calibrations_privatecalibrationsession` — Private Calibration Session

| Column | Type | Nullable | Description |
|---|---|---|---|
| id | integer | NO | Primary key |
| created | timestamptz | NO | Row creation timestamp |
| modified | timestamptz | NO | Last modification timestamp |
| deleted | timestamptz | YES | Soft-delete timestamp |
| status | smallint | NO | Session status (pending / completed) |
| rubric | jsonb | NO | Snapshot of the scorecard used |
| due_date | timestamptz | YES | Deadline for the moderator to complete calibration |
| completed_at | timestamptz | YES | When the session was completed |
| rule_run_at | timestamptz | YES | When the automation rule ran |
| analytics_id | integer | YES | FK → `privatecalibrationanalytics` |
| automation_rule_id | integer | YES | FK → QA case assignment rule |
| cf_answer_id | integer | NO | FK → carry-forward answer |
| conversation_id | integer | NO | FK → conversation being calibrated |
| moderator_id | integer | NO | FK → `accounts_user` (the moderator) |
| participant_id | integer | NO | FK → `accounts_user` (the original evaluator) |
| organization_id | integer | NO | FK → organization |

**What a row represents:** One evaluator calibration session: a single conversation, a single original evaluator (`participant_id`), and a moderator who re-evaluates it. Unlike group calibrations, these are typically auto-generated by assignment rules.

### `private_calibrations_privatecalibrationparticipantresponse` — Private Calibration Response

| Column | Type | Nullable | Description |
|---|---|---|---|
| id | integer | NO | Primary key |
| created | timestamptz | NO | Row creation timestamp |
| modified | timestamptz | NO | Last modification timestamp |
| deleted | timestamptz | YES | Soft-delete timestamp |
| is_moderator | boolean | NO | Whether this response is from the moderator |
| score | numeric | NO | Computed QA score |
| raw_score | numeric | NO | Raw score |
| max_score | numeric | NO | Maximum possible score |
| outcome | varchar | YES | Pass/fail outcome |
| scoring | varchar | NO | Scoring method identifier |
| calibration_score | double precision | YES | % agreement with moderator's answers |
| comment | text | YES | Overall response comment |
| participant_id | integer | NO | FK → `accounts_user` |
| rubric_id | integer | NO | FK → scorecard |
| session_id | integer | NO | FK → `privatecalibrationsession` |
| organization_id | integer | NO | FK → organization |

**What a row represents:** One person's complete evaluation within a private calibration. There are typically two rows per session: one for the original evaluator (`is_moderator = false`) and one for the moderator (`is_moderator = true`).

### `private_calibrations_privatecalibrationparticipantanswer` — Private Calibration Answer

| Column | Type | Nullable | Description |
|---|---|---|---|
| id | integer | NO | Primary key |
| created | timestamptz | NO | Row creation timestamp |
| modified | timestamptz | NO | Last modification timestamp |
| deleted | timestamptz | YES | Soft-delete timestamp |
| selected_option | text | YES | Answer option selected |
| score | numeric | NO | Score for this question |
| category_id | integer | NO | FK → scorecard category |
| question_id | integer | NO | FK → scorecard question |
| section_id | integer | NO | FK → scorecard section |
| organization_id | integer | NO | FK → organization |

**What a row represents:** One answer to one rubric question within a private calibration session.

### `private_calibrations_privatecalibrationparticipantresponse_4a88` — M2M: Response ↔ Answers

| Column | Type | Nullable | Description |
|---|---|---|---|
| id | integer | NO | Primary key |
| privatecalibrationparticipantresponse_id | integer | NO | FK → `privatecalibrationparticipantresponse` |
| privatecalibrationparticipantanswer_id | integer | NO | FK → `privatecalibrationparticipantanswer` |

**What a row represents:** Junction table linking a private calibration response to its individual answers. Table name is truncated by Django's auto-naming.

### `private_calibrations_privatecalibrationparticipantresponsec1191` — Response Comment

| Column | Type | Nullable | Description |
|---|---|---|---|
| id | integer | NO | Primary key |
| created | timestamptz | NO | Row creation timestamp |
| modified | timestamptz | NO | Last modification timestamp |
| deleted | timestamptz | YES | Soft-delete timestamp |
| content | text | NO | Comment text |
| edit_comment | text | YES | Edited version |
| is_draft | boolean | NO | Whether this is a draft |
| conversation_id | integer | NO | FK → conversation |
| participant_id | integer | NO | FK → `accounts_user` |
| question_id | integer | NO | FK → scorecard question |
| session_id | integer | NO | FK → `privatecalibrationsession` |
| user_id | integer | NO | FK → `accounts_user` who authored |
| organization_id | integer | NO | FK → organization |

**What a row represents:** A comment on a rubric question within a private calibration session. Table name is truncated by Django.

### `private_calibrations_privatecalibrationsessionparticipantan8af7` — Answer Draft

| Column | Type | Nullable | Description |
|---|---|---|---|
| id | integer | NO | Primary key |
| created | timestamptz | NO | Row creation timestamp |
| modified | timestamptz | NO | Last modification timestamp |
| answer | jsonb | NO | Draft answer state |
| comment | text | NO | Draft comment |
| organization_id | integer | NO | FK → organization |
| session_id | integer | NO | FK → `privatecalibrationsession` |
| user_id | integer | YES | FK → `accounts_user` |

**What a row represents:** Work-in-progress draft for a private calibration response. Table name is truncated by Django.

### `private_calibrations_privatecalibrationevidence` — Private Calibration Evidence

| Column | Type | Nullable | Description |
|---|---|---|---|
| id | integer | NO | Primary key |
| created | timestamptz | NO | Row creation timestamp |
| modified | timestamptz | NO | Last modification timestamp |
| deleted | timestamptz | YES | Soft-delete timestamp |
| evidence | text | YES | Evidence text |
| edit_evidence | text | YES | Edited evidence |
| is_draft | boolean | NO | Draft flag |
| conversation_id | integer | NO | FK → conversation |
| question_id | integer | NO | FK → scorecard question |
| session_id | integer | NO | FK → `privatecalibrationsession` |
| user_id | integer | NO | FK → `accounts_user` |
| organization_id | integer | NO | FK → organization |

**What a row represents:** Evidence attached to a rubric question in a private calibration. Same structure as the group calibration equivalent.

### `private_calibrations_privatecalibrationevidencefeedback` — Private Evidence Feedback

| Column | Type | Nullable | Description |
|---|---|---|---|
| id | integer | NO | Primary key |
| created | timestamptz | NO | Row creation timestamp |
| modified | timestamptz | NO | Last modification timestamp |
| deleted | timestamptz | YES | Soft-delete timestamp |
| feedback | integer | NO | Feedback rating/type |
| additional_notes | ARRAY | YES | Additional notes |
| conversation_id | integer | NO | FK → conversation |
| question_id | integer | NO | FK → scorecard question |
| session_id | integer | NO | FK → `privatecalibrationsession` |
| user_id | integer | NO | FK → `accounts_user` |
| organization_id | integer | NO | FK → organization |

**What a row represents:** Feedback on evidence within a private calibration session.

### `private_calibrations_privatecalibrationanalytics` — Private Calibration Analytics

| Column | Type | Nullable | Description |
|---|---|---|---|
| id | integer | NO | Primary key |
| created | timestamptz | NO | Row creation timestamp |
| modified | timestamptz | NO | Last modification timestamp |
| deleted | timestamptz | YES | Soft-delete timestamp |
| calibration_score | double precision | YES | Calibration score (% agreement) |
| average_qa_score | double precision | YES | Average QA score |
| organization_id | integer | NO | FK → organization |

**What a row represents:** Aggregate analytics for a private calibration session.

### `private_calibrations_privatecalibrationreportquestioncomment` — Private Report Comment

| Column | Type | Nullable | Description |
|---|---|---|---|
| id | integer | NO | Primary key |
| created | timestamptz | NO | Row creation timestamp |
| modified | timestamptz | NO | Last modification timestamp |
| deleted | timestamptz | YES | Soft-delete timestamp |
| comment | text | NO | Comment text |
| edit_comment | text | YES | Edited version |
| is_draft | boolean | NO | Draft flag |
| conversation_id | integer | NO | FK → conversation |
| question_id | integer | NO | FK → scorecard question |
| session_id | integer | NO | FK → `privatecalibrationsession` |
| user_id | integer | NO | FK → `accounts_user` |
| organization_id | integer | NO | FK → organization |

**What a row represents:** Moderator remark on a rubric question in a private calibration report.

---

## Historical Tables (Audit Trail)

Django-simple-history tables that track row-level changes. Each mirrors its source table with additional audit columns (`history_id`, `history_date`, `history_type`, `history_user_id`, `history_change_reason`).

| Table | Tracks Changes To |
|---|---|
| `qa_calibrations_historicalcalibrationsession` | `calibrationsession` |
| `qa_calibrations_historicalcalibrationsessionconversation` | `calibrationsessionconversation` |
| `qa_calibrations_historicalcalibrationsessionsharedmoderator` | `calibrationsessionsharedmoderator` |
| `qa_calibrations_historicalparticipantresponsecomment` | `participantresponsecomment` |
| `qa_calibrations_historicalqacalibrationevidence` | `qacalibrationevidence` |
| `qa_calibrations_historicalqacalibrationevidencefeedback` | `qacalibrationevidencefeedback` |
| `qa_calibrations_historicalreportquestioncomment` | `reportquestioncomment` |
| `qa_calibrations_historicalsessionanalytics` | `sessionanalytics` |
| `qa_calibrations_historicalsessionparticipantanswer` | `sessionparticipantanswer` |
| `qa_calibrations_historicalsessionparticipantresponse` | `sessionparticipantresponse` |
| `private_calibrations_historicalprivatecalibrationevidence` | `privatecalibrationevidence` |

---

## Relationships

```
qa_calibrations_calibrationsession
  ├── calibrationsession_conversations (M2M → level_asr_asrlog via bankingconversation_id)
  ├── calibrationsession_participants (M2M → accounts_user)
  ├── calibrationsessionconversation (per-participant × per-conversation detail)
  ├── calibrationsessionsharedmoderator (additional moderators)
  ├── sessionparticipantresponse (one per participant — aggregate scores)
  │     ├── sessionparticipantresponse_answers (M2M → sessionparticipantanswer)
  │     └── participantresponsecomment (per-question comments)
  ├── sessionparticipantanswer (one per participant × per question)
  ├── sessionparticipantanswerdraft (work-in-progress saves)
  ├── qacalibrationevidence (per-question evidence)
  │     └── qacalibrationevidencefeedback (feedback on evidence)
  ├── reportquestioncomment (moderator remarks on report)
  ├── sessionanalytics (aggregate calibration + QA scores)
  └── calibrationreplacementlog (conversation swaps)
        └── calibrationreplacementreason (lookup table)

private_calibrations_privatecalibrationsession
  ├── privatecalibrationparticipantresponse (moderator + evaluator)
  │     ├── ..._participantresponse_4a88 (M2M → answers)
  │     └── ..._participantresponsec1191 (per-question comments)
  ├── privatecalibrationparticipantanswer (per-question answers)
  ├── ..._sessionparticipantan8af7 (answer drafts)
  ├── privatecalibrationevidence (per-question evidence)
  │     └── privatecalibrationevidencefeedback
  ├── privatecalibrationreportquestioncomment (moderator remarks)
  └── privatecalibrationanalytics (aggregate scores)
```

---

## Key Gotchas

1. **Soft deletes everywhere.** Most tables have a `deleted` (timestamptz) column. A row is active when `deleted IS NULL`. Always filter with `WHERE deleted IS NULL` unless you specifically want deleted records.

2. **Group vs Evaluator in the same table.** `qa_calibrations_calibrationsession` holds both group and evaluator calibrations. Use `calibration_type` to distinguish. However, evaluator calibrations also have their own dedicated table set under `private_calibrations_*`. In practice, private calibrations (auto-assigned by rules) live in the `private_calibrations_*` tables, while group calibrations (manually created) live in the `qa_calibrations_*` tables.

3. **Rubric is a snapshot.** The `rubric` column (jsonb) on session tables stores a point-in-time copy of the scorecard. Joining to the live scorecard tables may show different questions if the scorecard was modified after the session was created.

4. **Django truncated table names.** Several `private_calibrations_*` tables have truncated names ending in hash fragments (`_4a88`, `c1191`, `an8af7`) because Django auto-generates M2M table names that exceed PostgreSQL's 63-character identifier limit. These are:
   - `_4a88` = response ↔ answers M2M junction
   - `c1191` = participant response comment
   - `an8af7` = answer draft

5. **`bankingconversation_id` is a legacy name.** The M2M junction `calibrationsession_conversations` uses `bankingconversation_id` to reference conversations. This is not specific to banking — it references the `level_asr_asrlog` table.

6. **Scores are stored at multiple levels.** `sessionparticipantresponse` has the aggregate `score`, `calibration_score`, and nested breakdowns in `nested_qa_scores` / `nested_calibration_scores` (jsonb). Individual question scores are in `sessionparticipantanswer.score`.

7. **Two comment tables.** `participantresponsecomment` stores comments added during evaluation by participants and moderators. `reportquestioncomment` stores moderator remarks added via "Add Remark" during session completion. Both appear in the calibration report.

8. **Per-tenant tables.** All tables exist per tenant schema (e.g. `affirm.qa_calibrations_calibrationsession`). Use the UNION ALL cross-tenant pattern from the Colossus overview when querying across tenants.

---

## Common Queries

### Count active calibration sessions per tenant

```sql
SELECT
  COUNT(*) AS session_count
FROM {schema}.qa_calibrations_calibrationsession
WHERE deleted IS NULL
```

### Average calibration score for completed group sessions

```sql
SELECT
  AVG(sa.calibration_score) AS avg_calibration_score,
  AVG(sa.average_qa_score)  AS avg_qa_score
FROM {schema}.qa_calibrations_calibrationsession cs
JOIN {schema}.qa_calibrations_sessionanalytics sa ON cs.analytics_id = sa.id
WHERE cs.deleted IS NULL
  AND cs.completed_at IS NOT NULL
  AND sa.deleted IS NULL
```

### Per-participant calibration scores in a session

```sql
SELECT
  u.first_name || ' ' || u.last_name AS participant_name,
  spr.score                           AS qa_score,
  spr.calibration_score               AS calibration_score
FROM {schema}.qa_calibrations_sessionparticipantresponse spr
JOIN {schema}.accounts_user u ON spr.id = u.id  -- note: join on participant via sessionconversation
WHERE spr.session_id = :session_id
  AND spr.deleted IS NULL
ORDER BY spr.calibration_score DESC
```

---

## Disambiguation

| User Says | DB Table | Filter |
|---|---|---|
| "calibration" or "calibration session" | `qa_calibrations_calibrationsession` | `deleted IS NULL` |
| "group calibration" | `qa_calibrations_calibrationsession` | `deleted IS NULL AND calibration_type = <group>` |
| "evaluator calibration" or "private calibration" | `private_calibrations_privatecalibrationsession` | `deleted IS NULL` |
| "calibration score" (session-level) | `qa_calibrations_sessionanalytics` | `deleted IS NULL` |
| "calibration score" (per-participant) | `qa_calibrations_sessionparticipantresponse.calibration_score` | `deleted IS NULL` |
| "inter-rater reliability" | `qa_calibrations_sessionanalytics.calibration_score` | — |
| "calibration replacement" | `qa_calibrations_calibrationreplacementlog` | — |
| "calibration report" | Combination of `sessionparticipantresponse` + `sessionparticipantanswer` + `reportquestioncomment` | — |
