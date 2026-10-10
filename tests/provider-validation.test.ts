import fs from 'node:fs/promises';
import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { Ajv as JsonValidator } from 'ajv';
import { fullFormats } from 'ajv-formats/dist/formats.js';
import { isSupportedCurrencyCode, providerSchema } from '../src/schema.js';
import { validateProviderFile, validateProvidersDirectory } from '../src/validateProviders.js';
// NodeNext + ESM requires the .js extension in the import specifier.

const createJsonValidator = () =>
  new JsonValidator({ allErrors: true, strict: false, allowUnionTypes: true })
    .addFormat('uri', fullFormats.uri)
    .addFormat('date', fullFormats.date)
    .addFormat('iso4217', isSupportedCurrencyCode);

interface ProviderFixture {
  default: {
    plans: Array<{
      source?: {
        url?: string | null;
        verified_at?: string;
        method?: string;
        evidence?: string | null;
      };
      url_visibility?: string;
      access_hint?: string | null;
      price: { amount: number; currency: string };
      price_trend?: { trend: string };
    }>;
    logo: { url?: string | null; source?: unknown; [key: string]: unknown };
  };
  regional_overrides: Record<string, { plans?: ProviderFixture['default']['plans']; logo?: ProviderFixture['default']['logo'] }>;
}

interface ProviderValidationCase {
  name: string;
  valid: boolean;
  mutate: (provider: ProviderFixture) => void;
}

async function runProviderValidationCases(
  context: TestContext,
  file: string,
  cases: ProviderValidationCase[]
): Promise<void> {
  const validate = createJsonValidator().compile(providerSchema);
  const provider = JSON.parse(await fs.readFile(file, 'utf8')) as ProviderFixture;

  for (const validationCase of cases) {
    await context.test(validationCase.name, () => {
      const candidate = structuredClone(provider);
      validationCase.mutate(candidate);
      assert.equal(validate(candidate), validationCase.valid);
    });
  }
}

test('validates a known-good provider file', async () => {
  const result = await validateProviderFile('metadata/providers/streaming/netflix.json');
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
});

test('validates the provider directory without errors', async () => {
  const results = await validateProvidersDirectory('metadata/providers');
  assert.equal(results.some((result) => result.valid === false), false);
  assert.deepEqual(
    results.map((result) => result.file.split(/[\\/]/).slice(-2).join('/')).sort(),
    ['music_audio/spotify.json', 'streaming/amazon_prime_video.json', 'streaming/netflix.json'].sort()
  );
});

test('validates the US-only default-plus-region schema', async () => {
  const raw = await fs.readFile('metadata/providers/streaming/netflix.json', 'utf8');
  const provider = JSON.parse(raw);

  assert.equal(provider.default_region, 'US');
  assert.deepEqual(provider.regions, ['US']);
  assert.equal(typeof provider.default, 'object');
  assert.equal(Array.isArray(provider.default.plans), true);
  assert.equal(typeof provider.regional_overrides, 'object');
  assert.deepEqual(Object.keys(provider.regional_overrides), ['US']);
});

test('public contract accepts optional insights, recommendations, and plan trends', async () => {
  const validate = createJsonValidator().compile(providerSchema);
  const raw = await fs.readFile('metadata/providers/streaming/netflix.json', 'utf8');
  const provider = JSON.parse(raw);

  assert.equal(validate(provider), true);

  const withInsights = structuredClone(provider);
  withInsights.default.intelligence = {
    seasonal_pattern: 'none',
    value_drift_signals: ['price_increase'],
    cancellation_difficulty: 3,
    benchmark_anchor: { category_rank: 1, value_score_baseline: 0.8 }
  };
  withInsights.default.recommendations = { alternatives: [], upgrade_paths: [] };
  assert.equal(validate(withInsights), true);

  withInsights.default.intelligence.cancellation_difficulty = 6;
  assert.equal(validate(withInsights), false);

  const withPlanTrend = structuredClone(provider);
  withPlanTrend.default.plans[0].price_trend = { trend: 'flat' };
  assert.equal(validate(withPlanTrend), true);

  withPlanTrend.default.plans[0].price_trend = { trend: 'sideways' };
  assert.equal(validate(withPlanTrend), false);
});

