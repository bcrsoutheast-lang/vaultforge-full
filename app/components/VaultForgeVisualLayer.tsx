"use client";

import Link from "next/link";
import React from "react";

type Tone = "gold" | "silver" | "red" | "green" | "blue" | "purple" | "dark";

type PulseItem = {
  label: string;
  value: string | number;
  tone?: Tone;
};

type SignalBarProps = {
  urgent?: number;
  high?: number;
  normal?: number;
  active?: number;
  routed?: number;
  messages?: number;
};

type StatProps = {
  label: string;
  value: string | number;
  detail?: string;
  tone?: Tone;
};

type Action = {
  label: string;
  href: string;
  tone?: Tone;
};

const tones: Record<Tone, { main: string; soft: string; border: string; text: string }> = {
  gold: {
    main: "#e8c46b",
    soft: "rgba(232,196,107,.12)",
    border: "rgba(232,196,107,.34)",
    text: "#f8e7b0",
  },
  silver: {
    main: "#cbd5e1",
    soft: "rgba(203,213,225,.10)",
    border: "rgba(203,213,225,.22)",
    text: "#e5e7eb",
  },
  red: {
    main: "#ef4444",
    soft: "rgba(239,68,68,.12)",
    border: "rgba(239,68,68,.34)",
    text: "#fecaca",
  },
  green: {
    main: "#22c55e",
    soft: "rgba(34,197,94,.11)",
    border: "rgba(34,197,94,.3)",
    text: "#bbf7d0",
  },
  blue: {
    main: "#38bdf8",
    soft: "rgba(56,189,248,.10)",
    border: "rgba(56,189,248,.28)",
    text: "#bae6fd",
  },
  purple: {
    main: "#a78bfa",
    soft: "rgba(167,139,250,.10)",
    border: "rgba(167,139,250,.26)",
    text: "#ddd6fe",
  },
  dark: {
    main: "#111827",
    soft: "rgba(255,255,255,.045)",
    border: "rgba(255,255,255,.12)",
    text: "#f8fafc",
  },
};

