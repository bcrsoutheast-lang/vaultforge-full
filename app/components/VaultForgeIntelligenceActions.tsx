"use client";

import { useState } from "react";

type Props = {
  roomId: string;
  roomType?: string;
  sourceRoute?: string;
  compact?: boolean;
};

const buttonBase: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.34)",
  background: "rgba(255,255,255,.045)",
  color: "#f8edd0",
  borderRadius: 999,
  padding: "9px 12px",
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: ".08em",
  textTransform: "uppercase",
  cursor: "pointer",
};

async function postRoomAction(payload: Record<string, any>) {
  const res = await fetch("/api/room/actions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok || data?.ok === false) {
    throw new Error(data?.error || data?.message || "Room action failed.");
  }

  return data;
}

export default function VaultForgeIntelligenceActions({
  roomId,
  roomType = "intelligence",
  sourceRoute = "/intelligence",
  compact = false,
}: Props) {
  const [busy, setBusy] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  async function run(status: "saved" | "archived" | "deleted" | "active") {
    setBusy(status);
    setMessage("");

    try {
      await postRoomAction({
        room_id: roomId,
        room_type: roomType,
        status,
        source_route: sourceRoute,
      });

      setMessage(
        status === "saved"
          ? "Saved to intelligence watchlist."
          : status === "archived"
          ? "Archived from active intelligence."
          : status === "deleted"
          ? "Hidden from command view."
          : "Restored to active intelligence."
      );

      window.dispatchEvent(new CustomEvent("vaultforge-room-state-change"));
    } catch (err: any) {
      setMessage(err?.message || "Could not update room state.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button style={buttonBase} disabled={!!busy} onClick={() => run("saved")}>
          {busy === "saved" ? "Saving…" : "Save"}
        </button>
        <button style={buttonBase} disabled={!!busy} onClick={() => run("archived")}>
          {busy === "archived" ? "Archiving…" : "Archive"}
        </button>
        <button
          style={{ ...buttonBase, borderColor: "rgba(255,98,98,.45)", color: "#ffd3d3" }}
          disabled={!!busy}
          onClick={() => run("deleted")}
        >
          {busy === "deleted" ? "Hiding…" : "Hide"}
        </button>
        {!compact && (
          <button style={buttonBase} disabled={!!busy} onClick={() => run("active")}>
            {busy === "active" ? "Restoring…" : "Restore"}
          </button>
        )}
      </div>
      {message ? <div style={{ color: "#cdbb8a", fontSize: 12, fontWeight: 800 }}>{message}</div> : null}
    </div>
  );
}
