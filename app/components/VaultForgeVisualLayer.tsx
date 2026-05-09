"use client";

import Link from "next/link";

type PulseItem = {
  label: string;
  value: string;
  tone?: "gold" | "red" | "green" | "purple";
};

const DEFAULT_PULSE: PulseItem[] = [
  { label: "NETWORK", value: "ACTIVE", tone: "green" },
  { label: "SIGNALS", value: "LIVE", tone: "gold" },
  { label: "ROUTING", value: "MONITORING", tone: "purple" },
  { label: "PRESSURE", value: "WATCHING", tone: "red" },
];

export function VaultForgePulseStrip({
  items = DEFAULT_PULSE,
}: {
  items?: PulseItem[];
}) {
  return (
    <section style={strip}>
      <style>{`
        @keyframes vfPulseMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @media (max-width: 760px) {
          .vf-pulse-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }

        @media (max-width: 460px) {
          .vf-pulse-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div style={pulseGrid} className="vf-pulse-grid">
        {items.map((item) => (
          <div key={`${item.label}-${item.value}`} style={pulseCell}>
            <span style={{ ...dot, background: toneColor(item.tone) }} />
            <div>
              <div style={pulseLabel}>{item.label}</div>
              <div style={{ ...pulseValue, color: toneColor(item.tone) }}>
                {item.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function VaultForgeCommandFooter() {
  return (
    <section style={footer}>
      <div>
        <div style={footerKicker}>VAULTFORGE OPERATING LAYER</div>
        <h3 style={footerTitle}>Private market intelligence. Routed execution. Controlled introductions.</h3>
        <p style={footerText}>
          VaultForge is built to help members move from signal to route to conversation to execution without losing context.
        </p>
      </div>

      <div style={footerActions}>
        <Link href="/command-navigation" style={footerBtn}>All Pages</Link>
        <Link href="/dashboard" style={footerGhost}>Dashboard</Link>
      </div>
    </section>
  );
}

export function VaultForgeSectionHeader({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text?: string;
}) {
  return (
    <section style={sectionHeader}>
      <div style={sectionEyebrow}>{eyebrow}</div>
      <h2 style={sectionTitle}>{title}</h2>
      {text && <p style={sectionText}>{text}</p>}
    </section>
  );
}



export function VaultForgeLiveTicker({
  items = [
    "URGENT DISTRESS SIGNAL DETECTED",
    "BUYER MATCH ROUTED",
    "LENDER RESPONSE TRACKED",
    "OFF-MARKET OPPORTUNITY ACTIVE",
    "INTRODUCTION REQUEST MONITORING",
    "NETWORK PRESSURE ELEVATED",
  ],
}: {
  items?: string[];
}) {
  const repeated = [...items, ...items, ...items];

  return (
    <section style={tickerWrap}>
      <style>{`
        @keyframes vfTickerMove {
          0% {
            transform: translateX(0%);
          }

          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>

      <div style={tickerViewport}>
        <div style={tickerTrack}>
          {repeated.map((item, index) => (
            <div key={`${item}-${index}`} style={tickerItem}>
              <span style={tickerDot} />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function VaultForgeSignalBar({
  urgent = 0,
  high = 0,
  normal = 0,
}: {
  urgent?: number;
  high?: number;
  normal?: number;
}) {
  const total = Math.max(1, urgent + high + normal);

  return (
    <section style={signalBar}>
      <div style={signalTop}>
        <div>
          <div style={sectionEyebrow}>SIGNAL PRESSURE</div>
          <strong style={{ fontSize: 22 }}>Live operating pressure</strong>
        </div>
        <div style={signalTotal}>{urgent + high + normal}</div>
      </div>

      <div style={barTrack}>
        <div
          style={{
            ...barSegment,
            width: `${(urgent / total) * 100}%`,
            background: "rgba(255,90,90,.85)",
          }}
        />
        <div
          style={{
            ...barSegment,
            width: `${(high / total) * 100}%`,
            background: "rgba(232,196,107,.85)",
          }}
        />
        <div
          style={{
            ...barSegment,
            width: `${(normal / total) * 100}%`,
            background: "rgba(157,243,191,.75)",
          }}
        />
      </div>

      <div style={signalLegend}>
        <span>Urgent: {urgent}</span>
        <span>High: {high}</span>
        <span>Normal: {normal}</span>
      </div>
    </section>
  );
}

function toneColor(tone?: PulseItem["tone"]) {
  if (tone === "red") return "#ff9f9f";
  if (tone === "green") return "#9df3bf";
  if (tone === "purple") return "#d8b5ff";
  return "#e8c46b";
}

const strip: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.16)",
  borderRadius: 24,
  padding: 14,
  marginBottom: 22,
  background:
    "linear-gradient(120deg, rgba(232,196,107,.10), rgba(211,58,44,.08), rgba(157,243,191,.07), rgba(181,92,255,.08))",
  backgroundSize: "220% 220%",
  animation: "vfPulseMove 10s ease infinite",
  boxShadow: "0 18px 55px rgba(0,0,0,.32)",
};

const pulseGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 10,
};

const pulseCell: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  border: "1px solid rgba(255,255,255,.09)",
  borderRadius: 18,
  padding: 12,
  background: "rgba(0,0,0,.22)",
};

const dot: React.CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: 999,
  boxShadow: "0 0 18px currentColor",
};

const pulseLabel: React.CSSProperties = {
  color: "rgba(255,255,255,.52)",
  fontSize: 10,
  fontWeight: 950,
  letterSpacing: 3,
};

const pulseValue: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 950,
  marginTop: 3,
};

const footer: React.CSSProperties = {
  marginTop: 28,
  border: "1px solid rgba(232,196,107,.16)",
  borderRadius: 30,
  padding: 24,
  background:
    "radial-gradient(circle at top left, rgba(211,58,44,.12), transparent 32%), linear-gradient(180deg, rgba(255,255,255,.045), rgba(255,255,255,.015))",
  display: "flex",
  justifyContent: "space-between",
  gap: 18,
  flexWrap: "wrap",
};

const footerKicker: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: 4,
  fontSize: 12,
  fontWeight: 950,
  marginBottom: 10,
};

