"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const shell: React.CSSProperties = {
  minHeight: "100vh",
  background: "#020617",
  color: "white",
  padding: "24px",
};

const wrap: React.CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
};

const card: React.CSSProperties = {
  background: "linear-gradient(180deg,#020817,#081224)",
  border: "1px solid rgba(250,204,21,.22)",
  borderRadius: 24,
  padding: 24,
  marginBottom: 24,
};

const button: React.CSSProperties = {
  background: "#facc15",
  color: "#000",
  border: "none",
  borderRadius: 999,
  padding: "12px 18px",
  fontWeight: 800,
  cursor: "pointer",
};

type RoomState = "active" | "saved" | "archived" | "deleted";

type PainRoom = {
  id: string;
  title?: string;
  city?: string;
  county?: string;
  state?: string;
  roomState?: RoomState;
  [key: string]: unknown;
};

function safeParseRooms(raw: string | null): PainRoom[] {
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getPainRooms(): PainRoom[] {
  const keys = [
    "vaultforge_clean_pain_rooms_v1",
    "vaultforge_clean_pain_rooms",
    "vaultforge_pain_rooms",
    "vaultforge_rooms_pain",
    "vf_pain_rooms",
    "vaultforge-pain-rooms",
  ];

  const map = new Map<string, PainRoom>();

  for (const key of keys) {
    const rows = safeParseRooms(window.localStorage.getItem(key));
    rows.forEach((room) => {
      const id = String(room.id || room.roomId || room.painId || "");
      if (id && !map.has(id)) map.set(id, { ...room, id });
    });
  }

  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i) || "";
    if (!key.startsWith("vaultforge_clean_pain_room_") && !key.startsWith("vaultforge_pain_room_")) {
      continue;
    }

    try {
      const room = JSON.parse(window.localStorage.getItem(key) || "null") as PainRoom | null;
      const id = String(room?.id || room?.roomId || room?.painId || "");
      if (room && id && !map.has(id)) map.set(id, { ...room, id });
    } catch {
      // ignore bad local rows
    }
  }

  return Array.from(map.values());
}

function writePainRoomState(roomId: string, next: RoomState) {
  const keys = [
    "vaultforge_clean_pain_rooms_v1",
    "vaultforge_clean_pain_rooms",
    "vaultforge_pain_rooms",
    "vaultforge_rooms_pain",
    "vf_pain_rooms",
    "vaultforge-pain-rooms",
  ];

  for (const key of keys) {
    const rows = safeParseRooms(window.localStorage.getItem(key));
    const updated = rows.map((room) => {
      const id = String(room.id || room.roomId || room.painId || "");
      if (id !== roomId) return room;
      return { ...room, id: roomId, roomState: next, cleanupState: next, stateStatus: next };
    });

    if (rows.length) {
      window.localStorage.setItem(key, JSON.stringify(updated));
    }
  }

  const directKeys = [
    `vaultforge_clean_pain_room_${roomId}`,
    `vaultforge_pain_room_${roomId}`,
    `vf_pain_room_${roomId}`,
  ];

  directKeys.forEach((key) => {
    try {
      const current = JSON.parse(window.localStorage.getItem(key) || "null") as PainRoom | null;
      if (current) {
        window.localStorage.setItem(
          key,
          JSON.stringify({ ...current, id: roomId, roomState: next, cleanupState: next, stateStatus: next })
        );
      }
    } catch {
      // ignore bad local rows
    }
  });

  const stateKeys = [
    "vaultforge_clean_room_states",
    "vaultforge_room_states",
    "vaultforge_pain_room_states",
    "vaultforge_5s_room_states",
  ];

  stateKeys.forEach((key) => {
    try {
      const current = JSON.parse(window.localStorage.getItem(key) || "{}");
      current[roomId] = next;
      current[`pain:${roomId}`] = next;
      window.localStorage.setItem(key, JSON.stringify(current));
    } catch {
      window.localStorage.setItem(key, JSON.stringify({ [roomId]: next, [`pain:${roomId}`]: next }));
    }
  });

  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(new Event("vaultforge-room-state-change"));
  window.dispatchEvent(new Event("vaultforge-pain-change"));
}

