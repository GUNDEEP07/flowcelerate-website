# Training Section — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/training` section to the Flowcelerate Astro site with two audience tracks, three gated playbooks delivered via AWS SES + S3, a newsletter signup, and a workshops listing page — all within the existing static site architecture.

**Architecture:** Content collections (`workshops`, `playbooks`) feed static Astro pages. A new Netlify serverless function (`subscribe.ts`) handles form submissions — it writes to DynamoDB, generates a pre-signed S3 URL, and sends the download email via SES. All AWS calls are server-side only; the browser never sees credentials.

**Tech Stack:** Astro 5 (static), Tailwind CSS v4, `@aws-sdk/client-ses` v3, `@aws-sdk/client-dynamodb` + `@aws-sdk/lib-dynamodb` v3, `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` v3, Netlify Functions (TypeScript).

---

## File Map

### Create
```
src/content/playbooks/csdm-insurance-carriers.md
src/content/playbooks/sam-pro-financial-services.md
src/content/playbooks/dora-cmdb-regulators.md
src/content/workshops/cmdb-health-in-a-day.md
src/content/workshops/agentic-flow-in-servicenow.md
src/components/TrackCard.astro
src/components/PlaybookCard.astro
src/components/WorkshopCard.astro
src/components/PlaybookGate.astro
src/components/NewsletterSignup.astro
src/pages/training/index.astro
src/pages/training/practitioners.astro
src/pages/training/leaders.astro
src/pages/training/playbooks/index.astro
src/pages/training/playbooks/[slug].astro
src/pages/training/workshops/index.astro
src/pages/training/workshops/[slug].astro
netlify/functions/subscribe.ts
```

### Modify
```
src/content.config.ts          — add workshops + playbooks collections
src/components/Header.astro    — add Training nav link between Services and Case Studies
src/components/Footer.astro    — add Training links column
```

---

## Task 1: Install AWS SDK packages

**Files:** `package.json` (modified by npm)

- [ ] **Step 1: Install the five AWS SDK v3 packages**

```bash
cd /Users/gundeep/Documents/flowcelerate
npm install @aws-sdk/client-ses @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

Expected: `added N packages` with no errors.

- [ ] **Step 2: Verify packages are present**

```bash
node -e "require('@aws-sdk/client-ses'); require('@aws-sdk/client-dynamodb'); require('@aws-sdk/lib-dynamodb'); require('@aws-sdk/client-s3'); require('@aws-sdk/s3-request-presigner'); console.log('all ok')"
```

Expected output: `all ok`

- [ ] **Step 3: Commit**

```bash
git init && git add package.json package-lock.json
git commit -m "chore: add AWS SDK v3 packages for training email/storage"
```

---

## Task 2: Update content.config.ts — add workshops + playbooks collections

**Files:**
- Modify: `src/content.config.ts`

- [ ] **Step 1: Replace the full content of `src/content.config.ts`**

```typescript
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    readingTime: z.number().optional(),
    draft: z.boolean().default(false),
  }),
});

const playbooks = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/playbooks' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    track: z.enum(['practitioner', 'leadership']),
    topics: z.array(z.string()),
    pages: z.number().optional(),
    gated: z.boolean().default(true),
    s3Key: z.string().optional(),          // S3 object key: "playbooks/filename.pdf"
    downloadUrl: z.string().optional(),     // direct URL if ungated
    previewExcerpt: z.string(),             // 2-3 sentence teaser shown before the gate
    pubDate: z.coerce.date(),
    draft: z.boolean().default(false),
  }),
});

const workshops = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/workshops' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    track: z.enum(['practitioner', 'leadership']),
    format: z.enum(['live-virtual', 'in-house', 'recorded']),
    duration: z.string(),
    maxParticipants: z.number().optional(),
    price: z.string(),
    topics: z.array(z.string()),
    outcomes: z.array(z.string()),
    agenda: z.array(z.object({ time: z.string(), title: z.string() })).optional(),
    calendlyUrl: z.string().optional(),
    nextDate: z.coerce.date().optional(),
    openEnrollment: z.boolean().default(false),
    pubDate: z.coerce.date(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog, playbooks, workshops };
```

- [ ] **Step 2: Verify the build still passes**

```bash
npm run build 2>&1 | tail -5
```

Expected: `Complete!` with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/content.config.ts
git commit -m "feat: add playbooks and workshops content collections"
```

---

## Task 3: Create sample content — 3 playbooks + 2 workshops

**Files:** 5 new markdown files in `src/content/`

- [ ] **Step 1: Create `src/content/playbooks/csdm-insurance-carriers.md`**

```markdown
---
title: "CSDM Implementation Playbook for Insurance Carriers"
description: "A step-by-step guide to implementing the Common Service Data Model on ServiceNow for insurance and reinsurance firms — anchored to DORA, Solvency II, and operational resilience obligations."
track: practitioner
topics: ["CSDM", "CMDB", "Service Mapping", "Discovery", "Operational Resilience", "DORA"]
pages: 38
gated: true
s3Key: "playbooks/csdm-insurance-carriers.pdf"
previewExcerpt: "Most insurance carriers have a CMDB. Few have one accurate enough to answer the questions regulators are asking about operational service dependencies. This playbook closes that gap — starting from your most critical business services and building outward with the precision that DORA and Solvency II actually require."
pubDate: 2025-06-01
draft: false
---

## What this playbook covers

The Common Service Data Model gives you the framework. Implementing it correctly — with the right CI classes for an insurance estate, authoritative Discovery integration, and the regulatory reporting outputs your operational resilience team actually needs — requires domain-specific guidance that generic CSDM documentation doesn't provide.

## Who it's for

ServiceNow architects, senior administrators, and CMDB leads at insurance carriers, Lloyd's managing agents, and reinsurers. Assumes familiarity with ServiceNow basics; no prior CSDM experience required.

## Chapters

1. Why CSDM matters for insurance: regulatory context (DORA, Solvency II, FCA operational resilience)
2. The four CSDM layers and how they map to insurance business functions
3. Identifying your critical business services — a facilitated workshop format
4. Discovery configuration for insurance IT estates (on-prem, cloud, Lloyd's platform)
5. Service Mapping: application topology from the network layer up
6. CI class ownership: governance model and quarterly review cadence
7. Change Management integration: wiring risk assessment to CI relationships
8. CMDB Health dashboard: metrics that matter for an insurance estate
9. Operational resilience reporting: building the DORA self-assessment from live CMDB data
10. Common failure patterns and how to avoid them
```

- [ ] **Step 2: Create `src/content/playbooks/sam-pro-financial-services.md`**

```markdown
---
title: "SAM Pro Deployment Guide: Oracle, Microsoft & Actuarial Tools in Financial Services"
description: "How to deploy ServiceNow SAM Pro for an insurance or financial services estate — covering the publisher-specific metric models, entity structure challenges, and audit defence procedures that generic SAM guides miss."
track: practitioner
topics: ["SAM Pro", "Oracle", "Microsoft", "Software Licensing", "Audit Defence", "Compliance"]
pages: 42
gated: true
s3Key: "playbooks/sam-pro-financial-services.pdf"
previewExcerpt: "Insurance and financial services firms carry unusual software licence exposure — Oracle estates that span multiple legal entities, actuarial tools with per-seat restrictions that legal teams don't fully understand, and Microsoft agreements negotiated before cloud consumption was a factor. This guide covers the SAM Pro configuration that surfaces that exposure before an audit does."
pubDate: 2025-06-15
draft: false
---

## What this playbook covers

Generic SAM tooling doesn't model the licence structures common in financial services. This guide covers the publisher-specific metric configuration, entity boundary analysis, and reclamation workflow design that makes SAM Pro useful for insurance and FS firms specifically.

## Who it's for

ServiceNow administrators and SAM leads at insurance carriers, Lloyd's managing agents, reinsurers, and financial services firms. No prior SAM Pro experience required.

## Chapters

1. SAM Pro architecture overview: entitlements, discovery, normalisation, effective position
2. Oracle in financial services: processor licences, entity boundaries, ELA management
3. Microsoft: EA, MPSA, CSP reconciliation and Azure hybrid benefit configuration
4. IBM sub-capacity: ILMT requirements and SAM Pro integration
5. Actuarial and risk modelling tools: Igloo, Radar, RMS, AIR licence models
6. Reclamation workflows: automated harvesting and the quarterly review cycle
7. Publisher audit response: pre-built reports and the 8-day response playbook
8. Renewal forecasting: true-up modelling and budget forecasting dashboards
9. Integration with Discovery: resolving conflicts between CMDB and SAM data
10. Effective licence position: the dashboard your procurement team will actually use
```

- [ ] **Step 3: Create `src/content/playbooks/dora-cmdb-regulators.md`**

```markdown
---
title: "DORA and Your CMDB: What Regulators Are Actually Asking For"
description: "A plain-language guide for IT leaders at financial services firms — what DORA's ICT risk management requirements mean for your ServiceNow CMDB, and how to demonstrate compliance without a multi-year platform project."
track: leadership
topics: ["DORA", "Operational Resilience", "CMDB", "ICT Risk", "Regulatory Compliance"]
pages: 18
gated: true
s3Key: "playbooks/dora-cmdb-regulators.pdf"
previewExcerpt: "DORA came into force in January 2025. Regulators are asking financial services firms to demonstrate documented understanding of their ICT dependencies. Most firms have a ServiceNow CMDB that was never designed to answer those questions. This briefing explains what's actually required and what a pragmatic response looks like."
pubDate: 2025-07-01
draft: false
---

## What this briefing covers

DORA's Article 8 and 9 requirements for ICT risk management are specific about what financial entities must be able to demonstrate. This briefing translates those requirements into practical ServiceNow CMDB terms — what data you need, what relationship mapping looks like, and what a regulator will actually examine.

## Who it's for

Heads of IT, IT directors, CIOs, and CROs at banks, insurers, reinsurers, and investment managers subject to DORA. No ServiceNow expertise assumed.

## Contents

1. What DORA actually requires: a plain reading of Articles 8, 9, and 11
2. The CMDB gap: why most existing configurations don't meet the bar
3. Important Business Services: how to identify and document them
4. Dependency mapping: what "documented ICT dependencies" looks like in practice
5. The three-question test: what a regulator will ask about your operational resilience
6. A pragmatic roadmap: what to fix first, what can wait
7. Questions to ask your ServiceNow partner or internal team
```

