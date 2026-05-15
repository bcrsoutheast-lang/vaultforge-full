"use client";

import Link from "next/link";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

const opportunity = [
  ["/opportunity-rooms/active", "Active"],
  ["/opportunity-rooms/hot", "Hot"],
  ["/opportunity-rooms/underwrite", "Underwrite"],
  ["/opportunity-rooms/needs-buyer", "Needs Buyer"],
  ["/opportunity-rooms/needs-capital", "Needs Capital"],
  ["/opportunity-rooms/needs-operator", "Needs Operator"],
  ["/opportunity-rooms/routed", "Routed"],
  ["/opportunity-rooms/saved", "Saved"],
  ["/opportunity-rooms/archived", "Archived"],
  ["/opportunity-rooms/deleted", "Deleted"],
];

const pressure = [
  ["/pressure-rooms/active", "Active"],
  ["/pressure-rooms/urgent", "Urgent"],
  ["/pressure-rooms/funding-gap", "Funding Gap"],
  ["/pressure-rooms/needs-buyer", "Needs Buyer"],
  ["/pressure-rooms/needs-capital", "Needs Capital"],
  ["/pressure-rooms/needs-operator", "Needs Operator"],
  ["/pressure-rooms/routed", "Routed"],
  ["/pressure-rooms/solved", "Solved"],
  ["/pressure-rooms/saved", "Saved"],
  ["/pressure-rooms/archived", "Archived"],
  ["/pressure-rooms/deleted", "Deleted"],
];

const page: React.CSSProperties = {
  
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 28%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
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

function FolderLink({ href, label, tone }: { href: string; label: string; tone: string }) {
  return (
    <Link
      href={href}
      style={{
        border: `1px solid ${tone}66`,
        borderRadius: 18,
        color: "white",
        background: "rgba(255,255,255,.045)",
        textDecoration: "none",
        padding: 16,
        fontWeight: 950,
      }}
    >
      {label}
    </Link>
  );
}

export default function RoomFoldersPage() {
  return (
    <main style={page}>
      <style>{`
        a:hover { transform: translateY(-1px); transition: all .18s ease; filter: brightness(1.06); }
        @media(max-width:760px){ .vf-grid { grid-template-columns:1fr !important; } }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav
          title="Room Folders"
          subtitle="Every room has a place. Every stage has a folder."
          active="workstations"
        />

        <section style={card}>
          <div style={{ color: "#e8c46b", letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 950, fontSize: 12 }}>
            5S Folder Control
          </div>
          <h1 style={{ fontSize: "clamp(52px,10vw,96px)", lineHeight: 0.88, letterSpacing: "-.07em", margin: "12px 0 18px" }}>
            Folder map.
          </h1>
          <p style={{ color: "#cbd5e1", lineHeight: 1.55, fontSize: 20 }}>
            Opportunity and Pressure now have physical folder routes. Stage buttons move the room into the matching operating category.
          </p>
        </section>

        <section style={card}>
          <h2 style={{ marginTop: 0, fontSize: 38 }}>Opportunity Folders</h2>
          <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12 }}>
            {opportunity.map(([href, label]) => <FolderLink key={href} href={href} label={label} tone="#56d8ff" />)}
          </div>
        </section>

        <section style={card}>
          <h2 style={{ marginTop: 0, fontSize: 38 }}>Pressure Folders</h2>
          <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12 }}>
            {pressure.map(([href, label]) => <FolderLink key={href} href={href} label={label} tone="#fecaca" />)}
          </div>
        </section>
      </div>
    </main>
  );
}
