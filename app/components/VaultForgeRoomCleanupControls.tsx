"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type RoomKind = "opportunity" | "pressure" | "routing" | "signal" | "general";

type Props = {
  roomId?: string;
  roomTitle?: string;
  roomType?: string;
  sourceRoute?: string;
  folder?: string;
  kind?: RoomKind;
  ownerEmail?: string;
  viewerEmail?: string;
  backHref?: string;
  laneHref?: string;
};

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function readCookie(name: string) {
  if (typeof document === "undefined") return "";

  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!match) return "";

  try {
    return decodeURIComponent(match.slice(name.length + 1));
  } catch {
    return match.slice(name.length + 1);
  }
}

function getViewerEmail(fallback?: string) {
  if (typeof window === "undefined") return cleanEmail(fallback);

  const keys = ["vf_email", "vf_member_email", "memberEmail", "email"];

  for (const key of keys) {
    try {
      const localValue = cleanEmail(window.localStorage.getItem(key));
      if (localValue.includes("@")) return localValue;

      const sessionValue = cleanEmail(window.sessionStorage.getItem(key));
      if (sessionValue.includes("@")) return sessionValue;
    } catch {
      // Continue.
    }
  }

  const cookieValue = cleanEmail(readCookie("vf_email") || readCookie("vf_member_email"));
  return cookieValue.includes("@") ? cookieValue : cleanEmail(fallback);
}

function actionKey(roomId: string) {
  return `vaultforge_room_action_state_${roomId || "unknown"}`;
}

function readState(roomId: string) {
  if (typeof window === "undefined") {
    return {
      saved: false,
      archived: false,
      deleted: false,
    };
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(actionKey(roomId)) || "{}");
    return {
      saved: Boolean(parsed.saved),
      archived: Boolean(parsed.archived),
      deleted: Boolean(parsed.deleted),
    };
  } catch {
    return {
      saved: false,
      archived: false,
      deleted: false,
    };
  }
}

function writeState(roomId: string, next: { saved: boolean; archived: boolean; deleted: boolean }) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(actionKey(roomId), JSON.stringify(next));
  } catch {
    // Ignore.
  }
}

function inferredRoomType(kind?: RoomKind, roomType?: string) {
  const typed = clean(roomType);
  if (typed) return typed;

  if (kind === "opportunity") return "Opportunity Room";
  if (kind === "pressure") return "Pressure Room";
  if (kind === "routing") return "Routing Room";
  if (kind === "signal") return "Signal Room";
  return "VaultForge Room";
}

function inferredFolder(kind?: RoomKind, folder?: string) {
  const value = clean(folder);
  if (value) return value;

  if (kind === "opportunity") return "opportunity";
  if (kind === "pressure") return "pressure";
  if (kind === "routing") return "routing";
  if (kind === "signal") return "signals";
  return "general";
}

const wrap: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.24)",
  borderRadius: 26,
  padding: 18,
  background: "linear-gradient(145deg,rgba(255,255,255,.070),rgba(255,255,255,.030))",
  boxShadow: "0 22px 70px rgba(0,0,0,.22)",
  marginBottom: 18,
};

const label: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".16em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

const button: React.CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: 46,
  borderRadius: 999,
  padding: "11px 16px",
  textDecoration: "none",
  fontWeight: 950,
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
  border: 0,
  cursor: "pointer",
};

const ghost: React.CSSProperties = {
  ...button,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.16)",
  color: "white",
};

const danger: React.CSSProperties = {
  ...ghost,
  border: "1px solid rgba(248,113,113,.35)",
  color: "#fecaca",
};

