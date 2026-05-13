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
      return value
        .split(/[,\n|;]/)
        .map((item) => item.trim())
        .filter(Boolean);
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
    row.main_photo_url,
    row.primary_photo_url,
    metadata.image_url,
    metadata.photo_url,
    metadata.main_photo_url,
    metadata.primary_photo_url,
    ...rowPhotoUrls,
    ...metadataPhotoUrls,
    ...rowPhotos.map((photo) =>
      typeof photo === "string" ? photo : photo?.url || photo?.publicUrl || photo?.public_url || photo?.data_url || photo?.dataUrl
    ),
    ...metadataPhotos.map((photo) =>
      typeof photo === "string" ? photo : photo?.url || photo?.publicUrl || photo?.public_url || photo?.data_url || photo?.dataUrl
    ),
  ]
    .map(clean)
    .filter((url) => url.startsWith("http"));

  const uniqueUrls = Array.from(new Set(urls));

  return {
    image_url: uniqueUrls[0] || "",
    photo_url: uniqueUrls[0] || "",
    main_photo_url: uniqueUrls[0] || "",
    photo_urls: uniqueUrls,
    photos: uniqueUrls.map((url) => ({ url })),
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
    row.member_email,
    metadata.visible_to_email,
    metadata.recipient_email,
    metadata.target_email,
    metadata.assigned_to_email,
    metadata.member_email,
  ]
    .map(cleanEmail)
    .filter(Boolean);

  if (visible.length === 0) return false;
  return visible.includes(email);
}

function dealIdOf(row: AnyRow) {
  const metadata = metadataOf(row);
  return first(row.deal_id, row.project_id, row.item_id, row.related_deal_id, metadata.deal_id, metadata.project_id, metadata.item_id, metadata.related_deal_id, row.id);
}

function signalIdOf(row: AnyRow) {
  const metadata = metadataOf(row);
  return first(row.signal_id, row.signalId, row.alert_id, row.routing_id, metadata.signal_id, metadata.signalId, metadata.alert_id, metadata.routing_id);
}

function canonicalKeyOf(row: AnyRow) {
  const metadata = metadataOf(row);
  return first(
    row.canonical_event_id,
    metadata.canonical_event_id,
    signalIdOf(row),
    dealIdOf(row)
  );
}

