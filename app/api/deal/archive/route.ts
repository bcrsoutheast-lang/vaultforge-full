import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  return { url, key };
}

export async function POST(req: Request) {
  const userEmail = cookies().get("vf_user")?.value || "";

  if (!userEmail) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "Missing deal id" }, { status: 400 });
  }

  const config = getSupabaseConfig();

  if (!config) {
    return NextResponse.json(
      { error: "Supabase keys are missing in Vercel." },
      { status: 500 }
    );
  }

  const query = new URL(`${config.url}/rest/v1/vf_deals`);
  query.searchParams.set("id", `eq.${id}`);
  query.searchParams.set("owner_email", `eq.${userEmail}`);

  const response = await fetch(query.toString(), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ archived: true, status: "archived" }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json(
      { error: errorText || "Failed to archive deal." },
      { status: response.status }
    );
  }

  return NextResponse.json({ ok: true });
}
