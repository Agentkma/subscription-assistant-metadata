# Subscription Assistant Metadata

A public metadata repository for SubSage that publishes a single, versioned metadata bundle to GitHub Pages for downstream app consumption.

## Purpose

This repository is the public metadata source for SubSage. It holds the canonical provider data, schema contract, and publishing pipeline used by the private app, without containing the app itself.

This repo is intentionally limited to:

- metadata schema and validation
- provider records and public pricing metadata
- bundle generation and versioning
- GitHub Pages publishing

It does not contain:

- app UI code
- score calculation logic
- insight generation logic
- user input mapping
- private application business rules

## Current focus

The current phase keeps three seed provider records for manual verification and a maintenance-workflow trial: Netflix, Amazon Prime Video, and Spotify. The other planned providers are tracked in `provider-source-checklist.md` and do not have active JSON records yet. Seed records are drafts until their URLs, plans, and prices have been checked; do not publish them as verified data before that review.

The first maintenance automation is a read-only source health check. Run `npm run check:sources` locally or dispatch the monthly GitHub Actions workflow. It checks configured page and image URLs, reports access-blocked responses for manual review, and fails on definite errors. It does not extract prices, modify provider records, or publish a bundle.

## Metadata model

The bundle is built around provider metadata for subscription services, including:

- provider identity and category mapping
- regional plan prices as `{ amount, currency }` using ISO 4217 currency codes
- regional support and plan details
- official source URLs and verification provenance
- append-only price history published with the provider bundle for downstream trend analysis
- optional plan-level price trends derived from that history
- optional provider insights and recommendations for the app to present

The published catalog is intentionally partial during the seed and automation trial. Insight values and recommendations included in the bundle are public and downloadable. The app's client-side scoring and presentation logic remains outside this repo, but code shipped in a client app should not be treated as confidential.

## Schema and validation

The repository uses a JSON Schema contract to define the required shape of each provider record. This is a data contract, not app logic: it enforces required fields, allowed enum values, nested object shapes, and compatibility constraints before metadata is published.

Every non-account-gated plan requires a source record with an HTTPS source URL and a valid `verified_at` date. This is when we last checked the current price, not when the provider changed it. Automated plan provenance additionally requires non-empty evidence. Account-gated plans require manual provenance with `source.url: null` and a non-empty `access_hint`.

Prices are recorded in the currency charged for the plan's region; they are not implicitly USD. Any normalized comparison price must be a separate derived value with its exchange-rate provenance. Price changes are intended to be recorded as append-only, dated observations in provider plan history. The planned publishing build will include that history in `dist/providers.json`; the app can use it to derive trends and other time-based insights. History observation dates mean when we verified a value, not the provider's unknown effective price-change date. The current plan's `source.verified_at` is the latest check date; there is no separate `price_last_updated` field. History storage and publication are not implemented yet.

### Provider icons

Each `logo` contains one resolved HTTPS image URL and one source record. Prefer recognizable square app icons from a verified official App Store listing:

```json
{
  "url": "https://official-image-host.example/provider-icon.png",
  "source": {
    "type": "app_store",
    "app_store_id": "324684580"
  }
}
```

The image URL above is illustrative, not a verified asset. When no suitable App Store icon exists, use `source: { "type": "official", "url": "https://provider.example/brand-assets" }` with a human-verified official provenance page and a direct image URL. Both URL fields must be HTTPS. Regional logo overrides use the same complete object; legacy logo fields are no longer accepted.

The app renders and caches `logo.url`, using its own category icon on failure. Store lookups and source selection belong to this repository, not the app. Start with direct official image URLs; hosting copies is deferred pending redistribution-permission review. Official sourcing does not itself grant usage rights.

Planned automation will refresh App Store artwork through Apple's lookup API using the approved ID and the provider's region, check provider URL availability and redirects, and fetch/decode icons to verify their content and dimensions. Retry transient failures and distinguish blocked requests from broken links. HTTP 200 alone is not proof of usable content. Scripts may propose refreshed artwork URLs from approved IDs; the LLM never discovers URLs, and changes require PR review. Official-source replacements remain manual. These network checks are not implemented by the local schema validator yet.

The validation is implemented in TypeScript and runs locally and in CI before publication, which keeps the public bundle consistent and safe for downstream consumers.

## Publishing and versioning

This repository is still pre-release: no public bundle has been published and no downstream consumer contract is active. During this phase, the schema and seed data may change without version increments.

When the repo is explicitly marked ready for its first public release, establish initial `bundleVersion` and `schemaVersion` values and publish the first bundle. From then on, published versioning rules apply: metadata-only changes increment `bundleVersion`; breaking contract changes require a new major `schemaVersion` and coordination with downstream consumers before release.

The planned publishing flow produces a single bundled JSON artifact and a separate version manifest, for example:

- dist/metadata.bundle.json
- dist/version.json

These files are served through GitHub Pages and consumed by the private app repository.

After the initial release, the repo uses a dual-version model:

- bundleVersion: SemVer for metadata content releases
- schemaVersion: SemVer for the metadata contract itself

This allows the consumer app to detect both data updates and compatibility-breaking schema changes. Do not bump versions for pre-release contract iteration before the initial bundle is published.

## Repo structure

```text
src/
  schema/
  types/
  validators/
  builders/
  utils/

data/
  categories.json
  subscriptions.json

dist/
  metadata.bundle.json
  version.json

.github/workflows/
  publish-metadata.yml

README.md
package.json
tsconfig.json
```

## Notes

This repo should stay intentionally narrow in scope. It is a metadata and publishing repository, not an application repo.
