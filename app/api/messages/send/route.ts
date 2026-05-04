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
    },
  });
}

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const sender =
      cleanEmail(request.headers.get("x-vf-email")) ||
      cleanEmail(body.sender_email) ||
      "text@text.com";

    const dealId = clean(body.deal_id);
    const textMessage = clean(body.body || body.message);
    const subject = clean(body.subject) || "VaultForge Deal Inquiry";
    const explicitRecipient = cleanEmail(body.recipient_email);
    const threadKey = clean(body.thread_key) || dealId;

    if (!dealId) {
      return NextResponse.json({ error: "Missing deal id." }, { status: 400 });
    }

    if (!textMessage) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const supabase = supabaseClient();

    const { data: deal, error: dealError } = await supabase
      .from("vf_deals")
      .select("*")
      .eq("id", dealId)
      .maybeSingle();

    if (dealError) {
      return NextResponse.json({ error: dealError.message }, { status: 500 });
    }

    if (!deal) {
      return NextResponse.json({ error: "Deal not found." }, { status: 404 });
    }

    const ownerEmail =
      cleanEmail(deal.owner_contact_email) ||
      cleanEmail(deal.owner_email) ||
      cleanEmail(deal.member_email) ||
      sender;

    let recipient = explicitRecipient || ownerEmail;

    if (recipient === sender) {
      const { data: priorMessages } = await supabase
        .from("vf_messages")
        .select("*")
        .eq("thread_key", threadKey)
        .neq("sender_email", sender)
        .order("created_at", { ascending: false })
        .limit(1);

      recipient =
        cleanEmail(priorMessages?.[0]?.sender_email) ||
        cleanEmail(priorMessages?.[0]?.recipient_email) ||
        ownerEmail;
    }

    const insert: Record<string, any> = {
      deal_id: dealId,
      sender_email: sender,
      recipient_email: recipient,
      subject,
      body: textMessage,
      message: textMessage,
      status: "sent",
      thread_key: threadKey,
    };

    let { data, error } = await supabase
      .from("vf_messages")
      .insert(insert)
      .select("*")
      .single();

    if (error && /column .*body.* does not exist|schema cache/i.test(error.message || "")) {
      const fallback = { ...insert };
      delete fallback.body;

      const retry = await supabase
        .from("vf_messages")
        .insert(fallback)
        .select("*")
        .single();

      data = retry.data;
      error = retry.error;
    }

    if (error && /column .*message.* does not exist|schema cache/i.test(error.message || "")) {
      const fallback = { ...insert };
      delete fallback.message;

      const retry = await supabase
        .from("vf_messages")
        .insert(fallback)
        .select("*")
        .single();

      data = retry.data;
      error = retry.error;
    }

    if (error) {
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: data });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Could not send message.", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
