# Training & Community — Design Spec

**Project:** Flowcelerate — Training section + Community (newsletter-first)
**Date:** 2026-05-28
**Status:** Approved

---

## 1. Goals

Primary goal: **authority** — establish Flowcelerate as the recognised ServiceNow expert for insurance and financial services. Training is not primarily a revenue stream; it is a credibility signal and audience-building mechanism.

Secondary goal: **community** — build a subscriber base that keeps Flowcelerate top-of-mind with practitioners and IT leaders between consulting engagements.

---

## 2. Approach

Training lives as a section within the existing Flowcelerate Astro site. No separate subdomain or external LMS in Phase 1–2. All content stays on `flowcelerate.com` — SEO authority accumulates on the main domain and brand stays consistent.

Community is newsletter-first. A discussion forum or private community space is deferred until there is an audience to populate it (target: 200+ subscribers before adding Giscus comments; 30+ training alumni before a private community).

**Email and file delivery runs entirely on AWS** — the user is already on AWS, making this the natural and cost-effective choice over third-party newsletter platforms.

### AWS Service Stack (Phase 1)

| Service | Role |
|---------|------|
| **Amazon S3** | PDF playbook file hosting. Files stored in a private bucket; delivery via pre-signed URLs (expire after 7 days) |
| **Amazon SES** | Email delivery — both transactional (playbook download link) and newsletter (monthly broadcast) |
| **Amazon DynamoDB** | Subscriber store — name, email, tags (`track`, `source`, `playbook_id`), created_at |
| **Netlify Function** (`subscribe.ts`) | Form POST handler — writes to DynamoDB, calls SES to send the download email |
| **Amazon Pinpoint** | Phase 2 only — adds a campaign management UI over SES for newsletter scheduling and reporting |

**Cost profile:** S3 + SES + DynamoDB all fall within AWS free tier at Phase 1 scale (under 1,000 subscribers, under 62,000 SES emails/month from EC2 or Lambda). Effective cost at this scale: ~$0.

---

## 3. Site Architecture

### New Pages

```
/training                        Landing page — tracks, featured content, newsletter CTA
/training/practitioners          Practitioner track index (all practitioner content)
/training/leaders                Leadership track index (all leadership content)
/training/workshops              Full workshop listing with track filters
/training/workshops/[slug]       Individual workshop page
/training/playbooks              All playbooks listing (both tracks, filterable)
/training/playbooks/[slug]       Playbook landing page with inline email gate
```

### Navigation

The "Training" nav item is added to `Header.astro` between "Services" and "Insights". On mobile it appears in the drawer with the same order.

### No Changes To

- `/insights` (blog) — stays unchanged; training is a parallel stream
- `/services` — stays unchanged; training links back to services but doesn't replace them

---

## 4. Content Collections

### `workshops` collection — `src/content/workshops/`

```typescript
schema: z.object({
  title: z.string(),
  description: z.string(),               // 2-3 sentence summary
  track: z.enum(['practitioner', 'leadership']),
  format: z.enum(['live-virtual', 'in-house', 'recorded']),
  duration: z.string(),                  // e.g. "3 hours", "half-day"
  maxParticipants: z.number().optional(),
  price: z.string(),                     // e.g. "£495 per person" or "POA"
  topics: z.array(z.string()),
  outcomes: z.array(z.string()),         // 4-6 concrete takeaways
  agenda: z.array(z.object({
    time: z.string(),
    title: z.string(),
  })).optional(),
  calendlyUrl: z.string().optional(),    // specific Calendly link for this workshop
  nextDate: z.coerce.date().optional(),  // next open-enrollment date
  openEnrollment: z.boolean().default(false),
  pubDate: z.coerce.date(),
  draft: z.boolean().default(false),
})
```

### `playbooks` collection — `src/content/playbooks/`