function titleOf(row: AnyRow) {
  const metadata = metadataOf(row);

  return first(
    row.title,
    row.deal_title,
    row.name,
    row.headline,
    row.event_title,
    metadata.title,
    metadata.deal_title,
    metadata.name,
    metadata.event_title,
    "Deal Signal"
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
    row.routing_summary,
    row.ai_route_summary,
    row.reason,
    row.event_description,
    metadata.note,
    metadata.notes,
    metadata.description,
    metadata.message,
    metadata.route_summary,
    metadata.routing_summary,
    metadata.ai_route_summary,
    metadata.reason,
    metadata.event_description
  );
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

function sourceRank(table: string) {
  if (table === "vf_deals") return 1;
  if (table === "vf_routing_signals") return 2;
  if (table === "vf_routing_actions") return 3;
  if (table === "vf_activity_events") return 4;
  return 9;
}

function normalizeDeal(row: AnyRow, table: string) {
  const metadata = metadataOf(row);
  const photoData = photosFrom(row);
  const ownerEmail = ownerEmailFrom(row) || OWNER_EMAIL;
  const dealId = dealIdOf(row);
  const signalId = signalIdOf(row);
  const canonicalKey = canonicalKeyOf(row) || signalId || dealId;

  const askingPrice = first(row.asking_price, row.price, metadata.asking_price, metadata.price);
  const arv = first(row.arv, row.arv_value, row.estimated_value, metadata.arv, metadata.arv_value, metadata.estimated_value);
  const repairs = first(row.repair_estimate, row.repairs_needed, row.estimated_repairs, metadata.repair_estimate, metadata.repairs_needed, metadata.estimated_repairs);
  const propertyType = first(row.property_type, row.deal_type, row.asset_type, metadata.property_type, metadata.deal_type, metadata.asset_type, "Deal");
  const routeSummary = first(row.route_summary, row.routing_summary, row.ai_route_summary, metadata.route_summary, metadata.routing_summary, metadata.ai_route_summary, noteOf(row));

  return {
    ...metadata,
    ...row,
    id: dealId || canonicalKey,
    deal_id: dealId || canonicalKey,
    project_id: first(row.project_id, metadata.project_id, dealId),
    item_id: first(row.item_id, metadata.item_id, dealId),
    signal_id: signalId || canonicalKey,
    routing_id: first(row.routing_id, metadata.routing_id, signalId),
    canonical_event_id: canonicalKey,

    title: titleOf(row),
    deal_label: first(row.deal_label, metadata.deal_label, propertyType, "Deal Signal"),
    signal_type: first(row.signal_type, metadata.signal_type, "deal"),
    source_kind: "deal",

    note: noteOf(row),
    route_summary: routeSummary,
    routing_summary: first(row.routing_summary, metadata.routing_summary, routeSummary),
    ai_route_summary: first(row.ai_route_summary, metadata.ai_route_summary, routeSummary),

    state: first(row.state, metadata.state),
    city: first(row.city, metadata.city),
    market: marketOf(row),

    priority: first(row.priority, row.urgency, row.urgency_level, metadata.priority, metadata.urgency, "medium"),
    urgency: first(row.urgency, row.urgency_level, metadata.urgency, metadata.urgency_level, row.priority, "medium"),
    status: first(row.status, row.routing_status, metadata.status, metadata.routing_status, "new"),
    routing_status: first(row.routing_status, metadata.routing_status, row.status, "new"),

    asset_type: propertyType,
    property_type: propertyType,
    deal_type: first(row.deal_type, metadata.deal_type, propertyType),
    strategy: first(row.strategy, metadata.strategy),
    exit_strategy: first(row.exit_strategy, metadata.exit_strategy, row.strategy, metadata.strategy),

    asking_price: askingPrice,
    price: first(row.price, metadata.price, askingPrice),
    arv,
    arv_value: first(row.arv_value, metadata.arv_value, arv),
    repair_estimate: repairs,
    repairs_needed: first(row.repairs_needed, metadata.repairs_needed, repairs),

    beds: first(row.beds, row.bedrooms, metadata.beds, metadata.bedrooms),
    bedrooms: first(row.bedrooms, row.beds, metadata.bedrooms, metadata.beds),
    baths: first(row.baths, row.bathrooms, metadata.baths, metadata.bathrooms),
    bathrooms: first(row.bathrooms, row.baths, metadata.bathrooms, metadata.baths),
    square_feet: first(row.square_feet, row.sqft, row.building_sqft, metadata.square_feet, metadata.sqft, metadata.building_sqft),
    sqft: first(row.sqft, row.square_feet, row.building_sqft, metadata.sqft, metadata.square_feet, metadata.building_sqft),
    building_sqft: first(row.building_sqft, row.square_feet, row.sqft, metadata.building_sqft, metadata.square_feet, metadata.sqft),
    year_built: first(row.year_built, metadata.year_built),
    occupancy: first(row.occupancy, metadata.occupancy),
    zoning: first(row.zoning, metadata.zoning),
    acres: first(row.acres, row.land_acres, metadata.acres, metadata.land_acres),
    land_acres: first(row.land_acres, row.acres, metadata.land_acres, metadata.acres),
    utilities: first(row.utilities, metadata.utilities),
    road_access: first(row.road_access, metadata.road_access),
    noi: first(row.noi, metadata.noi),
    cap_rate: first(row.cap_rate, metadata.cap_rate),

    routing_needs: first(row.routing_needs, row.deal_needs, row.needs, metadata.routing_needs, metadata.deal_needs, metadata.needs),
    deal_needs: first(row.deal_needs, metadata.deal_needs, row.routing_needs, metadata.routing_needs),
    needs: first(row.needs, metadata.needs, row.routing_needs, metadata.routing_needs),
    distress_signals: first(row.distress_signals, metadata.distress_signals),
    seller_situation: first(row.seller_situation, metadata.seller_situation),

    owner_email: ownerEmail,
    created_by_email: first(row.created_by_email, metadata.created_by_email, ownerEmail),
    submitted_by_email: first(row.submitted_by_email, metadata.submitted_by_email, ownerEmail),
    submitted_by: first(row.submitted_by, row.user_email, row.member_email, row.email, metadata.submitted_by, metadata.user_email, metadata.member_email, ownerEmail),
    member_email: first(row.member_email, metadata.member_email, ownerEmail),
    user_email: first(row.user_email, metadata.user_email, ownerEmail),

    detail_href: dealId ? `/deal/detail?id=${encodeURIComponent(dealId)}` : "/projects",
    direct_links: metadata.direct_links || row.direct_links || {},
    created_at: first(row.created_at, metadata.created_at, row.updated_at, new Date().toISOString()),
    updated_at: first(row.updated_at, metadata.updated_at, row.created_at, new Date().toISOString()),
    source_table: table,
    _source_table: table,
    _source_rank: sourceRank(table),
    ...photoData,
    metadata,
  };
}

async function selectRecent(supabase: any, table: string, limit = 160) {
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
    row.deal_id,
    row.project_id,
    row.item_id,
    row.related_deal_id,
    row.signal_id,
    row.alert_id,
    row.routing_id,
    row.canonical_event_id,
    metadata.deal_id,
    metadata.project_id,
    metadata.item_id,
    metadata.related_deal_id,
    metadata.signal_id,
    metadata.canonical_event_id,
  ]
    .map(clean)
    .includes(id);
}