- [ ] **Step 4: Create `src/content/workshops/cmdb-health-in-a-day.md`**

```markdown
---
title: "CMDB Health in a Day"
description: "A focused 3-hour virtual workshop that takes your team from CMDB health assessment to a prioritised remediation plan — with working discovery scripts, health dashboard configuration, and CI ownership assignments you can implement the following week."
track: practitioner
format: live-virtual
duration: "3 hours"
maxParticipants: 10
price: "£495 per person"
topics: ["CMDB", "Discovery", "Data Quality", "Health Scoring", "Governance"]
outcomes:
  - "A completed CMDB health assessment covering your top 5 CI classes"
  - "Configured health dashboard with metrics relevant to your estate"
  - "A prioritised list of data quality issues with remediation effort estimates"
  - "A CI ownership governance model ready to present to your team leads"
  - "Working Discovery credential and schedule configuration for your primary environment"
agenda:
  - time: "0:00–0:20"
    title: "Current state: your CMDB health scores and what they mean"
  - time: "0:20–0:50"
    title: "Hands-on: configuring the CMDB Health dashboard for your estate"
  - time: "0:50–1:30"
    title: "Identifying and prioritising data quality issues (live on your instance)"
  - time: "1:30–1:40"
    title: "Break"
  - time: "1:40–2:10"
    title: "Discovery configuration: credentials, schedules, conflict resolution"
  - time: "2:10–2:40"
    title: "CI ownership model: design and stakeholder assignment"
  - time: "2:40–3:00"
    title: "Remediation roadmap: what to fix first and how to measure progress"
openEnrollment: true
nextDate: 2025-09-16
pubDate: 2025-06-01
draft: false
---

## About this workshop

Most ServiceNow administrators know their CMDB has quality problems. Few have a clear picture of what those problems are, which ones matter most, and what it would actually take to fix them.

This workshop cuts through that ambiguity. In three hours, working live on your instance, you'll complete a structured health assessment, configure the dashboards that make quality visible, and leave with a prioritised remediation plan that's grounded in your actual data — not a theoretical framework.

## Who should attend

ServiceNow administrators, CMDB leads, and IT operations managers at insurance carriers, reinsurers, and financial services firms. You should have admin access to your ServiceNow instance. No prior CMDB Health experience required.

## What you'll need

- Admin access to your non-production ServiceNow instance (or production, if that's all you have)
- The names of your top 5 CI classes by record count
- A list of your Discovery credentials and schedule names
```

- [ ] **Step 5: Create `src/content/workshops/agentic-flow-in-servicenow.md`**

```markdown
---
title: "Building Your First Agentic Flow in ServiceNow"
description: "A hands-on 3-hour virtual workshop covering Flow Designer orchestration with Now Assist Skill Builder — from GenAI action design through to production-ready agentic workflows with human-in-the-loop checkpoints."
track: practitioner
format: live-virtual
duration: "3 hours"
maxParticipants: 8
price: "£595 per person"
topics: ["Flow Designer", "Now Assist", "GenAI", "Skill Builder", "Agentic Automation", "Human-in-the-Loop"]
outcomes:
  - "A working agentic Flow Designer flow built on your instance during the session"
  - "Configured Now Assist Skill Builder action with a domain-specific system prompt"
  - "Human-in-the-loop approval checkpoint using Flow Designer Approval actions"
  - "Audit logging pattern for AI-assisted decisions (FCA/model risk governance ready)"
  - "A confidence scoring pattern that routes low-confidence outputs to human review"
agenda:
  - time: "0:00–0:20"
    title: "Agentic automation vs workflow automation: what changes and why it matters"
  - time: "0:20–0:50"
    title: "Skill Builder deep-dive: system prompt engineering for financial services use cases"
  - time: "0:50–1:30"
    title: "Hands-on: build your first GenAI action and test against real data"
  - time: "1:30–1:40"
    title: "Break"
  - time: "1:40–2:10"
    title: "Flow Designer orchestration: wiring GenAI actions into a production flow"
  - time: "2:10–2:40"
    title: "Human-in-the-loop: confidence scoring, approval routing, and audit logging"
  - time: "2:40–3:00"
    title: "Governance documentation: model risk write-up template walkthrough"
openEnrollment: true
nextDate: 2025-10-07
pubDate: 2025-06-01
draft: false
---

## About this workshop

GenAI is available in ServiceNow today. The hard part is not enabling it — it's designing agentic workflows that will survive a model risk review, produce auditable outputs, and hold up when a financial services governance team asks "how does this work and what happens when it's wrong?"

This workshop is built around that question. You'll build a working agentic flow from scratch, configure the governance checkpoints that regulated environments require, and leave with a documentation template that answers the questions your risk team will ask.

## Who should attend

ServiceNow developers, architects, and senior administrators at insurance, reinsurance, or financial services firms who have Flow Designer access and want to build production-ready GenAI integrations. Assumes working knowledge of Flow Designer basics.

## What you'll need

- Flow Designer access on a non-production instance
- Now Assist / Skill Builder licence on that instance
- An example business process in mind (incident triage, change risk assessment, or similar)
```

- [ ] **Step 6: Verify content is picked up correctly**

```bash
npm run build 2>&1 | grep -E "playbook|workshop|error|Error" | head -20
```

Expected: no errors; build completes.

- [ ] **Step 7: Commit**

```bash
git add src/content/playbooks/ src/content/workshops/
git commit -m "feat: add training content — 3 playbooks and 2 workshops"
```

---

## Task 4: Build TrackCard and PlaybookCard components

**Files:**
- Create: `src/components/TrackCard.astro`
- Create: `src/components/PlaybookCard.astro`

- [ ] **Step 1: Create `src/components/TrackCard.astro`**

```astro
---
interface Props {
  track: 'practitioner' | 'leadership';
  title: string;
  description: string;
  href: string;
  playbookCount: number;
  workshopCount: number;
}

const { track, title, description, href, playbookCount, workshopCount } = Astro.props;
const icon = track === 'practitioner' ? '⚙️' : '📋';
const accentClass = track === 'practitioner' ? 'bg-accent-50 text-accent border-accent-100' : 'bg-teal/10 text-teal border-teal/20';
---

<a
  href={href}
  class="group flex flex-col p-6 bg-white border border-slate-200 rounded-xl hover:border-accent/40 hover:shadow-lg hover:shadow-blue-500/8 transition-all duration-200"
  aria-label={`Explore ${title}`}
>
  <div class="flex items-start justify-between mb-4">
    <span class="text-3xl" aria-hidden="true">{icon}</span>
    <span class:list={['px-2 py-0.5 text-xs font-semibold rounded-full border capitalize', accentClass]}>
      {track}
    </span>
  </div>

  <h3 class="font-display font-700 text-navy-900 text-xl mb-2 group-hover:text-accent transition-colors duration-150 text-balance">
    {title}
  </h3>

  <p class="text-slate-600 text-sm leading-relaxed flex-1 mb-5">{description}</p>

  <div class="flex items-center gap-4 text-xs text-slate-400 pt-4 border-t border-slate-100 mb-4">
    <span>{playbookCount} playbook{playbookCount !== 1 ? 's' : ''}</span>
    <span aria-hidden="true">·</span>
    <span>{workshopCount} workshop{workshopCount !== 1 ? 's' : ''}</span>
  </div>

  <span class="inline-flex items-center gap-1.5 text-sm font-semibold text-accent group-hover:gap-2.5 transition-all duration-150">
    Explore track
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M3 7H11M7 3L11 7L7 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </span>
</a>
```

- [ ] **Step 2: Create `src/components/PlaybookCard.astro`**

```astro
---
interface Props {
  title: string;
  description: string;
  track: 'practitioner' | 'leadership';
  topics: string[];
  pages?: number;
  href: string;
  gated?: boolean;
}

const { title, description, track, topics, pages, href, gated = true } = Astro.props;
const trackColour = track === 'practitioner'
  ? 'text-accent bg-accent-50'
  : 'text-teal bg-teal/10';
---

<a
  href={href}
  class="group flex flex-col p-6 bg-white border border-slate-200 rounded-xl hover:border-accent/40 hover:shadow-lg hover:shadow-blue-500/8 transition-all duration-200"
  aria-label={`Read playbook: ${title}`}
>
  <!-- Track + gated badges -->
  <div class="flex items-center gap-2 mb-4">
    <span class:list={['px-2 py-0.5 text-xs font-semibold rounded-full capitalize', trackColour]}>
      {track}
    </span>
    {gated && (
      <span class="px-2 py-0.5 text-xs font-medium text-slate-500 bg-slate-100 rounded-full flex items-center gap-1">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <rect x="1" y="4" width="8" height="5.5" rx="1" stroke="currentColor" stroke-width="1.2"/>
          <path d="M3 4V3a2 2 0 014 0v1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
        Free download
      </span>
    )}
  </div>

  <h3 class="font-display font-700 text-navy-900 text-lg leading-snug mb-2 group-hover:text-accent transition-colors duration-150 text-balance">
    {title}
  </h3>

  <p class="text-slate-600 text-sm leading-relaxed flex-1 mb-4">{description}</p>

  <!-- Topic pills -->
  {topics.slice(0, 4).length > 0 && (
    <div class="flex flex-wrap gap-1.5 mb-4">
      {topics.slice(0, 4).map((t) => (
        <span class="px-2 py-0.5 text-xs font-medium text-slate-500 bg-slate-100 rounded-full">{t}</span>
      ))}
    </div>
  )}

  <div class="flex items-center justify-between pt-3 border-t border-slate-100">
    <span class="text-xs text-slate-400">{pages ? `~${pages} pages` : 'PDF guide'}</span>
    <span class="inline-flex items-center gap-1 text-sm font-semibold text-accent group-hover:gap-2 transition-all duration-150">
      Get playbook
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M3 7H11M7 3L11 7L7 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </span>
  </div>
</a>
```

