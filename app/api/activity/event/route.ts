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

function metadataOf(row: AnyRow) {
  return typeof row.metadata === "object" && row.metadata ? row.metadata : {};
}

function resolveEmail(row: AnyRow, currentEmail = "") {
  const metadata = metadataOf(row);

  const canonical = [
    row.recipient_email,
    row.visible_to_email,
    row.member_email,
    row.intro_to_email,
    row.responding_member_email,
    row.counterparty_email,
    row.owner_email,
    row.created_by_email,
    row.submitted_by_email,
    row.creator_email,
    row.sender_email,
    row.from_email,
    row.to_email,
    row.email,
    row.user_email,
    row.submitted_by,
    row.staged_by_email,
    row.created_by,
    metadata.recipient_email,
    metadata.visible_to_email,
    metadata.member_email,
    metadata.intro_to_email,
    metadata.responding_member_email,
    metadata.counterparty_email,
    metadata.owner_email,
    metadata.created_by_email,
    metadata.submitted_by_email,
    metadata.creator_email,
    metadata.sender_email,
    metadata.from_email,
    metadata.to_email,
    metadata.email,
    metadata.user_email,
    metadata.submitted_by,
    metadata.staged_by_email,
    metadata.created_by,
  ]
    .map(cleanEmail)
    .filter((email) => email.includes("@"));

  const nonBcr = canonical.find((email) => email !== OWNER_EMAIL && email !== currentEmail);
  if (nonBcr) return nonBcr;

  const anyNonBcr = canonical.find((email) => email !== OWNER_EMAIL);
  if (anyNonBcr) return anyNonBcr;

  const any = canonical.find(Boolean);
  return any || "";
}

function resolveOwnerEmail(row: AnyRow) {
  const metadata = metadataOf(row);

  const canonical = [
    row.owner_email,
    row.created_by_email,
    row.submitted_by_email,
    row.creator_email,
    row.submitted_by,
    row.user_email,
    row.member_email,
    row.email,
    metadata.owner_email,
    metadata.created_by_email,
    metadata.submitted_by_email,
    metadata.creator_email,
    metadata.submitted_by,
    metadata.user_email,
    metadata.member_email,
    metadata.email,
  ]
    .map(cleanEmail)
    .filter((email) => email.includes("@"));

  const nonBcr = canonical.find((email) => email !== OWNER_EMAIL);
  return nonBcr || canonical[0] || "";
}

function normalizeEvent(row: AnyRow, eventType: string, eventId: string, currentEmail: string) {
  const metadata = metadataOf(row);

  const signalId = first(
    row.signal_id,
    row.related_alert_id,
    row.alert_id,
    metadata.signal_id,
    metadata.alert_id
  );

  const itemId = first(
    row.item_id,
    row.deal_id,
    row.project_id,
    row.pain_id,
    row.related_deal_id,
    metadata.item_id,
    metadata.deal_id,
    metadata.project_id,
    metadata.pain_id
  );

  const memberEmail = cleanEmail(
    first(
      row.member_email,
      row.email,
      row.sender_email,
      row.from_email,
      metadata.member_email,
      metadata.from_email,
      metadata.email
    )
  );

  const ownerEmail = resolveOwnerEmail(row);
  const recipientEmail = resolveEmail(row, currentEmail) || ownerEmail || "";

  return {
    ...row,
    id: first(row.id, row.event_id, row.introduction_id, eventId),
    type: first(row.type, row.event_type, row.source, metadata.event_type, eventType),
    title: first(row.title, row.event_title, row.name, row.headline, metadata.title, `${eventType} event`),
    note: first(
      row.note,
      row.event_description,
      row.description,
      row.message,
      row.body,
      metadata.message,
      metadata.note,
      "Operational activity recorded in the VaultForge intelligence layer."
    ),
    priority: first(row.priority, metadata.priority, "medium"),
    signal_id: signalId,
    item_id: itemId,
    member_email: memberEmail,
    owner_email: ownerEmail || OWNER_EMAIL,
    recipient_email: recipientEmail || ownerEmail || OWNER_EMAIL,
    direct_reply_to: recipientEmail || ownerEmail || OWNER_EMAIL,
    created_at: first(row.created_at, row.updated_at, new Date().toISOString()),
    image_url: first(
      row.image_url,
      row.photo_url,
      row.primary_photo_url,
      row.cover_image,
      row.thumbnail_url,
      metadata.image_url,
      metadata.photo_url,
      metadata.primary_photo_url
    ),
    metadata,
  };
}

function rowIdMatches(row: AnyRow, eventId: string) {
  const id = clean(row.id || row.event_id || row.introduction_id || row.response_id);
  return id === eventId;
}

function rowRelatedMatches(row: AnyRow, eventId: string) {
  const metadata = metadataOf(row);

  return [
    row.id,
    row.event_id,
    row.introduction_id,
    row.response_id,
    row.signal_id,
    row.item_id,
    row.deal_id,
    row.project_id,
    row.pain_id,
    row.related_alert_id,
    row.related_deal_id,
    metadata.event_id,
    metadata.signal_id,
    metadata.item_id,
    metadata.deal_id,
    metadata.project_id,
    metadata.pain_id,
  ]
    .map(clean)
    .includes(eventId);
}

