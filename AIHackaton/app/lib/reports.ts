import { startOfWeek } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { sql } from './db';

export async function getDashboardOverview() {
  const nowEt = toZonedTime(new Date(), 'America/New_York');
  const weekStart = startOfWeek(nowEt, { weekStartsOn: 1 }).toISOString().slice(0, 10);

  const weeklyChanges = await sql`
    SELECT
      c.name AS competitor_name,
      COUNT(*)::INT AS change_count,
      MAX(ce.created_at) AS last_change_at
    FROM change_events ce
    JOIN competitors c ON c.id = ce.competitor_id
    WHERE ce.created_at::date >= ${weekStart}
    GROUP BY c.name
    ORDER BY change_count DESC, c.name ASC
  `;

  const recentSnapshots = await sql`
    SELECT
      c.name AS competitor_name,
      s.viewport,
      s.captured_at,
      s.screenshot_url
    FROM snapshots s
    JOIN competitors c ON c.id = s.competitor_id
    ORDER BY s.captured_at DESC
    LIMIT 20
  `;

  const weeklyInsights = await sql`
    SELECT
      wi.id,
      wi.week_start,
      wi.title,
      wi.summary,
      wi.experiment_suggestion,
      c.name AS competitor_name
    FROM weekly_insights wi
    LEFT JOIN competitors c ON c.id = wi.competitor_id
    ORDER BY wi.week_start DESC, wi.created_at DESC
    LIMIT 20
  `;

  const weeklyComparisons = await sql`
    SELECT
      ce.id,
      ce.created_at,
      ce.section,
      ce.change_type,
      ce.summary,
      ce.confidence,
      c.name AS competitor_name,
      s.screenshot_url AS after_screenshot_url,
      ps.screenshot_url AS before_screenshot_url
    FROM change_events ce
    JOIN competitors c ON c.id = ce.competitor_id
    JOIN snapshots s ON s.id = ce.snapshot_id
    LEFT JOIN snapshots ps ON ps.id = ce.previous_snapshot_id
    WHERE ce.created_at::date >= ${weekStart}
    ORDER BY ce.created_at DESC
    LIMIT 100
  `;

  return {
    weekStart,
    weeklyChanges,
    recentSnapshots,
    weeklyInsights,
    weeklyComparisons
  };
}

export async function getTactics(search: string) {
  const value = `%${search.trim()}%`;

  const data = await sql`
    SELECT
      t.id,
      t.category,
      t.description,
      t.inferred_intent,
      t.experiment_suggestion,
      t.date_from,
      t.date_to,
      t.screenshot_url,
      c.name AS competitor_name
    FROM tactics t
    JOIN competitors c ON c.id = t.competitor_id
    WHERE ${search.trim() === ''}
      OR c.name ILIKE ${value}
      OR t.category ILIKE ${value}
      OR t.description ILIKE ${value}
      OR t.inferred_intent ILIKE ${value}
    ORDER BY t.created_at DESC
    LIMIT 200
  `;

  return data;
}

export async function getCompetitorHealth() {
  return sql`
    SELECT
      c.id,
      c.name,
      c.url,
      MAX(s.captured_at) AS last_snapshot_at,
      COUNT(DISTINCT CASE WHEN s.captured_at::date >= NOW()::date - INTERVAL '7 day' THEN s.id END)::INT AS snapshots_last_7d,
      COUNT(DISTINCT CASE WHEN ce.created_at::date >= NOW()::date - INTERVAL '7 day' THEN ce.id END)::INT AS changes_last_7d
    FROM competitors c
    LEFT JOIN snapshots s ON s.competitor_id = c.id
    LEFT JOIN change_events ce ON ce.competitor_id = c.id
    WHERE c.active = TRUE
    GROUP BY c.id, c.name, c.url
    ORDER BY c.priority ASC, c.name ASC
  `;
}
