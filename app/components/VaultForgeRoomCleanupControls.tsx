"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  applyRoomAction,
  clean,
  deleteRoomForever,
  roomFolder,
  roomKind,
  roomRoute,
  roomType,
  upsertRoom,
  type RoomRecord,
} from "../lib/vaultforgeRoomState";

type Props = {
  roomId?: string;
  roomTitle?: string;
  roomType?: string;
  kind?: string;
  folder?: string;
  sourceRoute?: string;
  laneHref?: string;
  ownerEmail?: string;
};

const shell: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.24)",
  borderRadius: 24,
  padding: 16,
  background: "linear-gradient(145deg,rgba(255,255,255,.070),rgba(255,255,255,.030))",
  marginBottom: 18,
};

const label: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".16em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

const btn: React.CSSProperties = {
  minHeight: 44,
  borderRadius: 999,
  padding: "10px 14px",
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

const danger: React.CSSProperties = {
  ...ghost,
  color: "#fecaca",
  border: "1px solid rgba(248,113,113,.35)",
};

const redSolid: React.CSSProperties = {
  ...btn,
  background: "linear-gradient(135deg,#ef4444,#991b1b)",
  color: "white",
};

const chip: React.CSSProperties = {
  border: "1px solid rgba(157,243,191,.24)",
  borderRadius: 999,
  padding: "7px 10px",
  color: "#9df3bf",
  background: "rgba(157,243,191,.08)",
  fontWeight: 900,
  fontSize: 12,
};

function readLocalRecord(kind: string, id: string) {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem("vaultforge_5s_room_registry_v1") || "{}";
    const rows = JSON.parse(raw);
    const key = `${roomKind(kind)}:${clean(id) || "unknown"}`;
    return rows?.[key] || null;
  } catch {
    return null;
  }
}

