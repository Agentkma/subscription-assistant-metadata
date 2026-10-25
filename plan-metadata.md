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

The repo is following an Agile vertical-slice approach: ship a minimal, end-to-end metadata bundle with the three seed providers (Netflix, Amazon Prime Video, and Spotify) first so the private SubSage app can be built, tested in TestFlight, and validated through App Store review before investing in the automated extraction pipeline or 80+ provider intake. Track all remaining provider coverage in `provider-source-checklist.md` without scaffold JSON files. A read-only source health check (`npm run check:sources`) is implemented for manual and monthly runs; automated plan extraction and full catalog expansion are intentionally deferred until the app's runtime contract is proven in production.

The active focus is:

- ~~manually verify the three seed provider records (URLs, plans, prices, and icons)~~ — done; seeds are `data-reviewed`
- validate the recorded URLs and metadata against the schema and semantic rules
- build a deterministic bundle generator (`dist/providers.json` + `dist/version.json`) and publish to GitHub Pages for the seed catalog
- integrate the live seed bundle into the private SubSage app and incorporate any schema learnings while the catalog is only 3 files
- run read-only source health checks against approved URLs without changing provider data
- defer the automated extraction pipeline and bulk provider intake until after the private app's initial build and App Store feedback

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

Future scripts resolve `app_store` sources through Apple's lookup API using the approved ID and applicable country (the seeds use `US`) only during initial intake, when an existing `logo.url` fails image health checks, or during an explicit icon refresh, then propose updated artwork URLs for review. Because Apple's CDN keeps content-addressed artwork URLs live across app versions, working `logo.url` values are left untouched on regular runs to avoid noisy diffs and unnecessary client cache invalidation. Non-country region codes require an explicit country mapping before lookup. `official` sources support image health checks but replacement discovery stays manual. These scripts are deferred until the seeds are reviewed.

### Plan object

- plan_id: stable identifier within the provider; preserved across price updates so append-only price history stays linked
- name: normalized display name for the app UI (may differ from verbatim marketing copy on the page)
- billing_cycle
- price: `amount` and `currency` (three-letter ISO 4217 code). Always record the standard, non-promotional recurring charge billed per `billing_cycle` (for example, the full annual charge for `yearly` or the post-trial recurring charge for `monthly`), never introductory promo rates or monthly-equivalent breakdowns of annual plans
- notes (optional): use for introductory offers, bundle caveats, or monthly-equivalent breakdowns
- url_visibility (optional): `public` | `account_required` | `unknown`
- access_hint (optional generally; required and non-empty when `url_visibility` is `account_required`): user-facing guidance, never treated as a public source
- source (required for every plan):
  - url: HTTPS page the price was confirmed on (required and non-empty for non-account-gated plans; explicitly null for account-gated plans)
  - verified_at: valid ISO date when a human or the pipeline confirmed the value
  - method: `manual` | `automated` — how the value was most recently verified; a script re-confirmation of a manually entered value sets `automated`
  - evidence: short verbatim snippet from the source page confirming the plan and price (required and non-empty for `automated`; also serves as the anchor for deterministic maintenance checks)

Conditional plan rules:

- Non-account-gated plans require a source URL and valid `source.verified_at` date. This is the last date our pipeline or a human verified the current price, not the provider's effective price-change date.
- Record the price in the currency charged for the plan's region. Do not convert or relabel it as USD; any normalized comparison price must be a separate derived value with its exchange-rate provenance.
- `source.method: automated` requires a non-empty `source.url` and `source.evidence`.
- `url_visibility: account_required` requires a non-empty `access_hint` and `source.method: manual` with `source.url: null`.

### URLs object (provider-level only)

- official (optional)
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

- `metadata/`
  - `categories.json`
  - `providers/<category>/<provider_id>.json` (for example `streaming/netflix.json`, `music_audio/spotify.json`)
  - `history/<provider_id>/<plan_id>.json` (planned)
- `pipeline-state/` (planned, internal only)
  - `source-hashes.json`
