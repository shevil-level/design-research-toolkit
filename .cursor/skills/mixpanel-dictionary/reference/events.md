# Mixpanel Event Catalog — Level AI

Master catalog of all tracked events in **level-prod** (project ID: `2995973`).
Events are grouped by product domain. Each entry includes the exact event name (use as-is in MCP tool calls), a description, key event-specific properties, and suggested uses.

Last updated: 2026-02-20
Total events: 255

---

## Quality Assessment & Evaluations

Events related to QA scorecards (rubrics), evaluations, disputes, Instascore, and the evaluation workflow.

### `Accept Conversation`
Agent or evaluator accepts a conversation for evaluation.
- **Key properties:** `conversationId`, `user`
- **Useful for:** Acceptance rates, evaluator workload
- **Related events:** `Evaluation Started`, `Convo Submit Evaluation`

### `Accept Disputed Question`
Evaluator accepts a disputed question during QA review.
- **Key properties:** `conversationId`, `question`, `questionId`, `user`
- **Useful for:** Dispute resolution rates, QA accuracy
- **Related events:** `Reject Disputed Question`, `Dispute Question`, `Dispute Conversation`

### `Reject Disputed Question`
Evaluator rejects a dispute raised on a question.
- **Key properties:** (common only)
- **Useful for:** Dispute resolution outcomes
- **Related events:** `Accept Disputed Question`, `Dispute Question`

### `Dispute Question`
Agent raises a dispute on a specific evaluation question.
- **Key properties:** `comment`, `conversationId`, `question`, `questionId`, `user`
- **Useful for:** Dispute volume, dispute reasons, per-question dispute rates
- **Related events:** `Accept Disputed Question`, `Reject Disputed Question`

### `Dispute Conversation`
Agent disputes an entire conversation evaluation.
- **Key properties:** (common only)
- **Useful for:** Full-evaluation dispute rates
- **Related events:** `Dispute Question`

### `Evaluation Started`
User begins evaluating a conversation.
- **Key properties:** `componentType`
- **Useful for:** Evaluation volume, time-to-evaluate (pair with `Convo Submit Evaluation`)
- **Related events:** `Convo Submit Evaluation`, `Evaluation Delete`

### `Evaluation Delete`
User deletes an evaluation.
- **Key properties:** (common only)
- **Useful for:** Evaluation discard rates

### `Evaluation Evaluator Change`
Evaluation is reassigned to a different evaluator.
- **Key properties:** (common only)
- **Useful for:** Evaluator workload rebalancing

### `Evaluation Replace Conversation`
Evaluator replaces the conversation assigned for evaluation.
- **Key properties:** (common only)
- **Useful for:** Replacement rates, replacement reasons

### `Evaluation Bulk Action Performed`
Bulk action performed on multiple evaluations.
- **Key properties:** (common only)
- **Useful for:** Bulk workflow adoption

### `Evaluation Action Performed from Review Page`
Action taken on an evaluation from the review page.
- **Key properties:** (common only)
- **Useful for:** Review page engagement

### `Evaluation Review Page Open`
User opens the evaluation review page.
- **Key properties:** (common only)
- **Useful for:** Review page traffic, funnel step

### `Evaluation Review Page Close`
User closes the evaluation review page.
- **Key properties:** (common only)
- **Useful for:** Time-on-page (pair with Open)

### `Evaluation Review Page Navigate`
User navigates within the evaluation review page.
- **Key properties:** (common only)
- **Useful for:** Review page navigation patterns

### `Evaluation Pagination Used`
User paginates through evaluations.
- **Key properties:** (common only)
- **Useful for:** Evaluation volume per session

### `Convo Submit Evaluation`
User submits a completed evaluation.
- **Key properties:** (common only)
- **Useful for:** Evaluation completion rates, submission volume
- **Related events:** `Evaluation Started`

### `Convo Accept Evaluation`
Agent accepts a submitted evaluation.
- **Key properties:** (common only)
- **Useful for:** Acceptance rates
- **Related events:** `Convo Dispute Evaluation`

### `Convo Dispute Evaluation`
Agent disputes a submitted evaluation.
- **Key properties:** (common only)
- **Useful for:** Dispute rates
- **Related events:** `Convo Accept Evaluation`

### `Answers changed`
User changes answers during evaluation.
- **Key properties:** (common only)
- **Useful for:** Answer revision frequency

### `Evidence edited`
User edits evidence attached to an evaluation.
- **Key properties:** (common only)
- **Useful for:** Evidence editing patterns

### `Evidence Found`
Evidence is found for an evaluation question.
- **Key properties:** (common only)
- **Useful for:** Evidence coverage rates

### `No Evidence Found`
No evidence found for an evaluation question.
- **Key properties:** (common only)
- **Useful for:** Evidence gap analysis

### `Update Options`
User updates answer options during evaluation.
- **Key properties:** (common only)
- **Useful for:** Option customization usage

### `Auto QA feedback`
User provides feedback on an Auto QA result.
- **Key properties:** (common only)
- **Useful for:** AutoQA feedback volume, accuracy signals

### `Auto QA negative feedback`
User provides negative feedback on Auto QA.
- **Key properties:** (common only)
- **Useful for:** AutoQA dissatisfaction, accuracy issues

### `Mark As Reviewed`
User marks a conversation as reviewed.
- **Key properties:** (common only)
- **Useful for:** Review completion tracking

