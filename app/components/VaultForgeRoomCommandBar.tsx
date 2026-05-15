"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Lane = "opportunity" | "pressure" | "signal";

function clean(value: unknown) {
  return String(value || "").trim();
}

function readSet(key: string) {
  if (typeof window === "undefined") return new Set<string>();

  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.map(clean).filter(Boolean) : []);
  } catch {
    return new Set<string>();
  }
}

function writeSet(key: string, value: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(Array.from(value)));
}

function readStageMap(lane: Lane) {
  if (typeof window === "undefined") return {} as Record<string, string>;

  try {
    const raw = window.localStorage.getItem(`vf_room_detail_stage_${lane}`);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeStageMap(lane: Lane, value: Record<string, string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`vf_room_detail_stage_${lane}`, JSON.stringify(value));
}

function laneLabel(lane: Lane) {
  if (lane === "opportunity") return "Opportunity Room";
  if (lane === "pressure") return "Pressure Room";
  return "Signal Room";
}

function laneHome(lane: Lane) {
  if (lane === "opportunity") return "/opportunity-rooms";
  if (lane === "pressure") return "/pressure-rooms";
  return "/workstations";
}

function folderUrlForStage(lane: Lane, stage: string) {
  const lower = stage.toLowerCase();

  if (lane === "opportunity") {
    if (lower.includes("hot")) return "/opportunity-rooms/hot";
    if (lower.includes("underwrite")) return "/opportunity-rooms/underwrite";
    if (lower.includes("buyer")) return "/opportunity-rooms/needs-buyer";
    if (lower.includes("capital") || lower.includes("fund")) return "/opportunity-rooms/needs-capital";
    if (lower.includes("operator")) return "/opportunity-rooms/needs-operator";
    if (lower.includes("routed") || lower.includes("assigned")) return "/opportunity-rooms/routed";
    if (lower.includes("archived")) return "/opportunity-rooms/archived";
    if (lower.includes("dead")) return "/opportunity-rooms/deleted";
    if (lower.includes("closed") || lower.includes("funded")) return "/opportunity-rooms/routed";
    return "/opportunity-rooms/active";
  }

  if (lane === "pressure") {
    if (lower.includes("critical")) return "/pressure-rooms/urgent";
    if (lower.includes("funding") || lower.includes("capital")) return "/pressure-rooms/funding-gap";
    if (lower.includes("buyer")) return "/pressure-rooms/needs-buyer";
    if (lower.includes("operator") || lower.includes("contractor")) return "/pressure-rooms/needs-operator";
    if (lower.includes("routed") || lower.includes("escalated")) return "/pressure-rooms/routed";
    if (lower.includes("solved")) return "/pressure-rooms/solved";
    if (lower.includes("archived")) return "/pressure-rooms/archived";
    if (lower.includes("legal") || lower.includes("title") || lower.includes("city") || lower.includes("permit") || lower.includes("distressed")) return "/pressure-rooms/urgent";
    return "/pressure-rooms/active";
  }

  return "/workstations";
}

function goToFolderForStage(lane: Lane, stage: string) {
  if (typeof window === "undefined") return;
  window.location.href = folderUrlForStage(lane, stage);
}

function stageOptions(lane: Lane) {
  if (lane === "opportunity") {
    return [
      "Active Opportunity",
      "Underwrite",
      "Hot",
      "Needs Buyer",
      "Needs Capital",
      "Needs Operator",
      "Routed",
      "Assigned",
      "Funded",
      "Closed",
      "Dead",
      "Archived",
    ];
  }

  if (lane === "pressure") {
    return [
      "Active Pressure",
      "Critical",
      "Funding Gap",
      "Legal / Title",
      "Contractor Failure",
      "Distressed Seller",
      "City / Permit",
      "Needs Buyer",
      "Needs Operator",
      "Escalated",
      "Solved",
      "Archived",
    ];
  }

  return ["Active", "Routed", "Assigned", "Escalated", "Archived"];
}

function toneForStage(stage: string) {
  const lower = stage.toLowerCase();

  if (lower.includes("critical") || lower.includes("dead") || lower.includes("legal") || lower.includes("failure")) {
    return { color: "#fecaca", border: "rgba(248,113,113,.42)", bg: "rgba(248,113,113,.09)" };
  }

  if (lower.includes("hot") || lower.includes("funded") || lower.includes("closed") || lower.includes("solved")) {
    return { color: "#9df3bf", border: "rgba(157,243,191,.36)", bg: "rgba(157,243,191,.08)" };
  }

  if (lower.includes("capital") || lower.includes("buyer") || lower.includes("operator") || lower.includes("underwrite")) {
    return { color: "#f8e7b0", border: "rgba(232,196,107,.36)", bg: "rgba(232,196,107,.08)" };
  }

  if (lower.includes("assigned") || lower.includes("routed") || lower.includes("escalated")) {
    return { color: "#56d8ff", border: "rgba(86,216,255,.34)", bg: "rgba(86,216,255,.08)" };
  }

  return { color: "#cbd5e1", border: "rgba(203,213,225,.24)", bg: "rgba(203,213,225,.06)" };
}

const shell: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.28)",
  borderRadius: 26,
  padding: 14,
  background:
    "linear-gradient(145deg,rgba(2,6,23,.94),rgba(7,19,38,.88)), radial-gradient(circle at top left,rgba(232,196,107,.12),transparent 34%)",
  boxShadow: "0 24px 90px rgba(0,0,0,.42)",
  backdropFilter: "blur(16px)",
  marginBottom: 16,
};