- `src/`
  - `schema.ts`
  - `types.ts`
  - `validateProviders.ts`
  - `checkProviderSources.ts`
- `tests/`
  - `provider-validation.test.ts`
  - `provider-source-check.test.ts`
- `dist/` (planned build output)
  - `providers.json`
  - `version.json`
- `.github/workflows/`
  - `validate.yml`
  - `check-provider-sources.yml`
  - `publish-metadata.yml` (planned)
- `package.json`
- `tsconfig.json`
- `README.md`
- `plan-metadata.md`
- `provider-source-checklist.md`

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

`dist/providers.json` contains current provider/plan records plus their append-only price history. This is the single file the app consumes at runtime; it can derive price trends and other time-based insights from the published observations.

## Versioning model

### Pre-release contract iteration

The repo is not yet marked ready for its first public release, no versioned bundle has been published, and no downstream consumer contract is active. Schema and provider-data changes during this phase do not require `bundleVersion` or `schemaVersion` increments. When the repo is explicitly marked ready, establish the initial versions and publish the first bundle; that release freezes the initial consumer contract.

After that release, breaking schema changes require a major `schemaVersion` increment and coordination with downstream consumers before publication. Metadata-only updates increment `bundleVersion`. Do not treat pre-release schema iterations as released compatibility changes.

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

- After initial release, if metadata content changes, increment bundleVersion
- After initial release, if the schema change is breaking, increment the major schemaVersion and coordinate consumer support; apply the chosen SemVer policy for compatible schema changes
- Optional release tag: metadata-v1.2.3
- The app should compare schemaVersion before trusting the bundle shape

## Publishing flow

 GitHub Actions are split by responsibility so external site checks never run inside the deterministic merge gate or publish build:

1. **PR validation workflow (`validate.yml`):**
   - Triggers on pull requests and merge groups targeting `main`
   - Runs tests, provider schema and semantic validation, TypeScript typechecking, and linting
2. **Maintenance & extraction PR workflow (planned evolution of `check-provider-sources.yml`):**
   - Triggers monthly (first of the month) or via manual `workflow_dispatch`
   - Fetches external pricing, cancellation, and logo URLs
   - Runs deterministic presence checks (or LLM extraction on mismatch / initial extraction) and updates `pipeline-state/source-hashes.json`
   - Opens a PR with the metadata diff and evidence for human review; never auto-merges or publishes
3. **Publish workflow (`publish-metadata.yml`, planned):**
   - Triggers on push to `main` (when a reviewed PR merges) or manual dispatch
   - Runs deterministic validation against committed files only (no external scraping)
   - Computes optional plan-level price trends from committed price history
   - Builds `dist/providers.json` (current provider records + append-only price history) and `dist/version.json`
   - Publishes `dist/` to GitHub Pages

### Output contract

- `dist/providers.json`
- `dist/version.json`

This aligns with the app release pattern of shipping a baseline bundle and fetching the latest metadata on app launch when online.

## Automated update strategy

The maintenance workflow is being built in layers. The first layer is implemented as `npm run check:sources` and `.github/workflows/check-provider-sources.yml`: it checks already-recorded page and logo URLs, reports blocked responses for manual review, and fails on definite errors. It is read-only: it does not extract or change provider metadata.

The later extraction layer will keep the dataset current by combining deterministic scripts with a constrained LLM API call. The LLM only extracts; scripts validate; a human approves every proposed change via PR.

The extraction layer runs in two modes:

- **Initial extraction** (new providers): the LLM drafts all `plans[]` from human-verified URLs. A human reviews every value before merge. This is how remaining providers are seeded after the pipeline is tuned against the three verified seeds.
- **Maintenance** (existing providers): a deterministic presence check runs first. The LLM is called only when recorded values are missing from the page or new plan-like content appears.

Provider and plan source URLs, official logo provenance pages, and App Store listing identities are human-verified. The LLM never discovers or proposes URLs; it only reads pages at URLs a human has already confirmed. Deterministic App Store lookups may propose refreshed `logo.url` values from approved IDs, subject to PR review.

