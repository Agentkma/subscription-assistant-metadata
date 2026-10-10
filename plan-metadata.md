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

## Current implementation focus

The repo is in a seed-first intake phase. Keep Netflix, Amazon Prime Video, and Spotify as the only active provider records while their URLs, plans, and prices are manually verified. Track all remaining provider coverage in `provider-source-checklist.md` without scaffold JSON files. After the seeds are verified, build and test the LLM extraction workflow before activating providers in batches.

The active focus is:

- confirm the canonical category catalog and coverage targets
- define the provider source checklist for every target provider
- gather official pricing, help, cancellation, and logo sources
- validate the recorded URLs and metadata against the schema
- postpone automated workflows until the source data is complete and verified

## Core product context

SubSage is a privacy-first subscription app. It does not connect to bank accounts or scrape usage data. The public metadata bundle supplies provider and plan facts, verified sources, optional price trends, and optional insight/recommendation values. The app combines this public data with user input using client-side scoring and presentation logic; anything fetched from GitHub Pages is public.

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
- intelligence (optional until reviewed values exist)
- recommendations (optional until reviewed values exist)

### MVP category catalog

The MVP should support the following canonical category IDs and content coverage list:

- streaming
- music_audio
- productivity
- fitness_wellness
- learning
- gaming
- news_reading
- utilities_tools
- lifestyle
- shopping_memberships

This category catalog is the source of truth for category browsing and filtering in the private app. It also defines the metadata coverage targets used for the early public bundle.

The corresponding coverage groups for the MVP are:

- streaming: Netflix, Hulu, Disney+, Max, Prime Video, Apple TV+, Paramount+, Peacock, YouTube Premium, Crunchyroll, Starz, Showtime
- music_audio: Spotify, Apple Music, YouTube Music, Audible, SiriusXM, Pandora
- productivity: Google Workspace, Microsoft 365, Dropbox, Evernote, Notion, Todoist, Slack, Zoom, Grammarly, 1Password Teams
- fitness_wellness: Peloton, Calm, Headspace, Fitbod, MyFitnessPal, Noom, Strava, Alo Moves
- learning: Duolingo, Babbel, Skillshare, MasterClass, Coursera, Udemy, Chegg, Rosetta Stone
- gaming: Xbox Game Pass, PlayStation Plus, Nintendo Switch Online, EA Play, Ubisoft+, GeForce NOW
- news_reading: New York Times, Wall Street Journal, Washington Post, The Economist, NYT Cooking, Medium, Kindle Unlimited, Scribd
- utilities_tools: Adobe Creative Cloud, Canva, 1Password, NordVPN, ExpressVPN, GitHub, Notion AI, ChatGPT Plus, Dropbox, LastPass
- lifestyle: Paprika, YNAB, Cozi, NYT Cooking, Calm, Headspace, Blue Apron, HelloFresh
- shopping_memberships: Amazon Prime, Walmart+, Instacart+, Costco Membership, Sam's Club Membership, Chewy Autoship, DoorDash DashPass, Uber One

These category lists are intentionally coverage-oriented and can include a few overlapping providers where a service sits across multiple user behaviors. The provider record itself still keeps one canonical category for validation and downstream app consumption.

### Provider logo object

- `url` (required): resolved HTTPS image URL consumed by the app
- `source` (required): exactly one provenance/refresh record:
  - `type: app_store` with a required numeric-string `app_store_id` identifying a verified official listing
  - `type: official` with a required HTTPS `url` identifying a human-verified official asset or provenance page

Prefer recognizable square app icons from official App Store listings. If no suitable listing exists, manually select an official asset. The three seeds now use resolved App Store artwork URLs and stable listing IDs. Lookup results confirm listing names and publishers; human visual and usage-permission review remains part of seed verification.

The app only loads and caches `logo.url`; a category-icon fallback is app-owned. There is no runtime store lookup or multi-source fallback chain. Regional logo overrides must use the same complete contract.

Initially link directly to official-hosted images. Hosting approved copies can be considered later after checking redistribution permissions; official provenance is not permission to use or redistribute an asset.