function dealish(row: AnyRow, table: string) {
  const metadata = metadataOf(row);
  const source = first(row.source, row.source_table, metadata.source, metadata.source_table, table).toLowerCase();
  const signalType = first(row.signal_type, metadata.signal_type, row.type, metadata.type).toLowerCase();

  if (table === "vf_deals") return true;
  if (source.includes("deal")) return true;
  if (signalType.includes("deal")) return true;
  if (first(row.deal_id, metadata.deal_id)) return true;
  if (first(row.canonical_event_id, metadata.canonical_event_id).startsWith("deal_signal")) return true;

  return false;
}

function mergeDeal(base: AnyRow, next: AnyRow) {
  const merged: AnyRow = { ...next, ...base };

  const baseMeta = metadataOf(base);
  const nextMeta = metadataOf(next);

  merged.metadata = { ...nextMeta, ...baseMeta };
  merged.photo_urls = Array.from(new Set([...(next.photo_urls || []), ...(base.photo_urls || [])].map(clean).filter(Boolean)));
  merged.photos = merged.photo_urls.map((url: string) => ({ url }));
  merged.main_photo_url = first(base.main_photo_url, next.main_photo_url, merged.photo_urls[0]);
  merged.image_url = first(base.image_url, next.image_url, merged.main_photo_url);
  merged.photo_url = first(base.photo_url, next.photo_url, merged.main_photo_url);

  return normalizeDeal(merged, first(base.source_table, next.source_table, "merged"));
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
      "vf_deals",
      "vf_routing_signals",
      "vf_routing_actions",
      "vf_activity_events",
    ];

    const found: AnyRow[] = [];

    for (const table of tables) {
      const rows = await selectRecent(supabase, table, 180);

      for (const row of rows) {
        if (!dealish(row, table)) continue;
        if (!canSee(row, email, owner)) continue;
        if (id && !matchesId(row, id)) continue;

        found.push(normalizeDeal(row, table));
      }
    }

    const byKey = new Map<string, AnyRow>();

    for (const row of found) {
      const key = first(row.canonical_event_id, row.deal_id, row.signal_id, row.id, row.title);
      if (!key) continue;

      const existing = byKey.get(key);

      if (!existing) {
        byKey.set(key, row);
        continue;
      }

      const preferred = row._source_rank < existing._source_rank ? row : existing;
      const secondary = row._source_rank < existing._source_rank ? existing : row;
      byKey.set(key, mergeDeal(preferred, secondary));
    }

    const deals = Array.from(byKey.values())
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

    return NextResponse.json({
      ok: true,
      deals,
      projects: deals,
      items: deals,
      deal: id ? deals[0] || null : null,
      count: deals.length,
      source: "api/deal/feed",
      mirrors: "api/pain/feed",
      dedupe_model: "one deal per canonical_event_id",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not load deal feed.",
        details: error?.message || String(error),
        source: "api/deal/feed",
      },
      { status: 500 }
    );
  }
}
