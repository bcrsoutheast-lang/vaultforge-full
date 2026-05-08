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

function requestEmail(request: Request) {
  const url = new URL(request.url);

  return (
    cleanEmail(request.headers.get("x-vf-email")) ||
    cleanEmail(url.searchParams.get("email")) ||
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

function messageBody(row: any) {
  return firstText(row, ["body", "message", "content", "message_body", "text", "note"]);
}

function messageSubject(row: any) {
  return firstText(row, ["subject", "title"]) || "Pain Signal Message";
}

function threadKey(row: any) {
  return firstText(row, ["thread_key", "thread_id", "conversation_id"]);
}

function painIdFromMessage(row: any) {
  const explicit = firstText(row, ["pain_id", "source_id"]);
  if (explicit) return explicit;

  const key = threadKey(row);
  if (key.startsWith("pain:")) return key.replace("pain:", "");

  return "";
}

export async function GET(request: Request) {
  try {
    const supabase = supabaseClient();
    const email = requestEmail(request);
    const owner = email === OWNER_EMAIL;

    let query = supabase
      .from("vf_messages")
      .select("*")
      .or("archived.is.null,archived.eq.false")
      .order("created_at", { ascending: false })
      .limit(250);

    if (email && !owner) {
      query = query.or(`sender_email.eq.${email},recipient_email.eq.${email},member_email.eq.${email}`);
    }

    const { data: messages, error } = await query;

    if (error) {
      return NextResponse.json({ ok: false, error: error.message, details: error }, { status: 500 });
    }

    const painMessages = (messages || []).filter((row: any) => {
      const key = threadKey(row);
      const sourceType = clean(row.source_type);
      const pid = painIdFromMessage(row);

      return key.startsWith("pain:") || sourceType === "pain_submission" || Boolean(pid);
    });

    const painIds = Array.from(
      new Set(painMessages.map((row: any) => painIdFromMessage(row)).filter(Boolean))
    );

    let painMap = new Map<string, any>();

    if (painIds.length > 0) {
      const { data: painRows } = await supabase
        .from("vf_pain_submissions")
        .select("*")
        .in("id", painIds);

      painMap = new Map((painRows || []).map((row: any) => [String(row.id), row]));
    }

    const grouped = new Map<string, any>();

    for (const row of painMessages) {
      const pid = painIdFromMessage(row);
      const key = threadKey(row) || (pid ? `pain:${pid}` : String(row.id || ""));
      if (!key) continue;

      const existing = grouped.get(key);
      const pain = pid ? painMap.get(pid) || null : null;

      const normalized = {
        ...row,
        body_text: messageBody(row),
        subject_text: messageSubject(row),
        thread_key: key,
        pain_id: pid,
      };

      if (!existing) {
        grouped.set(key, {
          thread_key: key,
          pain_id: pid,
          pain,
          latest_message: normalized,
          messages: [normalized],
          unread_count:
            email && cleanEmail(row.recipient_email) === email && !row.read_at && !row.is_read && !row.read ? 1 : 0,
        });
      } else {
        existing.messages.push(normalized);
        if (email && cleanEmail(row.recipient_email) === email && !row.read_at && !row.is_read && !row.read) {
          existing.unread_count += 1;
        }
      }
    }

    const threads = Array.from(grouped.values()).sort((a: any, b: any) => {
      return (
        new Date(b.latest_message.created_at || 0).getTime() -
        new Date(a.latest_message.created_at || 0).getTime()
      );
    });

    return NextResponse.json({
      ok: true,
      email,
      owner,
      threads,
      count: threads.length,
      source: "vf_messages",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not load pain messages.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
