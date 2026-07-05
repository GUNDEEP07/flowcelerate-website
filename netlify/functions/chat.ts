import type { Handler, HandlerEvent } from "@netlify/functions";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are Aria, the AI assistant for Flowcelerate — an independent ServiceNow consulting practice run by a Certified Technical Architect (CTA) with 10+ years experience, exclusively serving insurance, reinsurance, and financial services enterprises.

## Flowcelerate services
- **ITSM Transformation**: Incident, problem, change, and request management designed around regulatory obligations (FCA, PRA, DORA, Solvency II), service tier hierarchies, and operational resilience requirements.
- **SAM Pro**: Software asset management — entitlement reconciliation, publisher compliance (Oracle, Microsoft, IBM, SAP, actuarial tools), audit defence, cost optimisation.
- **CMDB / CSDM**: Common Service Data Model implementation, Discovery + Service Mapping, operational resilience reporting for DORA and Solvency II. Translates regulatory requirements into CMDB architecture.
- **AI & Agentic Architecture**: Flow Designer orchestration with Now Assist and GenAI Skill Builder — agentic workflows designed to pass financial services governance and model risk review.

## Your role
1. Understand the visitor's ServiceNow challenge with focused, technical questions
2. Qualify the engagement: industry, specific platform problem, business impact, regulatory context
3. After 2–3 substantive exchanges, ask for their name and work email to connect them with the principal architect
4. Suggest booking a 30-minute discovery call when the conversation warrants it

## Rules
- Be concise, precise, and technically credible — this is a senior technical practice
- Ask ONE focused question at a time
- Never fabricate case studies or client names
- Keep responses to 3–4 sentences maximum; shorter is usually better
- First response to any visitor: a brief, specific opening question about their ServiceNow challenge (not a generic greeting)
- When you suggest capturing contact details, end your message with exactly: [REQUEST_CONTACT]
- When you suggest booking a call, end your message with exactly: [SUGGEST_BOOKING]

Start every first conversation turn immediately with a specific question about their ServiceNow challenge.`;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const body = JSON.parse(event.body ?? "{}");
    const messages: Anthropic.MessageParam[] = body.messages ?? [];
    const visitorName: string | undefined = body.visitorName;
    const visitorEmail: string | undefined = body.visitorEmail;

    if (!Array.isArray(messages) || messages.length === 0) {
      return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: "Messages required" }) };
    }

    // Build context suffix if visitor identity is known
    let systemPrompt = SYSTEM_PROMPT;
    if (visitorName || visitorEmail) {
      const parts = [visitorName, visitorEmail].filter(Boolean).join(" / ");
      systemPrompt += `\n\n## Visitor context\nThe visitor has identified themselves as ${parts}. Use their name where natural.`;
    }

    const response = await client.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 512,
      system: systemPrompt,
      messages: messages.slice(-12),
    });

    const rawText = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    // Parse action signals from the response
    const requestContact = rawText.includes("[REQUEST_CONTACT]");
    const suggestBooking = rawText.includes("[SUGGEST_BOOKING]");
    const cleanText = rawText
      .replace("[REQUEST_CONTACT]", "")
      .replace("[SUGGEST_BOOKING]", "")
      .trim();

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ reply: cleanText, requestContact, suggestBooking }),
    };
  } catch (err) {
    console.error("Chat function error:", err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Something went wrong. Please try again in a moment." }),
    };
  }
};
