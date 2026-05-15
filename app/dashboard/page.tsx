"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

type DashboardStats = {
  deals?: number;
  pain?: number;
  messages?: number;
  members?: number;
  routing?: number;
};

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function readCookie(name: string) {
  if (typeof document === "undefined") return "";
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  if (!match) return "";
  try {
    return decodeURIComponent(match.slice(name.length + 1));
  } catch {
    return match.slice(name.length + 1);
  }
}

function getEmail() {
  if (typeof window === "undefined") return "";
  const keys = ["vf_email", "vf_member_email", "vf_admin_email", "email", "memberEmail"];
  for (const key of keys) {
    const localValue = cleanEmail(window.localStorage.getItem(key));
    if (localValue.includes("@")) return localValue;
    const sessionValue = cleanEmail(window.sessionStorage.getItem(key));
    if (sessionValue.includes("@")) return sessionValue;
  }
  return cleanEmail(readCookie("vf_email") || readCookie("vf_member_email") || readCookie("vf_admin_email"));
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 28%), radial-gradient(circle at 88% 8%, rgba(56,189,248,.11), transparent 26%), radial-gradient(circle at 62% 54%, rgba(157,243,191,.075), transparent 28%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { width: "min(1280px,100%)", margin: "0 auto" };

const section: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.24)",
  borderRadius: 30,
  background: "linear-gradient(145deg,rgba(255,255,255,.070),rgba(255,255,255,.030))",
  padding: 24,
  marginBottom: 20,
  boxShadow: "0 28px 86px rgba(0,0,0,.30)",
};

const muted: React.CSSProperties = { color: "#cbd5e1", lineHeight: 1.55 };

const label: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

const button: React.CSSProperties = {
  minHeight: 54,
  borderRadius: 999,
  padding: "14px 20px",
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
  fontWeight: 950,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const ghost: React.CSSProperties = {
  ...button,
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(255,255,255,.060)",
  color: "white",
};

function CommandCard({ href, tag, title, body, tone }: { href: string; tag: string; title: string; body: string; tone: string }) {
  return (
    <Link href={href} style={{
      border: `1px solid ${tone}66`,
      borderRadius: 26,
      padding: 22,
      textDecoration: "none",
      color: "white",
      background: "linear-gradient(145deg,rgba(255,255,255,.060),rgba(255,255,255,.025))",
      minHeight: 220,
      display: "flex",
      flexDirection: "column",
    }}>
      <div style={{ ...label, color: tone }}>{tag}</div>
      <h3 style={{ margin: "12px 0 10px", fontSize: 32, lineHeight: 1.02 }}>{title}</h3>
      <p style={{ ...muted, flex: 1, margin: 0 }}>{body}</p>
      <div style={{ color: "#f8e7b0", fontWeight: 950, marginTop: 18 }}>Open →</div>
    </Link>
  );
}

function Metric({ labelText, value }: { labelText: string; value: number }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 22, padding: 18, background: "rgba(255,255,255,.045)" }}>
      <div style={label}>{labelText}</div>
      <div style={{ fontSize: 52, lineHeight: 1, marginTop: 12, fontWeight: 1000 }}>{value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [email, setEmail] = useState("");
  const [stats, setStats] = useState<DashboardStats>({ deals: 0, pain: 0, messages: 0, members: 0, routing: 0 });

  useEffect(() => {
    const viewer = getEmail();
    setEmail(viewer);

    async function load() {
      try {
        const response = await fetch(`/api/dashboard/stats?email=${encodeURIComponent(viewer)}`, {
          method: "GET",
          credentials: "include",
          headers: { "x-vf-email": viewer },
          cache: "no-store",
        });
        const data = await response.json().catch(() => ({}));
        if (data?.ok) setStats(data);
      } catch {}
    }

    load();
  }, []);

  return (
    <main style={page}>
      <style>{`
        a:hover { transform: translateY(-1px); transition: all .18s ease; filter: brightness(1.06); }
        @media(max-width:760px){ .vf-grid, .vf-actions { grid-template-columns:1fr !important; } .vf-actions { display:grid !important; gap:10px !important; } .vf-actions > * { width:100%; box-sizing:border-box; } }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav
          title="Command Center"
          subtitle="Command Center of Money: neat, organized, folder-based, room-based, 5S flow."
          active="dashboard"
        />

        <section style={section}>
          <div style={label}>VaultForge Command Center</div>
          <h1 style={{ fontSize: "clamp(56px,10vw,110px)", lineHeight: 0.88, letterSpacing: "-.07em", margin: "12px 0 18px" }}>
            Flow like a river.
          </h1>
          <p style={{ ...muted, fontSize: 20, maxWidth: 980 }}>
            Every room and deal has a place: Opportunity Rooms for upside, Pressure Rooms for problems, Saved for keepers, Archived for parked work, Deleted for cleanup, and Intelligence underneath every decision.
          </p>

          <div className="vf-actions" style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 22 }}>
            <Link href="/opportunity-rooms" style={button}>Opportunity Rooms</Link>
            <Link href="/pressure-rooms" style={button}>Pressure Rooms</Link>
            <Link href="/workstations" style={ghost}>Workstations</Link>
            <Link href="/intelligence" style={ghost}>Intelligence</Link>
            <Link href="/messages" style={ghost}>Messages</Link>
          </div>

          <p style={{ ...muted, marginTop: 14, fontSize: 14 }}>Signed in: {email || "unknown"}</p>
        </section>

        <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: 14, marginBottom: 20 }}>
          <Metric labelText="Opportunity" value={Number(stats.deals || 0)} />
          <Metric labelText="Pressure" value={Number(stats.pain || 0)} />
          <Metric labelText="Messages" value={Number(stats.messages || 0)} />
          <Metric labelText="Network" value={Number(stats.members || 0)} />
          <Metric labelText="Routing" value={Number(stats.routing || 0)} />
        </section>

        <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 16 }}>
          <CommandCard href="/opportunity-rooms" tag="UPSIDE" title="Opportunity Rooms" body="Deals, acquisitions, underwriting, capital stack, buyer fit, exit strategy, saved, archived, dead, routed." tone="#56d8ff" />
          <CommandCard href="/pressure-rooms" tag="FIX" title="Pressure Rooms" body="Distress, funding gaps, contractor issues, title/legal, urgent, needs operator, solved, archived." tone="#fecaca" />
          <CommandCard href="/saved-rooms" tag="CONTROL" title="Saved Rooms" body="Your keep pile. Anything worth monitoring, revisiting, or controlling without cluttering active flow." tone="#9df3bf" />
          <CommandCard href="/workstations" tag="5S" title="Workstations" body="Clean launcher for every folder and lane. No giant messy feed unless you choose the lane." tone="#e8c46b" />
        </section>
      </div>
    </main>
  );
}