### `Accuracy Page View`
User views the QA accuracy page.
- **Key properties:** (common only)
- **Useful for:** Accuracy feature adoption

### `View Accuracy Report Details`
User views detailed accuracy report.
- **Key properties:** (common only)
- **Useful for:** Deep accuracy analysis engagement

### `Instascore tab click`
User clicks the Instascore tab.
- **Key properties:** (common only)
- **Useful for:** Instascore feature adoption

---

## Rubric Builder & Settings

Events related to creating and editing QA rubrics (scorecards).

### `Rubric Edited`
User edits a rubric configuration.
- **Key properties:** (common only)
- **Useful for:** Rubric modification frequency, active rubric management

### `Rubric add new question`
User adds a new question to a rubric.
- **Key properties:** (common only)
- **Useful for:** Rubric complexity growth

### `Rubric auto qa setup toggled`
User toggles Auto QA setup on a rubric question.
- **Key properties:** (common only)
- **Useful for:** AutoQA adoption in rubric builder

### `Rubric question assignment rule add click`
User adds an assignment rule to a rubric question.
- **Key properties:** (common only)
- **Useful for:** Assignment rule configuration

### `Rubric settings click`
User clicks rubric settings.
- **Key properties:** (common only)
- **Useful for:** Rubric settings engagement

### `Settings Rubric Builder Page Visit`
User visits the Rubric Builder settings page.
- **Key properties:** (common only)
- **Useful for:** Rubric Builder page traffic

### `Settings QA Case Assignment Page Visit`
User visits the QA Case Assignment settings page.
- **Key properties:** (common only)
- **Useful for:** Case Assignment settings engagement

---

## Agent Coaching

Events related to coaching sessions, templates, and the coaching workflow.

### `Agent coaching - Add to coached interactions click`
User adds an interaction to a coaching session.
- **Key properties:** (common only)
- **Useful for:** Coaching content curation

### `Agent coaching - Coaching session comment add click`
User adds a comment to a coaching session.
- **Key properties:** (common only)
- **Useful for:** Coaching engagement depth

### `Agent coaching - Coaching session template change`
User changes the coaching session template.
- **Key properties:** (common only)
- **Useful for:** Template usage patterns

### `Agent coaching - Coaching session visibility change`
User changes coaching session visibility (public/private).
- **Key properties:** `visibility`
- **Useful for:** Session sharing patterns

### `Agent coaching - Find interactions tab click`
User clicks the "Find Interactions" tab in coaching.
- **Key properties:** (common only)
- **Useful for:** Interaction discovery usage

### `Agent coaching - Find interactions to coach panel filter applied`
User applies filters to find coachable interactions.
- **Key properties:** `name`, `value`
- **Useful for:** Coaching search filter usage

### `Agent coaching - Finish coaching and share note click`
User finishes coaching and shares the note.
- **Key properties:** (common only)
- **Useful for:** Coaching session completion rates

### `Coaching Landing Page Visit`
User visits the coaching landing page.
- **Key properties:** (common only)
- **Useful for:** Coaching feature traffic

### `Coaching Agent Page Visit`
User visits a specific agent's coaching page.
- **Key properties:** (common only)
- **Useful for:** Per-agent coaching engagement

### `Coaching Session Page Visit`
User visits a coaching session page.
- **Key properties:** (common only)
- **Useful for:** Session page traffic

### `Coaching Session Open`
User opens a coaching session.
- **Key properties:** `session`
- **Useful for:** Session open rates
- **Related events:** `Coaching Session Started`, `Coaching Session Completed`

### `Coaching Session Started`
Coaching session is started.
- **Key properties:** (common only)
- **Useful for:** Session start volume

### `Coaching Session Completed`
Coaching session is completed.
- **Key properties:** `session`
- **Useful for:** Session completion rates, coaching workflow
- **Related events:** `Coaching Session Started`, `Coaching Session Open`

### `Convo Add to Coaching Session`
User adds a conversation to a coaching session from the conversation view.
- **Key properties:** (common only)
- **Useful for:** Coaching content discovery from conversations

### `DETECT_AGENT_COACHING_NEW_SESSION_BUTTON_CLICK`
User clicks "New Session" button in agent coaching.
- **Key properties:** (common only)
- **Useful for:** New coaching session initiation

### `DETECT_AGENT_COACHING_SHARE_NOTES_BUTTON_CLICK`
User clicks "Share Notes" button in coaching.
- **Key properties:** (common only)
- **Useful for:** Note sharing engagement

### `DETECT_COACH_PAGE_VISIT`
User visits the coach page (detection event).
- **Key properties:** (common only)
- **Useful for:** Coach page visit tracking

### `Run Coach Worker`
User runs the Coach AI Worker.
- **Key properties:** (common only)
- **Useful for:** AI Coach Worker adoption

---

## Analytics & Dashboards

Events related to the Analytics module, charts, dashboards, Query Builder, and OOTB dashboards.

### `AN Chart Expanded View`
User expands an analytics chart to full view.
- **Key properties:** `dashboardName`
- **Useful for:** Chart engagement, popular charts

### `AN Chart timeperiod dropdown click`
User changes the time period on a chart.
- **Key properties:** `time_period`
- **Useful for:** Preferred time periods, chart interaction

### `AN Coworker > Ask AI closed`
User closes the Ask AI panel in Analytics.
- **Key properties:** (common only)
- **Useful for:** Ask AI feature usage

