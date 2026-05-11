import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type Row = Record<string, any>;

type Signal = {
  id: string;
  signal_id: string;
  source_table: string;
  source_type: string;
  title: string;
  summary: string;
  owner_email: string;
  member_email: string;
  city: string;
  state: string;
  market: string;
  asset_type: string;
  urgency: string;
  status: string;
  created_at: string;
  photo_url: string;
  photo_urls: string[];
  route_href: string;
  message_href: string;
  raw: Row;
};

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

function first(...values: unknown[]) {
  for (const value of values) {
    if (Array.isArray(value)) {
      const match = value.map(clean).find(Boolean);
      if (match) return match;
      continue;
    }

    const text = clean(value);
    if (text) return text;
  }

  return "";
}

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(clean).filter(Boolean);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(clean).filter(Boolean);
    } catch {
      return value ? [value] : [];
    }
  }
  return [];
}

function metadataOf(row: Row) {
  return typeof row.metadata === "object" && row.metadata ? row.metadata : {};
}

function canSee(row: Row, email: string, owner: boolean) {
  if (owner) return true;

  const metadata = metadataOf(row);
  const candidates = [
    row.owner_email,
    row.member_email,
    row.user_email,
    row.submitted_by,
    row.email,
    row.sender_email,
    row.from_email,
    row.to_email,
    metadata.owner_email,
    metadata.member_email,
    metadata.user_email,
    metadata.submitted_by,
    metadata.email,
  ]
    .map(cleanEmail)
    .filter(Boolean);

  if (candidates.length === 0) return true;
  return candidates.includes(email);
}

function normalizePain(row: Row): Signal {
  const metadata = metadataOf(row);
  const photoUrls = [
    ...asArray(row.photo_urls),
    ...asArray(row.photos),
    ...asArray(metadata.photo_urls),
    ...asArray(metadata.photos),
  ];
  const photoUrl = first(row.image_url, row.photo_url, photoUrls[0]);
  const id = first(row.signal_id, row.id, row.pain_id);
  const ownerEmail = cleanEmail(first(row.owner_email, row.member_email, row.user_email, row.submitted_by, row.email, metadata.owner_email, metadata.member_email, metadata.email, OWNER_EMAIL));

  return {
    id,
    signal_id: id,
    source_table: "vf_pain_submissions",
    source_type: "Pain",
    title: first(row.title, row.pain_type, row.description, "Pain Signal"),
    summary: first(row.help_requested, row.requested_help, row.description, row.notes, row.ai_summary, "Member submitted a real estate pain signal."),
    owner_email: ownerEmail,
    member_email: cleanEmail(first(row.member_email, row.user_email, row.submitted_by, row.email, ownerEmail)),
    city: first(row.city, metadata.city),
    state: first(row.state, row.operating_state, metadata.state),
    market: first(row.market, [row.city, row.state || row.operating_state].filter(Boolean).join(", ")),
    asset_type: first(row.asset_type, metadata.asset_type),
    urgency: first(row.urgency, row.urgency_level, row.priority, "medium"),
    status: first(row.status, row.routing_status, "new"),
    created_at: first(row.created_at, row.updated_at, new Date().toISOString()),
    photo_url: photoUrl,
    photo_urls: Array.from(new Set([photoUrl, ...photoUrls].filter(Boolean))),
    route_href: `/signals/${encodeURIComponent(id)}?source=pain`,
    message_href: `/messages/new?itemId=${encodeURIComponent(id)}&signalId=${encodeURIComponent(id)}&to=${encodeURIComponent(ownerEmail || OWNER_EMAIL)}&source=pain`,
    raw: row,
  };
}

