const supportedRegionEnum = ['US', 'CA', 'UK', 'EU', 'AU', 'GLOBAL'] as const;
export const supportedCategories = [
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
] as const;
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
          required: ['type', 'appStoreId'],
          additionalProperties: false,
          properties: {
            type: { const: 'app_store' },
            appStoreId: { type: 'string', pattern: '^[0-9]+$' }
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
    lastIncrease: { type: ['string', 'null'], minLength: 1 },
    increasePercent: { type: ['number', 'null'] }
  }
} as const;

const intelligenceSchema = {
  type: 'object',
  required: ['seasonalPattern', 'valueDriftSignals', 'cancellationDifficulty', 'benchmarkAnchor'],
  additionalProperties: false,
  properties: {
    seasonalPattern: {
      type: 'string',
      enum: ['winter_release_spike', 'new_year_spike', 'back_to_school', 'election_cycle', 'holiday_season', 'none']
    },
    valueDriftSignals: { type: 'array', items: { type: 'string' } },
    cancellationDifficulty: { type: 'number', minimum: 1, maximum: 5 },
    benchmarkAnchor: {
      type: 'object',
      required: ['categoryRank', 'valueScoreBaseline'],
      additionalProperties: false,
      properties: {
        categoryRank: { type: 'number', minimum: 1 },
        valueScoreBaseline: { type: 'number', minimum: 0, maximum: 1 }
      }
    }
  }
} as const;

const recommendationsSchema = {
  type: 'object',
  required: ['alternatives', 'upgradePaths'],
  additionalProperties: false,
  properties: {
    alternatives: { type: 'array', items: { type: 'string' } },
    upgradePaths: {
      type: 'array',
      items: {
        type: 'object',
        required: ['targetPlanId', 'reason'],
        additionalProperties: false,
        properties: {
          targetPlanId: { type: 'string', minLength: 1 },
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

const nullableHttpsUrlSchema = {
  type: ['string', 'null'],
  format: 'uri',
  pattern: '^https://',
  minLength: 1
} as const;

const providerUrlsSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    official: nullableHttpsUrlSchema,
    pricing: nullableHttpsUrlSchema,
    cancellation: nullableHttpsUrlSchema,
    helpCenter: nullableHttpsUrlSchema
  }
} as const;

const providerPlanSchema = {
  type: 'object',
  required: ['planId', 'name', 'billingCycle', 'price'],
  additionalProperties: false,
  properties: {
    planId: { type: 'string', minLength: 1 },
    name: { type: 'string', minLength: 1 },
    billingCycle: { type: 'string', enum: ['monthly', 'yearly', 'weekly', 'quarterly'] },
    price: planPriceSchema,
    notes: { type: ['string', 'null'] },
    urlVisibility: { type: 'string', enum: ['public', 'account_required', 'unknown'] },
    accessHint: { type: ['string', 'null'], minLength: 1 },
    priceTrend: priceTrendSchema,
    source: {
      type: 'object',
      required: ['verifiedAt', 'method'],
      additionalProperties: false,
      properties: {
        url: nullableHttpsUrlSchema,
        verifiedAt: { type: 'string', format: 'date' },
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
    }
  },
  if: { properties: { urlVisibility: { const: 'account_required' } }, required: ['urlVisibility'] },
  then: {
    required: ['accessHint', 'source'],
    properties: {
      accessHint: { type: 'string', minLength: 1 },
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
    urls: providerUrlsSchema,
    intelligence: intelligenceSchema,
    recommendations: recommendationsSchema
  }
} as const;

export const providerSchema = {
  type: 'object',
  required: [
    'version',
    'providerId',
    'name',
    'category',
    'defaultRegion',
    'regions',
    'supported',
    'default',
    'regionalOverrides'
  ],
  additionalProperties: false,
  properties: {
    version: { type: 'string', minLength: 1 },
    providerId: { type: 'string', minLength: 1 },
    name: { type: 'string', minLength: 1 },
    category: {
      type: 'string',
      enum: supportedCategories
    },
    defaultRegion: { type: 'string', enum: supportedRegionEnum },
    regions: {
      type: 'array',
      items: { type: 'string', enum: supportedRegionEnum },
      minItems: 1,
      uniqueItems: true
    },
    supported: { type: 'boolean' },
    default: providerMetaSchema,
    regionalOverrides: {
      type: 'object',
      propertyNames: { type: 'string', enum: supportedRegionEnum },
      additionalProperties: {
        type: 'object',
        additionalProperties: false,
        properties: {
          logo: logoSchema,
          plans: { type: 'array', minItems: 1, items: providerPlanSchema },
          urls: providerUrlsSchema,
          intelligence: intelligenceSchema,
          recommendations: recommendationsSchema
        }
      }
    }
  }
} as const;