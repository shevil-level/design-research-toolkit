# Mixpanel Query Recipes — Level AI

Validated MCP tool call examples. Each recipe shows the exact parameters to pass to the MCP tool.

**Default project:** `project_id: 2995973` (level-prod)

Last updated: 2026-02-20

---

## Segmentation (`Run-Segmentation-Query`)

Analyze event counts or unique users over time, optionally grouped by a property.

**Required params:** `project_id`, `event`, `from_date`, `to_date`, `unit`
**Optional params:** `type` (default `"general"` for total events; use `"unique"` for unique users), `where`, `on`, `numerical_aggregation`

### Recipe: Daily page views over last 7 days

**Answers:** "How many page views per day?"

```
project_id: 2995973
event: "$mp_web_page_view"
from_date: "2026-02-13"
to_date: "2026-02-20"
unit: "day"
type: "general"
```

**Status:** VALIDATED — returns daily counts (100K-150K on weekdays)

### Recipe: Weekly unique users by tenant

**Answers:** "How many unique users per tenant per week?"

```
project_id: 2995973
event: "$mp_web_page_view"
from_date: "2026-01-01"
to_date: "2026-02-20"
unit: "week"
type: "unique"
on: "properties[\"tenant\"]"
```

### Recipe: Evaluation submissions per day

**Answers:** "How many evaluations are submitted daily?"

```
project_id: 2995973
event: "Convo Submit Evaluation"
from_date: "2026-02-01"
to_date: "2026-02-20"
unit: "day"
type: "general"
```

### Recipe: Agent Assist searches by input method

**Answers:** "How do agents search in Agent Assist — typed vs. voice?"

```
project_id: 2995973
event: "SEARCH"
from_date: "2026-02-01"
to_date: "2026-02-20"
unit: "week"
type: "general"
on: "properties[\"queryInputMethod\"]"
```

### Recipe: AI Worker runs by worker name

**Answers:** "Which AI Workers are used most?"

```
project_id: 2995973
event: "Run AI Worker"
from_date: "2026-02-01"
to_date: "2026-02-20"
unit: "week"
type: "general"
on: "properties[\"workerName\"]"
```

### Recipe: Screen Recording watch time

**Answers:** "How much time do users spend watching screen recordings?"

```
project_id: 2995973
event: "SR Video Watch Time"
from_date: "2026-02-01"
to_date: "2026-02-20"
unit: "week"
type: "general"
on: "properties[\"watchTime\"]"
numerical_aggregation: "sum"
```

### Recipe: Filter by tenant

**Answers:** "Show me page views for the Chime tenant only."

```
project_id: 2995973
event: "$mp_web_page_view"
from_date: "2026-02-01"
to_date: "2026-02-20"
unit: "day"
type: "general"
where: "properties[\"tenant\"] == \"chime\""
```

---

## Funnels (`Run-Funnels-Query`)

Measure conversion between sequential steps. Shows what % of users complete each step.

**Required params:** `project_id`, `from_date`, `to_date`, `events` (JSON string array)
**Optional params:** `where`, `on`, `count_type` (default `"unique"`), `length`, `length_unit`, `interval`

### Recipe: Evaluation completion funnel

**Answers:** "What % of users who start an evaluation actually submit it?"

```
project_id: 2995973
from_date: "2026-02-01"
to_date: "2026-02-20"
events: "[{\"event\": \"Evaluation Started\"}, {\"event\": \"Convo Submit Evaluation\"}]"
```

### Recipe: Coaching session funnel

**Answers:** "What % of coaching sessions that are opened get completed?"

```
project_id: 2995973
from_date: "2026-02-01"
to_date: "2026-02-20"
events: "[{\"event\": \"Coaching Session Open\"}, {\"event\": \"Coaching Session Started\"}, {\"event\": \"Coaching Session Completed\"}]"
```

### Recipe: IH to conversation detail funnel

**Answers:** "What % of users who visit Interaction History click into a conversation?"

```
project_id: 2995973
from_date: "2026-02-01"
to_date: "2026-02-20"
events: "[{\"event\": \"Conversation History Page Visit\"}, {\"event\": \"IH Click Conversation\"}, {\"event\": \"Conversation Details Page Visit\"}]"
```

### Recipe: Funnel grouped by tenant

**Answers:** "Evaluation completion funnel per tenant"

```
project_id: 2995973
from_date: "2026-02-01"
to_date: "2026-02-20"
events: "[{\"event\": \"Evaluation Started\"}, {\"event\": \"Convo Submit Evaluation\"}]"
on: "properties[\"tenant\"]"
```

### Recipe: Funnel with conversion window