function folderPath(next: RoomState) {
  if (next === "saved") return "/saved-rooms";
  if (next === "archived") return "/archived-rooms";
  if (next === "deleted") return "/deleted-rooms";
  return "/pain-rooms";
}

export default function PainRoomPage({
  params,
}: {
  params: { id: string };
}) {
  const [room, setRoom] = useState<PainRoom | null>(null);
  const [roomState, setRoomState] = useState<RoomState>("active");

  useEffect(() => {
    const found = getPainRooms().find((item) => item.id === params.id) || null;
    setRoom(found);
    setRoomState((found?.roomState as RoomState) || "active");
  }, [params.id]);

  function updateRoomState(next: RoomState) {
    writePainRoomState(params.id, next);
    setRoomState(next);
    window.location.href = folderPath(next);
  }

  const summary = useMemo(() => {
    if (!room) return "";
    return `${room.title || "Pain Room"} in ${room.city || "Unknown"}, ${room.county || ""}, ${room.state || ""}.`;
  }, [room]);

  if (!room) {
    return (
      <div style={shell}>
        <div style={wrap}>
          <div style={card}>
            <h1>Pain room not found.</h1>
            <Link href="/pain-rooms" style={{ ...button, textDecoration: "none", display: "inline-flex" }}>
              Back to Pain Rooms
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={shell}>
      <div style={wrap}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
          <Link href="/command" style={{ ...button, textDecoration: "none", display: "inline-flex" }}>
            Command
          </Link>
          <Link href="/pain-rooms" style={{ ...button, textDecoration: "none", display: "inline-flex" }}>
            Pain Rooms
          </Link>
          <Link href="/messages" style={{ ...button, textDecoration: "none", display: "inline-flex" }}>
            Messages
          </Link>
          <Link
            href="/logout"
            style={{
              ...button,
              background: "#7f1d1d",
              color: "white",
              textDecoration: "none",
              display: "inline-flex",
            }}
          >
            Logout
          </Link>
        </div>

        <div style={card}>
          <div style={{ color: "#facc15", letterSpacing: 6, fontWeight: 800, marginBottom: 12 }}>
            PAIN ROOM
          </div>

          <h1 style={{ fontSize: 56, lineHeight: 1, marginBottom: 16 }}>
            {room.title || "Untitled Pain Room"}
          </h1>

          <div style={{ fontSize: 28, color: "#d1d5db" }}>
            {room.city || "Unknown"} • {room.county || "Unknown"} • {room.state || "Unknown"}
          </div>
        </div>

        <div style={card}>
          <div style={{ color: "#facc15", letterSpacing: 6, fontWeight: 800, marginBottom: 18 }}>
            5S CONTROLS
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button style={button} onClick={() => updateRoomState("saved")}>
              Save
            </button>

            <button style={button} onClick={() => updateRoomState("archived")}>
              Archive
            </button>

            <button
              style={{ ...button, background: "#7f1d1d", color: "white" }}
              onClick={() => updateRoomState("deleted")}
            >
              Delete
            </button>

            <div
              style={{
                padding: "12px 18px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,.15)",
              }}
            >
              Current: {roomState}
            </div>
          </div>
        </div>

        <div style={card}>
          <div style={{ color: "#facc15", letterSpacing: 6, fontWeight: 800, marginBottom: 18 }}>
            PAIN SUMMARY
          </div>

          <div style={{ fontSize: 24, lineHeight: 1.5, color: "#d1d5db" }}>
            {summary}
          </div>
        </div>

        <div style={card}>
          <div style={{ color: "#facc15", letterSpacing: 6, fontWeight: 800, marginBottom: 18 }}>
            OWNER MESSAGE
          </div>

          <h2 style={{ fontSize: 42, marginBottom: 16 }}>
            Contact owner with this pain room attached.
          </h2>

          <div style={{ fontSize: 24, lineHeight: 1.5, color: "#d1d5db", marginBottom: 24 }}>
            Message subject stays locked to this room.
          </div>

          <Link
            href={`/messages?type=pain&room=${encodeURIComponent(room.id)}&subject=${encodeURIComponent(
              `Pain Room: ${room.title || "Untitled Pain Room"}`
            )}`}
            style={{ ...button, textDecoration: "none", display: "inline-flex" }}
          >
            Message Owner
          </Link>
        </div>
      </div>
    </div>
  );
}
