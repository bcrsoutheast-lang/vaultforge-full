import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function clean(value: unknown) {
  return String(value || "").trim();
}

function json(data: Record<string, any>, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

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
      detectSessionInUrl: false,
    },
  });
}

function safePayload(body: any, request: Request) {
  const action = clean(body?.action || body?.event || "room_control");
  const lane = clean(body?.lane || body?.room_lane || "room");
  const roomId = clean(body?.room_id || body?.roomId || body?.id || body?.item_id || "");
  const title = clean(body?.title || body?.room_title || "");
  const stage = clean(body?.stage || body?.status || "");
  const previousStage = clean(body?.previous_stage || body?.previousStage || "");
  const actorEmail = clean(
    body?.actor_email ||
      body?.email ||
      request.headers.get("x-vf-email") ||
      request.headers.get("x-user-email") ||
      ""
  ).toLowerCase();

  return {
    action,
    lane,
    room_id: roomId,
    item_id: roomId,
    title,
    stage,
    previous_stage: previousStage,
    actor_email: actorEmail,
    source: "vaultforge_room_command",
    created_at: new Date().toISOString(),
    metadata: {
      action,
      lane,
      room_id: roomId,
      title,
      stage,
      previous_stage: previousStage,
      actor_email: actorEmail,
      user_agent: request.headers.get("user-agent") || "",
    },
  };
}

async function tryInsert(client: any, table: string, payload: Record<string, any>) {
  try {
    const { data, error } = await client.from(table).insert(payload).select("*").limit(1);

    if (error) {
      return {
        table,
        ok: false,
        error: error.message,
        code: (error as any)?.code || null,
      };
    }

    return {
      table,
      ok: true,
      data: Array.isArray(data) ? data[0] || null : data || null,
    };
  } catch (error: any) {
    return {
      table,
      ok: false,
      error: error?.message || String(error),
      code: null,
    };
  }
}

async function tryUpdateRoom(client: any, payload: Record<string, any>) {
  const lane = clean(payload.lane).toLowerCase();
  const id = clean(payload.room_id);
  const stage = clean(payload.stage);
  const action = clean(payload.action);

  if (!id || (!stage && !action)) {
    return [];
  }

  const updatePayload: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (stage) {
    updatePayload.room_stage = stage;
    updatePayload.stage = stage;
    updatePayload.status = stage;
  }

  if (action) {
    updatePayload.last_room_action = action;
  }

  const tables =
    lane === "opportunity"
      ? ["vf_deals", "deals", "property_cards"]
      : lane === "pressure"
      ? ["pain_requests", "vf_pain_requests", "vf_pain_signals", "pain_signals"]
      : ["vf_deals", "pain_requests", "vf_pain_requests"];

  const attempts: Record<string, any>[] = [];

  for (const table of tables) {
    try {
      const { error } = await client.from(table).update(updatePayload).eq("id", id);

      attempts.push({
        table,
        ok: !error,
        error: error?.message || null,
        code: (error as any)?.code || null,
      });
    } catch (error: any) {
      attempts.push({
        table,
        ok: false,
        error: error?.message || String(error),
        code: null,
      });
    }
  }

  return attempts;
}

export async function POST(request: Request) {
  let body: any = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const payload = safePayload(body, request);

  if (!payload.room_id) {
    return json(
      {
        ok: false,
        error: "Missing room_id.",
        saved: false,
      },
      400
    );
  }

  const client = supabaseAdmin();

  if (!client) {
    return json({
      ok: true,
      saved: false,
      local_only: true,
      warning: "Supabase is not configured. Room control updated locally only.",
      payload_preview: payload,
    });
  }

  const eventPayload = {
    room_id: payload.room_id,
    item_id: payload.item_id,
    lane: payload.lane,
    action: payload.action,
    stage: payload.stage,
    previous_stage: payload.previous_stage,
    title: payload.title,
    actor_email: payload.actor_email,
    source: payload.source,
    metadata: payload.metadata,
    created_at: payload.created_at,
  };

  const activityPayload = {
    event_type: "room_control",
    item_id: payload.room_id,
    signal_id: payload.room_id,
    title: payload.title || `${payload.lane} room control`,
    summary: `${payload.action}${payload.stage ? ` → ${payload.stage}` : ""}`,
    actor_email: payload.actor_email,
    source: payload.source,
    metadata: payload.metadata,
    created_at: payload.created_at,
  };

  const controlTables = [
    "vf_room_control_events",
    "room_control_events",
    "vf_activity_events",
    "activity_events",
  ];

  const attempts: Record<string, any>[] = [];

  for (const table of controlTables) {
    const insertPayload = table.includes("activity") ? activityPayload : eventPayload;
    attempts.push(await tryInsert(client, table, insertPayload));
  }

  const updateAttempts = await tryUpdateRoom(client, payload);
  const saved = attempts.some((attempt) => attempt.ok) || updateAttempts.some((attempt) => attempt.ok);

  return json({
    ok: true,
    saved,
    action: payload.action,
    lane: payload.lane,
    room_id: payload.room_id,
    stage: payload.stage,
    attempts,
    update_attempts: updateAttempts,
    message: saved
      ? "Room control event saved."
      : "Room control updated locally. No matching Supabase room-control table accepted the event yet.",
  });
}