- [ ] **Step 3: Build to verify no errors**

```bash
npm run build 2>&1 | tail -4
```

Expected: `Complete!`

- [ ] **Step 4: Commit**

```bash
git add src/components/TrackCard.astro src/components/PlaybookCard.astro
git commit -m "feat: add TrackCard and PlaybookCard components"
```

---

## Task 5: Build WorkshopCard and NewsletterSignup components

**Files:**
- Create: `src/components/WorkshopCard.astro`
- Create: `src/components/NewsletterSignup.astro`

- [ ] **Step 1: Create `src/components/WorkshopCard.astro`**

```astro
---
interface Props {
  title: string;
  description: string;
  track: 'practitioner' | 'leadership';
  format: 'live-virtual' | 'in-house' | 'recorded';
  duration: string;
  price: string;
  maxParticipants?: number;
  nextDate?: Date;
  openEnrollment?: boolean;
  href: string;
}

const {
  title, description, track, format, duration,
  price, maxParticipants, nextDate, openEnrollment = false, href,
} = Astro.props;

const trackColour = track === 'practitioner'
  ? 'text-accent bg-accent-50'
  : 'text-teal bg-teal/10';

const formatLabel: Record<string, string> = {
  'live-virtual': 'Live virtual',
  'in-house': 'In-house',
  'recorded': 'On-demand',
};

const nextDateFormatted = nextDate?.toLocaleDateString('en-GB', {
  day: 'numeric', month: 'long', year: 'numeric',
});
---

<a
  href={href}
  class="group flex flex-col p-6 bg-white border border-slate-200 rounded-xl hover:border-accent/40 hover:shadow-lg hover:shadow-blue-500/8 transition-all duration-200"
  aria-label={`View workshop: ${title}`}
>
  <div class="flex items-center gap-2 mb-4">
    <span class:list={['px-2 py-0.5 text-xs font-semibold rounded-full capitalize', trackColour]}>
      {track}
    </span>
    <span class="px-2 py-0.5 text-xs font-medium text-slate-500 bg-slate-100 rounded-full">
      {formatLabel[format]}
    </span>
    {openEnrollment && nextDateFormatted && (
      <span class="px-2 py-0.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-full">
        {nextDateFormatted}
      </span>
    )}
  </div>

  <h3 class="font-display font-700 text-navy-900 text-lg leading-snug mb-2 group-hover:text-accent transition-colors duration-150 text-balance">
    {title}
  </h3>

  <p class="text-slate-600 text-sm leading-relaxed flex-1 mb-4">{description}</p>

  <div class="flex items-center justify-between pt-3 border-t border-slate-100">
    <div class="flex items-center gap-3 text-xs text-slate-400">
      <span>{duration}</span>
      {maxParticipants && (
        <>
          <span aria-hidden="true">·</span>
          <span>Max {maxParticipants}</span>
        </>
      )}
      <span aria-hidden="true">·</span>
      <span class="font-semibold text-navy-900">{price}</span>
    </div>
    <span class="inline-flex items-center gap-1 text-sm font-semibold text-accent group-hover:gap-2 transition-all duration-150">
      View
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M3 7H11M7 3L11 7L7 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </span>
  </div>
</a>
```

- [ ] **Step 2: Create `src/components/NewsletterSignup.astro`**

```astro
---
interface Props {
  variant?: 'light' | 'dark';
  title?: string;
  body?: string;
}

const {
  variant = 'light',
  title = 'Stay ahead on ServiceNow for insurance & FS',
  body = 'Monthly insights on CMDB, ITSM, SAM Pro, and AI architecture — written for practitioners and IT leaders in insurance and financial services.',
} = Astro.props;
---

<div
  id="fc-newsletter"
  class:list={[
    'rounded-xl p-6 sm:p-8',
    variant === 'dark' ? 'bg-white/5 border border-white/10' : 'bg-accent-50 border border-accent-100',
  ]}
>
  <h2 class:list={[
    'font-display font-700 text-xl mb-2',
    variant === 'dark' ? 'text-white' : 'text-navy-900',
  ]}>
    {title}
  </h2>
  <p class:list={[
    'text-sm leading-relaxed mb-5',
    variant === 'dark' ? 'text-slate-300' : 'text-slate-600',
  ]}>
    {body}
  </p>

  <!-- Form — POSTs to subscribe function -->
  <form
    id="fc-newsletter-form"
    class="flex flex-col sm:flex-row gap-2.5"
    aria-label="Newsletter signup"
    novalidate
  >
    <input
      type="text"
      name="name"
      placeholder="Your name (optional)"
      autocomplete="name"
      class="flex-1 px-3.5 py-2.5 rounded-lg border border-slate-200 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent bg-white"
      aria-label="Your name"
    />
    <input
      type="email"
      name="email"
      placeholder="Work email"
      autocomplete="email"
      required
      aria-label="Work email"
      aria-required="true"
      class="flex-1 px-3.5 py-2.5 rounded-lg border border-slate-200 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent bg-white"
    />
    <button
      type="submit"
      class="px-5 py-2.5 bg-accent hover:bg-accent-dark text-white text-sm font-semibold rounded-lg transition-colors duration-150 whitespace-nowrap"
    >
      Subscribe
    </button>
  </form>

  <!-- Success / error states (hidden by default) -->
  <p id="fc-newsletter-success" class="hidden mt-3 text-sm font-medium text-emerald-700">
    ✓ You're subscribed. Check your inbox for a welcome note.
  </p>
  <p id="fc-newsletter-error" class="hidden mt-3 text-sm text-red-600"></p>
</div>

<script>
  const form = document.getElementById('fc-newsletter-form') as HTMLFormElement | null;
  const success = document.getElementById('fc-newsletter-success');
  const error = document.getElementById('fc-newsletter-error');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const email = (data.get('email') as string)?.trim();
    const name  = (data.get('name')  as string)?.trim();

    if (!email) return;

    const btn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    btn.disabled = true;
    btn.textContent = 'Subscribing…';

    try {
      const res = await fetch('/.netlify/functions/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          playbookId: 'newsletter',
          playbookTitle: 'Newsletter',
          track: 'newsletter',
          s3Key: null,
          isNewsletter: true,
        }),
      });
      if (res.ok) {
        form.classList.add('hidden');
        success?.classList.remove('hidden');
      } else {
        const j = await res.json().catch(() => ({}));
        if (error) {
          error.textContent = (j as any).error ?? 'Something went wrong. Please try again.';
          error.classList.remove('hidden');
        }
        btn.disabled = false;
        btn.textContent = 'Subscribe';
      }
    } catch {
      if (error) {
        error.textContent = 'Could not connect. Please try again.';
        error.classList.remove('hidden');
      }
      btn.disabled = false;
      btn.textContent = 'Subscribe';
    }
  });
</script>
```

- [ ] **Step 3: Build to verify**

```bash
npm run build 2>&1 | tail -4
```

Expected: `Complete!`

- [ ] **Step 4: Commit**

```bash
git add src/components/WorkshopCard.astro src/components/NewsletterSignup.astro
git commit -m "feat: add WorkshopCard and NewsletterSignup components"
```

---

## Task 6: Build PlaybookGate component

**Files:**
- Create: `src/components/PlaybookGate.astro`

- [ ] **Step 1: Create `src/components/PlaybookGate.astro`**

```astro
---
interface Props {
  playbookId: string;
  playbookTitle: string;
  track: 'practitioner' | 'leadership';
  s3Key?: string;
}

const { playbookId, playbookTitle, track, s3Key } = Astro.props;
---

<div
  id="fc-gate"
  class="rounded-xl border border-accent-100 bg-accent-50 p-6 sm:p-8"
  role="form"
  aria-label="Download playbook"
>
  <div class="flex items-center gap-3 mb-4">
    <div class="w-10 h-10 bg-accent rounded-lg flex items-center justify-center shrink-0">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M10 3v9M6 9l4 4 4-4" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M3 15h14" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </div>
    <div>
      <p class="font-display font-700 text-navy-900 text-sm">Free download</p>
      <p class="text-slate-500 text-xs">Enter your email and we'll send it straight to your inbox.</p>
    </div>
  </div>

  <form id="fc-gate-form" class="space-y-3" novalidate aria-label={`Download ${playbookTitle}`}>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label for="fc-gate-name" class="block text-xs font-medium text-navy-900 mb-1">
          Your name
        </label>
        <input
          type="text"
          id="fc-gate-name"
          name="name"
          autocomplete="name"
          placeholder="Jane Smith"
          class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent bg-white"
        />
      </div>
      <div>
        <label for="fc-gate-email" class="block text-xs font-medium text-navy-900 mb-1">
          Work email <span class="text-red-500" aria-hidden="true">*</span>
        </label>
        <input
          type="email"
          id="fc-gate-email"
          name="email"
          autocomplete="email"
          required
          placeholder="jane@carrier.com"
          aria-required="true"
          class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent bg-white"
        />
      </div>
    </div>

    <button
      type="submit"
      id="fc-gate-btn"
      class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-accent hover:bg-accent-dark text-white text-sm font-semibold rounded-lg transition-colors duration-150"
    >
      Send me the playbook
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M3 7H11M7 3L11 7L7 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <p class="text-xs text-slate-400">
      You'll receive the PDF by email. We'll also occasionally send insights on ServiceNow for insurance & FS. Unsubscribe any time.
    </p>
  </form>

  <!-- Success state -->
  <div id="fc-gate-success" class="hidden text-center py-4">
    <div class="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path d="M4 11L9 16L18 7" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <p class="font-display font-700 text-navy-900 text-lg">Check your inbox</p>
    <p class="text-slate-500 text-sm mt-1">The download link is on its way. Check your spam folder if it doesn't arrive within a couple of minutes.</p>
  </div>

  <!-- Error state -->
  <p id="fc-gate-error" class="hidden mt-3 text-sm text-red-600"></p>
</div>

<script define:vars={{ playbookId, playbookTitle, track, s3Key }}>
  const form = document.getElementById('fc-gate-form');
  const successEl = document.getElementById('fc-gate-success');
  const errorEl = document.getElementById('fc-gate-error');
  const btn = document.getElementById('fc-gate-btn');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = (document.getElementById('fc-gate-email')).value.trim();
    const name  = (document.getElementById('fc-gate-name')).value.trim();

    if (!email) {
      document.getElementById('fc-gate-email').focus();
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Sending…';
    if (errorEl) errorEl.classList.add('hidden');

    try {
      const res = await fetch('/.netlify/functions/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, playbookId, playbookTitle, track, s3Key }),
      });

      if (res.ok) {
        form.classList.add('hidden');
        successEl?.classList.remove('hidden');
      } else {
        const j = await res.json().catch(() => ({}));
        if (errorEl) {
          errorEl.textContent = j.error ?? 'Something went wrong. Please try again.';
          errorEl.classList.remove('hidden');
        }
        btn.disabled = false;
        btn.textContent = 'Send me the playbook';
      }
    } catch {
      if (errorEl) {
        errorEl.textContent = 'Could not reach the server. Please try again.';
        errorEl.classList.remove('hidden');
      }
      btn.disabled = false;
      btn.textContent = 'Send me the playbook';
    }
  });
</script>
```

