# Adversarial Review 1: Holistic Plan & Repository Pressure Test

**Date:** 2026-10-24

This review pressure-tests the metadata plan (`plan-metadata.md`, `README.md`, `provider-source-checklist.md`) against the current schema, validation code, seed records, and planned automation pipeline.

---

## 1. Pipeline & Extraction Gotchas (High Impact)

### A. Plan ID stability & matching across runs
When the LLM runs (either on a hash change or a price change), it returns extracted plans from the raw page text.

- **The trap:** The LLM does not inherently know the repo's canonical `plan_id` values (`standard_with_ads` vs `ad_supported`, `prime_annual` vs `annual`), or normalized `name` strings (for example, `metadata/providers/streaming/amazon_prime_video.json` uses `"Amazon Prime (Monthly)"` and `"Amazon Prime (Annual)"`, which is not how Amazon labels them verbatim on the page).
- **Result:** In maintenance mode, if the existing `plans[]` array (`plan_id`, `name`, `billing_cycle`) is not passed to the LLM with instructions to map extracted plans to existing `plan_id`s whenever possible, every LLM fallback risks inventing new `plan_id`s, looking like a plan deletion + addition, and breaking append-only price history (`metadata/history/<provider_id>/<plan_id>.json`).
- **Deterministic presence check mismatch:** `plan-metadata.md` states *"if every recorded plan name and price still appears in the normalized text"*. For `amazon_prime_video.json`, the literal string `"Amazon Prime (Monthly)"` may not appear verbatim on `https://www.amazon.com/amazonprime`. If `name` is a normalized display label for the app UI rather than a verbatim page string, the deterministic presence check will always fail and trigger the LLM.

### B. Promo / intro pricing vs. standard recurring pricing
Many providers (Hulu, Peacock, Spotify, NYT, ExpressVPN, etc.) prominently display promotional pricing (`"$0 for 1 month"`, `"$1.99/mo for 3 months, then $11.99/mo"`, or `"$4.99/mo (billed annually at $59.88)"`).

- **In deterministic mode:** If the regular price (`$11.99`) is still in the fine print, the presence check passes.
- **In LLM mode:** Without an explicit rule in the extraction prompt and schema docs, an LLM will frequently extract the headline promo price or the "per-month equivalent of an annual plan" instead of the standard recurring charge per billing cycle.
- **Recommendation:** Explicitly define `price.amount` as the **standard, non-promotional recurring charge for the `billing_cycle`** (e.g., full annual charge for `yearly`, post-trial recurring charge for `monthly`), and use `notes` for intro offers or monthly-equivalent breakdowns.

### C. The "Hash Changed + Values Present -> Run LLM" rule may negate cost/noise savings
In `plan-metadata.md`:
> `Content hash: Changed` | `Recorded values present: Yes` -> `Possible new plan or other change -> LLM`

Even when hashing normalized visible text instead of raw HTML, marketing copy on landing pages (`netflix.com/signup`, `amazon.com/amazonprime`, `spotify.com/us/premium`) changes constantly (featured show titles, "Trending now", FAQ tweaks, copyright year, dynamic promos).

- If the whole page's visible text is hashed, the hash will change on almost every monthly run, causing **the LLM to run on almost every monthly run anyway**, even when all recorded prices are still present.
- **Fix options:**
  1. Only hash a scoped DOM selector or a narrowed "pricing window" around the matched evidence snippets, OR
  2. When `Hash Changed + Recorded values present`, accept the deterministic presence match on regular runs and only run a full LLM "new plan discovery" sweep less frequently or manually.

### D. Hash key granularity
`plan-metadata.md` states `pipeline-state/source-hashes.json` is keyed by `provider ID, plan ID, and source URL`.

- In all three seed files, all public plans for a provider share the exact same `source.url` (e.g., all 3 Netflix plans use `https://www.netflix.com/signup`; all 4 Spotify plans use `https://www.spotify.com/us/premium/#plans`).
- Fetching and hashing is per-URL (or per-URL + region), not per-plan. Keying hashes by `(region, url)` (or `(provider_id, region, url)`) avoids duplicating the same hash across every plan of a provider.

### E. Geo-IP & Runner Location (`US` pricing from GitHub Actions)
`plan-metadata.md` notes *"Confirm extracted prices are USD/US-region, since runner IP location is not guaranteed."*