function normalizeProject(row: Row): Signal {
  const metadata = metadataOf(row);
  const photoUrls = [
    ...asArray(row.photo_urls),
    ...asArray(row.image_urls),
    ...asArray(row.photos),
    ...asArray(metadata.photo_urls),
  ];
  const photoUrl = first(row.image_url, row.photo_url, row.primary_photo_url, photoUrls[0]);
  const id = first(row.signal_id, row.id, row.project_id, row.deal_id);
  const ownerEmail = cleanEmail(first(row.owner_email, row.member_email, row.user_email, row.created_by, row.email, metadata.owner_email, metadata.member_email, metadata.email, OWNER_EMAIL));

  return {
    id,
    signal_id: id,
    source_table: "projects",
    source_type: "Project",
    title: first(row.title, row.project_title, row.name, row.address, "Project Signal"),
    summary: first(row.summary, row.description, row.notes, row.project_notes, "Project submitted for routing and execution."),
    owner_email: ownerEmail,
    member_email: cleanEmail(first(row.member_email, row.user_email, row.created_by, row.email, ownerEmail)),
    city: first(row.city, metadata.city),
    state: first(row.state, metadata.state),
    market: first(row.market, [row.city, row.state].filter(Boolean).join(", ")),
    asset_type: first(row.asset_type, row.property_type, metadata.asset_type),
    urgency: first(row.urgency, row.priority, "normal"),
    status: first(row.status, "active"),
    created_at: first(row.created_at, row.updated_at, new Date().toISOString()),
    photo_url: photoUrl,
    photo_urls: Array.from(new Set([photoUrl, ...photoUrls].filter(Boolean))),
    route_href: `/signals/${encodeURIComponent(id)}?source=project`,
    message_href: `/messages/new?itemId=${encodeURIComponent(id)}&signalId=${encodeURIComponent(id)}&to=${encodeURIComponent(ownerEmail || OWNER_EMAIL)}&source=project`,
    raw: row,
  };
}

async function selectRecent(supabase: any, table: string) {
  const orderColumns = ["created_at", "updated_at", "id"];

  for (const column of orderColumns) {
    try {
      const { data, error } = await supabase.from(table).select("*").order(column, { ascending: false }).limit(100);
      if (!error && Array.isArray(data)) return data;
    } catch {
      // Try next order column.
    }
  }

  try {
    const { data, error } = await supabase.from(table).select("*").limit(100);
    if (!error && Array.isArray(data)) return data;
  } catch {
    // Table may not exist yet.
  }

  return [];
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const email = requestEmail(request);
    const owner = isOwnerRequest(request, email);
    const type = clean(url.searchParams.get("type") || "all").toLowerCase();
    const status = clean(url.searchParams.get("status") || "").toLowerCase();
    const search = clean(url.searchParams.get("q") || "").toLowerCase();

    if (!email) {
      return NextResponse.json({ ok: false, error: "Login email required." }, { status: 401 });
    }

    const supabase = supabaseClient();
    const signals: Signal[] = [];

    if (type === "all" || type === "pain") {
      const painRows = await selectRecent(supabase, "vf_pain_submissions");
      for (const row of painRows) {
        if (!canSee(row, email, owner)) continue;
        signals.push(normalizePain(row));
      }
    }

    if (type === "all" || type === "project") {
      const projectRows = await selectRecent(supabase, "projects");
      for (const row of projectRows) {
        if (!canSee(row, email, owner)) continue;
        signals.push(normalizeProject(row));
      }
    }

    const seen = new Set<string>();
    const filtered = signals
      .filter((signal) => {
        const key = `${signal.source_type}:${signal.id}`;
        if (!signal.id || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .filter((signal) => {
        if (status && clean(signal.status).toLowerCase() !== status) return false;
        if (!search) return true;
        const haystack = [signal.title, signal.summary, signal.market, signal.asset_type, signal.owner_email, signal.status, signal.urgency]
          .join(" ")
          .toLowerCase();
        return haystack.includes(search);
      })
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

    const counts = {
      total: filtered.length,
      pain: filtered.filter((s) => s.source_type === "Pain").length,
      projects: filtered.filter((s) => s.source_type === "Project").length,
      urgent: filtered.filter((s) => ["urgent", "high", "critical"].includes(clean(s.urgency).toLowerCase())).length,
      new: filtered.filter((s) => clean(s.status).toLowerCase() === "new").length,
    };

    return NextResponse.json({
      ok: true,
      signals: filtered,
      counts,
      email,
      owner,
      source: "api/signals",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not load signals.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
