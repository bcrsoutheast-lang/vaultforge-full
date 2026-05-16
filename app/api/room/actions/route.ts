import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function clean(value: unknown) {
  return String(value || "").trim();
}

export async function POST(request: Request) {
  let payload: Record<string, any> = {};

  try {
    payload = await request.json();
  } catch {
    payload = {};
  }

  const roomId = clean(payload.room_id || payload.id);
  if (!roomId) {
    return NextResponse.json({ ok: false, error: "Missing room_id." }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    action: clean(payload.action),
    room_id: roomId,
    room_title: clean(payload.room_title),
    room_type: clean(payload.room_type),
    status: clean(payload.status),
    note: "5S room action accepted. Client cleanup is active; Supabase persistence can be attached later.",
  });
}
