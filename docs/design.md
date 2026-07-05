# Flowcelerate — Site Design Document

Independent ServiceNow consulting and architecture practice for insurance, reinsurance, and financial services.

---

## Brand Identity

| Element | Value |
|---------|-------|
| Brand name | Flowcelerate |
| Tagline | ServiceNow Architecture Built for Insurance & Financial Services |
| Practitioner | [Your Name], ServiceNow CTA |
| Target market | Insurance carriers, Lloyd's syndicates/managing agents, global reinsurers, FS enterprises |
| Tone | Senior, precise, credible — restrained, not startup-flashy |

---

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Astro 5 | Zero-JS by default, content collections, excellent SEO |
| Styling | Tailwind CSS v4 (Vite plugin) | Utility-first, @theme for custom design tokens |
| Content | Astro Content Collections | Type-safe blog with Zod schema |
| Sitemap | @astrojs/sitemap | Auto-generated on build |
| RSS | @astrojs/rss | Feed at /rss.xml |
| Booking | Calendly | Inline widget + floating badge |
| Fonts | Google Fonts (Syne + DM Sans) | Loaded via @import in global.css |

---

## Design System

### Colours

```
Navy 900:   #0a1628  (dark backgrounds, hero)
Navy 800:   #0f2040  (credential strip)
Accent:     #2563eb  (blue-600 — CTAs, links, highlights)
Accent dark:#1d4ed8  (hover states)
Accent 50:  #eff6ff  (subtle tint backgrounds)
Teal:       #0d9488  (secondary accent, checkmarks)
Teal light: #14b8a6  (badge dots, hero accents)
Text:       #1e293b  (slate-800)
Muted:      #64748b  (slate-500)
Border:     #e2e8f0  (slate-200)
Surface:    #f8fafc  (slate-50)
```

### Typography

- **Display / Headings**: Syne (700/800 weight) — geometric, architectural, distinctive
- **Body**: DM Sans (300/400/500/600 weight) — crisp, highly readable
- **Mono**: JetBrains Mono — code snippets

### Spacing & Layout

- Max content width: `max-w-7xl` (1280px)
- Section padding: `py-20` (80px) vertical, `px-4 sm:px-6 lg:px-8` horizontal
- Page hero: `py-20 sm:py-28 lg:py-32`
- Grid: 4-col services, 2-col blog, 3-col case study outcomes

---

## Site Architecture

### URL Routes

```
/                          Home
/services                  Services overview
/services/itsm             ITSM Transformation
/services/sam-pro          SAM Pro
/services/cmdb-csdm        CMDB / CSDM
/services/ai-architecture  AI & Agentic Architecture
/about                     About
/case-studies              Case Studies (3 anonymised)
/insights                  Blog index (with tag filter)
/insights/[slug]           Blog post
/contact                   Contact (form + Calendly inline)
/book                      Dedicated booking page
/rss.xml                   RSS feed
/sitemap-index.xml         Auto-generated sitemap
/robots.txt                robots.txt
```

### Project Folder Tree

```
flowcelerate/
├── docs/
│   ├── design.md              ← This file — solution overview & deployment guide
│   └── technical.md           ← Component API, architecture decisions, integration specs
├── public/
│   ├── favicon.svg            ← Custom diamond-mark logo
│   ├── favicon.ico            ← Default Astro fallback (replace if needed)
│   └── robots.txt             ← Allow all, sitemap pointer
├── src/
│   ├── components/
│   │   ├── CalendlyInline.astro   ← Inline booking widget (<CalendlyInline url minHeight />)
│   │   ├── CTASection.astro       ← Full-width CTA band (dark/light/accent variants)
│   │   ├── Footer.astro           ← Brand, nav links, social, RSS
│   │   ├── Header.astro           ← Fixed nav with mobile menu + CTA button
│   │   ├── Hero.astro             ← Dark/light hero with badge, headline, CTAs
│   │   ├── PostCard.astro         ← Blog card with stretched-link accessibility
│   │   └── ServiceCard.astro      ← Service card with icon, tags, hover state
│   ├── content/
│   │   └── blog/
│   │       ├── csdm-for-insurance-carriers.md
│   │       └── flow-designer-ai-automation-reinsurance.md
│   ├── content.config.ts          ← Astro v5 content collection (glob loader + Zod schema)
│   ├── layouts/
│   │   └── Layout.astro           ← Base HTML, SEO/OG meta, Calendly scripts (once), Header, Footer
│   ├── pages/
│   │   ├── index.astro            ← Home
│   │   ├── about.astro
│   │   ├── book.astro             ← Dedicated Calendly booking page
│   │   ├── contact.astro          ← Form + Calendly inline
│   │   ├── rss.xml.ts             ← RSS feed generator
│   │   ├── case-studies/
│   │   │   └── index.astro
│   │   ├── insights/
│   │   │   ├── index.astro        ← Blog index with tag filtering
│   │   │   └── [slug].astro       ← Dynamic blog post template
│   │   └── services/
│   │       ├── index.astro
│   │       ├── itsm.astro
│   │       ├── sam-pro.astro
│   │       ├── cmdb-csdm.astro
│   │       └── ai-architecture.astro
│   └── styles/
│       └── global.css             ← Google Fonts @import, Tailwind @import, @theme tokens, animations
├── astro.config.mjs               ← site URL, Tailwind Vite plugin, sitemap integration
├── package.json
└── tsconfig.json
```

