"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type RoomStatus = "active" | "saved" | "archived" | "deleted";

type Props = {
  roomId: string;
  roomType?: string;
  sourceRoute?: string;
  initialStatus?: RoomStatus | string;
  compact?: boolean;
};

const buttonBase: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.32)",
  background: "rgba(10,16,28,.88)",
  color: "#f8f1df",
  borderRadius: 999,
  padding: "9px 12px",
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: ".08em",
  textTransform: "uppercase",
  cursor: "pointer",
  boxShadow: "0 14px 30px rgba(0,0,0,.22)",
};

function clean(value: unknown) {
  return String(value || "").trim();
}

function getEmail() {
  if (typeof window === "undefined") return "guest@vaultforge.local";
  const keys = ["vf_email", "email", "vaultforge_email", "member_email"];
  for (const key of keys) {
    const value = clean(window.localStorage.getItem(key));
    if (value.includes("@")) return value.toLowerCase();
  }
  const cookieMatch = document.cookie.match(/(?:^|; )vf_email=([^;]+)/);
  if (cookieMatch?.[1]) return decodeURIComponent(cookieMatch[1]).toLowerCase();
  return "guest@vaultforge.local";
}

export default function VaultForgeRoutingActions({
  roomId,
  roomType = "routing",
  sourceRoute,
  initialStatus = "active",
  compact = false,
}: Props) {
  const router = useRouter();
  const normalizedRoomId = clean(roomId);
  const [status, setStatus] = useState<RoomStatus>(
    ["active", "saved", "archived", "deleted"].includes(clean(initialStatus))
      ? (clean(initialStatus) as RoomStatus)
      : "active"
  );
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");

  const route = useMemo(() => sourceRoute || `/routing-room/${encodeURIComponent(normalizedRoomId)}`, [sourceRoute, normalizedRoomId]);

  async function setRoomStatus(nextStatus: RoomStatus) {
    if (!normalizedRoomId || busy) return;
    setBusy(nextStatus);
    setNotice("");

    const previous = status;
    setStatus(nextStatus);

    try {
      const response = await fetch("/api/room/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_email: getEmail(),
          room_id: normalizedRoomId,
          room_type: roomType,
          status: nextStatus,
          source_route: route,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.error || payload?.message || "Room action failed.");
      }

      setNotice(
        nextStatus === "saved"
          ? "Saved to routing command."
          : nextStatus === "archived"
          ? "Archived from active routing."
          : nextStatus === "deleted"
          ? "Hidden from active routing."
          : "Restored to active routing."
      );
      router.refresh();
    } catch (error: any) {
      setStatus(previous);
      setNotice(error?.message || "Could not update routing room.");
    } finally {
      setBusy("");
    }
  }

  const isHidden = status === "deleted";
  const isSaved = status === "saved";
  const isArchived = status === "archived";

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: compact ? 6 : 8,
          alignItems: "center",
        }}
      >
        {isHidden || isArchived ? (
          <button
            style={{ ...buttonBase, borderColor: "rgba(63,220,151,.55)" }}
            disabled={!!busy}
            onClick={() => setRoomStatus("active")}
          >
            {busy === "active" ? "Restoring..." : "Restore"}
          </button>
        ) : (
          <>
            <button
              style={{ ...buttonBase, borderColor: isSaved ? "rgba(63,220,151,.55)" : "rgba(232,196,107,.36)" }}
              disabled={!!busy}
              onClick={() => setRoomStatus(isSaved ? "active" : "saved")}
            >
              {busy === "saved" ? "Saving..." : isSaved ? "Saved" : "Save"}
            </button>

            <button
              style={{ ...buttonBase, borderColor: "rgba(121,173,255,.38)" }}
              disabled={!!busy}
              onClick={() => setRoomStatus("archived")}
            >
              {busy === "archived" ? "Archiving..." : "Archive"}
            </button>

            <button
              style={{ ...buttonBase, borderColor: "rgba(255,92,92,.44)" }}
              disabled={!!busy}
              onClick={() => setRoomStatus("deleted")}
            >
              {busy === "deleted" ? "Hiding..." : "Hide"}
            </button>
          </>
        )}
      </div>

      {notice ? (
        <div style={{ color: notice.includes("Could not") ? "#ffb4a8" : "#c8f7dc", fontSize: 12, fontWeight: 800 }}>
          {notice}
        </div>
      ) : null}
    </div>
  );
}
