**Short takeaway:**  
You *can* hand off to VS Code Copilot now — but you need to give it a **structured, concise technical summary** of the product so it understands the architecture, the metadata model, and the Value Score logic. Below is the exact “handoff packet” you should paste into VS Code Copilot to give it full context.

This is written specifically for **your repos**, **your architecture**, and **your MVP design** — and it’s formatted so Copilot inside VS Code can immediately start generating schema files, TypeScript interfaces, JSON examples, and pipeline scaffolding.

---

# ⭐ The SubSage → VS Code Copilot Handoff Packet  
Paste this into your IDE so Copilot has the correct context.

---

## **1. Product Summary (for Copilot context)**  
SubSage is a privacy‑first subscription intelligence app.  
It does **not** link bank accounts, scrape data, or track usage.  
All intelligence is generated locally using a **public metadata bundle** hosted on GitHub Pages.

The app calculates a **Value Score** for each subscription based on:

- user‑provided qualitative inputs  
- metadata‑provided pricing, friction, seasonal patterns, and alternatives  
- internal weighting logic  

The app has two repos:

### **Repo 1 — Public Metadata Repo (GitHub Pages)**  
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
- GitHub Actions pipeline to validate + publish JSON bundle  

### **Repo 2 — Private App Repo**  
Contains:

- Value Score engine  
- Insight engine  
- metadata fetcher  
- caching logic  
- offline fallback bundle  
- UI components (Find by Category, Manual Entry, Value Score, Insights)  
- qualitative → numeric mapping  

---

## **2. Metadata Schema Requirements**  
Copilot should generate a schema with these top‑level objects:

### **Subscription Object**
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

### **Pricing Object**
- basePrice  
- tiers[]  
- regionSupport  
- billingCycle  
- notes  

### **Friction Object**
- cancellationDifficulty (1–5)  
- supportResponsiveness (1–5)  
- refundPolicy (enum)  
- notes  

### **Seasonal Object**
- highValueMonths[]  
- lowValueMonths[]  
- notes  

### **Alternatives Object**
- competitorId  
- priceComparison  
- featureComparison  
- notes  

### **InsightTriggers**
- overpricedThreshold  
- underusedThreshold  
- seasonalDropThreshold  
- frictionWarningThreshold  

### **Category Object**
- id  
- name  
- description  
- icon  

### **Value Score Weights**
- satisfactionWeight  
- relianceWeight  
- usageFrequencyWeight  
- priceSensitivityWeight  
- frictionWeight  
- seasonalWeight  
- alternativesWeight  

---

## **3. Metadata Pipeline Requirements**  
Copilot should generate:

### **GitHub Actions Workflow**
- validate JSON against schema  
- build metadata bundle  
- publish to GitHub Pages  
- version the bundle  
- generate fallback bundle for the app  

### **Validation**
- JSON Schema  
- TypeScript type guards  
- CI failure on invalid metadata  

### **Output**
- `/dist/metadata.json`  
- `/dist/version.json`  

---

## **4. App Logic Requirements (for later)**  
Copilot should know the app will:

### **Value Score Engine**
Convert qualitative inputs:

- Satisfaction (1–5 buttons)  
- Reliance (Low/Med/High)  
- Usage Frequency (dropdown)  
- Price Sensitivity (Low/Med/High)  
- Seasonal Value (Low/Med/High)

Into numeric values (0–100 scale internally).

### **Insight Engine**
Uses metadata + user inputs to generate:

- overpriced  
- underused  
- seasonal drop  
- friction warning  
- alternative suggestion  

### **Metadata Fetcher**
- fetch from GitHub Pages  
- cache locally  
- fallback to bundled metadata  
- version mismatch handling  

---

## **5. UI Summary (for Copilot context)**  
Copilot should understand the app has these screens:

### **Find by Category**
- category list  
- subscription list  
- metadata‑driven  

### **Manual Entry**
- satisfaction (1–5 buttons)  
- reliance (L/M/H)  
- usage frequency (dropdown)  
- price sensitivity (L/M/H)  
- seasonal value (L/M/H)  
- default values pre‑filled  

### **Value Score**
- score  
- factors  
- insights  
- “How this score is calculated” microcopy  

### **Insights**
- metadata‑powered explanations  
- recommendations  

---

# ⭐ Clean summary  
Paste the entire packet above into VS Code Copilot.  
It gives Copilot:

- the architecture  
- the metadata model  
- the Value Score logic  
- the insight logic  
- the repo structure  
- the pipeline requirements  
- the UI context  

This is the exact level of detail Copilot needs to begin generating:

- schema files  
- JSON examples  
- TypeScript interfaces  
- validation logic  
- GitHub Actions workflows  
- metadata ingestion code  
- Value Score engine scaffolding  

---

