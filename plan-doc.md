# SubSage Metadata Handoff

## Short takeaway

You can hand off to VS Code Copilot now, but you need a structured, concise technical summary of the product so it understands the architecture, the metadata model, and the Value Score logic.

This packet is written for the public metadata repo and the private app repo, and it is formatted so Copilot can immediately generate schema files, TypeScript interfaces, JSON examples, and pipeline scaffolding.

## 1. Product summary

SubSage is a privacy-first subscription intelligence app. It does not link bank accounts, scrape data, or track usage. All intelligence is generated locally using a public metadata bundle hosted on GitHub Pages.

The app calculates a Value Score for each subscription based on:

- user-provided qualitative inputs
- metadata-provided pricing, friction, seasonal patterns, and alternatives
- internal weighting logic

The app has two repos:

### Repo 1 — Public Metadata Repo (GitHub Pages)

Contains:

- metadata schema
- subscription objects
- pricing data
- friction data
- seasonal patterns
- alternatives
- category definitions
- insight triggers
- value score weights
- GitHub Actions pipeline to validate and publish the JSON bundle

### Repo 2 — Private App Repo

Contains:

- Value Score engine
- Insight engine
- metadata fetcher
- caching logic
- offline fallback bundle
- UI components for category search, manual entry, value score, and insights
- qualitative-to-numeric mapping

## 2. Metadata schema requirements

Copilot should generate a schema with these top-level objects:

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

### Value Score weights

- satisfactionWeight
- relianceWeight
- usageFrequencyWeight
- priceSensitivityWeight
- frictionWeight
- seasonalWeight
- alternativesWeight

## 3. Metadata pipeline requirements

Copilot should generate:

### GitHub Actions workflow

- validate JSON against schema
- build metadata bundle
- publish to GitHub Pages
- version the bundle
- generate a fallback bundle for the app

### Validation

- JSON Schema
- TypeScript type guards
- CI failure on invalid metadata

### Output

- /dist/metadata.json
- /dist/version.json

## 4. App logic requirements

Copilot should know the app will:

### Value Score engine

Convert qualitative inputs:

- Satisfaction (1–5 buttons)
- Reliance (Low/Med/High)
- Usage Frequency (dropdown)
- Price Sensitivity (Low/Med/High)
- Seasonal Value (Low/Med/High)

Into numeric values on a 0–100 scale internally.

### Insight engine

Uses metadata and user inputs to generate:

- overpriced
- underused
- seasonal drop
- friction warning
- alternative suggestion

### Metadata fetcher

- fetch from GitHub Pages
- cache locally
- fallback to bundled metadata
- handle version mismatches

## 5. UI summary

Copilot should understand the app has these screens:

### Find by Category

- category list
- subscription list
- metadata-driven browsing

### Manual Entry

- satisfaction (1–5 buttons)
- reliance (L/M/H)
- usage frequency (dropdown)
- price sensitivity (L/M/H)
- seasonal value (L/M/H)
- default values pre-filled

### Value Score

- score
- factors
- insights
- how-this-score-is-calculated microcopy

### Insights

- metadata-powered explanations
- recommendations

## Final handoff summary

Paste the entire packet above into VS Code Copilot. It gives Copilot the architecture, metadata model, Value Score logic, insight logic, repo structure, pipeline requirements, and UI context.

This is the level of detail needed to begin generating:

- schema files
- JSON examples
- TypeScript interfaces
- validation logic
- GitHub Actions workflows
- metadata ingestion code
- Value Score engine scaffolding
