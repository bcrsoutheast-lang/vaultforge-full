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

function first(...values: unknown[]) {
  for (const value of values) {
    if (Array.isArray(value)) {
      const found = value.find((item) => clean(item));
      if (found !== undefined) return clean(found);
      continue;
    }

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

function metadataOf(row: AnyRow) {
  return typeof row?.metadata === "object" && row.metadata ? row.metadata : {};
}

function parseJsonArray(value: unknown): any[] {
  if (Array.isArray(value)) return value;

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

function photosFrom(row: AnyRow) {
  const metadata = metadataOf(row);
  const metadataPhotos = parseJsonArray(metadata.photos);
  const rowPhotos = parseJsonArray(row.photos);
  const rowPhotoUrls = parseJsonArray(row.photo_urls);
  const metadataPhotoUrls = parseJsonArray(metadata.photo_urls);

  const urls = [
    row.image_url,
    row.photo_url,
    row.primary_photo_url,
    ...rowPhotoUrls,
    ...metadataPhotoUrls,
    ...rowPhotos.map((photo) => photo?.url || photo?.publicUrl || photo?.public_url || photo?.data_url || photo?.dataUrl),
    ...metadataPhotos.map((photo) => photo?.url || photo?.publicUrl || photo?.public_url || photo?.data_url || photo?.dataUrl),
  ]
    .map(clean)
    .filter(Boolean);

  const uniqueUrls = Array.from(new Set(urls));

  const richPhotos = [
    ...rowPhotos,
    ...metadataPhotos,
    ...uniqueUrls.map((url) => ({ url })),
  ].filter(Boolean);

  return {
    image_url: uniqueUrls[0] || "",
    photo_url: uniqueUrls[0] || "",
    photo_urls: uniqueUrls,
    photos: richPhotos,
  };
}

function ownerEmailFrom(row: AnyRow) {
  const metadata = metadataOf(row);

  const canonical = cleanEmail(
    first(
      row.owner_email,
      metadata.owner_email,
      row.created_by_email,
      metadata.created_by_email,
      row.submitted_by_email,
      metadata.submitted_by_email,
      row.creator_email,
      metadata.creator_email
    )
  );

  if (canonical && canonical !== OWNER_EMAIL) return canonical;

  const legacy = cleanEmail(
    first(
      row.submitted_by,
      metadata.submitted_by,
      row.user_email,
      metadata.user_email,
      row.member_email,
      metadata.member_email,
      row.email,
      metadata.email,
      row.sender_email,
      metadata.sender_email
    )
  );

  if (legacy) return legacy;

  return canonical || "";
}

function canSee(row: AnyRow, email: string, owner: boolean) {
  if (owner) return true;

  const metadata = metadataOf(row);
  const ownerEmail = ownerEmailFrom(row);

  const visible = [
    ownerEmail,
    row.visible_to_email,
    row.recipient_email,
    row.target_email,
    row.assigned_to_email,
    metadata.visible_to_email,
    metadata.recipient_email,
    metadata.target_email,
    metadata.assigned_to_email,
  ]
    .map(cleanEmail)
    .filter(Boolean);

  if (visible.length === 0) return true;
  return visible.includes(email);
}

function titleOf(row: AnyRow) {
  const metadata = metadataOf(row);

  return first(
    row.title,
    row.pain_label,
    row.name,
    row.headline,
    metadata.title,
    metadata.pain_label,
    metadata.name,
    "Pain Signal"
  );
}

function noteOf(row: AnyRow) {
  const metadata = metadataOf(row);

  return first(
    row.note,
    row.notes,
    row.description,
    row.message,
    row.route_summary,
    row.help_requested,
    row.requested_help,
    metadata.note,
    metadata.notes,
    metadata.description,
    metadata.message,
    metadata.route_summary,
    metadata.help_requested,
    metadata.requested_help
  );
}

function painIdOf(row: AnyRow) {
  const metadata = metadataOf(row);
  return first(row.id, row.pain_id, row.uuid, row.item_id, metadata.pain_id, metadata.item_id);
}

function signalIdOf(row: AnyRow) {
  const metadata = metadataOf(row);
  return first(row.signal_id, row.signalId, row.alert_id, row.routing_id, metadata.signal_id, metadata.alert_id, painIdOf(row));
}

function priorityOf(row: AnyRow) {
  const metadata = metadataOf(row);
  return first(row.priority, row.urgency, row.urgency_level, metadata.priority, metadata.urgency, "medium");
}

function marketOf(row: AnyRow) {
  const metadata = metadataOf(row);

  return first(
    row.market,
    [row.city, row.state].filter(Boolean).join(", "),
    row.location,
    row.address,
    metadata.market,
    [metadata.city, metadata.state].filter(Boolean).join(", "),
    metadata.location,
    metadata.address
  );
}

function normalizePain(row: AnyRow, table: string) {
  const metadata = metadataOf(row);
  const photoData = photosFrom(row);
  const ownerEmail = ownerEmailFrom(row) || OWNER_EMAIL;
  const painId = painIdOf(row);
  const signalId = signalIdOf(row);

  return {
    ...row,
    id: painId,
    pain_id: painId,
    signal_id: signalId,
    item_id: first(row.item_id, row.project_id, row.deal_id, row.property_id, row.pain_id, metadata.item_id, painId),
    title: titleOf(row),
    pain_label: first(row.pain_label, metadata.pain_label, row.pain_type, metadata.pain_type, "Pain Signal"),
    pain_type: first(row.pain_type, metadata.pain_type, row.signal_type, metadata.signal_type, "Pain Signal"),
    note: noteOf(row),
    route_summary: first(row.route_summary, metadata.route_summary, noteOf(row)),
    state: first(row.state, row.operating_state, metadata.state, metadata.operating_state),
    city: first(row.city, metadata.city),
    market: marketOf(row),
    priority: priorityOf(row),
    urgency: first(row.urgency, row.urgency_level, metadata.urgency, metadata.urgency_level, priorityOf(row)),
    asset_type: first(row.asset_type, row.property_type, metadata.asset_type, metadata.property_type),
    best_route: first(row.best_route, row.route_context, metadata.best_route, metadata.route_context),
    help_requested: first(row.help_requested, row.requested_help, metadata.help_requested, metadata.requested_help),
    owner_email: ownerEmail,
    created_by_email: first(row.created_by_email, metadata.created_by_email, ownerEmail),
    submitted_by_email: first(row.submitted_by_email, metadata.submitted_by_email, ownerEmail),
    submitted_by: first(row.submitted_by, row.user_email, row.member_email, row.email, metadata.submitted_by, metadata.user_email, metadata.member_email, ownerEmail),
    member_email: first(row.member_email, metadata.member_email, ownerEmail),
    user_email: first(row.user_email, metadata.user_email, ownerEmail),
    created_at: first(row.created_at, metadata.created_at, row.updated_at, new Date().toISOString()),
    updated_at: first(row.updated_at, metadata.updated_at, row.created_at, new Date().toISOString()),
    source_table: table,
    _source_table: table,
    ...photoData,
    metadata,
  };
}

async function selectRecent(supabase: any, table: string, limit = 120) {
  const orderColumns = ["created_at", "updated_at", "id"];

  for (const column of orderColumns) {
    try {
      const { data, error } = await supabase.from(table).select("*").order(column, { ascending: false }).limit(limit);
      if (!error && Array.isArray(data)) return data;
    } catch {
      // Try next order column.
    }
  }

  try {
    const { data, error } = await supabase.from(table).select("*").limit(limit);
    if (!error && Array.isArray(data)) return data;
  } catch {
    // Table may not exist.
  }

  return [];
}

function matchesId(row: AnyRow, id: string) {
  if (!id) return false;
  const metadata = metadataOf(row);

  return [
    row.id,
    row.pain_id,
    row.uuid,
    row.item_id,
    row.related_deal_id,
    row.signal_id,
    row.alert_id,
    row.routing_id,
    metadata.pain_id,
    metadata.item_id,
    metadata.signal_id,
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

    const tables = [
      "vf_pain_submissions",
      "vf_intelligence_signals",
      "vf_routing_signals",
      "pain_requests",
      "vf_pain_requests",
      "vf_pain_signals",
      "pain_signals",
    ];

    const found: AnyRow[] = [];

    for (const table of tables) {
      const rows = await selectRecent(supabase, table, 150);

      for (const row of rows) {
        if (!canSee(row, email, owner)) continue;
        if (id && !matchesId(row, id)) continue;

        found.push(normalizePain(row, table));
      }
    }

    const seen = new Set<string>();
    const pains = found
      .filter((row) => {
        const key = first(row.signal_id, row.id, row.pain_id, row.title, row.created_at);
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
      owner_model: "canonical owner_email first, legacy submitter fallback before BCR",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not load pain feed.",
        details: error?.message || String(error),
        source: "api/pain/feed",
      },
      { status: 500 }
    );
  }
}
