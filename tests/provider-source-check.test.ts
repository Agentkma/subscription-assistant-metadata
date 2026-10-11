import fs from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import type { ProviderRecord } from '../src/types.js';
import { checkProviderSource, collectProviderSources } from '../src/checkProviderSources.js';

function mockResponse(status: number, contentType: string, url = ''): Response {
  const response = new Response(null, { status, headers: { 'content-type': contentType } });
  Object.defineProperty(response, 'url', { value: url });
  return response;
}

test('collects configured provider, plan, and logo sources without duplicates', async () => {
  const provider = JSON.parse(
    await fs.readFile('metadata/providers/streaming/amazon_prime_video.json', 'utf8')
  ) as ProviderRecord;
  const originalProvider = structuredClone(provider);
  const sources = collectProviderSources(provider);

  assert.ok(sources.some(({ url, kind }) => url === provider.default.logo.url && kind === 'image'));
  assert.ok(sources.some(({ url, kind }) => url === provider.default.plans[0].source?.url && kind === 'page'));
  assert.equal(new Set(sources.map(({ url, kind }) => `${kind}:${url}`)).size, sources.length);
  assert.equal(sources.some(({ url }) => url === 'https://unused.example'), false);
  assert.deepEqual(provider, originalProvider);
});

test('reports a successful HTML page check', async () => {
  const result = await checkProviderSource('https://provider.example/pricing', 'page', async (input) =>
    mockResponse(200, 'text/html; charset=utf-8', String(input))
  );

  assert.equal(result.status, 'ok');
  assert.match(result.detail, /text\/html/);
});

test('reports a successful image check only for image content', async () => {
  const imageResult = await checkProviderSource('https://provider.example/logo.png', 'image', async (input) =>
    mockResponse(200, 'image/png', String(input))
  );
  const htmlResult = await checkProviderSource('https://provider.example/logo.png', 'image', async (input) =>
    mockResponse(200, 'text/html', String(input))
  );

  assert.equal(imageResult.status, 'ok');
  assert.equal(htmlResult.status, 'error');
  assert.match(htmlResult.detail, /Expected image/);
});

test('classifies access-limited responses as inconclusive instead of broken', async () => {
  const result = await checkProviderSource('https://provider.example/pricing', 'page', async () =>
    new Response(null, { status: 403 })
  );

  assert.equal(result.status, 'blocked');
  assert.match(result.detail, /manual review/);
});

test('reports missing pages and network failures as errors', async () => {
  const missing = await checkProviderSource('https://provider.example/missing', 'page', async () =>
    new Response(null, { status: 404 })
  );
  const networkFailure = await checkProviderSource('https://provider.example/pricing', 'page', async () => {
    throw new Error('connection timed out');
  });

  assert.equal(missing.status, 'error');
  assert.match(missing.detail, /HTTP 404/);
  assert.equal(networkFailure.status, 'error');
  assert.match(networkFailure.detail, /connection timed out/);
});