### Field ownership

| Field type | Fields | Update method |
| --- | --- | --- |
| Deterministic | Provider URL health, `logo.url` image health, App Store artwork refresh from approved IDs, schema validity, staleness of plan `source.verified_at` | Script; changes require PR review |
| Human-verified | `urls.*` values (official, pricing, cancellation, help center), plan `source.url`, logo listing identity or official provenance URL, manually selected official image URL | Manual, for every provider |
| Extracted facts | `plans[]` names, prices, billing cycles, `url_visibility` | Initial extraction: LLM API with evidence. Maintenance: deterministic presence check, LLM fallback on mismatch |
| Derived public fact | `plans[].price_trend` | Computed from public price history; omitted until history exists |
| Curated public insights | `intelligence`, `recommendations` | Draft against a written rubric; human-reviewed before publishing; values are public |
| Account-gated | plans with `url_visibility: account_required` | Manual only; flagged when stale |

### Pipeline

1. Scheduled/manual trigger (standard maintenance mode by default, or an explicit discovery sweep flag when checking for newly added tiers).
2. Script fetches each unique `(region, source.url)` / `urls.pricing` (Playwright when pages are JS-rendered) with region-appropriate locale headers (such as `Accept-Language: en-US,en;q=0.9` for `US`). Before trusting the response, assert that the final `response.url` did not geo-redirect to another locale path (for example `/ca/`, `/gb/`, or `/de/`).
3. Script normalizes the page to visible text and hashes that per `(provider_id, region, url)`, not the raw HTML, so tokens and script bundles don't register as changes. If the hash matches the last confirmed run, the previous evidence still holds and only `source.verified_at` is refreshed. Hashes are stored as described in "Pipeline state" below.
4. Maintenance presence check (when the hash changed or no hash is stored yet):
   - Because `plan.name` may be a normalized UI label (such as `"Amazon Prime (Monthly)"`), the check anchors on `source.evidence` when present (verifying the verbatim evidence snippet still appears in the normalized page text and still contains the recorded price), or on the formatted price plus plan/billing-cycle keywords when `source.evidence` is `null` on a manual seed.
   - If every recorded plan for that URL passes the presence check, the script updates `source.verified_at`, sets `source.method: automated`, stores/retains the verbatim `evidence` snippet, updates the stored URL hash, and **skips the LLM** (even if surrounding marketing copy changed the page hash). No price-history observation is appended.
5. Otherwise (a recorded plan fails the presence check, an explicit plan-discovery sweep was requested, or the provider is in initial extraction), an LLM API call receives the page text plus the plan schema:
   - In maintenance mode, the prompt also includes the existing `plans[]` (`plan_id`, `name`, `billing_cycle`, `price`) and instructs the model to preserve existing `plan_id` and normalized `name` values whenever a tier still corresponds to an existing plan, only proposing new `plan_id`s for genuinely added tiers.
   - The prompt requires standard, non-promotional recurring prices per `billing_cycle` (putting trials, intro promos, or monthly-equivalent breakdowns of annual plans in `notes`) and a verbatim `evidence` quote per plan.
   - Scripts reject any value whose `evidence` does not appear verbatim in the fetched text.
6. Scripts validate the output: AJV schema, currency/billing-cycle checks, flag price changes > ~25%, flag removed plans, reject values missing evidence.
7. Script checks provider URL availability, redirects, and expected content; fetches and decodes `logo.url` to check usable image content and dimensions; and queries Apple's lookup API to propose a refreshed App Store artwork URL from the approved `app_store_id` only if the current `logo.url` fails health checks (or an explicit icon refresh is requested). Retry transient errors and report blocked requests separately from broken URLs. HTTP 200 alone is not sufficient.
8. Pipeline opens a PR with old → new values, evidence, and source URLs. Nothing auto-merges.
9. On merge: build bundle, publish to GitHub Pages.

Maintenance decision table:

