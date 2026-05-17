"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  applyRoomAction,
  clean,
  deleteRoomForever,
  getRoomRecord,
  roomRoute,
  upsertRoom,
  type RoomRecord,
  type RoomStatus,
} from "../lib/vaultforgeRoomState";

type Props = {
  roomId: string;
  roomTitle: string;
  sourceRoute?: string;
  variant?: "card" | "room" | "compact";
  afterAction?: "stay" | "folder" | "projects" | "workstations";
};

const btn: React.CSSProperties = {
  minHeight: 46,
  borderRadius: 999,
  padding: "11px 15px",
  border: 0,
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
  fontWeight: 950,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  textAlign: "center",
};

const ghost: React.CSSProperties = {
  ...btn,
  background: "rgba(255,255,255,.06)",
  color: "white",
  border: "1px solid rgba(255,255,255,.16)",
};

const blue: React.CSSProperties = {
  ...ghost,
  color: "#bae6fd",
  border: "1px solid rgba(56,189,248,.36)",
  background: "rgba(56,189,248,.10)",
};

const green: React.CSSProperties = {
  ...ghost,
  color: "#bbf7d0",
  border: "1px solid rgba(34,197,94,.36)",
  background: "rgba(34,197,94,.10)",
};

const danger: React.CSSProperties = {
  ...ghost,
  color: "#fecaca",
  border: "1px solid rgba(248,113,113,.42)",
  background: "rgba(248,113,113,.10)",
};

const redSolid: React.CSSProperties = {
  ...btn,
  background: "linear-gradient(135deg,#ef4444,#991b1b)",
  color: "white",
};

function targetFor(status: RoomStatus) {
  if (status === "saved") return "/projects?folder=saved";
  if (status === "archived") return "/projects?folder=archived";
  if (status === "deleted") return "/projects?folder=deleted";
  return "/projects?folder=active";
}

export default function VaultForgeDealActions({
  roomId,
  roomTitle,
  sourceRoute = "",
  variant = "card",
  afterAction = "stay",
}: Props) {
  const id = clean(roomId) || "unknown-room";
  const title = clean(roomTitle) || "Opportunity Room";
  const route = clean(sourceRoute) || roomRoute("opportunity", id);

  const initial = useMemo(() => {
    const existing = getRoomRecord("opportunity", id);

    return upsertRoom({
      room_id: id,
      room_title: existing?.room_title || title,
      room_type: "Opportunity Room",
      room_kind: "opportunity",
      folder: "opportunity",
      source_route: existing?.source_route || route,
      status: existing?.status,
      saved: existing?.saved,
      archived: existing?.archived,
      deleted: existing?.deleted,
    });
  }, [id, title, route]);

  const [record, setRecord] = useState<RoomRecord>(initial);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const refresh = () => {
      const existing = getRoomRecord("opportunity", id);
      if (existing) setRecord(existing);
    };

    refresh();
    window.addEventListener("vaultforge-5s-room-change", refresh);

    return () => window.removeEventListener("vaultforge-5s-room-change", refresh);
  }, [id]);

  function redirectIfNeeded(nextStatus: RoomStatus) {
    if (afterAction === "stay" || typeof window === "undefined") return;

    let href = "/projects";

    if (afterAction === "folder") href = targetFor(nextStatus);
    if (afterAction === "projects") href = "/projects";
    if (afterAction === "workstations") href = "/workstations";

    window.setTimeout(() => {
      window.location.href = href;
    }, 450);
  }

  function doAction(action: "save" | "archive" | "delete" | "restore") {
    const next = applyRoomAction(record, action);
    setRecord(next);

    if (action === "save") setNotice("Saved. Moved to Saved.");
    if (action === "archive") setNotice("Archived. Moved to Archived.");
    if (action === "delete") setNotice("Hidden. Moved to Hidden.");
    if (action === "restore") setNotice("Restored. Moved back to Active.");

    fetch("/api/room/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...next }),
    }).catch(() => {});

    redirectIfNeeded(next.status);
  }

  function hardDelete() {
    deleteRoomForever(record.room_id);
    setNotice("Permanently removed from this device.");

    if (afterAction !== "stay" && typeof window !== "undefined") {
      window.setTimeout(() => {
        window.location.href = "/projects?folder=deleted";
      }, 450);
    }
  }

  const grid =
    variant === "room"
      ? { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 10 }
      : { display: "flex", flexWrap: "wrap", gap: 10 };

  if (record.deleted) {
    return (
      <div style={{ display: "grid", gap: 10 }}>
        <div style={grid}>
          <button type="button" onClick={() => doAction("restore")} style={green}>
            Restore Active
          </button>

          <button type="button" onClick={hardDelete} style={redSolid}>
            Permanent Delete
          </button>

          <Link href="/projects?folder=deleted" style={ghost}>
            Hidden Folder
          </Link>

          <Link href="/projects" style={ghost}>
            Projects
          </Link>
        </div>

        {notice ? <p style={{ color: "#f8e7b0", margin: 0, fontWeight: 900 }}>{notice}</p> : null}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={grid}>
        {variant !== "compact" ? (
          <Link href={route} style={btn}>
            Open Room
          </Link>
        ) : null}

        <button type="button" onClick={() => doAction("save")} style={record.saved ? green : ghost}>
          Save
        </button>

        <button type="button" onClick={() => doAction("archive")} style={record.archived ? blue : ghost}>
          Archive
        </button>

        <button type="button" onClick={() => doAction("delete")} style={danger}>
          Hide
        </button>

        <Link href={`/messages/new?subject=${encodeURIComponent(title)}&room_id=${encodeURIComponent(id)}&room_type=${encodeURIComponent("Opportunity Room")}&source_route=${encodeURIComponent(route)}`} style={ghost}>
          Message
        </Link>

        <Link href="/projects?folder=saved" style={ghost}>
          Saved
        </Link>

        <Link href="/projects?folder=archived" style={ghost}>
          Archived
        </Link>

        <Link href="/projects?folder=deleted" style={ghost}>
          Hidden
        </Link>
      </div>

      {notice ? <p style={{ color: "#f8e7b0", margin: 0, fontWeight: 900 }}>{notice}</p> : null}
    </div>
  );
}
