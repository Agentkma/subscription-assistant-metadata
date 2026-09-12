# Provider Source Data Checklist

This checklist is the working intake document for the current real-source metadata phase. The goal is to gather verified public provider data for each category before any automated fetch or sync logic is added.

## Rules

- Use official provider-owned sources only.
- Prefer pricing, help center, cancellation, and plan pages from the provider itself.
- Record one canonical category per provider.
- Mark each source as `verified`, `needs-review`, or `not-found`.
- Do not treat placeholder scaffold files as real source data.
- Hold off on automation until sources are complete and validated.

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

| Provider | Category | Official site | Pricing page | Cancellation page | Help center | Logo source | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Example: Netflix | streaming | https://www.netflix.com | https://help.netflix.com/en/node/24926 | https://help.netflix.com/en/node/407 | https://help.netflix.com | https://assets.nflxext.com/.. | verified | Needs specific plan names and update timing |

## Collection workflow

1. Pick a category and list the target providers.
2. Confirm the provider has an official public web presence and pricing page.
3. Capture the canonical pricing, cancellation, and help links.
4. Confirm the logo asset and brand usage guidelines if needed.
5. Validate the links and record any missing fields.
6. Update the provider JSON file once the data is confirmed.
7. Re-run the schema validation for the provider and category.

## Working status legend

- `verified`: source is official and complete
- `needs-review`: source exists but requires manual validation or cleanup
- `not-found`: no reliable official source identified yet

## Priority order

Collect real-source data in this order:

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