| Content hash | Recorded values present | Action |
| --- | --- | --- |
| Unchanged | (check skipped) | Refresh `verified_at` |
| Changed | Yes | Refresh `verified_at`, `evidence`, and stored hash; skip LLM (unless explicit discovery sweep) |
| Changed | No | Value changed or removed → LLM (with existing `plans[]` for `plan_id` mapping) |
| No stored hash | Yes | Refresh `verified_at` and `evidence`; record baseline hash; skip LLM |
| No stored hash | No | LLM (with existing `plans[]` for `plan_id` mapping) |

### Pipeline state

- Content hashes are internal pipeline state, not provider data. They live in a committed `pipeline-state/source-hashes.json`, keyed by `(provider_id, region, source_url)` since multiple plans commonly share one pricing URL.
- The file sits outside `metadata/`, is not validated by the provider schema, and is never included in the published bundle.
- The pipeline updates it in the same PR as the related `verified_at` or plan changes, so it adds no separate commits.
- Because landing-page marketing copy changes frequently, a hash change combined with a passing presence check does not trigger the LLM on regular runs; newly added tiers are detected either when a page redesign breaks a presence check or during an explicit discovery sweep.

### Model selection

No model is chosen yet; the seed trial (rollout step 3) selects it. The task is narrow structured extraction at low volume, so cost is negligible and accuracy decides.

- Requirements: JSON-schema structured output, exact copying of names/prices/currencies, verbatim evidence quotes, no tools or browsing.
- Evaluate 2–3 candidates (at least one small and one larger model) at temperature 0 against the three verified seeds. Score exact match on plan name, price, currency, and billing cycle, plus the verbatim-evidence check.
- Use the cheapest model that matches every seed exactly. Optionally escalate to the larger model when a small-model result fails validation.
- Pin an exact model version in pipeline config; never rely on a provider's moving default alias. Re-run the seed evaluation before changing models or versions.
- Prefer a provider usable from GitHub Actions with minimal secrets (for example GitHub Models via `GITHUB_TOKEN` with `models: read`, if available and permitted by its terms); otherwise store a single provider API key as an Actions secret.

### Guardrails

- Fetched page content is untrusted input (prompt injection risk). The LLM step has no write access or secrets beyond its API key and returns JSON only.
- The LLM never outputs URLs into provider files. Provider/plan URL changes and official-asset replacements are human edits; deterministic artwork refreshes from approved App Store IDs are the only automated URL-change proposals and require review.
- Verify logo identity and usage permissions during manual intake; a successful image fetch does not establish either. Do not host copies without checking redistribution permissions.
- Schema validation and PR review are the enforcement layer, not the model.
- Providers that block automated fetches or have no public pricing page are marked manual-only.
- Check provider terms of service before automated fetching; prefer official help articles or APIs.
- Send region-appropriate `Accept-Language` headers and reject unexpected locale redirects (such as `/ca/` or `/gb/` when checking `US`) so runner IP location does not silently swap currencies or plans.

### Price history

- Append-only per-plan history (planned at `metadata/history/<provider_id>/<plan_id>.json`) will record the initial verified baseline and each subsequently confirmed price change. Each observation will record `price` (`amount` and ISO 4217 `currency`), region, and `observed_at` date when we confirmed it; do not imply this is the provider's effective change date unless the provider states that date.
- The planned publishing build will include these observations inside the single `dist/providers.json` bundle alongside the current provider/plan records. A scheduled check that finds no price change will update the current plan's `source.verified_at` but will not append a duplicate price-history observation.
- The app derives price trends and any other time-based intelligence from the published history. Optional `plans[].price_trend` (`trend`, `last_increase`, `increase_percent`) is a precomputed convenience, not a substitute for publishing history; omit it until enough verified history exists.

### Insight rubric

- A written rubric defines `cancellation_difficulty` 1–5, `value_score_baseline`, `category_rank`, and `seasonal_pattern` so public insight values are consistent and reviewable.
- LLM-drafted insight and recommendation changes require human review in a PR; the client-side scoring implementation remains in the app.