Future scripts resolve `app_store` sources through Apple's lookup API using the approved ID and applicable country (the seeds use `US`), then propose updated artwork URLs for review. Non-country region codes require an explicit country mapping before lookup. `official` sources support image health checks but replacement discovery stays manual. These scripts are deferred until the seeds are reviewed.

### Plan object

- plan_id
- name
- billing_cycle
- base_price_usd
- price_last_updated
- notes (optional)
- url_visibility (optional): `public` | `account_required` | `unknown`
- access_hint (optional generally; required and non-empty when `url_visibility` is `account_required`): user-facing guidance, never treated as a public source
- urls (optional): plan-specific pricing/cancellation/help links; null when account-gated
- source (optional, required before automation is enabled for a provider):
  - url: page the price was confirmed on (required and non-empty for automated sources; explicitly null for account-gated plans)
  - verified_at: last date a human or the pipeline confirmed the value
  - method: `manual` | `automated`
  - evidence: short quoted snippet from the source page (required and non-empty for `automated`)

Conditional plan rules:

- `source.method: automated` requires a non-empty `source.url` and `source.evidence`.
- `url_visibility: account_required` requires a non-empty `access_hint` and `source.method: manual` with `source.url: null`.

### URLs object

- official (optional, provider-level only)
- pricing
- cancellation
- help_center

### Plan price trend object (optional)

- trend
- last_increase
- increase_percent

### Intelligence object (optional)

- seasonal_pattern
- value_drift_signals[]
- cancellation_difficulty
- benchmark_anchor: category_rank, value_score_baseline

### Recommendations object (optional)

- alternatives[]
- upgrade_paths[]: target_plan_id, reason

### Notes on schema evolution

