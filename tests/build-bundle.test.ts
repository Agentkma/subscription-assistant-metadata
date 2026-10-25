import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import { BUNDLE_VERSION, SCHEMA_VERSION, buildBundle } from '../src/buildBundle.js';
import { supportedCategories } from '../src/schema.js';
import type { ProvidersBundle, VersionManifest } from '../src/types.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const providersDir = path.join(repoRoot, 'metadata/providers');
const categoriesFile = path.join(repoRoot, 'metadata/categories.json');
const fixedOptions = { publishedAt: '2026-01-01T00:00:00.000Z', gitSha: 'abc123' };

async function withTempDir(run: (dir: string) => Promise<void>): Promise<void> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'build-bundle-'));
  try {
    await run(dir);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

const readJson = async <T>(file: string): Promise<T> => JSON.parse(await fs.readFile(file, 'utf8')) as T;

test('writes providers.json and version.json with matching version metadata', async () => {
  await withTempDir(async (outDir) => {
    await buildBundle({ providersDir, categoriesFile, outDir, ...fixedOptions });

    const bundle = await readJson<ProvidersBundle>(path.join(outDir, 'providers.json'));
    const version = await readJson<VersionManifest>(path.join(outDir, 'version.json'));

    assert.deepEqual(version, {
      bundleVersion: BUNDLE_VERSION,
      schemaVersion: SCHEMA_VERSION,
      publishedAt: fixedOptions.publishedAt,
      gitSha: fixedOptions.gitSha
    });
    assert.equal(bundle.bundleVersion, version.bundleVersion);
    assert.equal(bundle.schemaVersion, version.schemaVersion);
    assert.equal(bundle.publishedAt, version.publishedAt);
  });
});

test('includes every provider file sorted by providerId', async () => {
  await withTempDir(async (outDir) => {
    const { bundle } = await buildBundle({ providersDir, categoriesFile, outDir, ...fixedOptions });
    const ids = bundle.providers.map((provider) => provider.providerId);
    const providerFileCount = (await fs.readdir(providersDir, { recursive: true })).filter((entry) =>
      entry.endsWith('.json')
    ).length;

    assert.equal(ids.length, providerFileCount);
    assert.deepEqual(ids, [...ids].sort());
  });
});

test('publishes every supported category with counts of published providers', async () => {
  await withTempDir(async (outDir) => {
    const { bundle } = await buildBundle({ providersDir, categoriesFile, outDir, ...fixedOptions });

    assert.deepEqual(
      bundle.categories.map((category) => category.id).sort(),
      [...supportedCategories].sort()
    );
    for (const category of bundle.categories) {
      const expected = bundle.providers.filter((provider) => provider.category === category.id).length;
      assert.equal(category.providerCount, expected, category.id);
    }
  });
});

test('produces byte-identical output for identical inputs', async () => {
  await withTempDir(async (outDir) => {
    const first = path.join(outDir, 'first');
    const second = path.join(outDir, 'second');
    await buildBundle({ providersDir, categoriesFile, outDir: first, ...fixedOptions });
    await buildBundle({ providersDir, categoriesFile, outDir: second, ...fixedOptions });

    for (const file of ['providers.json', 'version.json']) {
      assert.equal(
        await fs.readFile(path.join(first, file), 'utf8'),
        await fs.readFile(path.join(second, file), 'utf8'),
        file
      );
    }
  });
});

test('fails without writing output when a provider file is invalid', async () => {
  await withTempDir(async (tempDir) => {
    const badProvidersDir = path.join(tempDir, 'providers');
    const outDir = path.join(tempDir, 'dist');
    const netflix = await readJson<Record<string, unknown>>(path.join(providersDir, 'streaming/netflix.json'));
    await fs.mkdir(path.join(badProvidersDir, 'streaming'), { recursive: true });
    await fs.writeFile(
      path.join(badProvidersDir, 'streaming/netflix.json'),
      JSON.stringify({ ...netflix, defaultRegion: 'CA' }),
      'utf8'
    );

    await assert.rejects(
      buildBundle({ providersDir: badProvidersDir, categoriesFile, outDir, ...fixedOptions }),
      /Invalid provider file\(s\)[\s\S]*defaultRegion/
    );
    await assert.rejects(fs.access(outDir));
  });
});

test('fails when categories.json does not list every supported category once', async () => {
  await withTempDir(async (tempDir) => {
    const categories = await readJson<Array<{ id: string }>>(categoriesFile);
    const badCategoriesFile = path.join(tempDir, 'categories.json');
    await fs.writeFile(badCategoriesFile, JSON.stringify(categories.slice(1)), 'utf8');

    await assert.rejects(
      buildBundle({ providersDir, categoriesFile: badCategoriesFile, outDir: path.join(tempDir, 'dist'), ...fixedOptions }),
      new RegExp(`missing: \\[${categories[0].id}\\]`)
    );
  });
});
