export type SupportedRegion = 'US' | 'CA' | 'UK' | 'EU' | 'AU' | 'GLOBAL';

export type BillingCycle = 'monthly' | 'yearly' | 'weekly' | 'quarterly';

export type LogoSource = 'app_store' | 'play_store' | 'cdn' | 'fallback';

export type SeasonalPattern =
  | 'winter_release_spike'
  | 'new_year_spike'
  | 'back_to_school'
  | 'election_cycle'
  | 'holiday_season'
  | 'none';

export type TrendDirection = 'upward' | 'downward' | 'flat';

export interface ProviderLogo {
  source: LogoSource;
  app_store_id?: string | null;
  play_store_package?: string | null;
  cdn_url?: string | null;
  fallback_icon?: string | null;
}

export type UrlVisibility = 'public' | 'account_required' | 'unknown';

export interface ProviderPlan {
  plan_id: string;
  name: string;
  billing_cycle: BillingCycle;
  base_price_usd: number;
  price_last_updated: string;
  notes?: string;
  url_visibility?: UrlVisibility;
  access_hint?: string | null;
  urls?: ProviderUrls;
}

export interface ProviderUrls {
  pricing?: string | null;
  cancellation?: string | null;
  help_center?: string | null;
}

export interface BenchmarkAnchor {
  category_rank: number;
  value_score_baseline: number;
}

export interface PriceTrend {
  trend: TrendDirection;
  last_increase?: string | null;
  increase_percent?: number | null;
}

export interface Intelligence {
  seasonal_pattern: SeasonalPattern;
  value_drift_signals: string[];
  cancellation_difficulty: number;
  benchmark_anchor: BenchmarkAnchor;
  price_trend: PriceTrend;
}

export interface UpgradePath {
  target_plan_id: string;
  reason: string;
}

export interface ProviderRecommendations {
  alternatives: string[];
  upgrade_paths: UpgradePath[];
}

export interface ProviderDefault {
  logo: ProviderLogo;
  plans: ProviderPlan[];
  urls: ProviderUrls;
  intelligence: Intelligence;
  recommendations: ProviderRecommendations;
}

export interface ProviderOverride extends Partial<ProviderDefault> {}

export interface ProviderRecord {
  version: string;
  provider_id: string;
  name: string;
  category: string;
  default_region: SupportedRegion;
  regions: SupportedRegion[];
  supported: boolean;
  default: ProviderDefault;
  regional_overrides: Partial<Record<SupportedRegion, ProviderOverride>>;
}