### `AN Export Chart from QB`
User exports a chart from Query Builder.
- **Key properties:** (common only)
- **Useful for:** Export feature adoption

### `AN Instascore Dashboard Page View`
User views the Instascore dashboard.
- **Key properties:** `dashboardId`, `dashboardName`
- **Useful for:** Instascore dashboard traffic

### `AN New Chart Click via Analytics Homepage`
User clicks "New Chart" from the Analytics homepage.
- **Key properties:** (common only)
- **Useful for:** Chart creation initiation

### `AN New Dashboard Click`
User clicks "New Dashboard" in Analytics.
- **Key properties:** (common only)
- **Useful for:** Dashboard creation initiation

### `AN OOTB Apply filter`
User applies a filter on an out-of-the-box dashboard.
- **Key properties:** `filters`
- **Useful for:** OOTB filter usage patterns

### `AN OOTB More filter`
User opens additional filters on an OOTB dashboard.
- **Key properties:** (common only)
- **Useful for:** Filter exploration

### `AN QA Auditor Page View`
User views the QA Auditor dashboard.
- **Key properties:** `dashboardId`, `dashboardName`
- **Useful for:** QA Auditor dashboard traffic

### `AN QA Performance Dashboard Page View`
User views the QA Performance dashboard.
- **Key properties:** `dashboardId`, `dashboardName`
- **Useful for:** QA Performance dashboard traffic

### `AN Coaching Dashboard Page View`
User views the Coaching dashboard in Analytics.
- **Key properties:** (common only)
- **Useful for:** Coaching analytics traffic

### `AN Run Query Clicks`
User runs a query in Query Builder.
- **Key properties:** (common only)
- **Useful for:** Query Builder usage, query volume

### `AN Save As Clicks`
User saves a query/chart in Analytics.
- **Key properties:** (common only)
- **Useful for:** Content creation rates

### `AN Update Chart Clicks`
User updates an existing chart.
- **Key properties:** (common only)
- **Useful for:** Chart modification frequency

### `Analytics Chart > Excel btn clicked`
User clicks the Excel export button on a chart.
- **Key properties:** `name`, `tabName`
- **Useful for:** Excel export adoption

### `Analytics Chart Interaction`
User interacts with an analytics chart (click, hover, etc.).
- **Key properties:** (common only)
- **Useful for:** Chart engagement depth

### `Analytics Chart Popover opened`
User opens a popover on an analytics chart.
- **Key properties:** (common only)
- **Useful for:** Drill-down feature usage

### `Analytics Home Search Bar Focus`
User focuses the search bar on the Analytics homepage.
- **Key properties:** (common only)
- **Useful for:** Analytics search intent

### `Analytics Home Search Done`
User completes a search on the Analytics homepage.
- **Key properties:** (common only)
- **Useful for:** Analytics search volume

### `Analytics Page Click`
User clicks on the Analytics page.
- **Key properties:** (common only)
- **Useful for:** Analytics page engagement

### `Analytics Query Builder Page Visit`
User visits the Query Builder page.
- **Key properties:** (common only)
- **Useful for:** Query Builder traffic

### `Chart Visualization Change`
User changes the visualization type of a chart.
- **Key properties:** (common only)
- **Useful for:** Preferred visualization types

### `Custom Dashboard Page View`
User views a custom dashboard.
- **Key properties:** `dashboardId`, `dashboardName`
- **Useful for:** Custom dashboard traffic, popular dashboards

### `Custom dashboard filter applied directly`
User applies a filter directly on a custom dashboard.
- **Key properties:** (common only)
- **Useful for:** Custom dashboard filter usage

### `Custom dashboard filter from popup applied`
User applies a filter from a popup on a custom dashboard.
- **Key properties:** (common only)
- **Useful for:** Custom dashboard filter usage

### `Drill down started`
User initiates a drill-down on a chart data point.
- **Key properties:** (common only)
- **Useful for:** Drill-down feature adoption

### `Expanded View Landing`
User lands on an expanded chart view.
- **Key properties:** (common only)
- **Useful for:** Expanded view traffic

### `Heatmap V2 > Slider changed`
User changes the slider on Heatmap V2.
- **Key properties:** (common only)
- **Useful for:** Heatmap interaction

### `Insight Dashboard V2 > Interactive table loaded`
Interactive table loads on Insight Dashboard V2.
- **Key properties:** (common only)
- **Useful for:** Dashboard load performance

### `Open conversation Detail Page from AN table`
User opens a conversation from an Analytics table.
- **Key properties:** (common only)
- **Useful for:** Analytics-to-conversation drill-down

### `Query builder measures`
User selects measures in Query Builder.
- **Key properties:** (common only)
- **Useful for:** Popular measures

---

## Voice of Customer (VoC)

Events related to VoC 2.0 analysis.

### `VOCv2 - View Page`
User views a VoC 2.0 page.
- **Key properties:** `page_name`
- **Useful for:** VoC page traffic, feature adoption

### `VOCv2 - Apply Global Filters`
User applies global filters in VoC 2.0.
- **Key properties:** (common only)
- **Useful for:** VoC filter usage

### `VOCv2 - View Conversation List`
User views the conversation list in VoC 2.0.
- **Key properties:** (common only)
- **Useful for:** VoC drill-down engagement

---

## Agent Assist & Knowledge

Real-time agent assist events. These typically use ALL_CAPS naming and track push-based interactions during live conversations.

