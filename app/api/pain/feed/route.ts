import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

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

function requestEmail(request: Request) {
  const url = new URL(request.url);
  const cookie = request.headers.get("cookie") || "";

  return cleanEmail(
    request.headers.get("x-vf-email") ||
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

function first(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }

  return "";
}

function canSee(row: AnyRow, email: string, owner: boolean) {
  if (owner) return true;

  const metadata = typeof row.metadata === "object" && row.metadata ? row.metadata : {};
  const candidates = [
    row.email,
    row.member_email,
    row.sender_email,
    row.from_email,
    row.to_email,
    row.recipient_email,
    row.target_email,
    row.visible_to_email,
    metadata.email,
    metadata.member_email,
    metadata.from_email,
    metadata.to_email,
    metadata.recipient_email,
    metadata.target_email,
  ]
    .map(cleanEmail)
    .filter(Boolean);

  if (candidates.length === 0) return true;
  return candidates.includes(email);
}

function normalizePain(row: AnyRow, table: string) {
  const metadata = typeof row.metadata === "object" && row.metadata ? row.metadata : {};
  const photos = Array.isArray(metadata.photos) ? metadata.photos : [];
  const photoUrls = Array.isArray(row.photo_urls)
    ? row.photo_urls
    : Array.isArray(metadata.photo_urls)
    ? metadata.photo_urls
    : [];

  const imageUrl = first(
    row.image_url,
    row.photo_url,
    row.primary_photo_url,
    photos?.[0]?.data_url,
    photos?.[0]?.dataUrl,
    photos?.[0]?.url,
    photoUrls?.[0]
  );

  const id = first(row.id, row.pain_id, row.uuid, metadata.pain_id);

  return {
    ...row,
    id,
    pain_id: id,
    title: first(row.title, row.pain_label, row.name, metadata.title, "Pain Signal"),
    pain_label: first(row.pain_label, metadata.pain_label, row.pain_type, metadata.pain_type, "Pain Signal"),
    note: first(row.note, row.notes, row.description, row.message, row.route_summary, metadata.route_summary, metadata.note),
    route_summary: first(row.route_summary, metadata.route_summary, row.note, row.notes, row.message),
    state: first(row.state, metadata.state, metadata.raw_fields?.state),
    city: first(row.city, metadata.city, metadata.raw_fields?.city),
    market: first(row.market, [row.city, row.state].filter(Boolean).join(", "), metadata.market),
    priority: first(row.priority, row.urgency, metadata.priority, "medium"),
    urgency: first(row.urgency, row.priority, metadata.urgency, "medium"),
    asset_type: first(row.asset_type, metadata.asset_type, metadata.raw_fields?.assetType),
    best_route: first(row.best_route, metadata.best_route),
    help_requested: first(row.help_requested, metadata.help_requested),
    image_url: imageUrl,
    photo_url: imageUrl,
    photo_urls: photoUrls,
    photos,
    member_email: cleanEmail(row.member_email || row.email || metadata.member_email || metadata.email),
    owner_email: cleanEmail(row.owner_email || metadata.owner_email || OWNER_EMAIL),
    created_at: first(row.created_at, row.updated_at, new Date().toISOString()),
    _source_table: table,
    metadata,
  };
}

async function selectRecent(supabase: any, table: string) {
  const orderColumns = ["created_at", "updated_at", "id"];

  for (const column of orderColumns) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .order(column, { ascending: false })
        .limit(100);

      if (!error && Array.isArray(data)) return data;
    } catch {
      // Try next order column.
    }
  }

  try {
    const { data, error } = await supabase.from(table).select("*").limit(100);
    if (!error && Array.isArray(data)) return data;
  } catch {
    // No-op.
  }

  return [];
}

function matchesId(row: AnyRow, id: string) {
  if (!id) return false;
  const metadata = typeof row.metadata === "object" && row.metadata ? row.metadata : {};

  return [
    row.id,
    row.pain_id,
    row.uuid,
    row.item_id,
    row.related_deal_id,
    metadata.pain_id,
    metadata.item_id,
    metadata.related_deal_id,
  ]
    .map(clean)
    .includes(id);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const email = requestEmail(request);
    const owner = isOwnerRequest(request, email);
    const id = clean(url.searchParams.get("id") || "");

    if (!email) {
      return NextResponse.json({ ok: false, error: "Login email required." }, { status: 401 });
    }

    const supabase = supabaseClient();
    const tables = ["pain_requests", "vf_pain_requests", "vf_pain_signals", "pain_signals"];
    const found: AnyRow[] = [];

    for (const table of tables) {
      const rows = await selectRecent(supabase, table);

      for (const row of rows) {
        if (!canSee(row, email, owner)) continue;
        if (id && !matchesId(row, id)) continue;

        found.push(normalizePain(row, table));
      }
    }

    const seen = new Set<string>();
    const pains = found
      .filter((row) => {
        const key = first(row.id, row.pain_id, row.title, row.created_at);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

    return NextResponse.json({
      ok: true,
      pains,
      pain: id ? pains[0] || null : null,
      count: pains.length,
      source: "api/pain/feed",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not load pain feed.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
