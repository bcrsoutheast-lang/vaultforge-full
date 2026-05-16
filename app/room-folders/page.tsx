"use client";

import Link from "next/link";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

const opportunityFolders = [
  ["active", "Active"],
  ["hot", "Hot"],
  ["underwrite", "Underwrite"],
  ["needs-buyer", "Needs Buyer"],
  ["needs-capital", "Needs Capital"],
  ["needs-operator", "Needs Operator"],
  ["routed", "Routed"],
  ["saved", "Saved"],
  ["archived", "Archived"],
  ["deleted", "Deleted"],
];

const pressureFolders = [
  ["active", "Active"],
  ["urgent", "Urgent"],
  ["funding-gap", "Funding Gap"],
  ["needs-buyer", "Needs Buyer"],
  ["needs-capital", "Needs Capital"],
  ["needs-operator", "Needs Operator"],
  ["routed", "Routed"],
  ["solved", "Solved"],
  ["saved", "Saved"],
  ["archived", "Archived"],
  ["deleted", "Deleted"],
];

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 28%), radial-gradient(circle at 88% 10%, rgba(56,189,248,.10), transparent 26%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 96px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  width: "min(1180px,100%)",
  margin: "0 auto",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.24)",
  borderRadius: 30,
  padding: 24,
  background: "linear-gradient(145deg,rgba(255,255,255,.070),rgba(255,255,255,.030))",
  boxShadow: "0 28px 86px rgba(0,0,0,.30)",
  marginBottom: 18,
};

const label: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

const folderLink: React.CSSProperties = {
  border: "1px solid rgba(86,216,255,.32)",
  borderRadius: 18,
  padding: 16,
  color: "white",
  textDecoration: "none",
  fontWeight: 950,
  background: "rgba(255,255,255,.040)",
  minHeight: 54,
  display: "flex",
  alignItems: "center",
};

export default function RoomFoldersPage() {
  return (
    <main style={page}>
      <style>{`
        a:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        @media(max-width:760px) {
          .vf-folder-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav
          title="Folder Map"
          subtitle="5S folder control for Opportunity and Pressure room lanes."
          active="workstations"
        />

        <section style={card}>
          <div style={label}>5S Folder Control</div>
          <h1
            style={{
              fontSize: "clamp(54px,10vw,104px)",
              lineHeight: 0.88,
              letterSpacing: "-.07em",
              margin: "12px 0 18px",
            }}
          >
            Folder map.
          </h1>
          <p style={{ color: "#cbd5e1", fontSize: 20, lineHeight: 1.55, margin: 0 }}>
            Folder buttons now route into live Opportunity and Pressure lanes with filters instead of opening black screens.
          </p>
        </section>

        <section style={card}>
          <h2 style={{ fontSize: 40, margin: "0 0 18px" }}>Opportunity Folders</h2>
          <div
            className="vf-folder-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,minmax(0,1fr))",
              gap: 14,
            }}
          >
            {opportunityFolders.map(([folder, name]) => (
              <Link
                key={folder}
                href={`/opportunity-rooms?folder=${encodeURIComponent(folder)}`}
                style={folderLink}
              >
                {name}
              </Link>
            ))}
          </div>
        </section>

        <section style={card}>
          <h2 style={{ fontSize: 40, margin: "0 0 18px" }}>Pressure Folders</h2>
          <div
            className="vf-folder-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,minmax(0,1fr))",
              gap: 14,
            }}
          >
            {pressureFolders.map(([folder, name]) => (
              <Link
                key={folder}
                href={`/pressure-rooms?folder=${encodeURIComponent(folder)}`}
                style={{ ...folderLink, borderColor: "rgba(248,113,113,.32)" }}
              >
                {name}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