```typescript
schema: z.object({
  title: z.string(),
  description: z.string(),
  track: z.enum(['practitioner', 'leadership']),
  topics: z.array(z.string()),
  pages: z.number().optional(),          // approximate page count
  gated: z.boolean().default(true),      // false = direct download
  convertkitFormId: z.string().optional(),  // ConvertKit inline form ID
  downloadUrl: z.string().optional(),    // direct URL if ungated
  previewExcerpt: z.string().optional(), // 3-paragraph teaser shown before gate
  pubDate: z.coerce.date(),
  draft: z.boolean().default(false),
})
```

---

## 5. The Two Tracks

### Practitioner Track

**Audience:** ServiceNow admins, developers, architects doing the work on the platform.

**Practitioner Playbooks (Phase 1 — 2 to ship):**
1. "CSDM Implementation Playbook for Insurance Carriers" — anchored to the most-read Insights post
2. "SAM Pro Deployment Guide: Oracle, Microsoft & Actuarial Tools in Financial Services"

**Additional Practitioner Playbooks (Phase 3):**
- "Flow Designer + Now Assist: Agentic Workflow Patterns for Financial Services"
- "ITSM Design for Regulated Environments: SLAs, Escalations & Regulatory Notifications"
- "ServiceNow Discovery & Service Mapping: A Practitioner's Field Guide"

**Practitioner Workshops (Phase 2 — 2 inaugural):**
1. "CMDB Health in a Day" — 3-hour virtual, max 10 participants, £495/person
2. "Building Your First Agentic Flow in ServiceNow" — 3-hour virtual, max 8 participants, £595/person

### Leadership Track

**Audience:** Heads of IT, IT directors, CIOs at insurance/reinsurance/FS firms.

**Leadership Playbooks (Phase 1 — 1 to ship):**
1. "DORA and Your CMDB: What Regulators Are Actually Asking For" — strategic, regulatory-framed, ~15 pages

**Additional Leadership Playbooks (Phase 3):**
- "What Good ServiceNow Architecture Looks Like: A CIO's Guide"
- "AI in ServiceNow: Governance Questions Your Risk Team Will Ask"
- "Evaluating a ServiceNow Partner: What CTAs Look For"

**Leadership Workshops (Phase 2):**
1. "ServiceNow Platform Review: Is Your Architecture Fit for Purpose?" — half-day virtual, in-house only, POA

---

## 6. Playbook Gate — Email Capture Flow (AWS)

1. Visitor lands on `/training/playbooks/[slug]`
2. Page shows: full title, track badge, topics covered, page count, who it's for, and a 3-paragraph preview excerpt
3. A lightweight HTML form (name + work email) is rendered by `PlaybookGate.astro` — no third-party scripts
4. On submit, the form POSTs to **`/.netlify/functions/subscribe`**
5. The Netlify function:
   - Validates input (email format, required fields)
   - Writes subscriber record to **DynamoDB** (`flowcelerate-subscribers` table) with attributes: `email` (PK), `name`, `track`, `playbookId`, `source`, `createdAt`
   - Checks for duplicate email (upsert — existing subscribers get the new playbook tag added)
   - Calls **Amazon SES** `SendEmail` to deliver a branded email containing a **pre-signed S3 URL** to the PDF (7-day expiry)
6. Page shows a "Check your inbox" confirmation state (no page reload — vanilla JS swap)
7. PDF lives in a private **S3 bucket** (`flowcelerate-playbooks`) — never publicly accessible directly

**Pre-signed URL rationale:** The link only works for 7 days and only for the requested file. Sharing the link after expiry returns an access-denied error. This protects the asset without requiring authentication.

