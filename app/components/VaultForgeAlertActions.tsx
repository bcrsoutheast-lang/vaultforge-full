"use client";

import { useMemo, useState } from "react";

type RoomStatus = "active" | "saved" | "archived" | "deleted";

type Props = {
  roomId: string;
  roomType?: string;
  sourceRoute?: string;
  initialStatus?: RoomStatus;
  userEmail?: string;
  compact?: boolean;
};

const buttonBase: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.32)",
  background: "rgba(255,255,255,.045)",
  color: "#f8f0d0",
  borderRadius: 999,
  padding: "9px 12px",
  fontSize: 12,
  fontWeight: 850,
  letterSpacing: ".04em",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const destructiveButton: React.CSSProperties = {
  ...buttonBase,
  border: "1px solid rgba(255,92,92,.42)",
  color: "#ffd1d1",
  background: "rgba(255,45,45,.08)",
};

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function browserEmail(fallback?: string) {
  if (typeof window === "undefined") return cleanEmail(fallback || "");

  const fromStorage =
    window.localStorage.getItem("vf_email") ||
    window.localStorage.getItem("vaultforge_email") ||
    window.localStorage.getItem("email") ||
    "";

  return cleanEmail(fromStorage || fallback || "guest@vaultforge.local");
}

async function postRoomAction(payload: Record<string, any>) {
  const res = await fetch("/api/room/actions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let json: any = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  if (!res.ok || json?.ok === false) {
    throw new Error(json?.error || json?.message || `Room action failed with ${res.status}`);
  }

  return json;
}

export default function VaultForgeAlertActions({
  roomId,
  roomType = "alert",
  sourceRoute = "/alerts",
  initialStatus = "active",
  userEmail,
  compact = false,
}: Props) {
  const [status, setStatus] = useState<RoomStatus>(initialStatus || "active");
  const [busy, setBusy] = useState<string>("");
  const [notice, setNotice] = useState<string>("");
  const [error, setError] = useState<string>("");

  const email = useMemo(() => browserEmail(userEmail), [userEmail]);
  const safeRoomId = clean(roomId);

  async function run(nextStatus: RoomStatus, label: string) {
    if (!safeRoomId) {
      setError("Missing alert room id.");
      return;
    }

    setBusy(label);
    setNotice("");
    setError("");

    try {
      await postRoomAction({
        user_email: email || "guest@vaultforge.local",
        room_id: safeRoomId,
        room_type: roomType,
        status: nextStatus,
        source_route: sourceRoute,
      });

      setStatus(nextStatus);
      setNotice(
        nextStatus === "saved"
          ? "Saved to alert watchlist."
          : nextStatus === "archived"
          ? "Archived from active alerts."
          : nextStatus === "deleted"
          ? "Hidden from active command view."
          : "Restored to active alerts."
      );

      if (nextStatus !== "active") {
        window.setTimeout(() => {
          if (typeof window !== "undefined") window.location.reload();
        }, 450);
      }
    } catch (err: any) {
      setError(err?.message || "Alert action failed.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div style={{ display: "grid", gap: compact ? 6 : 8 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {status !== "saved" && (
          <button style={buttonBase} disabled={!!busy} onClick={() => run("saved", "save")}>
            {busy === "save" ? "Saving..." : "Save"}
          </button>
        )}

        {status !== "archived" && (
          <button style={buttonBase} disabled={!!busy} onClick={() => run("archived", "archive")}>
            {busy === "archive" ? "Archiving..." : "Archive"}
          </button>
        )}

        {status !== "deleted" && (
          <button style={destructiveButton} disabled={!!busy} onClick={() => run("deleted", "hide")}>
            {busy === "hide" ? "Hiding..." : "Hide"}
          </button>
        )}

        {status !== "active" && (
          <button style={buttonBase} disabled={!!busy} onClick={() => run("active", "restore")}>
            {busy === "restore" ? "Restoring..." : "Restore"}
          </button>
        )}
      </div>

      {(notice || error) && (
        <div
          style={{
            fontSize: 12,
            color: error ? "#ffb4b4" : "#9ff0c8",
            fontWeight: 750,
          }}
        >
          {error || notice}
        </div>
      )}
    </div>
  );
}
