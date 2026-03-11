# Accounts Domain (Users, Teams, Organizations)

**Table prefix:** `accounts_*`, `account_*`
**Colossus table count:** ~34
**Status:** EXPLORED (columns documented from Affirm schema, product concepts from Help Center)

Last updated: 2026-02-19

---

## Product Concept

Level AI is a contact center intelligence platform. Its user management system follows a hierarchy: **Tenant → Organizations → Teams → Users**. A tenant is the top-level domain (e.g., `meta.thelevel.ai`) managed by Super Admins. Within a tenant, multiple **organizational units** can be created (up to 20) to represent different business units, brands, or cost centers — for example, Meta might have organizations for Facebook, Instagram, and Oculus. Each organization has its own integrations, users, teams, settings, and configurations. Only Super Admins can create organizations; Org-level Admins manage users and settings within their own org.

**Users** in Level AI include several types, all stored in a single `accounts_user` table and differentiated by role assignments: **Super Admin** (tenant-wide access, can create organizations), **Admin** (org-level user management, settings), **Manager** (team-level data visibility, dispute/accept evaluations), **QA Auditor** (evaluates conversations, team-level visibility), and **Agent** (sees only own data). Users can hold multiple roles simultaneously, and with Multi-Org support, a single user can belong to multiple organizations with different roles in each. Role assignment can be manual, via CSV upload, or automated through the **Role Engine** (SCIM/Okta integration that applies rules on an hourly schedule).

**Teams** group users within an organization by location, department, or function. Teams can be manually created (with optional dynamic assignment conditions based on CRM user fields), or auto-created from a CRM agent-manager hierarchy (refreshed every 24 hours). Each organization has a "Default" team. The `accounts_team.type` column distinguishes manually-created vs. auto-created teams. Team membership controls data visibility: Managers and QA Auditors see only data from their assigned teams.

**Roles and permissions** follow a two-tier model: **standard roles** (Super Admin, Admin, QA Auditor, Manager, Agent — cannot be modified or deleted) and **custom roles** (cloned from a standard base role, with adjustable data scope and permissions). Each role has a **data scope** (My data / My team data / My org data) and individual **permissions** per module (Dashboard, Analytics, QA, Coaching, etc.). Permissions are tracked in `accounts_custompermission` and linked to roles via `accounts_rolepermission`. Users also support **unified profiles** with primary + secondary emails (up to 10) to consolidate identities across CRM, telephony, and ticketing systems.

---

## Core Tables

### `accounts_user` — Core User Record

**CRITICAL:** This single table holds ALL user types (agents, managers, admins, auditors, super admins). User type is determined by role assignments in `accounts_userrolemapping`, not by any column on this table.

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK, auto-increment |
| `uuid` | uuid | NO | Public unique identifier |
| `email` | varchar | NO | Primary email, used as login and unique identifier for CSV import |
| `first_name` | varchar | NO | Max 30 chars (truncated on CSV import) |
| `last_name` | varchar | NO | Max 30 chars (truncated on CSV import) |
| `password` | varchar | NO | Hashed password |
| `phone_number` | varchar | NO | May be empty string, not NULL |
| `is_active` | boolean | NO | `false` = suspended user (UI "Suspend User Account") |
| `is_superuser` | boolean | NO | Django superuser flag |
| `is_staff` | boolean | NO | Django staff flag |
| `is_new_user` | boolean | NO | Whether user has completed onboarding |
| `date_joined` | timestamptz | NO | When user was created |
| `last_login` | timestamptz | YES | Last login timestamp |
| `modified` | timestamptz | NO | Last modification timestamp |
| `deleted` | timestamptz | YES | Soft delete — NULL = active, non-NULL = deleted |
| `avatar` | varchar | YES | Avatar image path |
| `ext_emp_id` | varchar | YES | External employee ID from CRM/integration |
| `manager_id` | integer | YES | FK → `accounts_user` (self-referencing, CRM manager hierarchy) |
| `organization_id` | integer | YES | FK → `accounts_organization` (current/primary org) |
| `scim_external_id` | varchar | YES | External ID from SCIM/Okta provisioning |
| `persona` | varchar | YES | User persona type |

