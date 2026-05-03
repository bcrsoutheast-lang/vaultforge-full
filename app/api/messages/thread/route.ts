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
      { error: "Supabase environment variables are missing.", messages: [] },
      { status: 500 }
    );
  }

  const cookieHeader = req.headers.get("cookie") || "";
  const memberEmail =
    getCookieValue(cookieHeader, "vf_user") ||
    getCookieValue(cookieHeader, "vf_email");

  if (!memberEmail) {
    return NextResponse.json({ error: "Not logged in.", messages: [] }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const threadId = String(searchParams.get("thread_id") || "").trim();

  if (!threadId) {
    return NextResponse.json({ error: "Missing thread id.", messages: [] }, { status: 400 });
  }

  const url =
    `${config.url}/rest/v1/vf_messages` +
    `?select=*` +
    `&thread_id=eq.${encodeURIComponent(threadId)}` +
    `&order=created_at.asc`;

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
      { error: "Failed to load thread.", details, messages: [] },
      { status: 500 }
    );
  }

  const messages = await res.json();
  const email = memberEmail.toLowerCase();
  const allowed = messages.some(
    (m: any) =>
      String(m.sender_email || "").toLowerCase() === email ||
      String(m.recipient_email || "").toLowerCase() === email
  );

  if (!allowed) {
    return NextResponse.json({ error: "Not allowed.", messages: [] }, { status: 403 });
  }

  const other = messages.find((m: any) => String(m.sender_email || "").toLowerCase() !== email);
  const otherEmail = other
    ? other.sender_email
    : messages.find((m: any) => String(m.recipient_email || "").toLowerCase() !== email)?.recipient_email || "";

  return NextResponse.json({
    messages,
    viewer_email: email,
    other_email: otherEmail,
    thread_id: threadId,
  });
}
