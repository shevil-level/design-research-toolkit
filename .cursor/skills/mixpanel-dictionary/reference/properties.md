# Mixpanel Properties Reference — Level AI

Properties are metadata attached to events and users. Use them to filter (`where`) and group (`on`) in MCP query tools.

Last updated: 2026-02-20

---

## Common Event Properties

These properties exist on **every** tracked event. They are automatically captured by Mixpanel or set globally by the Level AI tracking code.

### Platform-Set Properties (always available)

| Property | Description | Example Values |
|---|---|---|
| `tenant` | Customer tenant identifier | `"chime"`, `"airbnb"`, `"uber"` |
| `organizationId` | Organization ID within the tenant | `"12345"` |
| `organizationName` | Human-readable organization name | `"Chime Support"` |
| `$user_id` | Mixpanel distinct user ID | `"user_abc123"` |

### Mixpanel Auto-Captured Properties

| Property | Description |
|---|---|
| `$browser` | Browser name (Chrome, Firefox, Safari, etc.) |
| `$browser_version` | Browser version |
| `$os` | Operating system (Mac OS X, Windows, etc.) |
| `$device` | Device type (present on ~44% of events) |
| `$device_id` | Device identifier |
| `$current_url` | Full URL at time of event |
| `$referrer` | Referrer URL |
| `$referring_domain` | Referrer domain |
| `$initial_referrer` | First-touch referrer |
| `$initial_referring_domain` | First-touch referrer domain |
| `$search_engine` | Search engine that referred the user |
| `$screen_height` | Screen height in pixels |
| `$screen_width` | Screen width in pixels |
| `$region` | Geographic region |
| `$city` | Geographic city |
| `mp_country_code` | Country code |

### UTM Properties (present on ~17% of events)

| Property | Description |
|---|---|
| `utm_source` | UTM source parameter |
| `utm_medium` | UTM medium parameter |
| `utm_campaign` | UTM campaign parameter |

---

## Notable Event-Specific Properties

These properties are only available on specific events. Check [events.md](./events.md) for which events carry which properties.

### Conversation Context

| Property | Events | Description |
|---|---|---|
| `conversationId` | Conversation Detail, Accept Conversation, Dispute Question, Run AI Worker, SR Video Watch Time, $mp_web_page_view | ID of the conversation |
| `agentId` | Conversation Detail, $mp_web_page_view, SR Video Watch Time | ID of the agent on the conversation |
| `hasScreenRecording` | Conversation Detail, $mp_web_page_view, SR Video Watch Time | Whether conversation has screen recording |
| `integrationType` | Conversation Detail, $mp_web_page_view, SR Video Watch Time | Source integration (e.g., Talkdesk, Zendesk) |

### QA / Evaluation Context

| Property | Events | Description |
|---|---|---|
| `question` | Accept Disputed Question, Dispute Question | Question text or name |
| `questionId` | Accept Disputed Question, Dispute Question | Question ID |
| `user` | Accept Conversation, Accept Disputed Question, Dispute Question, Logged-in user | User identifier |
| `comment` | Dispute Question | Dispute comment text |
| `componentType` | Evaluation Started | Type of evaluation component |

### Analytics Context

| Property | Events | Description |
|---|---|---|
| `dashboardId` | AN Instascore/QA Auditor/QA Performance Dashboard, Custom Dashboard | Dashboard ID |
| `dashboardName` | AN Chart Expanded View, Instascore/QA Auditor/QA Performance Dashboard, Custom Dashboard | Dashboard name |
| `time_period` | AN Chart timeperiod dropdown click | Selected time period |
| `filters` | AN OOTB Apply filter, Apply Interaction History filters | Applied filters |

### Agent Assist Context

| Property | Events | Description |
|---|---|---|
| `searchQuery` | SEARCH, CHAT_WITH_KB_RESPONSE | Search query text |
| `queryInputMethod` | SEARCH | How the query was entered (typed, voice, etc.) |
| `userEmail` | SEARCH, CHAT_WITH_KB_RESPONSE, KNOWLEDGE_CARD_PUSHED | Agent's email |
| `cardId` | KNOWLEDGE_CARD_PUSHED | Knowledge card ID |
| `cardType` | KNOWLEDGE_CARD_PUSHED | Type of knowledge card |
| `rank` | KNOWLEDGE_CARD_PUSHED | Card rank in results |
| `title` | KNOWLEDGE_CARD_PUSHED | Card title |
| `sessionId` | KNOWLEDGE_CARD_PUSHED | Assist session ID |
| `convoId` | CHAT_WITH_KB_RESPONSE | Conversation ID for KB chat |
| `response` | CHAT_WITH_KB_RESPONSE | KB chat response text |

