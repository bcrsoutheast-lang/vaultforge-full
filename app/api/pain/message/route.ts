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

  if (!url || !key) {
    throw new Error("Missing Supabase environment values.");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
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

function requestEmail(request: Request, body: any) {
  return (
    cleanEmail(request.headers.get("x-vf-email")) ||
    cleanEmail(body?.sender_email) ||
    cleanEmail(body?.email) ||
    cleanEmail(body?.member_email) ||
    emailFromCookie(request.headers.get("cookie") || "")
  );
}

function pickMessageColumn(columns: Set<string>) {
  const candidates = ["body", "message", "content", "message_body", "text", "note"];

  for (const column of candidates) {
    if (columns.has(column)) return column;
  }

  return "";
}

function setIfColumn(payload: Record<string, any>, columns: Set<string>, column: string, value: any) {
  if (columns.has(column)) {
    payload[column] = value;
  }
}

async function getColumns(supabase: any, table: string) {
  const { data, error } = await supabase
    .from("information_schema.columns")
    .select("column_name")
    .eq("table_schema", "public")
    .eq("table_name", table);

  if (error || !data) {
    return new Set<string>();
  }

  return new Set(data.map((row: any) => String(row.column_name || "")));
}

async function logActivity(supabase: any, payload: Record<string, any>) {
  try {
    await supabase.from("vf_activity_events").insert(payload);
  } catch {
    // Best effort only.
  }
}

export async function GET(request: Request) {
  try {
    const supabase = supabaseClient();
    const url = new URL(request.url);
    const id = clean(url.searchParams.get("id"));

    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing pain signal id." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("vf_pain_submissions")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message, details: error }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ ok: false, error: "Pain signal not found." }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      signal: data,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not load pain signal.",
        details: error?.message || String(error),
      },
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

    if (!painId) {
      return NextResponse.json({ ok: false, error: "Missing pain signal id." }, { status: 400 });
    }

    if (!senderEmail) {
      return NextResponse.json({ ok: false, error: "Missing sender email." }, { status: 401 });
    }

    if (!rawMessage) {
      return NextResponse.json({ ok: false, error: "Message is empty." }, { status: 400 });
    }

    const { data: pain, error: painError } = await supabase
      .from("vf_pain_submissions")
      .select("*")
      .eq("id", painId)
      .maybeSingle();

    if (painError) {
      return NextResponse.json({ ok: false, error: painError.message, details: painError }, { status: 500 });
    }

    if (!pain) {
      return NextResponse.json({ ok: false, error: "Pain signal not found." }, { status: 404 });
    }

    const columns = await getColumns(supabase, "vf_messages");
    const messageColumn = pickMessageColumn(columns);

    if (!messageColumn) {
      return NextResponse.json(
        {
          ok: false,
          error: "Could not find a message body column on vf_messages.",
        },
        { status: 500 }
      );
    }

    const submitterEmail = cleanEmail(pain.member_email);
    const recipientEmail =
      cleanEmail(body?.recipient_email) ||
      (submitterEmail && submitterEmail !== senderEmail ? submitterEmail : OWNER_EMAIL);

    const title = clean(pain.title || pain.pain_type || "Pain Signal");
    const threadKey = `pain:${painId}`;

    const payload: Record<string, any> = {};

    setIfColumn(payload, columns, "sender_email", senderEmail);
    setIfColumn(payload, columns, "from_email", senderEmail);
    setIfColumn(payload, columns, "member_email", senderEmail);

    setIfColumn(payload, columns, "recipient_email", recipientEmail);
    setIfColumn(payload, columns, "to_email", recipientEmail);

    setIfColumn(payload, columns, "thread_key", threadKey);
    setIfColumn(payload, columns, "thread_id", threadKey);
    setIfColumn(payload, columns, "conversation_id", threadKey);

    setIfColumn(payload, columns, "pain_id", painId);
    setIfColumn(payload, columns, "source_id", painId);
    setIfColumn(payload, columns, "source_type", "pain_submission");

    if (pain.deal_id) {
      setIfColumn(payload, columns, "deal_id", pain.deal_id);
    }

    setIfColumn(payload, columns, "subject", `Pain Signal: ${title}`);
    setIfColumn(payload, columns, "title", `Pain Signal: ${title}`);

    setIfColumn(payload, columns, messageColumn, rawMessage);

    setIfColumn(payload, columns, "status", "active");
    setIfColumn(payload, columns, "archived", false);
    setIfColumn(payload, columns, "read", false);
    setIfColumn(payload, columns, "is_read", false);
    setIfColumn(payload, columns, "created_at", new Date().toISOString());

    const { data: message, error } = await supabase
      .from("vf_messages")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message, details: error, payload }, { status: 500 });
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
        thread_key: threadKey,
        recipient_email: recipientEmail,
      },
    });

    return NextResponse.json({
      ok: true,
      message,
      thread_key: threadKey,
      recipient_email: recipientEmail,
      note: "Message created for pain signal.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Pain message failed.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