### `SEARCH`
Agent searches in Agent Assist.
- **Key properties:** `queryInputMethod`, `searchQuery`, `userEmail`
- **Useful for:** Search volume, query patterns, search method distribution

### `CHAT_WITH_KB_RESPONSE`
Agent receives a response from Knowledge Base chat.
- **Key properties:** `convoId`, `response`, `searchQuery`, `userEmail`
- **Useful for:** KB chat usage, response quality analysis

### `CHAT_WITH_KB_FOLLOW_UPS`
Agent sends a follow-up in KB chat.
- **Key properties:** (common only)
- **Useful for:** Multi-turn KB conversation depth

### `CHAT_WITH_KB_LATENCY`
Tracks latency of KB chat responses.
- **Key properties:** (common only)
- **Useful for:** KB response time monitoring

### `CHAT_WITH_KB_SOURCE_CLICK`
Agent clicks a source link in KB chat response.
- **Key properties:** (common only)
- **Useful for:** Source reference engagement

### `CHAT_WITH_KB_SOURCES_EXPANDED`
Agent expands sources in KB chat.
- **Key properties:** (common only)
- **Useful for:** Source exploration

### `CHAT_WITH_KB_THUMBS_UP`
Agent gives thumbs up to KB chat response.
- **Key properties:** (common only)
- **Useful for:** KB response quality signal

### `KNOWLEDGE_CARD_PUSHED`
Knowledge card is pushed to an agent during a live conversation.
- **Key properties:** `batchId`, `cardId`, `cardType`, `rank`, `sessionId`, `title`, `userEmail`, `type`, `channelId`, `pusherEventId`
- **Useful for:** Card push volume, card types, push timing

### `KNOWLEDGE_CARD_FETCHED`
Knowledge card is fetched (pre-push).
- **Key properties:** (common only)
- **Useful for:** Card fetch vs push ratio

### `KNOWLEDGE_QUERY_PUSHED`
Knowledge query is pushed to assist an agent.
- **Key properties:** (common only)
- **Useful for:** Query-based assist volume

### `FLAG_CARD_PUSHED`
Flag card is pushed to an agent.
- **Key properties:** (common only)
- **Useful for:** Real-time flag alerting

### `TIP_CARD_PUSHED`
Tip card is pushed to an agent.
- **Key properties:** (common only)
- **Useful for:** Coaching tip delivery

### `SMART_SUGGESTION_PUSHED`
Smart suggestion is pushed to an agent.
- **Key properties:** (common only)
- **Useful for:** Smart suggestion volume

### `PUSH_CARD_DELETE`
Agent deletes a pushed card.
- **Key properties:** (common only)
- **Useful for:** Card dismissal rates

### `PUSH_THUMBS_UP`
Agent gives thumbs up to a pushed card.
- **Key properties:** (common only)
- **Useful for:** Card quality signal

### `THUMBS_UP`
General thumbs up feedback.
- **Key properties:** (common only)
- **Useful for:** Positive feedback volume

### `SIMILAR_QUERY_FETCHED`
Similar query suggestions are fetched.
- **Key properties:** (common only)
- **Useful for:** Query suggestion relevance

### `SIMILAR_QUERY_FETCHED_AFTER_RESPONSE`
Similar queries fetched after a response is shown.
- **Key properties:** (common only)
- **Useful for:** Follow-up suggestion engagement

### `LINK_CLICK`
Agent clicks a link in Agent Assist.
- **Key properties:** (common only)
- **Useful for:** Link engagement in assist content

### `CURRENT_ACTIVE_CHAT_PUSHED`
Active chat context is pushed to Agent Assist.
- **Key properties:** (common only)
- **Useful for:** Real-time context push volume

### `CONVERSATION_STARTED`
Conversation starts (Agent Assist context).
- **Key properties:** (common only)
- **Useful for:** Conversation initiation tracking

### `PUSHER_SUBSCRIPTION`
Pusher subscription established for real-time events.
- **Key properties:** (common only)
- **Useful for:** Real-time connection health

### `Convo Assist Flags Clicked`
User clicks assist flags on a conversation.
- **Key properties:** (common only)
- **Useful for:** Flag review engagement

### `Ask Search Analyst Clicked on IH Page`
User clicks "Ask Search Analyst" on Interaction History page.
- **Key properties:** (common only)
- **Useful for:** Search Analyst Worker adoption from IH

### `Search Analyst Response without Evidence on IH Page`
Search Analyst returns no evidence on IH page.
- **Key properties:** (common only)
- **Useful for:** Search Analyst coverage gaps

---

## Checklists

Events related to the Checklist feature in Agent Assist.

### `CHECKLISTS_PUSHED`
Checklists pushed to an agent during a conversation.
- **Key properties:** (common only)
- **Useful for:** Checklist delivery volume

### `CHECKLIST_ITEMS_PUSHED`
Checklist items pushed to an agent.
- **Key properties:** (common only)
- **Useful for:** Item-level delivery

### `CHECKLIST_ITEM_CHECKED_AI`
Checklist item automatically checked by AI.
- **Key properties:** (common only)
- **Useful for:** AI auto-check rates

### `CHECKLIST_ITEM_CHECKED_MANUALLY`
Checklist item manually checked by agent.
- **Key properties:** (common only)
- **Useful for:** Manual completion rates

---

## Summaries