**Answers:** "What % complete an evaluation within 1 hour of starting?"

```
project_id: 2995973
from_date: "2026-02-01"
to_date: "2026-02-20"
events: "[{\"event\": \"Evaluation Started\"}, {\"event\": \"Convo Submit Evaluation\"}]"
length: 1
length_unit: "hour"
```

### Recipe: Trending funnel (daily intervals)

**Answers:** "How is the evaluation completion rate trending day by day?"

```
project_id: 2995973
from_date: "2026-02-01"
to_date: "2026-02-20"
events: "[{\"event\": \"Evaluation Started\"}, {\"event\": \"Convo Submit Evaluation\"}]"
interval: 1
```

---

## Retention (`Run-Retention-Query`)

Measure how many users return after their first usage. Shows cohort-based retention curves.

**Required params:** `project_id`, `event`, `born_event`, `from_date`, `to_date`, `retention_type`, `unit`
**Optional params:** `where`, `on`, `interval_count`

### Recipe: Weekly user retention

**Answers:** "What % of users return each week after their first visit?"

```
project_id: 2995973
event: "$mp_web_page_view"
born_event: "$mp_web_page_view"
from_date: "2026-01-01"
to_date: "2026-02-20"
retention_type: "birth"
unit: "week"
```

### Recipe: Analytics feature retention

**Answers:** "Do users who visit Analytics come back to use it again?"

```
project_id: 2995973
event: "AN Run Query Clicks"
born_event: "Analytics Query Builder Page Visit"
from_date: "2026-01-01"
to_date: "2026-02-20"
retention_type: "birth"
unit: "week"
```

### Recipe: Coaching retention

**Answers:** "Do users who start coaching sessions continue to use coaching?"

```
project_id: 2995973
event: "Coaching Session Open"
born_event: "Coaching Landing Page Visit"
from_date: "2026-01-01"
to_date: "2026-02-20"
retention_type: "birth"
unit: "week"
```

---

## Frequency (`Run-Frequency-Query`)

Analyze how often users perform an event. Shows distribution of usage frequency.

**Required params:** `project_id`, `event`, `from_date`, `to_date`, `addiction_unit`, `unit`
**Optional params:** `where`, `on`

### Recipe: Evaluation frequency per user

**Answers:** "How many evaluations does a typical user submit per week?"

```
project_id: 2995973
event: "Convo Submit Evaluation"
from_date: "2026-02-01"
to_date: "2026-02-20"
addiction_unit: "week"
unit: "week"
```

### Recipe: Login frequency

**Answers:** "How often do users log in per day?"

```
project_id: 2995973
event: "Logged-in user"
from_date: "2026-02-01"
to_date: "2026-02-20"
addiction_unit: "day"
unit: "day"
```

---

## Reports (`Run-Report-Query`)

Execute complex report configurations. Use `Get-Report-Query-Instructions` to get the schema for each report type before constructing the `report` parameter.

**Required params:** `project_id`, `report_type`, `report`
**Report types:** `"insights"`, `"funnels"`, `"flows"`, `"retention"`

### Getting the schema first

Before constructing a report query, always call:

```
Tool: Get-Report-Query-Instructions
report_type: "insights"  (or "funnels", "flows", "retention")
```

This returns the JSON schema and instructions for building a valid report configuration.

---

## Dashboards (`Get-Dashboards` + `Get-Dashboard-Details`)

Browse existing Mixpanel dashboards.

### List all dashboards

```
Tool: Get-Dashboards
project_id: 2995973
```

### Get dashboard details with content preview

```
Tool: Get-Dashboard-Details
project_id: 2995973
dashboard_id: <id from list>
include_contents: true
```

---

## Event Exploration (`Get-Events`, `Get-Event-Details`, `Get-Property-Names`, `Get-Property-Values`)

Discover events and properties dynamically.

### List all events

```
Tool: Get-Events
project_id: 2995973
```

### Get properties for an event

```
Tool: Get-Property-Names
project_id: 2995973
resource_type: "Event"
event: "Convo Submit Evaluation"
```

### Get user profile properties

```
Tool: Get-Property-Names
project_id: 2995973
resource_type: "User"
```

### Get values for a property

```
Tool: Get-Property-Values
project_id: 2995973
resource_type: "Event"
event: "Run AI Worker"
property: "workerName"
```

---

## Data Quality (`Get-Issues`)

Monitor data quality issues.

### Check for data quality issues

```
Tool: Get-Issues
project_id: 2995973
```

### Filter issues by event

```
Tool: Get-Issues
project_id: 2995973
event_name: "Convo Submit Evaluation"
```
