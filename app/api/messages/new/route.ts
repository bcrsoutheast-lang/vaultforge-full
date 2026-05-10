
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AnyRow = Record<string, any>;

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

function requestEmail(request: Request, body: AnyRow) {
  const cookie = request.headers.get("cookie") || "";

  return cleanEmail(
    request.headers.get("x-vf-email") ||
      body.from_email ||
      body.sender_email ||
      body.member_email ||
      body.email ||
      readCookie(cookie, "vf_email") ||
      readCookie(cookie, "vf_member_email") ||
      readCookie(cookie, "vf_admin_email")
  );
}

function recipientEmail(request: Request, body: AnyRow) {
  return cleanEmail(
    request.headers.get("x-vf-recipient-email") ||
      body.to_email ||
      body.recipient_email ||
      body.target_email ||
      body.to ||
      body.member_to ||
      body.email_to
  );
}

async function insertFirstWorking(supabase: any, table: string, variants: AnyRow[]) {
  const errors: string[] = [];

  for (const payload of variants) {
    try {
      const { data, error } = await supabase
        .from(table)
        .insert(payload)
        .select("*")
        .single();

      if (!error && data) {
        return {
          ok: true,
          table,
          row: data,
          variant_keys: Object.keys(payload),
        };
      }

      if (error?.message && errors.length < 8) errors.push(error.message);
    } catch (error: any) {
      if (error?.message && errors.length < 8) errors.push(error.message);
    }
  }

  return {
    ok: false,
    table,
    error: errors[0] || `${table} insert failed.`,
    errors,
  };
}

async function saveActivityFallback(supabase: any, payload: AnyRow) {
  const variants = [
    {
      event_type: "member_connection_request",
      event_title: payload.subject || "Member connection request",
      event_description: payload.message || "VaultForge member connection request.",
      member_email: payload.from_email || null,
      owner_email: payload.to_email || null,
      related_deal_id: payload.item_id || null,
      related_alert_id: payload.signal_id || null,
      visibility: "member",
      metadata: payload,
    },
    {
      event_type: "member_connection_request",
      event_title: payload.subject || "Member connection request",
      event_description: payload.message || "VaultForge member connection request.",
      email: payload.from_email || null,
      metadata: payload,
    },
    {
      event_type: "member_connection_request",
      event_title: payload.subject || "Member connection request",
      event_description: payload.message || "VaultForge member connection request.",
    },
  ];

  return insertFirstWorking(supabase, "vf_activity_events", variants);
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const fromEmail = requestEmail(request, body);
    const toEmail = recipientEmail(request, body);
    const subject = clean(body.subject) || "VaultForge connection request";
    const message = clean(body.message || body.body || body.note);

    if (!fromEmail || !fromEmail.includes("@")) {
      return NextResponse.json(
        { ok: false, error: "Sender email missing. Please log in again." },
        { status: 401 }
      );
    }

    if (!toEmail || !toEmail.includes("@")) {
      return NextResponse.json(
        { ok: false, error: "Recipient email missing." },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { ok: false, error: "Message body required." },
        { status: 400 }
      );
    }

    const supabase = supabaseClient();
    const now = new Date().toISOString();

    const canonical = {
      from_email: fromEmail,
      sender_email: fromEmail,
      to_email: toEmail,
      recipient_email: toEmail,
      target_email: toEmail,
      subject,
      message,
      body: message,
      note: message,
      status: "sent",
      message_type: clean(body.message_type) || "member_connection_request",
      source: clean(body.source) || "messages_new_page",
      item_id: clean(body.item_id) || null,
      signal_id: clean(body.signal_id) || null,
      created_at: now,
      updated_at: now,
      metadata: {
        from_email: fromEmail,
        to_email: toEmail,
        subject,
        source: clean(body.source) || "messages_new_page",
        item_id: clean(body.item_id) || null,
        signal_id: clean(body.signal_id) || null,
      },
    };

    const messageTables = ["vf_messages", "messages", "vf_message_threads"];
    const variants = [
      canonical,
      {
        from_email: canonical.from_email,
        to_email: canonical.to_email,
        subject: canonical.subject,
        message: canonical.message,
        status: canonical.status,
        source: canonical.source,
        created_at: canonical.created_at,
        updated_at: canonical.updated_at,
        metadata: canonical.metadata,
      },
      {
        sender_email: canonical.sender_email,
        recipient_email: canonical.recipient_email,
        subject: canonical.subject,
        body: canonical.body,
        status: canonical.status,
        created_at: canonical.created_at,
        updated_at: canonical.updated_at,
        metadata: canonical.metadata,
      },
      {
        email_from: canonical.from_email,
        email_to: canonical.to_email,
        subject: canonical.subject,
        message: canonical.message,
        status: canonical.status,
        created_at: canonical.created_at,
      },
      {
        sender: canonical.from_email,
        recipient: canonical.to_email,
        subject: canonical.subject,
        body: canonical.body,
        created_at: canonical.created_at,
      },
      {
        subject: canonical.subject,
        message: canonical.message,
        body: canonical.body,
        note: canonical.note,
        created_at: canonical.created_at,
        metadata: canonical.metadata,
      },
    ];

    const insertResults = [];

    for (const table of messageTables) {
      const result = await insertFirstWorking(supabase, table, variants);
      insertResults.push(result);

      if (result.ok) {
        await saveActivityFallback(supabase, canonical);

        return NextResponse.json({
          ok: true,
          message: "Connection request saved.",
          saved_to: table,
          row: result.row,
          activity_logged: true,
        });
      }
    }

    const activity = await saveActivityFallback(supabase, canonical);

    if (activity.ok) {
      return NextResponse.json({
        ok: true,
        message: "Connection request recorded in activity log.",
        saved_to: "vf_activity_events",
        row: activity.row,
        message_table_results: insertResults,
      });
    }

    return NextResponse.json(
      {
        ok: false,
        error: "Could not save message or activity fallback.",
        message_table_results: insertResults,
        activity_result: activity,
      },
      { status: 500 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not create message.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