Events related to AI-generated conversation summaries.

### `SUMMARY_PUSHED`
Summary pushed to user.
- **Key properties:** (common only)
- **Useful for:** Summary delivery volume

### `SUMMARY_OPENED`
User opens a pushed summary.
- **Key properties:** (common only)
- **Useful for:** Summary open rates

### `SUMMARY_COPIED`
User copies a summary.
- **Key properties:** (common only)
- **Useful for:** Summary utility

### `SUMMARY_TEXT_EDIT`
User edits a summary.
- **Key properties:** (common only)
- **Useful for:** Summary accuracy (edits suggest corrections)

### `SUMMARY_WRITE_BACK_SUCCESS`
Summary write-back to CRM succeeds.
- **Key properties:** (common only)
- **Useful for:** Write-back success rates

### `SUMMARY_WRITE_BACK_FAIL`
Summary write-back to CRM fails.
- **Key properties:** (common only)
- **Useful for:** Write-back failure monitoring

### `LIVE_SUMMARY_PUSHED`
Live summary pushed during active conversation.
- **Key properties:** (common only)
- **Useful for:** Live summary delivery

### `LIVE_SUMMARY_OPENED`
User opens a live summary.
- **Key properties:** (common only)
- **Useful for:** Live summary engagement

### `LIVE_SUMMARY_COPIED`
User copies a live summary.
- **Key properties:** (common only)
- **Useful for:** Live summary utility

### `LIVE_SUMMARY_LATENCY`
Tracks live summary generation latency.
- **Key properties:** (common only)
- **Useful for:** Live summary performance

### `Convo Show Summary`
User shows summary on conversation detail page.
- **Key properties:** (common only)
- **Useful for:** Summary viewing from conversation

### `Convo Summary Expand`
User expands a conversation summary.
- **Key properties:** (common only)
- **Useful for:** Summary deep-read

### `Convo Summary Copy`
User copies a conversation summary.
- **Key properties:** (common only)
- **Useful for:** Summary sharing

### `Convo Summary Open State`
Summary is in open state on conversation page.
- **Key properties:** (common only)

### `Convo Summary Close State`
Summary is in closed state on conversation page.
- **Key properties:** (common only)

---

## Sentiment & AI Scores

Events related to AI-powered scoring (sentiment, CES, iCSAT, resolution).

### `SENTIMENT_SCORE_PUSHED`
Sentiment score pushed for a conversation.
- **Key properties:** (common only)
- **Useful for:** Sentiment scoring volume

### `SENTIMENT_SCORE_EXPANDED`
User expands sentiment score details.
- **Key properties:** (common only)
- **Useful for:** Sentiment detail engagement

### `SENTIMENT_SCORE_COLLAPSED`
User collapses sentiment score details.
- **Key properties:** (common only)
- **Useful for:** Interaction pattern

### `Conversation CES Tab View`
User views the Customer Effort Score tab on a conversation.
- **Key properties:** (common only)
- **Useful for:** CES feature adoption

### `Conversation Resolution Tab View`
User views the Resolution tab on a conversation.
- **Key properties:** (common only)
- **Useful for:** Resolution score feature adoption

### `Convo iCSAT Breakdown Tab Click`
User clicks iCSAT breakdown tab on a conversation.
- **Key properties:** (common only)
- **Useful for:** iCSAT deep-dive adoption

---

## Conversation Detail & Interaction History

Events related to viewing and navigating conversations and the Interaction History (IH) screen.

### `Conversation Details Page Visit`
User visits a conversation detail page.
- **Key properties:** `agentId`, `conversationId`, `hasScreenRecording`, `integrationType`
- **Useful for:** Conversation view volume, integration breakdown, screen recording coverage

### `Conversation History Page Visit`
User visits conversation history.
- **Key properties:** (common only)
- **Useful for:** History page traffic

### `IH Click Conversation`
User clicks a conversation in Interaction History.
- **Key properties:** `id`
- **Useful for:** IH-to-conversation funnel

### `IH More Filter`
User opens more filters on IH.
- **Key properties:** (common only)
- **Useful for:** Advanced filter usage

### `IH Search Filter`
User uses the search filter on IH.
- **Key properties:** (common only)
- **Useful for:** Search behavior on IH

### `IH Transcript Search`
User searches within transcripts on IH.
- **Key properties:** (common only)
- **Useful for:** Transcript search adoption

### `IH Add Column`
User adds a column to IH view.
- **Key properties:** (common only)
- **Useful for:** Column customization

### `IH Remove Column`
User removes a column from IH view.
- **Key properties:** (common only)
- **Useful for:** Column customization

### `IH Hit Recent Search`
User clicks a recent search on IH.
- **Key properties:** (common only)
- **Useful for:** Recent search usage

### `IH Query Search Agent Name`
User searches by agent name on IH.
- **Key properties:** (common only)
- **Useful for:** Agent-specific search patterns

### `IH Query Search Agent Email`
User searches by agent email on IH.
- **Key properties:** (common only)
- **Useful for:** Agent-specific search patterns

### `IH Query Search Conversation ID`
User searches by conversation ID on IH.
- **Key properties:** (common only)
- **Useful for:** Direct conversation lookup

### `IH Query Search Conversation Metadata`
User searches by conversation metadata on IH.
- **Key properties:** (common only)
- **Useful for:** Metadata search patterns

