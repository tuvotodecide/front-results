import { SendEmailCommand, SESClient } from "@aws-sdk/client-ses";
import { NextRequest, NextResponse } from "next/server";
import {
  createRuntimeErrorEmailHtml,
  createRuntimeErrorTextEmail,
} from "@/shared/error-reporting/emailContent";
import {
  sanitizePayload,
  truncateString,
} from "@/shared/error-reporting/sanitize";
import type { RuntimeErrorPayload } from "@/shared/error-reporting/types";

export const runtime = "nodejs";

const MAX_PAYLOAD_BYTES = 64 * 1024;
const SERVER_COOLDOWN_MS = 5 * 60 * 1000;
const sentSignatures = new Map<string, number>();

const requiredSesEnv = [
  "ERROR_ALERT_EMAIL_TO",
  "SES_REGION",
  "SES_ACCESS_KEY_ID",
  "SES_SECRET_ACCESS_KEY",
  "SES_FROM_MAIL",
] as const;

const getMissingSesEnv = (): string[] =>
  requiredSesEnv.filter((key) => !process.env[key]);

const shouldSendOnServer = (signature: string): boolean => {
  const now = Date.now();
  const lastSentAt = sentSignatures.get(signature);
  if (lastSentAt && now - lastSentAt < SERVER_COOLDOWN_MS) return false;

  sentSignatures.set(signature, now);
  return true;
};

const parsePayload = (rawBody: string): RuntimeErrorPayload | null => {
  try {
    const parsed = JSON.parse(rawBody) as RuntimeErrorPayload;
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.error?.message || !parsed.context?.timestamp || !parsed.signature) {
      return null;
    }

    return sanitizePayload(parsed);
  } catch {
    return null;
  }
};

const sendEmail = async (payload: RuntimeErrorPayload): Promise<void> => {
  const client = new SESClient({
    region: process.env.SES_REGION || "",
    credentials: {
      accessKeyId: process.env.SES_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.SES_SECRET_ACCESS_KEY || "",
    },
  });

  await client.send(
    new SendEmailCommand({
      Destination: {
        ToAddresses: [process.env.ERROR_ALERT_EMAIL_TO || ""],
      },
      Source: process.env.SES_FROM_MAIL || "",
      Message: {
        Subject: {
          Charset: "UTF-8",
          Data: `[Frontend Admin] Runtime error detected`,
        },
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: truncateString(
              createRuntimeErrorEmailHtml(payload, process.env.EMAIL_LOGO_URL || ""),
              MAX_PAYLOAD_BYTES,
            ),
          },
          Text: {
            Charset: "UTF-8",
            Data: truncateString(
              createRuntimeErrorTextEmail(payload),
              MAX_PAYLOAD_BYTES,
            ),
          },
        },
      },
    }),
  );
};

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ status: "rejected", reason: "payload_too_large" }, { status: 413 });
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ status: "rejected", reason: "payload_too_large" }, { status: 413 });
  }

  const payload = parsePayload(rawBody);
  if (!payload) {
    return NextResponse.json({ status: "rejected", reason: "invalid_payload" }, { status: 400 });
  }

  const missingEnv = getMissingSesEnv();
  if (missingEnv.length > 0) {
    return NextResponse.json(
      { status: "disabled", reason: "missing_email_configuration", missingEnv },
      { status: 202 },
    );
  }

  if (!shouldSendOnServer(payload.signature)) {
    return NextResponse.json({ status: "suppressed", reason: "cooldown" }, { status: 202 });
  }

  try {
    await sendEmail(payload);
    return NextResponse.json({ status: "sent" }, { status: 202 });
  } catch (error) {
    console.error("Frontend runtime error email failed", error);
    return NextResponse.json(
      { status: "failed", reason: "email_send_failed" },
      { status: 502 },
    );
  }
}
