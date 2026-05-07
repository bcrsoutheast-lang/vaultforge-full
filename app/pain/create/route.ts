import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

function asNumber(value: unknown) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function createTags(body: any) {
  const tags = new Set<string>();

  const inputs = [
    body?.pain_type,
    body?.requested_help,
    body?.description,
    body?.urgency_level,
  ]
    .map((v) => clean(v).toLowerCase())
    .join(" ");

  const rules = [
    ["capital", ["capital", "funding", "loan", "lender", "cash"]],
    ["title", ["title", "lien", "probate"]],
    ["zoning", ["zoning", "permit", "city"]],
    ["contractor", ["contractor", "rehab", "repair"]],
    ["operator", ["operator", "partner", "joint venture", "jv"]],
    ["seller_distress", ["foreclosure", "distress", "urgent", "liquidation"]],
    ["multifamily", ["multifamily", "apartment"]],
    ["commercial", ["commercial", "retail", "office"]],
    ["residential", ["house", "single family", "duplex"]],
  ];

  for (const [tag, words] of rules) {
    if (words.some((word) => inputs.includes(word))) {
      tags.add(tag);
    }
  }

  return Array.from(tags);
}

function urgencyScore(level: string) {
  const normalized = clean(level).toLowerCase();

  if (
    normalized.includes("emergency") ||
    normalized.includes("critical")
  ) {
    return 95;
  }

  if (
    normalized.includes("urgent") ||
    normalized.includes("high")
  ) {
    return 80;
  }

  if (normalized.includes("medium")) {
    return 55;
  }

  return 30;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email =
      cleanEmail(request.headers.get("x-vf-email")) ||
      cleanEmail(body?.member_email) ||
      cleanEmail(body?.email);

    const painType = clean(body?.pain_type || body?.type || "General Distress");
    const description = clean(body?.description);
    const requestedHelp = clean(body?.requested_help);
    const urgencyLevel = clean(body?.urgency_level || "normal");

    if (!description) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing distress description.",
        },
        { status: 400 }
      );
    }

    const tags = createTags(body);

    const payload = {
      member_email: email || null,

      title: clean(body?.title || painType),
      description,

      pain_type: painType,
      requested_help: requestedHelp,

      urgency_level: urgencyLevel,
      urgency_score: urgencyScore(urgencyLevel),

      capital_needed: asNumber(body?.capital_needed),
      estimated_value: asNumber(body?.estimated_value),
      estimated_repairs: asNumber(body?.estimated_repairs),

      city: clean(body?.city),
      state: clean(body?.state),

      routing_status: "pending",

      ai_summary:
        clean(body?.ai_summary) ||
        `Routing signal created for ${painType.toLowerCase()}.`,

      routing_tags: tags,

      source: "pain_button",

      created_at: new Date().toISOString(),
    };

    const supabase = supabaseClient();

    const { data, error } = await supabase
      .from("vf_pain_submissions")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message || "Could not create distress signal.",
          details: error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      signal: data,
      routing: {
        urgency_score: payload.urgency_score,
        tags,
        status: "pending",
      },
      source: "vf_pain_submissions",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not create distress signal.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