### `IH Query Search Transcript Words`
User searches by transcript words on IH.
- **Key properties:** (common only)
- **Useful for:** Transcript keyword search

### `IH Query Search Both Transcripts And Metadata`
User searches both transcripts and metadata.
- **Key properties:** (common only)
- **Useful for:** Combined search patterns

### `IH Query Search Use Dropdown Operator`
User uses a dropdown operator in IH search.
- **Key properties:** (common only)
- **Useful for:** Advanced search operator adoption

### `IH_HoverSummary`
User hovers over a summary in IH.
- **Key properties:** (common only)
- **Useful for:** Summary preview engagement

### `Apply Interaction History filters`
User applies filters on Interaction History.
- **Key properties:** `filters`
- **Useful for:** Filter usage patterns, popular filters

### `Apply Journey List filters`
User applies filters on Journey list.
- **Key properties:** (common only)
- **Useful for:** Journey filtering behavior

### `Hit Advance Search Query`
User executes an advanced search query.
- **Key properties:** (common only)
- **Useful for:** Advanced search adoption

### `Hit Advance Search Query AND Operator`
User uses AND operator in advanced search.
- **Key properties:** (common only)
- **Useful for:** Complex query construction

### `Query Advance Search Opened`
User opens advanced search panel.
- **Key properties:** (common only)
- **Useful for:** Advanced search initiation

### `Query Advance Search Closed`
User closes advanced search panel.
- **Key properties:** (common only)
- **Useful for:** Advanced search session patterns

### `Detect Column Customization Click On IH`
User clicks column customization on IH.
- **Key properties:** (common only)
- **Useful for:** Column customization engagement

### `Detect Reorder Of Column On IH`
User reorders columns on IH.
- **Key properties:** (common only)
- **Useful for:** Column layout preferences

### `Detect Total Reordered Columns Per Popup Session On IH`
Total column reorders in a single popup session.
- **Key properties:** (common only)
- **Useful for:** Column reordering depth

### `DETECT_INTERACTION_HISTORY_CHANGE_COLUMNS_VIEW`
User changes column view on IH.
- **Key properties:** (common only)
- **Useful for:** View customization

### `DETECT_INTERACTION_HISTORY_CHANGE_FILTERS_VIEW`
User changes filter view on IH.
- **Key properties:** (common only)

### `DETECT_INTERACTION_HISTORY_CREATE_FILTERS_VIEW`
User creates a new filter view on IH.
- **Key properties:** (common only)

### `DETECT_INTERACTION_HISTORY_UPDATE_FILTERS_VIEW`
User updates an existing filter view on IH.
- **Key properties:** (common only)

---

## Conversation Review & Playback

Events related to reviewing conversation content, playing recordings, and navigating conversations.

### `Convo Play Recording Audio`
User plays conversation audio recording.
- **Key properties:** (common only)
- **Useful for:** Audio playback adoption

### `Convo Play Recording Video`
User plays conversation video recording.
- **Key properties:** (common only)
- **Useful for:** Video playback adoption

### `Convo Play Snippet`
User plays a conversation snippet.
- **Key properties:** (common only)
- **Useful for:** Snippet playback engagement

### `Convo Click Next`
User clicks next in conversation navigation.
- **Key properties:** (common only)
- **Useful for:** Multi-conversation workflow

### `Convo Click Prev`
User clicks previous in conversation navigation.
- **Key properties:** (common only)
- **Useful for:** Multi-conversation workflow

### `Convo Smart Skip Next`
User uses smart skip to go to next conversation.
- **Key properties:** (common only)
- **Useful for:** Smart skip adoption

### `Convo Smart Skip Previous`
User uses smart skip to go to previous conversation.
- **Key properties:** (common only)
- **Useful for:** Smart skip adoption

### `Convo Search Results`
Search results shown within conversation.
- **Key properties:** (common only)
- **Useful for:** In-conversation search

### `Convo Select Snippets`
User selects conversation snippets.
- **Key properties:** (common only)
- **Useful for:** Snippet selection patterns

### `Convo Share`
User shares a conversation.
- **Key properties:** (common only)
- **Useful for:** Sharing behavior

### `Convo Show Metadata`
User shows conversation metadata.
- **Key properties:** (common only)
- **Useful for:** Metadata viewing

### `Convo Show Timeline`
User shows conversation timeline.
- **Key properties:** (common only)
- **Useful for:** Timeline feature adoption

### `Convo Key Event Clicked`
User clicks a key event on a conversation.
- **Key properties:** (common only)
- **Useful for:** Key event engagement

### `Convo Key Events Clicked`
User clicks key events panel on a conversation.
- **Key properties:** (common only)
- **Useful for:** Key events panel usage

### `Convo Add Action`
User adds an action item to a conversation.
- **Key properties:** (common only)
- **Useful for:** Action item creation

### `Convo_ClickonSnippet`
User clicks on a snippet.
- **Key properties:** (common only)
- **Useful for:** Snippet engagement

### `Clicked on key conversation`
User clicks on a key conversation.
- **Key properties:** (common only)
- **Useful for:** Key conversation engagement

### `Short Convo Url Copied`
User copies a short conversation URL.
- **Key properties:** (common only)
- **Useful for:** URL sharing adoption

### `Short Convo Url Opened`
User opens a short conversation URL.
- **Key properties:** (common only)
- **Useful for:** Shared URL traffic

### `Transcript Section Expanded`
User expands a transcript section.
- **Key properties:** (common only)
- **Useful for:** Transcript navigation

