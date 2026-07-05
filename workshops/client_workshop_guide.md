# Flowcelerate — Client Workshop Delivery Guide

This guide contains the detailed scripts, slide outlines, lab exercises, and participant worksheets needed to host and deliver the two core Flowcelerate workshops.

---

# Workshop 1: CMDB Health in a Day (3 Hours)
*   **Track:** Practitioner
*   **Ideal Audience:** ServiceNow Administrators, CMDB Owners, IT Operations Directors.

## 1. Timeline & Facilitator Guide

```mermaid
gantt
    title CMDB Health in a Day Timeline
    dateFormat  X
    axisFormat %H:%M
    section Welcome & Setup
    Part 1: Health Metrics Overview : 0, 20
    section Hands-On Lab
    Part 2: Dashboard Config : 20, 50
    Part 3: Data Audit Lab : 50, 90
    Break : 90, 100
    section Discovery & Governance
    Part 4: Discovery Config : 100, 130
    Part 5: CI Ownership Model : 130, 160
    Part 6: Roadmap Planning : 160, 180
```

---

## 2. Slide Outline

### Slide 1: Welcome & Objectives
*   **Title:** CMDB Health in a Day: Restoring Integrity to Your Estate
*   **Bullets:**
    *   **Focus:** Outcomes over theory. We are mapping actual data today.
    *   **Objective:** Leave with a working dashboard configuration and a prioritized 30-day remediation roadmap.
    *   **House Rules:** This is interactive. Share screenshots of configuration blocks in the chat when you get stuck.

### Slide 2: The Three Dimensions of CMDB Health
*   **Title:** CMDB Health: Completeness, Compliance, and Correctness
*   **Bullets:**
    *   **Completeness:** Do we have all CIs, and are critical attributes (e.g., owner, environment) populated?
    *   **Compliance:** Do CIs conform to naming rules, required templates, and regulatory tags?
    *   **Correctness:** Are CIs duplicate-free, orphaned-free, and mapped to active infrastructure?

### Slide 3: Configuring Dashboard Thresholds
*   **Title:** Setting Business-Aligned KPI Limits
*   **Bullets:**
    *   *Textbook rules do not match financial systems.*
    *   **Duplicates threshold:** Set to **0** for critical application servers.
    *   **Orphaned CIs:** Classify any virtual host with no active hypervisor connection.
    *   **Staleness:** Define staleness limits based on environment (e.g., 7 days for production virtual machines, 30 days for offline laptops).

---

## 3. Hands-On Exercises & Lab Guide

### Lab Exercise A: Configuring Health Dashboard Metrics
1.  **Navigate:** In your instance, search for **CMDB Dashboard > Health Preferences**.
2.  **Edit Duplicate Metric:**
    *   Click on **Correctness > Duplicate CIs**.
    *   Add a filter condition: `CI Class IS a Windows Server OR Unix Server`.
    *   Set the Duplicate Threshold to `1`.
3.  **Setup Staleness Rules:**
    *   Click on **Correctness > Stale CIs**.
    *   Configure a rule where `CI Class IS Application Service AND Days Since Last Discovery Update > 14`.
4.  **Verify:** Run the health evaluator job `[CMDB Health] Correctness Evaluator` and check the updated scorecard.

### Participant Worksheet: CI Ownership Matrix
*Participants use this table to map critical platform responsibilities during the workshop.*

| CI Class | Discovery Owner | Business Owner | Recovery Team (SLA) |
| :--- | :--- | :--- | :--- |
| **Application Service** | IT Ops Engineering | Line of Business Lead | Operational Resilience Team |
| **Linux / Unix Server** | Infrastructure Admin | SysOps Team Lead | Infrastructure On-Call |
| **Database Instance** | Database Administrator | DBA Manager | DBA Escalation Desk |

---
---

# Workshop 2: Building Your First Agentic Flow (3 Hours)
*   **Track:** Practitioner (ServiceNow Developers & Architects)
*   **Ideal Audience:** Platform Developers, GenAI Engineers, IT Security Leads.