**AWS setup required before Phase 1 ships:**
- S3 bucket `flowcelerate-playbooks` (private, versioning on)
- SES domain verification for `flowcelerate.com` + sending identity setup
- DynamoDB table `flowcelerate-subscribers` (partition key: `email`, sort key: `playbookId`)
- IAM role for Netlify function with permissions: `s3:GetObject`, `ses:SendEmail`, `dynamodb:PutItem`, `dynamodb:GetItem`
- AWS credentials added to Netlify environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`)

**AWS SDK:** `@aws-sdk/client-ses`, `@aws-sdk/client-dynamodb`, `@aws-sdk/s3-request-presigner` — all part of the AWS SDK v3 modular packages (tree-shakeable, small bundle size in Lambda/Netlify functions).

---

## 7. Workshop Page + Booking Flow

### Page Structure — `/training/workshops/[slug]`

1. **Problem framing** — the business pain this workshop addresses (matches the Services page tone)
2. **Outcomes** — 4–6 concrete things participants will leave with
3. **Format block** — duration, max participants, delivery mode, price
4. **Agenda** — time-blocked session outline
5. **Who this is for** — experience level, job role, assumed knowledge
6. **Two CTAs:**
   - Open enrollment: "Book your place" → Calendly link for this specific workshop
   - In-house: "Run this for your team" → general contact/book page

### Booking Modes

| Mode | Trigger | Booking mechanism |
|------|---------|------------------|
| Open enrollment | Date advertised, public signup | Calendly group booking link |
| In-house | Organisation books the whole session | Discovery call via Calendly, then bespoke contract |

Open-enrollment workshops are positioned as lower-cost, cross-company sessions (good for individual practitioners). In-house workshops command higher rates and are scoped via the existing consulting engagement model.

---

## 8. Training Landing Page — `/training`

Sections:
1. **Hero** — "ServiceNow training built for insurance and financial services" — dark navy, same Hero component
2. **Track selector** — two prominent cards: Practitioner Track / Leadership Track
3. **Featured playbooks** — 2-3 latest playbooks with track badges
4. **Upcoming workshops** — next 2 workshops with dates and booking CTA
5. **Newsletter CTA** — "Stay ahead on ServiceNow for insurance & FS" — ConvertKit inline form. Subscriber count shown only once the list exceeds 100 real subscribers; omitted at launch to avoid starting at zero.
6. **CTA band** — links back to consulting services

---

## 9. Community — Newsletter-First Approach

### Phase 1 — Newsletter (launches with training section)

- ConvertKit newsletter signup on: `/training`, every playbook page, blog post footers, footer of the main site
- Single subscriber list, tagged by track and source
- Cadence: monthly initially — 1 ServiceNow insight, 1 regulatory update, 1 "from the field" observation
- Subject line format: "ServiceNow for Insurance & FS — [Month]"
- The newsletter archive will be published at `/insights` as regular blog posts (write once, publish twice)

### Phase 2 — Discussion Layer (200+ subscribers)

- **Giscus** comments enabled on Insights posts — GitHub Discussions-backed, no database, no cost, fits the static Astro site
- A GitHub repository is created (e.g. `flowcelerate/community`) to back the Giscus instance
- **LinkedIn Newsletter** mirrors the email newsletter — same content, different channel, builds public search visibility

### Phase 3 — Private Community (30+ training alumni)

- **Circle.so** or **Luma** for a private community space accessible to workshop alumni
- Monthly live "office hours" (45 min, open Q&A)
- Entry point: after completing any paid workshop, alumni receive an invitation
- Does not need to be built until there are enough alumni to populate it

---

## 10. New Components Required

| Component | Purpose |
|-----------|---------|
| `TrackCard.astro` | Practitioner/Leadership track selector card |
| `PlaybookCard.astro` | Playbook listing card (title, track badge, topic pills, CTA) |
| `PlaybookGate.astro` | Email gate on playbook pages (embeds ConvertKit form) |
| `WorkshopCard.astro` | Workshop listing card (format, duration, price, track badge) |
| `NewsletterSignup.astro` | Inline ConvertKit signup form (reusable across pages) |

Existing components unchanged: `Layout.astro`, `Hero.astro`, `CTASection.astro`, `Header.astro` (updated for nav), `Footer.astro` (updated for Training links).

---

## 11. Phase Roadmap

### Phase 1 — Foundation (Month 1–2)
- [ ] ConvertKit account setup + automation for 3 playbooks
- [ ] `content.config.ts` updated with `workshops` and `playbooks` collections
- [ ] `/training` landing page
- [ ] `/training/practitioners` and `/training/leaders` index pages
- [ ] `PlaybookCard.astro`, `PlaybookGate.astro`, `TrackCard.astro`, `NewsletterSignup.astro`
- [ ] 3 playbooks written and published (2 practitioner, 1 leadership)
- [ ] Newsletter CTA added to Insights posts
- [ ] Header + Footer updated

### Phase 2 — Workshops (Month 2–3)
- [ ] `WorkshopCard.astro`
- [ ] `/training/workshops` listing page
- [ ] `/training/workshops/[slug]` dynamic pages
- [ ] 2 inaugural workshops added as content collection entries
- [ ] Calendly links created for each workshop
- [ ] Open enrollment dates advertised in newsletter

### Phase 3 — Community Layer (Month 3–6)
- [ ] Giscus GitHub repo created, comments enabled on `/insights/[slug]`
- [ ] LinkedIn Newsletter launched (mirrors email newsletter)
- [ ] Playbook library grows to 6 entries
- [ ] Newsletter CTA added to case studies and service pages

### Phase 4 — Video (Month 6+)
- [ ] Teachable or Podia account created
- [ ] First video course built from the most popular workshop
- [ ] `/training` landing page updated to include video course section
- [ ] Site acts as marketing funnel → external platform for purchase and delivery

---

## 12. External Dependencies

| Service | Phase | Cost | Purpose |
|---------|-------|------|---------|
| Amazon S3 | 1 | ~$0 (free tier) | Playbook PDF hosting, pre-signed delivery URLs |
| Amazon SES | 1 | ~$0 (free tier, <62K emails/month) | Transactional email — playbook delivery + newsletter |
| Amazon DynamoDB | 1 | ~$0 (free tier) | Subscriber store with track tags |
| Amazon Pinpoint | 2 | ~$0 base + $0.0012/email | Newsletter campaign management UI over SES |
| Giscus + GitHub | 2 | Free | Blog comments backed by GitHub Discussions |
| LinkedIn | 2 | Free | Newsletter mirror for public visibility |
| Circle.so or Luma | 3 | ~$49–99/month | Private alumni community space |
| Teachable or Podia | 4 | ~$39–119/month | Video course hosting and delivery |

**New Netlify function added in Phase 1:**
- `netlify/functions/subscribe.ts` — handles playbook gate form submissions (DynamoDB write + SES send)
- Sits alongside the existing `netlify/functions/chat.ts`

---

## 13. Decisions Made + Remaining Open Questions

### Resolved
- **Email platform:** AWS SES — already on AWS, free tier covers Phase 1 entirely
- **PDF hosting:** Amazon S3 private bucket with pre-signed URLs — no third-party storage needed
- **Subscriber store:** Amazon DynamoDB — fits existing AWS infrastructure

### Remaining (resolve before build)
1. **AWS region** — which region to use for S3/SES/DynamoDB? Use the region where existing AWS workloads run for lowest latency and cost coherence.
2. **SES sending domain** — is `flowcelerate.com` already verified in SES, or does DNS verification need to be set up? Required before Phase 1 can send any emails.
3. **IAM policy scope** — create a dedicated IAM user for the Netlify function with least-privilege permissions, or use an existing role? Dedicated user recommended.
4. **Workshop pricing** — placeholder prices above (£495–595/person) need validation. Consider a "founding cohort" discount for the first 2 workshops.
5. **Newsletter cadence** — monthly is sustainable for a sole practitioner. Fortnightly builds momentum faster but doubles writing time. Start monthly, review after 3 issues.

---

*Spec written 2026-05-28 · Flowcelerate training & community design*
