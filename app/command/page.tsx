"use client";

import { useEffect, useMemo, useState } from "react";

type View = "active" | "deal" | "pain" | "saved" | "archived" | "deleted";

type RoomKind = "deal" | "pain";
type RoomStatus = "active" | "saved" | "archived" | "deleted";

type CanonicalMemberRoom = {
  id: string;
  roomId: string;
  kind: RoomKind;
  roomType: RoomKind;
  workspace: "member-command";
  visibility: "member";
  title: string;
  status: RoomStatus;
  roomStatus: RoomStatus;
  city: string;
  state: string;
  message: string;
  imageUrl: string;
  raw: Record<string, any>;
};

/* ---------------- STORAGE ---------------- */

const KEYS = [
  "vaultforge_member_rooms_v1",
  "vaultforge_command_deal_rooms_v1",
  "vaultforge_command_pain_rooms_v1",
];

/* ---------------- STYLES ---------------- */

const page: React.CSSProperties = {
  minHeight: "100vh",
  padding: "24px",
  background:
    "radial-gradient(circle at 20% 10%, rgba(255,215,80,.10), transparent 40%), radial-gradient(circle at 80% 20%, rgba(255,80,120,.10), transparent 45%), #0b0f17",
};

const shell: React.CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
};

const nav: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
  marginBottom: 20,
};

const brand: React.CSSProperties = {
  fontWeight: 900,
  fontSize: 28,
  color: "#ffd86a",
  marginRight: 10,
};

const btn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,.15)",
  background: "rgba(255,255,255,.06)",
  color: "white",
  cursor: "pointer",
  fontWeight: 700,
};

const card: React.CSSProperties = {
  background: "rgba(255,255,255,.04)",
  border: "1px solid rgba(255,255,255,.10)",
  borderRadius: 18,
  padding: 18,
  marginBottom: 16,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
  gap: 12,
};

const panel: React.CSSProperties = {
  background: "rgba(255,255,255,.05)",
  border: "1px solid rgba(255,255,255,.10)",
  borderRadius: 16,
  padding: 14,
};

const img: React.CSSProperties = {
  width: "100%",
  height: 160,
  objectFit: "cover",
  borderRadius: 12,
  marginBottom: 10,
};

const title: React.CSSProperties = {
  fontWeight: 800,
  fontSize: 16,
  marginBottom: 6,
};

const muted: React.CSSProperties = {
  opacity: 0.7,
  fontSize: 13,
};

/* ---------------- HELPERS ---------------- */

function safeString(v: any) {
  return v ? String(v) : "";
}

function normalize(row: any): CanonicalMemberRoom | null {
  if (!row?.id && !row?.roomId) return null;

  const id = safeString(row.id || row.roomId);

  const image =
    row.imageUrl ||
    row.coverPhoto ||
    row.photoUrl ||
    (Array.isArray(row.images) ? row.images[0] : "") ||
    "";

  return {
    id,
    roomId: id,
    kind: String(row.kind || "deal").includes("pain") ? "pain" : "deal",
    roomType: String(row.kind || "deal").includes("pain") ? "pain" : "deal",
    workspace: "member-command",
    visibility: "member",
    title: safeString(row.title || "Untitled"),
    status: (row.status || "active") as RoomStatus,
    roomStatus: (row.status || "active") as RoomStatus,
    city: safeString(row.city),
    state: safeString(row.state),
    message: safeString(row.message || "No message"),
    imageUrl: image,
    raw: row,
  };
}

/* ---------------- LOAD ---------------- */

function load(): CanonicalMemberRoom[] {
  if (typeof window === "undefined") return [];

  const out: CanonicalMemberRoom[] = [];

  for (const key of KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) continue;

      for (const r of parsed) {
        const n = normalize(r);
        if (n) out.push(n);
      }
    } catch {}
  }

  return out;
}

/* ---------------- PAGE ---------------- */

export default function CommandPage() {
  const [rooms, setRooms] = useState<CanonicalMemberRoom[] | null>(null);
  const [view, setView] = useState<View>("active");

  useEffect(() => {
    setRooms(load());
  }, []);

  const grouped = useMemo(() => {
    const r = rooms || [];
    return {
      active: r.filter(x => x.status === "active"),
      deal: r.filter(x => x.kind === "deal"),
      pain: r.filter(x => x.kind === "pain"),
      saved: r.filter(x => x.status === "saved"),
      archived: r.filter(x => x.status === "archived"),
      deleted: r.filter(x => x.status === "deleted"),
    };
  }, [rooms]);

  const visible = grouped[view];

  return (
    <main style={page}>
      <div style={shell}>

        {/* NAV */}
        <div style={nav}>
          <div style={brand}>VAULTFORGE</div>
          <button style={btn} onClick={() => setView("active")}>Active</button>
          <button style={btn} onClick={() => setView("deal")}>Deals</button>
          <button style={btn} onClick={() => setView("pain")}>Pain</button>
          <button style={btn} onClick={() => setView("saved")}>Saved</button>
        </div>

        {/* HEADER */}
        <div style={card}>
          <div style={{ fontSize: 34, fontWeight: 900 }}>
            Member Command
          </div>
          <div style={{ opacity: 0.7 }}>
            {view.toUpperCase()} View
          </div>
        </div>

        {/* CONTENT */}
        <div style={card}>

          {rooms === null ? (
            <div>Loading...</div>
          ) : visible.length === 0 ? (
            <div style={{ opacity: 0.7 }}>
              No rooms in this section.
            </div>
          ) : (
            <div style={grid}>
              {visible.map(room => (
                <div key={room.id} style={panel}>
                  {room.imageUrl && (
                    <img src={room.imageUrl} style={img} />
                  )}

                  <div style={title}>{room.title}</div>
                  <div style={{ fontSize: 14 }}>{room.message}</div>
                  <div style={muted}>
                    {room.city} {room.state}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>
    </main>
  );
}