export default function VaultForgeRoomCleanupControls({
  roomId = "",
  roomTitle = "",
  roomType: providedType = "",
  kind = "general",
  folder = "",
  sourceRoute = "",
  laneHref = "/dashboard",
  ownerEmail = "bcrsoutheast@gmail.com",
}: Props) {
  const resolvedKind = roomKind(kind || providedType || folder);
  const id = clean(roomId) || "unknown-room";
  const title = clean(roomTitle) || roomType(resolvedKind);
  const type = clean(providedType) || roomType(resolvedKind);
  const source = clean(sourceRoute) || roomRoute(resolvedKind, id);

  const initial = useMemo(() => {
    const existing = readLocalRecord(resolvedKind, id);

    return upsertRoom({
      room_id: id,
      room_title: existing?.room_title || title,
      room_type: existing?.room_type || type,
      room_kind: existing?.room_kind || resolvedKind,
      folder: existing?.folder || clean(folder) || roomFolder(resolvedKind),
      source_route: existing?.source_route || source,
      status: existing?.status,
      saved: existing?.saved,
      archived: existing?.archived,
      deleted: existing?.deleted,
    });
  }, [id, title, type, resolvedKind, folder, source]);

  const [record, setRecord] = useState<RoomRecord>(initial);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const existing = readLocalRecord(resolvedKind, id);

    if (existing) {
      setRecord(existing);
    }
  }, [resolvedKind, id]);

  const messageHref =
    `/messages/new?to=${encodeURIComponent(ownerEmail)}` +
    `&subject=${encodeURIComponent(record.room_title)}` +
    `&room_title=${encodeURIComponent(record.room_title)}` +
    `&title=${encodeURIComponent(record.room_title)}` +
    `&room_type=${encodeURIComponent(record.room_type)}` +
    `&room_id=${encodeURIComponent(record.room_id)}` +
    `&item_id=${encodeURIComponent(record.room_id)}` +
    `&signal_id=${encodeURIComponent(record.room_id)}` +
    `&source=${encodeURIComponent(`${record.room_kind}-room`)}` +
    `&type=${encodeURIComponent(record.room_kind)}` +
    `&folder=${encodeURIComponent(record.folder)}` +
    `&source_route=${encodeURIComponent(record.source_route)}`;

  function run(action: "save" | "archive" | "delete" | "restore") {
    const next = applyRoomAction(record, action);
    setRecord(next);

    const copy: Record<string, string> = {
      save: "Saved. It now lives in Saved Rooms.",
      archive: "Archived. It leaves active workflow.",
      delete: "Deleted/hidden. It leaves normal workflow.",
      restore: "Restored to active workflow.",
    };

    setStatus(copy[action]);

    fetch("/api/room/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...next }),
    }).catch(() => {});
  }

  function hardDelete() {
    deleteRoomForever(record.room_id);
    setStatus("Room permanently removed from local workflow state.");

    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.location.href = "/deleted-rooms";
      }
    }, 650);
  }

  if (record.deleted) {
    return (
      <section style={{ ...shell, borderColor: "rgba(248,113,113,.35)" }}>
        <div style={label}>Deleted / Hidden</div>

        <h3 style={{ margin: "8px 0", fontSize: 28 }}>
          This room is out of active workflow.
        </h3>

        <p style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
          Restore it back into execution flow or permanently remove it from
          Deleted Rooms to keep the command center clean.
        </p>

        <div
          className="vf-room-clean-actions"
          style={{ display: "flex", flexWrap: "wrap", gap: 10 }}
        >
          <button type="button" onClick={() => run("restore")} style={btn}>
            Restore Room
          </button>

          <button type="button" onClick={hardDelete} style={redSolid}>
            Permanent Delete
          </button>

          <Link href="/deleted-rooms" style={ghost}>
            Deleted Folder
          </Link>

          <Link href={laneHref} style={ghost}>
            Back To Lane
          </Link>

          <Link href="/dashboard" style={ghost}>
            Command
          </Link>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 12,
          }}
        >
          <span style={chip}>{record.room_type}</span>
          <span style={chip}>Status: deleted</span>
          <span style={chip}>Room: {record.room_id}</span>
        </div>

        {status ? (
          <p style={{ color: "#f8e7b0", fontWeight: 900 }}>{status}</p>
        ) : null}
      </section>
    );
  }

  return (
    <section style={shell}>
      <style>{`
        @media(max-width:760px) {
          .vf-room-clean-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
          }

          .vf-room-clean-actions > * {
            width: 100%;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={label}>5S Room Controls</div>

      <p style={{ color: "#cbd5e1", lineHeight: 1.55 }}>
        One-way cleanup discipline: save what matters, archive what is done,
        delete/hide what should leave active workflow.
      </p>

      <div
        className="vf-room-clean-actions"
        style={{ display: "flex", flexWrap: "wrap", gap: 10 }}
      >
        <button type="button" onClick={() => run("save")} style={record.saved ? btn : ghost}>
          Save Room
        </button>

        <button type="button" onClick={() => run("archive")} style={record.archived ? btn : ghost}>
          Archive Room
        </button>

        <button type="button" onClick={() => run("delete")} style={danger}>
          Delete / Hide Room
        </button>

        <Link href={messageHref} style={btn}>
          Request Info / Intro
        </Link>

        <Link href={messageHref} style={ghost}>
          Internal Thread
        </Link>

        <Link href="/saved-rooms" style={ghost}>
          Saved Folder
        </Link>

        <Link href="/archived-rooms" style={ghost}>
          Archived Folder
        </Link>

        <Link href="/deleted-rooms" style={ghost}>
          Deleted Folder
        </Link>

        <Link href={laneHref} style={ghost}>
          Back To Lane
        </Link>

        <Link href="/dashboard" style={ghost}>
          Command
        </Link>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginTop: 12,
        }}
      >
        <span style={chip}>{record.room_type}</span>
        <span style={chip}>Status: {record.status}</span>
        <span style={chip}>Room: {record.room_id}</span>
      </div>

      {status ? (
        <p style={{ color: "#f8e7b0", fontWeight: 900 }}>{status}</p>
      ) : null}
    </section>
  );
}
