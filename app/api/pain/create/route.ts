import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AnyRecord = Record<string, any>;

const PAIN_TABLE = "vf_pain_submissions";

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function cleanText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function cleanLower(value: unknown) {
  return cleanText(value).toLowerCase();
}

function firstText(body: AnyRecord, keys: string[]) {
  for (const key of keys) {
    const value = body?.[key];
    const text = cleanText(value);
    if (text) return text;
  }
  return "";
}

function arrayFromAny(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => cleanText(item)).filter(Boolean);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map((item) => cleanText(item)).filter(Boolean);
    } catch {
      return [trimmed];
    }
  }
  return [];
}

function makeId(prefix: string) {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${random}`;
}

function makeDirectLinks(baseUrl: string, painId: string, signalId: string, routingId: string, activityId: string) {
  const base = baseUrl.replace(/\/$/, "");
  return {
    pain_room: `${base}/pain-room/${encodeURIComponent(painId)}`,
    signal_room: `${base}/signals/${encodeURIComponent(signalId)}`,
    routing_room: `${base}/routing-room/${encodeURIComponent(routingId || signalId)}`,
    activity_room: `${base}/activity/pain/${encodeURIComponent(activityId)}`,
    pain_feed: `${base}/pain-feed`,
    alerts: `${base}/alerts`,
    routing_inbox: `${base}/routing-inbox`,
  };
}

function json(data: AnyRecord, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

async function safeInsert(client: any, table: string, payload: AnyRecord) {
  try {
    const { data, error } = await client.from(table).insert(payload).select("*").single();
    if (error) return { data: null, error };
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}

async function bestEffortInsert(client: any, table: string, payload: AnyRecord) {
  try {
    await client.from(table).insert(payload);
  } catch {
    // Best effort only. Pain save must not fail because a secondary signal/activity table is missing.
  }
}

export async function GET() {
  const client = supabaseAdmin();
  if (!client) {
    return json({ ok: false, error: "Supabase environment variables are missing." }, 500);
  }

  return json({
    ok: true,
    route: "/api/pain/create",
    writes_to: PAIN_TABLE,
    message: "Pain create route is live.",
  });
}

export async function POST(request: Request) {
  const client = supabaseAdmin();
  if (!client) {
    return json({ ok: false, error: "Supabase environment variables are missing." }, 500);
  }

  let body: AnyRecord = {};

  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const cookieHeader = request.headers.get("cookie") || "";
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  const submittedBy =
    firstText(body, ["submitted_by", "submittedBy", "user_email", "member_email", "memberEmail", "email"]) ||
    cleanLower(cookieHeader.match(/vf_email=([^;]+)/)?.[1] ? decodeURIComponent(cookieHeader.match(/vf_email=([^;]+)/)?.[1] || "") : "") ||
    "unknown";

  const title = firstText(body, ["title", "headline", "name"]);
  const notes = firstText(body, ["notes", "situation", "details", "description"]);
  const helpRequested = firstText(body, ["help_requested", "helpRequested", "requested_help", "requestedHelp"]);
  const painType = firstText(body, ["pain_type", "painType", "type", "category"]);

  if (!title && !notes && !helpRequested) {
    return json({ ok: false, error: "Missing Pain title, notes, or help requested." }, 400);
  }

  const photoUrls = [
    ...arrayFromAny(body.photo_urls),
    ...arrayFromAny(body.photoUrls),
    ...arrayFromAny(body.photos),
    ...arrayFromAny(body.files),
  ];

  const uniquePhotoUrls = Array.from(new Set(photoUrls.filter(Boolean)));
  const firstPhoto = firstText(body, ["image_url", "imageUrl", "photo_url", "photoUrl"]) || uniquePhotoUrls[0] || "";

  const signalId = firstText(body, ["signal_id", "signalId"]) || makeId("signal");
  const routingId = firstText(body, ["routing_id", "routingId"]) || signalId;
  const activityId = firstText(body, ["activity_id", "activityId"]) || makeId("activity");

  const directLinks = makeDirectLinks(baseUrl, "pending", signalId, routingId, activityId);

  const payload: AnyRecord = {
    member_email: submittedBy,
    submitted_by: submittedBy,
    user_email: submittedBy,
    title: title || painType || "VaultForge Pain Request",
    description: notes || helpRequested || title || "",
    notes,
    help_requested: helpRequested,
    requested_help: helpRequested,
    pain_type: painType || "General Pain",
    urgency: firstText(body, ["urgency", "urgency_level", "urgencyLevel"]),
    urgency_level: firstText(body, ["urgency_level", "urgencyLevel", "urgency"]),
    timeline: firstText(body, ["timeline", "deadline"]),
    confidentiality: firstText(body, ["confidentiality", "privacy"]),
    operating_state: firstText(body, ["operating_state", "operatingState", "state"]),
    state: firstText(body, ["state", "operating_state", "operatingState"]),
    city: firstText(body, ["city"]),
    area: firstText(body, ["area", "submarket"]),
    submarket: firstText(body, ["submarket", "area"]),
    asset_type: firstText(body, ["asset_type", "assetType"]),
    property_address: firstText(body, ["property_address", "propertyAddress", "address", "location"]),
    address: firstText(body, ["address", "property_address", "propertyAddress", "location"]),
    location: firstText(body, ["location", "address", "property_address", "propertyAddress"]),
    capital_needed: firstText(body, ["capital_needed", "capitalNeeded"]),
    asking_price: firstText(body, ["asking_price", "askingPrice"]),
    arv_value: firstText(body, ["arv_value", "arvValue", "estimated_value", "estimatedValue"]),
    repairs_needed: firstText(body, ["repairs_needed", "repairsNeeded", "estimated_repairs", "estimatedRepairs"]),
    estimated_value: firstText(body, ["estimated_value", "estimatedValue", "arv_value", "arvValue"]),
    estimated_repairs: firstText(body, ["estimated_repairs", "estimatedRepairs", "repairs_needed", "repairsNeeded"]),
    image_url: firstPhoto,
    photo_url: firstPhoto,
    photo_urls: uniquePhotoUrls,
    photos: uniquePhotoUrls,
    signal_id: signalId,
    routing_id: routingId,
    activity_id: activityId,
    status: "new",
    routing_status: "new",
    route_context: firstText(body, ["route_context", "routeContext"]) || "buyer / capital / operator",
    direct_links: directLinks,
    archived: false,
    resolved: false,
    updated_at: new Date().toISOString(),
  };

  const insertResult = await safeInsert(client, PAIN_TABLE, payload);

  if (insertResult.error) {
    return json(
      {
        ok: false,
        error: "Pain request could not be saved.",
        table: PAIN_TABLE,
        supabase_error: insertResult.error.message || String(insertResult.error),
        supabase_details: insertResult.error.details || null,
        supabase_hint: insertResult.error.hint || null,
        attempted_keys: Object.keys(payload),
      },
      500,
    );
  }

  const saved = insertResult.data || {};
  const painId = cleanText(saved.id) || cleanText(saved.signal_id) || signalId;
  const savedLinks = makeDirectLinks(baseUrl, painId, signalId, routingId, activityId);

  await bestEffortInsert(client, "vf_activity_events", {
    event_type: "pain_submitted",
    event_id: activityId,
    item_id: painId,
    signal_id: signalId,
    member_email: submittedBy,
    title: payload.title,
    description: notes || helpRequested,
    status: "new",
    source: "pain",
    metadata: { pain_id: painId, direct_links: savedLinks, photo_urls: uniquePhotoUrls },
  });

  await bestEffortInsert(client, "vf_routing_actions", {
    action_type: "pain_routing_needed",
    signal_id: signalId,
    item_id: painId,
    member_email: submittedBy,
    title: payload.title,
    status: "new",
    route_context: payload.route_context,
    metadata: { pain_id: painId, direct_links: savedLinks, photo_urls: uniquePhotoUrls },
  });

  await bestEffortInsert(client, "vf_routing_signals", {
    signal_id: signalId,
    item_id: painId,
    member_email: submittedBy,
    title: payload.title,
    signal_type: "pain",
    status: "new",
    metadata: { pain_id: painId, direct_links: savedLinks, photo_urls: uniquePhotoUrls },
  });

  return json({
    ok: true,
    saved: true,
    table: PAIN_TABLE,
    id: painId,
    pain_id: painId,
    signal_id: signalId,
    routing_id: routingId,
    activity_id: activityId,
    photos_saved: uniquePhotoUrls.length,
    direct_links: savedLinks,
    record: saved,
  });
}
