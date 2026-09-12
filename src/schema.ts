const supportedRegionEnum = ['US', 'CA', 'UK', 'EU', 'AU', 'GLOBAL'] as const;

const providerMetaSchema = {
  type: 'object',
  required: ['logo', 'plans', 'urls', 'intelligence', 'recommendations'],
  additionalProperties: false,
  properties: {
    logo: {
      type: 'object',
      required: ['source'],
      additionalProperties: false,
      properties: {
        source: { type: 'string', enum: ['app_store', 'play_store', 'cdn', 'fallback'] },
        app_store_id: { type: ['string', 'null'] },
        play_store_package: { type: ['string', 'null'] },
        cdn_url: { type: ['string', 'null'] },
        fallback_icon: { type: ['string', 'null'] }
      }
    },
    plans: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['plan_id', 'name', 'billing_cycle', 'base_price_usd', 'price_last_updated'],
        additionalProperties: false,
        properties: {
          plan_id: { type: 'string', minLength: 1 },
          name: { type: 'string', minLength: 1 },
          billing_cycle: { type: 'string', enum: ['monthly', 'yearly', 'weekly', 'quarterly'] },
          base_price_usd: { type: 'number' },
          price_last_updated: { type: 'string', minLength: 1 },
          notes: { type: ['string', 'null'] },
          url_visibility: { type: 'string', enum: ['public', 'account_required', 'unknown'] },
          access_hint: { type: ['string', 'null'], minLength: 1 },
          urls: {
            type: 'object',
            additionalProperties: false,
            properties: {
              pricing: { type: ['string', 'null'], minLength: 1 },
              cancellation: { type: ['string', 'null'], minLength: 1 },
              help_center: { type: ['string', 'null'], minLength: 1 }
            }
          }
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
    },
    intelligence: {
      type: 'object',
      required: ['seasonal_pattern', 'value_drift_signals', 'cancellation_difficulty', 'benchmark_anchor', 'price_trend'],
      additionalProperties: false,
      properties: {
        seasonal_pattern: {
          type: 'string',
          enum: ['winter_release_spike', 'new_year_spike', 'back_to_school', 'election_cycle', 'holiday_season', 'none']
        },
        value_drift_signals: {
          type: 'array',
          items: { type: 'string' }
        },
        cancellation_difficulty: { type: 'number', minimum: 1, maximum: 5 },
        benchmark_anchor: {
          type: 'object',
          required: ['category_rank', 'value_score_baseline'],
          additionalProperties: false,
          properties: {
            category_rank: { type: 'number', minimum: 1 },
            value_score_baseline: { type: 'number', minimum: 0, maximum: 1 }
          }
        },
        price_trend: {
          type: 'object',
          required: ['trend'],
          additionalProperties: false,
          properties: {
            trend: { type: 'string', enum: ['upward', 'downward', 'flat'] },
            last_increase: { type: ['string', 'null'], minLength: 1 },
            increase_percent: { type: ['number', 'null'] }
          }
        }
      }
    },
    recommendations: {
      type: 'object',
      required: ['alternatives', 'upgrade_paths'],
      additionalProperties: false,
      properties: {
        alternatives: {
          type: 'array',
          items: { type: 'string' }
        },
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
    }
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
          logo: { type: 'object' },
          plans: { type: 'array' },
          urls: { type: 'object' },
          intelligence: { type: 'object' },
          recommendations: { type: 'object' }
        }
      }
    }
  }
} as const;
