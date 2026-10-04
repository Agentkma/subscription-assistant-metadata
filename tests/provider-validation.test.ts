import fs from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import { Ajv } from 'ajv';
import { providerSchema } from '../src/schema.js';
import { validateProviderFile, validateProvidersDirectory } from '../src/validateProviders.js';
// NodeNext + ESM requires the .js extension in the import specifier.

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
  const validate = new Ajv({ allErrors: true, strict: false, allowUnionTypes: true }).compile(providerSchema);
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

test('requires evidence when plan source method is automated', async () => {
  const ajv = new Ajv({ allErrors: true, strict: false, allowUnionTypes: true });
  const validate = ajv.compile(providerSchema);
  const raw = await fs.readFile('metadata/providers/streaming/amazon_prime_video.json', 'utf8');
  const provider = JSON.parse(raw);
  const source = provider.default.plans[0].source;

  source.method = 'automated';
  source.evidence = null;
  assert.equal(validate(provider), false);

  delete source.evidence;
  assert.equal(validate(provider), false);

  source.evidence = 'Prime membership $14.99/month';
  assert.equal(validate(provider), true);
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