### Rollout order

1. Finish manual verification and reviewer sign-off for the three seed providers (`netflix`, `amazon_prime_video`, `spotify`). Confirm their records and checklist statuses are accurate.
2. Build the deterministic bundle generator (`dist/providers.json` and `dist/version.json`) and the push-to-`main` GitHub Pages publish workflow (`publish-metadata.yml`) for the verified seed catalog.
3. Build and ship the initial vertical slice of the private SubSage app against the live 3-provider bundle (including custom subscription entry, offline fallback, and version checks). Feed any UI or App Store review learnings back into the schema while only 3 provider files exist (and optionally top up to ~10–15 manually verified providers if needed for App Store submission).
4. Keep the read-only source health check running manually or monthly. Fix or manually review definite failures; treat blocked responses as inconclusive.
5. Once the app contract is proven in a real build, build the local extraction-and-diff pipeline for seed sources: fetch approved URLs → deterministic presence check → LLM extraction on mismatch or in initial-extraction mode → validate against schema and sanity rules → produce a reviewable draft. Tune initial extraction until it reproduces the verified seeds, and confirm the presence check passes on them without calling the LLM.
6. Add a GitHub Actions draft workflow that opens a PR for proposed base-plan changes. It must never auto-merge or discover/change source URLs. Keep account-gated plans manual-only.
7. Intake human-verified URLs and logo sources for remaining providers, then run reviewed first passes by category. Mark unsuitable providers `manual-only`.
8. Add scheduled change detection and re-extraction only after draft quality and review flow are reliable.
9. Defer price-trend calculation and LLM-drafted recommendations/intelligence until base-data history and extraction are established; keep all such changes human-reviewed.

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

### Phase 3: Seed bundle generation and GitHub Pages publishing (Vertical Slice)

- ~~Manually verify the three seed provider files~~ — done
- Merge active, reviewed provider files into a single `dist/providers.json` artifact
- Emit `dist/version.json` with `bundleVersion` and `schemaVersion`
- Add push-to-`main` publish workflow (`publish-metadata.yml`) that deterministically builds and publishes `dist/` to GitHub Pages

### Phase 4: Private app integration and contract validation

- Consume the live 3-provider bundle in the private SubSage app
- Validate schema ergonomics, icon rendering/fallbacks, and App Store review requirements
- Refine the schema while the catalog is small; optionally add a small batch of manually verified providers for initial App Store launch

### Phase 5: Automated extraction pipeline and catalog expansion

- Follows steps 5–9 in "Rollout order" under "Automated update strategy"
- Test extraction pipeline against the verified seeds
- Humans verify all URLs; LLM API extraction drafts plans/prices for new providers from those URLs, with evidence and PR review
- Add scheduled/manual extraction workflow that opens a PR with diffs and evidence for human review before merge
- Compute optional plan-level price trends from verified public price history
- Draft public insight and recommendation values against the rubric; require human review

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

This repo will serve as the public metadata source of truth for SubSage and should remain intentionally narrow in scope. Following an Agile vertical-slice approach, the next implementation steps are to:

1. ~~finalize the initial schema and semantic validation rules~~ (done),
2. ~~manually verify the three seed provider records (`netflix`, `amazon_prime_video`, `spotify`)~~ (done),
3. build the deterministic `dist/providers.json` + `dist/version.json` generator and publish the 3-provider bundle to GitHub Pages,
4. build the private SubSage app against the live seed bundle and iterate on the schema based on real UI and App Store review feedback,
5. build and validate the automated extraction pipeline against the verified seeds once the app contract is stable,
6. record human-verified URLs for remaining providers in the checklist, and
7. add provider records in reviewed category batches and enable scheduled updates.

## Notes for future edits

- Keep this file as the living plan for metadata work
- When implementation starts, update this doc with completed milestones and any design decisions
- Avoid adding app logic or scoring code to this repo as the plan evolves
