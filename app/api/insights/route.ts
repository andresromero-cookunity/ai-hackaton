import { NextResponse } from 'next/server';
import { sql } from '@/app/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  const rows = await sql`
    SELECT
      wi.id,
      wi.week_start,
      wi.title,
      wi.summary,
      wi.experiment_suggestion,
      wi.evidence,
      c.name AS competitor_name
    FROM weekly_insights wi
    LEFT JOIN competitors c ON c.id = wi.competitor_id
    ORDER BY wi.week_start DESC, wi.created_at DESC
    LIMIT 100
  `;

  return NextResponse.json({ insights: rows });
}
