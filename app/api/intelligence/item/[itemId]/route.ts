import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type AnyRecord = Record<string, any>;

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

function normalizeItem(row: AnyRecord, table: string) {
  const id = first(row.id, row.item_id, row.deal_id, row.project_id, row.property_id, row.pain_id);

  return {
    ...row,
    id,
    item_id: id,
    source_table: table,
    item_kind: first(row.item_kind, row.kind, row.type, table),

    title: first(
      row.title,
      row.project_title,
      row.deal_title,
      row.property_title,
      row.name,
      row.address,
      row.headline,
      `${table} ${id}`
    ),

    description: first(
      row.description,
      row.summary,
      row.notes,
      row.note,
      row.seller_situation,
      row.problem,
      row.message
    ),

    city: first(row.city, row.market_city),
    state: first(row.state, row.market_state, row.region),
    market: first(row.market, [row.city, row.state].filter(Boolean).join(", "), row.state),
    property_type: first(row.property_type, row.asset_type, row.type),
    strategy: first(row.strategy, row.asset_strategy, row.exit_strategy),
    status: first(row.status, row.project_status, row.deal_status),

    asking_price: first(row.asking_price, row.price, row.purchase_price, row.list_price),
    asking_price_display: first(row.asking_price_display, row.price_display),
    arv: first(row.arv, row.after_repair_value, row.value),
    arv_display: first(row.arv_display, row.value_display),
    repairs: first(row.repairs, row.repair_estimate, row.rehab_budget),
    repair_estimate_display: first(row.repair_estimate_display, row.repairs_display),

    exact_address: first(row.exact_address, row.address, row.property_address),
    contact_email: first(row.contact_email, row.email, row.seller_email, row.owner_email),
    contact_phone: first(row.contact_phone, row.phone, row.seller_phone),
    private_notes: first(row.private_notes, row.internal_notes, row.admin_notes),

    created_at: first(row.created_at),
    updated_at: first(row.updated_at),
  };
}

async function tryTableById(supabase: any, table: string, itemId: string) {
  const idColumns = [
    "id",
    "item_id",
    "deal_id",
    "project_id",
    "property_id",
    "pain_id",
    "slug",
  ];

  const errors: string[] = [];

  for (const column of idColumns) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq(column, itemId)
        .limit(1);

      if (!error && Array.isArray(data) && data.length > 0) {
        return {
          ok: true,
          item: normalizeItem(data[0], table),
          table,
          column,
        };
      }

      if (error?.message) errors.push(`${table}.${column}: ${error.message}`);
    } catch (error: any) {
      if (error?.message) errors.push(`${table}.${column}: ${error.message}`);
    }
  }

  return {
    ok: false,
    errors,
  };
}

async function tryTableTextSearch(supabase: any, table: string, itemId: string) {
  const columns = ["title", "name", "address", "description", "notes"];

  for (const column of columns) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .ilike(column, `%${itemId}%`)
        .limit(1);

      if (!error && Array.isArray(data) && data.length > 0) {
        return {
          ok: true,
          item: normalizeItem(data[0], table),
          table,
          column,
        };
      }
    } catch {}
  }

  return {
    ok: false,
  };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ itemId: string }> | { itemId: string } }
) {
  try {
    const params = await context.params;
    const itemId = clean(params.itemId);

    if (!itemId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing item id.",
        },
        { status: 400 }
      );
    }

    const email = requestEmail(request);

    if (!email) {
      return NextResponse.json(
        {
          ok: false,
          error: "Login email required.",
        },
        { status: 401 }
      );
    }

    const owner = isOwnerRequest(request, email);
    const supabase = supabaseClient();

    const tables = [
      "vf_deals",
      "vf_projects",
      "projects",
      "property_cards",
      "vf_property_cards",
      "pain_requests",
      "vf_pain_requests",
      "vf_signals",
      "vf_alerts",
      "vf_routing_actions",
      "vf_routing_introductions",
    ];

    const errors: string[] = [];

    for (const table of tables) {
      const result = await tryTableById(supabase, table, itemId);

      if (result.ok) {
        return NextResponse.json({
          ok: true,
          owner,
          email,
          item: result.item,
          source_table: result.table,
          matched_column: result.column,
          note: "Exact item resolved by id.",
        });
      }

      if (Array.isArray(result.errors)) errors.push(...result.errors.slice(0, 2));
    }

    for (const table of tables) {
      const result = await tryTableTextSearch(supabase, table, itemId);

      if (result.ok) {
        return NextResponse.json({
          ok: true,
          owner,
          email,
          item: result.item,
          source_table: result.table,
          matched_column: result.column,
          note: "Exact item resolved by fallback text search.",
        });
      }
    }

    return NextResponse.json(
      {
        ok: false,
        error: "Exact item not found.",
        item_id: itemId,
        checked_tables: tables,
        sample_errors: errors.slice(0, 8),
      },
      { status: 404 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not load exact item.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
