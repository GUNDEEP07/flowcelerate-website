# Flowcelerate — Project Status

**Last updated:** 2026-05-28  
**Stack:** Astro 5 · Tailwind CSS v4 · Netlify Functions · Claude API · AWS (SES, S3, DynamoDB)

---

## What Has Been Built

### 1. Full Marketing Website (Complete)

**13 static pages, built and serving:**

| Page | URL | Status |
|------|-----|--------|
| Home | `/` | ✅ Live |
| Services Overview | `/services` | ✅ Live |
| ITSM Transformation | `/services/itsm` | ✅ Live |
| SAM Pro | `/services/sam-pro` | ✅ Live |
| CMDB / CSDM | `/services/cmdb-csdm` | ✅ Live |
| AI & Agentic Architecture | `/services/ai-architecture` | ✅ Live |
| About | `/about` | ✅ Live |
| Case Studies (3 anonymised) | `/case-studies` | ✅ Live |
| Insights (blog index) | `/insights` | ✅ Live |
| Blog post — CSDM for insurance | `/insights/csdm-for-insurance-carriers` | ✅ Live |
| Blog post — Flow Designer AI | `/insights/flow-designer-ai-automation-reinsurance` | ✅ Live |
| Contact | `/contact` | ✅ Live |
| Book a consultation | `/book` | ✅ Live |

**Auto-generated:**
- `/sitemap-index.xml` — via `@astrojs/sitemap`
- `/rss.xml` — via `@astrojs/rss`
- `/robots.txt` — static

### 2. Design System

**Fonts:** Syne (display/headings, 700/800) + DM Sans (body, 300–600) + JetBrains Mono  
**Loaded:** Google Fonts via `@import` in `src/styles/global.css` — preconnect tags in Layout head

**Colour tokens (Tailwind `@theme`):**
```
navy-900: #0a1628   — hero backgrounds, nav
navy-800: #0f2040   — credential strips
accent:   #2563eb   — CTAs, links, active states
accent-dark: #1d4ed8 — hover
accent-50: #eff6ff  — tint backgrounds
teal:     #0d9488   — secondary accent, checkmarks
teal-light: #14b8a6 — badge dots
```

**Animations:** `.fade-up` + `.stagger-1` through `.stagger-5` — CSS keyframes, no JS

### 3. Reusable Components

| Component | File | Purpose |
|-----------|------|---------|
| Layout | `src/layouts/Layout.astro` | Base HTML, SEO/OG meta, fonts, Calendly, ChatWidget |
| Header | `src/components/Header.astro` | Fixed nav, mobile menu, CTA button |
| Footer | `src/components/Footer.astro` | Brand, nav links, social, RSS |
| Hero | `src/components/Hero.astro` | Dark/light hero — badge, headline, subheadline, CTAs |
| ServiceCard | `src/components/ServiceCard.astro` | Clickable card with icon, tags, hover state |
| CTASection | `src/components/CTASection.astro` | Full-width CTA band (dark/light/accent variants) |
| PostCard | `src/components/PostCard.astro` | Blog post card with stretched-link |
| CalendlyInline | `src/components/CalendlyInline.astro` | Calendly inline embed widget |
| ChatWidget | `src/components/ChatWidget.astro` | AI chat (Aria) — floating bottom-left |

### 4. Content Collections

**Blog** (`src/content/blog/*.md`) — Astro v5 glob loader:
```typescript
{ title, description, pubDate, updatedDate?, tags[], readingTime?, draft }
```
- 2 sample posts published

### 5. Calendly Integration

**Loaded once in `Layout.astro` head** (non-blocking CSS + async/defer JS):
- Floating badge widget (bottom-right, site-wide) — `initBadgeWidget` on `window load`
- Inline widget component (`CalendlyInline.astro`) — used on `/contact` and `/book`
- URL placeholder: `https://calendly.com/YOUR-LINK/consult`

**To replace:** Update the URL in `src/layouts/Layout.astro` and `src/components/CalendlyInline.astro`

### 6. AI Chat Widget — "Aria" (Built, needs API key)

**Architecture:** Browser → `/.netlify/functions/chat` → Claude `claude-opus-4-7`

| File | Purpose |
|------|---------|
| `netlify/functions/chat.ts` | Serverless function, calls Anthropic API |
| `src/components/ChatWidget.astro` | Floating chat UI, bottom-left |
| `netlify.toml` | Netlify build config + dev proxy |
| `.env` | `ANTHROPIC_API_KEY` (placeholder — fill in) |

**Conversation flow:**
1. Welcome question (no API call)
2. Claude qualifies the visitor — ServiceNow challenge, industry, regulatory context
3. After 3 exchanges → contact capture card
4. "Book a discovery call" CTA always visible

