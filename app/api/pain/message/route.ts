import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

function supabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
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

function emailFromCookie(cookieHeader: string) {
  const parts = cookieHeader.split(";").map((part) => part.trim());
  for (const part of parts) {
    if (!part.startsWith("vf_email=")) continue;
    const raw = part.replace("vf_email=", "");
    try {
      return cleanEmail(decodeURIComponent(raw));
    } catch {
      return cleanEmail(raw);
    }
  }
  return "";
}

function requestEmail(request: Request, body?: any) {
  return (
    cleanEmail(request.headers.get("x-vf-email")) ||
    cleanEmail(body?.sender_email) ||
    cleanEmail(body?.email) ||
    cleanEmail(body?.member_email) ||
    emailFromCookie(request.headers.get("cookie") || "")
  );
}

function firstText(row: any, columns: string[]) {
  for (const column of columns) {
    const text = clean(row?.[column]);
    if (text) return text;
  }
  return "";
}

function threadKey(row: any) {
  return firstText(row, ["thread_key", "thread_id", "conversation_id"]);
}

function messagePainId(row: any) {
  const explicit = firstText(row, ["pain_id", "source_id"]);
  if (explicit) return explicit;

  const key = threadKey(row);
  if (key.startsWith("pain:")) return key.replace("pain:", "");

  return "";
}

function normalizeMessage(row: any) {
  return {
    ...row,
    body_text: firstText(row, ["body", "message", "content", "message_body", "text", "note"]),
    subject_text: firstText(row, ["subject", "title"]) || "Pain Signal Message",
    thread_key: threadKey(row),
    pain_id: messagePainId(row),
  };
}

async function logActivity(supabase: any, payload: Record<string, any>) {
  try {
    await supabase.from("vf_activity_events").insert(payload);
  } catch {
    // Best effort only.
  }
}

async function loadPainMessages(supabase: any, painId: string, email: string) {
  try {
    const { data, error } = await supabase
      .from("vf_messages")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(500);

    if (error || !data) return [];

    return data
      .filter((row: any) => {
        const key = threadKey(row);
        const pid = messagePainId(row);
        const connected = key === `pain:${painId}` || pid === painId;
        if (!connected) return false;

        if (!email || email === OWNER_EMAIL) return true;

        const sender = cleanEmail(row.sender_email || row.from_email || row.member_email);
        const recipient = cleanEmail(row.recipient_email || row.to_email);
        return sender === email || recipient === email || sender === OWNER_EMAIL || recipient === OWNER_EMAIL;
      })
      .map(normalizeMessage);
  } catch {
    return [];
  }
}

async function tryInsertMessage(supabase: any, payloads: Record<string, any>[]) {
  let lastError: any = null;
  let lastPayload: Record<string, any> = {};

  for (const payload of payloads) {
    lastPayload = payload;

    const { data, error } = await supabase
      .from("vf_messages")
      .insert(payload)
      .select("*")
      .single();

    if (!error) return { data, error: null, payload };

    lastError = error;
  }

  return { data: null, error: lastError, payload: lastPayload };
}

export async function GET(request: Request) {
  try {
    const supabase = supabaseClient();
    const url = new URL(request.url);
    const id = clean(url.searchParams.get("id"));
    const email = requestEmail(request);

    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing pain signal id." }, { status: 400 });
    }

    const { data: signal, error } = await supabase
      .from("vf_pain_submissions")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message, details: error }, { status: 500 });
    }

    if (!signal) {
      return NextResponse.json({ ok: false, error: "Pain signal not found." }, { status: 404 });
    }

    const messages = await loadPainMessages(supabase, id, email);

    return NextResponse.json({
      ok: true,
      signal,
      messages,
      count: messages.length,
      thread_key: `pain:${id}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Could not load pain signal.", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const supabase = supabaseClient();

    const painId = clean(body?.pain_id || body?.id);
    const senderEmail = requestEmail(request, body);
    const rawMessage = clean(body?.message || body?.body || body?.content);

    if (!painId) return NextResponse.json({ ok: false, error: "Missing pain signal id." }, { status: 400 });
    if (!senderEmail) return NextResponse.json({ ok: false, error: "Missing sender email." }, { status: 401 });
    if (!rawMessage) return NextResponse.json({ ok: false, error: "Message is empty." }, { status: 400 });

    const { data: pain, error: painError } = await supabase
      .from("vf_pain_submissions")
      .select("*")
      .eq("id", painId)
      .maybeSingle();

    if (painError) {
      return NextResponse.json({ ok: false, error: painError.message, details: painError }, { status: 500 });
    }

    if (!pain) return NextResponse.json({ ok: false, error: "Pain signal not found." }, { status: 404 });

    const submitterEmail = cleanEmail(pain.member_email);
    const recipientEmail =
      cleanEmail(body?.recipient_email) ||
      (submitterEmail && submitterEmail !== senderEmail ? submitterEmail : OWNER_EMAIL);

    const title = clean(pain.title || pain.pain_type || "Pain Signal");
    const thread = `pain:${painId}`;
    const createdAt = new Date().toISOString();

    const { data: message, error, payload } = await tryInsertMessage(supabase, [
      {
        sender_email: senderEmail,
        recipient_email: recipientEmail,
        member_email: senderEmail,
        thread_key: thread,
        pain_id: painId,
        source_id: painId,
        source_type: "pain_submission",
        deal_id: pain.deal_id || null,
        subject: `Pain Signal: ${title}`,
        body: rawMessage,
        status: "active",
        archived: false,
        read: false,
        is_read: false,
        created_at: createdAt,
      },
      {
        sender_email: senderEmail,
        recipient_email: recipientEmail,
        thread_key: thread,
        subject: `Pain Signal: ${title}`,
        body: rawMessage,
        archived: false,
        created_at: createdAt,
      },
      {
        sender_email: senderEmail,
        recipient_email: recipientEmail,
        thread_key: thread,
        subject: `Pain Signal: ${title}`,
        message: rawMessage,
        archived: false,
        created_at: createdAt,
      },
      {
        sender_email: senderEmail,
        recipient_email: recipientEmail,
        body: rawMessage,
        created_at: createdAt,
      },
    ]);

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message || "Could not create message.",
          details: error,
          attempted_payload: payload,
        },
        { status: 500 }
      );
    }

    await logActivity(supabase, {
      event_type: "pain_message_sent",
      event_title: "Pain signal message sent",
      event_description: `${senderEmail} sent a message about ${title}.`,
      member_email: senderEmail,
      related_deal_id: pain.deal_id || null,
      related_message_id: message?.id || null,
      related_alert_id: null,
      visibility: "member",
      metadata: {
        pain_id: painId,
        thread_key: thread,
        recipient_email: recipientEmail,
      },
    });

    const messages = await loadPainMessages(supabase, painId, senderEmail);

    return NextResponse.json({
      ok: true,
      message,
      messages,
      thread_key: thread,
      recipient_email: recipientEmail,
      note: "Message created for pain signal.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Pain message failed.", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
