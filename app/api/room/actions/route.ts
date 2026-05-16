import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function clean(value: unknown) {
  return String(value || "").trim();
}

function json(data: Record<string, unknown>, status = 200) {
  return NextResponse.json(data, { status });
}

export async function POST(request: Request) {
  let payload: Record<string, any> = {};

  try {
    payload = await request.json();
  } catch {
    payload = {};
  }

  const action = clean(payload.action);
  const roomId = clean(payload.room_id || payload.roomId || payload.id);
  const roomTitle = clean(payload.room_title || payload.title);
  const roomType = clean(payload.room_type || payload.type || "VaultForge Room");
  const folder = clean(payload.folder || "general");
  const viewerEmail =
    clean(payload.viewer_email) ||
    clean(request.headers.get("x-vf-email")) ||
    clean(payload.email);

  if (!roomId) {
    return json(
      {
        ok: false,
        error: "Missing room_id.",
      },
      400
    );
  }

  return json({
    ok: true,
    saved: true,
    action,
    room_id: roomId,
    room_title: roomTitle,
    room_type: roomType,
    folder,
    viewer_email: viewerEmail,
    note:
      "Room action accepted. Client-side cleanup state is active. Server persistence can be wired to Supabase when room action table is finalized.",
  });
}
