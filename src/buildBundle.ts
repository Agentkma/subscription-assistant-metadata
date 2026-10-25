import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { supportedCategories } from './schema.js';
import { isRunAsScript } from './isRunAsScript.js';
import type {
  CategoryDefinition,
  CategoryRecord,
  ProviderRecord,
  ProvidersBundle,
  VersionManifest
} from './types.js';
import { type ProviderValidationResult, validateProvidersDirectory } from './validateProviders.js';

export const BUNDLE_VERSION = '0.1.0';
export const SCHEMA_VERSION = '0.1.0';
const TEXT_ENCODING = 'utf8';

export interface BuildBundleOptions {
  providersDir?: string;
  categoriesFile?: string;
  outDir?: string;
  publishedAt?: string;
  gitSha?: string;
}

export interface BuildBundleResult {
  bundle: ProvidersBundle;
  version: VersionManifest;
}

function formatInvalidProviderResults(invalidResults: ProviderValidationResult[]): string {
  return invalidResults
    .map((result) => `${result.file}\n${result.errors.map((error) => `  - ${error}`).join('\n')}`)
    .join('\n');
}

async function readProviderFile(file: string): Promise<ProviderRecord> {
  return JSON.parse(await fs.readFile(file, TEXT_ENCODING)) as ProviderRecord;
}

// Plain string comparison (UTF-16 code units) keeps output identical regardless of the build machine's locale.
function compareByProviderId(a: ProviderRecord, b: ProviderRecord): number {
  if (a.provider_id < b.provider_id) {
    return -1;
  }
  return a.provider_id > b.provider_id ? 1 : 0;
}

async function loadValidProviders(providersDir: string): Promise<ProviderRecord[]> {
  const results = await validateProvidersDirectory(providersDir);
  const invalidResults = results.filter((result) => !result.valid);

  if (invalidResults.length > 0) {
    throw new Error(`Invalid provider file(s):\n${formatInvalidProviderResults(invalidResults)}`);
  }

  if (results.length === 0) {
    throw new Error(`No provider files found in ${providersDir}`);
  }

  const providers = await Promise.all(results.map((result) => readProviderFile(result.file)));

  return providers.sort(compareByProviderId);
}

function isCategoryDefinition(value: unknown): value is CategoryDefinition {
  const candidate = value as Partial<CategoryDefinition> | null;
  return (
    typeof candidate === 'object' &&
    candidate !== null &&
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.display_name === 'string'
  );
}

async function loadCategories(categoriesFile: string): Promise<CategoryDefinition[]> {
  const categories: unknown = JSON.parse(await fs.readFile(categoriesFile, TEXT_ENCODING));

  if (!Array.isArray(categories) || !categories.every(isCategoryDefinition)) {
    throw new Error(`${categoriesFile} must be an array of { id, name, display_name } records`);
  }

  const ids = categories.map((category) => category.id);
  const supported = new Set<string>(supportedCategories);
  const unknownIds = ids.filter((id) => !supported.has(id));
  const missingIds = supportedCategories.filter((id) => !ids.includes(id));
  const hasDuplicateIds = new Set(ids).size !== ids.length;

  if (unknownIds.length > 0 || missingIds.length > 0 || hasDuplicateIds) {
    throw new Error(
      `${categoriesFile} must list each supported category exactly once ` +
        `(unknown: [${unknownIds.join(', ')}], missing: [${missingIds.join(', ')}], duplicates: ${hasDuplicateIds})`
    );
  }

  return categories;
}

// provider_count is derived at build time; categories.json does not store it.
function withPublishedProviderCounts(categories: CategoryDefinition[], providers: ProviderRecord[]): CategoryRecord[] {
  return categories.map(({ id, name, display_name }) => ({
    id,
    name,
    display_name,
    provider_count: providers.filter((provider) => provider.category === id).length
  }));
}

function resolveGitSha(): string {
  if (process.env.GITHUB_SHA) {
    return process.env.GITHUB_SHA;
  }

  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: TEXT_ENCODING }).trim();
  } catch {
    return 'unknown';
  }
}

const toJsonFile = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;

export async function buildBundle(options: BuildBundleOptions = {}): Promise<BuildBundleResult> {
  const providersDir = options.providersDir ?? 'metadata/providers';
  const categoriesFile = options.categoriesFile ?? 'metadata/categories.json';
  const outDir = options.outDir ?? 'dist';
  const publishedAt = options.publishedAt ?? new Date().toISOString();
  const gitSha = options.gitSha ?? resolveGitSha();

  const providers = await loadValidProviders(providersDir);
  const categories = withPublishedProviderCounts(await loadCategories(categoriesFile), providers);

  const bundle: ProvidersBundle = {
    bundleVersion: BUNDLE_VERSION,
    schemaVersion: SCHEMA_VERSION,
    publishedAt,
    categories,
    providers
  };
  const version: VersionManifest = {
    bundleVersion: BUNDLE_VERSION,
    schemaVersion: SCHEMA_VERSION,
    publishedAt,
    gitSha
  };

  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, 'providers.json'), toJsonFile(bundle), TEXT_ENCODING);
  await fs.writeFile(path.join(outDir, 'version.json'), toJsonFile(version), TEXT_ENCODING);

  return { bundle, version };
}

async function main() {
  try {
    const { bundle, version } = await buildBundle();
    console.log(
      `Built dist/providers.json with ${bundle.providers.length} provider(s) ` +
        `(bundle ${version.bundleVersion}, schema ${version.schemaVersion}, ${version.gitSha}).`
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

if (isRunAsScript(import.meta.url)) {
  void main();
}
