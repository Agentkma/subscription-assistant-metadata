const supportedRegionEnum = ['US', 'CA', 'UK', 'EU', 'AU', 'GLOBAL'] as const;
const supportedCurrencyCodes = new Set(Intl.supportedValuesOf('currency'));

export const isSupportedCurrencyCode = (currency: string): boolean => supportedCurrencyCodes.has(currency);

const logoSchema = {
  type: 'object',
  required: ['url', 'source'],
  additionalProperties: false,
  properties: {
    url: { type: 'string', format: 'uri', pattern: '^https://' },
    source: {
      oneOf: [
        {
          type: 'object',
          required: ['type', 'app_store_id'],
          additionalProperties: false,
          properties: {
            type: { const: 'app_store' },
            app_store_id: { type: 'string', pattern: '^[0-9]+$' }
          }
        },
        {
          type: 'object',
          required: ['type', 'url'],
          additionalProperties: false,
          properties: {
            type: { const: 'official' },
            url: { type: 'string', format: 'uri', pattern: '^https://' }
          }
        }
      ]
    }
  }
} as const;

const priceTrendSchema = {
  type: 'object',
  required: ['trend'],
  additionalProperties: false,
  properties: {
    trend: { type: 'string', enum: ['upward', 'downward', 'flat'] },
    last_increase: { type: ['string', 'null'], minLength: 1 },
    increase_percent: { type: ['number', 'null'] }
  }
} as const;

const intelligenceSchema = {
  type: 'object',
  required: ['seasonal_pattern', 'value_drift_signals', 'cancellation_difficulty', 'benchmark_anchor'],
  additionalProperties: false,
  properties: {
    seasonal_pattern: {
      type: 'string',
      enum: ['winter_release_spike', 'new_year_spike', 'back_to_school', 'election_cycle', 'holiday_season', 'none']
    },
    value_drift_signals: { type: 'array', items: { type: 'string' } },
    cancellation_difficulty: { type: 'number', minimum: 1, maximum: 5 },
    benchmark_anchor: {
      type: 'object',
      required: ['category_rank', 'value_score_baseline'],
      additionalProperties: false,
      properties: {
        category_rank: { type: 'number', minimum: 1 },
        value_score_baseline: { type: 'number', minimum: 0, maximum: 1 }
      }
    }
  }
} as const;

const recommendationsSchema = {
  type: 'object',
  required: ['alternatives', 'upgrade_paths'],
  additionalProperties: false,
  properties: {
    alternatives: { type: 'array', items: { type: 'string' } },
    upgrade_paths: {
      type: 'array',
      items: {
        type: 'object',
        required: ['target_plan_id', 'reason'],
        additionalProperties: false,
        properties: {
          target_plan_id: { type: 'string', minLength: 1 },
          reason: { type: 'string', minLength: 1 }
        }
      }
    }
  }
} as const;

const planPriceSchema = {
  type: 'object',
  required: ['amount', 'currency'],
  additionalProperties: false,
  properties: {
    amount: { type: 'number', minimum: 0 },
    currency: { type: 'string', format: 'iso4217', pattern: '^[A-Z]{3}$' }
  }
} as const;

const providerPlanSchema = {
  type: 'object',
  required: ['plan_id', 'name', 'billing_cycle', 'price'],
  additionalProperties: false,
  properties: {
    plan_id: { type: 'string', minLength: 1 },
    name: { type: 'string', minLength: 1 },
    billing_cycle: { type: 'string', enum: ['monthly', 'yearly', 'weekly', 'quarterly'] },
    price: planPriceSchema,
    notes: { type: ['string', 'null'] },
    url_visibility: { type: 'string', enum: ['public', 'account_required', 'unknown'] },
    access_hint: { type: ['string', 'null'], minLength: 1 },
    price_trend: priceTrendSchema,
    source: {
      type: 'object',
      required: ['verified_at', 'method'],
      additionalProperties: false,
      properties: {
        url: { type: ['string', 'null'], format: 'uri', pattern: '^https://', minLength: 1 },
        verified_at: { type: 'string', format: 'date' },
        method: { type: 'string', enum: ['manual', 'automated'] },
        evidence: { type: ['string', 'null'], minLength: 1 }
      },
      if: { properties: { method: { const: 'automated' } }, required: ['method'] },
      then: {
        required: ['url', 'evidence'],
        properties: {
          url: { type: 'string', format: 'uri', pattern: '^https://', minLength: 1 },
          evidence: { type: 'string', minLength: 1 }
        }
      }
    },
    urls: {
      type: 'object',
      additionalProperties: false,
      properties: {
        pricing: { type: ['string', 'null'], minLength: 1 },
        cancellation: { type: ['string', 'null'], minLength: 1 },
        help_center: { type: ['string', 'null'], minLength: 1 }
      }
    }
  },
  if: { properties: { url_visibility: { const: 'account_required' } }, required: ['url_visibility'] },
  then: {
    required: ['access_hint', 'source'],
    properties: {
      access_hint: { type: 'string', minLength: 1 },
      source: {
        required: ['method', 'url'],
        properties: {
          method: { const: 'manual' },
          url: { type: 'null' }
        }
      }
    }
  },
  else: {
    required: ['source'],
    properties: {
      source: {
        required: ['url'],
        properties: {
          url: { type: 'string', format: 'uri', pattern: '^https://', minLength: 1 }
        }
      }
    }
  }
} as const;

const providerMetaSchema = {
  type: 'object',
  required: ['logo', 'plans', 'urls'],
  additionalProperties: false,
  properties: {
    logo: logoSchema,
    plans: {
      type: 'array',
      minItems: 1,
      items: providerPlanSchema
    },
    urls: {
      type: 'object',
      additionalProperties: false,
      properties: {
        official: { type: ['string', 'null'], minLength: 1 },
        pricing: { type: ['string', 'null'], minLength: 1 },
        cancellation: { type: ['string', 'null'], minLength: 1 },
        help_center: { type: ['string', 'null'], minLength: 1 }
      }
    },
    intelligence: intelligenceSchema,
    recommendations: recommendationsSchema
  }
} as const;

export const providerSchema = {
  type: 'object',
  required: [
    'version',
    'provider_id',
    'name',
    'category',
    'default_region',
    'regions',
    'supported',
    'default',
    'regional_overrides'
  ],
  additionalProperties: false,
  properties: {
    version: { type: 'string', minLength: 1 },
    provider_id: { type: 'string', minLength: 1 },
    name: { type: 'string', minLength: 1 },
    category: {
      type: 'string',
      enum: [
        'streaming',
        'music_audio',
        'productivity',
        'fitness_wellness',
        'learning',
        'gaming',
        'news_reading',
        'utilities_tools',
        'lifestyle',
        'shopping_memberships'
      ]
    },
    default_region: { type: 'string', enum: supportedRegionEnum },
    regions: {
      type: 'array',
      items: { type: 'string', enum: supportedRegionEnum },
      minItems: 1,
      uniqueItems: true
    },
    supported: { type: 'boolean' },
    default: providerMetaSchema,
    regional_overrides: {
      type: 'object',
      propertyNames: { type: 'string', enum: supportedRegionEnum },
      additionalProperties: {
        type: 'object',
        additionalProperties: false,
        properties: {
          logo: logoSchema,
          plans: { type: 'array', minItems: 1, items: providerPlanSchema },
          urls: { type: 'object' },
          intelligence: intelligenceSchema,
          recommendations: recommendationsSchema
        }
      }
    }
  }
} as const;