- GitHub-hosted `ubuntu-latest` runners are usually in US Azure regions, but not guaranteed, and URLs like `https://www.netflix.com/signup` geo-redirect (`netflix.com/ca/signup`, etc.) or swap currency based on IP/headers.
- Enforce `Accept-Language: en-US,en;q=0.9` in fetch/Playwright headers AND assert that the final `response.url` did not redirect to a non-US locale path (e.g., `/gb/`, `/ca/`, `/de/`) before trusting the page text.

---

## 2. Schema & Validation Gaps (Code vs. Docs)

### A. Missing semantic validations that `plan-metadata.md` claims Phase 2 enforces
JSON Schema (`src/schema.ts`) only validates single-object structure, not cross-field or cross-file invariants:

1. **Unique `plan_id` within a provider:** `plan-metadata.md` lists `unique plan ids` as a required check, but `plans` in `src/schema.ts` only has `minItems: 1`. Two plans with `"plan_id": "standard"` in the same file currently pass `npm run validate`.
2. **`provider_id` vs. filename / directory match:** Nothing checks that `metadata/providers/streaming/netflix.json` has `"provider_id": "netflix"` and `"category": "streaming"`, or that `provider_id` is unique across the repo.
3. **`default_region` in `regions[]`:** A file with `"default_region": "US"` and `"regions": ["CA"]` passes schema validation today.
4. **URLs in `providerMetaSchema.urls` and `providerPlanSchema.urls` are not validated as HTTPS URIs:**
   In `src/schema.ts`, `pricing`, `cancellation`, and `help_center` are defined as `{ type: ['string', 'null'], minLength: 1 }` without `format: 'uri', pattern: '^https://'`. Additionally, in `regional_overrides`, `urls` is `{ type: 'object' }` with no property constraints at all.

### B. `checkProviderSources.ts` uses `Range: bytes=0-0` and runs all requests concurrently
In `src/checkProviderSources.ts`:

- Many CDNs and origin servers return `400`, `403`, or `416 Range Not Satisfiable` when an HTML page is requested with `Range: bytes=0-0` and a custom bot User-Agent (`SubSage-Metadata-Source-Check/1.0`).
- `Promise.all(sources.map(...))` fires every URL check across all providers simultaneously with no concurrency limit. At 3 seeds (~12 URLs) this is fine; at 80+ providers (~350 URLs) it risks rate limits (`429`) or socket exhaustion.

---

## 3. Documentation & Contract Inconsistencies

1. **Bundle filename mismatch across docs:**
   - `README.md` refers to `dist/metadata.bundle.json` and `dist/version.json` in two sections, while referring to `dist/providers.json` in the Schema section.
   - `plan-metadata.md` refers to `dist/providers.json` and `dist/version.json`.
   - Pick one canonical filename so the downstream app contract is unambiguous.
2. **Repo structure diagram in `README.md` is stale:**
   It shows `data/categories.json` and `data/subscriptions.json` instead of `metadata/categories.json` and `metadata/providers/<category>/<provider>.json`.
3. **Publishing flow vs. Automated update strategy in `plan-metadata.md`:**
   - The "Publishing flow" section describes a single monolithic GitHub Action that triggers on push to `main`, fetches external pricing pages, builds `dist/`, publishes to GitHub Pages, and opens a PR.
   - This contradicts the layered design in "Automated update strategy", where scheduled/manual runs open a PR with metadata changes, and merging to `main` deterministically builds and publishes `dist/` to GitHub Pages without scraping external sites during publish.
4. **Duplicate providers across categories in `provider-source-checklist.md`:**
   `calm`, `headspace`, `nyt_cooking`, and `dropbox` appear twice in the checklist table under different categories, and `metadata/categories.json` `provider_count` values include those duplicates. Until those 4 are assigned a single canonical category, `categories.json`'s `provider_count` will not match the number of actual provider files.

---

## Suggested Follow-Up Order

1. **Refine the extraction design** in `plan-metadata.md` (handle `Hash Changed + Values Present`, `name` vs. page label matching, `plan_id` preservation, hash key granularity, and promo-price rules).
2. **Tighten `src/schema.ts` and `src/validateProviders.ts`** (enforce HTTPS URIs on all `urls.*` fields, unique `plan_id`s, `default_region` in `regions`, and `provider_id`/category path checks).
3. **Clean up doc inconsistencies** (bundle filename, `README.md` repo layout, and separating the PR update workflow from the merge-to-main publish workflow).
