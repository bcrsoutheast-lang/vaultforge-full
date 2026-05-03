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

export async function POST(req: Request) {
  const config = getSupabaseConfig();

  if (!config) {
    return NextResponse.json(
      { error: "Supabase environment variables are missing." },
      { status: 500 }
    );
  }

  const cookieHeader = req.headers.get("cookie") || "";
  const senderEmail =
    getCookieValue(cookieHeader, "vf_user") ||
    getCookieValue(cookieHeader, "vf_email");

  if (!senderEmail) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }

  const body = await req.json();
  const recipientEmail = String(body?.recipient_email || "").trim().toLowerCase();
  const subject = String(body?.subject || "").trim();
  const message = String(body?.message || "").trim();
  const dealId = String(body?.deal_id || "").trim() || null;

  if (!recipientEmail || !message) {
    return NextResponse.json(
      { error: "Recipient and message are required." },
      { status: 400 }
    );
  }

  const res = await fetch(`${config.url}/rest/v1/vf_messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      sender_email: senderEmail.toLowerCase(),
      recipient_email: recipientEmail,
      subject: subject || "VaultForge message",
      message,
      deal_id: dealId,
      archived: false,
      read: false,
    }),
  });

  if (!res.ok) {
    const details = await res.text();
    return NextResponse.json(
      { error: "Failed to send message.", details },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
