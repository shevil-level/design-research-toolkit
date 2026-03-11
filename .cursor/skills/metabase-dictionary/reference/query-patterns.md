# Validated Query Patterns — Level AI

Reusable SQL patterns confirmed to produce correct results. Use as starting points.

Last updated: 2026-02-19

---

## Cross-Tenant Query Pattern

Most product questions require querying across all customer schemas. Since the DB is read-only (no temp tables or PL/pgSQL), use UNION ALL:

```sql
SELECT customer, <metric>
FROM (
  SELECT '<schema1>' AS customer, <aggregate> FROM <schema1>.<table> WHERE <filters>
  UNION ALL
  SELECT '<schema2>' AS customer, <aggregate> FROM <schema2>.<table> WHERE <filters>
  -- ... repeat for each schema
) sub
WHERE <metric> > 0
ORDER BY <metric> DESC
```

To generate the UNION ALL dynamically, first get the schema list:

```sql
SELECT table_schema
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

Then programmatically build the UNION ALL query from the schema list.

---

## QA Scorecards (Instascore Rubrics)

### Count active QA scorecards per customer

**Status: VALIDATED** — tested across 113 tenants on Colossus Prod 2 (2026-02-19). Results range from 1 to 295, consistent with expectations (modsquadprod is a BPO with many client scorecards).

Single tenant:
```sql
SELECT COUNT(*) AS active_scorecards
FROM {schema}.quality_assessment_customform
WHERE deleted IS NULL
  AND is_active = true
```

Cross-tenant (use UNION ALL pattern above with):
```sql
SELECT '{schema}' AS customer, COUNT(*) AS active_scorecards
FROM {schema}.quality_assessment_customform
WHERE deleted IS NULL
  AND is_active = true
```

### Count auto-scored (Instascore) vs manual scorecards

```sql
SELECT type, COUNT(*) AS count
FROM {schema}.quality_assessment_customform
WHERE deleted IS NULL AND is_active = true
GROUP BY type
```

`type = 'AUTO'` → Instascore; `type = 'MANUAL'` → manual QA.

---

## Coaching Rubrics

### Count distinct coaching rubric types per customer

**Status: VALIDATED** — confirmed against Chime data. Chime has 4 distinct rubric types.

Single tenant:
```sql
SELECT COUNT(DISTINCT name) AS rubric_types
FROM {schema}.agent_coaching_coachingrubric
WHERE is_template = true
  AND deleted IS NULL
```

### Count coaching sessions (instances) per customer

```sql
SELECT COUNT(*) AS coaching_sessions
FROM {schema}.agent_coaching_coachingrubric
WHERE is_template = false
  AND deleted IS NULL
```

### List rubric types with session counts

```sql
SELECT
  t.name AS rubric_type,
  COUNT(i.id) AS session_count
FROM {schema}.agent_coaching_coachingrubric t
LEFT JOIN {schema}.agent_coaching_coachingrubric i
  ON i.source_id = t.id AND i.is_template = false AND i.deleted IS NULL
WHERE t.is_template = true AND t.deleted IS NULL
GROUP BY t.name
ORDER BY session_count DESC
```

---

## Template: Adding New Patterns

When adding a new validated pattern, include:

1. **Title** describing what it answers
2. **Status**: `VALIDATED` (confirmed correct) or `NEEDS VALIDATION` (logic-based, unconfirmed)
3. **SQL** for both single-tenant and cross-tenant use
4. **Notes** on any gotchas or edge cases
