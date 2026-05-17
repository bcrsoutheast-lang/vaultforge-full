import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function clean(value: unknown) {
  return String(value || "").trim();
}

function lower(value: unknown) {
  return clean(value).toLowerCase();
}

function supabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function emailFromRequest(request: Request, body: Record<string, any>) {
  const cookie = request.headers.get("cookie") || "";
  const headerEmail =
    request.headers.get("x-vf-email") ||
    request.headers.get("x-user-email") ||
    request.headers.get("x-member-email") ||
    "";

  const cookieMatch =
    cookie.match(/(?:^|;\s*)vf_email=([^;]+)/) ||
    cookie.match(/(?:^|;\s*)vf_member_email=([^;]+)/) ||
    cookie.match(/(?:^|;\s*)email=([^;]+)/);

  const cookieEmail = cookieMatch ? decodeURIComponent(cookieMatch[1] || "") : "";

  return lower(
    body.user_email ||
      body.email ||
      body.member_email ||
      body.owner_email ||
      headerEmail ||
      cookieEmail ||
      "guest@vaultforge.local"
  );
}

function statusFromAction(action: string, fallback: string) {
  const next = lower(action || fallback);

  if (next === "save" || next === "saved") return "saved";
  if (next === "archive" || next === "archived") return "archived";
  if (next === "delete" || next === "hide" || next === "hidden" || next === "deleted") return "deleted";
  if (next === "restore" || next === "active") return "active";

  return fallback === "saved" || fallback === "archived" || fallback === "deleted" ? fallback : "active";
}

export async function POST(request: Request) {
  let body: Record<string, any> = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const db = supabase();

  if (!db) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing Supabase environment variables.",
      },
      { status: 500 }
    );
  }

  const user_email = emailFromRequest(request, body);
  const room_id = clean(body.room_id || body.id || body.deal_id || body.project_id || body.item_id);
  const room_type = lower(body.room_type || body.type || body.kind || "opportunity");
  const room_title = clean(body.room_title || body.title || body.deal_title || body.project_title || "Opportunity Room");
  const source_route = clean(body.source_route || body.route || `/deal/detail?id=${encodeURIComponent(room_id)}`);
  const action = lower(body.action);
  const status = statusFromAction(action, clean(body.status || "active"));

  if (!room_id) {
    return NextResponse.json({ ok: false, error: "Missing room_id." }, { status: 400 });
  }

  const payload = {
    user_email,
    room_id,
    room_type,
    room_title,
    status,
    source_route,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await db
    .from("vf_room_states")
    .upsert(payload, { onConflict: "user_email,room_type,room_id" })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Room status could not be saved. Run supabase/vf_room_states.sql first.",
        supabase_error: error.message,
        code: error.code,
        payload,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    room: data,
    status,
  });
}

export async function GET(request: Request) {
  const db = supabase();

  if (!db) {
    return NextResponse.json({ ok: false, rooms: {}, rows: [], error: "Missing Supabase environment variables." });
  }

  const url = new URL(request.url);
  const body = Object.fromEntries(url.searchParams.entries());
  const user_email = emailFromRequest(request, body);
  const room_type = lower(url.searchParams.get("room_type") || url.searchParams.get("type") || "opportunity");

  const { data, error } = await db
    .from("vf_room_states")
    .select("*")
    .eq("user_email", user_email)
    .eq("room_type", room_type);

  if (error) {
    return NextResponse.json({
      ok: false,
      rooms: {},
      rows: [],
      error: "Room status could not be loaded.",
      supabase_error: error.message,
      code: error.code,
    });
  }

  const rooms: Record<string, any> = {};

  for (const row of data || []) {
    rooms[row.room_id] = row;
  }

  return NextResponse.json({
    ok: true,
    user_email,
    room_type,
    rooms,
    rows: data || [],
  });
}
