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

function compact(value: unknown) {
  return clean(value).replace(/\s+/g, " ");
}

function slug(value: unknown) {
  return compact(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

function field(row: AnyRow, ...keys: string[]) {
  const metadata = metadataOf(row);
  const values: unknown[] = [];

  for (const key of keys) {
    values.push(row[key]);
    values.push(metadata[key]);
  }

  return first(...values);
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
      typeof photo === "string"
        ? photo
        : photo?.url || photo?.publicUrl || photo?.public_url || photo?.data_url || photo?.dataUrl
    ),
    ...metadataPhotos.map((photo) =>
      typeof photo === "string"
        ? photo
        : photo?.url || photo?.publicUrl || photo?.public_url || photo?.data_url || photo?.dataUrl
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

function firstPhotoKey(row: AnyRow) {
  const firstPhoto = photosFrom(row).photo_urls[0] || "";
  const bare = firstPhoto.split("?")[0];
  const parts = bare.split("/").filter(Boolean);
  return slug(parts.slice(-2).join("-") || bare);
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
  return first(
    row.deal_id,
    row.project_id,
    row.item_id,
    row.related_deal_id,
    metadata.deal_id,
    metadata.project_id,
    metadata.item_id,
    metadata.related_deal_id,
    row.id
  );
}

function signalIdOf(row: AnyRow) {
  const metadata = metadataOf(row);
  return first(
    row.signal_id,
    row.signalId,
    row.alert_id,
    row.routing_id,
    metadata.signal_id,
    metadata.signalId,
    metadata.alert_id,
    metadata.routing_id
  );
}

function titleOf(row: AnyRow) {
  const metadata = metadataOf(row);

  return first(
    row.title,
    row.deal_title,
    row.project_title,
    row.name,
    row.headline,
    row.event_title,
    metadata.title,
    metadata.deal_title,
    metadata.project_title,
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
    [row.city, row.state].filter(Boolean).join(", "),
    row.market,
    row.location,
    row.address,
    [metadata.city, metadata.state].filter(Boolean).join(", "),
    metadata.market,
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

function canonicalEventFrom(row: AnyRow) {
  const metadata = metadataOf(row);
  return first(
    row.canonical_event_id,
    metadata.canonical_event_id,
    metadata.signal_id,
    row.signal_id,
    metadata.deal_id,
    row.deal_id,
    row.project_id,
    metadata.project_id,
    row.item_id,
    metadata.item_id,
    row.id
  );
}

function strongDedupeKey(row: AnyRow) {
  const title = slug(titleOf(row));
  const market = slug(marketOf(row));
  const owner = slug(ownerEmailFrom(row));
  const address = slug(field(row, "address", "property_address", "location"));
  const ask = slug(field(row, "asking_price", "price"));
  const arv = slug(field(row, "arv", "arv_value", "estimated_value"));
  const photo = firstPhotoKey(row);

  if (title && (market || address || ask || arv || photo)) {
    return ["deal", title, market, owner, address || photo, ask || arv].filter(Boolean).join("|");
  }

  return canonicalEventFrom(row);
}

function normalizeStatus(value: unknown) {
  const status = clean(value).toLowerCase();
  if (!status) return "new";
  return status;
}

function isWeakMirrorRow(row: AnyRow, table: string) {
  if (table === "vf_deals") return false;

  const hasDealFields = Boolean(
    field(
      row,
      "asking_price",
      "price",
      "arv",
      "arv_value",
      "repair_estimate",
      "repairs_needed",
      "beds",
      "bedrooms",
      "baths",
      "bathrooms",
      "square_feet",
      "sqft",
      "strategy",
      "exit_strategy"
    )
  );

  const hasIdentity = Boolean(titleOf(row) && marketOf(row));
  const hasPhoto = photosFrom(row).photo_urls.length > 0;

  return !hasDealFields && !hasPhoto && !hasIdentity;
}

function normalizeDeal(row: AnyRow, table: string) {
  const metadata = metadataOf(row);
  const photoData = photosFrom(row);
  const ownerEmail = ownerEmailFrom(row) || OWNER_EMAIL;
  const dealId = dealIdOf(row);
  const signalId = signalIdOf(row);
  const canonicalKey = canonicalEventFrom(row) || signalId || dealId || strongDedupeKey(row);
  const routeSummary = first(
    row.route_summary,
    row.routing_summary,
    row.ai_route_summary,
    metadata.route_summary,
    metadata.routing_summary,
    metadata.ai_route_summary,
    noteOf(row)
  );

  const propertyType = field(row, "property_type", "deal_type", "asset_type") || "Deal";
  const askingPrice = field(row, "asking_price", "price");
  const arv = field(row, "arv", "arv_value", "estimated_value");
  const repairs = field(row, "repair_estimate", "repairs_needed", "estimated_repairs");

  return {
    ...metadata,
    ...row,
    id: dealId || canonicalKey,
    deal_id: dealId || canonicalKey,
    project_id: field(row, "project_id") || dealId || canonicalKey,
    item_id: field(row, "item_id") || dealId || canonicalKey,
    signal_id: signalId || "",
    routing_id: field(row, "routing_id") || signalId || "",
    canonical_event_id: canonicalKey,

    title: titleOf(row),
    deal_label: field(row, "deal_label") || propertyType || "Deal Signal",
    signal_type: field(row, "signal_type") || "deal",
    source_kind: "deal",

    note: noteOf(row),
    route_summary: routeSummary,
    routing_summary: field(row, "routing_summary") || routeSummary,
    ai_route_summary: field(row, "ai_route_summary") || routeSummary,

    state: field(row, "state"),
    city: field(row, "city"),
    market: marketOf(row),

    priority: field(row, "priority", "urgency", "urgency_level") || "medium",
    urgency: field(row, "urgency", "urgency_level", "priority") || "medium",
    status: field(row, "status", "routing_status") || "new",
    routing_status: field(row, "routing_status", "status") || "new",

    asset_type: propertyType,
    property_type: propertyType,
    deal_type: field(row, "deal_type") || propertyType,
    strategy: field(row, "strategy"),
    exit_strategy: field(row, "exit_strategy", "strategy"),

    asking_price: askingPrice,
    price: field(row, "price") || askingPrice,
    arv,
    arv_value: field(row, "arv_value") || arv,
    repair_estimate: repairs,
    repairs_needed: field(row, "repairs_needed") || repairs,

    beds: field(row, "beds", "bedrooms"),
    bedrooms: field(row, "bedrooms", "beds"),
    baths: field(row, "baths", "bathrooms"),
    bathrooms: field(row, "bathrooms", "baths"),
    square_feet: field(row, "square_feet", "sqft", "building_sqft"),
    sqft: field(row, "sqft", "square_feet", "building_sqft"),
    building_sqft: field(row, "building_sqft", "square_feet", "sqft"),
    year_built: field(row, "year_built"),
    occupancy: field(row, "occupancy", "occupancy_status", "tenant_status"),
    zoning: field(row, "zoning", "zoning_type"),
    acres: field(row, "acres", "land_acres"),
    land_acres: field(row, "land_acres", "acres"),
    utilities: field(row, "utilities", "utility_access"),
    road_access: field(row, "road_access", "access"),
    noi: field(row, "noi"),
    cap_rate: field(row, "cap_rate"),

    routing_needs: field(row, "routing_needs", "deal_needs", "needs"),
    deal_needs: field(row, "deal_needs", "routing_needs", "needs"),
    needs: field(row, "needs", "routing_needs", "deal_needs"),
    distress_signals: field(row, "distress_signals", "pain_signals", "seller_pressure"),
    seller_situation: field(row, "seller_situation", "private_notes", "access_notes", "distress_signals"),

    capital_needed: field(row, "capital_needed"),
    contractor_scope: field(row, "contractor_scope"),
    operator_scope: field(row, "operator_scope"),
    target_buyer: field(row, "target_buyer"),

    owner_email: ownerEmail,
    created_by_email: field(row, "created_by_email") || ownerEmail,
    submitted_by_email: field(row, "submitted_by_email") || ownerEmail,
    submitted_by: field(row, "submitted_by", "user_email", "member_email", "email") || ownerEmail,
    member_email: field(row, "member_email") || ownerEmail,
    user_email: field(row, "user_email") || ownerEmail,

    detail_href: dealId ? `/deal/detail?id=${encodeURIComponent(dealId)}` : "/projects",
    direct_links: metadata.direct_links || row.direct_links || {},
    created_at: field(row, "created_at", "updated_at") || new Date().toISOString(),
    updated_at: field(row, "updated_at", "created_at") || new Date().toISOString(),
    source_table: table,
    _source_table: table,
    _source_rank: sourceRank(table),
    _dedupe_key: strongDedupeKey(row),
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

function completenessScore(row: AnyRow) {
  let score = 0;
  const important = [
    "asking_price",
    "price",
    "arv",
    "arv_value",
    "repair_estimate",
    "repairs_needed",
    "route_summary",
    "ai_route_summary",
    "routing_needs",
    "deal_needs",
    "beds",
    "bedrooms",
    "baths",
    "bathrooms",
    "square_feet",
    "sqft",
    "strategy",
    "exit_strategy",
    "capital_needed",
    "contractor_scope",
    "operator_scope",
    "target_buyer",
  ];

  for (const key of important) {
    if (field(row, key)) score += 1;
  }

  if (photosFrom(row).photo_urls.length) score += 5;
  if (row._source_table === "vf_deals") score += 100;

  const status = normalizeStatus(field(row, "status", "routing_status"));
  if (status.includes("new") || status.includes("active") || status.includes("open")) score += 3;
  if (status.includes("delete") || status.includes("archive")) score -= 20;

  return score;
}

function mergeString(primary: unknown, secondary: unknown) {
  const a = clean(primary);
  const b = clean(secondary);
  if (a && b && a !== b) return a.length >= b.length ? a : b;
  return a || b;
}

function mergeDeal(primary: AnyRow, secondary: AnyRow) {
  const primaryMeta = metadataOf(primary);
  const secondaryMeta = metadataOf(secondary);

  const mergedMeta = { ...secondaryMeta, ...primaryMeta };
  const merged: AnyRow = { ...secondary, ...primary, metadata: mergedMeta };

  const importantTextFields = [
    "note",
    "notes",
    "description",
    "route_summary",
    "routing_summary",
    "ai_route_summary",
    "routing_needs",
    "deal_needs",
    "needs",
    "distress_signals",
    "seller_situation",
    "contractor_scope",
    "operator_scope",
    "capital_needed",
    "target_buyer",
  ];

  for (const key of importantTextFields) {
    const value = mergeString(primary[key], secondary[key]);
    if (value) merged[key] = value;
  }

  const photos = Array.from(
    new Set([
      ...(Array.isArray(secondary.photo_urls) ? secondary.photo_urls : []),
      ...(Array.isArray(primary.photo_urls) ? primary.photo_urls : []),
      ...(Array.isArray(secondaryMeta.photo_urls) ? secondaryMeta.photo_urls : []),
      ...(Array.isArray(primaryMeta.photo_urls) ? primaryMeta.photo_urls : []),
      ...photosFrom(secondary).photo_urls,
      ...photosFrom(primary).photo_urls,
    ].map(clean).filter(Boolean))
  );

  if (photos.length) {
    merged.photo_urls = photos;
    merged.photos = photos.map((url) => ({ url }));
    merged.main_photo_url = first(primary.main_photo_url, secondary.main_photo_url, photos[0]);
    merged.image_url = first(primary.image_url, secondary.image_url, merged.main_photo_url);
    merged.photo_url = first(primary.photo_url, secondary.photo_url, merged.main_photo_url);
  }

  return normalizeDeal(merged, first(primary.source_table, secondary.source_table, "merged"));
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
        if (!id && isWeakMirrorRow(row, table)) continue;

        found.push(normalizeDeal(row, table));
      }
    }

    const byKey = new Map<string, AnyRow>();

    for (const row of found) {
      const key = first(row._dedupe_key, row.canonical_event_id, row.signal_id, row.deal_id, row.id, row.title);
      if (!key) continue;

      const existing = byKey.get(key);

      if (!existing) {
        byKey.set(key, row);
        continue;
      }

      const rowScore = completenessScore(row);
      const existingScore = completenessScore(existing);

      const rowBetter =
        rowScore > existingScore ||
        (rowScore === existingScore && Number(row._source_rank || 9) < Number(existing._source_rank || 9));

      const preferred = rowBetter ? row : existing;
      const secondary = rowBetter ? existing : row;

      byKey.set(key, mergeDeal(preferred, secondary));
    }

    const deals = Array.from(byKey.values()).sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );

    return NextResponse.json({
      ok: true,
      deals,
      projects: deals,
      items: deals,
      deal: id ? deals[0] || null : null,
      count: deals.length,
      source: "api/deal/feed",
      dedupe_model: "strong fingerprint, vf_deals preferred, weak mirror rows suppressed",
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
