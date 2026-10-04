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

The published catalog is intentionally partial during the seed and automation trial. Scoring, benchmarks, editorial signals, and recommendations belong to the private app, not this public metadata contract.

## Schema and validation

The repository uses a JSON Schema contract to define the required shape of each provider record. This is a data contract, not app logic: it enforces required fields, allowed enum values, nested object shapes, and compatibility constraints before metadata is published.

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
