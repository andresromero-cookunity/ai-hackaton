export type ViewportKind = 'desktop' | 'mobile';

export type ExtractedContent = {
  metaTitle: string | null;
  heroHeadline: string | null;
  heroSubheadline: string | null;
  heroCta: string | null;
  promoBannerPresent: boolean;
  promoDiscountAmount: number | null;
  promoDiscountText: string | null;
  promoValueAdd: string | null;
  promoMultiWeek: boolean | null;
  promoUrgency: string | null;
};

export type Competitor = {
  id: number;
  name: string;
  url: string;
  priority: number;
  active: boolean;
};

export type SnapshotRow = {
  id: number;
  competitor_id: number;
  captured_at: string;
  viewport: ViewportKind;
  screenshot_url: string;
  screenshot_hash: string;
  meta_title: string | null;
  hero_headline: string | null;
  hero_subheadline: string | null;
  hero_cta: string | null;
  promo_banner_present: boolean | null;
  promo_discount_amount: string | null;
  promo_discount_text: string | null;
  promo_value_add: string | null;
  promo_multi_week: boolean | null;
  promo_urgency: string | null;
};

export type ChangeCategory = 'Positioning' | 'Promo' | 'Seasonal' | 'Experiment-like';

export type ChangeEventInput = {
  section: 'hero' | 'promo' | 'meta_title';
  changeType: ChangeCategory;
  isSignificant: boolean;
  confidence: number;
  summary: string;
  details: Record<string, unknown>;
};

export type SemanticAnalysisOutput = {
  categories: ChangeCategory[];
  inferredIntent: string;
  summary: string;
  experimentSuggestion: string;
  signals: string[];
};
