export type SupportedRegion = 'US' | 'CA' | 'UK' | 'EU' | 'AU' | 'GLOBAL';

export type BillingCycle = 'monthly' | 'yearly' | 'weekly' | 'quarterly';

export type LogoSource =
  | { type: 'app_store'; app_store_id: string }
  | { type: 'official'; url: string };

export type SeasonalPattern =
  | 'winter_release_spike'
  | 'new_year_spike'
  | 'back_to_school'
  | 'election_cycle'
  | 'holiday_season'
  | 'none';

export type TrendDirection = 'upward' | 'downward' | 'flat';

export interface ProviderLogo {
  url: string;
  source: LogoSource;
}

export type UrlVisibility = 'public' | 'account_required' | 'unknown';

export type SourceMethod = 'manual' | 'automated';

export type ManualPlanSource = {
  url: string;
  verified_at: string;
  method: 'manual';
  evidence?: string | null;
};

export type AccountGatedPlanSource = Omit<ManualPlanSource, 'url'> & { url: null };

export type AutomatedPlanSource = {
  url: string;
  verified_at: string;
  method: 'automated';
  evidence: string;
};

export type PlanSource = ManualPlanSource | AutomatedPlanSource;

interface ProviderPlanBase {
  plan_id: string;
  name: string;
  billing_cycle: BillingCycle;
  base_price_usd: number;
  notes?: string;
  price_trend?: PriceTrend;
  urls?: ProviderUrls;
}

export type ProviderPlan = ProviderPlanBase & (
  | {
      url_visibility: 'account_required';
      access_hint: string;
      source: AccountGatedPlanSource;
    }
  | {
      url_visibility?: Exclude<UrlVisibility, 'account_required'>;
      access_hint?: string | null;
      source: PlanSource;
    }
);

export interface ProviderUrls {
  pricing?: string | null;
  cancellation?: string | null;
  help_center?: string | null;
}

export interface ProviderLevelUrls extends ProviderUrls {
  official?: string | null;
}

export interface PriceTrend {
  trend: TrendDirection;
  last_increase?: string | null;
  increase_percent?: number | null;
}

export interface BenchmarkAnchor {
  category_rank: number;
  value_score_baseline: number;
}

export interface Intelligence {
  seasonal_pattern: SeasonalPattern;
  value_drift_signals: string[];
  cancellation_difficulty: number;
  benchmark_anchor: BenchmarkAnchor;
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
  urls: ProviderLevelUrls;
  intelligence?: Intelligence;
  recommendations?: ProviderRecommendations;
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
