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

function makeThreadKey(dealId: string, sender: string, recipient: string) {
  const participants = [sender, recipient].map(cleanEmail).filter(Boolean).sort().join("__");
  return participants ? `${dealId}__${participants}` : dealId;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const sender =
      cleanEmail(request.headers.get("x-vf-email")) ||
      cleanEmail(body.sender_email);

    if (!sender) {
      return NextResponse.json({ error: "Missing sender email." }, { status: 401 });
    }

    const dealId = clean(body.deal_id);
    const textMessage = clean(body.body || body.message);
    const subject = clean(body.subject) || "VaultForge Deal Inquiry";
    const explicitRecipient = cleanEmail(body.recipient_email);

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
    let threadKey = clean(body.thread_key);

    if (recipient === sender || !recipient) {
      const lookupThreadKey = threadKey || dealId;

      const { data: priorMessages } = await supabase
        .from("vf_messages")
        .select("*")
        .or(`thread_key.eq.${lookupThreadKey},deal_id.eq.${dealId}`)
        .or(`sender_email.eq.${sender},recipient_email.eq.${sender}`)
        .neq("sender_email", sender)
        .order("created_at", { ascending: false })
        .limit(1);

      recipient =
        cleanEmail(priorMessages?.[0]?.sender_email) ||
        cleanEmail(priorMessages?.[0]?.recipient_email) ||
        ownerEmail;
    }

    if (!recipient) {
      return NextResponse.json({ error: "Missing recipient email." }, { status: 400 });
    }

    if (!threadKey) {
      threadKey = makeThreadKey(dealId, sender, recipient);
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
      archived: false,
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

    if (error && /column .*archived.* does not exist|schema cache/i.test(error.message || "")) {
      const fallback = { ...insert };
      delete fallback.archived;

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

    return NextResponse.json({ ok: true, message: data, thread_key: threadKey });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Could not send message.", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
