import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Payload = Record<string, any>;
const TABLES = ["vf_messages", "simple_messages", "messages"];
function clean(value: unknown) { return String(value || "").trim(); }
function cleanEmail(value: unknown) { return clean(value).toLowerCase(); }
function env(name: string) { return process.env[name] || ""; }
function supabase() {
  const url = env("NEXT_PUBLIC_SUPABASE_URL");
  const key = env("SUPABASE_SERVICE_ROLE_KEY") || env("NEXT_PUBLIC_SUPABASE_ANON_KEY") || env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
function makeThreadId(payload: Payload) {
  const existing = clean(payload.thread_id || payload.threadId); if (existing) return existing;
  const signalId = clean(payload.signal_id || payload.signalId);
  const itemId = clean(payload.item_id || payload.itemId || payload.pain_id || payload.project_id);
  const source = clean(payload.source || payload.message_type || "message").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  if (signalId) return `${source}-${signalId}`;
  if (itemId) return `${source}-${itemId}`;
  return `general-${Date.now()}`;
}
function normalize(input: Payload) {
  const fromEmail = cleanEmail(input.from_email || input.sender_email || input.email || input.member_email || input.user_email);
  const toEmail = cleanEmail(input.to_email || input.recipient_email || input.target_email || input.owner_email || input.reply_to_email || "owner@vaultforge.local");
  const signalId = clean(input.signal_id || input.signalId);
  const itemId = clean(input.item_id || input.itemId || input.pain_id || input.project_id || input.deal_id);
  const source = clean(input.source || input.type || input.context || "message");
  const subject = clean(input.subject || input.title || "VaultForge message");
  const message = clean(input.message || input.body || input.note || input.content);
  const threadId = makeThreadId({ ...input, from_email: fromEmail, to_email: toEmail, signal_id: signalId, item_id: itemId, source });
  return {
    thread_id: threadId, from_email: fromEmail, sender_email: fromEmail, to_email: toEmail, recipient_email: toEmail, target_email: toEmail, owner_email: toEmail,
    signal_id: signalId || null, item_id: itemId || null, source, message_type: source, subject, title: subject, message, body: message, note: message,
    status: clean(input.status || "open"), is_archived: false, is_deleted: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    metadata: { ...(typeof input.metadata === "object" && input.metadata ? input.metadata : {}), thread_id: threadId, signal_id: signalId || null, item_id: itemId || null, source, from_email: fromEmail, to_email: toEmail, subject }
  };
}
function fallbackRows(email: string) { return [{ id: "local-welcome", thread_id: "general-welcome", from_email: "system@vaultforge.local", to_email: email || "member@vaultforge.local", subject: "VaultForge message center ready", message: "Messages will appear here when you contact an owner, request information, or reply to a signal.", source: "general", status: "open", signal_id: null, item_id: null, created_at: new Date().toISOString(), metadata: {} }]; }
export async function GET(request: Request) {
  const url = new URL(request.url); const email = cleanEmail(url.searchParams.get("email") || request.headers.get("x-vf-email"));
  const threadId = clean(url.searchParams.get("thread_id") || url.searchParams.get("threadId")); const source = clean(url.searchParams.get("source"));
  const client = supabase(); if (!client) return NextResponse.json({ ok: true, source: "fallback-no-supabase", messages: fallbackRows(email), threads: fallbackRows(email) });
  for (const table of TABLES) {
    try {
      let query = client.from(table).select("*").order("created_at", { ascending: false }).limit(250);
      if (threadId) query = query.eq("thread_id", threadId); if (source) query = query.eq("source", source);
      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        const rows = data.filter((row: any) => {
          const deleted = row?.is_deleted === true || String(row?.status || "").toLowerCase() === "deleted"; if (deleted) return false;
          if (!email) return true;
          const from = cleanEmail(row?.from_email || row?.sender_email || row?.member_email); const to = cleanEmail(row?.to_email || row?.recipient_email || row?.target_email || row?.owner_email); const visible = cleanEmail(row?.visible_to_email || row?.email);
          return from === email || to === email || visible === email || to === "owner@vaultforge.local";
        });
        return NextResponse.json({ ok: true, table, messages: rows, threads: rows });
      }
    } catch {}
  }
  return NextResponse.json({ ok: true, source: "fallback-empty", messages: fallbackRows(email), threads: fallbackRows(email) });
}
export async function POST(request: Request) {
  let body: Payload = {}; try { body = await request.json(); } catch { body = {}; }
  const row = normalize(body);
  if (!row.from_email) return NextResponse.json({ ok: false, error: "Missing sender email." }, { status: 400 });
  if (!row.message) return NextResponse.json({ ok: false, error: "Missing message." }, { status: 400 });
  const client = supabase(); if (!client) return NextResponse.json({ ok: true, saved: false, fallback: true, message: "Message accepted locally. Supabase client not configured.", thread_id: row.thread_id, row });
  let lastError = "";
  for (const table of TABLES) {
    try { const { data, error } = await client.from(table).insert(row).select("*").single(); if (!error) return NextResponse.json({ ok: true, table, message: "Message saved.", thread_id: row.thread_id, data, row: data || row }); lastError = error.message || String(error); } catch (error: any) { lastError = error?.message || String(error); }
  }
  return NextResponse.json({ ok: true, saved: false, fallback: true, message: "Message accepted but could not save to existing message tables.", details: lastError, thread_id: row.thread_id, row });
}
