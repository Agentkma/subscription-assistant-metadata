# Plan: Seed Verification, Bundle Build, and GitHub Pages Publish

Ship the initial vertical slice for the private SubSage app: verify the 3 seed providers (`netflix`, `amazon_prime_video`, `spotify`), add a deterministic TypeScript bundle generator that emits `dist/providers.json` (with categories + providers + version metadata) and `dist/version.json` at `0.1.0`, and configure the GitHub Pages publishing workflow.

## Phase 1: Verify the 3 Seed Provider Records

1. **Run source & App Store checks on the 3 seeds**
   - Run `npm run check:sources` and query Apple's iTunes Lookup API for Netflix (`363590051`), Amazon Prime Video (`545519333`), and Spotify (`324684580`) to confirm current `artworkUrl512` icon URLs and publisher identity.
   - Check the live US pricing pages for Netflix, Amazon Prime Video, and Spotify to confirm plan names, standard recurring monthly/yearly prices, and verbatim `source.evidence` snippets where available.
2. **Update seed JSON files and checklist status** (*depends on step 1*)
   - Update `netflix.json`, `amazon_prime_video.json`, and `spotify.json` with confirmed prices, current `verified_at` date, and any refreshed `logo.url`.
   - Update `provider-source-checklist.md` to record the verified seed entries and transition the 3 seed rows from `seed-candidate` to `data-reviewed`.

### Phase 2: Deterministic Bundle Builder (`dist/providers.json` & `dist/version.json`)

1. **Define bundle and version types in `types.ts`** (*parallel with Phase 1*)
   - Add `CategoryRecord` (matching `categories.json`), `VersionManifest` (`bundleVersion`, `schemaVersion`, `publishedAt`, `gitSha`), and `ProvidersBundle` (`bundleVersion`, `schemaVersion`, `publishedAt`, `categories`, `providers`).
   - Define `BUNDLE_VERSION = '0.1.0'` and `SCHEMA_VERSION = '0.1.0'` constants.
2. **Implement `src/buildBundle.ts`** (*depends on step 3*)
   - Reuse `validateProvidersDirectory` from `validateProviders.ts:139` so the build fails fast if any provider file fails schema or semantic validation.
   - Read and validate `categories.json` against `supportedCategories` from `schema.ts:2`.
   - Load all valid `ProviderRecord` files and sort deterministically by `provider_id` (ascending).
   - Resolve `gitSha` (from `GITHUB_SHA` env var or `git rev-parse --short HEAD` fallback) and `publishedAt` ISO timestamp (injectable for deterministic tests).
   - Write `dist/providers.json` and `dist/version.json`.
3. **Add `npm run build` script and unit tests** (*depends on step 4*)
   - Add `"build": "tsx src/buildBundle.ts"` to `package.json`.
   - Add `tests/build-bundle.test.ts` covering bundle + version manifest output, deterministic provider ordering by `provider_id`, inclusion of all 10 categories and 3 seeds at `0.1.0`, and failure when a provider file is invalid.
   - Add `npm run build` to `validate.yml` so PRs verify the bundle builds cleanly.

### Phase 3: GitHub Pages Publishing Workflow & Docs

1. **Create `.github/workflows/publish-metadata.yml`** (*depends on step 5*)
   - Trigger on `push` to `main` and `workflow_dispatch`.
   - Set minimal permissions (`contents: read`, `pages: write`, `id-token: write`) and concurrency group `pages`.
   - Run `npm ci`, `npm test`, `npm run validate`, `npm run build`, and deploy `dist/` via `actions/configure-pages@v5`, `actions/upload-pages-artifact@v3`, and `actions/deploy-pages@v4`.
2. **Sync documentation with the bundle envelope shape** (*parallel with step 6*)
   - Update `README.md` and `plan-metadata.md` to document the `dist/providers.json` top-level object (`{ bundleVersion, schemaVersion, publishedAt, categories, providers }`) and `0.1.0` pre-release versions.

### Relevant files

- `netflix.json` — verify plans, prices, `verified_at`, and `logo.url`
- `amazon_prime_video.json` — verify plans, prices, `verified_at`, and `logo.url`
- `spotify.json` — verify plans, prices, `verified_at`, and `logo.url`
- `provider-source-checklist.md` — mark the 3 seeds `data-reviewed`
- `types.ts` — add `CategoryRecord`, `VersionManifest`, and `ProvidersBundle` interfaces
- `src/buildBundle.ts` — new deterministic bundle generator reusing `validateProvidersDirectory` from `validateProviders.ts:139`
- `tests/build-bundle.test.ts` — new unit tests for bundle and version manifest generation
- `package.json` — add `"build": "tsx src/buildBundle.ts"` script
- `validate.yml` — add `npm run build` step to PR validation
- `.github/workflows/publish-metadata.yml` — new GitHub Pages deployment workflow on push to `main`
- `README.md` & `plan-metadata.md` — document the `dist/providers.json` envelope shape

### Verification

1. Run `npm test` to execute `provider-validation.test.ts`, `provider-source-check.test.ts`, and the new `tests/build-bundle.test.ts`.
2. Run `npm run validate && npm run build && npx tsc --noEmit && npm run lint`.
3. Inspect generated `dist/providers.json` and `dist/version.json` locally to confirm `0.1.0` version fields, sorted providers, categories, and valid timestamps/git SHA.
4. Run `npm run check:sources` to confirm all seed URLs and icons pass health checks.

### Decisions

- **Single-fetch bundle envelope:** `dist/providers.json` is `{ bundleVersion, schemaVersion, publishedAt, categories, providers }` so the SubSage app gets categories and providers in one request after checking `dist/version.json`.
- **Pre-release versioning:** Both `bundleVersion` and `schemaVersion` start at `0.1.0` while iterating with the private app prior to public App Store release.
- **Excluded from this slice:** LLM extraction, price history files (`metadata/history/`), and `pipeline-state/source-hashes.json`.
