import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function supabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  if (!url ||!key) return null;

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function clean(value: unknown, fallback = "") {
  const text = String(value || "").trim();
  return text || fallback;
}

function makeId() {
  return `thread-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function POST(request: Request) {
  try {
    const db = supabase();
    if (!db) {
      return NextResponse.json(
        { ok: false, error: "Supabase environment variables are missing." },
        { status: 500 }
      );
    }

    const { data: { user } } = await db.auth.getUser();
    if (!user?.email) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated." },
        { status: 401 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as any;
    const messageText = clean(body.message);
    if (!messageText) {
      return NextResponse.json(
        { ok: false, error: "Message is required." },
        { status: 400 }
      );
    }

    const authEmail = clean(user.email);
    const authName = clean(user.user_metadata?.full_name || user.user_metadata?.name || authEmail.split('@')[0] || "Owner");
    const now = new Date().toISOString();
    const id = clean(body.id) || makeId();
    const recipientEmail = clean(body.recipient || body.recipientProfile?.email);

    const entry = {
      id: `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      from: authName,
      recipient: recipientEmail || "VaultForge Owner",
      message: messageText,
      createdAt: now,
      senderProfile: {
        email: authEmail,
        name: authName,
      },
    };

    const thread = {
      id,
      lane: clean(body.lane, "General"),
      from: authName,
      recipient: recipientEmail || "VaultForge Owner",
      title: clean(body.title, "Untitled Message"),
      room: clean(body.room, "General"),
      folder: clean(body.folder, "active"),
      unread: true,
      createdAt: now,
      updatedAt: now,
      senderProfile: { email: authEmail, name: authName },
      recipientProfile: body.recipientProfile || {},
      messages: [entry],
      message: messageText,
    };

    const row = {
      id,
      thread,
      messages: [entry],
      sender_email: authEmail,
      recipient_email: recipientEmail,
      title: thread.title,
      room: thread.room,
      folder: thread.folder,
      unread: true,
      updated_at: now,
      created_at: now,
    };

    const saved = await db.from("vf_message_threads").upsert(row, { onConflict: "id" }).select("*").single();

    if (saved.error) {
      return NextResponse.json(
        { ok: false, error: "Supabase rejected the message save.", details: saved.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, thread: saved.data?.thread || thread });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unknown message send error." },
      { status: 500 }
    );
  }
}
