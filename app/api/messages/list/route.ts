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

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function clean(value: unknown) {
  return String(value || "").trim();
}

function emailOnly(value: unknown) {
  const text = clean(value).toLowerCase();
  return text.includes("@") ? text : "";
}

export async function GET(request: Request) {
  try {
    const db = supabase();

    if (!db) {
      return NextResponse.json({
        ok: false,
        threads: [],
        error:
          "Supabase environment variables are missing. Browser fallback can still load local messages.",
      });
    }

    const url = new URL(request.url);
    const email = emailOnly(url.searchParams.get("email"));
    const name = clean(url.searchParams.get("name")).toLowerCase();

    let query = db
      .from("vf_message_threads")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(200);

    const result = await query;

    if (result.error) {
      return NextResponse.json({
        ok: false,
        threads: [],
        error: "Could not load Supabase messages.",
        supabase_error: result.error.message,
        code: result.error.code,
        hint:
          "Run supabase/vf_message_threads.sql from the zip if the table does not exist.",
      });
    }

    const rows = Array.isArray(result.data) ? result.data : [];

    const threads = rows
      .map((row: any) => {
        const thread = row.thread && typeof row.thread === "object" ? row.thread : {};
        return {
          ...thread,
          id: row.id || thread.id,
          title: thread.title || row.title || "Untitled Message",
          room: thread.room || row.room || "General",
          folder: thread.folder || row.folder || "active",
          unread: Boolean(thread.unread ?? row.unread),
          messages: Array.isArray(row.messages) ? row.messages : thread.messages || [],
        };
      })
      .filter((thread: any) => {
        if (!email && !name) return true;

        const blob = JSON.stringify(thread).toLowerCase();
        return Boolean(
          (email && blob.includes(email)) ||
            (name && blob.includes(name)) ||
            blob.includes("vaultforge owner") ||
            blob.includes("bcrsoutheast@gmail.com")
        );
      });

    return NextResponse.json({ ok: true, threads });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        threads: [],
        error: error?.message || "Unknown message list error.",
      },
      { status: 500 }
    );
  }
}
