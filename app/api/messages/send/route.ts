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

function clean(value: unknown) {
  return String(value || "").trim();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const sender =
      clean(request.headers.get("x-vf-email")).toLowerCase() ||
      clean(body.sender_email).toLowerCase() ||
      "text@text.com";

    const dealId = clean(body.deal_id);
    const subject = clean(body.subject) || "VaultForge Deal Inquiry";
    const message = clean(body.body);
    const explicitRecipient = clean(body.recipient_email).toLowerCase();
    const threadKey = clean(body.thread_key) || dealId;

    if (!dealId) return NextResponse.json({ error: "Missing deal id." }, { status: 400 });
    if (!message) return NextResponse.json({ error: "Message is required." }, { status: 400 });

    const supabase = supabaseClient();

    const { data: deal, error: dealError } = await supabase
      .from("vf_deals")
      .select("*")
      .eq("id", dealId)
      .maybeSingle();

    if (dealError) return NextResponse.json({ error: dealError.message }, { status: 500 });
    if (!deal) return NextResponse.json({ error: "Deal not found." }, { status: 404 });

    const ownerEmail =
      clean(deal.owner_contact_email).toLowerCase() ||
      clean(deal.owner_email).toLowerCase() ||
      clean(deal.member_email).toLowerCase();

    let recipient = explicitRecipient || ownerEmail;

    if (recipient === sender) {
      const { data: prior } = await supabase
        .from("vf_messages")
        .select("*")
        .eq("thread_key", threadKey)
        .neq("sender_email", sender)
        .order("created_at", { ascending: false })
        .limit(1);

      recipient =
        prior?.[0]?.sender_email ||
        prior?.[0]?.recipient_email ||
        ownerEmail;
    }

    const insert = {
      deal_id: dealId,
      sender_email: sender,
      recipient_email: recipient,
      subject,
      body: message,
      status: "sent",
      thread_key: threadKey,
    };

    const { data, error } = await supabase
      .from("vf_messages")
      .insert(insert)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message, details: error }, { status: 500 });

    return NextResponse.json({ ok: true, message: data });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Could not send message.", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
