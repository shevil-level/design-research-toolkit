# Colossus Database — Multi-Tenant Architecture

Applies to all Colossus Production databases (IDs 2, 107, 108, 112, 116, 120).

Last updated: 2026-02-19

---

## Schema-Per-Tenant

Each customer (tenant) has its own PostgreSQL **schema** within the database. The schema name is a lowercase slug of the customer name (e.g., `chime`, `airbnb`, `wealthsimple`).

All tenants share the same table structure within their schema. A query that works for `chime.quality_assessment_customform` will also work for `airbnb.quality_assessment_customform`.

## Organizations Within a Tenant

A single tenant (schema) can contain **multiple organizations** (`organization_id`). Many features create per-organization records. When counting "customer-level" items, be aware of this — you may need to deduplicate or aggregate across orgs.

The `accounts_organization` table lists organizations within a tenant.

## Soft Deletes

Most tables use a `deleted` timestamp column for soft deletes:
- `deleted IS NULL` → record is active
- `deleted IS NOT NULL` → record was soft-deleted

Some tables use `is_active` boolean instead of or in addition to `deleted`.

## Schemas to Exclude

When querying across all tenants, exclude non-customer schemas:

```
tenantonboarding%, healthcheck, testmoment, testtenant, testpartition2,
canarytest, sandbox, levelsandbox, deliverysandbox, cedatapipelines,
leveldemo, aademosales, customdemo, demojrm, carpartsdemo, assurantdemo,
asuriondemo1, ttecdemo, swissreusdemo, thezebrapoc, chimesandbox,
partechsandbox, sungagefinancialsandbox
```

## Cross-Tenant Query Pattern

The database is read-only (no temp tables, no PL/pgSQL). Use UNION ALL to query across schemas:

```sql
SELECT customer, <metric>
FROM (
  SELECT '<schema1>' AS customer, <aggregate> FROM <schema1>.<table> WHERE <filters>
  UNION ALL
  SELECT '<schema2>' AS customer, <aggregate> FROM <schema2>.<table> WHERE <filters>
) sub
WHERE <metric> > 0
ORDER BY <metric> DESC
```

To get the list of tenant schemas dynamically:

```sql
SELECT DISTINCT table_schema
FROM information_schema.tables
WHERE table_name = '<target_table>'
  AND table_schema NOT LIKE 'tenantonboarding%'
  AND table_schema NOT IN (
    'healthcheck','testmoment','testtenant','testpartition2',
    'canarytest','sandbox','levelsandbox','deliverysandbox',
    'cedatapipelines','leveldemo','aademosales','customdemo',
    'demojrm','carpartsdemo','assurantdemo','asuriondemo1',
    'ttecdemo','swissreusdemo','thezebrapoc','chimesandbox',
    'partechsandbox','sungagefinancialsandbox'
  )
ORDER BY table_schema
```

## Partitioned Tables

Large tables are partitioned by quarter (e.g., `level_asr_asrtranscriptionlog_partitioned_2025_01`). Query the parent table name — PostgreSQL will automatically route to the correct partition.

## Historical Tables

Many tables have a `historical*` counterpart (e.g., `agent_coaching_historicalcoachingrubric`). These store Django Simple History audit trails — every change to a record creates a historical row. Do NOT use historical tables for current-state queries.

## Common Column Patterns

| Column | Meaning |
|---|---|
| `id` | Primary key (auto-increment integer) |
| `created` | Record creation timestamp |
| `modified` | Last modification timestamp |
| `deleted` | Soft-delete timestamp (NULL = active) |
| `organization_id` | FK to `accounts_organization` |
| `user_id` / `assignee_id` | FK to `accounts_user` |
| `asr_log_id` | FK to `level_asr_asrlog` (a conversation) |
| `*_id` | Generally a foreign key to the referenced table |
