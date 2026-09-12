import test from 'node:test';
import assert from 'node:assert/strict';
import { validateProviderFile, validateProvidersDirectory } from '../src/validateProviders.js';
// NodeNext + ESM requires the .js extension in the import specifier.

test('validates a known-good provider file', async () => {
  const result = await validateProviderFile('metadata/providers/netflix.json');
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
});

test('validates the provider directory without errors', async () => {
  const results = await validateProvidersDirectory('metadata/providers');
  assert.equal(results.some((result) => result.valid === false), false);
});
