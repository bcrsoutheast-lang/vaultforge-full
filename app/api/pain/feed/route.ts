import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";
const REAL_PAIN_TABLE = "vf_pain_submissions";

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

function arrayFrom(value: unknown): any[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return value ? [value] : [];
    }
  }

  return [];
}

function objectFrom(value: unknown): AnyRow {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as AnyRow) : {};
}

function canSee(row: AnyRow, email: string, owner: boolean) {
  if (owner) return true;

  const metadata = objectFrom(row.metadata);
  const directLinks = objectFrom(row.direct_links);

  const candidates = [
    row.email,
    row.member_email,
    row.user_email,
    row.submitted_by,
    row.sender_email,
    row.from_email,
    row.to_email,
    row.recipient_email,
    row.target_email,
    row.visible_to_email,
    metadata.email,
    metadata.member_email,
    metadata.user_email,
    metadata.submitted_by,
    metadata.from_email,
    metadata.to_email,
    metadata.recipient_email,
    metadata.target_email,
    directLinks.email,
  ]
    .map(cleanEmail)
    .filter(Boolean);

  if (candidates.length === 0) return true;
  return candidates.includes(email);
}

function normalizePhotoValue(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const record = value as AnyRow;
    return first(record.url, record.publicUrl, record.public_url, record.data_url, record.dataUrl, record.src);
  }
  return "";
}

function normalizePain(row: AnyRow) {
  const metadata = objectFrom(row.metadata);
  const rawFields = objectFrom(metadata.raw_fields);
  const directLinks = objectFrom(row.direct_links);

  const photoUrls = [
    ...arrayFrom(row.photo_urls),
    ...arrayFrom(row.photos).map(normalizePhotoValue),
    ...arrayFrom(metadata.photo_urls),
    ...arrayFrom(metadata.photos).map(normalizePhotoValue),
  ]
    .map(normalizePhotoValue)
    .filter(Boolean);

  const imageUrl = first(row.image_url, row.photo_url, row.primary_photo_url, photoUrls[0]);
  const id = first(row.id, row.pain_id, row.uuid, metadata.pain_id);
  const city = first(row.city, metadata.city, rawFields.city);
  const state = first(row.state, row.operating_state, metadata.state, rawFields.state, rawFields.operating_state);
  const title = first(row.title, row.pain_label, row.name, metadata.title, "Pain Signal");
  const note = first(
    row.note,
    row.notes,
    row.description,
    row.message,
    row.help_requested,
    row.requested_help,
    row.ai_summary,
    row.route_summary,
    metadata.route_summary,
    metadata.note
  );

  return {
    ...row,
    id,
    pain_id: id,
    title,
    pain_label: first(row.pain_label, metadata.pain_label, row.pain_type, metadata.pain_type, "Pain Signal"),
    note,
    notes: first(row.notes, note),
    description: first(row.description, note),
    route_summary: first(row.route_summary, metadata.route_summary, row.ai_summary, note),
    state,
    operating_state: first(row.operating_state, state),
    city,
    area: first(row.area, row.submarket, metadata.area, rawFields.area),
    submarket: first(row.submarket, row.area, metadata.submarket, rawFields.submarket),
    market: first(row.market, [city, state].filter(Boolean).join(", "), metadata.market),
    priority: first(row.priority, row.urgency, row.urgency_level, metadata.priority, "medium"),
    urgency: first(row.urgency, row.urgency_level, row.priority, metadata.urgency, "medium"),
    urgency_level: first(row.urgency_level, row.urgency, row.priority, metadata.urgency, "medium"),
    timeline: first(row.timeline, metadata.timeline),
    confidentiality: first(row.confidentiality, metadata.confidentiality),
    asset_type: first(row.asset_type, metadata.asset_type, rawFields.assetType),
    property_address: first(row.property_address, row.address, row.location, metadata.property_address),
    address: first(row.address, row.property_address, row.location, metadata.address),
    location: first(row.location, row.address, row.property_address, metadata.location),
    best_route: first(row.best_route, row.route_context, metadata.best_route),
    help_requested: first(row.help_requested, row.requested_help, metadata.help_requested),
    requested_help: first(row.requested_help, row.help_requested, metadata.requested_help),
    capital_needed: first(row.capital_needed, metadata.capital_needed),
    asking_price: first(row.asking_price, metadata.asking_price),
    arv_value: first(row.arv_value, row.estimated_value, metadata.arv_value),
    estimated_value: first(row.estimated_value, row.arv_value, metadata.estimated_value),
    repairs_needed: first(row.repairs_needed, row.estimated_repairs, metadata.repairs_needed),
    estimated_repairs: first(row.estimated_repairs, row.repairs_needed, metadata.estimated_repairs),
    image_url: imageUrl,
    photo_url: first(row.photo_url, imageUrl),
    photo_urls: photoUrls,
    photos: Array.isArray(row.photos) ? row.photos : photoUrls,
    signal_id: first(row.signal_id, metadata.signal_id),
    routing_id: first(row.routing_id, metadata.routing_id),
    activity_id: first(row.activity_id, metadata.activity_id),
    member_email: cleanEmail(row.member_email || row.user_email || row.submitted_by || row.email || metadata.member_email || metadata.email),
    user_email: cleanEmail(row.user_email || row.member_email || row.submitted_by || row.email || metadata.user_email || metadata.email),
    submitted_by: cleanEmail(row.submitted_by || row.member_email || row.user_email || row.email || metadata.submitted_by),
    owner_email: cleanEmail(row.owner_email || metadata.owner_email || OWNER_EMAIL),
    status: first(row.status, metadata.status, "new"),
    archived: Boolean(row.archived),
    resolved: Boolean(row.resolved),
    created_at: first(row.created_at, row.updated_at, new Date().toISOString()),
    updated_at: first(row.updated_at, row.created_at, new Date().toISOString()),
    links: directLinks,
    direct_links: directLinks,
    _source_table: REAL_PAIN_TABLE,
    metadata,
  };
}