- [ ] **Step 2: Build to verify**

```bash
npm run build 2>&1 | tail -4
```

Expected: `Complete!`

- [ ] **Step 3: Commit**

```bash
git add src/components/PlaybookGate.astro
git commit -m "feat: add PlaybookGate component with AWS subscribe form"
```

---

## Task 7: Build the subscribe Netlify function

**Files:**
- Create: `netlify/functions/subscribe.ts`

- [ ] **Step 1: Create `netlify/functions/subscribe.ts`**

```typescript
import type { Handler, HandlerEvent } from "@netlify/functions";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const REGION       = process.env.FC_AWS_REGION ?? "eu-west-1";
const BUCKET       = process.env.FC_S3_BUCKET  ?? "flowcelerate-playbooks";
const TABLE        = process.env.FC_DDB_TABLE   ?? "flowcelerate-subscribers";
const FROM_EMAIL   = process.env.FC_SES_FROM    ?? "hello@flowcelerate.com";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));
const ses = new SESClient({ region: REGION });
const s3  = new S3Client({ region: REGION });

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: CORS, body: "" };
  if (event.httpMethod !== "POST")    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: "Method not allowed" }) };

  try {
    const {
      name = "",
      email,
      playbookId,
      playbookTitle,
      track = "practitioner",
      s3Key,
      isNewsletter = false,
    } = JSON.parse(event.body ?? "{}");

    // Validate
    if (!email || !playbookId) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Email and playbookId are required." }) };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Please enter a valid email address." }) };
    }

    const normalEmail = String(email).toLowerCase().trim();
    const normalName  = String(name).trim();

    // Write subscriber to DynamoDB
    // PK=email, SK=playbookId allows same address to download multiple playbooks
    await ddb.send(new PutCommand({
      TableName: TABLE,
      Item: {
        email:       normalEmail,
        playbookId:  String(playbookId),
        name:        normalName,
        track:       String(track),
        isNewsletter: Boolean(isNewsletter),
        source:      "website",
        tags:        [`track:${track}`, `playbook:${playbookId}`],
        createdAt:   new Date().toISOString(),
      },
    }));

    // Newsletter-only path: no PDF to deliver, just confirm subscription
    if (isNewsletter || !s3Key) {
      await ses.send(new SendEmailCommand({
        Source:      `Flowcelerate <${FROM_EMAIL}>`,
        Destination: { ToAddresses: [normalEmail] },
        Message: {
          Subject: { Data: "You're subscribed to Flowcelerate Insights" },
          Body: {
            Html: { Data: buildConfirmationEmail(normalName) },
            Text: { Data: `${normalName ? `Hi ${normalName},\n\n` : ""}You're subscribed to Flowcelerate Insights — ServiceNow for insurance & financial services.\n\nhttps://flowcelerate.com` },
          },
        },
      }));
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true }) };
    }

    // Playbook path: generate pre-signed S3 URL (7-day expiry) and send it
    const presignedUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: BUCKET, Key: String(s3Key) }),
      { expiresIn: 7 * 24 * 60 * 60 },
    );

    await ses.send(new SendEmailCommand({
      Source:      `Flowcelerate <${FROM_EMAIL}>`,
      Destination: { ToAddresses: [normalEmail] },
      Message: {
        Subject: { Data: `Your Flowcelerate playbook: ${playbookTitle}` },
        Body: {
          Html: { Data: buildPlaybookEmail(normalName, String(playbookTitle), presignedUrl) },
          Text: { Data: buildPlaybookText(normalName, String(playbookTitle), presignedUrl) },
        },
      },
    }));

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true }) };

  } catch (err) {
    console.error("Subscribe error:", err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "Something went wrong. Please try again in a moment." }) };
  }
};

// ── Email templates ────────────────────────────────────────────────────────

function buildPlaybookEmail(name: string, title: string, url: string): string {
  const greeting = name ? `Hi ${name},<br><br>` : "";
  return `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#1e293b;">
  <p style="font-size:20px;font-weight:700;color:#0a1628;margin:0 0 24px;">Flowcelerate</p>
  <h1 style="font-size:18px;font-weight:700;color:#0a1628;margin:0 0 8px;">Your playbook is ready</h1>
  <p style="font-size:15px;line-height:1.6;color:#475569;margin:0 0 24px;">${greeting}Here's your copy of <strong>${title}</strong>. The link below is valid for 7 days.</p>
  <a href="${url}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;margin-bottom:24px;">Download playbook →</a>
  <p style="font-size:13px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:16px;margin-top:24px;">
    You requested this playbook from <a href="https://flowcelerate.com" style="color:#2563eb;">flowcelerate.com</a>. You'll occasionally receive insights on ServiceNow for insurance &amp; financial services. <a href="https://flowcelerate.com" style="color:#2563eb;">Unsubscribe</a>.
  </p>
</div>`;
}

function buildPlaybookText(name: string, title: string, url: string): string {
  const greeting = name ? `Hi ${name},\n\n` : "";
  return `${greeting}Your copy of "${title}" is ready.\n\nDownload it here (expires in 7 days):\n${url}\n\n---\nFlowcelerate · ServiceNow for insurance & financial services\nhttps://flowcelerate.com`;
}

function buildConfirmationEmail(name: string): string {
  const greeting = name ? `Hi ${name},<br><br>` : "";
  return `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#1e293b;">
  <p style="font-size:20px;font-weight:700;color:#0a1628;margin:0 0 24px;">Flowcelerate</p>
  <h1 style="font-size:18px;font-weight:700;color:#0a1628;margin:0 0 8px;">You're subscribed</h1>
  <p style="font-size:15px;line-height:1.6;color:#475569;margin:0 0 16px;">${greeting}You'll receive monthly insights on ServiceNow architecture for insurance and financial services — CMDB, ITSM, SAM Pro, and AI.</p>
  <a href="https://flowcelerate.com/insights" style="display:inline-block;padding:12px 24px;background:#2563eb;color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Browse recent insights →</a>
</div>`;
}
```

- [ ] **Step 2: Add environment variables to `.env`**

Open `flowcelerate/.env` and add:

```
# AWS — Training email + file delivery
FC_AWS_REGION=eu-west-1
FC_S3_BUCKET=flowcelerate-playbooks
FC_DDB_TABLE=flowcelerate-subscribers
FC_SES_FROM=hello@flowcelerate.com
AWS_ACCESS_KEY_ID=your-iam-key-id
AWS_SECRET_ACCESS_KEY=your-iam-secret
```

> Note: `FC_AWS_REGION` uses a custom prefix to avoid clashing with Netlify's own `AWS_REGION` environment variable.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/gundeep/Documents/flowcelerate
npx tsc --noEmit netlify/functions/subscribe.ts --esModuleInterop --moduleResolution bundler --target es2020 2>&1 | head -20
```

Expected: no output (no errors), or only minor warnings about unresolved modules that won't affect runtime.

- [ ] **Step 4: Commit**

```bash
git add netlify/functions/subscribe.ts .env
git commit -m "feat: add subscribe Netlify function — DynamoDB + SES + S3 pre-signed URL"
```

---

## Task 8: Build training landing page

**Files:**
- Create: `src/pages/training/index.astro`

- [ ] **Step 1: Create `src/pages/training/index.astro`**

