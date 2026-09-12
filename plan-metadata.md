# Subscription Assistant Metadata Repo Plan

## Goal

Build a public metadata repository for SubSage that publishes a single, versioned metadata bundle to GitHub Pages. This repo is strictly for metadata and publish pipeline concerns only. It does not contain app logic, scoring logic, or insight logic.

## Scope and boundaries

- Public metadata repo only
- Single published bundle for downstream app consumption
- TypeScript-first tooling for validation and build generation
- GitHub Pages as the distribution mechanism
- No value-score engine, insight engine, or app behavior in this repo

## Core product context

SubSage is a privacy-first subscription intelligence app. It does not connect to bank accounts or scrape usage data. All intelligence comes from a public metadata bundle hosted on GitHub Pages. The app consumes metadata for pricing, friction, seasonal value patterns, alternatives, and trigger conditions, then combines that with user input to calculate a value score in the private app repository.

## Primary responsibilities of this repo

- Define the metadata schema and contract
- Validate metadata content automatically
- Generate the final single bundle in a predictable format
- Publish the bundle to GitHub Pages
- Expose version metadata so the app can detect updates and cache safely
- Provide starter repo scaffolding for future metadata growth

## Non-goals

- Value score engine
- Insight engine
- Qualitative input mapping
- UI logic
- Manual entry flows
- Any private app implementation

## Metadata contract

The published bundle should include at least the following top-level concepts:

### Subscription object

- id
- name
- categoryId
- description
- logo
- pricing
- friction
- seasonal
- alternatives
- insightTriggers

### Pricing object

- basePrice
- tiers[]
- regionSupport
- billingCycle
- notes

### Friction object

- cancellationDifficulty (1–5)
- supportResponsiveness (1–5)
- refundPolicy (enum)
- notes

### Seasonal object

- highValueMonths[]
- lowValueMonths[]
- notes

### Alternatives object

- competitorId
- priceComparison
- featureComparison
- notes

### InsightTriggers

- overpricedThreshold
- underusedThreshold
- seasonalDropThreshold
- frictionWarningThreshold

### Category object

- id
- name
- description
- icon

### Value weight contract (metadata-driven)

This repo can include the value weight definitions for downstream consumption, but it should not contain scoring logic itself.

- satisfactionWeight
- relianceWeight
- usageFrequencyWeight
- priceSensitivityWeight
- frictionWeight
- seasonalWeight
- alternativesWeight

## Recommended architecture

### Repo layout

- src/
  - schema/
  - types/
  - validators/
  - builders/
  - utils/
- data/
  - categories.json
  - subscriptions.json
- dist/
  - metadata.bundle.json
  - version.json
- .github/workflows/
  - publish-metadata.yml
- package.json
- tsconfig.json
- README.md

### Build approach

- Use TypeScript for validation logic and build scripts
- Validate JSON against a schema before publishing
- Generate a single bundle artifact from the canonical metadata source
- Emit a version manifest alongside the bundle

## Recommended validation stack

Use a TypeScript-friendly runtime validation setup such as:

- TypeScript + JSON Schema validation via AJV
- or TypeBox if you want a more strongly typed runtime schema model

This repo should prioritize clarity and maintainability over complexity.

## Single bundle publishing model

The bundle should be one publicly served JSON payload rather than multiple fragmented files. This simplifies:

- app fetch logic
- caching strategy
- version comparison
- offline fallback handling

A likely output shape:

- dist/metadata.bundle.json
- dist/version.json

## Versioning model

Use a dual-version strategy:

### bundleVersion

SemVer for the actual metadata release, for example:

- 1.2.3

### schemaVersion

SemVer for the metadata contract, for example:

- 1.0.0

This allows the consuming app to detect both content updates and structural compatibility changes.

### Example version manifest

```json
{
  "bundleVersion": "1.2.3",
  "schemaVersion": "1.0.0",
  "publishedAt": "2026-09-12T00:00:00Z",
  "gitSha": "abc1234"
}
```

### Versioning rules

- If metadata content changes, increment bundleVersion
- If the schema or required field contract changes, increment schemaVersion
- Optional release tag: metadata-v1.2.3
- The app should compare schemaVersion before trusting the bundle shape

## Publishing flow

### GitHub Actions pipeline

1. Install dependencies
2. Validate metadata against schema
3. Generate final bundle artifact
4. Generate version.json
5. Publish dist directory to GitHub Pages
6. Store release metadata for downstream consumption

### Output contract

- dist/metadata.bundle.json
- dist/version.json

## Starter implementation phases

### Phase 1: Contract and schema

- Define core interfaces and JSON schema
- Confirm required fields and enums
- Add baseline category and subscription examples

### Phase 2: Validation and local build

- Add TypeScript build scripts
- Add validation command for local checks
- Add CI validation step

### Phase 3: Bundle generation

- Build a single metadata bundle
- Emit version manifest
- Validate the final output shape

### Phase 4: Publishing

- Add GitHub Actions workflow
- Publish to GitHub Pages
- Confirm generated output is accessible and stable

### Phase 5: Documentation and maintainability

- Document schema rules
- Document bundle contract
- Document versioning expectations
- Add contributor guidance for safe metadata updates

## Verification checklist

- Validate bundle against schema locally
- Generate dist/metadata.bundle.json successfully
- Generate dist/version.json successfully
- Confirm GitHub Pages publish works end-to-end
- Confirm version metadata is readable by the private app
- Confirm no app logic is present in this repo

## Current working plan

This repo will serve as the public metadata source of truth for SubSage and should remain intentionally narrow in scope. The next implementation steps are to:

1. define the schema and type model,
2. create sample metadata entries,
3. set up TypeScript validation and build scripts,
4. generate the single bundle,
5. publish to GitHub Pages, and
6. document the versioning and release contract.

## Notes for future edits

- Keep this file as the living plan for metadata work
- When implementation starts, update this doc with completed milestones and any design decisions
- Avoid adding app logic or scoring code to this repo as the plan evolves