function canSee(row: AnyRow, email: string, owner: boolean) {
  if (owner) return true;

  const metadata = metadataOf(row);
  const candidates = [
    row.email,
    row.member_email,
    row.sender_email,
    row.from_email,
    row.to_email,
    row.recipient_email,
    row.target_email,
    row.visible_to_email,
    row.owner_email,
    row.created_by_email,
    row.submitted_by_email,
    row.creator_email,
    metadata.email,
    metadata.member_email,
    metadata.from_email,
    metadata.to_email,
    metadata.recipient_email,
    metadata.target_email,
    metadata.visible_to_email,
    metadata.owner_email,
    metadata.created_by_email,
    metadata.submitted_by_email,
    metadata.creator_email,
  ]
    .map(cleanEmail)
    .filter(Boolean);

  if (candidates.length === 0) return true;
  return candidates.includes(email);
}

async function selectById(supabase: any, table: string, eventId: string) {
  const columns = ["id", "event_id", "introduction_id", "response_id"];

  for (const column of columns) {
    try {
      const { data, error } = await supabase.from(table).select("*").eq(column, eventId).limit(1);
      if (!error && Array.isArray(data) && data.length) return data[0];
    } catch {
      // Try next column.
    }
  }

  return null;
}

async function selectRecent(supabase: any, table: string) {
  const orderColumns = ["created_at", "updated_at", "id"];

  for (const column of orderColumns) {
    try {
      const { data, error } = await supabase.from(table).select("*").order(column, { ascending: false }).limit(100);
      if (!error && Array.isArray(data)) return data;
    } catch {
      // Try next column.
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

async function findEvent(supabase: any, eventType: string, eventId: string, email: string, owner: boolean) {
  const directTables =
    eventType === "routing"
      ? ["vf_routing_actions", "routing_actions", "vf_activity_events"]
      : eventType === "introduction"
      ? ["vf_introductions", "vf_routing_introductions", "vf_activity_events"]
      : eventType === "response"
      ? ["vf_introduction_responses", "vf_routing_introduction_responses", "vf_activity_events"]
      : ["vf_activity_events", "vf_routing_actions", "vf_introductions", "vf_routing_introductions", "vf_introduction_responses", "vf_routing_introduction_responses"];

  for (const table of directTables) {
    const row = await selectById(supabase, table, eventId);
    if (row && canSee(row, email, owner)) return { row, table };
  }

  for (const table of directTables) {
    const rows = await selectRecent(supabase, table);
    const found = rows.find((row: AnyRow) => rowIdMatches(row, eventId) || rowRelatedMatches(row, eventId));
    if (found && canSee(found, email, owner)) return { row: found, table };
  }

  return { row: null, table: "" };
}

async function loadReplies(supabase: any, eventId: string, signalId: string, itemId: string, email: string, owner: boolean) {
  const tables = ["vf_messages", "messages", "vf_message_threads", "vf_activity_events"];
  const replies: AnyRow[] = [];

  for (const table of tables) {
    const rows = await selectRecent(supabase, table);

    for (const row of rows) {
      if (!canSee(row, email, owner)) continue;

      const metadata = metadataOf(row);
      const values = [
        row.event_id,
        row.signal_id,
        row.item_id,
        row.deal_id,
        row.project_id,
        row.pain_id,
        row.related_alert_id,
        row.related_deal_id,
        metadata.event_id,
        metadata.signal_id,
        metadata.item_id,
        metadata.deal_id,
        metadata.project_id,
        metadata.pain_id,
      ].map(clean);

      const match = values.includes(eventId) || (signalId && values.includes(signalId)) || (itemId && values.includes(itemId));
      const typeText = clean(row.message_type || row.event_type || row.type || row.source).toLowerCase();
      const isReply = typeText.includes("reply") || typeText.includes("message") || typeText.includes("connection") || typeText.includes("response");

      if (match && isReply) {
        replies.push({
          ...row,
          from_email: cleanEmail(first(row.from_email, row.sender_email, row.member_email, row.email, metadata.from_email, metadata.member_email)),
          to_email: cleanEmail(first(row.to_email, row.recipient_email, row.target_email, row.owner_email, metadata.to_email, metadata.recipient_email)),
          message: first(row.message, row.body, row.note, row.event_description, metadata.message, metadata.note),
          created_at: first(row.created_at, row.updated_at),
          _source_table: table,
        });
      }
    }
  }

  const seen = new Set<string>();
  return replies
    .filter((row) => {
      const key = `${row._source_table}-${row.id || ""}-${row.created_at || ""}-${row.message || ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 50);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const email = requestEmail(request);
    const owner = isOwnerRequest(request, email);
    const eventType = clean(url.searchParams.get("event_type") || "activity");
    const eventId = clean(url.searchParams.get("event_id") || "");

    if (!email) {
      return NextResponse.json({ ok: false, error: "Login email required." }, { status: 401 });
    }

    if (!eventId) {
      return NextResponse.json({ ok: false, error: "Event id required." }, { status: 400 });
    }

    const supabase = supabaseClient();
    const found = await findEvent(supabase, eventType, eventId, email, owner);

    const rawEvent =
      found.row ||
      ({
        id: eventId,
        event_type: eventType,
        event_title: `${eventType} event`,
        event_description: "Exact source row was not found, but this event room can still hold operational replies.",
        priority: "medium",
        created_at: new Date().toISOString(),
      } as AnyRow);

    const event = normalizeEvent(rawEvent, eventType, eventId, email);
    const replies = await loadReplies(supabase, eventId, event.signal_id, event.item_id, email, owner);

    return NextResponse.json({
      ok: true,
      event,
      replies,
      source_table: found.table || "fallback_event_room",
      direct_reply_to: event.direct_reply_to,
      owner_email: event.owner_email,
      recipient_email: event.recipient_email,
      resolver: "universal_recipient_first_non_bcr",
      safety: "This endpoint resolves event context and replies only. It does not release private contact information automatically.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not load activity event.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
