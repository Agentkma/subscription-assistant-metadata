# Provider Source Data Checklist

This checklist is the roadmap and source-URL tracker for all planned provider coverage. Netflix, Amazon Prime Video, and Spotify are the seed providers; their URLs, plans, and prices have been manually verified (`data-reviewed`), and they will serve as the baseline for the first LLM extraction trial. The other planned providers remain backlog entries without active provider JSON files until the seed trial establishes the workflow.

## Rules

- Use official provider-owned sources or verified official App Store listings for icons.
- Prefer pricing, help center, cancellation, and plan pages from the provider itself.
- Record one canonical category per provider.
- Track each provider as `seed-candidate`, `queued`, `urls-verified`, `data-reviewed`, or `manual-only`.
- The inventory below preserves planned category coverage; it is not evidence that any provider data is verified.
- Only create or retain provider JSON records for active seed providers or providers entering an approved intake batch.
- Do not publish seed records until their URLs, plans, and prices have been manually verified.
- Every provider/plan URL (official, pricing, cancellation, help center, plan `source.url`) is verified by a human. The LLM never discovers or changes URLs.
- Record one resolved HTTPS `logo.url` and one source: `app_store` with the approved listing's `app_store_id`, or `official` with a human-verified HTTPS provenance `url`. Prefer square app icons; do not populate multiple alternative sources.
- Future deterministic App Store lookups may propose refreshed image URLs from approved listing IDs only when the existing `logo.url` fails image health checks (or during initial intake / an explicit icon refresh), with PR review. Because Apple's CDN keeps content-addressed URLs live across app versions, do not churn working `logo.url` values on every lookup. Official-asset replacements remain manual.
- Check icon identity, appearance, and usage permissions during intake. Official sourcing does not grant redistribution rights. The app owns category-icon fallback behavior.
- Seed candidates are verified end to end by hand, including plans and prices, with `method: manual`. Record standard, non-promotional recurring prices per `billing_cycle` (put intro offers or monthly-equivalent breakdowns of annual plans in `notes`), and include a verbatim `source.evidence` snippet when practical so deterministic maintenance checks have an exact anchor.
- After the seed trial, remaining providers receive human-verified URLs before plan/price extraction is attempted. Their first pass uses LLM initial extraction; drafts require `method: automated`, evidence quotes, and PR review.
- Later re-checks run a deterministic presence check first (anchored on `source.evidence` or price + tier keywords) and call the LLM only on mismatches or explicit discovery sweeps, passing existing `plans[]` so `plan_id`s stay stable. A script re-confirmation sets `method: automated` with the matched snippet as evidence.
- For account-gated plans, use `source.method: manual`, set `source.url` explicitly to null, and provide a non-empty `access_hint`; these stay manual-only.
- For automated plan data, require a human-verified, non-empty `source.url` and a non-empty evidence quote. Never accept an automated record with a missing or null source URL.
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

## Provider inventory

Statuses: `seed-candidate` means selected for manual seed validation but not yet verified; `queued` means not yet active; `urls-verified` means a human confirmed the provider URLs; `data-reviewed` means plan data was checked; `manual-only` means automated extraction is not suitable. Duplicate category entries preserve planned coverage, but each provider should eventually have one canonical record/category.