#### What a Row Represents

One row = one user account across the entire tenant. All user types (agents, managers, QA auditors, admins, super admins) share this table. The user's "type" or "role" is NOT a column here — it is determined by their entries in `accounts_userrolemapping`. A user can have multiple roles simultaneously. The `organization_id` column stores the user's primary/current org, but multi-org membership is tracked via `accounts_userorganizations`.

#### Active Users Filter

```sql
WHERE deleted IS NULL AND is_active = true
```

---

### `accounts_organization` — Organizational Unit

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK, auto-increment |
| `name` | varchar | NO | Organization display name |
| `created` | timestamptz | NO | Created timestamp |
| `modified` | timestamptz | NO | Last modified timestamp |
| `deleted` | timestamptz | YES | Soft delete |
| `created_by` | integer | YES | FK → `accounts_user` (Super Admin who created it) |
| `logo_path` | varchar | YES | Path to org logo image |

#### What a Row Represents

One row = one organizational unit within the tenant. A tenant with "Meta" as the domain might have orgs named "Facebook", "Instagram", "Oculus". Each org has independent integrations, users, teams, QA settings, and configurations. Max 20 orgs per tenant. Only Super Admins can create orgs.

---

### `accounts_team` — Team

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK, auto-increment |
| `name` | varchar | NO | Team display name |
| `type` | smallint | NO | Team type: distinguishes manually-created vs. auto-created teams |
| `default` | boolean | NO | `true` = the "Default" team for this org |
| `sample` | jsonb | NO | Dynamic assignment conditions (CRM field rules for auto-membership) |
| `created` | timestamptz | NO | Created timestamp |
| `modified` | timestamptz | NO | Last modified timestamp |
| `created_by_id` | integer | YES | FK → `accounts_user` |
| `organization_id` | integer | NO | FK → `accounts_organization` |
| `black_listed_user_ids` | ARRAY | NO | User IDs excluded from dynamic assignment |
| `scim_external_id` | varchar | YES | External ID from SCIM provisioning |

#### What a Row Represents

One row = one team within an organization. Teams group users for data visibility and management. The `sample` JSONB column stores the dynamic assignment conditions (e.g., `{"location": "Miami", "agent_type": "Specialist"}`). The `default` flag marks the organization's Default team — conversations from deleted teams remain accessible under the Default team. Auto-created teams are synced from CRM hierarchies every 24 hours.

---

### `accounts_role` — Role Definition

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK, auto-increment |
| `name` | varchar | NO | Internal role name (e.g., `ADMIN`, `MANAGER`, `QA_AUDITOR`, `AGENT`) |
| `display_name` | varchar | YES | Human-readable name shown in UI |
| `description` | text | YES | Role description |
| `is_standard_role` | boolean | NO | `true` = built-in role (cannot be modified/deleted) |
| `base_role` | varchar | NO | For custom roles: which standard role it was cloned from |
| `scope` | integer | NO | Data scope: My data / My team data / My org data |
| `is_default` | boolean | NO | `true` = default role assigned to users with no explicit role |
| `position` | integer | NO | Display ordering |
| `organization_id` | integer | YES | FK → `accounts_organization` (NULL for tenant-wide standard roles) |

#### What a Row Represents

One row = one role definition. Standard roles (Super Admin, Admin, Manager, QA Auditor, Agent) have `is_standard_role = true` and cannot be modified or deleted. Custom roles are cloned from a standard base role and have `is_standard_role = false`. The `base_role` column always points back to the original standard role name, even if cloned from another custom role. Role names are case-insensitive and unique. Only Agent-based roles can be set as default.

#### Counting Roles (What Users See in Settings)

