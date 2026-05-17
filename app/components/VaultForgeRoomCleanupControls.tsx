"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  applyRoomAction,
  clean,
  deleteRoomForever,
  getRoomRecord,
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
  border: "1px solid rgba(232,196,107,.32)",
  borderRadius: 28,
  padding: 18,
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 36%), linear-gradient(145deg,rgba(15,23,42,.96),rgba(2,6,23,.96))",
  marginBottom: 18,
  boxShadow: "0 24px 80px rgba(0,0,0,.34)",
};

const label: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

const titleStyle: React.CSSProperties = {
  margin: "8px 0 8px",
  fontSize: "clamp(28px,6vw,52px)",
  lineHeight: 0.95,
  letterSpacing: "-.045em",
};

const btn: React.CSSProperties = {
  minHeight: 48,
  borderRadius: 999,
  padding: "11px 16px",
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

const green: React.CSSProperties = {
  ...ghost,
  color: "#bbf7d0",
  border: "1px solid rgba(34,197,94,.35)",
  background: "rgba(34,197,94,.10)",
};

const blue: React.CSSProperties = {
  ...ghost,
  color: "#bae6fd",
  border: "1px solid rgba(14,165,233,.35)",
  background: "rgba(14,165,233,.10)",
};

const danger: React.CSSProperties = {
  ...ghost,
  color: "#fecaca",
  border: "1px solid rgba(248,113,113,.38)",
  background: "rgba(248,113,113,.10)",
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

function actionCopy(action: string) {
  if (action === "save") return "Saved. This room is now in Saved Rooms.";
  if (action === "archive") return "Archived. This room leaves active workflow.";
  if (action === "delete") return "Deleted/hidden. This room leaves normal workflow.";
  if (action === "restore") return "Restored to active workflow.";
  return "Action complete.";
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
    const existing = getRoomRecord(resolvedKind, id);

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
    const refresh = () => {
      const existing = getRoomRecord(resolvedKind, id);
      if (existing) setRecord(existing);
    };

    refresh();
    window.addEventListener("vaultforge-5s-room-change", refresh);

    return () => window.removeEventListener("vaultforge-5s-room-change", refresh);
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
    setStatus(actionCopy(action));

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
      if (typeof window !== "undefined") window.location.href = "/deleted-rooms";
    }, 650);
  }

  if (record.deleted) {
    return (
      <section style={{ ...shell, borderColor: "rgba(248,113,113,.42)" }}>
        <div style={label}>5S Deleted Cell</div>
        <h3 style={titleStyle}>This room is out of active workflow.</h3>
        <p style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
          Restore it if this room still matters. Permanently delete it when the room should leave the command system completely.
        </p>

        <div className="vf-room-clean-actions" style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <button type="button" onClick={() => run("restore")} style={btn}>Restore Room</button>
          <button type="button" onClick={hardDelete} style={redSolid}>Permanent Delete</button>
          <Link href="/deleted-rooms" style={ghost}>Deleted Folder</Link>
          <Link href={laneHref} style={ghost}>Back To Lane</Link>
          <Link href="/dashboard" style={ghost}>Command</Link>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          <span style={chip}>{record.room_type}</span>
          <span style={chip}>Status: deleted</span>
          <span style={chip}>Room: {record.room_id}</span>
        </div>

        {status ? <p style={{ color: "#f8e7b0", fontWeight: 900 }}>{status}</p> : null}
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

      <div style={label}>5S Command Cell</div>
      <h3 style={titleStyle}>Sort. Set. Shine. Standardize. Sustain.</h3>

      <p style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
        One-way operational discipline: save what matters, archive what is done, delete/hide what should leave active workflow.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, margin: "14px 0" }}>
        <div style={{ border: "1px solid rgba(232,196,107,.20)", borderRadius: 18, padding: 12, background: "rgba(232,196,107,.08)" }}>
          <div style={label}>Sort</div>
          <div style={{ color: "#cbd5e1", marginTop: 5 }}>Remove noise</div>
        </div>
        <div style={{ border: "1px solid rgba(14,165,233,.24)", borderRadius: 18, padding: 12, background: "rgba(14,165,233,.08)" }}>
          <div style={{ ...label, color: "#67e8f9" }}>Set</div>
          <div style={{ color: "#cbd5e1", marginTop: 5 }}>Place the room</div>
        </div>
        <div style={{ border: "1px solid rgba(34,197,94,.24)", borderRadius: 18, padding: 12, background: "rgba(34,197,94,.08)" }}>
          <div style={{ ...label, color: "#86efac" }}>Sustain</div>
          <div style={{ color: "#cbd5e1", marginTop: 5 }}>Keep flow clean</div>
        </div>
      </div>

      <div className="vf-room-clean-actions" style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <button type="button" onClick={() => run("save")} style={record.saved ? green : ghost}>
          Save Room
        </button>
        <button type="button" onClick={() => run("archive")} style={record.archived ? blue : ghost}>
          Archive Room
        </button>
        <button type="button" onClick={() => run("delete")} style={danger}>
          Delete / Hide Room
        </button>
        <Link href={messageHref} style={btn}>Request Info / Intro</Link>
        <Link href={messageHref} style={ghost}>Internal Thread</Link>
        <Link href="/saved-rooms" style={ghost}>Saved Folder</Link>
        <Link href="/archived-rooms" style={ghost}>Archived Folder</Link>
        <Link href="/deleted-rooms" style={ghost}>Deleted Folder</Link>
        <Link href={laneHref} style={ghost}>Back To Lane</Link>
        <Link href="/dashboard" style={ghost}>Command</Link>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
        <span style={chip}>{record.room_type}</span>
        <span style={chip}>Status: {record.status}</span>
        <span style={chip}>Room: {record.room_id}</span>
      </div>

      {status ? <p style={{ color: "#f8e7b0", fontWeight: 900 }}>{status}</p> : null}
    </section>
  );
}