| Category | Provider ID | Provider | Status |
| --- | --- | --- | --- |
| fitness_wellness | alo_moves | Alo Moves | queued |
| fitness_wellness | calm | Calm | queued |
| fitness_wellness | fitbod | Fitbod | queued |
| fitness_wellness | headspace | Headspace | queued |
| fitness_wellness | myfitnesspal | MyFitnessPal | queued |
| fitness_wellness | noom | Noom | queued |
| fitness_wellness | peloton | Peloton | queued |
| fitness_wellness | strava | Strava | queued |
| gaming | ea_play | EA Play | queued |
| gaming | geforce_now | GeForce NOW | queued |
| gaming | nintendo_switch_online | Nintendo Switch Online | queued |
| gaming | playstation_plus | PlayStation Plus | queued |
| gaming | ubisoftplus | Ubisoft+ | queued |
| gaming | xbox_game_pass | Xbox Game Pass | queued |
| learning | babbel | Babbel | queued |
| learning | chegg | Chegg | queued |
| learning | coursera | Coursera | queued |
| learning | duolingo | Duolingo | queued |
| learning | masterclass | MasterClass | queued |
| learning | rosetta_stone | Rosetta Stone | queued |
| learning | skillshare | Skillshare | queued |
| learning | udemy | Udemy | queued |
| lifestyle | blue_apron | Blue Apron | queued |
| lifestyle | calm | Calm | queued |
| lifestyle | cozi | Cozi | queued |
| lifestyle | headspace | Headspace | queued |
| lifestyle | hellofresh | HelloFresh | queued |
| lifestyle | nyt_cooking | NYT Cooking | queued |
| lifestyle | paprika | Paprika | queued |
| lifestyle | ynab | YNAB | queued |
| music_audio | apple_music | Apple Music | queued |
| music_audio | audible | Audible | queued |
| music_audio | pandora | Pandora | queued |
| music_audio | siriusxm | SiriusXM | queued |
| music_audio | spotify | Spotify | data-reviewed |
| music_audio | youtube_music | YouTube Music | queued |
| news_reading | kindle_unlimited | Kindle Unlimited | queued |
| news_reading | medium | Medium | queued |
| news_reading | new_york_times | New York Times | queued |
| news_reading | nyt_cooking | NYT Cooking | queued |
| news_reading | scribd | Scribd | queued |
| news_reading | the_economist | The Economist | queued |
| news_reading | wall_street_journal | Wall Street Journal | queued |
| news_reading | washington_post | Washington Post | queued |
| productivity | 1password_teams | 1Password Teams | queued |
| productivity | dropbox | Dropbox | queued |
| productivity | evernote | Evernote | queued |
| productivity | google_workspace | Google Workspace | queued |
| productivity | grammarly | Grammarly | queued |
| productivity | microsoft_365 | Microsoft 365 | queued |
| productivity | notion | Notion | queued |
| productivity | slack | Slack | queued |
| productivity | todoist | Todoist | queued |
| productivity | zoom | Zoom | queued |
| shopping_memberships | amazon_prime | Amazon Prime | queued |
| shopping_memberships | chewy_autoship | Chewy Autoship | queued |
| shopping_memberships | costco_membership | Costco Membership | queued |
| shopping_memberships | doordash_dashpass | DoorDash DashPass | queued |
| shopping_memberships | instacartplus | Instacart+ | queued |
| shopping_memberships | sams_club_membership | Sam's Club Membership | queued |
| shopping_memberships | uber_one | Uber One | queued |
| shopping_memberships | walmartplus | Walmart+ | queued |
| streaming | amazon_prime_video | Amazon Prime Video | data-reviewed |
| streaming | apple_tvplus | Apple TV+ | queued |
| streaming | crunchyroll | Crunchyroll | queued |
| streaming | disneyplus | Disney+ | queued |
| streaming | hulu | Hulu | queued |
| streaming | max | Max | queued |
| streaming | netflix | Netflix | data-reviewed |
| streaming | paramountplus | Paramount+ | queued |
| streaming | peacock | Peacock | queued |
| streaming | showtime | Showtime | queued |
| streaming | starz | Starz | queued |
| streaming | youtube_premium | YouTube Premium | queued |
| utilities_tools | 1password | 1Password | queued |
| utilities_tools | adobe_creative_cloud | Adobe Creative Cloud | queued |
| utilities_tools | canva | Canva | queued |
| utilities_tools | chatgpt_plus | ChatGPT Plus | queued |
| utilities_tools | dropbox | Dropbox | queued |
| utilities_tools | expressvpn | ExpressVPN | queued |
| utilities_tools | github | GitHub | queued |
| utilities_tools | lastpass | LastPass | queued |
| utilities_tools | nordvpn | NordVPN | queued |
| utilities_tools | notion_ai | Notion AI | queued |

## Intake template