### `Transcript Section Collapsed`
User collapses a transcript section.
- **Key properties:** (common only)
- **Useful for:** Transcript navigation

### `TRANSCRIPT_PUSHED`
Transcript pushed to user.
- **Key properties:** (common only)
- **Useful for:** Transcript delivery

### `TRANSCRIPT_MAXIMIZED`
User maximizes transcript view.
- **Key properties:** (common only)
- **Useful for:** Full transcript engagement

### `Media Paused/Played With Keyboard Shortcut`
User pauses/plays media using keyboard shortcut.
- **Key properties:** (common only)
- **Useful for:** Power user behavior

---

## Screen Recording

Events related to the screen recording feature.

### `SR Video Watch Time`
Tracks time spent watching a screen recording.
- **Key properties:** `agentId`, `conversationDuration`, `conversationId`, `hasScreenRecording`, `videoDuration`, `watchTime`, `integrationType`, `audioDuration`
- **Useful for:** Watch time analysis, engagement depth, video completion rates

### `SR Click Fullscreen`
User clicks fullscreen on screen recording.
- **Key properties:** (common only)
- **Useful for:** Fullscreen adoption

### `SR Click Open New Tab`
User opens screen recording in new tab.
- **Key properties:** (common only)
- **Useful for:** New tab viewing preference

### `SR Playback Change`
User changes playback settings.
- **Key properties:** (common only)
- **Useful for:** Playback preferences

### `SR Video Backward`
User rewinds screen recording.
- **Key properties:** (common only)
- **Useful for:** Rewind behavior

### `SR Video Forward`
User fast-forwards screen recording.
- **Key properties:** (common only)
- **Useful for:** Fast-forward behavior

### `SR Video Seeked`
User seeks to a specific point in screen recording.
- **Key properties:** (common only)
- **Useful for:** Navigation behavior

---

## AI Workers

Events related to AI Workers (automated analysis agents).

### `Open AI Worker`
User opens an AI Worker.
- **Key properties:** `workerAppType`, `workerId`, `workerName`
- **Useful for:** Worker discovery, popular workers

### `Run AI Worker`
User runs an AI Worker.
- **Key properties:** `source`, `parameters`, `parametersData`, `prompt`, `workerAppType`, `workerId`, `workerName`, `asrLogId`, `conversationId`
- **Useful for:** Worker execution volume, worker types, prompt analysis

### `Query Started`
AI Worker query starts.
- **Key properties:** (common only)
- **Useful for:** Query initiation tracking

### `Query Completed`
AI Worker query completes.
- **Key properties:** `timestamp`, `workerId`, `workerName`
- **Useful for:** Query completion rates, latency (pair with Query Started)

### `Query Response`
AI Worker returns a response.
- **Key properties:** (common only)
- **Useful for:** Response delivery

### `Reasoning Started`
AI reasoning process starts.
- **Key properties:** (common only)
- **Useful for:** Reasoning pipeline monitoring

### `Reasoning Completed`
AI reasoning process completes.
- **Key properties:** (common only)
- **Useful for:** Reasoning completion rates

### `Follow Up Query`
User asks a follow-up query.
- **Key properties:** (common only)
- **Useful for:** Multi-turn AI conversation depth

### `Open Recent Thread`
User opens a recent AI Worker thread.
- **Key properties:** (common only)
- **Useful for:** Thread re-engagement

### `AUTO_FILL_QUERY_PUSHED`
Auto-fill query suggestion pushed to user.
- **Key properties:** (common only)
- **Useful for:** Auto-fill adoption

---

## Calibration

Events related to QA calibration sessions.

### `Calibration Session Open`
User opens a calibration session.
- **Key properties:** `session`
- **Useful for:** Calibration engagement

### `Private Calibration Pagination Used`
User paginates through private calibrations.
- **Key properties:** (common only)
- **Useful for:** Private calibration usage

### `DETECT_PRIVATE_CALIBRATION_TAB_CLICK`
User clicks the Private Calibration tab.
- **Key properties:** (common only)
- **Useful for:** Private calibration feature adoption

---

## Libraries

Events related to the Conversation Library feature.

### `Add to Lbrary Click`
User clicks "Add to Library" (note: typo in event name is intentional — use as-is).
- **Key properties:** (common only)
- **Useful for:** Library addition intent

### `Add to Library Save`
User saves a conversation to a library.
- **Key properties:** `channel`, `folderId`
- **Useful for:** Library save rates, channel breakdown

### `Shared Library Click`
User clicks on a shared library.
- **Key properties:** (common only)
- **Useful for:** Shared library engagement

### `Shared Library Conversation Click`
User clicks a conversation in a shared library.
- **Key properties:** (common only)
- **Useful for:** Shared library drill-down

### `Shared library Filters`
User applies filters in a shared library.
- **Key properties:** (common only)
- **Useful for:** Library filtering behavior

---

## Journeys

Events related to Customer Journeys.

### `Journey History Page Visit`
User visits the Journey History page.
- **Key properties:** (common only)
- **Useful for:** Journey feature traffic

---

## Tasks

Events related to the evaluation tasks page.

### `Tasks Page Visit`
User visits the Tasks page.
- **Key properties:** (common only)
- **Useful for:** Task page traffic

### `Task Page Click from left nav`
User clicks Tasks from the left navigation.
- **Key properties:** (common only)
- **Useful for:** Navigation patterns

