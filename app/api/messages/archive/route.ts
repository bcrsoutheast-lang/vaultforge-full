import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return { url, key };
}

export async function POST(req: Request) {
  const config = getSupabaseConfig();

  if (!config) {
    return NextResponse.json(
      { error: "Supabase environment variables are missing." },
      { status: 500 }
    );
  }

  const body = await req.json();
  const messageId = String(body?.message_id || body?.messageId || "").trim();

  if (!messageId) {
    return NextResponse.json({ error: "Missing message id." }, { status: 400 });
  }

  const url = `${config.url}/rest/v1/vf_messages?id=eq.${encodeURIComponent(messageId)}`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ archived: true }),
  });

  if (!res.ok) {
    const details = await res.text();
    return NextResponse.json(
      { error: "Failed to archive message.", details },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
