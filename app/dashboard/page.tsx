"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Card = {
  key: string;
  label: string;
  count: number;
  href: string;
  description: string;
  status: "live" | "empty" | "needs-review";
};

type ApiState = {
  ok: boolean;
  email?: string;
  owner?: boolean;
  cards?: Card[];
  summary?: Record<string, number>;
  error?: string;
  details?: string;
};

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

function safeLocalEmail() {
  if (typeof window === "undefined") return "";

  const keys = ["vf_email", "vf_member_email", "vf_admin_email", "email", "memberEmail"];

  for (const key of keys) {
    const value = String(window.localStorage.getItem(key) || "").trim().toLowerCase();
    if (value.includes("@")) return value;
  }

  return "";
}

function statusText(card: Card) {
  if (card.count > 0) return "Live";
  return "Ready";
}

function cardAccent(key: string) {
  switch (key) {
    case "pain":
      return "#ef4444";
    case "projects":
      return "#e8c46b";
    case "signals":
      return "#38bdf8";
    case "messages":
      return "#22c55e";
    case "routing":
      return "#a855f7";
    case "alerts":
      return "#f97316";
    case "members":
      return "#14b8a6";
    case "intros":
      return "#f43f5e";
    default:
      return "#e8c46b";
  }
}

const fallbackCards: Card[] = [
  {
    key: "pain",
    label: "Pain Requests",
    count: 0,
    href: "/pain-feed",
    description: "Submitted problems and pressure signals.",
    status: "empty",
  },
  {
    key: "projects",
    label: "Projects",
    count: 0,
    href: "/projects",
    description: "Deals, properties, and execution rooms.",
    status: "empty",
  },
  {
    key: "signals",
    label: "Signals",
    count: 0,
    href: "/pain-feed",
    description: "Live intelligence created from pain, deals, and projects.",
    status: "empty",
  },
  {
    key: "messages",
    label: "Messages",
    count: 0,
    href: "/messages",
    description: "Requests, replies, and owner/member communication.",
    status: "empty",
  },
  {
    key: "routing",
    label: "Routing",
    count: 0,
    href: "/routing-inbox",
    description: "AI/operator routing actions and member-fit paths.",
    status: "empty",
  },
  {
    key: "alerts",
    label: "Alerts",
    count: 0,
    href: "/alerts",
    description: "Urgent updates, signal movement, and required action.",
    status: "empty",
  },
  {
    key: "members",
    label: "Member Network",
    count: 0,
    href: "/members",
    description: "Network by state, profile, need, and capability.",
    status: "empty",
  },
  {
    key: "intros",
    label: "Introductions",
    count: 0,
    href: "/introductions",
    description: "Controlled intros and routing responses.",
    status: "empty",
  },
];

