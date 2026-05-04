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

  if (!url || !key) throw new Error("Missing Supabase environment values.");

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function cleanEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function normalizePhotos(value: any): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {}
    return [value.trim()];
  }
  return [];
}

function normalizeDeal(row: any) {
  if (!row) return null;
  const photos = normalizePhotos(row.photo_urls);
  const main = row.main_photo_url || photos[0] || "";
  return {
    ...row,
    photo_urls: main && !photos.includes(main) ? [main, ...photos] : photos,
    main_photo_url: main,
  };
}

export async function GET(request: Request) {
  try {
    const email =
      cleanEmail(request.headers.get("x-vf-email")) ||
      cleanEmail(new URL(request.url).searchParams.get("email")) ||
      "text@text.com";

    const supabase = supabaseClient();

    const { data: messages, error } = await supabase
      .from("vf_messages")
      .select("*")
      .or(`sender_email.eq.${email},recipient_email.eq.${email}`)
      .eq("archived", false)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) return NextResponse.json({ error: error.message, details: error }, { status: 500 });

    const dealIds = Array.from(new Set((messages || []).map((m: any) => m.deal_id).filter(Boolean)));

    let dealMap = new Map<string, any>();

    if (dealIds.length > 0) {
      const { data: deals, error: dealError } = await supabase
        .from("vf_deals")
        .select("*")
        .in("id", dealIds);

      if (!dealError && deals) {
        dealMap = new Map(deals.map((deal: any) => [deal.id, normalizeDeal(deal)]));
      }
    }

    const grouped = new Map<string, any>();

    for (const message of messages || []) {
      const key = String(message.thread_key || message.deal_id || message.id);
      const existing = grouped.get(key);
      const deal = dealMap.get(message.deal_id) || null;

      if (!existing) {
        grouped.set(key, {
          thread_key: key,
          deal_id: message.deal_id,
          deal,
          latest_message: message,
          messages: [message],
          unread_count:
            message.recipient_email === email && !message.read_at ? 1 : 0,
        });
      } else {
        existing.messages.push(message);
        if (message.recipient_email === email && !message.read_at) {
          existing.unread_count += 1;
        }
      }
    }

    const threads = Array.from(grouped.values()).sort((a: any, b: any) => {
      return new Date(b.latest_message.created_at).getTime() - new Date(a.latest_message.created_at).getTime();
    });

    return NextResponse.json({ ok: true, email, threads });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Could not load messages.", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
