import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEAL_TABLE = "vf_deals";
const MAX_SCHEMA_RETRIES = 20;

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

function cleanString(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return cleanString(value).toLowerCase();
}

function cleanNumber(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const cleaned = raw.replace(/[^\d.-]/g, "");
  if (!cleaned || cleaned === "." || cleaned === "-" || cleaned === "-.") return null;

  const number = Number(cleaned);
  return Number.isFinite(number) ? number : null;
}

function cleanTextOrNull(value: unknown) {
  const text = cleanString(value);
  return text ? text : null;
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const cleaned = cleanString(value);
    if (cleaned) return cleaned;
  }

  return "";
}

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    const cleaned = cleanNumber(value);
    if (cleaned !== null) return cleaned;
  }

  return null;
}

function photoArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => cleanString(item)).filter(Boolean);
  }

  const text = cleanString(value);
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => cleanString(item)).filter(Boolean);
    }
  } catch {
    // Use the text as one image URL.
  }

  return [text];
}

function removeNullish(row: Record<string, any>) {
  const cleaned: Record<string, any> = {};

  for (const [key, value] of Object.entries(row)) {
    if (value === undefined) continue;
    cleaned[key] = value;
  }

  return cleaned;
}

function missingColumnFromError(error: any) {
  const text = `${error?.message || ""} ${error?.details || ""} ${error?.hint || ""}`;

  const patterns = [
    /column ["']?([a-zA-Z0-9_]+)["']? of relation ["']?[a-zA-Z0-9_]+["']? does not exist/i,
    /Could not find the ["']?([a-zA-Z0-9_]+)["']? column/i,
    /schema cache.*["']?([a-zA-Z0-9_]+)["']?/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1];
  }

  return "";
}

function isMissingColumnError(error: any) {
  const text = `${error?.code || ""} ${error?.message || ""} ${error?.details || ""}`.toLowerCase();

  return (
    error?.code === "42703" ||
    text.includes("column") && text.includes("does not exist") ||
    text.includes("could not find") && text.includes("column") ||
    text.includes("schema cache")
  );
}

function buildRows(body: Record<string, any>, email: string) {
  const photos = photoArray(body.photo_urls);
  const propertyType = firstText(body.property_type, body.deal_type, body.asset_type, "Deal");
  const strategy = firstText(body.strategy, body.exit_strategy, "Strategy Needed");
  const askingPrice = firstNumber(body.asking_price, body.price);
  const price = firstNumber(body.price, body.asking_price);
  const squareFeet = firstText(body.square_feet, body.sqft, body.building_sqft);
  const acres = firstText(body.acres, body.land_acres);

  const core = removeNullish({
    owner_email: email,
    member_email: email,

    title: firstText(body.title, body.deal_title, "Untitled Deal"),
    property_type: propertyType,
    strategy,

    city: firstText(body.city, "Unknown City"),
    state: firstText(body.state, "Unknown State"),
    address: cleanTextOrNull(body.address),

    asking_price: askingPrice,
    arv: cleanNumber(body.arv),
    repair_estimate: cleanNumber(body.repair_estimate),

    description: cleanTextOrNull(body.description),
    status: firstText(body.status, "active"),

    photo_urls: photos,
    main_photo_url: photos[0] || cleanTextOrNull(body.main_photo_url),
  });

  const expanded = removeNullish({
    ...core,

    deal_type: propertyType,
    asset_type: propertyType,
    exit_strategy: strategy,

    price,

    beds: cleanTextOrNull(body.beds ?? body.bedrooms),
    baths: cleanTextOrNull(body.baths ?? body.bathrooms),
    bedrooms: cleanTextOrNull(body.bedrooms ?? body.beds),
    bathrooms: cleanTextOrNull(body.bathrooms ?? body.baths),

    square_feet: cleanTextOrNull(squareFeet),
    sqft: cleanTextOrNull(squareFeet),
    building_sqft: cleanTextOrNull(squareFeet),
    year_built: cleanTextOrNull(body.year_built),
    occupancy: cleanTextOrNull(body.occupancy),
    condition: cleanTextOrNull(body.condition),

    commercial_type: cleanTextOrNull(body.commercial_type),
    units: cleanTextOrNull(body.units),
    noi: cleanTextOrNull(body.noi),
    cap_rate: cleanTextOrNull(body.cap_rate),
    zoning: cleanTextOrNull(body.zoning),
    tenant_status: cleanTextOrNull(body.tenant_status),

    acres: cleanTextOrNull(acres),
    land_acres: cleanTextOrNull(acres),
    frontage: cleanTextOrNull(body.frontage),
    utilities: cleanTextOrNull(body.utilities),
    road_access: cleanTextOrNull(body.road_access),
    topography: cleanTextOrNull(body.topography),
    parcel_id: cleanTextOrNull(body.parcel_id),

    deal_needs: cleanTextOrNull(body.deal_needs),
    needs: cleanTextOrNull(body.needs ?? body.deal_needs),
    routing_needs: cleanTextOrNull(body.routing_needs ?? body.deal_needs),

    seller_situation: cleanTextOrNull(body.seller_situation),
    access_notes: cleanTextOrNull(body.access_notes),
    private_notes: cleanTextOrNull(body.private_notes ?? body.access_notes),

    owner_name: cleanTextOrNull(body.owner_name ?? body.contact_name ?? body.seller_name),
    contact_name: cleanTextOrNull(body.contact_name ?? body.owner_name ?? body.seller_name),
    seller_name: cleanTextOrNull(body.seller_name ?? body.owner_name ?? body.contact_name),
    owner_phone: cleanTextOrNull(body.owner_phone ?? body.contact_phone ?? body.seller_phone),
    contact_phone: cleanTextOrNull(body.contact_phone ?? body.owner_phone ?? body.seller_phone),
    seller_phone: cleanTextOrNull(body.seller_phone ?? body.owner_phone ?? body.contact_phone),
    owner_contact_email: cleanTextOrNull(body.owner_contact_email ?? body.contact_email ?? body.seller_email),
    contact_email: cleanTextOrNull(body.contact_email ?? body.owner_contact_email ?? body.seller_email),
    seller_email: cleanTextOrNull(body.seller_email ?? body.owner_contact_email ?? body.contact_email),
    preferred_contact: cleanTextOrNull(body.preferred_contact),
  });

  return { core, expanded };
}

async function adaptiveInsert(supabase: any, firstRow: Record<string, any>, fallbackRow: Record<string, any>) {
  let row = { ...firstRow };
  const removedColumns: string[] = [];

  for (let attempt = 0; attempt < MAX_SCHEMA_RETRIES; attempt += 1) {
    const { data, error } = await supabase
      .from(DEAL_TABLE)
      .insert(row)
      .select("*")
      .single();

    if (!error) {
      return { data, error: null, removedColumns };
    }

    if (!isMissingColumnError(error)) {
      if (row !== fallbackRow) {
        row = { ...fallbackRow };
        continue;
      }

      return { data: null, error, removedColumns };
    }

    const missing = missingColumnFromError(error);

    if (missing && Object.prototype.hasOwnProperty.call(row, missing)) {
      delete row[missing];
      removedColumns.push(missing);
      continue;
    }

    if (JSON.stringify(row) !== JSON.stringify(fallbackRow)) {
      row = { ...fallbackRow };
      continue;
    }

    return { data: null, error, removedColumns };
  }

  return {
    data: null,
    error: {
      message: "Could not create deal after schema compatibility retries.",
      details: { removedColumns },
    },
    removedColumns,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    const email =
      cleanEmail(request.headers.get("x-vf-email")) ||
      cleanEmail(body.owner_email) ||
      cleanEmail(body.member_email);

    if (!email) {
      return NextResponse.json(
        {
          ok: false,
          error: "Login required to create a deal.",
          details: "No VaultForge member email was found.",
        },
        { status: 401 }
      );
    }

    const { core, expanded } = buildRows(body, email);

    if (!cleanString(core.title) || core.title === "Untitled Deal") {
      return NextResponse.json(
        { ok: false, error: "Deal title is required." },
        { status: 400 }
      );
    }

    if (!cleanString(core.city) || core.city === "Unknown City") {
      return NextResponse.json(
        { ok: false, error: "City is required." },
        { status: 400 }
      );
    }

    const supabase = supabaseClient();
    const result = await adaptiveInsert(supabase, expanded, core);

    if (result.error) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error.message || "Could not create deal.",
          details: result.error,
          removed_columns_before_failure: result.removedColumns,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      deal: result.data,
      removed_schema_columns: result.removedColumns,
      message: "Deal room created.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not create deal.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
