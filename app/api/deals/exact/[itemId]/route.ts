
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
      readCookie(cookie, "vf_login_email") ||
      readCookie(cookie, "vf_admin_email")
  );
}

function isOwnerRequest(request: Request, email: string) {
  const url = new URL(request.url);
  const cookie = request.headers.get("cookie") || "";

  return (
    email === OWNER_EMAIL ||
    request.headers.get("x-vf-admin") === "1" ||
    url.searchParams.get("owner") === "1" ||
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

function normalizeId(value: unknown) {
  return decodeURIComponent(clean(value));
}

function rowId(row: Row) {
  return first(row.id, row.item_id, row.deal_id, row.project_id, row.property_id, row.pain_id, row.source_id);
}

function titleOf(row: Row | null, itemId: string) {
  if (!row) return `Deal room ${itemId}`;

  return first(
    row.title,
    row.deal_title,
    row.project_title,
    row.property_title,
    row.name,
    row.pain_type,
    `Deal room ${itemId}`
  );
}

function noteOf(row: Row | null) {
  if (!row) return "No linked source object has been found yet.";

  return first(
    row.description,
    row.summary,
    row.seller_situation,
    row.event_description,
    row.routing_reason,
    row.ai_explanation,
    row.ai_summary,
    row.requested_help,
    "Live VaultForge execution context."
  );
}

function marketOf(row: Row | null) {
  if (!row) return "";

  return first(
    row.market,
    [row.city, row.state].filter(Boolean).join(", "),
    row.city,
    row.state,
    row.location
  );
}

function safePhotos(row: Row | null) {
  if (!row) return [];

  const values = [
    row.photo_urls,
    row.photos,
    row.image_urls,
    row.images,
    row.photo_url,
    row.image_url,
  ];

  const output: string[] = [];

  for (const value of values) {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        const text = clean(item);
        if (text) output.push(text);
      });
    } else {
      const text = clean(value);
      if (!text) continue;

      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          parsed.forEach((item) => {
            const parsedText = clean(item);
            if (parsedText) output.push(parsedText);
          });
        } else {
          output.push(text);
        }
      } catch {
        output.push(text);
      }
    }
  }

  return Array.from(new Set(output)).slice(0, 12);
}

function publicDeal(row: Row | null, itemId: string) {
  return {
    id: row ? rowId(row) : itemId,
    title: titleOf(row, itemId),
    description: noteOf(row),
    market: marketOf(row),
    city: row?.city || null,
    state: row?.state || null,
    status: first(row?.status, row?.routing_status, row?.deal_status, row?.project_status) || null,
    priority: first(row?.priority, row?.urgency_level, row?.urgency, row?.deal_priority) || null,
    asset_type: first(row?.asset_type, row?.property_type, row?.item_kind) || null,
    strategy: first(row?.strategy, row?.asset_strategy, row?.exit_strategy) || null,
    asking_price: first(row?.asking_price_display, row?.asking_price, row?.price, row?.target_price) || null,
    arv: first(row?.arv_display, row?.arv, row?.value, row?.estimated_value) || null,
    repairs: first(row?.repair_estimate_display, row?.repair_estimate, row?.repairs, row?.estimated_repairs) || null,
    capital_needed: first(row?.capital_needed, row?.funding_needed, row?.loan_amount) || null,
    requested_help: first(row?.requested_help, row?.deal_need, row?.role_needed) || null,
    source_table: row?._source_table || row?.source_table || null,
    source_id: row ? rowId(row) : itemId,
    photos: safePhotos(row),
  };
}

function ownerOnlyDeal(row: Row | null) {
  if (!row) return {};

  return {
    exact_address: first(row.exact_address, row.property_address, row.address, row.full_address) || null,
    contact_name: first(row.contact_name, row.seller_name, row.owner_name, row.member_name) || null,
    contact_email: first(row.contact_email, row.seller_email, row.email, row.member_email) || null,
    contact_phone: first(row.contact_phone, row.seller_phone, row.phone) || null,
    private_notes: first(row.private_notes, row.owner_notes, row.admin_notes) || null,
    raw: row,
  };
}

async function loadByIdFromTable(supabase: any, table: string, itemId: string) {
  const idColumns = [
    "id",
    "item_id",
    "deal_id",
    "project_id",
    "property_id",
    "pain_id",
    "source_id",
  ];

  for (const column of idColumns) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq(column, itemId)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return {
          ...data,
          _source_table: table,
        };
      }
    } catch {
      // Try next column/table.
    }
  }

  return null;
}

