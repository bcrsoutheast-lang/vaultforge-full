"use client";

import Link from "next/link";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 28%), radial-gradient(circle at 90% 10%, rgba(56,189,248,.10), transparent 26%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 96px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { width: "min(1180px,100%)", margin: "0 auto" };

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.24)",
  borderRadius: 30,
  padding: 24,
  background: "linear-gradient(145deg,rgba(255,255,255,.070),rgba(255,255,255,.030))",
  boxShadow: "0 28px 86px rgba(0,0,0,.30)",
  marginBottom: 20,
};

const folder: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.13)",
  borderRadius: 26,
  padding: 22,
  textDecoration: "none",
  color: "white",
  background: "linear-gradient(145deg,rgba(255,255,255,.060),rgba(255,255,255,.025))",
  minHeight: 210,
  display: "flex",
  flexDirection: "column",
};

const label: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

const muted: React.CSSProperties = { color: "#cbd5e1", lineHeight: 1.55 };

function Folder({ href, tag, title, body, tone }: { href: string; tag: string; title: string; body: string; tone: string }) {
  return (
    <Link href={href} style={{ ...folder, borderColor: tone }}>
      <div style={{ ...label, color: tone }}>{tag}</div>
      <h2 style={{ fontSize: 34, lineHeight: 1, margin: "12px 0 10px" }}>{title}</h2>
      <p style={{ ...muted, margin: 0, flex: 1 }}>{body}</p>
      <div style={{ color: "#f8e7b0", fontWeight: 950, marginTop: 18 }}>Open →</div>
    </Link>
  );
}

export default function WorkstationsPage() {
  return (
    <main style={page}>
      <style>{`
        a:hover { transform: translateY(-1px); transition: all .18s ease; filter: brightness(1.06); }
        @media(max-width:760px){ .vf-folder-grid { grid-template-columns:1fr !important; } }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav
          title="Workstations"
          subtitle="5S command launcher: every room goes into the right folder."
          active="workstations"
        />

        <section style={card}>
          <div style={label}>VaultForge 5S Flow</div>
          <h1 style={{ fontSize: "clamp(56px,10vw,108px)", lineHeight: 0.88, letterSpacing: "-.07em", margin: "12px 0 18px" }}>
            A place for everything.
          </h1>
          <p style={{ ...muted, fontSize: 20 }}>
            Workstations are no longer one cluttered feed. Choose the lane, open the room folder, and move the work like a river: intake → classify → route → execute → solve → archive.
          </p>
        </section>

        <section className="vf-folder-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 16 }}>
          <Folder href="/opportunity-rooms" tag="UPSIDE" title="Opportunity Rooms" body="Deals, upside, acquisition, capital, buyer fit, exit strategy, and underwriting folders." tone="#56d8ff" />
          <Folder href="/pressure-rooms" tag="FIX" title="Pressure Rooms" body="Problems, distress, urgency, contractor gaps, funding gaps, title/legal issues, and resolution folders." tone="#fecaca" />
          <Folder href="/saved-rooms" tag="CONTROL" title="Saved Rooms" body="The keep pile. Important rooms that need monitoring or later action." tone="#9df3bf" />
          <Folder href="/archived-rooms" tag="STANDARDIZE" title="Archived Rooms" body="Paused, completed, cold, or parked rooms that should not clutter active flow." tone="#cbd5e1" />
          <Folder href="/deleted-rooms" tag="SORT" title="Deleted Rooms" body="Removed rooms with restore control before final cleanup." tone="#f87171" />
          <Folder href="/intelligence" tag="KAIZEN" title="Intelligence" body="The Resolution Engine: diagnosis, scoring, routing logic, risk warnings, and execution guidance." tone="#e8c46b" />
          <Folder href="/room-folders" tag="5S MAP" title="Room Folders" body="Physical folder map for every Opportunity and Pressure stage." tone="#56d8ff" />
          <Folder href="/room-system-guide" tag="HELP" title="How This Works" body="A simple card explaining rooms, stage buttons, folders, and the river flow." tone="#9df3bf" />
        </section>
      </div>
    </main>
  );
}
