import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";
type AnyRow = Record<string, any>;

function supabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  if (!url || !key) throw new Error("Missing Supabase environment values.");

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function first(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }
  return "";
}

function readCookie(cookieHeader: string, name: string) {
  const parts = cookieHeader.split(";").map((part) => part.trim());
  for (const part of parts) {
    if (!part.startsWith(`${name}=`)) continue;
    try {
      return decodeURIComponent(part.slice(name.length + 1));
    } catch {
      return part.slice(name.length + 1);
    }
  }
  return "";
}

function requestEmail(request: Request, body: AnyRow = {}) {
  const url = new URL(request.url);
  const cookie = request.headers.get("cookie") || "";
  return cleanEmail(
    request.headers.get("x-vf-email") ||
      body.email ||
      body.from_email ||
      body.member_email ||
      url.searchParams.get("email") ||
      readCookie(cookie, "vf_email") ||
      readCookie(cookie, "vf_member_email") ||
      readCookie(cookie, "vf_admin_email")
  );
}

function isOwnerRequest(request: Request, email: string) {
  const url = new URL(request.url);
  const cookie = request.headers.get("cookie") || "";
  return (
    email === OWNER_EMAIL ||
    clean(request.headers.get("x-vf-admin")) === "1" ||
    clean(url.searchParams.get("owner")) === "1" ||
    cookie.includes("vf_admin=1") ||
    cookie.includes("isAdmin=true")
  );
}

function makeThreadId(signalId: string, itemId: string, fromEmail: string, toEmail: string, supplied = "") {
  const existing = clean(supplied);
  if (existing) return existing;
  const basis = signalId || itemId || "general";
  const participants = [fromEmail, toEmail].map(cleanEmail).sort().join("__");
  return `msg_${basis}__${participants}`.replace(/[^a-zA-Z0-9_@.-]/g, "_").slice(0, 180);
}

function normalize(row: AnyRow) {
  return {
    id: row.id,
    thread_id: clean(row.thread_id),
    signal_id: clean(row.signal_id),
    item_id: clean(row.item_id),
    from_email: cleanEmail(row.from_email),
    to_email: cleanEmail(row.to_email),
    subject: clean(row.subject || "VaultForge message"),
    body: clean(row.body || row.message),
    status: clean(row.status || "open"),
    is_read: Boolean(row.is_read),
    created_at: row.created_at,
    updated_at: row.updated_at,
    metadata: typeof row.metadata === "object" && row.metadata ? row.metadata : {},
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const email = requestEmail(request);
    const owner = isOwnerRequest(request, email);
    const threadId = clean(url.searchParams.get("thread_id") || "");
    const signalId = clean(url.searchParams.get("signal_id") || "");
    const itemId = clean(url.searchParams.get("item_id") || "");

    if (!email) return NextResponse.json({ ok: false, error: "Login email required." }, { status: 401 });

    const supabase = supabaseClient();
    let query = supabase.from("vf_simple_messages").select("*").order("created_at", { ascending: true }).limit(300);

    if (threadId) query = query.eq("thread_id", threadId);
    else if (signalId) query = query.eq("signal_id", signalId);
    else if (itemId) query = query.eq("item_id", itemId);

    const { data, error } = await query;
    if (error) return NextResponse.json({ ok: false, error: error.message, table: "vf_simple_messages" }, { status: 500 });

    let messages = Array.isArray(data) ? data.map(normalize) : [];
    if (!owner) messages = messages.filter((m) => m.from_email === email || m.to_email === email);

    const threadMap = new Map<string, AnyRow>();
    for (const message of messages) threadMap.set(message.thread_id, message);

    return NextResponse.json({
      ok: true,
      email,
      owner,
      messages,
      threads: Array.from(threadMap.values()).sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()),
      count: messages.length,
      table: "vf_simple_messages",
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: "Could not load messages.", details: error?.message || String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as AnyRow;
    const email = requestEmail(request, body);

    const fromEmail = cleanEmail(first(body.from_email, email));
    const toEmail = cleanEmail(first(body.to_email, body.recipient_email, body.owner_email, body.target_email));
    const signalId = clean(first(body.signal_id, body.signalId, body.alert_id));
    const itemId = clean(first(body.item_id, body.itemId, body.pain_id, body.deal_id, body.project_id));
    const subject = clean(first(body.subject, body.title, "VaultForge message"));
    const message = clean(first(body.body, body.message, body.note));
    const threadId = makeThreadId(signalId, itemId, fromEmail, toEmail, body.thread_id);
    const now = new Date().toISOString();

    if (!fromEmail) return NextResponse.json({ ok: false, error: "Sender email required." }, { status: 400 });
    if (!toEmail) return NextResponse.json({ ok: false, error: "Recipient email required." }, { status: 400 });
    if (!message) return NextResponse.json({ ok: false, error: "Message required." }, { status: 400 });

    const payload = {
      thread_id: threadId,
      signal_id: signalId || null,
      item_id: itemId || null,
      from_email: fromEmail,
      to_email: toEmail,
      subject,
      body: message,
      status: "open",
      is_read: false,
      created_at: now,
      updated_at: now,
      metadata: {
        source: "simple_owner_messages",
        owner_email: toEmail,
        from_email: fromEmail,
        to_email: toEmail,
        signal_id: signalId,
        item_id: itemId,
        context_title: clean(body.context_title),
      },
    };

    const supabase = supabaseClient();
    const { data, error } = await supabase.from("vf_simple_messages").insert(payload).select("*").single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message, table: "vf_simple_messages", payload_keys: Object.keys(payload) }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      saved: true,
      table: "vf_simple_messages",
      message: normalize(data),
      thread_id: threadId,
      links: {
        thread: `/messages/${encodeURIComponent(threadId)}?email=${encodeURIComponent(fromEmail)}`,
        inbox: "/messages",
        signal: signalId ? `/signals/${encodeURIComponent(signalId)}` : "",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: "Could not save message.", details: error?.message || String(error) }, { status: 500 });
  }
}