test('validates automated plan provenance', async (context) => {
  await runProviderValidationCases(context, 'metadata/providers/streaming/amazon_prime_video.json', [
    {
      name: 'rejects null evidence',
      valid: false,
      mutate: (provider) => {
        provider.default.plans[0].source!.method = 'automated';
        provider.default.plans[0].source!.evidence = null;
      }
    },
    {
      name: 'rejects missing evidence',
      valid: false,
      mutate: (provider) => {
        provider.default.plans[0].source!.method = 'automated';
        delete provider.default.plans[0].source!.evidence;
      }
    },
    {
      name: 'rejects missing source URL',
      valid: false,
      mutate: (provider) => {
        provider.default.plans[0].source!.method = 'automated';
        provider.default.plans[0].source!.evidence = 'Prime membership $14.99/month';
        delete provider.default.plans[0].source!.url;
      }
    },
    {
      name: 'rejects null source URL',
      valid: false,
      mutate: (provider) => {
        provider.default.plans[0].source!.method = 'automated';
        provider.default.plans[0].source!.evidence = 'Prime membership $14.99/month';
        provider.default.plans[0].source!.url = null;
      }
    },
    {
      name: 'accepts an HTTPS source URL with evidence',
      valid: true,
      mutate: (provider) => {
        provider.default.plans[0].source!.method = 'automated';
        provider.default.plans[0].source!.evidence = 'Prime membership $14.99/month';
      }
    }
  ]);
});

test('validates account-gated plan provenance', async (context) => {
  await runProviderValidationCases(context, 'metadata/providers/streaming/amazon_prime_video.json', [
    {
      name: 'rejects a missing access hint',
      valid: false,
      mutate: (provider) => {
        delete provider.default.plans[2].access_hint;
      }
    },
    {
      name: 'rejects an empty access hint',
      valid: false,
      mutate: (provider) => {
        provider.default.plans[2].access_hint = '';
      }
    },
    {
      name: 'rejects automated provenance',
      valid: false,
      mutate: (provider) => {
        provider.default.plans[2].source!.method = 'automated';
        provider.default.plans[2].source!.evidence = 'Plan details';
      }
    },
    {
      name: 'rejects a missing source URL field',
      valid: false,
      mutate: (provider) => {
        delete provider.default.plans[2].source!.url;
      }
    },
    {
      name: 'rejects a public source URL',
      valid: false,
      mutate: (provider) => {
        provider.default.plans[2].source!.url = 'https://www.amazon.com/prime';
      }
    },
    { name: 'accepts manual provenance with a null source URL and access hint', valid: true, mutate: () => {} }
  ]);
});

test('records manual source URLs and verification dates for every public seed plan', async () => {
  const providers = [
    'metadata/providers/streaming/netflix.json',
    'metadata/providers/streaming/amazon_prime_video.json',
    'metadata/providers/music_audio/spotify.json'
  ];

  for (const file of providers) {
    const provider = JSON.parse(await fs.readFile(file, 'utf8'));

    for (const plan of provider.default.plans) {
      assert.equal(plan.source.method, 'manual', `${provider.provider_id}/${plan.plan_id}`);
      assert.equal(plan.source.verified_at, '2026-10-03', `${provider.provider_id}/${plan.plan_id}`);

      if (plan.url_visibility === 'account_required') {
        assert.equal(plan.source.url, null);
        continue;
      }

      assert.equal(typeof plan.source.url, 'string', `${provider.provider_id}/${plan.plan_id}`);
    }
  }
});

test('validates plan price and provenance constraints', async (context) => {
  await runProviderValidationCases(context, 'metadata/providers/streaming/netflix.json', [
    {
      name: 'rejects missing plan source',
      valid: false,
      mutate: (provider) => {
        delete provider.default.plans[0].source;
      }
    },
    {
      name: 'rejects missing source URL',
      valid: false,
      mutate: (provider) => {
        delete provider.default.plans[0].source!.url;
      }
    },
    ...[
      ['rejects an HTTP source URL', 'http://www.netflix.com/signup'],
      ['rejects a malformed source URL', 'not a URL']
    ].map(([name, url]) => ({
      name,
      valid: false,
      mutate: (provider: ProviderFixture) => {
        provider.default.plans[0].source!.url = url;
      }
    })),
    {
      name: 'rejects an invalid verification date',
      valid: false,
      mutate: (provider) => {
        provider.default.plans[0].source!.verified_at = 'not-a-date';
      }
    },
    {
      name: 'rejects the legacy USD-specific price field',
      valid: false,
      mutate: (provider) => {
        (provider.default.plans[0] as unknown as Record<string, unknown>).base_price_usd = 8.99;
      }
    },
    ...['usd', 'US', 'USDX', 'ZZZ'].map((currency) => ({
      name: `rejects currency ${currency}`,
      valid: false,
      mutate: (provider: ProviderFixture) => {
        provider.default.plans[0].price.currency = currency;
      }
    })),
    {
      name: 'accepts ISO currency USD',
      valid: true,
      mutate: (provider) => {
        provider.default.plans[0].price.currency = 'USD';
      }
    },
    {
      name: 'rejects missing currency',
      valid: false,
      mutate: (provider) => {
        delete (provider.default.plans[0].price as Partial<typeof provider.default.plans[0]['price']>).currency;
      }
    },
    {
      name: 'rejects negative price amounts',
      valid: false,
      mutate: (provider) => {
        provider.default.plans[0].price.amount = -1;
      }
    },
    {
      name: 'applies source URL constraints to regional plan overrides',
      valid: false,
      mutate: (provider) => {
        provider.regional_overrides.US.plans = [structuredClone(provider.default.plans[0])];
        provider.regional_overrides.US.plans[0].source!.url = 'http://www.netflix.com/signup';
      }
    }
  ]);
});

