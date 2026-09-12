import fs from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
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
