import { load } from 'cheerio';
import type { ExtractedContent } from './types';

const HEADLINE_SELECTORS = [
  'main h1',
  'header h1',
  'section h1',
  '[data-testid*="hero"] h1',
  '.hero h1'
];

const SUBHEADLINE_SELECTORS = [
  'main h2',
  'header h2',
  '[data-testid*="hero"] p',
  '.hero p',
  'main p'
];

const CTA_SELECTORS = [
  '[data-testid*="hero"] a',
  '[data-testid*="hero"] button',
  '.hero a',
  '.hero button',
  'main a',
  'main button'
];

function firstText($: ReturnType<typeof load>, selectors: string[]): string | null {
  for (const selector of selectors) {
    const value = $(selector)
      .first()
      .text()
      .replace(/\s+/g, ' ')
      .trim();

    if (value.length > 1) {
      return value;
    }
  }

  return null;
}

function findPromoText($: ReturnType<typeof load>): string | null {
  const promoCandidates = [
    '[class*="promo"]',
    '[id*="promo"]',
    '[class*="banner"]',
    '[class*="offer"]',
    '[data-testid*="promo"]',
    'main'
  ];

  for (const selector of promoCandidates) {
    const text = $(selector)
      .first()
      .text()
      .replace(/\s+/g, ' ')
      .trim();

    if (/(\$\d+|\d+%\s*off|discount|save|free|credit|bundle|deal|offer)/i.test(text)) {
      return text.slice(0, 400);
    }
  }

  return null;
}

function parseDiscountAmount(text: string | null): number | null {
  if (!text) {
    return null;
  }

  const dollars = text.match(/\$(\d{1,4})(?!\d)/);
  if (dollars) {
    return Number(dollars[1]);
  }

  const percent = text.match(/(\d{1,2})\s*%\s*off/i);
  if (percent) {
    return Number(percent[1]);
  }

  return null;
}

function parseValueAdd(text: string | null): string | null {
  if (!text) {
    return null;
  }

  const patterns = [
    /free shipping/i,
    /free gift/i,
    /free meals?/i,
    /credits?/i,
    /bundle/i,
    /add[- ]on/i
  ];

  const matched = patterns.find((pattern) => pattern.test(text));
  return matched ? matched.source.replace(/\\/g, '') : null;
}

function parseUrgency(text: string | null): string | null {
  if (!text) {
    return null;
  }

  if (/(today only|ends? (soon|tonight|today)|last chance|limited time|hurry)/i.test(text)) {
    return 'high';
  }

  if (/(this week|new year|holiday|seasonal|weekly)/i.test(text)) {
    return 'medium';
  }

  return null;
}

function parseMultiWeek(text: string | null): boolean | null {
  if (!text) {
    return null;
  }

  if (/(\d+)\s*weeks?/i.test(text) || /first\s*(\d+)\s*boxes?/i.test(text)) {
    return true;
  }

  if (/(first order|first box|today only|one-time)/i.test(text)) {
    return false;
  }

  return null;
}

export function extractContent(html: string, pageTitle: string | null): ExtractedContent {
  const $ = load(html);
  const heroHeadline = firstText($, HEADLINE_SELECTORS);
  const heroSubheadline = firstText($, SUBHEADLINE_SELECTORS);
  const heroCta = firstText($, CTA_SELECTORS);
  const promoText = findPromoText($);

  return {
    metaTitle: pageTitle?.trim() || $('title').first().text().trim() || null,
    heroHeadline,
    heroSubheadline,
    heroCta,
    promoBannerPresent: Boolean(promoText),
    promoDiscountAmount: parseDiscountAmount(promoText),
    promoDiscountText: promoText,
    promoValueAdd: parseValueAdd(promoText),
    promoMultiWeek: parseMultiWeek(promoText),
    promoUrgency: parseUrgency(promoText)
  };
}
