"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import VaultForgeRoomControls, { listLocalRoomStates } from "./VaultForgeRoomControls";

type FolderState = "saved" | "archived" | "deleted";

type RoomState = {
  id: string;
  title: string;
  type: string;
  state: FolderState;
  updatedAt: string;
};

export default function VaultForgeRoomFolderClient({
  folder,
}: {
  folder: FolderState;
}) {
  const [rooms, setRooms] = useState<RoomState[]>([]);

  function refresh() {
    setRooms(listLocalRoomStates(folder) as RoomState[]);
  }

  useEffect(() => {
    refresh();
    window.addEventListener("vaultforge-room-state-change", refresh);
    return () => window.removeEventListener("vaultforge-room-state-change", refresh);
  }, [folder]);

  const title = folder === "saved" ? "Saved Rooms" : folder === "archived" ? "Archived Rooms" : "Deleted Rooms";

  return (
    <section className="vf-card">
      <div className="vf-eyebrow">{title}</div>

      {!rooms.length ? (
        <p className="vf-copy">
          No rooms in this folder yet. Use Save, Archive, or Delete controls on Deal Rooms, Pain Rooms, or Messages.
        </p>
      ) : null}

      <div style={{ display: "grid", gap: 12 }}>
        {rooms.map((room) => (
          <article
            key={room.id}
            style={{
              border: "1px solid rgba(148,163,184,.18)",
              background: "rgba(255,255,255,.045)",
              borderRadius: 20,
              padding: 16,
            }}
          >
            <div className="vf-eyebrow">{room.type} · {room.state}</div>
            <h2 className="vf-h2">{room.title}</h2>
            <p className="vf-copy">Updated: {new Date(room.updatedAt).toLocaleString()}</p>

            <div className="vf-btns">
              <Link className="vf-btn dark" href={room.type === "pain" ? "/pain-rooms" : "/deal-rooms"}>
                Open Lane
              </Link>
            </div>

            <VaultForgeRoomControls
              roomId={room.id}
              roomTitle={room.title}
              roomType={room.type === "pain" ? "pain" : room.type === "deal" ? "deal" : "general"}
              context={folder}
            />
          </article>
        ))}
      </div>
    </section>
  );
}