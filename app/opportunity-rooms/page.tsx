"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import VaultForgeCommandShell from "../components/VaultForgeCommandShell";
import { roomActionStatus } from "../lib/vaultforgeRoomState";

type Room = Record<string, any>;

function clean(value: unknown) {
  return String(value || "").trim();
}

function first(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }
  return "";
}

function idOf(row: Room, index = 0) {
  return first(row.id, row.deal_id, row.project_id, row.item_id, row.room_id, `opportunity-${index}`);
}

function titleOf(row: Room) {
  return first(row.title, row.deal_title, row.project_title, row.headline, row.address, "Opportunity Room");
}

function summaryOf(row: Room) {
  return first(row.summary, row.ai_summary, row.description, row.notes, "Opportunity staged for execution.");
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

const panel: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.28)",
  borderRadius: 30,
  padding: 24,
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.12), transparent 36%), linear-gradient(145deg,rgba(15,23,42,.96),rgba(2,6,23,.96))",
  boxShadow: "0 26px 90px rgba(0,0,0,.36)",
  marginBottom: 18,
};

const label: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".2em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

const btn: React.CSSProperties = {
  minHeight: 48,
  borderRadius: 999,
  padding: "12px 16px",
  border: 0,
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
  fontWeight: 950,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const ghost: React.CSSProperties = {
  ...btn,
  background: "rgba(255,255,255,.06)",
  color: "white",
  border: "1px solid rgba(255,255,255,.16)",
};

export default function OpportunityRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const refresh = () => setTick((v) => v + 1);
    window.addEventListener("vaultforge-5s-room-change", refresh);
    return () => window.removeEventListener("vaultforge-5s-room-change", refresh);
  }, []);

  useEffect(() => {
    async function load() {
      const endpoints = ["/api/deal/feed", "/api/projects", "/api/deals"];
      const collected: Room[] = [];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, { cache: "no-store", credentials: "include" });
          const data = await safeJson(response);

          collected.push(
            ...(Array.isArray(data.deals) ? data.deals : []),
            ...(Array.isArray(data.projects) ? data.projects : []),
            ...(Array.isArray(data.feed) ? data.feed : []),
            ...(Array.isArray(data.items) ? data.items : []),
            ...(Array.isArray(data.rows) ? data.rows : []),
            ...(Array.isArray(data.data) ? data.data : [])
          );
        } catch {
          // continue
        }
      }

      const map = new Map<string, Room>();
      collected.forEach((row, index) => {
        const id = idOf(row, index);
        if (!map.has(id)) map.set(id, row);
      });

      setRooms(Array.from(map.values()));
    }

    load();
  }, []);

  const activeRooms = useMemo(() => {
    return rooms.filter((row, index) => roomActionStatus("opportunity", idOf(row, index)) === "active");
  }, [rooms, tick]);

  return (
    <VaultForgeCommandShell
      active="opportunity"
      title="Opportunity Rooms."
      subtitle="Active deal rooms only. Saved, archived, and deleted rooms leave this lane."
    >
      <section style={panel}>
        <div style={label}>VaultForge Opportunity 5S Lane</div>
        <h1 style={{ fontSize: "clamp(50px,10vw,108px)", lineHeight: .82, letterSpacing: "-.08em", margin: "12px 0" }}>
          Active deal execution.
        </h1>
        <p style={{ color: "#cbd5e1", fontSize: 20, lineHeight: 1.6 }}>
          This lane shows active opportunity rooms only. Use the room controls to save, archive, or delete rooms out of Active.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
          <Link href="/submit" style={btn}>Submit Opportunity</Link>
          <Link href="/saved-rooms" style={ghost}>Saved</Link>
          <Link href="/archived-rooms" style={ghost}>Archived</Link>
          <Link href="/deleted-rooms" style={ghost}>Deleted</Link>
          <Link href="/dashboard" style={ghost}>Command</Link>
        </div>
      </section>

      {!activeRooms.length ? (
        <section style={panel}>
          <div style={label}>Active Lane Clean</div>
          <h2 style={{ fontSize: "clamp(34px,7vw,70px)", lineHeight: .9, letterSpacing: "-.06em", margin: "10px 0" }}>
            No active opportunity rooms.
          </h2>
          <p style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
            Active is clean. Check Saved, Archived, or Deleted folders if you moved rooms out of workflow.
          </p>
        </section>
      ) : null}

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 18 }}>
        {activeRooms.map((row, index) => {
          const id = idOf(row, index);

          return (
            <article key={id} style={panel}>
              <div style={label}>Active Opportunity</div>
              <h2 style={{ fontSize: "clamp(36px,7vw,72px)", lineHeight: .88, letterSpacing: "-.06em", margin: "10px 0", overflowWrap: "anywhere" }}>
                {titleOf(row)}
              </h2>
              <p style={{ color: "#cbd5e1", lineHeight: 1.6 }}>{summaryOf(row)}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                <Link href={`/deal/detail?id=${encodeURIComponent(id)}`} style={btn}>Open Room</Link>
                <Link href="/dashboard" style={ghost}>Command</Link>
              </div>
            </article>
          );
        })}
      </section>
    </VaultForgeCommandShell>
  );
}