const footerTitle: React.CSSProperties = {
  fontSize: "clamp(24px,4vw,38px)",
  lineHeight: 1,
  margin: "0 0 10px",
  maxWidth: 800,
};

const footerText: React.CSSProperties = {
  color: "rgba(255,255,255,.68)",
  lineHeight: 1.55,
  margin: 0,
  maxWidth: 760,
};

const footerActions: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
};

const footerBtn: React.CSSProperties = {
  color: "#050505",
  textDecoration: "none",
  background: "linear-gradient(135deg,#f4d47b,#a96d02)",
  border: "1px solid rgba(232,196,107,.35)",
  borderRadius: 999,
  padding: "12px 15px",
  fontWeight: 950,
};

const footerGhost: React.CSSProperties = {
  color: "white",
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,.12)",
  background: "rgba(255,255,255,.04)",
  borderRadius: 999,
  padding: "12px 15px",
  fontWeight: 900,
};

const sectionHeader: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.14)",
  borderRadius: 28,
  padding: 22,
  marginBottom: 18,
  background:
    "linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.015))",
};

const sectionEyebrow: React.CSSProperties = {
  color: "#d33a2c",
  letterSpacing: 4,
  fontWeight: 950,
  fontSize: 12,
  marginBottom: 10,
};

const sectionTitle: React.CSSProperties = {
  fontSize: "clamp(32px,6vw,62px)",
  lineHeight: .95,
  letterSpacing: -2,
  margin: 0,
};

const sectionText: React.CSSProperties = {
  color: "rgba(255,255,255,.70)",
  fontSize: 18,
  lineHeight: 1.55,
  maxWidth: 850,
};

const signalBar: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.14)",
  borderRadius: 24,
  padding: 18,
  marginBottom: 22,
  background: "rgba(0,0,0,.20)",
};

const signalTop: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
  marginBottom: 14,
};

const signalTotal: React.CSSProperties = {
  fontSize: 42,
  fontWeight: 950,
  color: "#e8c46b",
};

const barTrack: React.CSSProperties = {
  display: "flex",
  height: 14,
  overflow: "hidden",
  borderRadius: 999,
  background: "rgba(255,255,255,.07)",
  border: "1px solid rgba(255,255,255,.08)",
};

const barSegment: React.CSSProperties = {
  height: "100%",
};

const signalLegend: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  marginTop: 12,
  color: "rgba(255,255,255,.70)",
  fontWeight: 850,
  fontSize: 13,
};

const tickerWrap: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.14)",
  borderRadius: 22,
  marginBottom: 22,
  overflow: "hidden",
  background:
    "linear-gradient(90deg, rgba(232,196,107,.08), rgba(181,92,255,.08), rgba(157,243,191,.07))",
  boxShadow: "0 18px 55px rgba(0,0,0,.28)",
};

const tickerViewport: React.CSSProperties = {
  overflow: "hidden",
  width: "100%",
};

const tickerTrack: React.CSSProperties = {
  display: "flex",
  gap: 14,
  width: "max-content",
  padding: "14px 0",
  animation: "vfTickerMove 36s linear infinite",
};

const tickerItem: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 999,
  padding: "10px 16px",
  background: "rgba(0,0,0,.24)",
  color: "white",
  fontWeight: 900,
  letterSpacing: 1,
  whiteSpace: "nowrap",
  fontSize: 13,
};

const tickerDot: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: 999,
  background: "#e8c46b",
  boxShadow: "0 0 14px #e8c46b",
};
