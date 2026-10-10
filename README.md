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

The current phase keeps three seed provider records for manual verification and an LLM extraction trial: Netflix, Amazon Prime Video, and Spotify. The other planned providers are tracked in `provider-source-checklist.md` and do not have active JSON records yet. Seed records are drafts until their URLs, plans, and prices have been checked; do not publish them as verified data before that review.

## Metadata model

The bundle is built around provider metadata for subscription services, including:

- provider identity and category mapping
- pricing and billing metadata
- regional support and plan details
- official source URLs and verification provenance
- optional plan-level price trends derived from public price history
- optional provider insights and recommendations for the app to present

The published catalog is intentionally partial during the seed and automation trial. Insight values and recommendations included in the bundle are public and downloadable. The app's client-side scoring and presentation logic remains outside this repo, but code shipped in a client app should not be treated as confidential.

## Schema and validation

The repository uses a JSON Schema contract to define the required shape of each provider record. This is a data contract, not app logic: it enforces required fields, allowed enum values, nested object shapes, and compatibility constraints before metadata is published.

Every non-account-gated plan requires a source record with an HTTPS source URL and a valid `verified_at` date. Automated plan provenance additionally requires non-empty evidence. Account-gated plans require manual provenance with `source.url: null` and a non-empty `access_hint`. Plan `price_last_updated` values must also be valid dates.

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

The project publishes a single bundled JSON artifact and a separate version manifest, for example:

- dist/metadata.bundle.json
- dist/version.json

These files are served through GitHub Pages and consumed by the private app repository.

The repo uses a dual-version model:

- bundleVersion: SemVer for metadata content releases
- schemaVersion: SemVer for the metadata contract itself

This allows the consumer app to detect both data updates and compatibility-breaking schema changes.

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
