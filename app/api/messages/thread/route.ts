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
    const url = new URL(request.url);
    const threadKey = String(url.searchParams.get("thread_key") || "").trim();
    const dealId = String(url.searchParams.get("deal_id") || "").trim();
    const email =
      cleanEmail(request.headers.get("x-vf-email")) ||
      cleanEmail(url.searchParams.get("email"));

    if (!email) {
      return NextResponse.json(
        { error: "Missing member email for message thread." },
        { status: 401 }
      );
    }

    if (!threadKey && !dealId) {
      return NextResponse.json({ error: "Missing thread_key or deal_id." }, { status: 400 });
    }

    const supabase = supabaseClient();

    let messages: any[] = [];
    let error: any = null;

    if (threadKey) {
      const byThread = await supabase
        .from("vf_messages")
        .select("*")
        .eq("thread_key", threadKey)
        .or(`sender_email.eq.${email},recipient_email.eq.${email}`)
        .order("created_at", { ascending: true });

      messages = byThread.data || [];
      error = byThread.error;

      if (!error && messages.length === 0) {
        const byLegacyDeal = await supabase
          .from("vf_messages")
          .select("*")
          .eq("deal_id", threadKey)
          .or(`sender_email.eq.${email},recipient_email.eq.${email}`)
          .order("created_at", { ascending: true });

        messages = byLegacyDeal.data || [];
        error = byLegacyDeal.error;
      }
    } else {
      const byDeal = await supabase
        .from("vf_messages")
        .select("*")
        .eq("deal_id", dealId)
        .or(`sender_email.eq.${email},recipient_email.eq.${email}`)
        .order("created_at", { ascending: true });

      messages = byDeal.data || [];
      error = byDeal.error;
    }

    if (error) return NextResponse.json({ error: error.message, details: error }, { status: 500 });

    const resolvedThreadKey = threadKey || String(messages?.[0]?.thread_key || messages?.[0]?.deal_id || "").trim();
    const resolvedDealId = dealId || String(messages?.[0]?.deal_id || "").trim();

    const missingThreadKeyIds = messages
      .filter((message: any) => !String(message?.thread_key || "").trim() && resolvedThreadKey)
      .map((message: any) => message.id)
      .filter(Boolean);

    if (missingThreadKeyIds.length > 0) {
      await supabase
        .from("vf_messages")
        .update({ thread_key: resolvedThreadKey })
        .in("id", missingThreadKeyIds);

      messages = messages.map((message: any) =>
        missingThreadKeyIds.includes(message.id)
          ? { ...message, thread_key: resolvedThreadKey }
          : message
      );
    }

    let deal = null;
    if (resolvedDealId) {
      const { data } = await supabase
        .from("vf_deals")
        .select("*")
        .eq("id", resolvedDealId)
        .maybeSingle();

      deal = normalizeDeal(data);
    }

    const unreadIds = messages
      .filter((m: any) => cleanEmail(m.recipient_email) === email && !m.read_at)
      .map((m: any) => m.id)
      .filter(Boolean);

    if (unreadIds.length > 0) {
      await supabase
        .from("vf_messages")
        .update({ read_at: new Date().toISOString() })
        .in("id", unreadIds);
    }

    return NextResponse.json({ ok: true, email, deal, messages: messages || [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Could not load message thread.", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const threadKey = String(body.thread_key || "").trim();
    const archived = Boolean(body.archived);
    const email = cleanEmail(request.headers.get("x-vf-email")) || cleanEmail(body.email);

    if (!email) {
      return NextResponse.json(
        { error: "Missing member email for archive." },
        { status: 401 }
      );
    }

    if (!threadKey) {
      return NextResponse.json({ error: "Missing thread_key." }, { status: 400 });
    }

    const supabase = supabaseClient();

    const { error } = await supabase
      .from("vf_messages")
      .update({ archived })
      .eq("thread_key", threadKey)
      .or(`sender_email.eq.${email},recipient_email.eq.${email}`);

    if (error) return NextResponse.json({ error: error.message, details: error }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Could not update thread.", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
