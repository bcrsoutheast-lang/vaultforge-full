import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSessionEmailFromRequest } from "../../../lib/vaultforge-session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return { url, key };
}

function makeThreadId(senderEmail: string, recipientEmail: string, dealId: string | null) {
  const people = [senderEmail.toLowerCase(), recipientEmail.toLowerCase()].sort().join("|");
  return crypto.createHash("sha256").update(`${dealId || "general"}|${people}`).digest("hex").slice(0, 32);
}

export async function POST(req: Request) {
  const config = getSupabaseConfig();
  if (!config) return NextResponse.json({ error: "Supabase environment variables are missing." }, { status: 500 });

  const senderEmail = getSessionEmailFromRequest(req);
  if (!senderEmail) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const body = await req.json();
  const recipientEmail = String(body?.recipient_email || "").trim().toLowerCase();
  const subject = String(body?.subject || "VaultForge message").trim();
  const message = String(body?.message || "").trim();
  const dealId = String(body?.deal_id || "").trim() || null;
  const incomingThreadId = String(body?.thread_id || "").trim();

  if (!recipientEmail || !message) return NextResponse.json({ error: "Recipient and message are required." }, { status: 400 });

  const threadId = incomingThreadId || makeThreadId(senderEmail, recipientEmail, dealId);

  const res = await fetch(`${config.url}/rest/v1/vf_messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      Prefer: "return=representation",
    },
    body: JSON.stringify({ thread_id: threadId, sender_email: senderEmail, recipient_email: recipientEmail, subject, message, deal_id: dealId, archived: false, read: false }),
  });

  if (!res.ok) return NextResponse.json({ error: "Failed to send message.", details: await res.text() }, { status: 500 });

  const saved = await res.json();
  return NextResponse.json({ ok: true, message: saved?.[0] || null, thread_id: threadId });
}
