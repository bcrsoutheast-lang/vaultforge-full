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

function stableThreadKey(message: any) {
  const explicit = String(message?.thread_key || "").trim();
  if (explicit) return explicit;

  const dealId = String(message?.deal_id || "").trim();
  if (dealId) return dealId;

  return String(message?.id || "").trim();
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const email =
      cleanEmail(request.headers.get("x-vf-email")) ||
      cleanEmail(url.searchParams.get("email"));

    if (!email) {
      return NextResponse.json(
        { error: "Missing member email for messages." },
        { status: 401 }
      );
    }

    const supabase = supabaseClient();

    const { data: messages, error } = await supabase
      .from("vf_messages")
      .select("*")
      .or(`sender_email.eq.${email},recipient_email.eq.${email}`)
      .eq("archived", false)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) return NextResponse.json({ error: error.message, details: error }, { status: 500 });

    const rows = messages || [];
    const missingThreadKeyIds = rows
      .filter((message: any) => !String(message?.thread_key || "").trim() && String(message?.deal_id || "").trim())
      .map((message: any) => message.id)
      .filter(Boolean);

    if (missingThreadKeyIds.length > 0) {
      await Promise.all(
        rows
          .filter((message: any) => missingThreadKeyIds.includes(message.id))
          .map((message: any) =>
            supabase
              .from("vf_messages")
              .update({ thread_key: String(message.deal_id) })
              .eq("id", message.id)
          )
      );
    }

    const dealIds = Array.from(new Set(rows.map((m: any) => m.deal_id).filter(Boolean)));

    let dealMap = new Map<string, any>();

    if (dealIds.length > 0) {
      const { data: deals, error: dealError } = await supabase
        .from("vf_deals")
        .select("*")
        .in("id", dealIds);

      if (!dealError && deals) {
        dealMap = new Map(deals.map((deal: any) => [String(deal.id), normalizeDeal(deal)]));
      }
    }

    const grouped = new Map<string, any>();

    for (const originalMessage of rows) {
      const key = stableThreadKey(originalMessage);
      if (!key) continue;

      const message = {
        ...originalMessage,
        thread_key: String(originalMessage.thread_key || key),
      };

      const existing = grouped.get(key);
      const deal = dealMap.get(String(message.deal_id)) || null;

      if (!existing) {
        grouped.set(key, {
          thread_key: key,
          deal_id: message.deal_id,
          deal,
          latest_message: message,
          messages: [message],
          unread_count:
            cleanEmail(message.recipient_email) === email && !message.read_at ? 1 : 0,
        });
      } else {
        existing.messages.push(message);
        if (cleanEmail(message.recipient_email) === email && !message.read_at) {
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