```astro
---
import Layout from '../../layouts/Layout.astro';
import Hero from '../../components/Hero.astro';
import TrackCard from '../../components/TrackCard.astro';
import PlaybookCard from '../../components/PlaybookCard.astro';
import WorkshopCard from '../../components/WorkshopCard.astro';
import NewsletterSignup from '../../components/NewsletterSignup.astro';
import CTASection from '../../components/CTASection.astro';
import { getCollection } from 'astro:content';

const allPlaybooks = (await getCollection('playbooks', ({ data }) => !data.draft))
  .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

const allWorkshops = (await getCollection('workshops', ({ data }) => !data.draft))
  .sort((a, b) => (a.data.nextDate?.valueOf() ?? 0) - (b.data.nextDate?.valueOf() ?? 0));

const practitionerPlaybooks = allPlaybooks.filter(p => p.data.track === 'practitioner');
const leadershipPlaybooks   = allPlaybooks.filter(p => p.data.track === 'leadership');
const practitionerWorkshops = allWorkshops.filter(w => w.data.track === 'practitioner');
const leadershipWorkshops   = allWorkshops.filter(w => w.data.track === 'leadership');

const featuredPlaybooks  = allPlaybooks.slice(0, 3);
const upcomingWorkshops  = allWorkshops.filter(w => w.data.openEnrollment).slice(0, 2);
---

<Layout
  title="Training — Flowcelerate"
  description="ServiceNow training for insurance and financial services practitioners and IT leaders. Playbooks, workshops, and courses built for regulated environments."
>
  <Hero
    badge="Training & Education"
    headline="ServiceNow training built for insurance and financial services"
    subheadline="Playbooks, workshops, and courses designed specifically for the platform challenges and regulatory context of insurance carriers, reinsurers, and FS firms."
    ctaPrimary={{ href: '/training/playbooks', label: 'Browse Playbooks' }}
    ctaSecondary={{ href: '/training/workshops', label: 'View Workshops' }}
    variant="dark"
  />

  <!-- Track selector -->
  <section class="py-20 bg-slate-50" aria-labelledby="tracks-heading">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="max-w-2xl mb-10">
        <p class="text-sm font-semibold text-accent uppercase tracking-wider mb-3">Two tracks</p>
        <h2 id="tracks-heading" class="font-display font-800 text-3xl sm:text-4xl text-navy-900 text-balance">
          Find the content built for your role
        </h2>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <TrackCard
          track="practitioner"
          title="Practitioner Track"
          description="Deep technical guides for ServiceNow administrators, developers, and architects doing the work on the platform. CSDM implementation, SAM Pro configuration, Flow Designer, and agentic automation."
          href="/training/practitioners"
          playbookCount={practitionerPlaybooks.length}
          workshopCount={practitionerWorkshops.length}
        />
        <TrackCard
          track="leadership"
          title="Leadership Track"
          description="Strategic and regulatory framing for heads of IT, directors, and CIOs. Understand what good ServiceNow architecture looks like, what DORA requires, and how to evaluate your platform's fitness for purpose."
          href="/training/leaders"
          playbookCount={leadershipPlaybooks.length}
          workshopCount={leadershipWorkshops.length}
        />
      </div>
    </div>
  </section>

  <!-- Featured playbooks -->
  {featuredPlaybooks.length > 0 && (
    <section class="py-20 bg-white" aria-labelledby="playbooks-heading">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-end justify-between mb-10">
          <div>
            <p class="text-sm font-semibold text-accent uppercase tracking-wider mb-2">Playbooks</p>
            <h2 id="playbooks-heading" class="font-display font-800 text-3xl text-navy-900">Free PDF guides</h2>
          </div>
          <a href="/training/playbooks" class="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-dark transition-colors">
            All playbooks
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M3 7H11M7 3L11 7L7 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </a>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          {featuredPlaybooks.map(p => (
            <PlaybookCard
              title={p.data.title}
              description={p.data.description}
              track={p.data.track}
              topics={p.data.topics}
              pages={p.data.pages}
              href={`/training/playbooks/${p.id}`}
              gated={p.data.gated}
            />
          ))}
        </div>
      </div>
    </section>
  )}

  <!-- Upcoming workshops -->
  {upcomingWorkshops.length > 0 && (
    <section class="py-20 bg-slate-50" aria-labelledby="workshops-heading">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-end justify-between mb-10">
          <div>
            <p class="text-sm font-semibold text-accent uppercase tracking-wider mb-2">Workshops</p>
            <h2 id="workshops-heading" class="font-display font-800 text-3xl text-navy-900">Upcoming live sessions</h2>
          </div>
          <a href="/training/workshops" class="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-dark transition-colors">
            All workshops
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M3 7H11M7 3L11 7L7 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </a>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          {upcomingWorkshops.map(w => (
            <WorkshopCard
              title={w.data.title}
              description={w.data.description}
              track={w.data.track}
              format={w.data.format}
              duration={w.data.duration}
              price={w.data.price}
              maxParticipants={w.data.maxParticipants}
              nextDate={w.data.nextDate}
              openEnrollment={w.data.openEnrollment}
              href={`/training/workshops/${w.id}`}
            />
          ))}
        </div>
      </div>
    </section>
  )}

  <!-- Newsletter -->
  <section class="py-20 bg-white" aria-labelledby="newsletter-heading">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <p class="text-sm font-semibold text-accent uppercase tracking-wider mb-3 text-center">Community</p>
      <h2 id="newsletter-heading" class="font-display font-800 text-3xl text-navy-900 text-center mb-8">
        Monthly insights, straight to your inbox
      </h2>
      <NewsletterSignup />
    </div>
  </section>

  <CTASection
    headline="Need something bespoke?"
    body="The training catalogue covers the most common challenges. If you need a workshop designed around your specific platform and regulatory context, let's talk."
    ctaLabel="Book a Discovery Call"
    secondaryLabel="View Services"
    secondaryHref="/services"
  />
</Layout>
```

- [ ] **Step 2: Build to verify**

```bash
npm run build 2>&1 | tail -4
```

Expected: `Complete!`

- [ ] **Step 3: Commit**

```bash
git add src/pages/training/index.astro
git commit -m "feat: add /training landing page"
```

---

## Task 9: Build track index pages

**Files:**
- Create: `src/pages/training/practitioners.astro`
- Create: `src/pages/training/leaders.astro`

- [ ] **Step 1: Create `src/pages/training/practitioners.astro`**

```astro
---
import Layout from '../../layouts/Layout.astro';
import PlaybookCard from '../../components/PlaybookCard.astro';
import WorkshopCard from '../../components/WorkshopCard.astro';
import CTASection from '../../components/CTASection.astro';
import { getCollection } from 'astro:content';

const playbooks = (await getCollection('playbooks', ({ data }) => !data.draft && data.track === 'practitioner'))
  .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

const workshops = (await getCollection('workshops', ({ data }) => !data.draft && data.track === 'practitioner'))
  .sort((a, b) => (a.data.nextDate?.valueOf() ?? 0) - (b.data.nextDate?.valueOf() ?? 0));
---

<Layout
  title="Practitioner Track — Flowcelerate Training"
  description="ServiceNow training for practitioners in insurance and financial services: CMDB/CSDM, SAM Pro, Flow Designer, AI automation. Playbooks and live workshops."
>
  <section class="bg-navy-900 relative overflow-hidden" aria-labelledby="practitioners-heading">
    <div class="absolute inset-0 grid-dots opacity-20 pointer-events-none" aria-hidden="true"></div>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
      <nav class="flex items-center gap-2 text-sm text-slate-400 mb-8" aria-label="Breadcrumb">
        <a href="/training" class="hover:text-white transition-colors">Training</a>
        <span aria-hidden="true">/</span>
        <span class="text-white" aria-current="page">Practitioner Track</span>
      </nav>
      <div class="max-w-2xl">
        <div class="flex items-center gap-2 mb-5">
          <span class="text-2xl" aria-hidden="true">⚙️</span>
          <span class="px-2.5 py-1 text-xs font-semibold text-accent bg-accent/10 rounded-full border border-accent/20">Practitioner</span>
        </div>
        <h1 id="practitioners-heading" class="font-display font-800 text-4xl sm:text-5xl text-white text-balance">
          Built for the people doing the work on the platform
        </h1>
        <p class="mt-5 text-slate-300 text-lg leading-relaxed">
          Deep technical guides and hands-on workshops for ServiceNow administrators, developers, and architects at insurance carriers, reinsurers, and financial services firms.
        </p>
      </div>
    </div>
  </section>

  {playbooks.length > 0 && (
    <section class="py-20 bg-white" aria-labelledby="pract-playbooks-heading">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 id="pract-playbooks-heading" class="font-display font-800 text-2xl text-navy-900 mb-8">Playbooks</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          {playbooks.map(p => (
            <PlaybookCard
              title={p.data.title}
              description={p.data.description}
              track={p.data.track}
              topics={p.data.topics}
              pages={p.data.pages}
              href={`/training/playbooks/${p.id}`}
              gated={p.data.gated}
            />
          ))}
        </div>
      </div>
    </section>
  )}

  {workshops.length > 0 && (
    <section class="py-20 bg-slate-50" aria-labelledby="pract-workshops-heading">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 id="pract-workshops-heading" class="font-display font-800 text-2xl text-navy-900 mb-8">Workshops</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          {workshops.map(w => (
            <WorkshopCard
              title={w.data.title}
              description={w.data.description}
              track={w.data.track}
              format={w.data.format}
              duration={w.data.duration}
              price={w.data.price}
              maxParticipants={w.data.maxParticipants}
              nextDate={w.data.nextDate}
              openEnrollment={w.data.openEnrollment}
              href={`/training/workshops/${w.id}`}
            />
          ))}
        </div>
      </div>
    </section>
  )}

  <CTASection />
</Layout>
```

- [ ] **Step 2: Create `src/pages/training/leaders.astro`**

```astro
---
import Layout from '../../layouts/Layout.astro';
import PlaybookCard from '../../components/PlaybookCard.astro';
import WorkshopCard from '../../components/WorkshopCard.astro';
import CTASection from '../../components/CTASection.astro';
import { getCollection } from 'astro:content';

const playbooks = (await getCollection('playbooks', ({ data }) => !data.draft && data.track === 'leadership'))
  .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

const workshops = (await getCollection('workshops', ({ data }) => !data.draft && data.track === 'leadership'))
  .sort((a, b) => (a.data.nextDate?.valueOf() ?? 0) - (b.data.nextDate?.valueOf() ?? 0));
---

<Layout
  title="Leadership Track — Flowcelerate Training"
  description="ServiceNow training for IT leaders at insurance and financial services firms: DORA, operational resilience, platform strategy, and regulatory compliance."
>
  <section class="bg-navy-900 relative overflow-hidden" aria-labelledby="leaders-heading">
    <div class="absolute inset-0 grid-dots opacity-20 pointer-events-none" aria-hidden="true"></div>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
      <nav class="flex items-center gap-2 text-sm text-slate-400 mb-8" aria-label="Breadcrumb">
        <a href="/training" class="hover:text-white transition-colors">Training</a>
        <span aria-hidden="true">/</span>
        <span class="text-white" aria-current="page">Leadership Track</span>
      </nav>
      <div class="max-w-2xl">
        <div class="flex items-center gap-2 mb-5">
          <span class="text-2xl" aria-hidden="true">📋</span>
          <span class="px-2.5 py-1 text-xs font-semibold text-teal-light bg-teal/10 rounded-full border border-teal/20">Leadership</span>
        </div>
        <h1 id="leaders-heading" class="font-display font-800 text-4xl sm:text-5xl text-white text-balance">
          Built for IT leaders who need the strategic picture
        </h1>
        <p class="mt-5 text-slate-300 text-lg leading-relaxed">
          Briefings and workshops for heads of IT, IT directors, and CIOs at insurance and financial services firms — what good ServiceNow architecture looks like, what regulators are actually asking, and how to evaluate your platform's fitness for purpose.
        </p>
      </div>
    </div>
  </section>

  {playbooks.length > 0 && (
    <section class="py-20 bg-white" aria-labelledby="lead-playbooks-heading">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 id="lead-playbooks-heading" class="font-display font-800 text-2xl text-navy-900 mb-8">Briefings & Playbooks</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          {playbooks.map(p => (
            <PlaybookCard
              title={p.data.title}
              description={p.data.description}
              track={p.data.track}
              topics={p.data.topics}
              pages={p.data.pages}
              href={`/training/playbooks/${p.id}`}
              gated={p.data.gated}
            />
          ))}
        </div>
      </div>
    </section>
  )}

  {workshops.length > 0 && (
    <section class="py-20 bg-slate-50" aria-labelledby="lead-workshops-heading">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 id="lead-workshops-heading" class="font-display font-800 text-2xl text-navy-900 mb-8">Workshops</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          {workshops.map(w => (
            <WorkshopCard
              title={w.data.title}
              description={w.data.description}
              track={w.data.track}
              format={w.data.format}
              duration={w.data.duration}
              price={w.data.price}
              maxParticipants={w.data.maxParticipants}
              nextDate={w.data.nextDate}
              openEnrollment={w.data.openEnrollment}
              href={`/training/workshops/${w.id}`}
            />
          ))}
        </div>
      </div>
    </section>
  )}

  <CTASection />
</Layout>
```

