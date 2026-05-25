import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type MessageEntry = {
  id: string;
  from: string;
  recipient: string;
  message: string;
  createdAt: string;
  senderProfile?: Record<string, unknown>;
};

type ThreadPayload = {
  id?: string;
  lane?: string;
  from?: string;
  recipient?: string;
  title?: string;
  room?: string;
  roomId?: string;
  roomKind?: string;
  message?: string;
  senderProfile?: Record<string, unknown>;
  recipientProfile?: Record<string, unknown>;
  roomSnapshot?: Record<string, unknown>;
  folder?: string;
  origin?: string;
  senderWorkspace?: string;
  recipientWorkspace?: string;
};

function supabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function clean(value: unknown, fallback = "") {
  const text = String(value || "").trim();
  return text || fallback;
}

function emailOnly(value: unknown) {
  const text = clean(value).toLowerCase();
  if (!text.includes("@")) return "";
  return text;
}

function makeId() {
  return `thread-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function POST(request: Request) {
  try {
    const db = supabase();
    const body = (await request.json().catch(() => ({}))) as ThreadPayload;

    const messageText = clean(body.message);
    if (!messageText) {
      return NextResponse.json(
        { ok: false, error: "Message is required." },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Supabase environment variables are missing. Message stayed in browser fallback only.",
        },
        { status: 200 }
      );
    }

    const now = new Date().toISOString();
    const id = clean(body.id) || makeId();
    const senderEmail =
      emailOnly(body.senderProfile?.email) || emailOnly(body.from) || "";
    const recipientEmail =
      emailOnly(body.recipientProfile?.email) || emailOnly(body.recipient) || "";

    let existing: any = null;

    if (body.id) {
      const lookup = await db
        .from("vf_message_threads")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (lookup.error && lookup.error.code !== "PGRST116") {
        return NextResponse.json(
          {
            ok: false,
            error: "Could not read existing thread.",
            supabase_error: lookup.error.message,
            code: lookup.error.code,
          },
          { status: 200 }
        );
      }

      existing = lookup.data || null;
    }

    const oldThread = existing?.thread && typeof existing.thread === "object" ? existing.thread : {};
    const oldMessages = Array.isArray(existing?.messages) ? existing.messages : [];

    const entry: MessageEntry = {
      id: `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      from: clean(body.from || body.senderProfile?.email || body.senderProfile?.name, "Not listed"),
      recipient: clean(body.recipient, "VaultForge Owner"),
      message: messageText,
      createdAt: now,
      senderProfile: body.senderProfile || {},
    };

    const thread = {
      ...oldThread,
      id,
      lane: clean(body.lane || oldThread.lane || "General", "General"),
      from: clean(body.from || oldThread.from || senderEmail, "Not listed"),
      recipient: clean(body.recipient || oldThread.recipient || recipientEmail || "VaultForge Owner", "VaultForge Owner"),
      title: clean(body.title || oldThread.title || "Untitled Message", "Untitled Message"),
      room: clean(body.room || oldThread.room || "General", "General"),
      folder: clean(body.folder || oldThread.folder || "active", "active"),
      unread: true,
      createdAt: clean(oldThread.createdAt || now, now),
      updatedAt: now,
      senderProfile: body.senderProfile || oldThread.senderProfile || {},
      recipientProfile: body.recipientProfile || oldThread.recipientProfile || {},
      roomSnapshot:
        body.roomSnapshot ||
        oldThread.roomSnapshot || {
          id: clean(body.roomId || body.room || id, id),
          kind: clean(body.roomKind || body.lane || "General", "General"),
          title: clean(body.room || body.title || "General", "General"),
          owner: clean(body.recipient || "VaultForge Owner", "VaultForge Owner"),
          source: "supabase",
        },
      messages: [...oldMessages, entry],
      message: messageText,
      origin: clean(body.origin || oldThread.origin || ""),
      senderWorkspace: clean(body.senderWorkspace || oldThread.senderWorkspace || ""),
      recipientWorkspace: clean(body.recipientWorkspace || oldThread.recipientWorkspace || ""),
    };

    const row = {
      id,
      thread,
      messages: [...oldMessages, entry],
      sender_email: senderEmail,
      recipient_email: recipientEmail,
      title: thread.title,
      room: thread.room,
      room_id: clean(body.roomId || thread.roomSnapshot?.id || ""),
      room_kind: clean(body.roomKind || thread.roomSnapshot?.kind || thread.lane || ""),
      folder: thread.folder,
      unread: true,
      origin: clean(body.origin || thread.origin || ""),
      sender_workspace: clean(body.senderWorkspace || thread.senderWorkspace || ""),
      recipient_workspace: clean(body.recipientWorkspace || thread.recipientWorkspace || ""),
      updated_at: now,
      created_at: existing?.created_at || now,
    };

    const saved = await db.from("vf_message_threads").upsert(row, { onConflict: "id" }).select("*").single();

    if (saved.error) {
      return NextResponse.json(
        {
          ok: false,
          error: "Supabase rejected the message save.",
          supabase_error: saved.error.message,
          code: saved.error.code,
          hint:
            "Run supabase/vf_message_threads.sql from the zip, then resend the message.",
        },
        { status: 200 }
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