```sql
SELECT id, name, display_name, is_standard_role, base_role, scope
FROM {schema}.accounts_role
WHERE organization_id = {org_id} OR organization_id IS NULL
ORDER BY position
```

---

### `accounts_userprofile` — Extended User Profile

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK, auto-increment |
| `profile` | jsonb | NO | CRM custom fields, dynamic team conditions match data |
| `source` | smallint | YES | Data source identifier (CRM integration type) |
| `user_id` | integer | NO | FK → `accounts_user` |
| `user_role_id` | integer | YES | FK (legacy role reference) |
| `enable_analytics` | boolean | NO | Whether analytics are enabled for this user |
| `organization_id` | integer | YES | FK → `accounts_organization` |
| `created` | timestamptz | NO | Created timestamp |
| `modified` | timestamptz | NO | Last modified timestamp |
| `deleted` | timestamptz | YES | Soft delete |

#### What a Row Represents

One row = extended profile data for a user, typically per organization. The `profile` JSONB column contains CRM-sourced custom user fields (e.g., location, department, agent type) that are used for dynamic team conditions. These custom fields are set via CSV upload or CRM integration and appear in the UI under Admin > Custom fields > User Fields.

---

### `accounts_project` — Project Definition

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK, auto-increment |
| `internal_name` | varchar | NO | System name |
| `display_name` | varchar | NO | Human-readable name |
| `organization_id` | integer | NO | FK → `accounts_organization` |
| `created` | timestamptz | NO | Created timestamp |
| `modified` | timestamptz | NO | Last modified timestamp |

---

## Relationship Tables (M2M)

### `accounts_userrolemapping` — User ↔ Role Assignment

**CRITICAL:** This is the authoritative user-role mapping table. Use this to determine a user's role(s).

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK |
| `user_id` | integer | NO | FK → `accounts_user` |
| `role_id` | integer | NO | FK → `accounts_role` |
| `organization_id` | integer | YES | FK → `accounts_organization` |
| `created` | timestamptz | NO | When role was assigned |

#### What a Row Represents

One row = one user-role assignment. A user can have multiple roles (e.g., both Manager and QA Auditor). With multi-org support, a user can have different roles in different organizations. The Role Engine (SCIM/Okta) creates and updates these rows on an hourly schedule.

---

### `accounts_teammember` — Team ↔ User Membership

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK, auto-increment |
| `team_id` | integer | NO | FK → `accounts_team` |
| `user_id` | integer | NO | FK → `accounts_user` |
| `auto_added` | boolean | NO | `true` = added via dynamic assignment or CRM sync; `false` = manually added |
| `is_team_admin` | boolean | NO | Whether user is a team admin |
| `added_by_id` | integer | YES | FK → `accounts_user` (who added them, NULL for auto-added) |
| `organization_id` | integer | NO | FK → `accounts_organization` |
| `created` | timestamptz | NO | Created timestamp |
| `modified` | timestamptz | NO | Last modified timestamp |

#### What a Row Represents

One row = one user's membership in one team. Users can be in multiple teams. The `auto_added` flag is important: manually-added users (`auto_added = false`) can be removed via the UI, but auto-added users can only be removed by updating their CRM data. This table has no soft delete — removal means the row is deleted.

---

### `accounts_userorganizations` — User ↔ Organization Membership (Multi-Org)

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK |
| `user_id` | integer | NO | FK → `accounts_user` |
| `organization_id` | integer | NO | FK → `accounts_organization` |
| `is_active` | boolean | NO | Whether user is active in this org (suspension is org-specific) |
| `persona` | varchar | YES | User persona within this org |
| `created` | timestamptz | NO | Created timestamp |
| `modified` | timestamptz | NO | Last modified timestamp |

#### What a Row Represents

One row = one user's membership in one organization. A single user can belong to multiple orgs (multi-org support). Suspension is per-org: `is_active = false` in Org A doesn't affect access to Org B. The user's roles in each org are tracked separately in `accounts_userrolemapping`.

---

