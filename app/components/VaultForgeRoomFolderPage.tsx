"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  applyRoomAction,
  deleteRoomForever,
  listRooms,
  type RoomRecord,
  type RoomStatus,
} from "../lib/vaultforgeRoomState";

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 34%), linear-gradient(180deg,#020617,#071326 55%,#020617)",
  color: "white",
  padding: "26px 16px 90px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1180, margin: "0 auto" };

const panel: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.28)",
  borderRadius: 30,
  padding: 24,
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.12), transparent 36%), linear-gradient(145deg,rgba(15,23,42,.96),rgba(2,6,23,.96))",
  marginBottom: 18,
  boxShadow: "0 26px 90px rgba(0,0,0,.36)",
};

const label: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".2em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

const btn: React.CSSProperties = {
  minHeight: 48,
  borderRadius: 999,
  padding: "12px 16px",
  border: 0,
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
  fontWeight: 950,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
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
  border: "1px solid rgba(248,113,113,.40)",
  background: "rgba(248,113,113,.10)",
};

export default function VaultForgeRoomFolderPage({
  status,
  title,
  subtitle,
}: {
  status: RoomStatus;
  title: string;
  subtitle: string;
}) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const refresh = () => setTick((v) => v + 1);
    window.addEventListener("vaultforge-5s-room-change", refresh);
    return () => window.removeEventListener("vaultforge-5s-room-change", refresh);
  }, []);

  const rooms = useMemo(() => listRooms(status), [status, tick]);

  function restore(room: RoomRecord) {
    applyRoomAction(room, "restore");
    setTick((v) => v + 1);
  }

  function archive(room: RoomRecord) {
    applyRoomAction(room, "archive");
    setTick((v) => v + 1);
  }

  function remove(room: RoomRecord) {
    applyRoomAction(room, "delete");
    setTick((v) => v + 1);
  }

  function hardDelete(room: RoomRecord) {
    deleteRoomForever(room.room_id);
    setTick((v) => v + 1);
  }

  return (
    <main style={page}>
      <div style={wrap}>
        <section style={panel}>
          <div style={label}>VaultForge 5S Folder</div>
          <h1 style={{ fontSize: "clamp(48px,10vw,104px)", lineHeight: .82, letterSpacing: "-.08em", margin: "12px 0" }}>
            {title}
          </h1>
          <p style={{ color: "#cbd5e1", fontSize: 20, lineHeight: 1.6 }}>{subtitle}</p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
            <Link href="/opportunity-rooms" style={btn}>Opportunity Lane</Link>
            <Link href="/saved-rooms" style={ghost}>Saved</Link>
            <Link href="/archived-rooms" style={ghost}>Archived</Link>
            <Link href="/deleted-rooms" style={ghost}>Deleted</Link>
            <Link href="/dashboard" style={ghost}>Command</Link>
          </div>
        </section>

        {!rooms.length ? (
          <section style={panel}>
            <div style={label}>Folder Clean</div>
            <h2 style={{ fontSize: "clamp(34px,7vw,70px)", margin: "10px 0", letterSpacing: "-.06em", lineHeight: .9 }}>
              No rooms here.
            </h2>
            <p style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
              This folder is empty. Active rooms are not shown here.
            </p>
          </section>
        ) : null}

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(290px,1fr))", gap: 18 }}>
          {rooms.map((room) => (
            <article key={`${room.room_kind}:${room.room_id}`} style={panel}>
              <div style={label}>{room.room_type}</div>
              <h2 style={{ fontSize: "clamp(34px,7vw,70px)", lineHeight: .9, letterSpacing: "-.06em", margin: "10px 0", overflowWrap: "anywhere" }}>
                {room.room_title}
              </h2>
              <p style={{ color: "#cbd5e1" }}>Status: {room.status}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                <Link href={room.source_route || "/dashboard"} style={btn}>Open Room</Link>
                <button type="button" onClick={() => restore(room)} style={ghost}>Restore Active</button>
                {status !== "archived" ? <button type="button" onClick={() => archive(room)} style={ghost}>Archive</button> : null}
                {status !== "deleted" ? <button type="button" onClick={() => remove(room)} style={danger}>Delete / Hide</button> : null}
                {status === "deleted" ? <button type="button" onClick={() => hardDelete(room)} style={danger}>Permanent Delete</button> : null}
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
