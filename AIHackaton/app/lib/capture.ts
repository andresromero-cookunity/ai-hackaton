import { put } from '@vercel/blob';
import { chromium, type Browser } from 'playwright';
import { detectChangesStrict } from './change-detection';
import { fetchTopCompetitorsFromSource } from './competitors';
import { sql } from './db';
import { extractContent } from './extract';
import { sha256 } from './hash';
import { refreshWeeklyInsights } from './insights';
import { analyzeSnapshotSemantic } from './openai';
import { closeKnownPopups } from './popup';
import type { Competitor, ExtractedContent, SnapshotRow, ViewportKind } from './types';

const MAX_COMPETITORS = Number(process.env.MAX_COMPETITORS ?? '10');
const STORE_RAW_HTML = (process.env.STORE_RAW_HTML ?? 'false').toLowerCase() === 'true';
const POPUP_WAIT_MS = Number(process.env.POPUP_WAIT_MS ?? '12000');

const VIEWPORTS: Record<ViewportKind, { width: number; height: number; userAgent: string }> = {
  desktop: {
    width: 1440,
    height: 900,
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  },
  mobile: {
    width: 390,
    height: 844,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  }
};

function toSlug(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function getEtDayAndHour(date = new Date()): { day: number; hour: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: 'numeric',
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  const weekday = parts.find((part) => part.type === 'weekday')?.value ?? 'Mon';
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6
  };

  return { day: dayMap[weekday] ?? 1, hour };
}

function shouldRunNow(date = new Date()): boolean {
  const { day, hour } = getEtDayAndHour(date);
  const allowedHours = new Set((process.env.CAPTURE_HOURS_ET ?? '8,18').split(',').map((h) => Number(h.trim())));
  const allowedDays = new Set((process.env.CAPTURE_DAYS_ET ?? '0,1,2,3,4,5,6').split(',').map((d) => Number(d.trim())));
  return allowedDays.has(day) && allowedHours.has(hour);
}

async function claimRun(runKey: string): Promise<boolean> {
  try {
    await sql`
      INSERT INTO cron_runs (run_key, status)
      VALUES (${runKey}, 'running')
    `;
    return true;
  } catch {
    return false;
  }
}

async function finishRun(runKey: string, status: 'success' | 'failed', errorMessage?: string): Promise<void> {
  await sql`
    UPDATE cron_runs
    SET status = ${status}, finished_at = NOW(), error_message = ${errorMessage ?? null}
    WHERE run_key = ${runKey}
  `;
}

