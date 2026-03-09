import { load } from 'cheerio';

export type CompetitorSeed = {
  name: string;
  url: string;
  priority: number;
};

const FALLBACK_TOP_10: CompetitorSeed[] = [
  { name: 'HelloFresh', url: 'https://www.hellofresh.com/', priority: 1 },
  { name: 'Blue Apron', url: 'https://www.blueapron.com/', priority: 2 },
  { name: 'Home Chef', url: 'https://www.homechef.com/', priority: 3 },
  { name: 'EveryPlate', url: 'https://www.everyplate.com/', priority: 4 },
  { name: 'Factor', url: 'https://www.factor75.com/', priority: 5 },
  { name: 'Green Chef', url: 'https://www.greenchef.com/', priority: 6 },
  { name: 'Dinnerly', url: 'https://dinnerly.com/', priority: 7 },
  { name: 'Sunbasket', url: 'https://sunbasket.com/', priority: 8 },
  { name: 'Gobble', url: 'https://www.gobble.com/', priority: 9 },
  { name: 'Purple Carrot', url: 'https://www.purplecarrot.com/', priority: 10 }
];

function cleanName(name: string): string {
  return name.replace(/\s+/g, ' ').replace(/\|.*$/, '').trim();
}

function isValidCompetitorUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    return !/(foodtechrace\.replit\.app|cookunity\.com|google\.com|docs\.google\.com)/i.test(parsed.hostname);
  } catch {
    return false;
  }
}

export async function fetchTopCompetitorsFromSource(limit = 10): Promise<CompetitorSeed[]> {
  try {
    const response = await fetch('https://foodtechrace.replit.app/', {
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; CompetitorSnapshotBot/1.0)'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Source fetch failed with status ${response.status}`);
    }

    const html = await response.text();
    const $ = load(html);

    const candidates: CompetitorSeed[] = [];
    const seen = new Set<string>();

    $('a').each((_, el) => {
      const href = ($(el).attr('href') || '').trim();
      const label = cleanName($(el).text() || '');

      if (!isValidCompetitorUrl(href) || seen.has(href)) return;

      seen.add(href);
      candidates.push({
        name: label || new URL(href).hostname.replace('www.', ''),
        url: href,
        priority: candidates.length + 1
      });
    });

    if (candidates.length >= 5) {
      return candidates.slice(0, limit);
    }

    throw new Error('Insufficient candidates parsed from source.');
  } catch {
    return FALLBACK_TOP_10.slice(0, limit);
  }
}