### `Task Review Page Visit`
User visits the Task Review page.
- **Key properties:** (common only)
- **Useful for:** Task review engagement

### `Detect Column Customization Click On Tasks`
User clicks column customization on Tasks.
- **Key properties:** (common only)
- **Useful for:** Task view customization

### `Detect Reorder Of Column On Tasks`
User reorders columns on Tasks.
- **Key properties:** (common only)
- **Useful for:** Task view preferences

### `Detect Total Reordered Columns Per Popup Session On Tasks`
Total column reorders in a session on Tasks.
- **Key properties:** (common only)
- **Useful for:** Task column reordering depth

---

## Settings & Administration

Events related to settings pages and admin functions.

### `Settings Landing Page Visit`
User visits the Settings landing page.
- **Key properties:** (common only)
- **Useful for:** Settings page traffic

### `Settings Conversations Tags Page Visit`
User visits the Conversation Tags settings.
- **Key properties:** (common only)
- **Useful for:** Conversation Tags configuration

### `Settings Custom Field Page Visit`
User visits the Custom Fields settings.
- **Key properties:** (common only)
- **Useful for:** Custom Fields configuration

### `Settings Integrations Hub Page Visit`
User visits the Integrations Hub settings.
- **Key properties:** (common only)
- **Useful for:** Integrations configuration

### `Settings Teams Page Visit`
User visits the Teams settings.
- **Key properties:** (common only)
- **Useful for:** Team management

### `Settings User Page Visit`
User visits the Users settings.
- **Key properties:** (common only)
- **Useful for:** User management

### `Roles and Permissions Page Visit`
User visits the Roles and Permissions page.
- **Key properties:** (common only)
- **Useful for:** Permission management

### `Super Admin Organization Page Visit`
Super Admin visits the Organization page.
- **Key properties:** (common only)
- **Useful for:** Super Admin activity

### `User Removed`
A user is removed from the system.
- **Key properties:** (common only)
- **Useful for:** User churn

### `Impersonation Details`
User impersonation event.
- **Key properties:** (common only)
- **Useful for:** Impersonation audit trail

### `DETECT OAUTH PAGE VISIT`
OAuth page is visited.
- **Key properties:** (common only)
- **Useful for:** OAuth setup traffic

### `Agent List Filter Applied`
Filter applied on the agent list.
- **Key properties:** `filter`
- **Useful for:** Agent list filtering patterns

---

## Navigation & Platform

General platform navigation, login, homepage, and notification events.

### `$mp_web_page_view`
Mixpanel auto-captured page view (tracks every page load).
- **Key properties:** `current_domain`, `current_page_title`, `current_url_path`, `page`, `agentId`, `conversationId`, `hasScreenRecording`, `integrationType`, `journeyId`
- **Useful for:** Overall platform traffic, page-level usage, user activity

### `Logged-in user`
User successfully logs in.
- **Key properties:** `user`
- **Useful for:** Login volume, DAU/WAU/MAU

### `Logged-in failed`
Login attempt fails.
- **Key properties:** (common only)
- **Useful for:** Login failure rates

### `USER_LOGIN_CHECK`
Login check event.
- **Key properties:** (common only)
- **Useful for:** Auth flow monitoring

### `Home Dashboard Page Visit`
User visits the home dashboard.
- **Key properties:** (common only)
- **Useful for:** Homepage traffic

### `New Home dashboard view`
User views the new home dashboard.
- **Key properties:** (common only)
- **Useful for:** New homepage adoption

### `Home dashboard - other filter change`
User changes a filter on the home dashboard.
- **Key properties:** (common only)
- **Useful for:** Home dashboard filter usage

### `Hyperlink used from HomePage V2`
User clicks a hyperlink on Homepage V2.
- **Key properties:** (common only)
- **Useful for:** Homepage navigation patterns

### `Filter Applied`
Generic filter applied event.
- **Key properties:** `name`, `value`
- **Useful for:** Cross-feature filter usage

### `Load New Data`
New data is loaded (pagination/refresh).
- **Key properties:** (common only)
- **Useful for:** Data loading patterns

### `App Notification Visit`
User visits app notifications.
- **Key properties:** (common only)
- **Useful for:** Notification engagement

### `INAPP_NOTIFICATIONS_ICON_CLICK`
User clicks the notifications icon.
- **Key properties:** (common only)
- **Useful for:** Notification attention

### `INAPP_NOTIFICATION_CLICK`
User clicks an in-app notification.
- **Key properties:** (common only)
- **Useful for:** Notification click-through rates

### `My own reminders tab clicked`
User clicks "My own reminders" tab.
- **Key properties:** (common only)
- **Useful for:** Reminder feature usage

### `My team reminders tab clicked`
User clicks "My team reminders" tab.
- **Key properties:** (common only)
- **Useful for:** Team reminder feature usage

### `Reminder widget link`
User clicks a link in the reminder widget.
- **Key properties:** (common only)
- **Useful for:** Reminder engagement

### `Successful websocket connection`
Websocket connection established successfully.
- **Key properties:** (common only)
- **Useful for:** Connection health monitoring

### `Websocket closed`
Websocket connection closed.
- **Key properties:** (common only)
- **Useful for:** Connection stability

### `Websocket connection failure`
Websocket connection fails.
- **Key properties:** (common only)
- **Useful for:** Connection failure monitoring
