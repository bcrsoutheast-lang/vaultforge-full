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

function requestEmail(request: Request, body: AnyRow) {
  const cookie = request.headers.get("cookie") || "";

  return cleanEmail(
    request.headers.get("x-vf-email") ||
      body.email ||
      body.member_email ||
      readCookie(cookie, "vf_email") ||
      readCookie(cookie, "vf_member_email") ||
      readCookie(cookie, "vf_admin_email")
  );
}

function first(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }

  return "";
}

function photoRecords(body: AnyRow) {
  const photos = Array.isArray(body.photos) ? body.photos : [];
  const photoUrls = Array.isArray(body.photo_urls) ? body.photo_urls : [];

  if (photos.length) {
    return photos.slice(0, 8).map((photo: AnyRow, index: number) => {
      const url = first(photo.url, photo.public_url, photo.data_url, photo.dataUrl);
      return {
        name: first(photo.name, `pain-photo-${index + 1}`),
        size: Number(photo.size || 0),
        type: first(photo.type, "image"),
        path: first(photo.path),
        bucket: first(photo.bucket),
        url,
        public_url: url,
      };
    });
  }

  return photoUrls.slice(0, 8).map((url: string, index: number) => ({
    name: `pain-photo-${index + 1}`,
    size: 0,
    type: "image",
    path: "",
    bucket: "",
    url,
    public_url: url,
  }));
}

async function insertFirstWorking(supabase: any, tables: string[], variants: AnyRow[]) {
  const errors: string[] = [];

  for (const table of tables) {
    for (const payload of variants) {
      try {
        const { data, error } = await supabase
          .from(table)
          .insert(payload)
          .select("*")
          .single();

        if (!error && data) {
          return { ok: true, table, row: data };
        }

        if (error?.message && errors.length < 16) {
          errors.push(`${table}: ${error.message}`);
        }
      } catch (error: any) {
        if (error?.message && errors.length < 16) {
          errors.push(`${table}: ${error.message}`);
        }
      }
    }
  }

  return {
    ok: false,
    error: errors[0] || "No insert target accepted payload.",
    errors,
  };
}

function createSignalPayload(body: AnyRow, painRow: AnyRow, email: string, photos: AnyRow[]) {
  const painId = first(painRow.id, painRow.pain_id, painRow.uuid);
  const title = first(body.title, body.pain_label, "VaultForge pain signal");
  const routeSummary = first(body.route_summary, body.notes, "VaultForge pain signal submitted.");
  const photoUrls = photos.map((photo) => first(photo.url, photo.public_url)).filter(Boolean);
  const primaryPhoto = first(photoUrls[0]);

  return {
    title,
    name: title,
    signal_title: title,
    type: "pain_signal",
    signal_type: "pain",
    priority:
      body.urgency === "emergency"
        ? "urgent"
        : body.urgency === "high"
        ? "high"
        : "medium",
    score: Number(body.urgency_score || 60),
    market: [body.city, body.state].filter(Boolean).join(", "),
    state: body.state,
    city: body.city,
    asset_type: body.asset_type,
    item_id: painId,
    pain_id: painId,
    related_deal_id: painId,
    member_email: email,
    owner_email: OWNER_EMAIL,
    message: routeSummary,
    note: routeSummary,
    description: routeSummary,
    image_url: primaryPhoto || null,
    photo_url: primaryPhoto || null,
    photo_urls: photoUrls,
    source: "adaptive_pain_button",
    source_table: "pain",
    status: "active",
    created_at: new Date().toISOString(),
    metadata: {
      pain_id: painId,
      pain_type: body.pain_type,
      pain_label: body.pain_label,
      route_summary: routeSummary,
      best_route: body.best_route,
      help_requested: body.help_requested,
      photos,
      photo_urls: photoUrls,
      raw_fields: body.raw_fields || {},
    },
  };
}

