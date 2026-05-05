"use client";

import { useEffect, useState } from "react";

function Countdown() {
  const launch = new Date("2026-05-10T00:00:00").getTime();
  const [time, setTime] = useState(launch - Date.now());

  useEffect(() => {
    const t = setInterval(() => {
      setTime(launch - Date.now());
    }, 1000);
    return () => clearInterval(t);
  }, []);

  if (time <= 0) return null;

  const d = Math.floor(time / (1000 * 60 * 60 * 24));
  const h = Math.floor((time / (1000 * 60 * 60)) % 24);
  const m = Math.floor((time / (1000 * 60)) % 60);
  const s = Math.floor((time / 1000) % 60);

  return (
    <div style={{marginBottom:20, padding:20, border:"1px solid gold"}}>
      <h2>Founder Access Ends In:</h2>
      <h1>{d}d {h}h {m}m {s}s</h1>
      <p>$49 now → $99 → $149/mo after May 10</p>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({ deals:0, members:0, bucket:0 });

  async function load() {
    const res = await fetch("/api/dashboard/stats");
    const data = await res.json();
    setStats(data);
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={{padding:20, color:"white"}}>
      <Countdown />

      <h1>Dashboard</h1>

      <div style={{display:"grid", gap:20}}>
        <div>Deals: {stats.deals}</div>
        <div>Members: {stats.members}</div>
        <div>Buy Bucket: {stats.bucket}</div>
      </div>
    </div>
  );
}
