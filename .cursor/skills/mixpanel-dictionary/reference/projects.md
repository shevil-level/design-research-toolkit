# Mixpanel Projects

All projects accessible to the authenticated user. Use `project_id` in every MCP tool call.

Last updated: 2026-02-20

---

## Production Projects (use these for real data)

| Project | ID | Workspace | Workspace ID | Use For |
|---|---|---|---|---|
| **level-prod** | **2995973** | All Project Data | 3514793 | **Default** — all production analytics queries |
| SR App Prod | 3090428 | All Project Data | 3605500 | Screen Recording app production data |
| BOT-Prod | 3506184 | All Project Data | 4007980 | Virtual Agent / bot production data |
| Heap: Historical Data | 3006848 | All Project Data | 3525340 | Historical data imported from Heap |

## Development / Staging (not for production queries)

| Project | ID | Workspace | Workspace ID | Notes |
|---|---|---|---|---|
| level-dev | 2898872 | All Project Data | 3428076 | Development |
| level-stage | 2995952 | All Project Data | 3514780 | Staging |
| SR App Stage | 3086896 | All Project Data | 3602060 | Screen Recording staging |
| BOT-Stagex | 3505348 | All Project Data | 4007160 | Virtual Agent staging |

## Default

Unless specified otherwise, always use **level-prod** (`project_id: 2995973`). This contains all production event tracking for the Level AI web application.
