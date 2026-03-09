import OpenAI from 'openai';
import { startOfWeek } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { z } from 'zod';
import { sql } from './db';

const schema = z.object({
  insights: z
    .array(
      z.object({
        title: z.string().min(8),
        summary: z.string().min(20),
        evidence: z.array(z.string()).min(1),
        experimentSuggestion: z.string().min(12)
      })
    )
    .min(1)
    .max(5)
});

let client: OpenAI | null = null;

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY environment variable.');
  }

  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  return client;
}

export async function refreshWeeklyInsights(): Promise<void> {
  const nowEt = toZonedTime(new Date(), 'America/New_York');
  const weekStart = startOfWeek(nowEt, { weekStartsOn: 1 }).toISOString().slice(0, 10);

  const changeRows = await sql`
    SELECT
      c.name AS competitor_name,
      ce.section,
      ce.change_type,
      ce.summary,
      ce.details,
      ce.created_at
    FROM change_events ce
    JOIN competitors c ON c.id = ce.competitor_id
    WHERE ce.created_at::date >= ${weekStart}
    ORDER BY ce.created_at DESC
    LIMIT 300
  `;

  if (changeRows.length < 3) {
    return;
  }

  const completion = await getClient().chat.completions.create({
    model: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
    temperature: 0,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'weekly_insights',
        strict: true,
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            insights: {
              type: 'array',
              minItems: 1,
              maxItems: 5,
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  title: { type: 'string' },
                  summary: { type: 'string' },
                  evidence: {
                    type: 'array',
                    minItems: 1,
                    items: { type: 'string' }
                  },
                  experimentSuggestion: { type: 'string' }
                },
                required: ['title', 'summary', 'evidence', 'experimentSuggestion']
              }
            }
          },
          required: ['insights']
        }
      }
    },
    messages: [
      {
        role: 'system',
        content:
          'You are a strict competitor intelligence analyst. Produce concise weekly insights and experiment suggestions based only on provided evidence.'
      },
      {
        role: 'user',
        content: JSON.stringify({
          weekStart,
          changes: changeRows
        })
      }
    ]
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI returned empty weekly insights response.');
  }

  const parsed = schema.parse(JSON.parse(content));

  await sql`DELETE FROM weekly_insights WHERE week_start = ${weekStart} AND competitor_id IS NULL`;

  for (const insight of parsed.insights) {
    await sql`
      INSERT INTO weekly_insights (
        week_start,
        competitor_id,
        title,
        summary,
        evidence,
        experiment_suggestion
      )
      VALUES (
        ${weekStart},
        ${null},
        ${insight.title},
        ${insight.summary},
        ${JSON.stringify({ bullets: insight.evidence })}::jsonb,
        ${insight.experimentSuggestion}
      )
    `;
  }
}