function createActivityPayload(body: AnyRow, painRow: AnyRow, email: string, signalRow: AnyRow | null, photos: AnyRow[]) {
  const painId = first(painRow.id, painRow.pain_id, painRow.uuid);
  const signalId = first(signalRow?.id, signalRow?.signal_id, signalRow?.uuid);
  const title = first(body.title, body.pain_label, "VaultForge pain signal");
  const routeSummary = first(body.route_summary, body.notes, "VaultForge pain signal submitted.");
  const photoUrls = photos.map((photo) => first(photo.url, photo.public_url)).filter(Boolean);
  const primaryPhoto = first(photoUrls[0]);

  return {
    event_type: "pain_signal",
    type: "pain_signal",
    event_title: title,
    title,
    event_description: routeSummary,
    note: routeSummary,
    message: routeSummary,
    member_email: email,
    owner_email: OWNER_EMAIL,
    related_deal_id: painId,
    item_id: painId,
    pain_id: painId,
    related_alert_id: signalId || null,
    signal_id: signalId || null,
    priority:
      body.urgency === "emergency"
        ? "urgent"
        : body.urgency === "high"
        ? "high"
        : "medium",
    image_url: primaryPhoto || null,
    photo_url: primaryPhoto || null,
    photo_urls: photoUrls,
    visibility: "member",
    source: "adaptive_pain_button",
    created_at: new Date().toISOString(),
    metadata: {
      pain_id: painId,
      signal_id: signalId,
      pain_type: body.pain_type,
      pain_label: body.pain_label,
      route_summary: routeSummary,
      best_route: body.best_route,
      help_requested: body.help_requested,
      photos,
      photo_urls: photoUrls,
    },
  };
}

