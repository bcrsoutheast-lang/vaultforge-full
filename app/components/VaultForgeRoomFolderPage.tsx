"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { applyRoomAction, listRooms, type RoomRecord, type RoomStatus } from "../lib/vaultforgeRoomState";

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "radial-gradient(circle at top left, rgba(232,196,107,.13), transparent 30%), linear-gradient(180deg,#020617,#071326 55%,#020617)",
  color: "white",
  padding: "22px 16px 96px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { width: "min(1180px,100%)", margin: "0 auto" };

const panel: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.22)",
  borderRadius: 30,
  padding: 24,
  background: "linear-gradient(145deg,rgba(255,255,255,.070),rgba(255,255,255,.030))",
  boxShadow: "0 28px 86px rgba(0,0,0,.30)",
  marginBottom: 20,
};

const label: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

const btn: React.CSSProperties = {
  minHeight: 44,
  borderRadius: 999,
  padding: "10px 14px",
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
  textDecoration: "none",
  fontWeight: 950,
  border: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const ghost: React.CSSProperties = {
  ...btn,
  background: "rgba(255,255,255,.06)",
  color: "white",
  border: "1px solid rgba(255,255,255,.16)",
};

function title(status: RoomStatus) {
  if (status === "saved") return "Saved Rooms";
  if (status === "archived") return "Archived Rooms";
  if (status === "deleted") return "Deleted / Hidden Rooms";
  return "Active Rooms";
}

function subtitle(status: RoomStatus) {
  if (status === "saved") return "Rooms intentionally kept for follow-up.";
  if (status === "archived") return "Rooms removed from active workflow but kept for history.";
  if (status === "deleted") return "Rooms hidden from normal workflow so the workspace stays clean.";
  return "Active operating rooms.";
}

export default function VaultForgeRoomFolderPage({ status }: { status: RoomStatus }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const update = () => setTick((v) => v + 1);
    window.addEventListener("vaultforge-5s-room-change", update);
    return () => window.removeEventListener("vaultforge-5s-room-change", update);
  }, []);

  const rows = useMemo(() => listRooms(status), [status, tick]);

  function restore(row: RoomRecord) {
    applyRoomAction(row, "restore");
    setTick((v) => v + 1);
  }

  function unsave(row: RoomRecord) {
    applyRoomAction(row, "unsave");
    setTick((v) => v + 1);
  }

  function archive(row: RoomRecord) {
    applyRoomAction(row, "archive");
    setTick((v) => v + 1);
  }

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover { transform: translateY(-1px); transition: all .18s ease; filter: brightness(1.06); }
        @media(max-width:760px) {
          .vf-grid, .vf-actions { grid-template-columns: 1fr !important; }
          .vf-actions { display: grid !important; }
          .vf-actions > * { width: 100%; box-sizing: border-box; }
        }
      `}</style>

      <div style={wrap}>
        <section style={panel}>
          <div style={label}>VaultForge 5S Folder</div>
          <h1 style={{ fontSize: "clamp(54px,10vw,104px)", lineHeight: .88, letterSpacing: "-.075em", margin: "12px 0 18px" }}>
            {title(status)}.
          </h1>
          <p style={{ color: "#cbd5e1", lineHeight: 1.65, fontSize: 20, marginTop: 0 }}>{subtitle(status)}</p>
          <div className="vf-actions" style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <Link href="/dashboard" style={btn}>Command</Link>
            <Link href="/saved-rooms" style={ghost}>Saved</Link>
            <Link href="/archived-rooms" style={ghost}>Archived</Link>
            <Link href="/deleted-rooms" style={ghost}>Deleted</Link>
          </div>
        </section>

        {!rows.length ? (
          <section style={panel}>
            <div style={label}>Folder Empty</div>
            <p style={{ color: "#cbd5e1" }}>Nothing is here yet. Use 5S controls inside a room to move it here.</p>
          </section>
        ) : null}

        <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 18 }}>
          {rows.map((row) => (
            <article key={`${row.room_kind}-${row.room_id}`} style={panel}>
              <div style={label}>{row.room_type}</div>
              <h2 style={{ fontSize: "clamp(32px,5vw,52px)", lineHeight: .95, letterSpacing: "-.045em", margin: "10px 0" }}>
                {row.room_title}
              </h2>
              <p style={{ color: "#cbd5e1", lineHeight: 1.55 }}>
                Status: {row.status} | Folder: {row.folder}
              </p>
              <div className="vf-actions" style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                <Link href={row.source_route || "/dashboard"} style={btn}>Open Room</Link>
                {status === "saved" ? <button type="button" onClick={() => unsave(row)} style={ghost}>Remove Saved</button> : null}
                {status === "archived" || status === "deleted" ? <button type="button" onClick={() => restore(row)} style={ghost}>Restore Active</button> : null}
                {status !== "archived" && status !== "deleted" ? <button type="button" onClick={() => archive(row)} style={ghost}>Archive</button> : null}
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
