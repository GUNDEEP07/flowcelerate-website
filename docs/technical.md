# Flowcelerate — Technical Reference

Complete technical documentation covering component APIs, architecture decisions, integration specs, CSS design tokens, content schema, build pipeline, and security.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Component API Reference](#2-component-api-reference)
3. [CSS & Design Token System](#3-css--design-token-system)
4. [Content Collections](#4-content-collections)
5. [Calendly Integration](#5-calendly-integration)
6. [AI Chat Widget (Aria)](#6-ai-chat-widget-aria)
7. [SEO Implementation](#7-seo-implementation)
8. [Accessibility Implementation](#8-accessibility-implementation)
9. [Build Pipeline](#9-build-pipeline)
10. [Performance](#10-performance)
11. [Security](#11-security)
12. [Known Limitations & Future Work](#12-known-limitations--future-work)

---

## 1. Architecture Overview

### Framework: Astro 5 (Static Output)

Astro renders every page to static HTML at build time. No JavaScript is sent to the browser unless a component explicitly opts in via `<script>` tags or client directives. This gives:

- **First Contentful Paint** in the 0.5–1.2s range on a CDN
- **No hydration cost** for server-rendered components
- **Zero runtime framework overhead** (no React, Vue, or similar shipped by default)

The only JavaScript shipped is:
- Mobile menu toggle (inline `<script>` in `Header.astro`, ~400 bytes)
- Calendly widget initialisation (inline `<script>` tags in `Layout.astro` and `CalendlyInline.astro`)
- The Calendly widget itself (~85KB, loaded async/defer from their CDN)

### Data Flow

```
src/content/blog/*.md
        │
        ▼ (getCollection at build time)
src/pages/insights/index.astro   → /insights/index.html
src/pages/insights/[slug].astro  → /insights/{slug}/index.html
src/pages/index.astro            → /index.html (recent posts)
src/pages/rss.xml.ts             → /rss.xml
        │
        ▼ (Astro Content + Zod validation)
src/content.config.ts            ← schema enforcement
```

### Page Rendering Pattern

Every page follows the same structure:

```
Layout.astro (HTML shell + SEO + Calendly scripts)
  └── Header.astro (fixed nav)
  └── <slot /> (page-specific content)
      ├── Hero section (dark navy bg)
      ├── Content sections (alternating white / slate-50)
      └── CTASection.astro (dark navy bg)
  └── Footer.astro
```

### Astro v5 — Key Changes from v4

This project targets Astro 5. Key differences relevant to this codebase:

| Area | v4 | v5 (this project) |
|------|----|-------------------|
| Content config location | `src/content/config.ts` | `src/content.config.ts` |
| Collection entry ID | `entry.slug` | `entry.id` |
| Collection definition | `type: 'content'` | `loader: glob({ pattern, base })` |
| CSS import order | flexible | Google Fonts `@import` must precede `@import "tailwindcss"` |

---

## 2. Component API Reference

### `Layout.astro`

Base HTML shell. Used on every page. Loads global styles, fonts, Calendly scripts, and wraps content with `Header` and `Footer`.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | required | Page title. If it doesn't include "Flowcelerate", the site name is appended automatically. |
| `description` | `string` | Practice description | `<meta name="description">` and OG description. |
| `image` | `string` | `'/og-default.png'` | OG image path (relative to site root). |
| `canonicalURL` | `string` | Current page URL | Overrides the auto-derived canonical URL. |
| `noIndex` | `boolean` | `false` | Set `true` to emit `<meta name="robots" content="noindex,nofollow">`. |

**Usage:**
```astro
---
import Layout from '../layouts/Layout.astro';
---
<Layout
  title="Page Title"
  description="Page-specific description for SEO."
>
  <!-- page content -->
</Layout>
```

**What it emits in `<head>`:**
- `<title>`, `<meta name="description">`, `<link rel="canonical">`
- Full Open Graph block (type, url, title, description, image, site_name)
- Twitter Card (summary_large_image)
- `<link rel="icon">` pointing to `/favicon.svg`
- `<link rel="preconnect">` for Google Fonts (speeds up font loading)
- Calendly stylesheet (non-blocking, media=print trick)
- Calendly script (async + defer)
- Calendly badge widget init (runs on `window load`)

---

### `Header.astro`

Fixed top navigation bar. No props. Reads `Astro.url.pathname` to set active states.

**Behaviour:**
- Fixed at `top: 0`, `z-index: 50`, white/95 background with backdrop blur
- Active link: `text-accent bg-accent-50`, `aria-current="page"`
- Mobile: hamburger toggles a vertical nav drawer below the bar
- CTA button links to `/book`
- A `<div class="h-16">` spacer is rendered after the `<header>` to prevent content from sitting under it

**Mobile menu JS** (inline, no framework):
```js
btn.addEventListener('click', () => {
  menu.classList.toggle('hidden');
  btn.setAttribute('aria-expanded', ...);
  menuIcon.classList.toggle('hidden', isOpen);
  closeIcon.classList.toggle('hidden', !isOpen);
});
```

---

### `Footer.astro`

Full-width dark navy footer. No props. Contains brand mark, services links, company links, LinkedIn, and RSS.

**To update links:** Edit the `services` and `company` arrays in the component frontmatter.

---

### `Hero.astro`

Page hero section. Supports dark navy and light white variants.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `badge` | `string` | `undefined` | Small pill above the headline (e.g. "ServiceNow CTA"). |
| `headline` | `string` | required | Main `<h1>` text. Also available as named slot `<Fragment slot="headline">` for HTML inside the heading. |
| `subheadline` | `string` | `undefined` | Body text below the headline. |
| `ctaPrimary` | `{ href: string; label: string }` | `undefined` | Primary button (solid accent). |
| `ctaSecondary` | `{ href: string; label: string }` | `undefined` | Secondary button (outlined). |
| `variant` | `'dark' \| 'light'` | `'dark'` | Dark navy bg or white bg. |

**Usage:**
```astro
<Hero
  badge="ServiceNow Certified Technical Architect"
  headline="ServiceNow Architecture for Insurance & Financial Services"
  subheadline="Independent consulting from a CTA with 10+ years..."
  ctaPrimary={{ href: '/book', label: 'Book a Discovery Call' }}
  ctaSecondary={{ href: '/services', label: 'View Services' }}
  variant="dark"
/>
```

**Background effects (dark variant only):**
- `grid-dots` utility — radial-gradient dot pattern at 28px grid
- Accent radial gradient blob (blue, top-right, subtle)
- Both are `aria-hidden="true"` and `pointer-events-none`

**Animations:** `fade-up` class with `.stagger-1` through `.stagger-5` delays (CSS keyframe, no JS).

---

### `ServiceCard.astro`

Clickable card linking to an individual service page.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | required | Service name. |
| `description` | `string` | required | 1–2 sentence summary. |
| `href` | `string` | required | Link destination. |
| `icon` | `string` | required | Emoji or SVG string rendered in the icon box. |
| `tags` | `string[]` | `[]` | Pill tags shown below the description. |

**Hover state:** border colour shifts to `accent/40`, box shadow appears, icon box fills with accent blue, title shifts to accent colour.

---

### `CTASection.astro`

Full-width call-to-action band. Appears at the bottom of most pages.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `headline` | `string` | "Ready to move the needle..." | Section heading. |
| `body` | `string` | Discovery call description | Body paragraph. |
| `ctaLabel` | `string` | `'Book a Discovery Call'` | Primary button label. |
| `ctaHref` | `string` | `'/book'` | Primary button destination. |
| `secondaryLabel` | `string` | `'View Services'` | Secondary button label. |
| `secondaryHref` | `string` | `'/services'` | Secondary button destination. |
| `variant` | `'dark' \| 'light' \| 'accent'` | `'dark'` | Background and text colour scheme. |

---

### `PostCard.astro`

Blog post card. Used on the home page and the Insights index.

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | required | Post title. |
| `description` | `string` | required | Short description. |
| `pubDate` | `Date` | required | Publication date. |
| `slug` | `string` | required | Post ID/slug for the link URL. |
| `tags` | `string[]` | `[]` | Tag pills (accent-coloured). |
| `readingTime` | `number` | `undefined` | Minutes. Shown in the meta footer. |

**Stretched link:** The `<h3>` `<a>` uses `::after { position: absolute; inset: 0 }` so the entire card surface is clickable while the `<article>` is `position: relative`. Screen readers see only the link text.

---

### `CalendlyInline.astro`

Renders a Calendly inline scheduling widget. Requires the Calendly script to be loaded (done once in `Layout.astro`).

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `url` | `string` | `'https://calendly.com/YOUR-LINK/consult?hide_gdpr_banner=1&hide_event_type_details=1'` | Full Calendly URL including query params. |
| `minHeight` | `string` | `'700px'` | CSS min-height of the widget container. |

**How it works:**
1. Renders a `<div class="calendly-inline-widget" data-url="...">` container
2. An inline `<script>` calls `Calendly.initInlineWidget()` if the Calendly global is available, or attaches a `load` listener to the script tag if it hasn't finished loading yet
3. The `<noscript>` fallback provides a direct link for JS-disabled users

**Usage:**
```astro
---
import CalendlyInline from '../components/CalendlyInline.astro';
---
<CalendlyInline
  url="https://calendly.com/your-username/consult?hide_gdpr_banner=1"
  minHeight="650px"
/>
```

---

## 3. CSS & Design Token System

### File: `src/styles/global.css`

Imported once in `Layout.astro`. Uses Tailwind v4's `@theme` directive for custom tokens.

**Import order (critical):**
```css
/* 1. External @imports must come first */
@import url('https://fonts.googleapis.com/...');

/* 2. Tailwind base */
@import "tailwindcss";

/* 3. Custom theme tokens */
@theme { ... }

/* 4. Layer overrides */
@layer base { ... }
@layer utilities { ... }
```

### Custom Colour Tokens (`@theme`)

These become Tailwind utility classes automatically (e.g. `bg-navy-900`, `text-accent`):

```css
@theme {
  /* Navy palette */
  --color-navy-950: #060d1a;
  --color-navy-900: #0a1628;   /* hero backgrounds */
  --color-navy-800: #0f2040;   /* credential strip */
  --color-navy-700: #152a55;
  --color-navy-600: #1a3468;

  /* Accent blue */
  --color-accent: #2563eb;      /* CTA buttons, active nav, links */
  --color-accent-light: #3b82f6;
  --color-accent-dark: #1d4ed8; /* hover states */
  --color-accent-50: #eff6ff;   /* subtle tint backgrounds */
  --color-accent-100: #dbeafe;

  /* Teal (secondary accent) */
  --color-teal: #0d9488;        /* checkmarks, tag dots */
  --color-teal-light: #14b8a6;  /* hero badge accents */
  --color-teal-dark: #0f766e;

  /* Font families */
  --font-sans: 'DM Sans', system-ui, sans-serif;
  --font-display: 'Syne', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

### Custom Utilities

| Class | Effect |
|-------|--------|
| `.text-balance` | `text-wrap: balance` — prevents widows in headings |
| `.grid-dots` | Radial-gradient dot pattern background (dark sections) |
| `.fade-up` | Opacity 0 → 1, translateY 20px → 0, 0.6s ease |
| `.stagger-1` through `.stagger-5` | Animation delay 0.1s … 0.5s |

### Font Usage

| Font | Weight | Use |
|------|--------|-----|
| Syne | 700, 800 | All headings (`font-display`) |
| DM Sans | 300, 400, 500, 600 | All body copy, UI text (`font-sans`) |
| JetBrains Mono | 400, 500 | Code blocks, architecture diagram labels |

Applied globally via `@layer base`:
```css
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display);
  letter-spacing: -0.02em;
}
```

---

## 4. Content Collections

### Schema (`src/content.config.ts`)

```typescript
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),        // accepts "2025-04-15" strings
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    readingTime: z.number().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
```

### Querying Posts

```typescript
import { getCollection } from 'astro:content';

// All published posts, newest first
const posts = (await getCollection('blog', ({ data }) => !data.draft))
  .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

// Access entry fields
post.id          // filename without extension → URL slug
post.data.title  // validated frontmatter
post.data.tags   // string[]
```

> **Astro v5 note:** Use `entry.id` (not `entry.slug`) when constructing URLs. The `id` is the filename without extension, relative to the `base` directory defined in the glob loader.

### Rendering Post Content

```typescript
import { render } from 'astro:content';

const { Content } = await render(post);
// Then in template:
// <Content />
```

### Draft Workflow

Set `draft: true` in frontmatter to hide a post from all collections queries (index, home page, RSS). The post still builds to a static file if you navigate directly, but it won't appear in any listing.

---

## 5. Calendly Integration

### Loading Strategy

Calendly resources are loaded **once** in `Layout.astro` `<head>` and shared across all pages and component instances:

```html
<!-- Non-blocking CSS: loads async via print/all media swap -->
<link
  rel="stylesheet"
  href="https://assets.calendly.com/assets/external/widget.css"
  media="print"
  onload="this.media='all'"
/>

<!-- Non-blocking JS: async + defer -->
<script
  src="https://assets.calendly.com/assets/external/widget.js"
  type="text/javascript"
  async
  defer
></script>
```

The `media="print"` trick ensures the stylesheet doesn't block rendering. The browser loads it in the background and swaps it to `media="all"` when done.

### Badge Widget (Floating Button)

Initialised in `Layout.astro` on `window load`:

```js
window.addEventListener('load', function() {
  if (typeof Calendly !== 'undefined') {
    Calendly.initBadgeWidget({
      url: 'https://calendly.com/YOUR-LINK/consult?hide_gdpr_banner=1',
      text: 'Book a call',
      color: '#2563eb',    // matches --color-accent
      textColor: '#ffffff',
    });
  }
});
```

The badge renders a fixed-position floating button in the bottom-right corner of every page. It opens Calendly in a modal overlay.

### Inline Widget (`CalendlyInline.astro`)

Uses `Calendly.initInlineWidget()` to embed the scheduler directly in the page:

```js
Calendly.initInlineWidget({
  url: el.dataset.url,
  parentElement: el,
  prefill: {},
  utm: {},
});
```

The script defensively handles the case where the Calendly global hasn't loaded yet by attaching a `load` listener to the script element.

### URL Query Parameters

| Parameter | Value | Effect |
|-----------|-------|--------|
| `hide_gdpr_banner` | `1` | Suppresses Calendly's cookie consent banner |
| `hide_event_type_details` | `1` | Hides the event type header in the inline widget |

### Where Calendly Appears

| Page | Component | Config |
|------|-----------|--------|
| All pages | Badge widget | Floating button, bottom-right |
| `/contact` | `<CalendlyInline minHeight="600px">` | Right column of contact grid |
| `/book` | `<CalendlyInline minHeight="750px">` | Full-width section |

---

## 6. AI Chat Widget (Aria)

### Overview

A floating AI chat assistant (named Aria) powered by Claude via a Netlify serverless function. Positioned bottom-left to avoid the Calendly badge (bottom-right). Zero-JS until the user opens the widget.

### Architecture

```
Browser (ChatWidget.astro)
  └── fetch POST /.netlify/functions/chat
        └── netlify/functions/chat.ts
              └── @anthropic-ai/sdk → claude-opus-4-7
```

The Astro site remains fully static. The function runs as a Netlify serverless function alongside the static output.

### Files

| File | Purpose |
|------|---------|
| `netlify/functions/chat.ts` | Serverless function: accepts messages array, calls Claude, returns reply |
| `src/components/ChatWidget.astro` | Floating UI: trigger button, chat window, contact capture, booking CTA |
| `netlify.toml` | Netlify build config: `publish = "dist"`, `functions` directory, dev proxy |
| `src/layouts/Layout.astro` | Includes `<ChatWidget />` once, rendered on every page |

### API Endpoint

`POST /.netlify/functions/chat`

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "We have a CMDB that..." },
    { "role": "assistant", "content": "What's the..." }
  ],
  "visitorName": "Jane Smith",
  "visitorEmail": "jane@carrier.com"
}
```

**Response:**
```json
{
  "reply": "To get an accurate picture...",
  "requestContact": false,
  "suggestBooking": true
}
```

- `requestContact`: Claude detected it's time to ask for contact details → show the contact capture card
- `suggestBooking`: Claude detected the conversation warrants a booking CTA

### Claude Configuration

| Setting | Value | Rationale |
|---------|-------|-----------|
| Model | `claude-opus-4-7` | Best technical quality for lead qualification conversations |
| `thinking` | `{type: "adaptive"}` | Lets Claude reason through complex ServiceNow questions |
| `max_tokens` | `512` | Chat replies must be concise; 512 is generous for 3–4 sentences |
| Context window | Last 12 messages | Prevents runaway token costs on long conversations |

To reduce cost/latency at the expense of quality, change the model to `claude-haiku-4-5` in `netlify/functions/chat.ts`.

### Conversation Flow

1. **Welcome** — shown immediately without an API call: *"What ServiceNow challenge are you working through right now?"*
2. **Qualification** — Claude asks focused technical questions (one at a time) about the problem, industry, and regulatory context
3. **Contact capture** — After 3 exchanges (or when Claude detects readiness), a contact form appears inline in the chat
4. **Booking CTA** — Always visible as a link; highlighted when `suggestBooking: true`

### Action Signal Protocol

Claude signals actions by appending tokens to its response text. The function strips them before returning:

| Token | Meaning | Frontend action |
|-------|---------|-----------------|
| `[REQUEST_CONTACT]` | Show contact capture card | `contactCard.classList.remove('hidden')` |
| `[SUGGEST_BOOKING]` | Highlight booking CTA | Currently logged; CTA is always visible |

### Running Locally

The chat widget requires the Netlify function runtime. Use `netlify dev` instead of `npm run dev`:

```bash
# Install Netlify CLI if needed
npm install -g netlify-cli

# Set your API key
export ANTHROPIC_API_KEY=sk-ant-...

# Start dev server (Astro on 4321, functions proxied at 8888)
netlify dev
```

Open `http://localhost:8888` — both Astro pages and `/.netlify/functions/chat` are served together.

### Environment Variables

| Variable | Where to set | Required |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Netlify dashboard → Site → Environment variables | Yes |

In local dev: `export ANTHROPIC_API_KEY=...` before running `netlify dev`, or add to a `.env` file (already gitignored by default in Netlify projects).

### Security

- All DOM text is written via `textContent` or `appendChild` — no `innerHTML` with user data, eliminating XSS risk
- Conversation history is kept only in memory (not persisted to localStorage)
- The serverless function strips unknown fields from the request body before forwarding to the API
- The Claude API key is server-side only — never exposed to the browser
- CORS headers on the function restrict to expected origins in production (currently `*` — tighten to your domain before launch)

---

## 7. SEO Implementation

### Meta Tags (per-page)

Every page passes `title` and `description` to `Layout.astro` which emits:

```html
<title>{title} | Flowcelerate</title>
<meta name="description" content="{description}" />
<link rel="canonical" href="{canonicalURL}" />

<!-- Open Graph -->
<meta property="og:type" content="website" />
<meta property="og:url" content="{canonicalURL}" />
<meta property="og:title" content="{title}" />
<meta property="og:description" content="{description}" />
<meta property="og:image" content="{siteURL}{image}" />
<meta property="og:site_name" content="Flowcelerate" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{title}" />
<meta name="twitter:description" content="{description}" />
<meta name="twitter:image" content="{siteURL}{image}" />
```

Title logic: if the passed `title` already contains "Flowcelerate", it's used as-is. Otherwise ` | Flowcelerate` is appended.

### Sitemap

Generated by `@astrojs/sitemap` on every build. Requires `site` to be set in `astro.config.mjs`:

```js
export default defineConfig({
  site: 'https://flowcelerate.com',
  integrations: [sitemap()],
});
```

Output: `/sitemap-index.xml` → references `/sitemap-0.xml` containing all public routes.

### RSS Feed (`/rss.xml`)

Generated by `src/pages/rss.xml.ts` using `@astrojs/rss`. Includes all non-draft posts sorted newest-first with:
- `title`, `description`, `pubDate`, `link`, `categories` (tags)
- `<language>en-gb</language>` custom data

### Semantic HTML

| Element | Usage |
|---------|-------|
| `<header>` | Site navigation |
| `<nav>` | Navigation landmarks (main nav, breadcrumbs) with `aria-label` |
| `<main id="main-content">` | Page content wrapper |
| `<section>` | Page sections, each with `aria-labelledby` pointing to heading |
| `<article>` | Blog post cards and case study entries |
| `<aside>` | Sidebar content (case study meta) |
| `<footer>` | Site footer |
| `<time datetime="...">` | Formatted dates |
| `<blockquote>` + `<footer>` | Pull quotes with attribution |

---

## 7. Accessibility Implementation

Target: **WCAG 2.1 AA**

### Keyboard Navigation

- All interactive elements (`<a>`, `<button>`, `<input>`, `<textarea>`) receive focus naturally
- Focus ring: `focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent`
- Mobile menu state managed with `aria-expanded` on the toggle button

### Screen Reader Support

- Decorative SVG icons: `aria-hidden="true"`
- Informative SVG icons: `aria-label` or visually hidden `<span>`
- Active navigation link: `aria-current="page"`
- Skip-to-content: not yet implemented (see Known Limitations)
- Screen-reader-only headings: `class="sr-only"` on `<h2>` within landmark sections where the visual heading is implied

### Colour Contrast

| Pairing | Ratio | Level |
|---------|-------|-------|
| White on Navy 900 (`#0a1628`) | 17.5:1 | AAA |
| Navy 900 on White | 17.5:1 | AAA |
| Accent (`#2563eb`) on White | 4.9:1 | AA |
| White on Accent (`#2563eb`) | 4.9:1 | AA |
| Slate-600 (`#475569`) on White | 5.9:1 | AA |

### Forms

- Every input has an associated `<label for="...">` with matching `id`
- Required fields marked visually (`*`) and with `required` attribute
- `autocomplete` attributes set for name, email, organisation fields

---

## 8. Build Pipeline

### Scripts (`package.json`)

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro"
  }
}
```

### Build Output

```
dist/
├── index.html
├── about/index.html
├── book/index.html
├── contact/index.html
├── case-studies/index.html
├── services/index.html
├── services/itsm/index.html
├── services/sam-pro/index.html
├── services/cmdb-csdm/index.html
├── services/ai-architecture/index.html
├── insights/index.html
├── insights/csdm-for-insurance-carriers/index.html
├── insights/flow-designer-ai-automation-reinsurance/index.html
├── rss.xml
├── sitemap-index.xml
├── sitemap-0.xml
├── robots.txt
└── favicon.svg
```

All routes use directory-style URLs (`/about/index.html` serves at `/about`). No trailing-slash configuration needed for standard static hosting.

### Key Dependencies

```json
{
  "astro": "^5.x",
  "@astrojs/sitemap": "^3.x",
  "@astrojs/rss": "^4.x",
  "tailwindcss": "^4.x",
  "@tailwindcss/vite": "^4.x"
}
```

### `astro.config.mjs`

```js
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://flowcelerate.com',    // required for sitemap + canonical URLs
  vite: {
    plugins: [tailwindcss()]           // Tailwind v4 uses Vite plugin, not PostCSS
  },
  integrations: [sitemap()],
});
```

---

## 9. Performance

### Baseline Budget

| Resource | Target | Notes |
|----------|--------|-------|
| HTML per page | < 30KB gzipped | Astro static output |
| CSS | < 15KB gzipped | Tailwind purges unused utilities |
| JS (own) | < 2KB | Mobile menu toggle only |
| Calendly widget | ~85KB | Third-party, async/defer, non-blocking |
| Google Fonts | ~12KB | Loaded via `@import` in CSS |

### Font Loading

Fonts are loaded via CSS `@import url(...)`. The `<link rel="preconnect">` in `Layout.astro` head establishes the connection to `fonts.googleapis.com` and `fonts.gstatic.com` before the CSS is parsed, reducing font FOUT.

For maximum performance, consider switching to `next/font` local loading or self-hosting via `fontsource`:

```bash
npm install @fontsource-variable/syne @fontsource-variable/dm-sans
```

Then in `global.css`:
```css
@import '@fontsource-variable/syne';
@import '@fontsource-variable/dm-sans';
```

### Image Optimisation

No images are currently used in the site (pure CSS/SVG design). When adding images:
- Use Astro's `<Image />` component from `astro:assets` for automatic WebP conversion and lazy loading
- OG images (`public/og-default.png`) don't go through Astro's image pipeline — optimise manually (target: ~200KB)

### Calendly Performance Impact

Calendly's badge widget initialises on `window load` (after all page content renders) and uses `async defer` for its script. Impact on Core Web Vitals:

- **LCP**: None (loads after page paint)
- **CLS**: Minimal — the floating badge is positioned fixed and doesn't affect page layout
- **INP**: Low — Calendly interaction is user-initiated

---

## 10. Security

### Content Security Policy

Calendly requires two CSP allowances. Configure at your hosting layer (not in Astro — Astro outputs static HTML):

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' assets.calendly.com;
  style-src 'self' 'unsafe-inline' fonts.googleapis.com assets.calendly.com;
  font-src 'self' fonts.gstatic.com;
  frame-src calendly.com;
  connect-src 'self' calendly.com;
  img-src 'self' data: https:;
```

**Note:** `'unsafe-inline'` is required because:
1. Astro injects inline `<script>` tags for component-level JS
2. Tailwind v4 emits inline styles for some utilities

If you want to eliminate `'unsafe-inline'` for scripts, you can use a nonce-based CSP with Astro's SSR mode (not applicable to current static output).

**Provider-specific CSP configuration:**

```
# Netlify: public/_headers
/*
  Content-Security-Policy: [paste policy here]

# Vercel: vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [{ "key": "Content-Security-Policy", "value": "..." }]
    }
  ]
}
```

### Subresource Integrity (SRI)

SRI hashes for Calendly's CDN scripts are **not used**. Calendly rotates their bundle files on each deploy, so a pinned hash would immediately break the widget after their next release. The CSP `frame-src` and `script-src` allowlist provides the appropriate level of restriction for a third-party widget.

### Contact Form

The contact form currently submits to `/contact/success` (a non-existent static route). Before going live, wire it up to one of:

| Provider | Integration |
|----------|-------------|
| **Netlify Forms** | Add `netlify` attribute to `<form>` tag; Netlify intercepts submissions automatically |
| **Formspree** | Change `action` to `https://formspree.io/f/{your-id}` |
| **Resend + Astro API route** | Add an SSR endpoint if you switch to Astro hybrid/server output |

For Netlify Forms:
```html
<form name="contact" method="POST" data-netlify="true" netlify-honeypot="bot-field">
  <input type="hidden" name="form-name" value="contact" />
  <!-- add honeypot field -->
  <p class="hidden"><input name="bot-field" /></p>
  ...
</form>
```

### External Links

All external links use `target="_blank" rel="noopener noreferrer"` to prevent tab-napping and referer leakage.

---

## 11. Known Limitations & Future Work

### Skip Navigation Link

A "Skip to main content" link is not implemented. The `<main id="main-content">` anchor exists; adding the link is a one-component change:

```astro
<!-- Add at the top of Layout.astro body -->
<a
  href="#main-content"
  class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent focus:text-white focus:rounded-lg"
>
  Skip to main content
</a>
```

### Contact Form Handler

No server-side form handling is wired up. See [Security § Contact Form](#security).

### Blog Tag Filter — URL State

The tag filter on `/insights` uses `?tag=` query params for state. This works for direct linking and back-navigation but requires JavaScript to reflect the current filter state on initial page load in some edge cases. A JS-free implementation would require generating a static page per tag.

### Open Graph Image

`public/og-default.png` is referenced in `Layout.astro` but not included in the project. Create a 1200×630px image before deploying — link previews on LinkedIn, Slack, and email clients will show a broken image placeholder until it exists.

### Image Dimensions for Blog Posts

No per-post featured images are defined in the content schema. To add them:

1. Add `heroImage: z.string().optional()` to the schema in `content.config.ts`
2. Place images in `public/images/`
3. Reference them as `heroImage: /images/my-post-hero.jpg` in frontmatter
4. Update `PostCard.astro` and `[slug].astro` to render them via Astro's `<Image />` component

### Analytics

No analytics are installed. Recommended options for a privacy-conscious consulting site:
- **Fathom Analytics** — GDPR-compliant, no cookies, simple embed
- **Plausible** — open source, cookieless
- Both can be added as a `<script>` in `Layout.astro` `<head>`

---

*Flowcelerate technical reference · Last updated 2026-05-28*
