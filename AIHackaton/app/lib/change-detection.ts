import type { ChangeEventInput, ChangeCategory, SnapshotRow } from './types';

function normalize(value: string | null): string {
  return (value ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j += 1) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i += 1) {
    for (let j = 1; j <= a.length; j += 1) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function similarity(a: string | null, b: string | null): number {
  const one = normalize(a);
  const two = normalize(b);

  if (!one && !two) return 1;
  if (!one || !two) return 0;

  const distance = levenshtein(one, two);
  return 1 - distance / Math.max(one.length, two.length);
}

function categorizeHero(headlineDiff: number, subheadlineDiff: number): ChangeCategory {
  if (headlineDiff > 0.55 || subheadlineDiff > 0.55) return 'Positioning';
  if (headlineDiff > 0.25 || subheadlineDiff > 0.25) return 'Experiment-like';
  return 'Positioning';
}

function categorizePromo(text: string | null): ChangeCategory {
  const value = normalize(text);
  if (/(new year|summer|holiday|black friday|cyber monday|reset|season)/i.test(value)) return 'Seasonal';
  return 'Promo';
}

export function detectChangesStrict(previous: SnapshotRow, current: SnapshotRow): ChangeEventInput[] {
  const events: ChangeEventInput[] = [];

  const headlineSimilarity = similarity(previous.hero_headline, current.hero_headline);
  const subheadlineSimilarity = similarity(previous.hero_subheadline, current.hero_subheadline);
  const ctaSimilarity = similarity(previous.hero_cta, current.hero_cta);
  const heroSignals = [headlineSimilarity, subheadlineSimilarity, ctaSimilarity].filter((v) => v < 0.7).length;

  if (heroSignals >= 2 || headlineSimilarity < 0.45) {
    events.push({
      section: 'hero',
      changeType: categorizeHero(1 - headlineSimilarity, 1 - subheadlineSimilarity),
      isSignificant: true,
      confidence: Number((1 - Math.min(headlineSimilarity, subheadlineSimilarity)).toFixed(2)),
      summary: 'Hero messaging changed materially.',
      details: {
        previousHeadline: previous.hero_headline,
        currentHeadline: current.hero_headline,
        previousSubheadline: previous.hero_subheadline,
        currentSubheadline: current.hero_subheadline,
        previousCta: previous.hero_cta,
        currentCta: current.hero_cta
      }
    });
  }

  const previousDiscount = previous.promo_discount_amount ? Number(previous.promo_discount_amount) : null;
  const currentDiscount = current.promo_discount_amount ? Number(current.promo_discount_amount) : null;
  const promoTextSimilarity = similarity(previous.promo_discount_text, current.promo_discount_text);

  const promoChanged =
    previous.promo_banner_present !== current.promo_banner_present ||
    previousDiscount !== currentDiscount ||
    previous.promo_multi_week !== current.promo_multi_week ||
    previous.promo_urgency !== current.promo_urgency ||
    promoTextSimilarity < 0.55;

  if (promoChanged) {
    events.push({
      section: 'promo',
      changeType: categorizePromo(current.promo_discount_text),
      isSignificant: true,
      confidence: Number((1 - promoTextSimilarity).toFixed(2)),
      summary: 'Promotional framing or discount structure changed.',
      details: {
        previousBanner: previous.promo_banner_present,
        currentBanner: current.promo_banner_present,
        previousDiscount,
        currentDiscount,
        previousPromoText: previous.promo_discount_text,
        currentPromoText: current.promo_discount_text,
        previousMultiWeek: previous.promo_multi_week,
        currentMultiWeek: current.promo_multi_week,
        previousUrgency: previous.promo_urgency,
        currentUrgency: current.promo_urgency
      }
    });
  }

  const titleSimilarity = similarity(previous.meta_title, current.meta_title);
  if (titleSimilarity < 0.5) {
    events.push({
      section: 'meta_title',
      changeType: 'Positioning',
      isSignificant: true,
      confidence: Number((1 - titleSimilarity).toFixed(2)),
      summary: 'Meta title changed significantly.',
      details: {
        previous: previous.meta_title,
        current: current.meta_title
      }
    });
  }

  return events;
}