### `accounts_teamproject` — Team ↔ Project Assignment

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK |
| `team_id` | integer | NO | FK → `accounts_team` |
| `project_id` | integer | NO | FK → `accounts_project` |
| `organization_id` | integer | NO | FK → `accounts_organization` |
| `created` | timestamptz | NO | Created timestamp |

---

### `accounts_rolepermission` — Role ↔ Permission Mapping

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK, auto-increment |
| `role_id` | integer | NO | FK → `accounts_role` |
| `permission_id` | integer | NO | FK → `accounts_custompermission` |
| `is_enabled` | boolean | NO | Whether this permission is active for this role |
| `is_editable` | boolean | NO | Whether admins can toggle this permission (`false` = mandatory on/off) |
| `organization_id` | integer | NO | FK → `accounts_organization` |

#### What a Row Represents

One row = one permission setting for one role. The matrix of all role-permission rows defines what each role can do. Standard roles have `is_editable = false` for most permissions. Custom roles inherit from their base role but allow toggling where `is_editable = true`. Some permissions are mandatory-on (e.g., view conversations) and some are mandatory-off (e.g., agents cannot create coaching sessions).

---

### `accounts_custompermission` — Permission Definition

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK |
| `permission_name` | varchar | NO | Display name (e.g., "Evaluate a conversation") |
| `internal_name` | varchar | NO | System identifier |
| `module_name` | varchar | NO | Module grouping (e.g., "Quality Assurance", "Dashboard", "Coaching") |
| `category_name` | varchar | YES | Sub-category within module |
| `position` | integer | NO | Display ordering |
| `parent_id` | integer | YES | FK → self (for interdependent permissions) |
| `organization_id` | integer | NO | FK → `accounts_organization` |

---

### `accounts_secondaryemails` — User Secondary Emails

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK |
| `email` | varchar | NO | Secondary email address |
| `user_id` | integer | NO | FK → `accounts_user` |

#### What a Row Represents

One row = one secondary email for a user. Up to 10 secondary emails per user. Used for unified user profiling: when searching conversations, Level AI matches both primary (`accounts_user.email`) and secondary emails. Login and notifications always use the primary email.

---

## Supporting Tables

### `accounts_userrole` — Role Snapshot (Legacy/Internal)

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK, auto-increment |
| `role_id` | text | NO | Role identifier (text, not FK) |
| `data` | jsonb | NO | Role data/configuration snapshot |
| `created` | timestamptz | NO | Created timestamp |
| `modified` | timestamptz | NO | Modified timestamp |
| `deleted` | timestamptz | YES | Soft delete |

**NOTE:** Despite its name, this is NOT the primary user-role mapping table. Use `accounts_userrolemapping` for determining which users have which roles. This table appears to store role configuration snapshots.

---

### `accounts_rolemappingrule` — Role Engine Rule

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK |
| `sample` | jsonb | NO | Rule conditions (e.g., `{"department": "QA"}`) |
| `is_active` | boolean | NO | Whether rule is currently active |
| `target_role_id` | integer | NO | FK → `accounts_role` (role to assign when conditions match) |
| `organization_id` | integer | NO | FK → `accounts_organization` |
| `created` | timestamptz | NO | Created timestamp |
| `modified` | timestamptz | NO | Modified timestamp |

#### What a Row Represents

One row = one Role Engine rule. The Role Engine runs hourly and checks user attributes (from SCIM/Okta) against these rules. When a user's attributes match the `sample` conditions, the `target_role_id` is assigned. This automates role assignment for organizations using Okta/SCIM.

---

### `accounts_organizationconfiguration` — Org-Level Configuration

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | integer | NO | PK, auto-increment |
| `organization_id` | integer | NO | FK → `accounts_organization` (1:1) |
| `data_control` | jsonb | NO | Data control and privacy settings |
| `week_start_day` | integer | NO | Week start day (0=Monday, 6=Sunday) |
| `journey` | jsonb | NO | Journey/workflow configuration |
| `created` | timestamptz | NO | Created timestamp |
| `modified` | timestamptz | NO | Modified timestamp |
| `deleted` | timestamptz | YES | Soft delete |