## 1. Timeline & Facilitator Guide

```mermaid
gantt
    title Building Your First Agentic Flow Timeline
    dateFormat  X
    axisFormat %H:%M
    section Core Concepts
    Part 1: Agentic Automation vs Rules : 0, 20
    section Live Build
    Part 2: Skill Builder Prompting : 20, 50
    Part 3: Action Execution Build : 50, 90
    Break : 90, 100
    section Governance
    Part 4: Wiring the Orchestrator : 100, 130
    Part 5: Human-in-the-Loop Checks : 130, 160
    Part 6: Model Risk Checklist : 160, 180
```

---

## 2. Slide Outline

### Slide 1: Welcome & Objectives
*   **Title:** Building Governed Agentic Workflows in ServiceNow
*   **Bullets:**
    *   **Focus:** Wiring GenAI actions that pass strict financial risk reviews.
    *   **Objective:** Build a working Now Assist prompt skill, configure fallback logic, and set up the human-in-the-loop (HITL) approval step.

### Slide 2: Why Rule-Based Workflows Break in AI Triage
*   **Title:** Prompting vs. Scripting
*   **Bullets:**
    *   **Legacy:** If-else loops fail when parsing unstructured claims emails.
    *   **Agentic:** AI extracts context and intent, but requires **grounding constraints** so it does not hallucinate answers.
    *   **The Guardrail:** AI must suggest values, but humans must sign off before execution.

---

## 3. Hands-On Exercises & Lab Guide

### Lab Exercise B: Configuring Now Assist Skill Builder
1.  **Navigate:** Go to **GenAI Controller > Skill Builder**.
2.  **Create New Skill:** Click **New Skill**, set Name to `Bordereau Claim Triage Skill`.
3.  **Write the Grounded System Prompt:** Copy the prompt below into the prompt config block:
    ```text
    Role: You are a ServiceNow assistant triage agent.
    Task: Analyze incoming insurance claim emails and extract:
      1. Policy Number (Format: POL-XXXXXX)
      2. Claim Value (Numerical estimation)
      3. Primary Business Line (Property, Casualty, Marine)
    Constraint: Only output valid JSON. Do not hallucinate data. If Policy Number is not present, return "UNKNOWN".
    ```
4.  **Test:** Provide a mock email input and verify the generated JSON output is structured correctly.

### Lab Exercise C: Wiring Flow Designer Human-in-the-Loop Fallback
1.  **Create Flow:** In **Flow Designer**, create a new flow triggered on `Incident Created`.
2.  **Add AI Action:** Drag your `Bordereau Claim Triage Skill` action into step 1.
3.  **Add Script Validation:** Drag a Script Step into step 2:
    ```javascript
    (function execute(inputs, outputs) {
      var aiOutput = JSON.parse(inputs.aiResultString);
      outputs.confidenceScore = (aiOutput.PolicyNumber === "UNKNOWN") ? 0.3 : 0.95;
    })(inputs, outputs);
    ```
4.  **Add Conditional Gate:**
    *   `IF confidenceScore < 0.85` $\rightarrow$ Trigger a **ServiceNow User Approval Action** routing the record to the Claims Supervisor Queue for manual verification.
    *   `ELSE` $\rightarrow$ Auto-update the Incident record with the extracted details.

---

## 4. Model Risk Compliance Checksheet
*This checklist must be filled out by the platform architect before putting any GenAI flow into production.*

*   [ ] **Prompt Grounding Verified:** Are system prompts restricted to using only internal ServiceNow knowledge resources?
*   [ ] **PII Masking Active:** Are email strings scrubbed of credit card numbers or medical histories before hitting the LLM API?
*   [ ] **Human Oversight Active:** Is every transaction with a confidence score $< 90\%$ routed to a human queue?
*   [ ] **Audit Log Configured:** Is every LLM output string stored in the `sys_audit` table along with the confidence score and the final human approval state?
