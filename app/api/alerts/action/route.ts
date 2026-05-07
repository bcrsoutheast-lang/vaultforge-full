import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function getSupabase() {
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
    },
  });
}

function normalizeAction(value: unknown) {
  const action = clean(value).toLowerCase();

  if (["read", "mark_read", "mark-read"].includes(action)) return "read";
  if (["dismiss", "dismissed", "hide"].includes(action)) return "dismissed";

  return action || "read";
}

function payloadsFor(action: string) {
  if (action === "read") {
    return [
      { status: "read", alert_status: "read", is_read: true, read: true },
      { status: "read", alert_status: "read" },
      { status: "read" },
      { alert_status: "read" },
      { is_read: true },
      { read: true },
    ];
  }

  if (action === "dismissed") {
    return [
      { status: "dismissed", alert_status: "dismissed", is_dismissed: true, dismissed: true },
      { status: "dismissed", alert_status: "dismissed" },
      { status: "dismissed" },
      { alert_status: "dismissed" },
      { is_dismissed: true },
      { dismissed: true },
    ];
  }

  return [{ status: action }, { alert_status: action }];
}

function selectors(id: string) {
  return [
    { column: "id", value: id },
    { column: "alert_id", value: id },
    { column: "match_alert_id", value: id },
  ].filter((selector) => selector.value);
}

async function tryUpdate(selector: { column: string; value: string }, payload: Record<string, any>) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("vf_match_alerts")
    .update(payload)
    .eq(selector.column, selector.value)
    .select("*");

  if (error) {
    return {
      ok: false,
      count: 0,
      error: error.message || String(error),
      data: [],
    };
  }

  const rows = Array.isArray(data) ? data : data ? [data] : [];

  if (!rows.length) {
    return {
      ok: false,
      count: 0,
      error: `No alert matched ${selector.column}=${selector.value}`,
      data: [],
    };
  }

  return {
    ok: true,
    count: rows.length,
    error: "",
    data: rows,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    const id = clean(body?.id || body?.alert_id || body?.match_alert_id);
    const email = cleanEmail(
      request.headers.get("x-vf-email") ||
        body?.email ||
        body?.member_email
    );

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Missing alert id." },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Missing member email. Log in again." },
        { status: 400 }
      );
    }

    const action = normalizeAction(body?.action);
    const attempts: any[] = [];

    for (const selector of selectors(id)) {
      for (const payload of payloadsFor(action)) {
        const result = await tryUpdate(selector, payload);

        attempts.push({
          selector,
          payload,
          ok: result.ok,
          count: result.count,
          error: result.error,
        });

        if (result.ok && result.count > 0) {
          return NextResponse.json({
            ok: true,
            action,
            selector,
            payload,
            updated_count: result.count,
            alert: result.data[0],
            message: action === "read" ? "Alert marked read." : "Alert dismissed.",
          });
        }
      }
    }

    return NextResponse.json(
      {
        ok: false,
        error: "No alert row was updated. The alert id did not match a live vf_match_alerts row or the table uses different status columns.",
        attempts,
      },
      { status: 500 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Alert action failed.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