---

### Other Supporting Tables

| Table | Purpose | Key Columns |
|---|---|---|
| `accounts_userprofilemeta` | Profile metadata | — |
| `accounts_userdatamodified` | Tracks user data modifications | — |
| `accounts_userpasswordlog` | Password change history | — |
| `accounts_userexporttasklog` | User data export logs | — |
| `accounts_whitelistedtestuser` | Test user whitelist | — |
| `accounts_token` | API tokens | — |
| `accounts_resetpasswordtoken` | Password reset tokens | — |
| `accounts_googlecredentials` | Google SSO credentials | — |
| `accounts_device` | User devices | — |
| `accounts_user_groups` | M2M: user ↔ Django auth groups | `user_id`, `group_id` |
| `accounts_user_user_permissions` | Direct user permissions | `user_id`, `permission_id` |
| `accounts_user_business_units` | M2M: user ↔ business units | `user_id`, `businessunit_id` |
| `accounts_mergeusertasklog` | User merge task tracking | — |
| `accounts_gsuploadedfilelog` | Google Sheets upload logs | — |
| `accounts_asyncreport` | Async report generation | — |
| `accounts_aggregateduserprofilecolumn` | Dashboard column preferences | — |
| `accounts_availabledashboardcolumns` | Available dashboard columns | — |
| `accounts_columnconfiguration` | Column configurations | — |
| `account_account` | Django allauth accounts | — |
| `account_emailaddress` | Email addresses (allauth) | — |
| `account_emailconfirmation` | Email confirmations (allauth) | — |
| `account_signupcode` | Signup codes | — |
| `account_signupcoderesult` | Signup code usage | — |
| `account_passwordexpiry` | Password expiry tracking | — |
| `account_passwordhistory` | Password history | — |
| `account_data` | Account data | — |

---

## Relationships

```
accounts_user
  ├── accounts_userrolemapping (M2M → accounts_role)
  │     └── role_id → accounts_role.id
  ├── accounts_teammember (M2M → accounts_team)
  │     └── team_id → accounts_team.id
  ├── accounts_userorganizations (M2M → accounts_organization)
  │     └── organization_id → accounts_organization.id
  ├── accounts_userprofile (1:many, typically 1:1 per org)
  │     └── user_id → accounts_user.id
  ├── accounts_secondaryemails (1:many, up to 10)
  │     └── user_id → accounts_user.id
  └── accounts_user.manager_id (self-FK → accounts_user.id)

accounts_organization
  └── accounts_organizationconfiguration (1:1)
        └── organization_id → accounts_organization.id

accounts_role
  └── accounts_rolepermission (1:many → accounts_custompermission)
        ├── role_id → accounts_role.id
        └── permission_id → accounts_custompermission.id

accounts_team
  ├── accounts_teammember (1:many → accounts_user)
  └── accounts_teamproject (M2M → accounts_project)

accounts_rolemappingrule
  └── target_role_id → accounts_role.id  (Role Engine auto-assignment)
```

---

## Key Gotchas

1. **Soft deletes everywhere:** Most tables use `deleted IS NULL` to indicate active records. Always filter `WHERE deleted IS NULL` unless you specifically need deleted records.

2. **`is_active` vs `deleted`:** On `accounts_user`, `is_active = false` means the user is **suspended** (can be reactivated). `deleted IS NOT NULL` means the user is **soft-deleted** (permanently removed from UI). Both should typically be filtered.

3. **`accounts_userrole` is NOT the user-role mapping:** Despite its name, `accounts_userrole` does not contain a `user_id` column. The actual user-to-role mapping is in `accounts_userrolemapping`.

4. **User type is not a column:** There is no "user_type" or "role" column on `accounts_user`. To determine if a user is an agent, manager, etc., you must JOIN through `accounts_userrolemapping` → `accounts_role`.