function createRoutingPayload(body: AnyRow, painRow: AnyRow, email: string, signalRow: AnyRow | null) {
  const painId = first(painRow.id, painRow.pain_id, painRow.uuid);
  const signalId = first(signalRow?.id, signalRow?.signal_id, signalRow?.uuid);
  const title = first(body.title, body.pain_label, "VaultForge pain routing");
  const routeSummary = first(body.route_summary, body.notes, "VaultForge pain signal submitted.");

  return {
    title,
    note: routeSummary,
    role: "buyer",
    route_role: "buyer",
    target_role: body.best_route || "buyer / capital / operator",
    priority:
      body.urgency === "emergency"
        ? "urgent"
        : body.urgency === "high"
        ? "high"
        : "medium",
    score: Number(body.urgency_score || 60),
    signal_id: signalId,
    item_id: painId,
    pain_id: painId,
    member_email: email,
    target_email: email,
    target_member_email: email,
    owner_email: OWNER_EMAIL,
    status: "pending",
    source: "adaptive_pain_button",
    created_at: new Date().toISOString(),
    metadata: {
      pain_id: painId,
      signal_id: signalId,
      pain_type: body.pain_type,
      route_summary: routeSummary,
      best_route: body.best_route,
      help_requested: body.help_requested,
    },
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = requestEmail(request, body);

    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "Login email required." }, { status: 401 });
    }

    if (!clean(body.title)) {
      return NextResponse.json({ ok: false, error: "Pain title required." }, { status: 400 });
    }

    const supabase = supabaseClient();
    const now = new Date().toISOString();
    const photos = photoRecords(body);
    const photoUrls = photos.map((photo) => first(photo.url, photo.public_url)).filter(Boolean);
    const primaryPhoto = first(photoUrls[0]);

    const painCanonical = {
      email,
      member_email: email,
      owner_email: OWNER_EMAIL,
      pain_type: body.pain_type || "general",
      pain_label: body.pain_label || body.pain_type || "Pain Signal",
      title: body.title,
      state: body.state,
      city: body.city,
      county: body.county,
      asset_type: body.asset_type,
      address: body.address,
      confidentiality: body.confidentiality,
      urgency: body.urgency,
      urgency_score: body.urgency_score,
      timeline: body.timeline,
      capital_needed: body.capital_needed,
      asking_price: body.asking_price,
      arv: body.arv,
      repair_estimate: body.repair_estimate,
      help_requested: body.help_requested,
      route_summary: body.route_summary,
      best_route: body.best_route,
      notes: body.notes,
      image_url: primaryPhoto || null,
      photo_url: primaryPhoto || null,
      photo_urls: photoUrls,
      photos,
      photo_count: photos.length,
      status: "new",
      source: "adaptive_pain_button",
      created_at: now,
      updated_at: now,
      metadata: {
        raw_fields: body.raw_fields || {},
        photos,
        photo_urls: photoUrls,
        upload_errors: body.upload_errors || [],
        source: "adaptive_pain_button",
      },
    };

    const painResult = await insertFirstWorking(
      supabase,
      ["pain_requests", "vf_pain_requests", "vf_pain_signals", "pain_signals"],
      [
        painCanonical,
        {
          member_email: painCanonical.member_email,
          email,
          title: painCanonical.title,
          pain_type: painCanonical.pain_type,
          pain_label: painCanonical.pain_label,
          urgency: painCanonical.urgency,
          state: painCanonical.state,
          city: painCanonical.city,
          help_requested: painCanonical.help_requested,
          route_summary: painCanonical.route_summary,
          notes: painCanonical.notes,
          image_url: primaryPhoto || null,
          photo_url: primaryPhoto || null,
          photo_urls: photoUrls,
          photos,
          created_at: now,
          updated_at: now,
          metadata: painCanonical.metadata,
        },
        {
          email,
          title: painCanonical.title,
          message: first(painCanonical.route_summary, painCanonical.notes),
          image_url: primaryPhoto || null,
          photo_url: primaryPhoto || null,
          photo_urls: photoUrls,
          created_at: now,
          metadata: painCanonical.metadata,
        },
      ]
    );

    if (!painResult.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "Pain request could not be saved.",
          details: painResult.error,
          attempts: painResult.errors,
        },
        { status: 500 }
      );
    }

    const signalPayload = createSignalPayload(body, painResult.row, email, photos);
    const signalResult = await insertFirstWorking(
      supabase,
      ["vf_intelligence_signals", "intelligence_signals", "vf_signals", "signals"],
      [
        signalPayload,
        {
          title: signalPayload.title,
          signal_type: signalPayload.signal_type,
          priority: signalPayload.priority,
          score: signalPayload.score,
          market: signalPayload.market,
          item_id: signalPayload.item_id,
          member_email: signalPayload.member_email,
          note: signalPayload.note,
          image_url: primaryPhoto || null,
          photo_url: primaryPhoto || null,
          photo_urls: photoUrls,
          source: signalPayload.source,
          created_at: now,
          metadata: signalPayload.metadata,
        },
      ]
    );

    const signalRow = signalResult.ok ? signalResult.row : null;

    const activityPayload = createActivityPayload(body, painResult.row, email, signalRow, photos);
    const activityResult = await insertFirstWorking(
      supabase,
      ["vf_activity_events", "activity_events"],
      [
        activityPayload,
        {
          event_type: activityPayload.event_type,
          event_title: activityPayload.event_title,
          event_description: activityPayload.event_description,
          member_email: email,
          owner_email: OWNER_EMAIL,
          related_deal_id: activityPayload.related_deal_id,
          related_alert_id: activityPayload.related_alert_id,
          image_url: primaryPhoto || null,
          photo_url: primaryPhoto || null,
          photo_urls: photoUrls,
          visibility: "member",
          metadata: activityPayload.metadata,
        },
        {
          event_type: activityPayload.event_type,
          event_title: activityPayload.event_title,
          event_description: activityPayload.event_description,
          metadata: activityPayload.metadata,
        },
      ]
    );

    const routingPayload = createRoutingPayload(body, painResult.row, email, signalRow);
    const routingResult = await insertFirstWorking(
      supabase,
      ["vf_routing_actions", "routing_actions"],
      [
        routingPayload,
        {
          title: routingPayload.title,
          note: routingPayload.note,
          role: routingPayload.role,
          priority: routingPayload.priority,
          score: routingPayload.score,
          signal_id: routingPayload.signal_id,
          item_id: routingPayload.item_id,
          member_email: routingPayload.member_email,
          owner_email: OWNER_EMAIL,
          status: routingPayload.status,
          source: routingPayload.source,
          created_at: now,
          metadata: routingPayload.metadata,
        },
      ]
    );

    const painId = first(painResult.row?.id, painResult.row?.pain_id, painResult.row?.uuid);
    const signalId = first(signalRow?.id, signalRow?.signal_id, signalRow?.uuid, activityPayload.signal_id);
    const routingId = routingResult.ok ? first(routingResult.row?.id, routingResult.row?.routing_id, routingResult.row?.uuid) : "";
    const activityId = activityResult.ok ? first(activityResult.row?.id, activityResult.row?.event_id, activityResult.row?.uuid) : "";

    return NextResponse.json({
      ok: true,
      message: "Pain signal submitted and routed into VaultForge intelligence.",
      pain: painResult,
      signal: signalResult,
      activity: activityResult,
      routing: routingResult,
      photo_urls: photoUrls,
      photos,
      links: {
        pain_id: painId,
        signal_id: signalId,
        routing_id: routingId,
        activity_id: activityId,
        pain_room: painId ? `/pain-room/${encodeURIComponent(painId)}` : "/pain-feed",
        signal_room: signalId ? `/signals/${encodeURIComponent(signalId)}` : "/alerts",
        routing_room: signalId ? `/routing-room/${encodeURIComponent(signalId)}` : "/routing-inbox",
        activity_room: activityId ? `/activity/pain_signal/${encodeURIComponent(activityId)}` : "/activity",
      },
      next: {
        pain_feed: "/pain-feed",
        activity: "/activity",
        alerts: "/alerts",
        routing_inbox: "/routing-inbox",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Pain create route failed.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