function clamp(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function pct(value: number) {
  return `${clamp(value)}%`;
}

function total(values: number[]) {
  return values.reduce((sum, value) => sum + Math.max(0, Number(value || 0)), 0);
}

function color(tone: Tone = "gold") {
  return tones[tone] || tones.gold;
}

export function VaultForgePageShell({
  children,
  maxWidth = 1240,
}: {
  children: React.ReactNode;
  maxWidth?: number;
}) {
  return (
    <main style={styles.page}>
      <style>{`
        @keyframes vfTickerMove {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        @keyframes vfPulseGlow {
          0%, 100% { opacity: .72; }
          50% { opacity: 1; }
        }

        a:hover,
        button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        input::placeholder,
        textarea::placeholder {
          color: rgba(255,255,255,.42);
        }

        @media (max-width: 820px) {
          .vf-tight-grid,
          .vf-two-grid,
          .vf-three-grid,
          .vf-four-grid,
          .vf-actions {
            grid-template-columns: 1fr !important;
          }

          .vf-actions {
            display: grid !important;
            gap: 10px !important;
          }

          .vf-actions > * {
            width: 100%;
            box-sizing: border-box;
            justify-content: center;
            margin: 0 !important;
          }
        }
      `}</style>

      <section style={{ ...styles.shell, maxWidth }}>{children}</section>
    </main>
  );
}

export function VaultForgeCommandHeader({
  eyebrow = "VAULTFORGE COMMAND CENTER",
  title,
  subtitle,
  right,
  actions = [],
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  actions?: Action[];
}) {
  return (
    <section style={styles.hero}>
      <div>
        <p style={styles.eyebrow}>{eyebrow}</p>
        <h1 style={styles.title}>{title}</h1>
        {subtitle ? <p style={styles.subtitle}>{subtitle}</p> : null}

        {actions.length ? (
          <div className="vf-actions" style={styles.actionRow}>
            {actions.map((action) => {
              const t = color(action.tone || "dark");
              const primary = action.tone === "gold";

              return (
                <Link
                  key={`${action.href}-${action.label}`}
                  href={action.href}
                  style={{
                    ...styles.action,
                    color: primary ? "#090909" : t.text,
                    background: primary ? "linear-gradient(135deg,#f8e7b0,#e8c46b)" : t.soft,
                    border: primary ? "1px solid rgba(232,196,107,.7)" : `1px solid ${t.border}`,
                  }}
                >
                  {action.label}
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>

      {right ? <aside style={styles.sidePanel}>{right}</aside> : null}
    </section>
  );
}

export function VaultForgePulseStrip({ items }: { items: PulseItem[] }) {
  const safeItems = items.length
    ? items
    : [
        { label: "SIGNALS", value: "LIVE", tone: "gold" as Tone },
        { label: "ROUTING", value: "READY", tone: "silver" as Tone },
      ];

  return (
    <section style={styles.pulseWrap}>
      <div style={styles.pulseTrack}>
        {[...safeItems, ...safeItems].map((item, index) => {
          const t = color(item.tone || "gold");

          return (
            <span
              key={`${item.label}-${item.value}-${index}`}
              style={{
                ...styles.pulseItem,
                borderColor: t.border,
                background: t.soft,
                color: t.text,
              }}
            >
              <strong style={{ color: t.main }}>{item.label}</strong>
              <em>{item.value}</em>
            </span>
          );
        })}
      </div>
    </section>
  );
}

export function VaultForgeSignalBar({
  urgent = 0,
  high = 0,
  normal = 0,
  active = 0,
  routed = 0,
  messages = 0,
}: SignalBarProps) {
  const pressureTotal = Math.max(1, total([urgent, high, normal]));
  const urgentPct = (urgent / pressureTotal) * 100;
  const highPct = (high / pressureTotal) * 100;
  const normalPct = (normal / pressureTotal) * 100;

  const activityTotal = Math.max(1, total([active, routed, messages]));
  const activePct = (active / activityTotal) * 100;
  const routedPct = (routed / activityTotal) * 100;
  const messagePct = (messages / activityTotal) * 100;

  return (
    <section style={styles.signalPanel}>
      <div style={styles.signalTop}>
        <div>
          <p style={styles.eyebrowSmall}>LIVE PRESSURE</p>
          <strong style={styles.signalTitle}>Signal bars</strong>
        </div>
        <span style={styles.livePill}>Operational</span>
      </div>

      <div style={styles.barGroup}>
        <div style={styles.barLabel}>
          <span>Priority pressure</span>
          <strong>{urgent} urgent · {high} high · {normal} normal</strong>
        </div>
        <div style={styles.segmentRail}>
          <span style={{ ...styles.segment, width: pct(urgentPct), background: tones.red.main }} />
          <span style={{ ...styles.segment, width: pct(highPct), background: tones.gold.main }} />
          <span style={{ ...styles.segment, width: pct(normalPct), background: tones.silver.main }} />
        </div>
      </div>

      <div style={styles.barGroup}>
        <div style={styles.barLabel}>
          <span>Execution movement</span>
          <strong>{active} active · {routed} routed · {messages} messages</strong>
        </div>
        <div style={styles.segmentRail}>
          <span style={{ ...styles.segment, width: pct(activePct), background: tones.gold.main }} />
          <span style={{ ...styles.segment, width: pct(routedPct), background: tones.green.main }} />
          <span style={{ ...styles.segment, width: pct(messagePct), background: tones.blue.main }} />
        </div>
      </div>
    </section>
  );
}

export function VaultForgeSignalMeter({
  label,
  value,
  note,
  tone = "gold",
}: {
  label: string;
  value: number;
  note?: string;
  tone?: Tone;
}) {
  const t = color(tone);

  return (
    <div style={{ ...styles.meterCard, borderColor: t.border }}>
      <div style={styles.meterTop}>
        <span>{label}</span>
        <strong style={{ color: t.text }}>{pct(value)}</strong>
      </div>
      <div style={styles.meterRail}>
        <div style={{ ...styles.meterFill, width: pct(value), background: `linear-gradient(90deg,${t.main},#f8e7b0)` }} />
      </div>
      {note ? <small style={styles.muted}>{note}</small> : null}
    </div>
  );
}

export function VaultForgeStatGrid({ stats }: { stats: StatProps[] }) {
  return (
    <section className="vf-four-grid" style={styles.statGrid}>
      {stats.map((stat) => {
        const t = color(stat.tone || "gold");

        return (
          <article key={stat.label} style={{ ...styles.statCard, borderColor: t.border }}>
            <span style={{ ...styles.eyebrowSmall, color: t.text }}>{stat.label}</span>
            <strong style={styles.statValue}>{stat.value}</strong>
            {stat.detail ? <p style={styles.muted}>{stat.detail}</p> : null}
          </article>
        );
      })}
    </section>
  );
}

export function VaultForgeCommandCard({
  eyebrow,
  title,
  children,
  tone = "gold",
}: {
  eyebrow?: string;
  title?: string;
  children: React.ReactNode;
  tone?: Tone;
}) {
  const t = color(tone);

  return (
    <section style={{ ...styles.card, borderColor: t.border }}>
      {eyebrow ? <p style={{ ...styles.eyebrowSmall, color: t.text }}>{eyebrow}</p> : null}
      {title ? <h2 style={styles.cardTitle}>{title}</h2> : null}
      {children}
    </section>
  );
}

export function VaultForgeCommandFooter() {
  return (
    <footer style={styles.footer}>
      <span>VaultForge OS</span>
      <strong>Pain → Signal → Routing → Intro → Message → Execution</strong>
      <span>Private real estate intelligence network</span>
    </footer>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, rgba(232,196,107,.12), transparent 30%), radial-gradient(circle at bottom right, rgba(148,163,184,.10), transparent 32%), linear-gradient(180deg,#020303,#07090d 50%,#020303)",
    color: "white",
    padding: "22px 16px 82px",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  shell: {
    width: "min(1240px,100%)",
    margin: "0 auto",
  },
  hero: {
    display: "grid",
    gridTemplateColumns: "minmax(0,1fr) minmax(260px,360px)",
    gap: 18,
    border: "1px solid rgba(232,196,107,.28)",
    borderRadius: 30,
    padding: 24,
    background:
      "linear-gradient(135deg,rgba(255,255,255,.075),rgba(255,255,255,.026))",
    boxShadow: "0 28px 90px rgba(0,0,0,.38)",
    marginBottom: 16,
  },
  eyebrow: {
    color: "#e8c46b",
    fontSize: 12,
    letterSpacing: ".18em",
    textTransform: "uppercase",
    fontWeight: 950,
    margin: "0 0 10px",
  },
  eyebrowSmall: {
    color: "#e8c46b",
    fontSize: 11,
    letterSpacing: ".16em",
    textTransform: "uppercase",
    fontWeight: 950,
    margin: "0 0 8px",
  },
  title: {
    fontSize: "clamp(42px,8vw,88px)",
    lineHeight: 0.88,
    margin: 0,
    letterSpacing: "-.06em",
  },
  subtitle: {
    color: "#cbd5e1",
    fontSize: 18,
    lineHeight: 1.55,
    maxWidth: 820,
    margin: "16px 0 0",
  },
  actionRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
  },
  action: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    padding: "12px 15px",
    minHeight: 45,
    textDecoration: "none",
    fontWeight: 900,
  },
  sidePanel: {
    border: "1px solid rgba(232,196,107,.18)",
    borderRadius: 24,
    padding: 18,
    background: "rgba(0,0,0,.32)",
  },
  pulseWrap: {
    overflow: "hidden",
    border: "1px solid rgba(232,196,107,.16)",
    borderRadius: 999,
    background: "rgba(232,196,107,.045)",
    margin: "0 0 16px",
    whiteSpace: "nowrap",
  },
  pulseTrack: {
    display: "inline-flex",
    gap: 10,
    minWidth: "200%",
    padding: "8px 0",
    animation: "vfTickerMove 42s linear infinite",
  },
  pulseItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    border: "1px solid rgba(232,196,107,.28)",
    borderRadius: 999,
    padding: "8px 12px",
    fontSize: 12,
    letterSpacing: ".11em",
    textTransform: "uppercase",
    fontWeight: 900,
  },
  signalPanel: {
    border: "1px solid rgba(232,196,107,.2)",
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    background:
      "linear-gradient(135deg,rgba(232,196,107,.07),rgba(255,255,255,.025))",
  },
  signalTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    marginBottom: 14,
  },
  signalTitle: {
    fontSize: 22,
    letterSpacing: "-.03em",
  },
  livePill: {
    color: "#101010",
    background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
    borderRadius: 999,
    padding: "8px 11px",
    fontSize: 12,
    fontWeight: 950,
  },
  barGroup: {
    marginTop: 12,
  },
  barLabel: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: 850,
    marginBottom: 8,
  },
  segmentRail: {
    height: 10,
    overflow: "hidden",
    borderRadius: 999,
    background: "rgba(255,255,255,.08)",
    display: "flex",
  },
  segment: {
    display: "block",
    height: "100%",
    minWidth: 2,
  },
  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4,minmax(0,1fr))",
    gap: 14,
    marginBottom: 16,
  },
  statCard: {
    border: "1px solid rgba(232,196,107,.18)",
    borderRadius: 22,
    padding: 18,
    background: "rgba(255,255,255,.045)",
  },
  statValue: {
    display: "block",
    fontSize: 42,
    lineHeight: 1,
    color: "#f8e7b0",
    marginBottom: 9,
  },
  card: {
    border: "1px solid rgba(232,196,107,.18)",
    borderRadius: 24,
    padding: 20,
    background:
      "linear-gradient(180deg,rgba(255,255,255,.065),rgba(255,255,255,.026))",
    boxShadow: "0 20px 70px rgba(0,0,0,.25)",
    marginBottom: 16,
  },
  cardTitle: {
    margin: "0 0 12px",
    fontSize: 28,
    letterSpacing: "-.03em",
  },
  meterCard: {
    border: "1px solid rgba(232,196,107,.18)",
    borderRadius: 18,
    padding: 14,
    background: "rgba(255,255,255,.04)",
  },
  meterTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    color: "#e5e7eb",
    fontSize: 12,
    fontWeight: 900,
    marginBottom: 10,
  },
  meterRail: {
    height: 8,
    borderRadius: 999,
    background: "rgba(255,255,255,.09)",
    overflow: "hidden",
    marginBottom: 8,
  },
  meterFill: {
    height: "100%",
    borderRadius: 999,
  },
  muted: {
    color: "#cbd5e1",
    lineHeight: 1.45,
    margin: 0,
  },
  footer: {
    marginTop: 22,
    borderTop: "1px solid rgba(255,255,255,.10)",
    paddingTop: 18,
    display: "flex",
    gap: 12,
    justifyContent: "space-between",
    flexWrap: "wrap",
    color: "#94a3b8",
    fontSize: 12,
    letterSpacing: ".08em",
    textTransform: "uppercase",
  },
};

export default VaultForgePageShell;