5. **Multi-org suspension is per-org:** Suspending a user in one org (`accounts_userorganizations.is_active = false`) does not affect their access to other orgs.

6. **`organization_id` on `accounts_user`:** This is the user's current/primary org, but a user can belong to multiple orgs via `accounts_userorganizations`. For multi-org queries, always use the M2M table.

7. **Team dynamic conditions:** The `accounts_team.sample` JSONB column stores dynamic team assignment rules. The `accounts_teammember.auto_added` flag distinguishes auto-added members from manually-added ones.

8. **Custom roles clone from base:** Custom roles always have `is_standard_role = false` and `base_role` pointing to the original standard role name, even when cloned from another custom role.

9. **Role names are case-insensitive:** You cannot have two roles with the same name differing only in case.

10. **CSV import replaces multi-select fields:** When updating via CSV, Roles and Teams values are **replaced**, not merged. Old values are not preserved.

---

## Common Queries

### Count Active Users per Organization

```sql
SELECT o.name AS org_name, COUNT(u.id) AS active_users
FROM {schema}.accounts_user u
JOIN {schema}.accounts_userorganizations uo ON u.id = uo.user_id
JOIN {schema}.accounts_organization o ON uo.organization_id = o.id
WHERE u.deleted IS NULL
  AND u.is_active = true
  AND uo.is_active = true
  AND o.deleted IS NULL
GROUP BY o.name
ORDER BY active_users DESC
```

### List Users with Their Roles

```sql
SELECT u.id, u.email, u.first_name, u.last_name,
       r.name AS role_name, r.display_name AS role_display,
       r.is_standard_role
FROM {schema}.accounts_user u
JOIN {schema}.accounts_userrolemapping urm ON u.id = urm.user_id
JOIN {schema}.accounts_role r ON urm.role_id = r.id
WHERE u.deleted IS NULL AND u.is_active = true
ORDER BY u.email, r.name
```

### List Teams with Member Count

```sql
SELECT t.id, t.name AS team_name, t."default" AS is_default,
       COUNT(tm.id) AS member_count
FROM {schema}.accounts_team t
LEFT JOIN {schema}.accounts_teammember tm ON t.id = tm.team_id
WHERE t.organization_id = {org_id}
GROUP BY t.id, t.name, t."default"
ORDER BY t.name
```

### Find User by Primary or Secondary Email

```sql
SELECT u.id, u.email, u.first_name, u.last_name
FROM {schema}.accounts_user u
WHERE u.deleted IS NULL AND (
    u.email = '{email}'
    OR u.id IN (
        SELECT user_id FROM {schema}.accounts_secondaryemails
        WHERE email = '{email}'
    )
)
```

---

## Disambiguation

| User Says | DB Table | Filter / Join |
|---|---|---|
| "agent" or "user" | `accounts_user` | `deleted IS NULL AND is_active = true` |
| "team" | `accounts_team` | `organization_id = {org}` |
| "organization" or "org" | `accounts_organization` | `deleted IS NULL` |
| "role" (definition) | `accounts_role` | `is_standard_role` to distinguish standard vs custom |
| "user's role" (assignment) | `accounts_userrolemapping` | JOIN `accounts_role` for role name |
| "permission" | `accounts_custompermission` + `accounts_rolepermission` | `is_enabled = true` for active |
| "team members" | `accounts_teammember` | `team_id = {team}` |
| "manager" | `accounts_user` | JOIN `accounts_userrolemapping` → `accounts_role` WHERE `role.name = 'MANAGER'` |
| "suspended user" | `accounts_user` | `is_active = false AND deleted IS NULL` |
| "secondary email" | `accounts_secondaryemails` | `user_id = {user}` |
| "default team" | `accounts_team` | `"default" = true AND organization_id = {org}` |
| "custom role" | `accounts_role` | `is_standard_role = false` |