test('validates logo URL and source combinations', async (context) => {
  await runProviderValidationCases(context, 'metadata/providers/music_audio/spotify.json', [
    {
      name: 'rejects a missing logo URL',
      valid: false,
      mutate: (provider) => {
        delete provider.default.logo.url;
      }
    },
    {
      name: 'rejects a missing logo source',
      valid: false,
      mutate: (provider) => {
        delete provider.default.logo.source;
      }
    },
    ...[
      ['', 'empty URL'],
      [null, 'null URL'],
      ['not a URL', 'malformed URL'],
      ['https://bad host/icon.png', 'URL containing an invalid host'],
      ['http://example.com/icon.png', 'non-HTTPS URL']
    ].map(([url, description]) => ({
      name: `rejects ${description}`,
      valid: false,
      mutate: (provider: ProviderFixture) => {
        provider.default.logo.url = url;
      }
    })),
    ...[
      [{ type: 'app_store' }, 'App Store source without an ID'],
      [{ type: 'app_store', app_store_id: '' }, 'empty App Store ID'],
      [{ type: 'app_store', app_store_id: 'spotify' }, 'non-numeric App Store ID'],
      [{ type: 'app_store', app_store_id: null }, 'null App Store ID'],
      [{ type: 'app_store', app_store_id: '324684580', url: 'https://www.spotify.com' }, 'extra field in App Store source'],
      [{ type: 'official' }, 'official source without a URL'],
      [{ type: 'official', url: 'not a URL' }, 'malformed official source URL'],
      [{ type: 'official', url: 'http://www.spotify.com' }, 'non-HTTPS official source URL'],
      [{ type: 'play_store', play_store_package: 'com.spotify.music' }, 'unsupported Play Store source']
    ].map(([source, description]) => ({
      name: `rejects ${description}`,
      valid: false,
      mutate: (provider: ProviderFixture) => {
        provider.default.logo.source = source;
      }
    })),
    {
      name: 'rejects legacy fallback metadata',
      valid: false,
      mutate: (provider) => {
        provider.default.logo.fallback_icon = 'spotify';
      }
    },
    {
      name: 'rejects the legacy source string and CDN fields',
      valid: false,
      mutate: (provider) => {
        provider.default.logo.source = 'fallback';
        provider.default.logo.app_store_id = '324684580';
        provider.default.logo.cdn_url = provider.default.logo.url;
      }
    },
    {
      name: 'accepts an official logo source',
      valid: true,
      mutate: (provider) => {
        provider.default.logo.source = { type: 'official', url: 'https://www.spotify.com' };
      }
    },
    {
      name: 'accepts a valid regional logo override',
      valid: true,
      mutate: (provider) => {
        provider.regional_overrides.US.logo = structuredClone(provider.default.logo);
      }
    },
    {
      name: 'rejects an invalid regional logo override',
      valid: false,
      mutate: (provider) => {
        provider.regional_overrides.US.logo = { source: 'fallback' };
      }
    }
  ]);
});

test('contains the canonical MVP category catalog', async () => {
  const raw = await fs.readFile('metadata/categories.json', 'utf8');
  const categories = JSON.parse(raw);

  assert.equal(Array.isArray(categories), true);
  assert.equal(categories.length, 10);
  assert.deepEqual(
    categories.map((category: { id: string }) => category.id).sort(),
    [
      'fitness_wellness',
      'gaming',
      'learning',
      'lifestyle',
      'music_audio',
      'news_reading',
      'productivity',
      'shopping_memberships',
      'streaming',
      'utilities_tools'
    ].sort()
  );
});