**Short takeaway:**  
You *can* hand off to VS Code Copilot now — but you need to give it a **structured, concise technical summary** of the product so it understands the architecture, the metadata model, and the Value Score logic. Below is the exact “handoff packet” you should paste into VS Code Copilot to give it full context.

This is written specifically for **your repos**, **your architecture**, and **your MVP design** — and it’s formatted so Copilot inside VS Code can immediately start generating schema files, TypeScript interfaces, JSON examples, and pipeline scaffolding.

---

# ⭐ The SubSage → VS Code Copilot Handoff Packet  
Paste this into your IDE so Copilot has the correct context.

---

## **1. Product Summary (for Copilot context)**  
SubSage is a privacy‑first subscription intelligence app.  
It does **not** link bank accounts, scrape data, or track usage.  
All intelligence is generated locally using a **public metadata bundle** hosted on GitHub Pages.

The app calculates a **Value Score** for each subscription based on:

- user‑provided qualitative inputs  
- metadata‑provided pricing, friction, seasonal patterns, and alternatives  
- internal weighting logic  

The app has two repos:

### **Repo 1 — Public Metadata Repo (GitHub Pages)**  
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
- GitHub Actions pipeline to validate + publish JSON bundle  

### **Repo 2 — Private App Repo**  
Contains:

- Value Score engine  
- Insight engine  
- metadata fetcher  
- caching logic  
- offline fallback bundle  
- UI components (Find by Category, Manual Entry, Value Score, Insights)  
- qualitative → numeric mapping  

---

## **2. Metadata Schema Requirements**  
Copilot should generate a schema with these top‑level objects:

### **Subscription Object**
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

### **Pricing Object**
- basePrice  
- tiers[]  
- regionSupport  
- billingCycle  
- notes  

### **Friction Object**
- cancellationDifficulty (1–5)  
- supportResponsiveness (1–5)  
- refundPolicy (enum)  
- notes  

### **Seasonal Object**
- highValueMonths[]  
- lowValueMonths[]  
- notes  

### **Alternatives Object**
- competitorId  
- priceComparison  
- featureComparison  
- notes  

### **InsightTriggers**
- overpricedThreshold  
- underusedThreshold  
- seasonalDropThreshold  
- frictionWarningThreshold  

### **Category Object**
- id  
- name  
- description  
- icon  

### **Value Score Weights**
- satisfactionWeight  
- relianceWeight  
- usageFrequencyWeight  
- priceSensitivityWeight  
- frictionWeight  
- seasonalWeight  
- alternativesWeight  

---

## **3. Metadata Pipeline Requirements**  
Copilot should generate:

### **GitHub Actions Workflow**
- validate JSON against schema  
- build metadata bundle  
- publish to GitHub Pages  
- version the bundle  
- generate fallback bundle for the app  

### **Validation**
- JSON Schema  
- TypeScript type guards  
- CI failure on invalid metadata  

### **Output**
- `/dist/metadata.json`  
- `/dist/version.json`  

---

## **4. App Logic Requirements (for later)**  
Copilot should know the app will:

### **Value Score Engine**
Convert qualitative inputs:

- Satisfaction (1–5 buttons)  
- Reliance (Low/Med/High)  
- Usage Frequency (dropdown)  
- Price Sensitivity (Low/Med/High)  
- Seasonal Value (Low/Med/High)

Into numeric values (0–100 scale internally).

### **Insight Engine**
Uses metadata + user inputs to generate:

- overpriced  
- underused  
- seasonal drop  
- friction warning  
- alternative suggestion  

### **Metadata Fetcher**
- fetch from GitHub Pages  
- cache locally  
- fallback to bundled metadata  
- version mismatch handling  

---

## **5. UI Summary (for Copilot context)**  
Copilot should understand the app has these screens:

### **Find by Category**
- category list  
- subscription list  
- metadata‑driven  

### **Manual Entry**
- satisfaction (1–5 buttons)  
- reliance (L/M/H)  
- usage frequency (dropdown)  
- price sensitivity (L/M/H)  
- seasonal value (L/M/H)  
- default values pre‑filled  

### **Value Score**
- score  
- factors  
- insights  
- “How this score is calculated” microcopy  

### **Insights**
- metadata‑powered explanations  
- recommendations  

---

# ⭐ Clean summary  
Paste the entire packet above into VS Code Copilot.  
It gives Copilot:

- the architecture  
- the metadata model  
- the Value Score logic  
- the insight logic  
- the repo structure  
- the pipeline requirements  
- the UI context  

This is the exact level of detail Copilot needs to begin generating:

- schema files  
- JSON examples  
- TypeScript interfaces  
- validation logic  
- GitHub Actions workflows  
- metadata ingestion code  
- Value Score engine scaffolding  

---