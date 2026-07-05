---
title: "Beyond RPA: Building Genuine AI-Assisted Workflows in ServiceNow for Reinsurance Operations"
description: "Flow Designer and Now Assist together unlock agentic automation that goes well beyond scripted RPA. Here's what's actually possible in a reinsurance context — and the architectural decisions that determine whether it holds up in production."
pubDate: 2025-05-20
tags: ["Flow Designer", "AI", "Automation", "Reinsurance", "Now Assist"]
readingTime: 10
---

Reinsurance operations are characterised by high-complexity, low-volume transactions — treaty negotiations, bordereau processing, catastrophe loss aggregations — that don't fit neatly into the low-code automation patterns that work well in retail insurance or standard ITSM. For years, the answer was robotic process automation: brittle, maintenance-heavy scripts that broke every time an upstream system changed its screen layout.

ServiceNow's Flow Designer, combined with Now Assist and the GenAI framework, opens up a genuinely different class of automation. Not better RPA — a different paradigm.

## What Agentic Automation Means in Practice

The distinction worth drawing is between *workflow automation* and *agentic automation*:

- **Workflow automation** executes a deterministic sequence of steps. If step 3 fails, you handle the exception explicitly. Flow Designer has always been good at this.
- **Agentic automation** uses a model to reason about a goal, decide which tools to invoke, handle unexpected states, and produce an output — with human review at defined checkpoints.

For a reinsurance operation, agentic patterns are relevant for:

- **Bordereau triage** — ingesting facultative reinsurance bordereaus, identifying anomalies against treaty terms, routing exceptions to underwriting analysts with a structured summary
- **Loss reserve commentary** — drafting actuary-ready commentary on IBNR movements based on structured loss data and prior commentary patterns
- **Treaty change impact analysis** — when a cedant proposes amended terms, analysing the historical bordereau data to model exposure delta

None of these are tasks you'd describe to a Flow Designer trigger with a fixed action sequence. They require contextual reasoning.

## The Architecture That Works

The pattern I've implemented across several financial services clients combines three ServiceNow capabilities:

### 1. Flow Designer as the Orchestration Layer

Flow Designer remains the right home for orchestration — it provides audit trail, governance, approval routing, and integration with the rest of the ServiceNow platform. What changes is that individual steps within a flow can now call GenAI actions rather than executing purely deterministic logic.

The critical design principle: **keep GenAI actions narrow and bounded**. A GenAI action that "processes the bordereau" is untestable and unmaintainable. A GenAI action that "extracts structured claim fields from a bordereau PDF section and returns JSON" is testable, auditable, and replaceable.

### 2. Now Assist Skill Builder for Domain-Specific Models

The Skill Builder lets you configure the grounding context, system prompt, and output schema for each GenAI action. For reinsurance, this means:

- Loading treaty term summaries as grounding documents
- Structuring prompts that reference company-specific loss aggregation conventions
- Defining strict JSON output schemas so downstream flow steps can process results deterministically

Getting the system prompt right is where most implementations fail. Vague instructions produce inconsistent outputs that undermine trust in the automation.

### 3. Human-in-the-Loop Checkpoints via Approval Actions

For any AI-assisted output that informs a financial decision, a human review step is non-negotiable — both from a risk management perspective and to comply with emerging AI governance obligations under Solvency II and the FCA's AI principles.

Flow Designer's approval actions are purpose-built for this. The design pattern I recommend: the AI produces a structured output with a confidence indicator; low-confidence outputs route to a senior analyst; high-confidence outputs go to a lighter-touch review queue with a 24-hour auto-approval window.

## What to Measure

Agentic automations in production require a different set of KPIs than traditional workflow automation:

| Metric | Why It Matters |
|--------|---------------|
| Human override rate | High override rate signals poor prompt quality or misaligned grounding |
| Time-to-review vs. time-to-decision | Distinguishes throughput gains from process delays |
| AI output accuracy (sampled) | Spot-check a random sample weekly; track accuracy over time |
| Exception escalation rate | Should decrease as the model improves with better grounding |

## The Honest Limitations

GenAI in ServiceNow is maturing rapidly, but there are current constraints worth naming:

- **Context window limits** constrain how much treaty documentation you can ground each request. For complex multi-year treaties, you'll need a retrieval strategy.
- **Latency** for complex reasoning tasks can be 10–15 seconds. Design your UX and SLAs accordingly.
- **Auditability** requirements in regulated industries mean you need to log both the prompt and the model response for every production invocation — not just the final output.

The platforms that navigate these constraints well are the ones that treat AI automation as a first-class engineering concern, not a configuration exercise.

---

*If you're evaluating agentic automation for your ServiceNow platform and want to discuss what's realistic for your specific use case, [book a call](/book).*
