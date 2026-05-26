import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type AnyRow = Record<string, any>;

function supabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  if (!url ||!key) throw new Error("Missing Supabase environment values.");

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as AnyRow;
    const supabase = supabaseClient();

    const { data: { user } } = await supabase.auth.getUser();
    const fromEmail = cleanEmail(user?.email);
    const fromName = clean(user?.user_metadata?.full_name || user?.user_metadata?.name || fromEmail.split('@')[0] || "Owner");

    if (!fromEmail) {
      return NextResponse.json({ ok: false, error: "Not authenticated." }, { status: 401 });
    }

    const toEmail = cleanEmail(body.to_email || body.recipient_email || OWNER_EMAIL);
    const subject = clean(body.subject || body.title || "VaultForge connection request");
    const messageBody = clean(body.body || body.message || "I need more information about this VaultForge signal/opportunity.");
    const threadId = clean(body.thread_id || makeId("thread"));
    const messageId = makeId("msg");
    const now = new Date().toISOString();

    const payload = {
      id: messageId,
      thread_id: threadId,
      from_email: fromEmail,
      to_email: toEmail,
      sender_email: fromEmail,
      sender_name: fromName,
      recipient_email: toEmail,
      subject,
      body: messageBody,
      message: messageBody,
      status: "open",
      created_at: now,
      updated_at: now,
      metadata: {
        source: "api/messages/new",
        from_email: fromEmail,
        from_name: fromName,
        to_email: toEmail,
        subject,
        body: messageBody,
        thread_id: threadId,
      },
    };

    const { data, error } = await supabase.from("vf_messages").insert(payload).select("*").single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: "Message could not be saved.", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: data,
      thread_id: threadId,
      message_id: data.id,
      links: {
        inbox: "/messages",
        thread: `/messages/${encodeURIComponent(threadId)}`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Message request failed.", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
