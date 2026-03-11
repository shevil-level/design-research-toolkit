# Agent Coaching Domain

**Table prefix:** `agent_coaching_*`
**Colossus table count:** ~24 (including historical)
**Status:** VALIDATED (rubric hierarchy confirmed against Chime data)

Last updated: 2026-02-19

---

## Product Concept

Agent Coaching is the 1:1 coaching session feature. Managers create coaching sessions with agents, using rubric templates that define the session structure (action items, victories, coached interactions). This is NOT the same as QA scorecards.

---

## Coaching Rubrics

### `agent_coaching_coachingrubric` — Rubric Template + Instance

**CRITICAL:** This table contains BOTH template definitions AND per-session instance copies.

| Column | Type | Description |
|---|---|---|
| `id` | integer | PK |
| `name` | varchar | Rubric name (e.g., "Agent Coaching", "Private 1:1") |
| `is_template` | boolean | `true` = definition; `false` = session instance copy |
| `is_default` | boolean | Default rubric for new sessions |
| `source_id` | integer | For instances: FK to the template this was copied from |
| `organization_id` | integer | FK → `accounts_organization` |
| `created` | timestamptz | Created |
| `modified` | timestamptz | Modified |
| `deleted` | timestamptz | Soft delete |

### What a Row Represents

- **`is_template = true`**: A rubric **definition** that users manage in the UI. Default types per org: "Agent Coaching", "Private 1:1", "Performance Review". Customers can create custom ones (e.g., "BOOST Coaching"). Templates are **duplicated per organization** within a tenant.
- **`is_template = false`**: A **per-session copy** created every time a coaching session starts. A customer with 800 sessions will have ~800 instance rows. These are NOT distinct rubrics.

### Counting Rubric Types (What Users See)

```sql
SELECT COUNT(DISTINCT name)
FROM {schema}.agent_coaching_coachingrubric
WHERE is_template = true AND deleted IS NULL
```

### DO NOT count like this (wrong):

```sql
-- WRONG: counts session instances, not rubric definitions
SELECT COUNT(*)
FROM {schema}.agent_coaching_coachingrubric
WHERE deleted IS NULL AND is_template = false
```

### Hierarchy

```
Rubric (is_template=true)
  └── Section (coachingrubricsection, FK: rubric_id)
        ├── content_type: CHECKBOX → CheckboxItems (action items)
        ├── content_type: OL → ordered list (victories)
        ├── content_type: CONVO → coached interactions
        └── content_type: DROPDOWN → DropdownItems
```

---

## Related Tables

### `agent_coaching_coachingrubricsection` — Rubric Section

| Column | Type | Description |
|---|---|---|
| `id` | integer | PK |
| `name` | varchar | Section name |
| `description` | text | Description |
| `content_type` | varchar | CHECKBOX, OL, CONVO, DROPDOWN |
| `rubric_id` | integer | FK → `coachingrubric` |
| `source_id` | integer | FK → template section |
| `pending_action_items_reviewed` | timestamptz | Review timestamp |
| `organization_id` | integer | FK → `accounts_organization` |
| `created` | timestamptz | Created |
| `modified` | timestamptz | Modified |
| `deleted` | timestamptz | Soft delete |

### `agent_coaching_coachingrubriccheckboxitem` — Checkbox / Action Items

| Column | Type | Description |
|---|---|---|
| `id` | integer | PK |
| `title` | text | Item text |
| `checked` | timestamptz | When checked (NULL = unchecked) |
| `added_by_id` | integer | FK → `accounts_user` |
| `checked_by_id` | integer | FK → `accounts_user` |
| `organization_id` | integer | FK → `accounts_organization` |
| `created` | timestamptz | Created |
| `modified` | timestamptz | Modified |
| `deleted` | timestamptz | Soft delete |

### `agent_coaching_coachingrubricdropdownitem` — Dropdown Options

| Column | Type | Description |
|---|---|---|
| `id` | integer | PK |
| `title` | varchar | Option text |
| `is_selected` | boolean | Whether selected |
| `added_by_id` | integer | FK → `accounts_user` |
| `selected_by_id` | integer | FK → `accounts_user` |
| `organization_id` | integer | FK → `accounts_organization` |
| `created` | timestamptz | Created |
| `modified` | timestamptz | Modified |
| `deleted` | timestamptz | Soft delete |

### `agent_coaching_coachingrubricunitcontent` — Content Blocks

| Column | Type | Description |
|---|---|---|
| `id` | integer | PK |
| `content_type` | varchar | Content type |
| `text_content` | text | Text content |
| `section_id` | integer | FK → `coachingrubricsection` |
| `conversation_id` | integer | FK → conversation |
| `checkbox_item_id` | integer | FK → `coachingrubriccheckboxitem` |
| `dropdown_item_id` | integer | FK → `coachingrubricdropdownitem` |
| `organization_id` | integer | FK → `accounts_organization` |
| `created` | timestamptz | Created |
| `modified` | timestamptz | Modified |
| `deleted` | timestamptz | Soft delete |

### Other Coaching Tables

| Table | Purpose | Status |
|---|---|---|
| `agent_coaching_coachingsession` | The coaching session itself | MAPPED |
| `agent_coaching_actionitem` | Action items from sessions | MAPPED |
| `agent_coaching_coachedinteraction` | Interactions reviewed in sessions | MAPPED |
| `agent_coaching_comment` | Comments on coaching sessions | MAPPED |
| `agent_coaching_victory` | Victories logged in sessions | MAPPED |
| `agent_coaching_sessionschedule` | Session scheduling | MAPPED |
| `agent_coaching_sessionactionitemrelation` | M2M: session ↔ action items | MAPPED |

---

## Disambiguation

| User Says | DB Table | Filter |
|---|---|---|
| "coaching rubric" | `agent_coaching_coachingrubric` | `is_template = true AND deleted IS NULL` |
| "coaching session" | `agent_coaching_coachingsession` | `deleted IS NULL` |
| "action item" (coaching) | `agent_coaching_actionitem` | `deleted IS NULL` |
| "coaching session count" | `agent_coaching_coachingrubric` | `is_template = false AND deleted IS NULL` |
