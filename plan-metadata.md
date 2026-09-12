# Subscription Assistant Metadata Repo Plan

## Goal

Build a public metadata repository for SubSage that publishes a single, versioned metadata bundle to GitHub Pages. This repo is strictly for metadata and publish pipeline concerns only. It does not contain app logic, scoring logic, or insight logic.

## Scope and boundaries

- Public metadata repo only
- Single published bundle for downstream app consumption
- TypeScript-first tooling for validation and build generation
- GitHub Pages as the distribution mechanism
- Provider-based metadata structure, with one JSON file per provider
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

The public repo will use a provider-first metadata design. Each provider represents one subscription service and is stored as its own file under a provider directory. These files are later merged into a single published bundle.

### Recommended provider schema

Each provider record should include:

- version
- provider_id
- name
- category
- regions[]
- supported
- logo
- plans[]
- urls
- intelligence
- recommendations

### Provider logo object

- source
- app_store_id
- play_store_package
- cdn_url
- fallback_icon

### Plan object

- plan_id
- name
- billing_cycle
- base_price_usd
- price_last_updated

### URLs object

- pricing
- cancellation
- help_center

### Intelligence object

- seasonal_pattern
- value_drift_signals[]
- cancellation_difficulty
- benchmark_anchor
- price_trend

### Recommendations object

- alternatives[]
- upgrade_paths[]

### Benchmark anchor object

- category_rank
- value_score_baseline

### Price trend object

- trend
- last_increase
- increase_percent

### Notes on schema evolution

- This dataset is intentionally provider-centric rather than app-centric
- It should support deterministic automation and validation
- Intelligence fields are computed in the metadata pipeline, not in the app repo
- The app repo consumes the final merged result, not the raw provider files directly

## Recommended architecture

### Repo layout

- metadata/
  - providers/
    - netflix.json
    - spotify.json
    - ...
  - categories.json
  - schema/
    - provider-schema.json
- src/
  - schema/
  - types/
  - validators/
  - builders/
  - utils/
- dist/
  - providers.json
  - version.json
- .github/workflows/
  - publish-metadata.yml
- package.json
- tsconfig.json
- README.md

### Build approach

- Use TypeScript for validation logic and build scripts
- Store provider metadata as file-per-provider JSON under metadata/providers
- Validate each provider file against the schema before merge
- Aggregate providers into a single dist/providers.json artifact
- Emit a version manifest alongside the final bundle

## Recommended validation stack

Use a TypeScript-friendly runtime validation setup such as:

- TypeScript + JSON Schema validation via AJV

This repo should prioritize clarity and maintainability over complexity.

## Single bundle publishing model

The bundle should be one publicly served JSON payload rather than multiple fragmented files. This simplifies:

- app fetch logic
- caching strategy
- version comparison
- offline fallback handling

A likely output shape:

- dist/providers.json
- dist/version.json

This is the file the app consumes at runtime.

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

1. Trigger on push to main
2. Trigger on metadata changes
3. Trigger monthly on the first of the month at 00:00 UTC
4. Trigger manual workflow dispatch
5. Validate provider JSON files against the schema
6. Fetch external metadata for pricing, cancellation, and logo validation as allowed
7. Compute intelligence fields and normalize merged provider data
8. Generate final dist/providers.json
9. Generate version.json
10. Publish dist directory to GitHub Pages
11. Open a PR with the metadata diff for manual review before merge

### Output contract

- dist/providers.json
- dist/version.json

This aligns with the app release pattern of shipping a baseline bundle and fetching the latest metadata on app launch when online.

## Starter implementation phases

### Phase 1: Contract and schema

- Define provider-level JSON schema and validation rules
- Confirm required fields, enums, allowed values, and URL requirements
- Add baseline provider examples such as Netflix and similar category entries

### Phase 2: Validation and local build

- Add TypeScript build scripts
- Add validation commands for provider JSON files
- Enforce required checks:
  - required fields
  - valid URLs
  - unique plan ids
  - category recognition
  - valid regions
  - allowed logo sources
  - seasonal pattern validation
  - friction rating range 1–5
- Add CI validation step

### Phase 3: External enrichment and intelligence computation

- Fetch pricing page data safely and deterministically
- Validate cancellation and help-center URLs
- Validate logo sources and fetch App Store/CDN metadata when required
- Compute seasonal pattern, cancellation difficulty, price trend, value drift signals, and benchmark anchor

### Phase 4: Bundle generation

- Merge provider files into a single dist/providers.json artifact
- Emit version.json with bundleVersion and schemaVersion
- Run final quality checks before publish

### Phase 5: Publishing and review

- Add GitHub Actions workflow for monthly, on-demand, and push-triggered runs
- Publish dist to GitHub Pages
- Open a PR with diffs for review and manual approval before merge

### Phase 6: Documentation and maintainability

- Document schema rules
- Document provider file structure
- Document versioning expectations
- Add contributor guidance for metadata updates and review workflow

## Verification checklist

- Validate provider JSON files against schema locally
- Generate dist/providers.json successfully
- Generate dist/version.json successfully
- Confirm GitHub Pages publish works end-to-end
- Confirm version metadata is readable by the private app
- Confirm no app logic is present in this repo
- Confirm workflow fails when critical metadata checks are invalid
- Confirm monthly and manual triggers behave as expected

## Current working plan

This repo will serve as the public metadata source of truth for SubSage and should remain intentionally narrow in scope. The next implementation steps are to:

1. define the provider schema and type model,
2. create sample provider metadata files,
3. set up TypeScript validation and build scripts,
4. generate the single dist/providers.json bundle,
5. add the monthly and on-demand GitHub Actions automation, and
6. document the versioning and release contract.

## Notes for future edits

- Keep this file as the living plan for metadata work
- When implementation starts, update this doc with completed milestones and any design decisions
- Avoid adding app logic or scoring code to this repo as the plan evolves
