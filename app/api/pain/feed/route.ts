import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type Row = Record<string, any>;

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

function metadataOf(row: Row) {
  return typeof row?.metadata === "object" && row.metadata ? row.metadata : {};
}

function parseArray(value: unknown): any[] {
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

function photoUrlFromValue(item: any) {
  if (typeof item === "string") return clean(item);

  if (item && typeof item === "object") {
    return clean(
      item.url ||
        item.publicUrl ||
        item.public_url ||
        item.photo_url ||
        item.image_url ||
        item.main_photo_url ||
        item.src ||
        item.href
    );
  }

  return "";
}

function photosFrom(row: Row) {
  const m = metadataOf(row);

  const raw = [
    row.image_url,
    row.photo_url,
    row.main_photo_url,
    row.primary_photo_url,
    row.file_url,
    row.upload_url,
    m.image_url,
    m.photo_url,
    m.main_photo_url,
    m.primary_photo_url,
    m.file_url,
    m.upload_url,
    ...parseArray(row.photo_urls),
    ...parseArray(row.photos),
    ...parseArray(row.files),
    ...parseArray(row.uploads),
    ...parseArray(m.photo_urls),
    ...parseArray(m.photos),
    ...parseArray(m.files),
    ...parseArray(m.uploads),
  ];

  const urls = raw.map(photoUrlFromValue).filter((url) => url.startsWith("http"));
  const unique = Array.from(new Set(urls));

  return {
    image_url: unique[0] || "",
    photo_url: unique[0] || "",
    main_photo_url: unique[0] || "",
    photo_urls: unique,
    photos: unique.map((url) => ({ url })),
  };
}

function field(row: Row, ...keys: string[]) {
  const m = metadataOf(row);
  const values: unknown[] = [];

  for (const key of keys) {
    values.push(row[key]);
    values.push(m[key]);
  }

  return first(...values);
}

function ownerEmailFrom(row: Row) {
  return cleanEmail(field(row, "owner_email", "member_email", "user_email", "submitted_by", "submitted_by_email", "email"));
}

function canSee(row: Row, email: string, owner: boolean) {
  if (owner) return true;
  if (!email) return false;

  const visible = [
    ownerEmailFrom(row),
    cleanEmail(field(row, "visible_to_email", "recipient_email", "target_email", "assigned_to_email")),
  ].filter(Boolean);

  if (!visible.length) return false;
  return visible.includes(email);
}

function idOf(row: Row) {
  return field(row, "pain_id", "request_id", "item_id", "id", "signal_id", "alert_id");
}

function signalIdOf(row: Row) {
  return field(row, "signal_id", "signalId", "alert_id", "routing_id");
}

function canonicalKey(row: Row) {
  return field(row, "canonical_event_id", "signal_id", "pain_id", "request_id", "item_id", "id");
}

function titleOf(row: Row) {
  return field(row, "title", "pain_title", "problem_title", "headline", "name", "address") || "Pain Request";
}

function summaryOf(row: Row) {
  return field(
    row,
    "problem_description",
    "pain_description",
    "description",
    "summary",
    "ai_summary",
    "note",
    "notes",
    "message",
    "help_requested",
    "requested_help",
    "route_summary",
    "ai_route_summary",
    "routing_summary"
  );
}

function marketOf(row: Row) {
  const city = field(row, "city");
  const state = field(row, "state", "market", "operating_state");

  return [city, state].filter(Boolean).join(", ") || field(row, "location", "address") || "Market not listed";
}

function normalizePain(row: Row, table: string) {
  const m = metadataOf(row);
  const photos = photosFrom(row);
  const id = idOf(row);
  const signalId = signalIdOf(row);
  const key = canonicalKey(row) || signalId || id;
  const summary = summaryOf(row);

  return {
    ...m,
    ...row,

    id,
    pain_id: field(row, "pain_id") || id,
    request_id: field(row, "request_id") || id,
    item_id: field(row, "item_id") || id,
    signal_id: signalId || key,
    canonical_event_id: key,

    title: titleOf(row),
    pain_title: field(row, "pain_title") || titleOf(row),
    problem_title: field(row, "problem_title") || titleOf(row),

    summary,
    description: field(row, "description", "problem_description", "pain_description") || summary,
    route_summary: field(row, "route_summary", "ai_route_summary", "routing_summary") || summary,
    ai_route_summary: field(row, "ai_route_summary", "route_summary", "routing_summary") || summary,
    routing_summary: field(row, "routing_summary", "route_summary", "ai_route_summary") || summary,

    owner_email: ownerEmailFrom(row),
    member_email: field(row, "member_email") || ownerEmailFrom(row),
    user_email: field(row, "user_email") || ownerEmailFrom(row),

    status: field(row, "status", "pain_status", "routing_status") || "new",
    pain_status: field(row, "pain_status", "status", "routing_status") || "new",
    urgency: field(row, "urgency", "urgency_level", "priority"),
    urgency_level: field(row, "urgency_level", "urgency", "priority"),
    priority: field(row, "priority", "urgency", "urgency_level"),

    pain_type: field(row, "pain_type", "problem_type", "asset_type", "property_type"),
    problem_type: field(row, "problem_type", "pain_type", "asset_type", "property_type"),
    asset_type: field(row, "asset_type", "property_type", "pain_type", "problem_type"),
    property_type: field(row, "property_type", "asset_type", "pain_type", "problem_type"),

    requested_help: field(row, "requested_help", "help_requested", "routing_needs", "needs"),
    help_requested: field(row, "help_requested", "requested_help", "routing_needs", "needs"),
    routing_needs: field(row, "routing_needs", "needs", "requested_help", "help_requested"),
    needs: field(row, "needs", "routing_needs", "requested_help", "help_requested"),

    city: field(row, "city"),
    state: field(row, "state"),
    market: marketOf(row),
    address: field(row, "address", "property_address", "location"),
    location: field(row, "location", "address", "property_address"),

    asking_price: field(row, "asking_price", "price", "target_price"),
    price: field(row, "price", "asking_price", "target_price"),
    arv: field(row, "arv", "arv_value", "estimated_value", "property_value"),
    arv_value: field(row, "arv_value", "arv", "estimated_value", "property_value"),
    repair_estimate: field(row, "repair_estimate", "repairs_needed", "estimated_repairs", "repair_budget"),
    repairs_needed: field(row, "repairs_needed", "repair_estimate", "estimated_repairs", "repair_budget"),
    capital_needed: field(row, "capital_needed", "funding_needed", "gap_amount"),
    funding_needed: field(row, "funding_needed", "capital_needed", "gap_amount"),
    gap_amount: field(row, "gap_amount", "capital_needed", "funding_needed"),

    beds: field(row, "beds", "bedrooms"),
    bedrooms: field(row, "bedrooms", "beds"),
    baths: field(row, "baths", "bathrooms"),
    bathrooms: field(row, "bathrooms", "baths"),
    sqft: field(row, "sqft", "square_feet", "building_sqft"),
    square_feet: field(row, "square_feet", "sqft", "building_sqft"),
    building_sqft: field(row, "building_sqft", "square_feet", "sqft"),
    acres: field(row, "acres", "land_acres"),
    land_acres: field(row, "land_acres", "acres"),
    occupancy: field(row, "occupancy", "tenant_status", "vacancy_status"),
    zoning: field(row, "zoning", "land_use"),
    timeline: field(row, "timeline", "deadline", "desired_timeline"),
    deadline: field(row, "deadline", "timeline", "desired_timeline"),
    owner_goal: field(row, "owner_goal", "goal", "desired_outcome", "exit_strategy", "strategy"),

    detail_href: id ? `/pain-room/${encodeURIComponent(id)}` : "/pain-feed",
    direct_links: m.direct_links || row.direct_links || {},
    created_at: field(row, "created_at", "updated_at") || new Date().toISOString(),
    updated_at: field(row, "updated_at", "created_at") || new Date().toISOString(),
    source_table: table,
    _source_table: table,
    ...photos,
    metadata: m,
  };
}

function painish(row: Row, table: string) {
  const source = field(row, "source", "source_table").toLowerCase();
  const signalType = field(row, "signal_type", "type").toLowerCase();

  if (table.includes("pain")) return true;
  if (source.includes("pain")) return true;
  if (signalType.includes("pain")) return true;
  if (field(row, "pain_id", "request_id")) return true;

  return false;
}

async function selectRecent(supabase: any, table: string, limit = 200) {
  const orderColumns = ["created_at", "updated_at", "id"];

  for (const column of orderColumns) {
    try {
      const { data, error } = await supabase.from(table).select("*").order(column, { ascending: false }).limit(limit);
      if (!error && Array.isArray(data)) return data;
    } catch {
      // Try next.
    }
  }

  try {
    const { data, error } = await supabase.from(table).select("*").limit(limit);
    if (!error && Array.isArray(data)) return data;
  } catch {
    // Missing table.
  }

  return [];
}

function completenessScore(row: Row) {
  let score = 0;

  for (const key of [
    "title",
    "summary",
    "description",
    "requested_help",
    "urgency",
    "city",
    "state",
    "pain_type",
    "asset_type",
    "photo_urls",
    "main_photo_url",
    "asking_price",
    "arv",
    "repair_estimate",
    "capital_needed",
    "beds",
    "baths",
    "sqft",
    "acres",
  ]) {
    if (field(row, key)) score += 1;
  }

  if (photosFrom(row).photo_urls.length) score += 5;
  if (row._source_table === "vf_pain_submissions") score += 100;
  if (String(row._source_table || "").includes("pain")) score += 20;

  return score;
}

function mergeRows(primary: Row, secondary: Row) {
  const pm = metadataOf(primary);
  const sm = metadataOf(secondary);

  const merged = {
    ...secondary,
    ...primary,
    metadata: {
      ...sm,
      ...pm,
    },
  };

  return normalizePain(merged, first(primary._source_table, secondary._source_table, "merged"));
}

function matchesId(row: Row, id: string) {
  if (!id) return true;

  const values = [
    row.id,
    row.pain_id,
    row.request_id,
    row.item_id,
    row.signal_id,
    row.canonical_event_id,
    field(row, "id", "pain_id", "request_id", "item_id", "signal_id", "canonical_event_id"),
  ]
    .flat()
    .map(clean);

  return values.includes(id);
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
      "vf_pain_requests",
      "pain_requests",
      "vf_pain_signals",
      "pain_signals",
      "vf_routing_signals",
      "vf_routing_actions",
      "vf_activity_events",
    ];

    const found: Row[] = [];

    for (const table of tables) {
      const rows = await selectRecent(supabase, table);

      for (const row of rows) {
        if (!painish(row, table)) continue;
        if (!canSee(row, email, owner)) continue;

        const normalized = normalizePain(row, table);

        if (id && !matchesId(normalized, id)) continue;

        found.push(normalized);
      }
    }

    const byKey = new Map<string, Row>();

    for (const row of found) {
      const key = first(row.canonical_event_id, row.pain_id, row.request_id, row.item_id, row.signal_id, row.id, row.title);
      if (!key) continue;

      const existing = byKey.get(key);

      if (!existing) {
        byKey.set(key, row);
        continue;
      }

      const rowBetter = completenessScore(row) >= completenessScore(existing);
      byKey.set(key, mergeRows(rowBetter ? row : existing, rowBetter ? existing : row));
    }

    const pains = Array.from(byKey.values()).sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );

    return NextResponse.json({
      ok: true,
      pains,
      items: pains,
      signals: pains,
      data: pains,
      pain: id ? pains[0] || null : null,
      count: pains.length,
      source: "api/pain/feed",
      reader: "metadata_first_full_pain_reader",
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
