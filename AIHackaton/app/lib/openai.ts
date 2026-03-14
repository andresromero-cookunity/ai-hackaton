import OpenAI from 'openai';
import { z } from 'zod';
import type { SemanticAnalysisOutput } from './types';

const outputSchema = z.object({
  categories: z
    .array(z.enum(['Positioning', 'Promo', 'Seasonal', 'Experiment-like']))
    .min(1)
    .max(4),
  inferredIntent: z.string().min(10),
  summary: z.string().min(10),
  experimentSuggestion: z.string().min(10),
  signals: z.array(z.string()).min(1)
});

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY environment variable.');
  }

  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  return client;
}

export async function analyzeSnapshotSemantic(input: {
  competitorName: string;
  url: string;
  viewport: string;
  extracted: Record<string, unknown>;
  previousExtracted?: Record<string, unknown>;
}): Promise<SemanticAnalysisOutput> {
  const promptVersion = 'v1';

  const system = [
    'You are a strict competitive intelligence analyst.',
    'Return only valid JSON matching the required schema.',
    'Focus on homepage changes in hero/promo/meta title.',
    'Categories must be from: Positioning, Promo, Seasonal, Experiment-like.',
    'Infer one concrete experiment suggestion for CookUnity.'
  ].join(' ');

  const user = {
    promptVersion,
    competitor: input.competitorName,
    url: input.url,
    viewport: input.viewport,
    current: input.extracted,
    previous: input.previousExtracted ?? null
  };

  const response = await getClient().chat.completions.create({
    model: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
    temperature: 0,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'semantic_analysis',
        strict: true,
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            categories: {
              type: 'array',
              minItems: 1,
              maxItems: 4,
              items: {
                type: 'string',
                enum: ['Positioning', 'Promo', 'Seasonal', 'Experiment-like']
              }
            },
            inferredIntent: { type: 'string' },
            summary: { type: 'string' },
            experimentSuggestion: { type: 'string' },
            signals: {
              type: 'array',
              minItems: 1,
              items: { type: 'string' }
            }
          },
          required: ['categories', 'inferredIntent', 'summary', 'experimentSuggestion', 'signals']
        }
      }
    },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: JSON.stringify(user) }
    ]
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI returned an empty semantic analysis response.');
  }
  const parsed = outputSchema.parse(JSON.parse(content));
  return parsed;
}