async function selectRecent(supabase: any) {
  const orderColumns = ["created_at", "updated_at", "id"];
  let lastError = "";

  for (const column of orderColumns) {
    const { data, error } = await supabase
      .from(REAL_PAIN_TABLE)
      .select("*")
      .order(column, { ascending: false })
      .limit(100);

    if (!error && Array.isArray(data)) return { rows: data, error: "" };
    if (error) lastError = error.message || String(error);
  }

  const { data, error } = await supabase.from(REAL_PAIN_TABLE).select("*").limit(100);
  if (!error && Array.isArray(data)) return { rows: data, error: "" };

  return { rows: [], error: error?.message || lastError || "Could not read vf_pain_submissions." };
}

function matchesId(row: AnyRow, id: string) {
  if (!id) return false;
  const metadata = objectFrom(row.metadata);

  return [
    row.id,
    row.pain_id,
    row.uuid,
    row.item_id,
    row.related_deal_id,
    row.signal_id,
    row.routing_id,
    row.activity_id,
    metadata.pain_id,
    metadata.item_id,
    metadata.related_deal_id,
    metadata.signal_id,
    metadata.routing_id,
    metadata.activity_id,
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
    const { rows, error } = await selectRecent(supabase);

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: "Could not load pain feed from vf_pain_submissions.",
          details: error,
          table: REAL_PAIN_TABLE,
        },
        { status: 500 }
      );
    }

    const pains = rows
      .filter((row: AnyRow) => canSee(row, email, owner))
      .filter((row: AnyRow) => (id ? matchesId(row, id) : true))
      .map(normalizePain)
      .sort((a: AnyRow, b: AnyRow) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

    return NextResponse.json({
      ok: true,
      pains,
      pain: id ? pains[0] || null : null,
      count: pains.length,
      table: REAL_PAIN_TABLE,
      source: "api/pain/feed",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not load pain feed.",
        details: error?.message || String(error),
        table: REAL_PAIN_TABLE,
      },
      { status: 500 }
    );
  }
}