---

## Component Inventory

| Component | Props | Purpose |
|-----------|-------|---------|
| `Layout.astro` | title, description, image, canonicalURL, noIndex | Base HTML, SEO meta, OG tags, Calendly script (once), Header, Footer |
| `Header.astro` | — | Fixed nav, mobile menu, CTA button |
| `Footer.astro` | — | Brand, services links, company links, social, RSS |
| `Hero.astro` | badge, headline, subheadline, ctaPrimary, ctaSecondary, variant | Dark or light hero section |
| `ServiceCard.astro` | title, description, href, icon, tags | Clickable service card with hover state |
| `CTASection.astro` | headline, body, ctaLabel, ctaHref, secondaryLabel, secondaryHref, variant | Full-width CTA band |
| `PostCard.astro` | title, description, pubDate, slug, tags, readingTime | Blog post card |
| `CalendlyInline.astro` | url, minHeight | Calendly inline embed widget |

---

## Content Collections — Blog Schema

```typescript
schema: z.object({
  title: z.string(),
  description: z.string(),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  tags: z.array(z.string()).default([]),
  readingTime: z.number().optional(),
  draft: z.boolean().default(false),
})
```

Blog posts live in `src/content/blog/*.md`.

---

## Calendly Integration

Calendly is loaded **once** in `Layout.astro` `<head>`:

1. **Stylesheet** — loaded with `media="print" onload="this.media='all'"` for non-blocking CSS
2. **Script** — `async defer` for non-blocking JS

### Components

| Location | Mechanism | Config |
|----------|-----------|--------|
| `Layout.astro` | `initBadgeWidget` on `window load` | Floating "Book a call" button, accent colour `#2563eb` |
| `<CalendlyInline />` | `initInlineWidget` on script load | `data-url` attribute, graceful fallback if JS disabled |
| `/contact` | `<CalendlyInline minHeight="600px" />` | Embedded in right column |
| `/book` | `<CalendlyInline minHeight="750px" />` | Full-width booking page |

### URL to Replace

```
https://calendly.com/YOUR-LINK/consult
```

Query params applied: `hide_gdpr_banner=1`, `hide_event_type_details=1`

### Security Note on SRI

Calendly's CDN scripts are versioned internally and rotated on each deploy. Pinning an SRI hash would break the widget on their next release. The correct mitigation is a **Content Security Policy** (CSP) that restricts script sources to `assets.calendly.com`:

```
Content-Security-Policy: script-src 'self' assets.calendly.com; frame-src calendly.com;
```

Add this in your hosting provider's response headers (Netlify `_headers`, Vercel `vercel.json`, Cloudflare Pages, etc.).

---

## SEO

- Per-page `<title>`, `<meta name="description">`, `<link rel="canonical">`
- Open Graph: `og:type`, `og:url`, `og:title`, `og:description`, `og:image`, `og:site_name`
- Twitter Card: `summary_large_image`
- Sitemap auto-generated to `/sitemap-index.xml` (requires `site` set in `astro.config.mjs`)
- `robots.txt` at `/robots.txt`
- Semantic HTML throughout: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`
- ARIA labels on nav, forms, icons
- `aria-current="page"` on active nav items
- Screen-reader-only headings where needed (`sr-only`)

---

## Accessibility

Target: WCAG 2.1 AA

- Semantic HTML structure
- All interactive elements keyboard-navigable
- Focus-visible ring on all interactive elements (Tailwind `focus:outline-none focus:ring-2`)
- Images/icons marked `aria-hidden="true"` or have descriptive `alt`
- Form fields have associated `<label>` elements
- Mobile menu toggle has `aria-expanded` and `aria-controls`
- Colour contrast: navy-on-white and white-on-navy both exceed 7:1 (AAA)
- Decorative backgrounds marked `pointer-events-none aria-hidden="true"`

---

## How to Run Locally

```bash
cd /Users/gundeep/Documents/flowcelerate
npm run dev
```

Opens at `http://localhost:4321`