export default function VaultForgeRoomCleanupControls({
  roomId = "",
  roomTitle = "",
  roomType = "",
  sourceRoute = "",
  folder = "",
  kind = "general",
  ownerEmail = "bcrsoutheast@gmail.com",
  viewerEmail = "",
  backHref = "/dashboard",
  laneHref = "/dashboard",
}: Props) {
  const safeRoomId = clean(roomId) || "unknown-room";
  const safeTitle = clean(roomTitle) || "VaultForge Room";
  const safeRoomType = inferredRoomType(kind, roomType);
  const safeFolder = inferredFolder(kind, folder);
  const safeSourceRoute = clean(sourceRoute) || backHref || "/dashboard";
  const safeViewer = getViewerEmail(viewerEmail);

  const [state, setState] = useState(() => readState(safeRoomId));
  const [status, setStatus] = useState("");

  const messageHref = useMemo(() => {
    return (
      `/messages/new?to=${encodeURIComponent(ownerEmail)}` +
      `&subject=${encodeURIComponent(safeTitle)}` +
      `&room_title=${encodeURIComponent(safeTitle)}` +
      `&title=${encodeURIComponent(safeTitle)}` +
      `&room_type=${encodeURIComponent(safeRoomType)}` +
      `&room_id=${encodeURIComponent(safeRoomId)}` +
      `&item_id=${encodeURIComponent(safeRoomId)}` +
      `&signal_id=${encodeURIComponent(safeRoomId)}` +
      `&source=${encodeURIComponent(`${kind}-room`)}` +
      `&type=${encodeURIComponent(kind)}` +
      `&folder=${encodeURIComponent(safeFolder)}` +
      `&source_route=${encodeURIComponent(safeSourceRoute)}`
    );
  }, [ownerEmail, safeTitle, safeRoomType, safeRoomId, safeFolder, safeSourceRoute, kind]);

  async function pushAction(action: "save" | "archive" | "delete" | "restore") {
    const next = { ...state };

    if (action === "save") {
      next.saved = !state.saved;
      next.archived = false;
      next.deleted = false;
    }

    if (action === "archive") {
      next.archived = !state.archived;
      next.deleted = false;
    }

    if (action === "delete") {
      next.deleted = true;
      next.archived = false;
      next.saved = false;
    }

    if (action === "restore") {
      next.deleted = false;
      next.archived = false;
    }

    setState(next);
    writeState(safeRoomId, next);

    setStatus(
      action === "delete"
        ? "Room hidden from active workflow."
        : action === "archive"
        ? next.archived
          ? "Room moved to Archived."
          : "Room returned from Archived."
        : action === "save"
        ? next.saved
          ? "Room saved."
          : "Room unsaved."
        : "Room restored."
    );

    try {
      await fetch("/api/room/actions", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": safeViewer,
          "x-vf-admin": "0",
        },
        body: JSON.stringify({
          action,
          room_id: safeRoomId,
          room_title: safeTitle,
          room_type: safeRoomType,
          folder: safeFolder,
          source_route: safeSourceRoute,
          viewer_email: safeViewer,
          state: next,
        }),
      });
    } catch {
      // Local cleanup still works even if persistence endpoint/table is not ready.
    }
  }

  if (state.deleted) {
    return (
      <section style={{ ...wrap, borderColor: "rgba(248,113,113,.35)" }}>
        <div style={label}>Room Hidden</div>
        <h2 style={{ margin: "8px 0 10px", fontSize: 32, letterSpacing: "-.04em" }}>
          This room is hidden from active workflow.
        </h2>
        <p style={{ color: "#cbd5e1", lineHeight: 1.55, marginTop: 0 }}>
          Restore it to place it back into active room flow, or return to the lane.
        </p>

        <div className="vf-room-actions" style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <button type="button" onClick={() => pushAction("restore")} style={button}>
            Restore Room
          </button>
          <a href={laneHref} style={ghost}>
            Back To Lane
          </a>
          <a href="/dashboard" style={ghost}>
            Command
          </a>
        </div>

        {status ? <p style={{ color: "#f8e7b0", fontWeight: 900 }}>{status}</p> : null}
      </section>
    );
  }

  return (
    <section style={wrap}>
      <style>{`
        @media(max-width:760px) {
          .vf-room-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
          }

          .vf-room-actions > * {
            width: 100%;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={label}>Room Cleanup Controls</div>

      <p style={{ color: "#cbd5e1", lineHeight: 1.55, margin: "8px 0 14px" }}>
        Save, archive, hide/delete, or start an internal thread without losing the room context.
      </p>

      <div className="vf-room-actions" style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <button type="button" onClick={() => pushAction("save")} style={state.saved ? button : ghost}>
          {state.saved ? "Saved" : "Save Room"}
        </button>

        <button type="button" onClick={() => pushAction("archive")} style={state.archived ? button : ghost}>
          {state.archived ? "Archived" : "Archive Room"}
        </button>

        <button type="button" onClick={() => pushAction("delete")} style={danger}>
          Delete / Hide Room
        </button>

        <Link href={messageHref} style={button}>
          Request Info / Intro
        </Link>

        <Link href={messageHref} style={ghost}>
          Internal Thread
        </Link>

        <a href={laneHref} style={ghost}>
          Back To Lane
        </a>

        <a href="/dashboard" style={ghost}>
          Command
        </a>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
        <span style={chip}>{safeRoomType}</span>
        <span style={chip}>Folder: {safeFolder}</span>
        <span style={chip}>Room: {safeRoomId}</span>
      </div>

      {status ? <p style={{ color: "#f8e7b0", fontWeight: 900 }}>{status}</p> : null}
    </section>
  );
}

const chip: React.CSSProperties = {
  border: "1px solid rgba(157,243,191,.24)",
  borderRadius: 999,
  padding: "7px 10px",
  color: "#9df3bf",
  background: "rgba(157,243,191,.08)",
  fontWeight: 900,
  fontSize: 12,
  overflowWrap: "anywhere",
};
