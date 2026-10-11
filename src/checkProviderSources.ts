import fs from 'node:fs/promises';
import path from 'node:path';
import type { ProviderDefault, ProviderOverride, ProviderRecord } from './types.js';
import { validateProvidersDirectory } from './validateProviders.js';

export type SourceKind = 'page' | 'image';
export type SourceCheckStatus = 'ok' | 'blocked' | 'error';

export interface ProviderSourceCheck {
  url: string;
  kind: SourceKind;
  status: SourceCheckStatus;
  detail: string;
}

export interface ProviderSource {
  url: string;
  kind: SourceKind;
}

type MetadataSection = ProviderDefault | ProviderOverride;
type SourceCollection = Map<string, ProviderSource>;

const sourceCheckHeaders = {
  range: 'bytes=0-0',
  'user-agent': 'SubSage-Metadata-Source-Check/1.0'
};
const unauthorizedStatusCode = 401;
const forbiddenStatusCode = 403;
const tooManyRequestsStatusCode = 429;
const blockedResponseStatusCodes = new Set<number>([
  unauthorizedStatusCode,
  forbiddenStatusCode,
  tooManyRequestsStatusCode
]);

function isProviderOverride(section: ProviderOverride | undefined): section is ProviderOverride {
  return section !== undefined;
}

function addSource(sources: SourceCollection, url: string | null | undefined, kind: SourceKind): void {
  if (url) {
    sources.set(`${kind}:${url}`, { url, kind });
  }
}

function getMetadataSections(provider: ProviderRecord): MetadataSection[] {
  return [
    provider.default,
    ...Object.values(provider.regional_overrides).filter(isProviderOverride)
  ];
}

function collectSectionSources(section: MetadataSection, sources: SourceCollection): void {
  addSource(sources, section.logo?.url, 'image');
  addSource(sources, section.urls?.official, 'page');
  addSource(sources, section.urls?.pricing, 'page');
  addSource(sources, section.urls?.cancellation, 'page');
  addSource(sources, section.urls?.help_center, 'page');

  for (const plan of section.plans ?? []) {
    addSource(sources, plan.source?.url, 'page');
    addSource(sources, plan.urls?.pricing, 'page');
    addSource(sources, plan.urls?.cancellation, 'page');
    addSource(sources, plan.urls?.help_center, 'page');
  }
}

export function collectProviderSources(provider: ProviderRecord): ProviderSource[] {
  const sources: SourceCollection = new Map();

  for (const section of getMetadataSections(provider)) {
    collectSectionSources(section, sources);
  }

  return [...sources.values()];
}

function createSourceCheckRequest(): RequestInit {
  return {
    method: 'GET',
    redirect: 'follow',
    signal: AbortSignal.timeout(15000),
    headers: sourceCheckHeaders
  };
}

async function fetchSourceResponse(url: string, fetcher: typeof fetch): Promise<Response> {
  return fetcher(url, createSourceCheckRequest());
}

function getResponseContentType(response: Response): string {
  return response.headers.get('content-type')?.split(';')[0].trim().toLowerCase() ?? '';
}

function getRedirectDetail(response: Response, requestedUrl: string): string {
  return response.url && response.url !== requestedUrl ? `; redirected to ${response.url}` : '';
}

function getExpectedContentType(kind: SourceKind): string {
  return kind === 'image' ? 'image/*' : 'text/html';
}

function hasExpectedContentType(kind: SourceKind, contentType: string): boolean {
  return kind === 'image' ? contentType.startsWith('image/') : contentType === 'text/html';
}

function createSourceCheckResult(
  url: string,
  kind: SourceKind,
  status: SourceCheckStatus,
  detail: string
): ProviderSourceCheck {
  return { url, kind, status, detail };
}

async function classifySourceResponse(response: Response, url: string, kind: SourceKind): Promise<ProviderSourceCheck> {
  try {
    const contentType = getResponseContentType(response);
    const redirectDetail = getRedirectDetail(response, url);

    if (blockedResponseStatusCodes.has(response.status)) {
      return createSourceCheckResult(
        url,
        kind,
        'blocked',
        `HTTP ${response.status}; check needs manual review${redirectDetail}`
      );
    }

    if (!response.ok) {
      return createSourceCheckResult(url, kind, 'error', `HTTP ${response.status}${redirectDetail}`);
    }

    if (!hasExpectedContentType(kind, contentType)) {
      const expected = getExpectedContentType(kind);
      return createSourceCheckResult(
        url,
        kind,
        'error',
        `Expected ${expected}, received ${contentType || 'no content type'}${redirectDetail}`
      );
    }

    return createSourceCheckResult(url, kind, 'ok', `HTTP ${response.status}, ${contentType}${redirectDetail}`);
  } finally {
    await response.body?.cancel();
  }
}

export async function checkProviderSource(
  url: string,
  kind: SourceKind,
  fetcher: typeof fetch = fetch
): Promise<ProviderSourceCheck> {
  try {
    const response = await fetchSourceResponse(url, fetcher);
    return await classifySourceResponse(response, url, kind);
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown fetch error';
    return createSourceCheckResult(url, kind, 'error', detail);
  }
}

async function loadValidatedProviders(providerDir: string): Promise<ProviderRecord[]> {
  const validations = await validateProvidersDirectory(providerDir);
  const invalidProviders = validations.filter((result) => !result.valid);

  if (invalidProviders.length > 0) {
    throw new Error(invalidProviders.map((result) => `${result.file}: ${result.errors.join('; ')}`).join('\n'));
  }

  return Promise.all(validations.map(async ({ file }) =>
    JSON.parse(await fs.readFile(path.resolve(file), 'utf8')) as ProviderRecord
  ));
}

function collectSourcesFromProviders(providers: ProviderRecord[]): ProviderSource[] {
  return providers.flatMap(collectProviderSources);
}

export async function checkProviderSources(providerDir: string): Promise<ProviderSourceCheck[]> {
  const providers = await loadValidatedProviders(providerDir);
  const sources = collectSourcesFromProviders(providers);
  return Promise.all(sources.map(({ url, kind }) => checkProviderSource(url, kind)));
}

function getStatusLabel(status: SourceCheckStatus): string {
  return status === 'ok' ? 'OK' : status === 'blocked' ? 'REVIEW' : 'ERROR';
}

function printSourceCheck(result: ProviderSourceCheck): void {
  console.log(`${getStatusLabel(result.status)} [${result.kind}] ${result.url}: ${result.detail}`);
}

function printSourceCheckSummary(results: ProviderSourceCheck[]): void {
  const errors = results.filter((result) => result.status === 'error').length;
  const blocked = results.filter((result) => result.status === 'blocked').length;
  console.log(`Checked ${results.length} source(s): ${errors} error(s), ${blocked} blocked/inconclusive.`);
}

function hasSourceErrors(results: ProviderSourceCheck[]): boolean {
  return results.some((result) => result.status === 'error');
}

async function main(): Promise<void> {
  const results = await checkProviderSources('metadata/providers');

  results.forEach(printSourceCheck);
  printSourceCheckSummary(results);

  if (hasSourceErrors(results)) {
    process.exitCode = 1;
  }
}

function reportFatalError(error: unknown): void {
  console.error(error instanceof Error ? error.message : 'Source check failed');
  process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main().catch(reportFatalError);
}