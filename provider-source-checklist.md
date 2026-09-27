# Provider Source Data Checklist

This checklist is the working intake document for provider source data. Humans verify every provider's URLs; plan and price data is fully hand-verified only for the seed providers, and drafted by the extraction pipeline for everyone else (then reviewed via PR).

## Rules

- Use official provider-owned sources only.
- Prefer pricing, help center, cancellation, and plan pages from the provider itself.
- Record one canonical category per provider.
- Mark each source as `verified`, `needs-review`, or `not-found`.
- Do not treat placeholder scaffold files as real source data.
- Every URL (official, pricing, cancellation, help center, `source.url`) is verified by a human. The pipeline never adds or changes URLs.
- Seed providers (Netflix, Amazon Prime Video, plus one JS-heavy provider) are verified end to end by hand, including plans and prices, with `method: manual`.
- For all other providers, record URLs only; plans and prices come from the automated first pass with `method: automated` and an evidence quote.
- For account-gated plans, set `source.url` to null and add an `access_hint`; these stay manual-only.
- Note whether each provider's pricing page is automation-friendly (static HTML) or manual-only (JS-heavy, bot-blocked, or gated).

## Canonical categories

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

## Intake template

| Provider | Category | Official site | Pricing page | Cancellation page | Help center | Logo source | Verified at | Automation | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Example: Netflix | streaming | https://www.netflix.com | https://help.netflix.com/en/node/24926 | https://help.netflix.com/en/node/407 | https://help.netflix.com | https://assets.nflxext.com/.. | 2026-09-12 | auto-eligible | verified | Needs specific plan names and update timing |

## Collection workflow

### URL intake (all providers)

1. Pick a category and list the target providers.
2. Confirm the provider has an official public web presence.
3. Open and confirm the canonical official, pricing, cancellation, and help-center links on provider-owned domains.
4. Confirm the logo source.
5. Record the URLs in the provider JSON and mark the Automation column.
6. Re-run the schema validation.

### Seed providers only

7. Record every plan and price from the pricing page with a `source` block (`method: manual`).
8. These files are the ground truth used to test the extraction pipeline.

### Reviewing automated drafts

- Check each changed price against the evidence quote and source URL.
- Reject any value without evidence; fix or null it before merging.
- Mark providers the pipeline gets wrong repeatedly as `manual-only`.

## Automation column

- `auto-eligible`: public, static pricing page; can be monitored by the scheduled pipeline
- `manual-only`: JS-heavy, bot-blocked, terms-restricted, or account-gated; re-verify by hand when flagged stale

## Working status legend

- `verified`: source is official and complete
- `needs-review`: source exists but requires manual validation or cleanup
- `not-found`: no reliable official source identified yet

## Priority order

Seed providers first (Netflix, Amazon Prime Video, one JS-heavy provider), then URL intake in this order:

1. streaming
2. music_audio
3. productivity
4. fitness_wellness
5. learning
6. gaming
7. news_reading
8. utilities_tools
9. lifestyle
10. shopping_memberships

## Output expectation

Each verified provider record should eventually map to a valid JSON provider file under `metadata/providers/<category>/` and pass the repo’s schema validation before the bundle is published.