- [ ] **Step 3: Build to verify**

```bash
npm run build 2>&1 | tail -4
```

Expected: `Complete!`

- [ ] **Step 4: Commit**

```bash
git add src/pages/training/practitioners.astro src/pages/training/leaders.astro
git commit -m "feat: add practitioner and leadership track index pages"
```

---

## Task 10: Build playbooks pages (index + detail)

**Files:**
- Create: `src/pages/training/playbooks/index.astro`
- Create: `src/pages/training/playbooks/[slug].astro`

- [ ] **Step 1: Create `src/pages/training/playbooks/index.astro`**

```astro
---
import Layout from '../../../layouts/Layout.astro';
import PlaybookCard from '../../../components/PlaybookCard.astro';
import { getCollection } from 'astro:content';

const allPlaybooks = (await getCollection('playbooks', ({ data }) => !data.draft))
  .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

const tracks = ['all', 'practitioner', 'leadership'] as const;
const selectedTrack = (Astro.url.searchParams.get('track') ?? 'all') as typeof tracks[number];

const filtered = selectedTrack === 'all'
  ? allPlaybooks
  : allPlaybooks.filter(p => p.data.track === selectedTrack);
---

<Layout
  title="Playbooks — Flowcelerate Training"
  description="Free PDF playbooks on ServiceNow architecture for insurance and financial services. CMDB/CSDM, SAM Pro, DORA compliance, and more."
>
  <section class="bg-navy-900 relative overflow-hidden" aria-labelledby="playbooks-page-heading">
    <div class="absolute inset-0 grid-dots opacity-20 pointer-events-none" aria-hidden="true"></div>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
      <nav class="flex items-center gap-2 text-sm text-slate-400 mb-8" aria-label="Breadcrumb">
        <a href="/training" class="hover:text-white transition-colors">Training</a>
        <span aria-hidden="true">/</span>
        <span class="text-white" aria-current="page">Playbooks</span>
      </nav>
      <div class="max-w-2xl">
        <h1 id="playbooks-page-heading" class="font-display font-800 text-4xl sm:text-5xl text-white text-balance">
          Free playbooks
        </h1>
        <p class="mt-5 text-slate-300 text-lg leading-relaxed">
          PDF guides on ServiceNow architecture for insurance and financial services. Enter your email and receive the download link instantly.
        </p>
      </div>
    </div>
  </section>

  <section class="py-16 bg-white" aria-labelledby="playbooks-list-heading">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Track filter -->
      <div class="flex flex-wrap gap-2 mb-10" role="group" aria-label="Filter by track">
        {tracks.map(t => (
          <a
            href={t === 'all' ? '/training/playbooks' : `/training/playbooks?track=${t}`}
            class:list={[
              'px-3.5 py-1.5 text-sm font-medium rounded-full border transition-colors capitalize',
              selectedTrack === t
                ? 'text-white bg-accent border-accent'
                : 'text-slate-600 border-slate-200 hover:border-accent/50 hover:text-accent'
            ]}
          >
            {t === 'all' ? 'All tracks' : t}
          </a>
        ))}
      </div>

      <h2 id="playbooks-list-heading" class="sr-only">
        {selectedTrack === 'all' ? 'All playbooks' : `${selectedTrack} playbooks`}
      </h2>

      {filtered.length > 0 ? (
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          {filtered.map(p => (
            <PlaybookCard
              title={p.data.title}
              description={p.data.description}
              track={p.data.track}
              topics={p.data.topics}
              pages={p.data.pages}
              href={`/training/playbooks/${p.id}`}
              gated={p.data.gated}
            />
          ))}
        </div>
      ) : (
        <p class="text-slate-500 py-16 text-center">No playbooks found for this filter.</p>
      )}
    </div>
  </section>
</Layout>
```

- [ ] **Step 2: Create `src/pages/training/playbooks/[slug].astro`**

```astro
---
import Layout from '../../../layouts/Layout.astro';
import PlaybookGate from '../../../components/PlaybookGate.astro';
import CTASection from '../../../components/CTASection.astro';
import { getCollection, render } from 'astro:content';

export async function getStaticPaths() {
  const playbooks = await getCollection('playbooks', ({ data }) => !data.draft);
  return playbooks.map(p => ({ params: { slug: p.id }, props: { playbook: p } }));
}

const { playbook } = Astro.props;
const { Content } = await render(playbook);

const trackColour = playbook.data.track === 'practitioner'
  ? 'text-accent bg-accent-50'
  : 'text-teal bg-teal/10';
---

<Layout
  title={`${playbook.data.title} — Flowcelerate`}
  description={playbook.data.description}
>
  <!-- Header -->
  <section class="bg-navy-900 relative overflow-hidden" aria-labelledby="playbook-heading">
    <div class="absolute inset-0 grid-dots opacity-20 pointer-events-none" aria-hidden="true"></div>
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
      <nav class="flex items-center gap-2 text-sm text-slate-400 mb-8" aria-label="Breadcrumb">
        <a href="/training" class="hover:text-white transition-colors">Training</a>
        <span aria-hidden="true">/</span>
        <a href="/training/playbooks" class="hover:text-white transition-colors">Playbooks</a>
        <span aria-hidden="true">/</span>
        <span class="text-slate-300 line-clamp-1">Playbook</span>
      </nav>

      <div class="flex flex-wrap gap-2 mb-5">
        <span class:list={['px-2.5 py-1 text-xs font-semibold rounded-full capitalize', trackColour]}>
          {playbook.data.track}
        </span>
        {playbook.data.gated && (
          <span class="px-2.5 py-1 text-xs font-medium text-slate-300 bg-white/10 rounded-full">
            Free download
          </span>
        )}
        {playbook.data.pages && (
          <span class="px-2.5 py-1 text-xs font-medium text-slate-300 bg-white/10 rounded-full">
            ~{playbook.data.pages} pages
          </span>
        )}
      </div>

      <h1 id="playbook-heading" class="font-display font-800 text-3xl sm:text-4xl lg:text-5xl text-white leading-tight text-balance">
        {playbook.data.title}
      </h1>
      <p class="mt-5 text-slate-300 text-lg leading-relaxed max-w-2xl">
        {playbook.data.previewExcerpt}
      </p>
    </div>
  </section>

  <!-- Topics strip -->
  {playbook.data.topics.length > 0 && (
    <div class="bg-navy-800 border-y border-white/10">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex flex-wrap gap-2">
          {playbook.data.topics.map(t => (
            <span class="px-2.5 py-1 text-xs font-medium text-slate-300 bg-white/10 rounded-full">{t}</span>
          ))}
        </div>
      </div>
    </div>
  )}

  <!-- Body + gate -->
  <div class="py-16 bg-white">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">

        <!-- Content -->
        <article class="lg:col-span-2 prose prose-slate prose-lg max-w-none
          prose-headings:font-display prose-headings:font-700 prose-headings:text-navy-900 prose-headings:tracking-tight
          prose-h2:text-2xl prose-h2:mt-10 prose-h3:text-xl
          prose-p:text-slate-700 prose-p:leading-relaxed
          prose-a:text-accent prose-a:no-underline hover:prose-a:underline
          prose-ul:text-slate-700 prose-li:my-0.5
          prose-strong:text-navy-900
          prose-ol:text-slate-700
        ">
          <Content />
        </article>

        <!-- Sticky gate -->
        <aside class="lg:col-span-1">
          <div class="sticky top-24">
            {playbook.data.gated ? (
              <PlaybookGate
                playbookId={playbook.id}
                playbookTitle={playbook.data.title}
                track={playbook.data.track}
                s3Key={playbook.data.s3Key}
              />
            ) : playbook.data.downloadUrl ? (
              <div class="p-6 bg-accent-50 border border-accent-100 rounded-xl text-center">
                <p class="font-display font-700 text-navy-900 mb-3">Download free</p>
                <a
                  href={playbook.data.downloadUrl}
                  class="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-dark text-white text-sm font-semibold rounded-lg transition-colors"
                  download
                >
                  Download PDF
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M7 2v7M4 6l3 3 3-3M2 11h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </a>
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  </div>

  <div class="bg-slate-50 border-t border-slate-100 py-8">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <a href="/training/playbooks" class="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-dark transition-colors">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M11 7H3M7 3L3 7L7 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Back to Playbooks
      </a>
    </div>
  </div>

  <CTASection
    headline="Want the full picture?"
    body="This playbook covers one domain. A discovery call can help you understand where your platform stands across ITSM, SAM Pro, CMDB, and AI — and what to prioritise."
    ctaLabel="Book a Discovery Call"
    secondaryLabel="View Services"
    secondaryHref="/services"
  />
</Layout>
```

