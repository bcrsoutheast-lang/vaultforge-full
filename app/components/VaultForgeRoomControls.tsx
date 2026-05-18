"use client";

import { useMemo, useState } from "react";

type Props = {
  roomId: string;
  roomTitle: string;
  roomType?: "deal" | "pain" | "general";
  context?: "active" | "saved" | "archived" | "deleted";
};

type RoomState = {
  id: string;
  title: string;
  type: string;
  state: "saved" | "archived" | "deleted";
  updatedAt: string;
};

const STORAGE_KEY = "vaultforge_clean_room_states_v1";

function readStates(): RoomState[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStates(states: RoomState[]) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
  window.dispatchEvent(new CustomEvent("vaultforge-room-state-change"));
}

function upsertState(room: RoomState) {
  const states = readStates().filter((item) => item.id !== room.id);
  states.unshift(room);
  writeStates(states);
}

function removeState(roomId: string) {
  const states = readStates().filter((item) => item.id !== roomId);
  writeStates(states);
}

export function listLocalRoomStates(state?: "saved" | "archived" | "deleted") {
  const states = readStates();
  return state ? states.filter((item) => item.state === state) : states;
}

export default function VaultForgeRoomControls({
  roomId,
  roomTitle,
  roomType = "general",
  context = "active",
}: Props) {
  const [message, setMessage] = useState("");

  const safeRoom = useMemo(() => {
    const id = roomId || `${roomType}:${roomTitle || "room"}`;
    return {
      id,
      title: roomTitle || "Untitled Room",
      type: roomType,
      updatedAt: new Date().toISOString(),
    };
  }, [roomId, roomTitle, roomType]);

  function saveRoom() {
    upsertState({ ...safeRoom, state: "saved" });
    setMessage("Saved.");
  }

  function archiveRoom() {
    upsertState({ ...safeRoom, state: "archived" });
    setMessage("Archived.");
  }

  function deleteRoom() {
    upsertState({ ...safeRoom, state: "deleted" });
    setMessage("Moved to Deleted.");
  }

  function restoreRoom() {
    removeState(safeRoom.id);
    setMessage("Restored to active.");
  }

  function permanentDelete() {
    removeState(safeRoom.id);
    setMessage("Deleted from local cleanup folder.");
  }

  return (
    <section className="vf-room-controls">
      <style>{`
        .vf-room-controls {
          border: 1px solid rgba(245, 200, 76, .20);
          background: rgba(2, 6, 23, .42);
          border-radius: 20px;
          padding: 14px;
          margin-top: 16px;
        }

        .vf-room-controls-title {
          color: #f5c84c;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: .16em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .vf-room-controls-row {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
        }

        .vf-room-controls button {
          border-radius: 999px;
          padding: 10px 12px;
          font-weight: 950;
          font-size: 13px;
          cursor: pointer;
          color: #111827;
          border: 0;
          background: linear-gradient(135deg, #fde68a, #e8c46b);
        }

        .vf-room-controls button.dark {
          color: #fff;
          background: rgba(255, 255, 255, .06);
          border: 1px solid rgba(255, 255, 255, .15);
        }

        .vf-room-controls button.danger {
          color: #fecaca;
          background: rgba(127, 29, 29, .22);
          border: 1px solid rgba(239, 68, 68, .34);
        }

        .vf-room-controls-note {
          color: #cbd5e1;
          font-size: 13px;
          line-height: 1.4;
          margin-top: 10px;
        }
      `}</style>

      <div className="vf-room-controls-title">5S Cleanup Controls</div>

      <div className="vf-room-controls-row">
        {context !== "saved" ? <button type="button" onClick={saveRoom}>Save</button> : null}
        {context !== "archived" ? <button type="button" className="dark" onClick={archiveRoom}>Archive</button> : null}
        {context !== "deleted" ? <button type="button" className="danger" onClick={deleteRoom}>Delete</button> : null}

        {context === "archived" ? (
          <button type="button" className="danger" onClick={deleteRoom}>
            Delete from Archive
          </button>
        ) : null}

        {context === "deleted" ? (
          <>
            <button type="button" className="dark" onClick={restoreRoom}>Restore</button>
            <button type="button" className="danger" onClick={permanentDelete}>
              Delete from Deleted
            </button>
          </>
        ) : null}
      </div>

      {message ? <div className="vf-room-controls-note">{message}</div> : null}
    </section>
  );
}