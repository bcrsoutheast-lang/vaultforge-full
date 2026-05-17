"use client";

import Link from "next/link";

export type VaultForgeRoomType = "opportunity" | "pain";

type RoomCardProps = {
  type: VaultForgeRoomType;
  title: string;
  subtitle?: string;
  location?: string;
  valueLine?: string;
  score?: string | number;
  status?: string;
  urgency?: string;
  href: string;
  imageUrl?: string;
  meta?: string[];
};

const severityColor: Record<string, string> = {
  critical: "#ff3b30",
  high: "#ff7a18",
  medium: "#f5c84c",
  low: "#68e18f",
  active: "#68e18f",
  saved: "#f5c84c",
  archived: "#9aa4b2",
  hidden: "#6b7280",
};

function normalize(value?: string) {
  return String(value || "active").trim().toLowerCase();
}

export default function VaultForgeRoomTerminalCard({
  type,
  title,
  subtitle,
  location,
  valueLine,
  score,
  status,
  urgency,
  href,
  imageUrl,
  meta = [],
}: RoomCardProps) {
  const level = normalize(urgency || status);
  const accent = severityColor[level] || (type === "pain" ? "#ff3b30" : "#f5c84c");

  return (
    <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
      <article
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 18,
          border: `1px solid ${type === "pain" ? "rgba(255,59,48,.34)" : "rgba(245,200,76,.28)"}`,
          background:
            type === "pain"
              ? "linear-gradient(145deg, rgba(90,16,14,.88), rgba(7,12,16,.96) 46%, rgba(2,4,7,.98))"
              : "linear-gradient(145deg, rgba(49,39,11,.9), rgba(7,12,16,.96) 46%, rgba(2,4,7,.98))",
          boxShadow: `0 0 28px ${type === "pain" ? "rgba(255,59,48,.12)" : "rgba(245,200,76,.11)"}`,
          minHeight: 142,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(90deg, ${accent}, transparent)`,
          }}
        />

        <div style={{ display: "grid", gridTemplateColumns: imageUrl ? "96px 1fr" : "1fr", gap: 14, padding: 16 }}>
          {imageUrl ? (
            <div
              style={{
                height: 96,
                borderRadius: 14,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,.12)",
                background: "rgba(255,255,255,.05)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ) : null}

          <div>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, letterSpacing: ".22em", textTransform: "uppercase", color: accent, fontWeight: 900 }}>
                  {type === "pain" ? "Pressure Room" : "Opportunity Room"}
                </div>
                <h3 style={{ margin: "7px 0 4px", fontSize: 17, lineHeight: 1.15, color: "#fff" }}>{title || "Untitled Room"}</h3>
                {subtitle ? <p style={{ margin: 0, color: "#c6ced9", fontSize: 13, lineHeight: 1.35 }}>{subtitle}</p> : null}
              </div>

              <div style={{ textAlign: "right", flex: "0 0 auto" }}>
                {score !== undefined && score !== null && String(score) !== "" ? (
                  <div style={{ color: accent, fontSize: 22, fontWeight: 950, lineHeight: 1 }}>{score}</div>
                ) : null}
                <div style={{ color: "#9aa4b2", fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", marginTop: 4 }}>
                  {status || "active"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              {location ? <span style={pill}>{location}</span> : null}
              {valueLine ? <span style={pill}>{valueLine}</span> : null}
              {urgency ? <span style={{ ...pill, borderColor: accent, color: accent }}>{urgency}</span> : null}
              {meta.slice(0, 3).map((item) => (
                <span key={item} style={pill}>{item}</span>
              ))}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

const pill: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.13)",
  background: "rgba(255,255,255,.045)",
  color: "#cbd5e1",
  borderRadius: 999,
  padding: "6px 9px",
  fontSize: 11,
  fontWeight: 800,
};