**To activate:** Add real `ANTHROPIC_API_KEY` to `.env` and Netlify environment variables

### 7. SEO

- Per-page `<title>`, `<meta description>`, `<link rel="canonical">`
- Full Open Graph block on every page
- Twitter Card (`summary_large_image`)
- Semantic HTML: `<header>`, `<nav>`, `<main>`, `<section aria-labelledby>`, `<article>`, `<footer>`
- `aria-current="page"` on active nav items
- `robots.txt` + auto-generated sitemap

### 8. Dev & Build Setup

```bash
# Standard dev (no chat function)
npm run dev        # http://localhost:4321

# Full dev with chat + subscribe functions
netlify dev        # http://localhost:8888

# Production build
npm run build      # outputs to dist/
npm run preview    # serve the build locally
```

**Node:** 25.9.0 · **npm:** 11.12.1 · **Astro:** 6.3.8

---

## What Is Being Built Next

### Training Section — Phase 1 (Plan written, ready to build)

**Plan:** `docs/superpowers/plans/2026-05-28-training-phase1.md`  
**Spec:** `docs/superpowers/specs/2026-05-28-training-community-design.md`

**Phase 1 deliverables:**

| Item | Status |
|------|--------|
| `workshops` + `playbooks` content collections | 🔲 To build |
| 3 sample playbooks (2 practitioner, 1 leadership) | 🔲 To build |
| 2 sample workshops | 🔲 To build |
| `TrackCard`, `PlaybookCard`, `WorkshopCard` components | 🔲 To build |
| `PlaybookGate` component (email gate form) | 🔲 To build |
| `NewsletterSignup` component | 🔲 To build |
| `/training` landing page | 🔲 To build |
| `/training/practitioners` + `/training/leaders` | 🔲 To build |
| `/training/playbooks` index + `[slug]` detail | 🔲 To build |
| `/training/workshops` index + `[slug]` detail | 🔲 To build |
| `netlify/functions/subscribe.ts` (AWS SES + S3 + DynamoDB) | 🔲 To build |
| Header + Footer updated with Training links | 🔲 To build |

**AWS infrastructure required (manual setup in AWS Console):**
- S3 bucket: `flowcelerate-playbooks` (private)
- SES domain verification for `flowcelerate.com`
- DynamoDB table: `flowcelerate-subscribers`
- IAM user: `flowcelerate-netlify-functions` (least-privilege)

---

## Pending Replacements (Before Going Live)

| Placeholder | File(s) | Replace with |
|------------|---------|--------------|
| `https://calendly.com/YOUR-LINK/consult` | `Layout.astro`, `CalendlyInline.astro` | Real Calendly URL |
| `[Your Name]` | `about.astro`, `insights/[slug].astro` | Your name |
| `[Your Name], CTA` | `Footer.astro` | Your name + credentials |
| `https://linkedin.com/in/YOUR-PROFILE` | `Footer.astro`, `contact.astro` | Your LinkedIn URL |
| `https://flowcelerate.com` | `astro.config.mjs` `site:` | Live domain |
| `[year]` (CTA cert) | `about.astro` | Year you earned CTA |
| `ANTHROPIC_API_KEY` | `.env` + Netlify env vars | Real API key |

---

## Folder Structure

```
flowcelerate/
├── docs/
│   ├── design.md                          ← Solution overview + deployment checklist
│   ├── technical.md                       ← Full technical reference
│   ├── project-status.md                  ← This file
│   └── superpowers/
│       ├── specs/
│       │   └── 2026-05-28-training-community-design.md
│       └── plans/
│           └── 2026-05-28-training-phase1.md
├── netlify/
│   └── functions/
│       └── chat.ts                        ← AI chat function (Claude API)
├── public/
│   ├── favicon.svg
│   └── robots.txt
├── src/
│   ├── components/                        ← 9 reusable components
│   ├── content/
│   │   └── blog/                         ← 2 published posts
│   ├── content.config.ts                  ← Blog collection schema
│   ├── layouts/Layout.astro
│   ├── pages/                             ← 13 pages across 5 sections
│   └── styles/global.css
├── astro.config.mjs
├── netlify.toml
├── package.json
└── .env                                   ← API keys (gitignored)
```

---

## Community — Planned (Phases 2–4)

| Phase | Feature | Trigger |
|-------|---------|---------|
| 2 | Giscus comments on blog posts | 200+ newsletter subscribers |
| 2 | LinkedIn newsletter (mirrors email) | After Phase 1 launch |
| 3 | Circle.so alumni community | 30+ workshop graduates |
| 4 | Video courses on Teachable/Podia | After first workshop cycle |
