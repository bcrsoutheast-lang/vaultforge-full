import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type AnyRow = Record<string, any>;

type RouteContext = {
  params: Promise<{ signalId?: string }> | { signalId?: string };
};

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
      const found = value.find((entry) => clean(entry));
      if (clean(found)) return clean(found);
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

function parseJsonObject(value: unknown): AnyRow {
  if (typeof value === "object" && value && !Array.isArray(value)) return value as AnyRow;

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === "object" && parsed && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  return {};
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

  if (canonical) return canonical;

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

  return legacy;
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

function idsFor(row: AnyRow) {
  const metadata = metadataOf(row);

  return [
    row.id,
    row.signal_id,
    row.pain_id,
    row.project_id,
    row.item_id,
    row.deal_id,
    row.property_id,
    row.uuid,
    row.alert_id,
    row.routing_id,
    metadata.id,
    metadata.signal_id,
    metadata.pain_id,
    metadata.project_id,
    metadata.item_id,
    metadata.deal_id,
    metadata.property_id,
    metadata.alert_id,
  ]
    .map(clean)
    .filter(Boolean);
}

function matchesSignalId(row: AnyRow, signalId: string) {
  return idsFor(row).includes(signalId);
}

function titleOf(row: AnyRow, signalId: string) {
  const metadata = metadataOf(row);

  return first(
    row.title,
    row.name,
    row.headline,
    row.signal_title,
    row.alert_title,
    row.pain_label,
    row.pain_type,
    metadata.title,
    metadata.name,
    metadata.headline,
    metadata.signal_title,
    metadata.alert_title,
    metadata.pain_label,
    metadata.pain_type,
    `Signal ${signalId}`
  );
}

function noteOf(row: AnyRow) {
  const metadata = metadataOf(row);

  return first(
    row.note,
    row.notes,
    row.description,
    row.message,
    row.summary,
    row.reason,
    row.route_summary,
    row.help_requested,
    metadata.note,
    metadata.notes,
    metadata.description,
    metadata.message,
    metadata.summary,
    metadata.reason,
    metadata.route_summary,
    metadata.help_requested,
    "Exact signal context and routing intelligence."
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

function priorityOf(row: AnyRow) {
  const metadata = metadataOf(row);
  return first(row.priority, row.urgency, row.severity, row.alert_priority, metadata.priority, metadata.urgency, "medium").toLowerCase();
}

function itemIdOf(row: AnyRow) {
  const metadata = metadataOf(row);
  return first(row.item_id, row.project_id, row.deal_id, row.property_id, row.pain_id, metadata.item_id, metadata.project_id, metadata.deal_id, metadata.property_id, metadata.pain_id, row.id);
}

function normalizeSignal(row: AnyRow, signalId: string, sourceTable: string) {
  const metadata = metadataOf(row);
  const photoData = photosFrom(row);
  const ownerEmail = ownerEmailFrom(row) || OWNER_EMAIL;
  const rawDirectLinks = parseJsonObject(row.direct_links || metadata.direct_links);

  const resolvedSignalId = first(row.signal_id, metadata.signal_id, signalId, row.id);
  const itemId = itemIdOf(row);

  const directLinks = {
    dashboard: "/dashboard",
    intelligence: "/intelligence",
    signals: "/signals",
    signal_room: `/signals/${encodeURIComponent(resolvedSignalId || signalId)}`,
    pain_room: itemId ? `/pain-room/${encodeURIComponent(itemId)}` : "",
    project_room: itemId ? `/deal-room/${encodeURIComponent(itemId)}` : "",
    routing_room: `/routing-room/${encodeURIComponent(resolvedSignalId || signalId)}`,
    message_owner: `/messages/new?recipient=${encodeURIComponent(ownerEmail)}&to=${encodeURIComponent(ownerEmail)}&owner_email=${encodeURIComponent(ownerEmail)}&signal_id=${encodeURIComponent(resolvedSignalId || signalId)}&item_id=${encodeURIComponent(itemId)}&subject=${encodeURIComponent(titleOf(row, signalId))}`,
    messages: "/messages",
    ...rawDirectLinks,
  };

  return {
    ...row,
    id: first(row.id, resolvedSignalId, signalId),
    signal_id: resolvedSignalId || signalId,
    item_id: itemId,
    title: titleOf(row, signalId),
    note: noteOf(row),
    summary: first(row.summary, metadata.summary, noteOf(row)),
    route_summary: first(row.route_summary, metadata.route_summary, noteOf(row)),
    priority: priorityOf(row),
    urgency: first(row.urgency, metadata.urgency, priorityOf(row)),
    status: first(row.status, metadata.status, "active"),
    market: marketOf(row),
    city: first(row.city, metadata.city),
    state: first(row.state, metadata.state, row.operating_state, metadata.operating_state),
    asset_type: first(row.asset_type, row.property_type, row.item_kind, metadata.asset_type, metadata.property_type, metadata.item_kind),
    strategy: first(row.strategy, row.asset_strategy, row.exit_strategy, metadata.strategy, metadata.asset_strategy, metadata.exit_strategy),
    role_needed: first(row.role_needed, row.target_role, row.deal_need, metadata.role_needed, metadata.target_role, metadata.deal_need, "Buyer"),
    owner_email: ownerEmail,
    created_by_email: first(row.created_by_email, metadata.created_by_email, ownerEmail),
    submitted_by_email: first(row.submitted_by_email, metadata.submitted_by_email, ownerEmail),
    submitted_by: first(row.submitted_by, row.user_email, row.member_email, row.email, ownerEmail),
    member_email: first(row.member_email, metadata.member_email, ownerEmail),
    user_email: first(row.user_email, metadata.user_email, ownerEmail),
    created_at: first(row.created_at, metadata.created_at, row.updated_at, new Date().toISOString()),
    updated_at: first(row.updated_at, metadata.updated_at, row.created_at, new Date().toISOString()),
    source_table: sourceTable,
    _source_table: sourceTable,
    direct_links: directLinks,
    ...photoData,
    metadata,
  };
}

function signalScore(signal: AnyRow | null, routingActions: AnyRow[], messages: AnyRow[], activity: AnyRow[]) {
  if (!signal) return 0;

  let score = 50;
  const priority = priorityOf(signal);

  if (priority === "urgent") score += 20;
  if (priority === "high") score += 12;
  if (marketOf(signal)) score += 5;
  if (first(signal.strategy, signal.asset_strategy, signal.exit_strategy)) score += 5;
  if (itemIdOf(signal)) score += 5;
  if (routingActions.length > 0) score += 8;
  if (messages.length > 0) score += 4;
  if (activity.length > 0) score += 3;
  if (photosFrom(signal).photo_urls.length > 0) score += 3;

  return Math.max(0, Math.min(100, Math.round(score)));
}

async function selectRecent(supabase: any, table: string, limit = 100) {
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
    // Table may not exist yet.
  }

  return [];
}

async function findSignal(supabase: any, signalId: string, email: string, owner: boolean) {
  const tables = [
    "vf_pain_submissions",
    "vf_intelligence_signals",
    "vf_routing_signals",
    "vf_routing_actions",
    "property_cards",
    "projects",
    "vf_projects",
    "pain_requests",
    "vf_pain_requests",
    "vf_pain_signals",
    "pain_signals",
  ];

  for (const table of tables) {
    const rows = await selectRecent(supabase, table, 200);
    const found = rows.find((row: AnyRow) => matchesSignalId(row, signalId) && canSee(row, email, owner));
    if (found) return normalizeSignal(found, signalId, table);
  }

  return null;
}

function rowMatchesContext(row: AnyRow, signalId: string, itemId: string) {
  const ids = idsFor(row);
  if (ids.includes(signalId)) return true;
  if (itemId && ids.includes(itemId)) return true;

  return false;
}

async function relatedRows(supabase: any, tables: string[], signalId: string, itemId: string, email: string, owner: boolean, limit = 80) {
  const output: AnyRow[] = [];

  for (const table of tables) {
    const rows = await selectRecent(supabase, table, limit);

    for (const row of rows) {
      if (!rowMatchesContext(row, signalId, itemId)) continue;
      if (!canSee(row, email, owner)) continue;
      output.push({ ...row, _source_table: table });
    }
  }

  return output.sort((a, b) => new Date(first(b.created_at, b.updated_at, 0)).getTime() - new Date(first(a.created_at, a.updated_at, 0)).getTime());
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const params = await context.params;
    const signalId = clean(decodeURIComponent(params?.signalId || ""));
    const url = new URL(request.url);
    const email = requestEmail(request);
    const owner = isOwnerRequest(request, email);

    if (!signalId) {
      return NextResponse.json({ ok: false, error: "Signal ID required." }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ ok: false, error: "Login email required." }, { status: 401 });
    }

    const supabase = supabaseClient();
    const signal = await findSignal(supabase, signalId, email, owner);

    const itemId = itemIdOf(signal || { id: signalId, signal_id: signalId });
    const resolvedSignalId = first(signal?.signal_id, signalId);

    const [routingActions, messages, activity, alerts] = await Promise.all([
      relatedRows(supabase, ["vf_routing_actions", "routing_actions"], resolvedSignalId, itemId, email, owner, 80),
      relatedRows(supabase, ["vf_messages", "messages", "message_threads", "vf_message_threads"], resolvedSignalId, itemId, email, owner, 80),
      relatedRows(supabase, ["vf_activity_events", "activity_events"], resolvedSignalId, itemId, email, owner, 80),
      relatedRows(supabase, ["vf_alerts", "alerts", "vf_intelligence_signals"], resolvedSignalId, itemId, email, owner, 80),
    ]);

    const fallbackSignal =
      signal ||
      normalizeSignal(
        {
          id: signalId,
          signal_id: signalId,
          title: `Signal ${signalId}`,
          note: "This signal room exists, but no matching source record was found yet.",
          owner_email: OWNER_EMAIL,
          status: "review",
        },
        signalId,
        "fallback"
      );

    const score = signalScore(fallbackSignal, routingActions, messages, activity);

    return NextResponse.json({
      ok: true,
      signal: fallbackSignal,
      owner_email: fallbackSignal.owner_email || OWNER_EMAIL,
      item_id: itemId,
      signal_id: resolvedSignalId,
      routing_actions: routingActions,
      messages,
      activity,
      alerts,
      counts: {
        routing_actions: routingActions.length,
        messages: messages.length,
        activity: activity.length,
        alerts: alerts.length,
        photos: Array.isArray(fallbackSignal.photo_urls) ? fallbackSignal.photo_urls.length : 0,
      },
      score,
      current_user: {
        email,
        owner,
      },
      direct_links: fallbackSignal.direct_links || {},
      source: "api/signals/[signalId]",
      debug: url.searchParams.get("debug") === "1" ? { source_table: fallbackSignal.source_table, owner_email: fallbackSignal.owner_email } : undefined,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not load signal.",
        details: error?.message || String(error),
        source: "api/signals/[signalId]",
      },
      { status: 500 }
    );
  }
}