- [ ] **Step 3: Build to verify**

```bash
npm run build 2>&1 | tail -6
```

Expected: 3 playbook pages rendered (`/training/playbooks/csdm-insurance-carriers/`, etc.) and `Complete!`

- [ ] **Step 4: Commit**

```bash
git add src/pages/training/playbooks/
git commit -m "feat: add playbooks index and detail pages"
```

---

## Task 11: Build workshops pages (index + detail)

**Files:**
- Create: `src/pages/training/workshops/index.astro`
- Create: `src/pages/training/workshops/[slug].astro`

- [ ] **Step 1: Create `src/pages/training/workshops/index.astro`**

```astro
---
import Layout from '../../../layouts/Layout.astro';
import WorkshopCard from '../../../components/WorkshopCard.astro';
import CTASection from '../../../components/CTASection.astro';
import { getCollection } from 'astro:content';

const allWorkshops = (await getCollection('workshops', ({ data }) => !data.draft))
  .sort((a, b) => (a.data.nextDate?.valueOf() ?? 0) - (b.data.nextDate?.valueOf() ?? 0));

const tracks = ['all', 'practitioner', 'leadership'] as const;
const selectedTrack = (Astro.url.searchParams.get('track') ?? 'all') as typeof tracks[number];

const filtered = selectedTrack === 'all'
  ? allWorkshops
  : allWorkshops.filter(w => w.data.track === selectedTrack);
---

<Layout
  title="Workshops — Flowcelerate Training"
  description="Live and in-house ServiceNow workshops for insurance and financial services teams. CMDB health, agentic automation, DORA strategy, and more."
>
  <section class="bg-navy-900 relative overflow-hidden" aria-labelledby="workshops-page-heading">
    <div class="absolute inset-0 grid-dots opacity-20 pointer-events-none" aria-hidden="true"></div>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
      <nav class="flex items-center gap-2 text-sm text-slate-400 mb-8" aria-label="Breadcrumb">
        <a href="/training" class="hover:text-white transition-colors">Training</a>
        <span aria-hidden="true">/</span>
        <span class="text-white" aria-current="page">Workshops</span>
      </nav>
      <div class="max-w-2xl">
        <h1 id="workshops-page-heading" class="font-display font-800 text-4xl sm:text-5xl text-white text-balance">
          Live workshops
        </h1>
        <p class="mt-5 text-slate-300 text-lg leading-relaxed">
          Hands-on virtual sessions for practitioners, and strategic workshops for IT leaders. Available as open-enrollment sessions or in-house for your team.
        </p>
      </div>
    </div>
  </section>

  <section class="py-16 bg-white" aria-labelledby="workshops-list-heading">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex flex-wrap gap-2 mb-10" role="group" aria-label="Filter by track">
        {tracks.map(t => (
          <a
            href={t === 'all' ? '/training/workshops' : `/training/workshops?track=${t}`}
            class:list={[
              'px-3.5 py-1.5 text-sm font-medium rounded-full border transition-colors capitalize',
              selectedTrack === t
                ? 'text-white bg-accent border-accent'
                : 'text-slate-600 border-slate-200 hover:border-accent/50 hover:text-accent'
            ]}
          >
            {t === 'all' ? 'All tracks' : t}
          </a>
        ))}
      </div>

      <h2 id="workshops-list-heading" class="sr-only">
        {selectedTrack === 'all' ? 'All workshops' : `${selectedTrack} workshops`}
      </h2>

      {filtered.length > 0 ? (
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map(w => (
            <WorkshopCard
              title={w.data.title}
              description={w.data.description}
              track={w.data.track}
              format={w.data.format}
              duration={w.data.duration}
              price={w.data.price}
              maxParticipants={w.data.maxParticipants}
              nextDate={w.data.nextDate}
              openEnrollment={w.data.openEnrollment}
              href={`/training/workshops/${w.id}`}
            />
          ))}
        </div>
      ) : (
        <p class="text-slate-500 py-16 text-center">No workshops found for this filter.</p>
      )}
    </div>
  </section>

  <CTASection
    headline="Need an in-house session?"
    body="All workshops can be run privately for your team — scoped to your platform, your regulatory context, and your specific challenges. Book a discovery call to discuss."
    ctaLabel="Book a Discovery Call"
    secondaryLabel="View Services"
    secondaryHref="/services"
  />
</Layout>
```

- [ ] **Step 2: Create `src/pages/training/workshops/[slug].astro`**

```astro
---
import Layout from '../../../layouts/Layout.astro';
import CTASection from '../../../components/CTASection.astro';
import { getCollection, render } from 'astro:content';

export async function getStaticPaths() {
  const workshops = await getCollection('workshops', ({ data }) => !data.draft);
  return workshops.map(w => ({ params: { slug: w.id }, props: { workshop: w } }));
}

const { workshop } = Astro.props;
const { Content } = await render(workshop);
const d = workshop.data;

const trackColour = d.track === 'practitioner'
  ? 'text-accent bg-accent-50'
  : 'text-teal bg-teal/10';

const formatLabel: Record<string, string> = {
  'live-virtual': 'Live virtual',
  'in-house': 'In-house only',
  'recorded': 'On-demand',
};

const nextDateFormatted = d.nextDate?.toLocaleDateString('en-GB', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
});
---

<Layout
  title={`${d.title} — Flowcelerate Workshops`}
  description={d.description}
>
  <!-- Hero -->
  <section class="bg-navy-900 relative overflow-hidden" aria-labelledby="workshop-heading">
    <div class="absolute inset-0 grid-dots opacity-20 pointer-events-none" aria-hidden="true"></div>
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
      <nav class="flex items-center gap-2 text-sm text-slate-400 mb-8" aria-label="Breadcrumb">
        <a href="/training" class="hover:text-white transition-colors">Training</a>
        <span aria-hidden="true">/</span>
        <a href="/training/workshops" class="hover:text-white transition-colors">Workshops</a>
        <span aria-hidden="true">/</span>
        <span class="text-slate-300 line-clamp-1">Workshop</span>
      </nav>

      <div class="flex flex-wrap gap-2 mb-5">
        <span class:list={['px-2.5 py-1 text-xs font-semibold rounded-full capitalize', trackColour]}>
          {d.track}
        </span>
        <span class="px-2.5 py-1 text-xs font-medium text-slate-300 bg-white/10 rounded-full">
          {formatLabel[d.format]}
        </span>
        <span class="px-2.5 py-1 text-xs font-medium text-slate-300 bg-white/10 rounded-full">
          {d.duration}
        </span>
        {d.openEnrollment && nextDateFormatted && (
          <span class="px-2.5 py-1 text-xs font-semibold text-emerald-300 bg-emerald-900/30 rounded-full border border-emerald-700/40">
            Next: {nextDateFormatted}
          </span>
        )}
      </div>

      <h1 id="workshop-heading" class="font-display font-800 text-3xl sm:text-4xl lg:text-5xl text-white leading-tight text-balance">
        {d.title}
      </h1>
      <p class="mt-5 text-slate-300 text-lg leading-relaxed max-w-2xl">{d.description}</p>
    </div>
  </section>

  <!-- Content + sidebar -->
  <div class="py-16 bg-white">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">

        <!-- Main content -->
        <div class="lg:col-span-2 space-y-10">

          <!-- Outcomes -->
          {d.outcomes.length > 0 && (
            <section aria-labelledby="outcomes-heading">
              <h2 id="outcomes-heading" class="font-display font-700 text-xl text-navy-900 mb-4">
                What you'll walk away with
              </h2>
              <ul class="space-y-2.5">
                {d.outcomes.map(o => (
                  <li class="flex items-start gap-3 text-sm text-slate-700">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="shrink-0 mt-0.5" aria-hidden="true">
                      <path d="M2 8L6 12L14 4" stroke="#2563eb" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    {o}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <!-- Topics -->
          {d.topics.length > 0 && (
            <section aria-labelledby="topics-heading">
              <h2 id="topics-heading" class="font-display font-700 text-xl text-navy-900 mb-4">Topics covered</h2>
              <div class="flex flex-wrap gap-2">
                {d.topics.map(t => (
                  <span class="px-2.5 py-1 text-sm font-medium text-slate-600 bg-slate-100 rounded-full">{t}</span>
                ))}
              </div>
            </section>
          )}

          <!-- Agenda -->
          {d.agenda && d.agenda.length > 0 && (
            <section aria-labelledby="agenda-heading">
              <h2 id="agenda-heading" class="font-display font-700 text-xl text-navy-900 mb-4">Session agenda</h2>
              <div class="space-y-2">
                {d.agenda.map((item, i) => (
                  <div class="flex gap-4 items-start p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span class="text-xs font-mono text-slate-400 shrink-0 pt-0.5 w-16">{item.time}</span>
                    <span class="text-sm text-navy-900 font-medium">{item.title}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <!-- Body content from markdown -->
          <div class="prose prose-slate max-w-none
            prose-headings:font-display prose-headings:font-700 prose-headings:text-navy-900
            prose-p:text-slate-700 prose-p:leading-relaxed
            prose-a:text-accent prose-a:no-underline hover:prose-a:underline
            prose-ul:text-slate-700 prose-li:my-0.5
            prose-strong:text-navy-900
          ">
            <Content />
          </div>
        </div>

        <!-- Booking sidebar -->
        <aside class="lg:col-span-1">
          <div class="sticky top-24 space-y-4">

            <!-- Pricing card -->
            <div class="p-5 bg-slate-50 border border-slate-200 rounded-xl">
              <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Price</p>
              <p class="font-display font-800 text-2xl text-navy-900">{d.price}</p>
              {d.maxParticipants && (
                <p class="text-xs text-slate-500 mt-1">Max {d.maxParticipants} participants</p>
              )}
            </div>

            <!-- Open enrollment CTA -->
            {d.openEnrollment && d.calendlyUrl && (
              <a
                href={d.calendlyUrl}
                target="_blank"
                rel="noopener noreferrer"
                class="block w-full text-center px-5 py-3 bg-accent hover:bg-accent-dark text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Book your place
                {nextDateFormatted && <span class="block text-xs font-normal opacity-80 mt-0.5">{nextDateFormatted}</span>}
              </a>
            )}

            <!-- In-house CTA -->
            <a
              href="/book"
              class="block w-full text-center px-5 py-3 border border-slate-200 hover:border-accent/40 text-navy-900 hover:text-accent text-sm font-semibold rounded-xl transition-colors"
            >
              Run this for your team
              <span class="block text-xs font-normal text-slate-400 mt-0.5">In-house · Book a scoping call</span>
            </a>
          </div>
        </aside>
      </div>
    </div>
  </div>

  <div class="bg-slate-50 border-t border-slate-100 py-8">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <a href="/training/workshops" class="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-dark transition-colors">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M11 7H3M7 3L3 7L7 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Back to Workshops
      </a>
    </div>
  </div>

  <CTASection />
</Layout>
```