### Build & Preview

```bash
npm run build      # builds to dist/
npm run preview    # serves the build locally
```

---

## How to Add a New Blog Post

1. Create a new file in `src/content/blog/`:

   ```
   src/content/blog/your-slug-here.md
   ```

2. Add the frontmatter:

   ```markdown
   ---
   title: "Your Post Title"
   description: "One or two sentence summary for the index and SEO meta."
   pubDate: 2025-06-01
   tags: ["CMDB", "Insurance"]
   readingTime: 7
   draft: false
   ---

   Your content in Markdown...
   ```

3. Write the post body in Markdown. The file name becomes the URL slug:
   - `src/content/blog/my-post.md` → `/insights/my-post`

4. Set `draft: true` to hide a post from the index while editing.

5. Save the file — the dev server hot-reloads automatically.

---

## Required Replacements Before Going Live

| Placeholder | File(s) | Replace With |
|-------------|---------|--------------|
| `https://calendly.com/YOUR-LINK/consult` | `src/layouts/Layout.astro`, `src/components/CalendlyInline.astro` | Your real Calendly scheduling link |
| `[Your Name]` | `src/pages/about.astro`, `src/pages/insights/[slug].astro` | Your full name |
| `[Your Name], CTA` | `src/layouts/Footer.astro` | Your name and credentials |
| `https://linkedin.com/in/YOUR-PROFILE` | `src/layouts/Footer.astro`, `src/pages/contact.astro` | Your LinkedIn profile URL |
| `https://flowcelerate.com` | `astro.config.mjs` → `site:` | Your live domain |
| `[year]` (CTA cert) | `src/pages/about.astro` | Year you earned CTA |
| `public/og-default.png` | *(file to create)* | 1200×630px Open Graph image |

---

## Deployment Checklist

### Content & Branding
- [ ] Replace all placeholders from the table above
- [ ] Add your photo to `public/` and update `about.astro` (replace the placeholder avatar div)
- [ ] Review and personalise the bio text in `about.astro`
- [ ] Add your real CTA certification year

### Technical
- [ ] Update `site:` in `astro.config.mjs` to your live domain (required for sitemap + canonical URLs)
- [ ] Add `public/og-default.png` — 1200×630px, shows in link previews on LinkedIn/Slack/email
- [ ] Run `npm run build` and verify zero errors before deploying

### SEO & Indexing
- [ ] Verify sitemap at `yourdomain.com/sitemap-index.xml` after first deploy
- [ ] Submit sitemap to Google Search Console
- [ ] Verify `robots.txt` is accessible at `yourdomain.com/robots.txt`
- [ ] Check Open Graph tags with [opengraph.xyz](https://www.opengraph.xyz) or LinkedIn Post Inspector

### Security
- [ ] Configure CSP response headers at your hosting provider:
  ```
  Content-Security-Policy: script-src 'self' assets.calendly.com; frame-src calendly.com;
  ```
  - Netlify: add to `public/_headers`
  - Vercel: add to `vercel.json` under `headers`
  - Cloudflare Pages: add via Transform Rules
- [ ] Confirm contact form submission endpoint (the form currently posts to `/contact/success` — wire up Netlify Forms, Formspree, or equivalent)

### Hosting Options

The site outputs pure static HTML to `dist/` and works on any static host:

| Provider | Deploy Command | Notes |
|----------|---------------|-------|
| Netlify | `npm run build`, publish `dist/` | Easiest for CSP headers via `_headers` file |
| Vercel | `npm run build`, publish `dist/` | Use `vercel.json` for headers |
| Cloudflare Pages | Auto-detect Astro | Good edge performance |
| GitHub Pages | Push `dist/` to `gh-pages` branch | Requires custom domain for canonical URLs |

---

*Generated by Flowcelerate project setup · Last updated 2026-05-28*
