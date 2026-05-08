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
    cleanEmail(body?.email) ||
    cleanEmail(body?.member_email) ||
    emailFromCookie(request.headers.get("cookie") || "")
  );
}

function normalizeArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => cleanEmail(item)).filter(Boolean);
  }

  const text = clean(value);
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => cleanEmail(item)).filter(Boolean);
    }
  } catch {
    // Continue.
  }

  return text.split(",").map((item) => cleanEmail(item)).filter(Boolean);
}

function addUnique(list: string[], email: string) {
  return Array.from(new Set([...list, email].filter(Boolean)));
}

function removeValue(list: string[], email: string) {
  return list.filter((item) => item !== email);
}

async function logActivity(supabase: any, payload: Record<string, any>) {
  try {
    await supabase.from("vf_activity_events").insert(payload);
  } catch {
    // Activity logging is best-effort.
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const id = clean(body?.id || body?.pain_id);
    const action = clean(body?.action).toLowerCase();
    const email = requestEmail(request, body);
    const note = clean(body?.note);

    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing pain signal id." }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ ok: false, error: "Missing member email." }, { status: 401 });
    }

    const supabase = supabaseClient();

    const { data: current, error: loadError } = await supabase
      .from("vf_pain_submissions")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (loadError) {
      return NextResponse.json({ ok: false, error: loadError.message, details: loadError }, { status: 500 });
    }

    if (!current) {
      return NextResponse.json({ ok: false, error: "Pain signal not found." }, { status: 404 });
    }

    const savedBy = normalizeArray(current.saved_by);
    const interestedBy = normalizeArray(current.interested_by);
    const dismissedBy = normalizeArray(current.dismissed_by);

    const patch: Record<string, any> = {};

    if (note) {
      patch.member_notes = note;
    }

    if (action === "save") {
      patch.saved_by = addUnique(savedBy, email);
      patch.dismissed_by = removeValue(dismissedBy, email);
    } else if (action === "unsave") {
      patch.saved_by = removeValue(savedBy, email);
    } else if (action === "interested") {
      patch.interested_by = addUnique(interestedBy, email);
      patch.dismissed_by = removeValue(dismissedBy, email);
      patch.routing_status = "interested";
    } else if (action === "dismiss") {
      patch.dismissed_by = addUnique(dismissedBy, email);
    } else if (action === "archive") {
      if (email !== OWNER_EMAIL && email !== cleanEmail(current.member_email)) {
        return NextResponse.json({ ok: false, error: "Only owner or submitter can archive this signal." }, { status: 403 });
      }
      patch.archived = true;
      patch.routing_status = "archived";
    } else if (action === "resolve") {
      if (email !== OWNER_EMAIL && email !== cleanEmail(current.member_email)) {
        return NextResponse.json({ ok: false, error: "Only owner or submitter can resolve this signal." }, { status: 403 });
      }
      patch.resolved = true;
      patch.routing_status = "resolved";
    } else {
      return NextResponse.json({ ok: false, error: "Unknown pain action." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("vf_pain_submissions")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message, details: error }, { status: 500 });
    }

    await logActivity(supabase, {
      event_type: `pain_${action}`,
      event_title: `Pain signal ${action}`,
      event_description: `${email} performed ${action} on ${current.title || current.pain_type || "pain signal"}.`,
      member_email: email,
      related_deal_id: current.deal_id || null,
      related_message_id: null,
      related_alert_id: null,
      visibility: "member",
      metadata: {
        pain_id: id,
        action,
        note,
      },
    });

    return NextResponse.json({
      ok: true,
      action,
      signal: data,
      message: `Pain signal ${action} saved.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Pain action failed.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
