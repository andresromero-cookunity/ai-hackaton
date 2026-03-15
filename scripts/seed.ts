import { fetchTopCompetitorsFromSource } from '../app/lib/competitors';
import { sql } from '../app/lib/db';

async function seedCompetitors() {
  const competitors = await fetchTopCompetitorsFromSource(10);

  for (const competitor of competitors) {
    await sql`
      INSERT INTO competitors (name, url, source, priority, active)
      VALUES (${competitor.name}, ${competitor.url}, 'foodtechrace', ${competitor.priority}, TRUE)
      ON CONFLICT (url) DO UPDATE
      SET name = EXCLUDED.name,
          priority = EXCLUDED.priority,
          active = TRUE
    `;
  }
}

async function seedDemoInsights() {
  const weekStart = new Date();
  const mondayOffset = (weekStart.getUTCDay() + 6) % 7;
  weekStart.setUTCDate(weekStart.getUTCDate() - mondayOffset);

  const rows = await sql`SELECT COUNT(*)::INT AS total FROM weekly_insights`;
  if (Number(rows[0].total) > 0) {
    return;
  }

  await sql`
    INSERT INTO weekly_insights (week_start, title, summary, evidence, experiment_suggestion)
    VALUES
      (
        ${weekStart.toISOString().slice(0, 10)},
        'Discount escalation before holidays',
        'Competitors consistently escalate discounts 3-4 weeks before major holidays.',
        ${JSON.stringify({ examples: ['Holiday discount ramp timing', 'Urgency language increase'] })}::jsonb,
        'Test earlier promo ramp with moderate urgency messaging before major holidays.'
      ),
      (
        ${weekStart.toISOString().slice(0, 10)},
        'Chef-credibility substitution pattern',
        'Chef credibility messaging increases when discount depth decreases.',
        ${JSON.stringify({ examples: ['Headline shift to chef quality', 'Lower visible discount callouts'] })}::jsonb,
        'Run value-led hero with chef trust signals during lower discount windows.'
      ),
      (
        ${weekStart.toISOString().slice(0, 10)},
        'Synchronized seasonal messaging',
        'Multiple competitors launched New Year Reset messaging within the same week.',
        ${JSON.stringify({ examples: ['Seasonal trigger alignment', 'Shared phrase adoption'] })}::jsonb,
        'Pilot synchronized seasonal creatives one week earlier than market peers.'
      )
  `;
}

async function main() {
  await seedCompetitors();
  await seedDemoInsights();
  console.log('Seed completed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