export default function DashboardPage() {
  const [state, setState] = useState<ApiState>({ ok: false });
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");

  async function loadDashboard() {
    setLoading(true);

    const localEmail = safeLocalEmail();
    setEmail(localEmail);

    const query = localEmail ? `?email=${encodeURIComponent(localEmail)}` : "";

    try {
      const response = await fetch(`/api/dashboard/command-center${query}`, {
        cache: "no-store",
        headers: localEmail ? { "x-vf-email": localEmail } : {},
      });

      const json = await response.json().catch(() => ({}));
      setState(json);
    } catch (error: any) {
      setState({ ok: false, error: "Could not load dashboard.", details: error?.message || String(error) });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const cards = useMemo(() => {
    if (Array.isArray(state.cards) && state.cards.length) return state.cards;
    return fallbackCards;
  }, [state.cards]);

  const activeTotal = useMemo(() => {
    if (state.summary?.total_active !== undefined) return Number(state.summary.total_active || 0);
    return cards.reduce((total, card) => total + Number(card.count || 0), 0);
  }, [cards, state.summary]);

  const visibleEmail = state.email || email || "member session";
  const isOwner = Boolean(state.owner) || visibleEmail === OWNER_EMAIL;

  return (
    <main style={styles.page}>
      <section style={styles.shell}>
        <nav style={styles.topNav}>
          <Link href="/dashboard" style={styles.navBrand}>
            VaultForge
          </Link>

          <div style={styles.navLinks}>
            <Link href="/pain" style={styles.navLink}>
              Pain Button
            </Link>
            <Link href="/pain-feed" style={styles.navLink}>
              Pain Feed
            </Link>
            <Link href="/projects" style={styles.navLink}>
              Projects
            </Link>
            <Link href="/messages" style={styles.navLink}>
              Messages
            </Link>
            <Link href="/members" style={styles.navLink}>
              Members
            </Link>
            {isOwner ? (
              <Link href="/admin" style={styles.ownerLink}>
                Admin
              </Link>
            ) : null}
          </div>
        </nav>

        <section style={styles.hero}>
          <div>
            <p style={styles.eyebrow}>VAULTFORGE COMMAND CENTER</p>
            <h1 style={styles.title}>Everything starts here.</h1>
            <p style={styles.subtitle}>
              Pain, projects, alerts, routing, members, and messages organized into one clean operating view.
            </p>
          </div>

          <div style={styles.sessionCard}>
            <span style={styles.sessionLabel}>Current session</span>
            <strong style={styles.sessionEmail}>{visibleEmail}</strong>
            <span style={styles.sessionRole}>{isOwner ? "Owner/Admin View" : "Member View"}</span>
          </div>
        </section>

        <section style={styles.actionRow}>
          <Link href="/pain" style={styles.primaryAction}>
            Submit Pain
          </Link>
          <Link href="/submit" style={styles.secondaryAction}>
            Create Project
          </Link>
          <Link href="/messages" style={styles.secondaryAction}>
            Open Messages
          </Link>
          <button type="button" onClick={loadDashboard} style={styles.refreshButton}>
            {loading ? "Refreshing..." : "Refresh Counts"}
          </button>
        </section>

        {state.ok === false && state.error ? (
          <section style={styles.errorBox}>
            <strong>Dashboard counts could not fully load.</strong>
            <span>{state.error}</span>
            {state.details ? <small>{state.details}</small> : null}
            <small>The navigation still works. This usually means a table or session value needs review.</small>
          </section>
        ) : null}

        <section style={styles.summaryGrid}>
          <div style={styles.bigMetric}>
            <span style={styles.metricLabel}>Active operating items</span>
            <strong style={styles.metricNumber}>{activeTotal}</strong>
            <span style={styles.metricNote}>Signals, messages, routing, alerts, and execution movement.</span>
          </div>

          <div style={styles.workflowCard}>
            <span style={styles.metricLabel}>Core workflow</span>
            <strong style={styles.workflowText}>Submit → Signal → Route → Message → Execute</strong>
            <span style={styles.metricNote}>No scattered jumping. Every card below takes you to the correct system.</span>
          </div>
        </section>

        <section style={styles.cardsGrid}>
          {cards.map((card) => {
            const accent = cardAccent(card.key);

            return (
              <Link key={card.key} href={card.href} style={{ ...styles.card, borderColor: `${accent}66` }}>
                <span style={{ ...styles.cardAccent, background: accent }} />
                <div style={styles.cardTop}>
                  <span style={styles.cardLabel}>{card.label}</span>
                  <span style={styles.statusPill}>{statusText(card)}</span>
                </div>
                <strong style={styles.cardCount}>{card.count}</strong>
                <p style={styles.cardDescription}>{card.description}</p>
                <span style={styles.openLink}>Open {card.label} →</span>
              </Link>
            );
          })}
        </section>

        <section style={styles.cleanMap}>
          <h2 style={styles.sectionTitle}>Clean operating map</h2>
          <div style={styles.mapGrid}>
            <div style={styles.mapStep}>
              <strong>1. Submit</strong>
              <span>Pain form and Create form stay. They feed the system.</span>
            </div>
            <div style={styles.mapStep}>
              <strong>2. Organize</strong>
              <span>Dashboard cards show counts and send users to the right list.</span>
            </div>
            <div style={styles.mapStep}>
              <strong>3. Open Item</strong>
              <span>Pain, project, alert, or route opens the exact room.</span>
            </div>
            <div style={styles.mapStep}>
              <strong>4. Communicate</strong>
              <span>Message Owner should route to the item owner, with admin as fallback.</span>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 30%), radial-gradient(circle at top right, rgba(239,68,68,.12), transparent 28%), linear-gradient(180deg,#030509,#071326 52%,#030509)",
    color: "white",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    padding: "22px 16px 72px",
  },
  shell: {
    width: "min(1180px, 100%)",
    margin: "0 auto",
  },
  topNav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    padding: "14px 0 22px",
    flexWrap: "wrap",
  },
  navBrand: {
    color: "#f8e7b0",
    textDecoration: "none",
    fontWeight: 900,
    letterSpacing: ".08em",
    textTransform: "uppercase",
  },
  navLinks: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  navLink: {
    color: "#dbeafe",
    textDecoration: "none",
    border: "1px solid rgba(255,255,255,.14)",
    borderRadius: 999,
    padding: "9px 12px",
    background: "rgba(255,255,255,.05)",
    fontSize: 13,
  },
  ownerLink: {
    color: "#111827",
    textDecoration: "none",
    border: "1px solid rgba(232,196,107,.75)",
    borderRadius: 999,
    padding: "9px 12px",
    background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
    fontSize: 13,
    fontWeight: 900,
  },
  hero: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(260px, 340px)",
    gap: 20,
    alignItems: "stretch",
    border: "1px solid rgba(232,196,107,.22)",
    borderRadius: 28,
    padding: 24,
    background: "linear-gradient(135deg,rgba(255,255,255,.09),rgba(255,255,255,.035))",
    boxShadow: "0 28px 80px rgba(0,0,0,.38)",
  },
  eyebrow: {
    color: "#e8c46b",
    fontSize: 12,
    letterSpacing: ".18em",
    fontWeight: 900,
    margin: "0 0 10px",
  },
  title: {
    fontSize: "clamp(36px, 7vw, 74px)",
    lineHeight: .9,
    margin: 0,
    letterSpacing: "-.06em",
  },
  subtitle: {
    color: "#cbd5e1",
    fontSize: 17,
    lineHeight: 1.6,
    maxWidth: 720,
    margin: "18px 0 0",
  },
  sessionCard: {
    border: "1px solid rgba(255,255,255,.14)",
    borderRadius: 22,
    padding: 18,
    background: "rgba(3,7,18,.55)",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    justifyContent: "center",
  },
  sessionLabel: {
    color: "#94a3b8",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: ".14em",
    fontWeight: 800,
  },
  sessionEmail: {
    color: "#fff",
    fontSize: 15,
    wordBreak: "break-word",
  },
  sessionRole: {
    color: "#e8c46b",
    fontSize: 13,
    fontWeight: 800,
  },
  actionRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    margin: "22px 0",
  },
  primaryAction: {
    color: "#111827",
    textDecoration: "none",
    borderRadius: 16,
    padding: "13px 17px",
    fontWeight: 900,
    background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  },
  secondaryAction: {
    color: "#fff",
    textDecoration: "none",
    borderRadius: 16,
    padding: "13px 17px",
    fontWeight: 800,
    border: "1px solid rgba(255,255,255,.14)",
    background: "rgba(255,255,255,.06)",
  },
  refreshButton: {
    color: "#fff",
    borderRadius: 16,
    padding: "13px 17px",
    fontWeight: 800,
    border: "1px solid rgba(255,255,255,.14)",
    background: "rgba(255,255,255,.06)",
    cursor: "pointer",
  },
  errorBox: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    color: "#fee2e2",
    border: "1px solid rgba(239,68,68,.35)",
    background: "rgba(127,29,29,.28)",
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 16,
    marginBottom: 16,
  },
  bigMetric: {
    border: "1px solid rgba(232,196,107,.2)",
    borderRadius: 24,
    padding: 22,
    background: "rgba(255,255,255,.055)",
  },
  workflowCard: {
    border: "1px solid rgba(255,255,255,.14)",
    borderRadius: 24,
    padding: 22,
    background: "rgba(255,255,255,.045)",
  },
  metricLabel: {
    display: "block",
    color: "#94a3b8",
    fontSize: 12,
    letterSpacing: ".12em",
    textTransform: "uppercase",
    fontWeight: 900,
    marginBottom: 10,
  },
  metricNumber: {
    fontSize: 56,
    lineHeight: 1,
    color: "#f8e7b0",
  },
  workflowText: {
    display: "block",
    fontSize: 26,
    lineHeight: 1.15,
    color: "#fff",
    marginBottom: 12,
  },
  metricNote: {
    display: "block",
    color: "#cbd5e1",
    lineHeight: 1.5,
    marginTop: 10,
  },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 14,
  },
  card: {
    position: "relative",
    minHeight: 190,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,.12)",
    borderRadius: 24,
    padding: 18,
    textDecoration: "none",
    color: "#fff",
    background: "linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.035))",
    boxShadow: "0 20px 60px rgba(0,0,0,.25)",
  },
  cardAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
  },
  cardLabel: {
    color: "#e5e7eb",
    fontWeight: 900,
    fontSize: 15,
  },
  statusPill: {
    color: "#bbf7d0",
    border: "1px solid rgba(34,197,94,.28)",
    background: "rgba(22,101,52,.2)",
    borderRadius: 999,
    padding: "5px 8px",
    fontSize: 11,
    fontWeight: 900,
  },
  cardCount: {
    display: "block",
    fontSize: 44,
    marginTop: 18,
    color: "#f8e7b0",
  },
  cardDescription: {
    color: "#cbd5e1",
    lineHeight: 1.45,
    minHeight: 46,
    margin: "10px 0 18px",
  },
  openLink: {
    color: "#fff",
    fontWeight: 900,
  },
  cleanMap: {
    marginTop: 18,
    border: "1px solid rgba(255,255,255,.12)",
    borderRadius: 26,
    padding: 22,
    background: "rgba(255,255,255,.04)",
  },
  sectionTitle: {
    margin: "0 0 16px",
    fontSize: 24,
  },
  mapGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 12,
  },
  mapStep: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    border: "1px solid rgba(255,255,255,.12)",
    borderRadius: 18,
    padding: 16,
    background: "rgba(3,7,18,.36)",
    color: "#cbd5e1",
    lineHeight: 1.45,
  },
};
