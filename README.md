# Subscription Assistant Metadata

A public metadata repository for SubSage that publishes a single, versioned metadata bundle to GitHub Pages for downstream app consumption.

## Purpose

This repo exists to hold the canonical metadata used by the SubSage subscription intelligence app. It is intentionally limited to public metadata, schema validation, and publishing logic.

It does not contain:
- app UI code
- score calculation logic
- insight generation logic
- user input mapping
- private app business rules

## Scope

This repository is the public data source for SubSage. It defines:
- metadata schema and data contract
- subscription and category records
- pricing, friction, and seasonal metadata
- alternatives and trigger metadata
- bundle generation and versioning
- GitHub Pages publishing flow

## What this repo provides

- a single published metadata bundle
- schema validation for metadata integrity
- version metadata for safe downstream caching
- a clean contract for the private SubSage app to consume

## What this repo does not provide

- value score evaluation
- insight engine logic
- qualitative-to-numeric scoring rules
- app-specific UI or state management
- private app implementation details

## Metadata model

The bundle is built around subscription data and category metadata, including:
- subscription identity and description
- category mapping
- pricing details
- friction indicators
- seasonal patterns
- alternative comparisons
- insight trigger thresholds

## Publishing model

The project publishes a single bundled JSON artifact and a separate version manifest, for example:
- dist/metadata.bundle.json
- dist/version.json

These files are served through GitHub Pages and consumed by the private app repository.

## Versioning strategy

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

## Planned implementation phases

1. Define the metadata schema and contract
2. Add TypeScript validation and build tooling
3. Create sample metadata entries
4. Generate the single bundle and version manifest
5. Publish to GitHub Pages via GitHub Actions
6. Document release and compatibility expectations

## Current status

This repo is in the planning and scaffolding phase. The goal is to establish a clean, public metadata contract and publishing pipeline before the private app repo consumes it.

## Notes

This repo should stay intentionally narrow in scope. It is a metadata and publishing repository, not an application repo.