- [ ] **Step 3: Build to verify**

```bash
npm run build 2>&1 | tail -8
```

Expected: `Complete!` with workshop pages rendered.

- [ ] **Step 4: Commit**

```bash
git add src/pages/training/workshops/
git commit -m "feat: add workshops index and detail pages"
```

---

## Task 12: Update Header and Footer

**Files:**
- Modify: `src/components/Header.astro`
- Modify: `src/components/Footer.astro`

- [ ] **Step 1: Update `src/components/Header.astro` — add Training to navLinks**

Find and replace the `navLinks` array at the top of the file:

```typescript
// OLD
const navLinks = [
  { href: '/services', label: 'Services' },
  { href: '/case-studies', label: 'Case Studies' },
  { href: '/insights', label: 'Insights' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

// NEW
const navLinks = [
  { href: '/services', label: 'Services' },
  { href: '/training', label: 'Training' },
  { href: '/case-studies', label: 'Case Studies' },
  { href: '/insights', label: 'Insights' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];
```

- [ ] **Step 2: Update `src/components/Footer.astro` — add Training column**

In `Footer.astro`, find the `services` and `company` arrays and the grid layout. Replace the grid section so it has three columns: Services, Training, Company.

Find this block:
```astro
      <!-- Services -->
      <div>
        <h3 class="font-display font-600 text-white text-sm uppercase tracking-wider mb-4">Services</h3>
```

And replace the entire three-column grid (Services + Company) with this four-column layout:

```astro
      <!-- Services -->
      <div>
        <h3 class="font-display font-600 text-white text-sm uppercase tracking-wider mb-4">Services</h3>
        <ul class="space-y-2.5">
          {services.map(({ href, label }) => (
            <li>
              <a href={href} class="text-sm text-slate-400 hover:text-white transition-colors">{label}</a>
            </li>
          ))}
        </ul>
      </div>

      <!-- Training -->
      <div>
        <h3 class="font-display font-600 text-white text-sm uppercase tracking-wider mb-4">Training</h3>
        <ul class="space-y-2.5">
          {[
            { href: '/training', label: 'Overview' },
            { href: '/training/practitioners', label: 'Practitioner Track' },
            { href: '/training/leaders', label: 'Leadership Track' },
            { href: '/training/playbooks', label: 'Playbooks' },
            { href: '/training/workshops', label: 'Workshops' },
          ].map(({ href, label }) => (
            <li>
              <a href={href} class="text-sm text-slate-400 hover:text-white transition-colors">{label}</a>
            </li>
          ))}
        </ul>
      </div>

      <!-- Company -->
      <div>
        <h3 class="font-display font-600 text-white text-sm uppercase tracking-wider mb-4">Company</h3>
        <ul class="space-y-2.5">
          {company.map(({ href, label }) => (
            <li>
              <a href={href} class="text-sm text-slate-400 hover:text-white transition-colors">{label}</a>
            </li>
          ))}
        </ul>
      </div>
```

Also update the grid class from `grid-cols-1 md:grid-cols-4` to `grid-cols-1 md:grid-cols-5` (Brand takes 2 cols, three content cols = 5 total). Find and replace:

```astro
<!-- OLD -->
<div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">

<!-- NEW -->
<div class="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
```

- [ ] **Step 3: Build and verify both changes**

```bash
npm run build 2>&1 | tail -4
```

Expected: `Complete!`

- [ ] **Step 4: Commit**

```bash
git add src/components/Header.astro src/components/Footer.astro
git commit -m "feat: add Training to site navigation and footer"
```

---

## Task 13: AWS infrastructure setup checklist

This task is infrastructure configuration, not code. Complete these in the AWS console before running the subscribe function in production.

- [ ] **Step 1: Create S3 bucket**

In AWS Console → S3:
- Bucket name: `flowcelerate-playbooks`
- Region: same as `FC_AWS_REGION` in `.env` (e.g. `eu-west-1`)
- Block all public access: **ON** (PDFs are served via pre-signed URLs only)
- Versioning: ON
- Upload placeholder PDFs as: `playbooks/csdm-insurance-carriers.pdf`, `playbooks/sam-pro-financial-services.pdf`, `playbooks/dora-cmdb-regulators.pdf`

- [ ] **Step 2: Verify SES domain**

In AWS Console → SES → Verified Identities:
- Click "Create identity" → Domain → enter `flowcelerate.com`
- Add the DKIM DNS records shown to your DNS provider
- Wait for status to change to "Verified" (usually 5–30 min)
- Also verify the sending email address: `hello@flowcelerate.com`
- If your account is in SES sandbox mode, also verify your own email address as a test recipient until production access is granted

- [ ] **Step 3: Request SES production access (if in sandbox)**

In AWS Console → SES → Account dashboard:
- If you see "Sandbox mode", click "Request production access"
- Fill in the form — describe the use case (transactional emails, opt-in playbook downloads)
- Production access typically granted within 24 hours

- [ ] **Step 4: Create DynamoDB table**

In AWS Console → DynamoDB → Create table:
- Table name: `flowcelerate-subscribers`
- Partition key: `email` (String)
- Sort key: `playbookId` (String)
- Capacity: On-demand (billing mode)
- No need to change other defaults

- [ ] **Step 5: Create IAM user with least-privilege policy**

In AWS Console → IAM → Users → Create user:
- Username: `flowcelerate-netlify-functions`
- Access type: Programmatic access only
- Attach this inline policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["ses:SendEmail", "ses:SendRawEmail"],
      "Resource": "*",
      "Condition": {
        "StringEquals": { "ses:FromAddress": "hello@flowcelerate.com" }
      }
    },
    {
      "Effect": "Allow",
      "Action": ["dynamodb:PutItem", "dynamodb:GetItem", "dynamodb:UpdateItem"],
      "Resource": "arn:aws:dynamodb:eu-west-1:*:table/flowcelerate-subscribers"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject"],
      "Resource": "arn:aws:s3:::flowcelerate-playbooks/playbooks/*"
    }
  ]
}
```

- Copy the Access Key ID and Secret Access Key
- Add them to `.env` as `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
- Add them to Netlify dashboard → Site → Environment variables (for production)

- [ ] **Step 6: Commit environment variable documentation**

```bash
git add .env   # .env is gitignored — this step just confirms the file is correct locally
echo "AWS infra setup complete"
```

---

## Task 14: Final build, smoke test, and server check

- [ ] **Step 1: Full build**

```bash
npm run build 2>&1 | tail -20
```

Expected: All pages render including `/training`, `/training/practitioners`, `/training/leaders`, `/training/playbooks`, `/training/workshops`, and individual slugs. `Complete!` with zero errors.

- [ ] **Step 2: Start dev server and verify all training routes return 200**

```bash
netlify dev --no-open &
sleep 6
node -e "
const http = require('http');
const paths = [
  '/training', '/training/practitioners', '/training/leaders',
  '/training/playbooks', '/training/workshops',
  '/training/playbooks/csdm-insurance-carriers',
  '/training/playbooks/sam-pro-financial-services',
  '/training/playbooks/dora-cmdb-regulators',
  '/training/workshops/cmdb-health-in-a-day',
  '/training/workshops/agentic-flow-in-servicenow',
];
let done = 0;
paths.forEach(p => {
  http.get('http://localhost:8888' + p, r => {
    console.log(r.statusCode + '  ' + p);
    if (++done === paths.length) process.exit(0);
  }).on('error', e => { console.log('ERR  ' + p); if(++done===paths.length)process.exit(0); });
});
"
```

Expected: All 10 paths return `200`.

- [ ] **Step 3: Test subscribe function (newsletter path — no S3 needed)**

```bash
node -e "
const http = require('http');
const body = JSON.stringify({
  name: 'Test User', email: 'your-verified-ses-email@example.com',
  playbookId: 'newsletter', playbookTitle: 'Newsletter',
  track: 'newsletter', s3Key: null, isNewsletter: true
});
const req = http.request({
  host: 'localhost', port: 8888,
  path: '/.netlify/functions/subscribe', method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => console.log(res.statusCode, d));
});
req.write(body); req.end();
"
```

Replace `your-verified-ses-email@example.com` with an email address verified in SES (if still in sandbox mode).

Expected: `200 {"success":true}` and an email arrives in that inbox.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: training section Phase 1 complete — playbooks, workshops, AWS email gate"
```

---

## Self-Review Notes

- All content uses `entry.id` (Astro v5 glob loader pattern) — consistent with existing blog pages ✓
- `subscribe.ts` uses `FC_AWS_REGION` prefix to avoid conflict with Netlify's injected `AWS_REGION` ✓
- All user-supplied text written via `textContent` / Astro template expressions — no `innerHTML` with external data ✓
- `PlaybookGate` uses `define:vars` to pass frontmatter data to client script — Astro's safe mechanism for this ✓
- DynamoDB PK=email + SK=playbookId allows same subscriber to download multiple playbooks without collision ✓
- SES `SendEmail` Condition restricts to the verified sending address — limits blast radius if key is compromised ✓
- `NewsletterSignup` sends `isNewsletter: true` which skips the S3 pre-signed URL path cleanly ✓
