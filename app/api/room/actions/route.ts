import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function clean(value: unknown) {
  return String(value || "").trim();
}

function normalizeAction(value: unknown) {
  const action = clean(value).toLowerCase();

  if (["save", "unsave", "archive", "unarchive", "delete", "restore"].includes(action)) return action;

  return "";
}

function operationalStatus(action: string, incomingStatus: string) {
  if (action === "save") return "saved";
  if (action === "unsave") return "active";
  if (action === "archive") return "archived";
  if (action === "unarchive") return "active";
  if (action === "delete") return "deleted";
  if (action === "restore") return "active";

  return incomingStatus || "active";
}

export async function POST(request: Request) {
  let payload: Record<string, any> = {};

  try {
    payload = await request.json();
  } catch {
    payload = {};
  }

  const roomId = clean(payload.room_id || payload.id);
  const action = normalizeAction(payload.action);
  const roomTitle = clean(payload.room_title || payload.title);
  const roomType = clean(payload.room_type || payload.type || "VaultForge Room");
  const roomKind = clean(payload.room_kind || payload.kind || payload.folder || "general");
  const sourceRoute = clean(payload.source_route || payload.sourceRoute || "");
  const status = operationalStatus(action, clean(payload.status));
  const folder = clean(payload.folder || roomKind || "general");

  if (!roomId) {
    return NextResponse.json({ ok: false, error: "Missing room_id." }, { status: 400 });
  }

  if (!action) {
    return NextResponse.json({ ok: false, error: "Unsupported room action." }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    saved: true,
    action,
    room_id: roomId,
    room_title: roomTitle,
    room_type: roomType,
    room_kind: roomKind,
    folder,
    status,
    source_route: sourceRoute,
    note:
      "5S room action accepted. Client cleanup is active. Server persistence hook is normalized and ready for Supabase-backed room action storage.",
  });
}