async function loadExactItem(supabase: any, itemId: string) {
  const tables = [
    "projects",
    "vf_deals",
    "property_cards",
    "vf_pain_submissions",
    "vf_routing_signals",
    "vf_activity_events",
  ];

  for (const table of tables) {
    const found = await loadByIdFromTable(supabase, table, itemId);
    if (found) return found;
  }

  return null;
}

async function loadRouting(supabase: any, itemId: string, email: string, owner: boolean) {
  try {
    let query = supabase
      .from("vf_routing_actions")
      .select("*")
      .or(
        [
          `item_id.eq.${itemId}`,
          `deal_id.eq.${itemId}`,
          `project_id.eq.${itemId}`,
          `property_id.eq.${itemId}`,
          `pain_id.eq.${itemId}`,
          `signal_id.eq.${itemId}`,
        ].join(",")
      )
      .order("created_at", { ascending: false })
      .limit(25);

    if (!owner) {
      query = query.or(
        [
          `member_email.eq.${email}`,
          `target_email.eq.${email}`,
          `target_member_email.eq.${email}`,
        ].join(",")
      );
    }

    const { data, error } = await query;

    if (error || !Array.isArray(data)) return [];

    return data;
  } catch {
    return [];
  }
}

async function loadSignals(supabase: any, itemId: string, email: string, owner: boolean) {
  try {
    let query = supabase
      .from("vf_routing_signals")
      .select("*")
      .or(
        [
          `id.eq.${itemId}`,
          `source_id.eq.${itemId}`,
          `deal_id.eq.${itemId}`,
        ].join(",")
      )
      .order("created_at", { ascending: false })
      .limit(25);

    if (!owner) {
      query = query.or([`member_email.eq.${email}`, `email.eq.${email}`].join(","));
    }

    const { data, error } = await query;

    if (error || !Array.isArray(data)) return [];

    return data;
  } catch {
    return [];
  }
}

async function loadActivity(supabase: any, itemId: string, email: string, owner: boolean) {
  try {
    let query = supabase
      .from("vf_activity_events")
      .select("*")
      .or(
        [
          `related_deal_id.eq.${itemId}`,
          `related_alert_id.eq.${itemId}`,
          `event_title.ilike.%${itemId}%`,
        ].join(",")
      )
      .order("created_at", { ascending: false })
      .limit(25);

    if (!owner) {
      query = query.or([`member_email.eq.${email}`, `email.eq.${email}`].join(","));
    }

    const { data, error } = await query;

    if (error || !Array.isArray(data)) return [];

    return data;
  } catch {
    return [];
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ itemId: string }> | { itemId: string } }
) {
  try {
    const params = await context.params;
    const itemId = normalizeId(params.itemId);
    const email = requestEmail(request);
    const owner = isOwnerRequest(request, email);

    if (!email) {
      return NextResponse.json(
        {
          ok: false,
          error: "Login email required.",
          deal: null,
          routing: [],
          signals: [],
          activity: [],
        },
        { status: 401 }
      );
    }

    const supabase = supabaseClient();
    const item = await loadExactItem(supabase, itemId);

    const [routing, signals, activity] = await Promise.all([
      loadRouting(supabase, itemId, email, owner),
      loadSignals(supabase, itemId, email, owner),
      loadActivity(supabase, itemId, email, owner),
    ]);

    const deal = publicDeal(item, itemId);

    return NextResponse.json({
      ok: true,
      item_id: itemId,
      visibility: {
        owner,
        email,
      },
      deal,
      owner_only: owner ? ownerOnlyDeal(item) : {},
      routing,
      signals,
      activity,
      execution: {
        contact_release_status: owner ? "owner_view" : "locked",
        intro_status: routing.length ? "routing_created" : "not_started",
        can_request_intro: !owner,
        can_release_contact: owner,
        can_message_owner: true,
        next_actions: owner
          ? [
              "Review routing actions.",
              "Stage a controlled introduction.",
              "Release contact details only when safe.",
              "Move opportunity into execution tracking.",
            ]
          : [
              "Review the deal context.",
              "Request a controlled introduction.",
              "Ask for more information.",
              "Wait for owner approval before contact is released.",
            ],
      },
      health: {
        source_found: Boolean(item),
        source_table: item?._source_table || null,
        fake_data_allowed: false,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not load exact deal payload.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
