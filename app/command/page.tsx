"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type View = "active" | "deal" | "pain" | "messages" | "saved" | "archived" | "deleted";
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

type CanonicalMessage = {
  id: string;
  lane?: string;
  from: string;
  recipient: string;
  title: string;
  room: string;
  message: string;
  folder: "active" | "saved" | "archived" | "deleted" | "unread";
  unread: boolean;
  createdAt: string;
  senderWorkspace?: string;
  recipientWorkspace?: string;
  origin?: string;
  senderProfile?: Partial<ProfileSnapshot>;
  recipientProfile?: Partial<ProfileSnapshot>;
  roomSnapshot?: Record<string, any>;
};

const MEMBER_ROOMS_KEY = "vaultforge_member_rooms_v1";
const MEMBER_COMMAND_DEAL_ROOMS_KEY = "vaultforge_command_deal_rooms_v1";
const MEMBER_COMMAND_PAIN_ROOMS_KEY = "vaultforge_command_pain_rooms_v1";
const MEMBER_STATUS_KEY = "vf_member_command_room_status_v1";
const MEMBER_DELETED_FOREVER_KEY = "vf_member_command_deleted_forever_v1";

const THREADS_KEY = "vf_message_center_threads_v1";
const MESSAGE_DELETED_FOREVER_KEY = "vf_message_center_deleted_forever_v1";

const PROFILE_KEYS = ["vaultforge_profile", "vaultforge_member_profile", "vaultforge_clean_profile"];
const PROFILE_PHOTO_BACKUP_KEY = "vaultforge_member_profile_photo_v1";
const COMPANY_LOGO_BACKUP_KEY = "vaultforge_member_company_logo_v1";

/* ---------------- UI ---------------- */

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at 16% 10%, rgba(245,197,66,.12), transparent 30%), radial-gradient(circle at 88% 8%, rgba(120,0,30,.18), transparent 34%), #05070b",
  color: "#f7f8ff",
  padding: "26px 20px 90px",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const shell: React.CSSProperties = { maxWidth: 1180, margin: "0 auto" };
const nav: React.CSSProperties = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginBottom: 20 };
const brand: React.CSSProperties = { color: "#ffda5e", fontWeight: 1000, fontSize: 28, letterSpacing: "-.04em", marginRight: 10 };
const btn: React.CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 999, border: "1px solid rgba(207,216,230,.18)", background: "rgba(18,24,38,.92)", color: "#f7f8ff", padding: "12px 18px", fontWeight: 900, textDecoration: "none", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, background: "linear-gradient(135deg,#ffe16a,#f4bf37)", color: "#080a10" };
const redBtn: React.CSSProperties = { ...btn, background: "rgba(90,10,18,.72)", color: "#ffb2b2" };

const card: React.CSSProperties = { border: "1px solid rgba(207,216,230,.16)", borderRadius: 26, background: "rgba(15,21,34,.88)", padding: 24, marginBottom: 20 };
const panel: React.CSSProperties = { border: "1px solid rgba(207,216,230,.15)", borderRadius: 22, background: "rgba(17,23,36,.78)", padding: 20 };
const roomGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(285px,1fr))", gap: 14 };
const row: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" };
const h1: React.CSSProperties = { fontSize: "clamp(42px,7vw,82px)", fontWeight: 1000, letterSpacing: "-.08em" };
const h2: React.CSSProperties = { fontSize: "clamp(30px,4.5vw,54px)", fontWeight: 1000 };
const h3: React.CSSProperties = { fontSize: 30, fontWeight: 1000 };
const sub: React.CSSProperties = { color: "rgba(235,240,255,.78)", fontSize: 20 };
const muted: React.CSSProperties = { color: "rgba(235,240,255,.68)", fontSize: 15 };

const imageStyle: React.CSSProperties = {
  width: "100%",
  height: 190,
  objectFit: "cover",
  borderRadius: 18,
  marginBottom: 12,
};

/* ---------------- helpers ---------------- */

function clean(value: any, fallback = "") {
  return String(value || "").trim() || fallback;
}

function list(value: any): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") return value.split(",").map(s => s.trim());
  return [];
}

/* ---------------- NORMALIZER (FIXED IMAGES) ---------------- */

function normalizeMemberRoom(row: any): CanonicalMemberRoom | null {
  if (!row?.id && !row?.roomId) return null;

  const id = clean(row.id || row.roomId);

  const image =
    row.imageUrl ||
    row.coverPhoto ||
    row.photoUrl ||
    row.image ||
    row.thumbnail ||
    row.heroImage ||
    row.propertyPhoto ||
    row.propertyImage ||
    row.images?.[0] ||
    row.photos?.[0] ||
    row.photoUrls?.[0] ||
    "";

  return {
    id,
    roomId: id,
    kind: (String(row.kind || row.roomType || "").includes("pain") ? "pain" : "deal"),
    roomType: (String(row.kind || row.roomType || "").includes("pain") ? "pain" : "deal"),
    workspace: "member-command",
    visibility: "member",
    title: clean(row.title || row.dealTitle || row.painTitle, "Untitled"),
    status: (row.status || "active"),
    roomStatus: (row.status || "active"),

    city: clean(row.city),
    county: clean(row.county),
    state: clean(row.state),

    assetClass: clean(row.assetClass),
    propertyType: clean(row.propertyType),
    strategy: list(row.strategy),

    message: clean(row.message || row.summary, "No message"),
    summary: clean(row.summary || row.message),

    ownerId: clean(row.ownerId),
    ownerEmail: clean(row.ownerEmail),

    createdBy: clean(row.createdBy),
    createdByEmail: clean(row.createdByEmail),

    source: clean(row.source),

    updatedAt: clean(row.updatedAt || new Date().toISOString()),

    imageUrl: image,
    photoUrl: image,
    coverPhoto: image,
    photos: list(row.photos || row.photoUrls || row.images),

    raw: row,
  };
}

/* ---------------- LOAD ---------------- */

function loadMemberRooms(): CanonicalMemberRoom[] {
  if (typeof window === "undefined") return [];

  const keys = [
    MEMBER_ROOMS_KEY,
    MEMBER_COMMAND_DEAL_ROOMS_KEY,
    MEMBER_COMMAND_PAIN_ROOMS_KEY,
  ];

  const all: CanonicalMemberRoom[] = [];

  keys.forEach(key => {
    const raw = localStorage.getItem(key);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach(r => {
          const norm = normalizeMemberRoom(r);
          if (norm) all.push(norm);
        });
      }
    } catch {}
  });

  return all;
}

/* ---------------- PAGE ---------------- */

export default function CommandPage() {
  const [rooms, setRooms] = useState<CanonicalMemberRoom[]>([]);
  const [view, setView] = useState<View>("active");

  useEffect(() => {
    setRooms(loadMemberRooms());
  }, []);

  const grouped = useMemo(() => ({
    active: rooms.filter(r => r.status === "active"),
    deal: rooms.filter(r => r.kind === "deal"),
    pain: rooms.filter(r => r.kind === "pain"),
    saved: rooms.filter(r => r.status === "saved"),
    archived: rooms.filter(r => r.status === "archived"),
    deleted: rooms.filter(r => r.status === "deleted"),
  }), [rooms]);

  const visible = grouped[view as keyof typeof grouped] || [];

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

          <div style={roomGrid}>
            {visible.map(room => (
              <div key={room.id} style={panel}>
                {room.imageUrl ? (
                  <img src={room.imageUrl} style={imageStyle} />
                ) : null}

                <h3 style={h3}>{room.title}</h3>
                <p style={sub}>{room.message}</p>
                <p style={muted}>{room.city} {room.state}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
