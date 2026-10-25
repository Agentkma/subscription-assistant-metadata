export type SupportedRegion = 'US' | 'CA' | 'UK' | 'EU' | 'AU' | 'GLOBAL';

export type BillingCycle = 'monthly' | 'yearly' | 'weekly' | 'quarterly';

export type LogoSource =
  | { type: 'app_store'; appStoreId: string }
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
  verifiedAt: string;
  method: 'manual';
  evidence?: string | null;
};

export type AccountGatedPlanSource = Omit<ManualPlanSource, 'url'> & { url: null };

export type AutomatedPlanSource = {
  url: string;
  verifiedAt: string;
  method: 'automated';
  evidence: string;
};

export type PlanSource = ManualPlanSource | AutomatedPlanSource;

export interface PlanPrice {
  amount: number;
  currency: string;
}

interface ProviderPlanBase {
  planId: string;
  name: string;
  billingCycle: BillingCycle;
  price: PlanPrice;
  notes?: string | null;
  priceTrend?: PriceTrend;
}

export type ProviderPlan = ProviderPlanBase & (
  | {
      urlVisibility: 'account_required';
      accessHint: string;
      source: AccountGatedPlanSource;
    }
  | {
      urlVisibility?: Exclude<UrlVisibility, 'account_required'>;
      accessHint?: string | null;
      source: PlanSource;
    }
);

export interface ProviderUrls {
  official?: string | null;
  pricing?: string | null;
  cancellation?: string | null;
  helpCenter?: string | null;
}

export type ProviderLevelUrls = ProviderUrls;

export interface PriceTrend {
  trend: TrendDirection;
  lastIncrease?: string | null;
  increasePercent?: number | null;
}

export interface BenchmarkAnchor {
  categoryRank: number;
  valueScoreBaseline: number;
}

export interface Intelligence {
  seasonalPattern: SeasonalPattern;
  valueDriftSignals: string[];
  cancellationDifficulty: number;
  benchmarkAnchor: BenchmarkAnchor;
}

export interface UpgradePath {
  targetPlanId: string;
  reason: string;
}

export interface ProviderRecommendations {
  alternatives: string[];
  upgradePaths: UpgradePath[];
}

export interface ProviderDefault {
  logo: ProviderLogo;
  plans: ProviderPlan[];
  urls: ProviderLevelUrls;
  intelligence?: Intelligence;
  recommendations?: ProviderRecommendations;
}

export type ProviderOverride = Partial<ProviderDefault>;

export interface ProviderRecord {
  version: string;
  providerId: string;
  name: string;
  category: string;
  defaultRegion: SupportedRegion;
  regions: SupportedRegion[];
  supported: boolean;
  default: ProviderDefault;
  regionalOverrides: Partial<Record<SupportedRegion, ProviderOverride>>;
}

export interface CategoryDefinition {
  id: string;
  name: string;
  displayName: string;
}

export interface CategoryRecord extends CategoryDefinition {
  providerCount: number;
}

export interface VersionManifest {
  bundleVersion: string;
  schemaVersion: string;
  publishedAt: string;
  gitSha: string;
}

export interface ProvidersBundle {
  bundleVersion: string;
  schemaVersion: string;
  publishedAt: string;
  categories: CategoryRecord[];
  providers: ProviderRecord[];
}
