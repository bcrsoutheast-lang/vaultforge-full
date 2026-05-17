"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import VaultForgeCommandShell from "../components/VaultForgeCommandShell";
import { roomActionStatus } from "../lib/vaultforgeRoomState";

type Room = Record<string, any>;

function clean(v: unknown) { return String(v || "").trim(); }

function first(...vals: unknown[]) {
  for (const v of vals) {
    const t = clean(v);
    if (t) return t;
  }
  return "";
}

function roomId(row: Room, i = 0) {
  return first(row.id,row.deal_id,row.project_id,row.item_id,row.room_id,`room-${i}`);
}

function roomFolder(row: Room, i = 0) {
  const state = roomActionStatus("opportunity", roomId(row, i));
  if (state === "saved") return "saved";
  if (state === "archived") return "archived";
  if (state === "deleted") return "deleted";
  return "active";
}

export default function OpportunityRoomsPage() {
  const [rooms,setRooms] = useState<Room[]>([]);
  const [folder,setFolder] = useState("active");
  const [tick,setTick] = useState(0);

  useEffect(() => {
    const refresh = () => setTick(v => v + 1);
    window.addEventListener("vaultforge-5s-room-change", refresh);
    return () => window.removeEventListener("vaultforge-5s-room-change", refresh);
  }, []);

  useEffect(() => {
    async function load() {
      const r = await fetch("/api/deal/feed",{cache:"no-store"});
      const d = await r.json().catch(() => ({}));

      const rows = [
        ...(Array.isArray(d.deals) ? d.deals : []),
        ...(Array.isArray(d.projects) ? d.projects : []),
        ...(Array.isArray(d.feed) ? d.feed : []),
      ];

      const map = new Map<string,Room>();

      rows.forEach((row: Room, i:number) => {
        const id = roomId(row, i);
        if (!map.has(id)) map.set(id, row);
      });

      setRooms(Array.from(map.values()));
    }

    load();
  }, []);

  const visible = useMemo(() => {
    return rooms.filter((row, i) => roomFolder(row, i) === folder);
  }, [rooms, folder, tick]);

  function count(name: string) {
    return rooms.filter((row, i) => roomFolder(row, i) === name).length;
  }

  return (
    <VaultForgeCommandShell
      active="opportunity"
      title="Opportunity Rooms."
      subtitle="5S operational deal flow."
    >
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:20}}>
        <button onClick={() => setFolder("active")}>Active ({count("active")})</button>
        <button onClick={() => setFolder("saved")}>Saved ({count("saved")})</button>
        <button onClick={() => setFolder("archived")}>Archived ({count("archived")})</button>
        <button onClick={() => setFolder("deleted")}>Deleted ({count("deleted")})</button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:16}}>
        {visible.map((row, i) => {
          const id = roomId(row, i);

          return (
            <div key={id} style={{padding:20,border:"1px solid #444",borderRadius:20}}>
              <h2>{first(row.title,row.deal_title,row.project_title,"Opportunity Room")}</h2>

              <p>
                {first(row.summary,row.ai_summary,row.description,"Opportunity staged for execution.")}
              </p>

              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <Link href={`/deal/detail?id=${encodeURIComponent(id)}`}>Open Room</Link>
                <Link href="/dashboard">Command</Link>
              </div>
            </div>
          );
        })}
      </div>
    </VaultForgeCommandShell>
  );
}