| Provider | Category | Official site | Pricing page | Cancellation page | Help center | Icon URL | Icon source type | App Store ID or official provenance URL | Verified at | Automation | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Netflix | streaming | https://www.netflix.com | https://help.netflix.com/en/node/24926 | https://help.netflix.com/en/node/407 | https://help.netflix.com/en | https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/cd/76/f9/cd76f98c-0811-0a8c-7587-715d38832dc9/AppIcon-0-0-1x_U007epad-0-1-0-sRGB-0-85-220.png/512x512bb.jpg | app_store | 363590051 | 2026-10-25 | auto-eligible | data-reviewed | Help center article lists all 3 US plans in static HTML |
| Amazon Prime Video | streaming | https://www.amazon.com/primevideo | https://www.amazon.com/amazonprime | https://www.primevideo.com/help?nodeId=GWGDSNXVPJ93UW5V | https://www.primevideo.com/region/na/help | https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/36/ae/4c/36ae4c07-4a4d-8870-d7bc-e4329b9fe281/AppIcon-0-0-1x_U007epad-0-1-0-0-85-220.png/512x512bb.jpg | app_store | 545519333 | 2026-10-25 | auto-eligible | data-reviewed | Prime Monthly ($14.99) and Annual ($139) public; Prime Video Ultra ad-free upgrade ($4.99) is account_required |
| Spotify | music_audio | https://www.spotify.com/us/ | https://www.spotify.com/us/premium/#plans | https://support.spotify.com/us/article/cancel-premium/ | https://support.spotify.com/us/ | https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/5f/b6/e0/5fb6e0c6-cea6-e107-8d54-8e8fcec573ce/AppIcon-0-0-1x_U007epad-0-1-0-0-sRGB-85-220.png/512x512bb.jpg | app_store | 324684580 | 2026-10-25 | auto-eligible | data-reviewed | Individual ($12.99), Duo ($18.99), Family ($21.99), Student ($6.99) verified |

## Collection workflow

### URL intake (all providers)

1. Pick a category and list the target providers.
2. Confirm the provider has an official public web presence.
3. Open and confirm the canonical official, pricing, cancellation, and help-center links on provider-owned domains.
4. Confirm one official icon source and the provider's identity. Resolve the direct image URL (Apple lookup `artworkUrl512` for an approved App Store ID), inspect the image, and check usage permissions. Record the image URL and source separately.
5. Record verified URLs and status in this checklist.
6. Create/update a provider JSON only when that provider enters an active seed or intake batch, then run schema validation.

### Seed providers only

7. Record every plan and price from the pricing page with a `source` block (`method: manual`).
8. Mark the row `data-reviewed`; these files become the ground truth for testing the extraction pipeline.

### Reviewing automated drafts

- Check each changed price against the evidence quote and source URL.
- Reject any automated value without a non-empty source URL and evidence; fix or leave it out before merging.
- Confirm account-gated entries use manual provenance, `source.url: null`, and a non-empty access hint.
- Review proposed icon changes against the approved listing identity; confirm the image decodes, has usable dimensions, and still represents the provider. URL health checks must inspect content and redirects, retry transient failures, and distinguish blocked access from broken links.
- Mark providers the pipeline gets wrong repeatedly as `manual-only`.

## Automation column

These labels describe plan extraction eligibility. Icon health checks and approved-ID App Store lookups can be assessed independently, subject to source terms and access restrictions.

- `auto-eligible`: public, static pricing page; can be monitored by the scheduled pipeline
- `manual-only`: JS-heavy, bot-blocked, terms-restricted, or account-gated; re-verify by hand when flagged stale

## Working status legend

- `seed-candidate`: selected for the seed set but not yet manually verified
- `queued`: planned but not yet active
- `urls-verified`: a human confirmed official source URLs
- `data-reviewed`: plan data was reviewed and verified
- `manual-only`: automated fetching/extraction is unsuitable

## Priority order

Seed providers first (Netflix, Amazon Prime Video, Spotify), then URL intake in this order:

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

Only active, reviewed providers should have JSON records under `metadata/providers/<category>/`; every active record must pass schema validation. During the seed trial, the directory contains only the three seed candidates, and no record is publish-ready until its checklist status is `data-reviewed`.
