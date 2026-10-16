import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import type { ProviderRecord } from '../src/types.js';
import { checkProviderSource, checkProviderSources, collectProviderSources } from '../src/checkProviderSources.js';

function mockResponse(status: number, contentType: string, url = '', redirected = false): Response {
  const response = new Response(null, { status, headers: { 'content-type': contentType } });
  Object.defineProperty(response, 'url', { value: url });
  Object.defineProperty(response, 'redirected', { value: redirected });
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

test('collects official logo provenance URLs as page sources', async () => {
  const provider = JSON.parse(
    await fs.readFile('metadata/providers/streaming/amazon_prime_video.json', 'utf8')
  ) as ProviderRecord;
  provider.default.logo.source = { type: 'official', url: 'https://provider.example/brand' };

  assert.ok(collectProviderSources(provider).some(({ url, kind }) =>
    url === 'https://provider.example/brand' && kind === 'page'
  ));
});

test('reports a successful HTML page check', async () => {
  const result = await checkProviderSource('https://provider.example/pricing', 'page', async (input) =>
    mockResponse(200, 'text/html; charset=utf-8', String(input))
  );

  assert.equal(result.status, 'ok');
  assert.match(result.detail, /text\/html/);
});

test('reports redirects only when Fetch indicates a redirect', async () => {
  const normalizedUrl = await checkProviderSource('https://provider.example/plans#details', 'page', async () =>
    mockResponse(200, 'text/html', 'https://provider.example/plans')
  );
  const redirectedUrl = await checkProviderSource('https://provider.example/old', 'page', async () =>
    mockResponse(200, 'text/html', 'https://provider.example/new', true)
  );

  assert.doesNotMatch(normalizedUrl.detail, /redirected/);
  assert.match(redirectedUrl.detail, /redirected to https:\/\/provider\.example\/new/);
});

test('retries transient fetch failures and retryable HTTP responses', async () => {
  let networkAttempts = 0;
  const networkResult = await checkProviderSource('https://provider.example/pricing', 'page', async (input) => {
    networkAttempts += 1;
    if (networkAttempts === 1) {
      throw new Error('connection timed out');
    }

    return mockResponse(200, 'text/html', String(input));
  });
  let responseAttempts = 0;
  const responseResult = await checkProviderSource('https://provider.example/pricing', 'page', async (input) => {
    responseAttempts += 1;
    return mockResponse(responseAttempts === 1 ? 503 : 200, 'text/html', String(input));
  });

  assert.equal(networkResult.status, 'ok');
  assert.equal(networkAttempts, 2);
  assert.equal(responseResult.status, 'ok');
  assert.equal(responseAttempts, 2);
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

test('rejects an empty provider directory', async () => {
  const providerDir = await fs.mkdtemp(path.join(os.tmpdir(), 'provider-source-check-'));

  try {
    await assert.rejects(checkProviderSources(providerDir), /No provider files found/);
  } finally {
    await fs.rm(providerDir, { recursive: true, force: true });
  }
});
