import type { Handler, HandlerEvent } from "@netlify/functions";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const REGION     = process.env.FC_AWS_REGION ?? "eu-west-1";
const BUCKET     = process.env.FC_S3_BUCKET  ?? "flowcelerate-playbooks";
const TABLE      = process.env.FC_DDB_TABLE  ?? "flowcelerate-subscribers";
const FROM_EMAIL = process.env.FC_SES_FROM   ?? "hello@flowcelerate.com";

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
      playbookTitle = "Flowcelerate Playbook",
      track = "practitioner",
      s3Key,
      isNewsletter = false,
    } = JSON.parse(event.body ?? "{}");

    if (!email || !playbookId) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Email and playbookId are required." }) };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Please enter a valid email address." }) };
    }

    const normalEmail = String(email).toLowerCase().trim();
    const normalName  = String(name).trim();

    // Store in DynamoDB — PK=email, SK=playbookId (one row per playbook downloaded)
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

    // Newsletter-only: no PDF, just send confirmation
    if (isNewsletter || !s3Key) {
      await ses.send(new SendEmailCommand({
        Source:      `Flowcelerate <${FROM_EMAIL}>`,
        Destination: { ToAddresses: [normalEmail] },
        Message: {
          Subject: { Data: "You're subscribed to Flowcelerate Insights" },
          Body: {
            Html: { Data: confirmationEmail(normalName) },
            Text: { Data: confirmationText(normalName) },
          },
        },
      }));
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true }) };
    }

    // Playbook: generate pre-signed S3 URL (7-day expiry)
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
          Html: { Data: playbookEmail(normalName, String(playbookTitle), presignedUrl) },
          Text: { Data: playbookText(normalName, String(playbookTitle), presignedUrl) },
        },
      },
    }));

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true }) };

  } catch (err) {
    console.error("Subscribe error:", err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "Something went wrong. Please try again in a moment." }) };
  }
};

// ── Email templates ───────────────────────────────────────────────────────

function playbookEmail(name: string, title: string, url: string): string {
  const hi = name ? `Hi ${name},<br><br>` : "";
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#1e293b;">
  <p style="font-size:20px;font-weight:700;color:#0a1628;margin:0 0 24px;">Flowcelerate</p>
  <h1 style="font-size:18px;font-weight:700;color:#0a1628;margin:0 0 8px;">Your playbook is ready</h1>
  <p style="font-size:15px;line-height:1.6;color:#475569;margin:0 0 24px;">${hi}Here's your copy of <strong>${title}</strong>. The link below is valid for 7 days.</p>
  <a href="${url}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;margin-bottom:24px;">Download playbook →</a>
  <p style="font-size:13px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:16px;margin-top:24px;">
    You requested this playbook from <a href="https://flowcelerate.com" style="color:#2563eb;">flowcelerate.com</a>. You'll occasionally receive insights on ServiceNow for insurance &amp; financial services.
  </p>
</div>`;
}

function playbookText(name: string, title: string, url: string): string {
  const hi = name ? `Hi ${name},\n\n` : "";
  return `${hi}Your copy of "${title}" is ready.\n\nDownload it here (expires in 7 days):\n${url}\n\n---\nFlowcelerate · ServiceNow for insurance & financial services\nhttps://flowcelerate.com`;
}

function confirmationEmail(name: string): string {
  const hi = name ? `Hi ${name},<br><br>` : "";
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#1e293b;">
  <p style="font-size:20px;font-weight:700;color:#0a1628;margin:0 0 24px;">Flowcelerate</p>
  <h1 style="font-size:18px;font-weight:700;color:#0a1628;margin:0 0 8px;">You're subscribed</h1>
  <p style="font-size:15px;line-height:1.6;color:#475569;margin:0 0 16px;">${hi}You'll receive monthly insights on ServiceNow architecture for insurance and financial services — CMDB, ITSM, SAM Pro, and AI.</p>
  <a href="https://flowcelerate.com/insights" style="display:inline-block;padding:12px 24px;background:#2563eb;color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Browse recent insights →</a>
</div>`;
}

function confirmationText(name: string): string {
  const hi = name ? `Hi ${name},\n\n` : "";
  return `${hi}You're subscribed to Flowcelerate Insights — ServiceNow for insurance & financial services.\n\nhttps://flowcelerate.com/insights`;
}
