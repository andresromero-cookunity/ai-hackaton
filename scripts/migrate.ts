import { readFile } from 'node:fs/promises';
import { sql } from '../app/lib/db';

async function runSqlStatements(input: string) {
  const statements = input
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await sql(statement);
  }
}

async function resetLegacySchemaIfNeeded() {
  const competitorTableRows = await sql`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'competitors'
    ) AS exists
  `;

  const competitorsExists = Boolean(competitorTableRows[0]?.exists);
  if (!competitorsExists) {
    return;
  }

  const competitorIdRows = await sql`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'competitors'
      AND column_name = 'id'
    ) AS has_id
  `;

  const hasExpectedCompetitorId = Boolean(competitorIdRows[0]?.has_id);
  if (hasExpectedCompetitorId) {
    return;
  }

  await runSqlStatements(`
    DROP TABLE IF EXISTS tactics CASCADE;
    DROP TABLE IF EXISTS change_events CASCADE;
    DROP TABLE IF EXISTS semantic_analyses CASCADE;
    DROP TABLE IF EXISTS weekly_insights CASCADE;
    DROP TABLE IF EXISTS cron_runs CASCADE;
    DROP TABLE IF EXISTS snapshots CASCADE;
    DROP TABLE IF EXISTS ab_tool_detections CASCADE;
    DROP TABLE IF EXISTS competitors CASCADE;
  `);

  console.log('Detected legacy schema and reset conflicting tables.');
}

async function main() {
  await resetLegacySchemaIfNeeded();
  const schema = await readFile(new URL('../db/schema.sql', import.meta.url), 'utf-8');
  await runSqlStatements(schema);
  console.log('Database schema applied successfully.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