- This dataset is intentionally provider-centric rather than app-centric
- It should support deterministic automation and validation
- Public insight and recommendation values may be included in provider records; they are downloadable public data, not secrets
- Client-side scoring and presentation logic stays in the app code; anything shipped in the app can be inspected by users
- Optional plan trends are derived from public price history; omit them until history exists
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
  - utils/****
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
7. Compute optional plan-level price trends from public price history
8. Generate final dist/providers.json
9. Generate version.json
10. Publish dist directory to GitHub Pages
11. Open a PR with the metadata diff for manual review before merge

### Output contract

- dist/providers.json
- dist/version.json

This aligns with the app release pattern of shipping a baseline bundle and fetching the latest metadata on app launch when online.

## Automated update strategy

The planned GitHub Actions pipeline will keep the dataset current by combining deterministic scripts with a constrained LLM API call. The LLM only extracts; scripts validate; a human approves every change via PR.

Provider and plan source URLs, official logo provenance pages, and App Store listing identities are human-verified. The LLM never discovers or proposes URLs; it only reads pages at URLs a human has already confirmed. Deterministic App Store lookups may propose refreshed `logo.url` values from approved IDs, subject to PR review.

### Field ownership

| Field type | Fields | Update method |
| --- | --- | --- |
| Deterministic | Provider URL health, `logo.url` image health, App Store artwork refresh from approved IDs, schema validity, staleness of plan `source.verified_at` | Script; changes require PR review |
| Human-verified | `urls.*` values (official, pricing, cancellation, help center), plan `source.url`, logo listing identity or official provenance URL, manually selected official image URL | Manual, for every provider |
| Extracted facts | `plans[]` names, prices, billing cycles, `url_visibility` | LLM API extraction from fetched pages, with evidence |
| Derived public fact | `plans[].price_trend` | Computed from public price history; omitted until history exists |
| Curated public insights | `intelligence`, `recommendations` | Draft against a written rubric; human-reviewed before publishing; values are public |
| Account-gated | plans with `url_visibility: account_required` | Manual only; flagged when stale |

### Pipeline

1. Scheduled/manual trigger.
2. Script fetches each provider's `source.url` / `urls.pricing` (Playwright when pages are JS-rendered).
3. Script hashes the relevant page content; unchanged pages only get a last-checked update.
4. For changed pages, an LLM API call receives the page text plus the plan schema and returns structured JSON with a quoted evidence snippet per value.
5. Scripts validate the output: AJV schema, currency/billing-cycle checks, flag price changes > ~25%, flag removed plans, reject values missing evidence.
6. Script checks provider URL availability, redirects, and expected content; fetches and decodes `logo.url` to check usable image content and dimensions; and proposes refreshed App Store artwork URLs from approved IDs. Retry transient errors and report blocked requests separately from broken URLs. HTTP 200 alone is not sufficient.
7. Pipeline opens a PR with old → new values, evidence, and source URLs. Nothing auto-merges.
8. On merge: build bundle, publish to GitHub Pages.

### Guardrails

- Fetched page content is untrusted input (prompt injection risk). The LLM step has no write access or secrets beyond its API key and returns JSON only.
- The LLM never outputs URLs into provider files. Provider/plan URL changes and official-asset replacements are human edits; deterministic artwork refreshes from approved App Store IDs are the only automated URL-change proposals and require review.
- Verify logo identity and usage permissions during manual intake; a successful image fetch does not establish either. Do not host copies without checking redistribution permissions.
- Schema validation and PR review are the enforcement layer, not the model.
- Providers that block automated fetches or have no public pricing page are marked manual-only.
- Check provider terms of service before automated fetching; prefer official help articles or APIs.
- Confirm extracted prices are USD/US-region, since runner IP location is not guaranteed.

### Price history

- Append-only per-plan history (planned: `metadata/history/<provider_id>/<plan_id>.json`) records each merged public price change.
- Optional `plans[].price_trend` (`trend`, `last_increase`, `increase_percent`) is computed from that history; omit it until enough verified history exists.

### Insight rubric

- A written rubric defines `cancellation_difficulty` 1–5, `value_score_baseline`, `category_rank`, and `seasonal_pattern` so public insight values are consistent and reviewable.
- LLM-drafted insight and recommendation changes require human review in a PR; the client-side scoring implementation remains in the app.

### Rollout order

1. Seed providers: fully verify 2–3 providers by hand that cover different cases (Netflix: static multi-tier; Prime Video: bundle + account-gated add-on; one JS-heavy monthly/yearly page such as Spotify or Disney+). These become the extractor's ground truth.
2. Local pipeline: fetch → LLM extract → schema/sanity checks → diff against seed files. Tune prompt and rules until seed providers match.
3. URL intake for remaining providers: human verifies and records `urls.*`, plan `source.url`, and one official icon source plus resolved `logo.url` for each provider (quick pass, no pricing research).
4. Automated first pass, one category per PR: pipeline extracts plans/prices from the human-verified URLs with `method: automated` and evidence. Human reviews, corrects, merges. Providers the pipeline can't handle are marked `manual-only`.
5. Scheduled GitHub Actions job: URL liveness, staleness, page-change detection, and re-extraction on change → PR.
6. Quarterly LLM-drafted insight/recommendation review against the rubric, with human approval.

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
  - required HTTPS logo image URL and exactly one supported source record, including regional overrides
- Add CI validation step

### Phase 3: External enrichment and public price trend computation

- Follows the rollout order in "Automated update strategy"
- Seed providers verified by hand first; extraction pipeline tested against them
- Humans verify all URLs; LLM API extraction drafts plans/prices from those URLs, with evidence and PR review
- Compute optional plan-level price trends from verified public price history
- Draft public insight and recommendation values against the rubric; require human review

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

1. finalize the public factual metadata schema and types,
2. keep only the three seed provider records active and manually verify them,
3. build and validate the extraction pipeline against the verified seeds,
4. record human-verified URLs for remaining providers in the checklist,
5. add provider records in reviewed category batches and enable scheduled updates,
6. generate the single dist/providers.json bundle from active, reviewed records, and
7. document the versioning and release contract.

## Notes for future edits

- Keep this file as the living plan for metadata work
- When implementation starts, update this doc with completed milestones and any design decisions
- Avoid adding app logic or scoring code to this repo as the plan evolves
