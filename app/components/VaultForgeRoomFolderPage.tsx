"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { applyRoomAction, listRooms, type RoomRecord, type RoomStatus } from "../lib/vaultforgeRoomState";

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(180deg,#020617,#071326 55%,#020617)",
  color: "white",
  padding: "22px 16px 96px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { width: "min(1180px,100%)", margin: "0 auto" };
const panel: React.CSSProperties = { border: "1px solid rgba(232,196,107,.22)", borderRadius: 30, padding: 24, background: "rgba(255,255,255,.05)", marginBottom: 20 };
const btn: React.CSSProperties = { minHeight: 44, borderRadius: 999, padding: "10px 14px", background: "linear-gradient(135deg,#f8e7b0,#e8c46b)", color: "#06100a", textDecoration: "none", fontWeight: 950, border: 0, display: "inline-flex", alignItems: "center", justifyContent: "center" };
const ghost: React.CSSProperties = { ...btn, background: "rgba(255,255,255,.06)", color: "white", border: "1px solid rgba(255,255,255,.16)" };

function title(status: RoomStatus) {
  if (status === "saved") return "Saved Rooms";
  if (status === "archived") return "Archived Rooms";
  if (status === "deleted") return "Deleted / Hidden Rooms";
  return "Active Rooms";
}

export default function VaultForgeRoomFolderPage({ status }: { status: RoomStatus }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const update = () => setTick((value) => value + 1);
    window.addEventListener("vaultforge-5s-room-change", update);
    return () => window.removeEventListener("vaultforge-5s-room-change", update);
  }, []);

  const rows = useMemo(() => listRooms(status), [status, tick]);

  function restore(row: RoomRecord) { applyRoomAction(row, "restore"); setTick((value) => value + 1); }
  function unsave(row: RoomRecord) { applyRoomAction(row, "unsave"); setTick((value) => value + 1); }
  function archive(row: RoomRecord) { applyRoomAction(row, "archive"); setTick((value) => value + 1); }

  return (
    <main style={page}>
      <div style={wrap}>
        <section style={panel}>
          <div style={{ color: "#e8c46b", letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 950, fontSize: 12 }}>
            VaultForge 5S Folder
          </div>
          <h1 style={{ fontSize: "clamp(54px,10vw,104px)", lineHeight: .88, letterSpacing: "-.075em", margin: "12px 0 18px" }}>
            {title(status)}.
          </h1>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <Link href="/dashboard" style={btn}>Command</Link>
            <Link href="/saved-rooms" style={ghost}>Saved</Link>
            <Link href="/archived-rooms" style={ghost}>Archived</Link>
            <Link href="/deleted-rooms" style={ghost}>Deleted</Link>
          </div>
        </section>

        {!rows.length ? (
          <section style={panel}>
            <p style={{ color: "#cbd5e1" }}>Nothing is here yet. Use 5S controls inside a room to move it here.</p>
          </section>
        ) : null}

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18 }}>
          {rows.map((row) => (
            <article key={`${row.room_kind}-${row.room_id}`} style={panel}>
              <h2>{row.room_title}</h2>
              <p style={{ color: "#cbd5e1" }}>Status: {row.status} | Type: {row.room_type}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
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
