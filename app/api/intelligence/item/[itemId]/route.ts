import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

const DEAL_TABLES = ["vf_deals", "projects", "property_cards"];
const PAIN_TABLES = ["pain_requests", "vf_pain_requests", "pain_submissions"];

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

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => clean(item)).filter(Boolean);

  const text = clean(value);
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.map((item) => clean(item)).filter(Boolean);
  } catch {
    // Continue to comma split.
  }

  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function first(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }

  return "";
}

function money(value: unknown) {
  const n = Number(value || 0);

  if (!Number.isFinite(n) || n <= 0) return "";

  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function rowId(row: Row) {
  return first(row.id, row.deal_id, row.project_id, row.property_id, row.card_id, row.pain_id);
}

function rowTitle(row: Row) {
  return first(
    row.title,
    row.deal_title,
    row.project_title,
    row.property_title,
    row.name,
    row.address,
    row.full_address,
    row.problem_title,
    row.problem,
    "VaultForge Item"
  );
}

function normalize(row: Row, table: string, owner: boolean) {
  const asking = first(row.asking_price, row.asking, row.price, row.purchase_price);
  const arv = first(row.arv, row.after_repair_value, row.value);
  const repairs = first(row.repair_estimate, row.repairs, row.estimated_repairs);

  const privateFields = owner
    ? {
        exact_address: first(row.address, row.full_address, row.property_address),
        contact_email: first(row.contact_email, row.owner_email, row.member_email, row.email),
        contact_phone: first(row.contact_phone, row.phone, row.seller_phone),
        private_notes: first(row.private_notes, row.access_notes, row.admin_notes, row.notes),
      }
    : {};

  return {
    id: rowId(row),
    title: rowTitle(row),
    source_table: table,
    item_kind: table.toLowerCase().includes("pain") ? "pain_signal" : "deal_or_project",
    city: first(row.city, row.market, row.property_city, row.location),
    state: first(row.state, row.property_state, row.market_state),
    county: first(row.county),
    property_type: first(row.property_type, row.deal_type, row.asset_type, row.project_type),
    strategy: first(row.strategy, row.exit_strategy, row.deal_strategy),
    status: first(row.status, row.deal_status, row.project_status, row.alert_status),
    asking_price: asking,
    asking_price_display: money(asking),
    arv,
    arv_display: money(arv),
    repair_estimate: repairs,
    repair_estimate_display: money(repairs),
    beds: first(row.beds, row.bedrooms),
    baths: first(row.baths, row.bathrooms),
    square_feet: first(row.square_feet, row.sqft),
    acres: first(row.acres),
    occupancy: first(row.occupancy),
    seller_situation: first(row.seller_situation, row.seller_motivation),
    deal_needs: asArray(row.deal_needs || row.needs || row.routing_needs || row.help_needed || row.capital_needs),
    description: first(row.description, row.summary, row.ai_summary, row.problem_description),
    photo_urls: asArray(row.photo_urls || row.photos || row.image_urls || row.images),
    main_photo_url: first(row.main_photo_url, row.photo_url, row.image_url, asArray(row.photo_urls)[0]),
    created_at: first(row.created_at),
    updated_at: first(row.updated_at),
    safe_href: table.toLowerCase().includes("pain") ? "/pain-submit" : "/projects",
    owner_private: owner,
    ...privateFields,
    raw: owner ? row : undefined,
  };
}

async function searchTable(supabase: any, table: string, itemId: string) {
  const columns = [
    "id",
    "deal_id",
    "project_id",
    "property_id",
    "card_id",
    "pain_id",
  ];

  for (const column of columns) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq(column, itemId)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return data;
      }
    } catch {
      // Try next column/table.
    }
  }

  return null;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ itemId: string }> }
) {
  try {
    const params = await context.params;
    const itemId = decodeURIComponent(clean(params.itemId));

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

    const tables = [...DEAL_TABLES, ...PAIN_TABLES];

    for (const table of tables) {
      const found = await searchTable(supabase, table, itemId);

      if (found) {
        return NextResponse.json({
          ok: true,
          email,
          owner,
          item: normalize(found, table, owner),
          table,
          item_id: itemId,
          note: owner
            ? "Owner view includes private fields when present."
            : "Member-safe view hides private fields.",
        });
      }
    }

    return NextResponse.json({
      ok: true,
      email,
      owner,
      item: null,
      item_id: itemId,
      tables_checked: tables,
      note: "Item not found in known deal/project/pain tables.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not load related intelligence item.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