### AI Worker Context

| Property | Events | Description |
|---|---|---|
| `workerId` | Open AI Worker, Run AI Worker, Query Completed | Worker ID |
| `workerName` | Open AI Worker, Run AI Worker, Query Completed | Worker name |
| `workerAppType` | Open AI Worker, Run AI Worker | Worker application type |
| `prompt` | Run AI Worker | User prompt to the worker |
| `source` | Run AI Worker | Where the worker was triggered from |
| `parameters` | Run AI Worker | Worker parameters |
| `asrLogId` | Run AI Worker | ASR log ID for conversation context |

### Screen Recording Context

| Property | Events | Description |
|---|---|---|
| `watchTime` | SR Video Watch Time | Time spent watching (seconds) |
| `videoDuration` | SR Video Watch Time | Total video duration |
| `audioDuration` | SR Video Watch Time | Total audio duration |
| `conversationDuration` | SR Video Watch Time | Total conversation duration |

### Coaching Context

| Property | Events | Description |
|---|---|---|
| `session` | Coaching Session Open, Coaching Session Completed, Calibration Session Open | Session identifier |
| `visibility` | Agent coaching - Coaching session visibility change | Public or private |

### Other Specific Properties

| Property | Events | Description |
|---|---|---|
| `channel` | Add to Library Save | Conversation channel |
| `folderId` | Add to Library Save | Library folder ID |
| `filter` | Agent List Filter Applied | Filter that was applied |
| `name` | Filter Applied, Agent coaching - Find interactions filter | Filter name |
| `value` | Filter Applied, Agent coaching - Find interactions filter | Filter value |
| `page_name` | VOCv2 - View Page | Which VoC page was viewed |
| `page` | $mp_web_page_view | Page path |
| `current_page_title` | $mp_web_page_view | Page title |
| `current_url_path` | $mp_web_page_view | URL path |

---

## User (People) Properties

Profile-level properties that persist across sessions. Queried via `Get-Property-Names` with `resource_type: "User"`.

| Property | Description |
|---|---|
| `$email` | User email address |
| `$name` | User display name |
| `$last_seen` | Last activity timestamp |
| `$browser` | Last known browser |
| `$browser_version` | Last known browser version |
| `$os` | Last known OS |
| `$city` | Last known city |
| `$country_code` | Last known country |
| `$region` | Last known region |
| `$timezone` | User timezone |
| `$initial_referrer` | First-touch referrer |
| `$initial_referring_domain` | First-touch referrer domain |
| `Name` | Custom user name field |
| `email` | Custom email field |
| `tenant` | Customer tenant |
| `userType` | User role/type in Level AI |
| `userId` | Level AI user ID |
| `isFirstTimeUser` | Whether this is a first-time user |
| `initial_utm_source` | First-touch UTM source |
| `initial_utm_medium` | First-touch UTM medium |
| `initial_utm_campaign` | First-touch UTM campaign |
| `initial_utm_content` | First-touch UTM content |
| `initial_utm_term` | First-touch UTM term |
| `initial_utm_campaign_id` | First-touch UTM campaign ID |
| `initial_utm_creative_format` | First-touch UTM creative format |
| `initial_utm_id` | First-touch UTM ID |
| `initial_utm_marketing_tactic` | First-touch UTM marketing tactic |
| `initial_utm_source_platform` | First-touch UTM source platform |

---

## Expression Syntax for `where` and `on` Parameters

The Mixpanel MCP tools accept `where` (filter) and `on` (group by) parameters using Mixpanel's expression syntax.

### Filter Expressions (`where`)

```
properties["tenant"] == "chime"
properties["organizationName"] == "Chime Support"
properties["$browser"] == "Chrome"
properties["userEmail"] != ""
properties["dashboardName"] == "QA Performance"
```

**Operators:**
- `==` — equals
- `!=` — not equals
- `>`, `<`, `>=`, `<=` — numeric comparison
- `in` — value is in a list: `properties["tenant"] in ["chime", "airbnb"]`
- `not in` — value is not in a list
- `defined` — property exists: `defined(properties["conversationId"])`
- `not defined` — property does not exist: `not defined(properties["conversationId"])`

**Combining:**
```
properties["tenant"] == "chime" and properties["$browser"] == "Chrome"
properties["organizationName"] == "Support" or properties["organizationName"] == "Sales"
```

### Group By Expressions (`on`)

```
properties["tenant"]
properties["organizationName"]
properties["$browser"]
properties["userEmail"]
properties["workerName"]
properties["dashboardName"]
properties["integrationType"]
```

Use `on` with `Run-Segmentation-Query` to break down event counts by a property value.