async function upsertCompetitorsFromSource(): Promise<void> {
  const competitors = await fetchTopCompetitorsFromSource(MAX_COMPETITORS);

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

async function getActiveCompetitors(limit = MAX_COMPETITORS): Promise<Competitor[]> {
  const rows = await sql`
    SELECT id, name, url, priority, active
    FROM competitors
    WHERE active = TRUE
    ORDER BY priority ASC, created_at ASC
    LIMIT ${limit}
  `;

  return rows as Competitor[];
}

async function getPreviousSnapshot(competitorId: number, viewport: ViewportKind): Promise<SnapshotRow | null> {
  const rows = await sql`
    SELECT
      id,
      competitor_id,
      captured_at,
      viewport,
      screenshot_url,
      screenshot_hash,
      meta_title,
      hero_headline,
      hero_subheadline,
      hero_cta,
      promo_banner_present,
      promo_discount_amount,
      promo_discount_text,
      promo_value_add,
      promo_multi_week,
      promo_urgency
    FROM snapshots
    WHERE competitor_id = ${competitorId}
      AND viewport = ${viewport}
    ORDER BY captured_at DESC
    LIMIT 1
  `;

  return (rows[0] as SnapshotRow | undefined) ?? null;
}

async function saveSnapshot(input: {
  competitorId: number;
  viewport: ViewportKind;
  screenshotUrl: string;
  screenshotHash: string;
  html: string | null;
  extracted: ExtractedContent;
  capturedAt: Date;
}): Promise<number> {
  const rows = await sql`
    INSERT INTO snapshots (
      competitor_id,
      captured_at,
      viewport,
      screenshot_url,
      screenshot_hash,
      html,
      meta_title,
      hero_headline,
      hero_subheadline,
      hero_cta,
      promo_banner_present,
      promo_discount_amount,
      promo_discount_text,
      promo_value_add,
      promo_multi_week,
      promo_urgency,
      extraction
    )
    VALUES (
      ${input.competitorId},
      ${input.capturedAt.toISOString()},
      ${input.viewport},
      ${input.screenshotUrl},
      ${input.screenshotHash},
      ${input.html},
      ${input.extracted.metaTitle},
      ${input.extracted.heroHeadline},
      ${input.extracted.heroSubheadline},
      ${input.extracted.heroCta},
      ${input.extracted.promoBannerPresent},
      ${input.extracted.promoDiscountAmount},
      ${input.extracted.promoDiscountText},
      ${input.extracted.promoValueAdd},
      ${input.extracted.promoMultiWeek},
      ${input.extracted.promoUrgency},
      ${JSON.stringify(input.extracted)}::jsonb
    )
    RETURNING id
  `;

  return Number(rows[0].id);
}

async function saveChanges(
  competitorId: number,
  snapshotId: number,
  previousSnapshotId: number,
  changes: ReturnType<typeof detectChangesStrict>
): Promise<number[]> {
  const ids: number[] = [];

  for (const change of changes) {
    const rows = await sql`
      INSERT INTO change_events (
        competitor_id,
        snapshot_id,
        previous_snapshot_id,
        section,
        change_type,
        is_significant,
        confidence,
        summary,
        details
      )
      VALUES (
        ${competitorId},
        ${snapshotId},
        ${previousSnapshotId},
        ${change.section},
        ${change.changeType},
        ${change.isSignificant},
        ${change.confidence},
        ${change.summary},
        ${JSON.stringify(change.details)}::jsonb
      )
      RETURNING id
    `;

    ids.push(Number(rows[0].id));
  }

  return ids;
}

async function saveSemanticAnalysis(
  snapshotId: number,
  model: string,
  output: Record<string, unknown>
): Promise<void> {
  await sql`
    INSERT INTO semantic_analyses (snapshot_id, model, prompt_version, output)
    VALUES (${snapshotId}, ${model}, 'v1', ${JSON.stringify(output)}::jsonb)
    ON CONFLICT (snapshot_id) DO UPDATE
    SET output = EXCLUDED.output,
        model = EXCLUDED.model,
        prompt_version = EXCLUDED.prompt_version
  `;
}

async function upsertTactics(input: {
  competitorId: number;
  changeEventIds: number[];
  category: string;
  description: string;
  inferredIntent: string;
  experimentSuggestion: string;
  screenshotUrl: string;
}): Promise<void> {
  for (const changeEventId of input.changeEventIds) {
    await sql`
      INSERT INTO tactics (
        competitor_id,
        change_event_id,
        category,
        description,
        inferred_intent,
        experiment_suggestion,
        date_from,
        screenshot_url
      )
      VALUES (
        ${input.competitorId},
        ${changeEventId},
        ${input.category},
        ${input.description},
        ${input.inferredIntent},
        ${input.experimentSuggestion},
        NOW()::date,
        ${input.screenshotUrl}
      )
    `;
  }
}

async function captureForViewport(browser: Browser, competitor: Competitor, viewport: ViewportKind): Promise<void> {
  const config = VIEWPORTS[viewport];
  const context = await browser.newContext({
    viewport: { width: config.width, height: config.height },
    userAgent: config.userAgent,
    locale: 'en-US',
    timezoneId: 'America/New_York'
  });

  const page = await context.newPage();
  const capturedAt = new Date();
  const previous = await getPreviousSnapshot(competitor.id, viewport);

  try {
    await page.goto(competitor.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(POPUP_WAIT_MS);
    await closeKnownPopups(page);
    await page.waitForTimeout(1200);

    const screenshot = (await page.screenshot({ fullPage: true, type: 'png' })) as Buffer;
    const html = await page.content();
    const pageTitle = await page.title();

    const blobPath = `snapshots/${capturedAt.toISOString().slice(0, 10)}/${toSlug(competitor.name)}-${viewport}.png`;
    const blob = await put(blobPath, screenshot, {
      access: 'public',
      addRandomSuffix: true
    });

    const extracted = extractContent(html, pageTitle);
    const snapshotId = await saveSnapshot({
      competitorId: competitor.id,
      viewport,
      screenshotUrl: blob.url,
      screenshotHash: sha256(screenshot),
      html: STORE_RAW_HTML ? html : null,
      extracted,
      capturedAt
    });

    const semantic = await analyzeSnapshotSemantic({
      competitorName: competitor.name,
      url: competitor.url,
      viewport,
      extracted,
      previousExtracted: previous
        ? {
            metaTitle: previous.meta_title,
            heroHeadline: previous.hero_headline,
            heroSubheadline: previous.hero_subheadline,
            heroCta: previous.hero_cta,
            promoBannerPresent: previous.promo_banner_present,
            promoDiscountAmount: previous.promo_discount_amount,
            promoDiscountText: previous.promo_discount_text,
            promoValueAdd: previous.promo_value_add,
            promoMultiWeek: previous.promo_multi_week,
            promoUrgency: previous.promo_urgency
          }
        : undefined
    });

    await saveSemanticAnalysis(snapshotId, process.env.OPENAI_MODEL ?? 'gpt-4.1-mini', semantic);

    if (!previous) {
      return;
    }

    const currentSnapshot: SnapshotRow = {
      id: snapshotId,
      competitor_id: competitor.id,
      captured_at: capturedAt.toISOString(),
      viewport,
      screenshot_url: blob.url,
      screenshot_hash: sha256(screenshot),
      meta_title: extracted.metaTitle,
      hero_headline: extracted.heroHeadline,
      hero_subheadline: extracted.heroSubheadline,
      hero_cta: extracted.heroCta,
      promo_banner_present: extracted.promoBannerPresent,
      promo_discount_amount: extracted.promoDiscountAmount === null ? null : String(extracted.promoDiscountAmount),
      promo_discount_text: extracted.promoDiscountText,
      promo_value_add: extracted.promoValueAdd,
      promo_multi_week: extracted.promoMultiWeek,
      promo_urgency: extracted.promoUrgency
    };

    const changes = detectChangesStrict(previous, currentSnapshot);

    if (changes.length === 0) {
      return;
    }

    const changeEventIds = await saveChanges(competitor.id, snapshotId, previous.id, changes);
    const primaryCategory = semantic.categories[0] ?? changes[0].changeType;

    await upsertTactics({
      competitorId: competitor.id,
      changeEventIds,
      category: primaryCategory,
      description: semantic.summary,
      inferredIntent: semantic.inferredIntent,
      experimentSuggestion: semantic.experimentSuggestion,
      screenshotUrl: blob.url
    });
  } finally {
    await context.close();
  }
}

export async function runCaptureJob(options?: { force?: boolean; runKey?: string }) {
  const runKey = options?.runKey ?? `capture-${new Date().toISOString().slice(0, 13)}`;

  if (!options?.force && !shouldRunNow()) {
    return { ok: true, skipped: true, reason: 'Outside configured ET capture windows.' };
  }

  const runClaimed = await claimRun(runKey);
  if (!runClaimed) {
    return { ok: true, skipped: true, reason: 'Run key already processed.' };
  }

  try {
    await upsertCompetitorsFromSource();
    const competitors = await getActiveCompetitors(MAX_COMPETITORS);
    const failures: Array<{ competitor: string; viewport: ViewportKind; error: string }> = [];

    const browser = await chromium.launch({ headless: true });
    try {
      for (const competitor of competitors) {
        for (const viewport of Object.keys(VIEWPORTS) as ViewportKind[]) {
          try {
            await captureForViewport(browser, competitor, viewport);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            failures.push({ competitor: competitor.name, viewport, error: message });
          }
        }
      }
    } finally {
      await browser.close();
    }

    await refreshWeeklyInsights();

    await finishRun(runKey, 'success');
    return {
      ok: true,
      skipped: false,
      processedCompetitors: competitors.length,
      viewports: Object.keys(VIEWPORTS),
      failures
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await finishRun(runKey, 'failed', message);
    throw error;
  }
}

export async function importCompetitorsOnly() {
  await upsertCompetitorsFromSource();
  const competitors = await getActiveCompetitors(MAX_COMPETITORS);
  return { count: competitors.length, competitors };
}
