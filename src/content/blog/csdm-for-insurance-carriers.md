---
title: "Why CSDM Is the Foundation Every Insurance Carrier's ServiceNow Platform Needs"
description: "Without a properly implemented Common Service Data Model, insurance carriers find their CMDB becomes an expensive liability instead of a strategic asset. Here's how to get it right."
pubDate: 2025-04-15
tags: ["CMDB", "CSDM", "Insurance", "Architecture"]
readingTime: 8
---

Insurance carriers operate some of the most complex IT estates in any industry. Thousands of applications span claims processing, policy administration, reinsurance treaty management, actuarial modelling, and regulatory reporting — many of which are decades old and undocumented. When these organisations implement ServiceNow, the CMDB is almost always the first thing to get deprioritised, and the last thing to pay off.

That's a mistake with compounding consequences.

## The Real Cost of a Broken CMDB in Financial Services

In a Lloyd's of London syndicate or a tier-one P&C carrier, a degraded CMDB doesn't just slow down incident resolution. It actively undermines compliance obligations:

- **Solvency II** requires demonstrable understanding of operational dependencies across critical business services
- **DORA** (Digital Operational Resilience Act) mandates ICT risk management with documented service maps
- **PRA/FCA supervision** increasingly scrutinises the adequacy of operational resilience testing — which you cannot do without a reliable service topology

A CMDB that lacks authoritative relationship data isn't just a tooling problem. It's a regulatory exposure.

## CSDM: What It Is and Why It Matters

The Common Service Data Model is ServiceNow's prescriptive framework for structuring CMDB data around business services rather than raw technical inventory. Implemented properly, CSDM creates a shared language between IT operations, application teams, and the business.

The four key layers are:

1. **Business Application** — maps to a business function (e.g., "Motor Claims Processing")
2. **Application Service** — the logical grouping of technical components delivering that function
3. **Technical Service** — how infrastructure supports the application service
4. **Offering** — how the business consumes IT services through the service catalogue

In my experience, most insurance carriers operate somewhere between CSDM 2.0 and 3.0 maturity. The gap is almost always at the Application Service layer — teams can articulate their business applications and their servers, but the connective tissue between them is absent.

## A Pragmatic Approach to CSDM Implementation

The temptation is to boil the ocean — capture everything, model every relationship, get to 100% completeness before going live. This reliably fails.

The approach that works:

**1. Anchor on your critical business services first.** For an insurance carrier, this typically means claims, policy issuance, and finance settlement. Define those four or five Application Services with precision before touching anything else.

**2. Use Discovery + Service Mapping together.** Discovery populates the technical CMDB. Service Mapping builds the application topology from the network layer upward. Running them independently creates gaps that are painful to reconcile later.

**3. Establish data ownership, not just data.** Every CI class needs a designated owner responsible for data quality. Without accountability, the CMDB drifts within six months of go-live.

**4. Integrate with Change Management from day one.** The CMDB's value is realised when change records carry accurate CI relationships and can surface downstream risk. This requires both process design and technical configuration.

## What Good Looks Like

A mature CSDM implementation in a financial services context will support:

- Impact analysis for proposed changes before they're approved
- Automated critical business service health dashboards
- DORA/Solvency II operational resilience reporting from live CMDB data rather than manual spreadsheets
- AI-assisted root cause analysis that can traverse service relationships to pinpoint likely failure origins

The investment is substantial. The payoff — in reduced MTTR, improved change success rates, and demonstrable regulatory compliance — typically justifies it within eighteen months.

---

*If your organisation is planning a CSDM implementation or struggling with an existing one, I'd be glad to discuss the specifics. [Book a discovery call](/book) to talk through your situation.*
