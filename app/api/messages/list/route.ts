import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return { url, key };
}

function getCookieValue(cookieHeader: string, name: string) {
  const parts = cookieHeader.split(";").map((part) => part.trim());
  const found = parts.find((part) => part.startsWith(`${name}=`));
  if (!found) return "";
  return decodeURIComponent(found.slice(name.length + 1));
}

export async function GET(req: Request) {
  const config = getSupabaseConfig();

  if (!config) {
    return NextResponse.json(
      { error: "Supabase environment variables are missing.", threads: [] },
      { status: 500 }
    );
  }

  const cookieHeader = req.headers.get("cookie") || "";
  const memberEmail =
    getCookieValue(cookieHeader, "vf_user") ||
    getCookieValue(cookieHeader, "vf_email");

  if (!memberEmail) {
    return NextResponse.json({ error: "Not logged in.", threads: [] }, { status: 401 });
  }

  const email = memberEmail.toLowerCase();

  const url =
    `${config.url}/rest/v1/vf_messages` +
    `?select=*` +
    `&or=(sender_email.eq.${encodeURIComponent(email)},recipient_email.eq.${encodeURIComponent(email)})` +
    `&archived=eq.false` +
    `&order=created_at.desc`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const details = await res.text();
    return NextResponse.json(
      { error: "Failed to load messages.", details, threads: [] },
      { status: 500 }
    );
  }

  const rows = await res.json();
  const map = new Map<string, any>();

  for (const row of rows) {
    const threadId = row.thread_id || row.id;
    if (!map.has(threadId)) {
      const otherEmail =
        String(row.sender_email || "").toLowerCase() === email
          ? row.recipient_email
          : row.sender_email;

      map.set(threadId, {
        thread_id: threadId,
        subject: row.subject || "VaultForge message",
        deal_id: row.deal_id || null,
        other_email: otherEmail,
        latest_message: row.message,
        latest_sender: row.sender_email,
        latest_recipient: row.recipient_email,
        latest_at: row.created_at,
        unread_count: 0,
      });
    }

    if (String(row.recipient_email || "").toLowerCase() === email && !row.read) {
      const thread = map.get(threadId);
      thread.unread_count += 1;
    }
  }

  return NextResponse.json({ threads: Array.from(map.values()) });
}