const button: React.CSSProperties = {
  minHeight: 42,
  borderRadius: 999,
  padding: "9px 13px",
  border: "1px solid rgba(255,255,255,.15)",
  background: "rgba(255,255,255,.06)",
  color: "white",
  fontWeight: 900,
  textDecoration: "none",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 13,
};

const gold: React.CSSProperties = {
  ...button,
  color: "#06100a",
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  border: "1px solid rgba(232,196,107,.72)",
};

const danger: React.CSSProperties = {
  ...button,
  color: "#fecaca",
  background: "rgba(248,113,113,.09)",
  border: "1px solid rgba(248,113,113,.34)",
};

export default function VaultForgeRoomCommandBar({
  lane,
  roomId,
  title,
  ownerEmail,
}: {
  lane: Lane;
  roomId: string;
  title: string;
  ownerEmail?: string;
}) {
  const cleanId = clean(roomId) || "unknown-room";
  const roomTitle = clean(title) || laneLabel(lane);
  const saveKey = "vf_room_detail_saved_ids";
  const archiveKey = "vf_room_detail_archived_ids";
  const deleteKey = "vf_room_detail_deleted_ids";

  const [saved, setSaved] = useState(false);
  const [archived, setArchived] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [stage, setStage] = useState(stageOptions(lane)[0]);

  useEffect(() => {
    setSaved(readSet(saveKey).has(cleanId));
    setArchived(readSet(archiveKey).has(cleanId));
    setDeleted(readSet(deleteKey).has(cleanId));

    const map = readStageMap(lane);
    if (map[cleanId]) setStage(map[cleanId]);
  }, [cleanId, lane]);

  const tone = useMemo(() => toneForStage(stage), [stage]);

  function toggleSet(
    key: string,
    nextValue: boolean,
    setter: (value: boolean) => void,
    actionName?: string,
    shouldRecord = true
  ) {
    const next = readSet(key);

    if (nextValue) next.add(cleanId);
    else next.delete(cleanId);

    writeSet(key, next);
    setter(nextValue);

    const inferredAction =
      actionName ||
      (key.includes("saved")
        ? nextValue
          ? "save"
          : "unsave"
        : key.includes("archived")
        ? nextValue
          ? "archive"
          : "restore_archive"
        : key.includes("deleted")
        ? nextValue
          ? "delete"
          : "restore_deleted"
        : "room_control");

    if (shouldRecord) recordRoomAction(inferredAction, stage, stage);
  }

  async function recordRoomAction(action: string, nextStage?: string, previousStage?: string) {
    try {
      await fetch("/api/rooms/control", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": "",
        },
        body: JSON.stringify({
          action,
          lane,
          room_id: cleanId,
          title: roomTitle,
          stage: nextStage || stage,
          previous_stage: previousStage || stage,
        }),
      });
    } catch {
      // The room still updates locally even if the backend event table is not ready.
    }
  }

  async function changeStage(nextStage: string) {
    const previousStage = stage;
    const map = readStageMap(lane);
    map[cleanId] = nextStage;
    writeStageMap(lane, map);
    setStage(nextStage);

    await recordRoomAction("stage_change", nextStage, previousStage);

    if (nextStage === "Archived") toggleSet(archiveKey, true, setArchived, "archive", false);
    if (nextStage === "Dead") toggleSet(deleteKey, true, setDeleted, "delete", false);
    if (nextStage === "Solved" || nextStage === "Closed") toggleSet(archiveKey, false, setArchived, "restore_archive", false);

    goToFolderForStage(lane, nextStage);
  }

  const threadHref = `/messages/new?source=room-command&type=${encodeURIComponent(lane)}&folder=rooms&folder_key=rooms&item_id=${encodeURIComponent(cleanId)}${ownerEmail ? `&to=${encodeURIComponent(ownerEmail)}` : ""}&title=${encodeURIComponent(roomTitle)}&subject=${encodeURIComponent(`Room Command: ${roomTitle}`)}`;

  return (
    <section style={shell}>
      <style>{`
        .vf-room-command-actions a:hover,
        .vf-room-command-actions button:hover,
        .vf-stage-button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.08);
        }

        @media(max-width:760px) {
          .vf-room-command-top,
          .vf-room-command-actions,
          .vf-stage-grid {
            grid-template-columns: 1fr !important;
          }

          .vf-room-command-actions {
            display: grid !important;
            gap: 8px !important;
          }

          .vf-room-command-actions > * {
            width: 100%;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div
        className="vf-room-command-top"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 12,
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div>
          <div
            style={{
              color: "#e8c46b",
              letterSpacing: ".18em",
              textTransform: "uppercase",
              fontWeight: 950,
              fontSize: 11,
            }}
          >
            {laneLabel(lane)} Command Controls
          </div>

          <div style={{ color: "#cbd5e1", lineHeight: 1.45, marginTop: 5, fontSize: 13 }}>
            Stage:{" "}
            <span
              style={{
                color: tone.color,
                border: `1px solid ${tone.border}`,
                background: tone.bg,
                borderRadius: 999,
                padding: "4px 8px",
                fontWeight: 900,
              }}
            >
              {stage}
            </span>{" "}
            · Stage buttons mark the room and move you to the matching folder. Save/archive/delete stay as cleanup controls.
          </div>
        </div>

        <div className="vf-room-command-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Link href={laneHome(lane)} style={gold}>Back to Lane</Link>
          <Link href="/workstations" style={button}>Workstations</Link>
          <Link href="/dashboard" style={button}>Command</Link>
        </div>
      </div>

      <div className="vf-stage-grid" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {stageOptions(lane).map((stageName) => {
          const active = stageName === stage;
          const stageTone = toneForStage(stageName);

          return (
            <button
              key={stageName}
              type="button"
              className="vf-stage-button"
              onClick={() => changeStage(stageName)}
              style={{
                border: active ? `1px solid ${stageTone.color}` : `1px solid ${stageTone.border}`,
                background: active ? stageTone.bg : "rgba(255,255,255,.035)",
                color: active ? stageTone.color : "#cbd5e1",
                borderRadius: 999,
                padding: "8px 10px",
                fontSize: 12,
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              {stageName}
            </button>
          );
        })}
      </div>

      <div className="vf-room-command-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {!saved ? (
          <button type="button" onClick={() => toggleSet(saveKey, true, setSaved)} style={button}>Save Room</button>
        ) : (
          <button type="button" onClick={() => toggleSet(saveKey, false, setSaved)} style={button}>Unsave Room</button>
        )}

        {!archived ? (
          <button type="button" onClick={() => toggleSet(archiveKey, true, setArchived)} style={button}>Archive Room</button>
        ) : (
          <button type="button" onClick={() => toggleSet(archiveKey, false, setArchived)} style={button}>Restore From Archive</button>
        )}

        {!deleted ? (
          <button type="button" onClick={() => toggleSet(deleteKey, true, setDeleted)} style={danger}>Delete Room</button>
        ) : (
          <button type="button" onClick={() => toggleSet(deleteKey, false, setDeleted)} style={gold}>Restore From Deleted</button>
        )}

        <Link href={threadHref} style={button}>Internal Thread</Link>
      </div>
    </section>
  );
}
