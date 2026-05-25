"use client";

import { useEffect, useMemo, useState } from "react";

type View = "active" | "deal" | "pain" | "saved" | "archived" | "deleted";

type RoomKind = "deal" | "pain";
type RoomStatus = "active" | "saved" | "archived" | "deleted";

type ProfileSnapshot = {
  id: string;
  name: string;
  company: string;
  email: string;
  memberType: string;
  basedState: string;
  basedCity: string;
  basedCounty: string;
  profilePhoto: string;
  companyLogo: string;
};

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
  county: string;
  state: string;
  assetClass: string;
  propertyType: string;
  strategy: string[];
  message: string;
  summary: string;
  ownerId: string;
  ownerEmail: string;
  createdBy: string;
  createdByEmail: string;
  source: string;
  updatedAt: string;
  imageUrl: string;
  photoUrl: string;
  coverPhoto: string;
  photos: string[];
  raw: Record<string, any>;
};

/* ---------------- STORAGE KEYS ---------------- */

const MEMBER_ROOMS_KEY = "vaultforge_member_rooms_v1";
const MEMBER_COMMAND_DEAL_ROOMS_KEY = "vaultforge_command_deal_rooms_v1";
const MEMBER_COMMAND_PAIN_ROOMS_KEY = "vaultforge_command_pain_rooms_v1";

/* ---------------- STYLES ---------------- */

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at 16% 10%, rgba(245,197,66,.12), transparent 30%), radial-gradient(circle at 88% 8%, rgba(120,0,30,.18), transparent 34%), #0b0f17",
  color: "#ffffff",
  padding: "26px 20px 90px",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const shell: React.CSSProperties = { maxWidth: 1180, margin: "0 auto" };

const nav: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 12,
  marginBottom: 20,
};

const brand: React.CSSProperties = {
  color: "#ffda5e",
  fontWeight: 900,
  fontSize: 28,
};

const btn: React.CSSProperties = {
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,.15)",
  background: "rgba(20,25,35,.9)",
  color: "#fff",
  padding: "10px 16px",
  fontWeight: 700,
  cursor: "pointer",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 22,
  background: "rgba(15,20,30,.75)",
  padding: 22,
  marginBottom: 18,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
  gap: 14,
};

const panel: React.CSSProperties = {
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.12)",
  background: "rgba(18,24,36,.75)",
  padding: 16,
};

const h1: React.CSSProperties = { fontSize: 48, fontWeight: 900 };
const h2: React.CSSProperties = { fontSize: 32, fontWeight: 900 };

const sub: React.CSSProperties = { color: "rgba(255,255,255,.75)" };
const muted: React.CSSProperties = { color: "rgba(255,255,255,.6)", fontSize: 13 };

const img: React.CSSProperties = {
  width: "100%",
  height: 180,
  objectFit: "cover",
  borderRadius: 14,
  marginBottom: 10,
};

/* ---------------- HELPERS ---------------- */

function safeString(v: any, fallback = "") {
  return typeof v === "string" ? v : v ? String(v) : fallback;
}

function safeArray(v: any): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string") return v.split(",").map(s => s.trim());
  return [];
}

/* ---------------- NORMALIZER ---------------- */

function normalizeRoom(row: any): CanonicalMemberRoom | null {
  if (!row) return null;

  const id = safeString(row.id || row.roomId);
  if (!id) return null;

  const image =
    row.imageUrl ||
    row.coverPhoto ||
    row.photoUrl ||
    row.image ||
    row.thumbnail ||
    (Array.isArray(row.images) ? row.images[0] : "") ||
    (Array.isArray(row.photos) ? row.photos[0] : "") ||
    "";

  const kind: RoomKind =
    String(row.kind || row.roomType || "").includes("pain") ? "pain" : "deal";

  return {
    id,
    roomId: id,
    kind,
    roomType: kind,
    workspace: "member-command",
    visibility: "member",

    title: safeString(row.title || "Untitled"),
    status: (row.status || "active") as RoomStatus,
    roomStatus: (row.status || "active") as RoomStatus,

    city: safeString(row.city),
    county: safeString(row.county),
    state: safeString(row.state),

    assetClass: safeString(row.assetClass),
    propertyType: safeString(row.propertyType),
    strategy: safeArray(row.strategy),

    message: safeString(row.message || "No message"),
    summary: safeString(row.summary),

    ownerId: safeString(row.ownerId),
    ownerEmail: safeString(row.ownerEmail),
    createdBy: safeString(row.createdBy),
    createdByEmail: safeString(row.createdByEmail),

    source: safeString(row.source),
    updatedAt: safeString(row.updatedAt || new Date().toISOString()),

    imageUrl: image,
    photoUrl: image,
    coverPhoto: image,
    photos: safeArray(row.photos),

    raw: row,
  };
}

/* ---------------- LOAD ---------------- */

function loadRooms(): CanonicalMemberRoom[] {
  if (typeof window === "undefined") return [];

  const keys = [
    MEMBER_ROOMS_KEY,
    MEMBER_COMMAND_DEAL_ROOMS_KEY,
    MEMBER_COMMAND_PAIN_ROOMS_KEY,
  ];

  const out: CanonicalMemberRoom[] = [];

  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) continue;

      for (const r of parsed) {
        const norm = normalizeRoom(r);
        if (norm) out.push(norm);
      }
    } catch {
      // ignore bad storage
    }
  }

  return out;
}

/* ---------------- PAGE ---------------- */

export default function CommandPage() {
  const [rooms, setRooms] = useState<CanonicalMemberRoom[] | null>(null);
  const [view, setView] = useState<View>("active");

  useEffect(() => {
    setRooms(loadRooms());
  }, []);

  const grouped = useMemo(() => {
    const safeRooms = rooms || [];

    return {
      active: safeRooms.filter(r => r.status === "active"),
      deal: safeRooms.filter(r => r.kind === "deal"),
      pain: safeRooms.filter(r => r.kind === "pain"),
      saved: safeRooms.filter(r => r.status === "saved"),
      archived: safeRooms.filter(r => r.status === "archived"),
      deleted: safeRooms.filter(r => r.status === "deleted"),
    };
  }, [rooms]);

  const visible = grouped[view];

  return (
    <main style={page}>
      <div style={shell}>

        <div style={nav}>
          <div style={brand}>VAULTFORGE</div>
          <button style={btn} onClick={() => setView("deal")}>Deals</button>
          <button style={btn} onClick={() => setView("pain")}>Pain</button>
          <button style={btn} onClick={() => setView("active")}>Active</button>
        </div>

        <section style={card}>
          <h1 style={h1}>Member Command</h1>
        </section>

        <section style={card}>
          <h2 style={h2}>{view.toUpperCase()}</h2>

          {rooms === null ? (
            <p style={sub}>Loading rooms...</p>
          ) : visible.length === 0 ? (
            <p style={sub}>No rooms found in this view.</p>
          ) : (
            <div style={grid}>
              {visible.map(room => (
                <div key={room.id} style={panel}>
                  {room.imageUrl ? (
                    <img src={room.imageUrl} style={img} />
                  ) : null}

                  <div style={{ fontWeight: 800, marginBottom: 6 }}>
                    {room.title}
                  </div>

                  <div style={sub}>{room.message}</div>
                  <div style={muted}>
                    {room.city} {room.state}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
