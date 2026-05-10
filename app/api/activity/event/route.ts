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

function normalizeEvent(row: AnyRow, eventType: string, eventId: string) {
  const metadata = typeof row.metadata === "object" && row.metadata ? row.metadata : {};

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
    row.member_email ||
      row.email ||
      row.sender_email ||
      row.from_email ||
      metadata.member_email ||
      metadata.from_email ||
      metadata.email
  );

  const recipientEmail = cleanEmail(
    row.recipient_email ||
      row.to_email ||
      row.target_email ||
      row.owner_email ||
      metadata.recipient_email ||
      metadata.to_email ||
      metadata.target_email ||
      OWNER_EMAIL
  );

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
    recipient_email: recipientEmail,
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
  const metadata = typeof row.metadata === "object" && row.metadata ? row.metadata : {};

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

async function selectById(supabase: any, table: string, eventId: string) {
  const columns = ["id", "event_id", "introduction_id", "response_id"];

  for (const column of columns) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq(column, eventId)
        .limit(1);

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
    if (row && canSee(row, email, owner)) {
      return { row, table };
    }
  }

  for (const table of directTables) {
    const rows = await selectRecent(supabase, table);
    const found = rows.find((row: AnyRow) => rowIdMatches(row, eventId) || rowRelatedMatches(row, eventId));

    if (found && canSee(found, email, owner)) {
      return { row: found, table };
    }
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

      const metadata = typeof row.metadata === "object" && row.metadata ? row.metadata : {};
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

      const match =
        values.includes(eventId) ||
        (signalId && values.includes(signalId)) ||
        (itemId && values.includes(itemId));

      const typeText = clean(row.message_type || row.event_type || row.type || row.source).toLowerCase();
      const isReply =
        typeText.includes("reply") ||
        typeText.includes("message") ||
        typeText.includes("connection") ||
        typeText.includes("response");

      if (match && isReply) {
        replies.push({
          ...row,
          from_email: cleanEmail(row.from_email || row.sender_email || row.member_email || row.email || metadata.from_email || metadata.member_email),
          to_email: cleanEmail(row.to_email || row.recipient_email || row.target_email || row.owner_email || metadata.to_email || metadata.recipient_email),
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
      return NextResponse.json(
        { ok: false, error: "Login email required." },
        { status: 401 }
      );
    }

    if (!eventId) {
      return NextResponse.json(
        { ok: false, error: "Event id required." },
        { status: 400 }
      );
    }

    const supabase = supabaseClient();
    const found = await findEvent(supabase, eventType, eventId, email, owner);

    const rawEvent =
      found.row ||
      ({
        id: eventId,
        event_type: eventType,
        event_title: `${eventType} event`,
        event_description:
          "Exact source row was not found, but this event room can still hold operational replies.",
        priority: "medium",
        owner_email: OWNER_EMAIL,
        created_at: new Date().toISOString(),
      } as AnyRow);

    const event = normalizeEvent(rawEvent, eventType, eventId);
    const replies = await loadReplies(supabase, eventId, event.signal_id, event.item_id, email, owner);

    return NextResponse.json({
      ok: true,
      event,
      replies,
      source_table: found.table || "fallback_event_room",
      direct_reply_to: event.recipient_email || OWNER_EMAIL,
      safety:
        "This endpoint resolves event context and replies only. It does not release private contact information automatically.",
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
