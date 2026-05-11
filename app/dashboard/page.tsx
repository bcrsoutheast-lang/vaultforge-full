"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";
import {
  VaultForgePulseStrip,
  VaultForgeSignalBar,
  VaultForgeCommandFooter,
  VaultForgeStatGrid,
} from "../components/VaultForgeVisualLayer";

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

function safeLocalEmail() {
  if (typeof window === "undefined") return "";

  const keys = ["vf_email", "vf_member_email", "vf_admin_email", "email", "memberEmail"];

  for (const key of keys) {
    const value = cleanEmail(window.localStorage.getItem(key) || window.sessionStorage.getItem(key));
    if (value.includes("@")) return value;
  }

  return cleanEmail(readCookie("vf_email") || readCookie("vf_admin_email"));
}

function statusText(card: Card) {
  if (card.count > 0) return "Live";
  if (card.status === "needs-review") return "Review";
  return "Ready";
}

function toneForCard(key: string) {
  if (key === "pain") return "red";
  if (key === "signals") return "gold";
  if (key === "projects") return "gold";
  if (key === "messages") return "green";
  if (key === "routing") return "blue";
  if (key === "alerts") return "red";
  if (key === "members") return "silver";
  if (key === "intros") return "blue";
  return "gold";
}

function accentForCard(key: string) {
  if (key === "pain") return "#ef4444";
  if (key === "signals") return "#e8c46b";
  if (key === "projects") return "#f8e7b0";
  if (key === "messages") return "#22c55e";
  if (key === "routing") return "#38bdf8";
  if (key === "alerts") return "#ef4444";
  if (key === "members") return "#cbd5e1";
  if (key === "intros") return "#38bdf8";
  return "#e8c46b";
}

function hrefForCard(card: Card) {
  if (card.key === "signals") return "/intelligence";
  if (card.key === "pain") return "/pain-feed";
  if (card.key === "routing") return "/routing-inbox";
  if (card.key === "alerts") return "/alerts";
  if (card.key === "messages") return "/messages";
  if (card.key === "projects") return "/projects";
  if (card.key === "members") return "/members";
  if (card.key === "intros") return "/introductions";
  return card.href || "/dashboard";
}

const fallbackCards: Card[] = [
  {
    key: "signals",
    label: "Intelligence",
    count: 0,
    href: "/intelligence",
    description: "Master signal feed, market pressure, and active opportunity intelligence.",
    status: "empty",
  },
  {
    key: "pain",
    label: "Pain Signals",
    count: 0,
    href: "/pain-feed",
    description: "Submitted pain records converted into signal-ready operating cards.",
    status: "empty",
  },
  {
    key: "projects",
    label: "Projects",
    count: 0,
    href: "/projects",
    description: "Deals, properties, execution rooms, and asset review.",
    status: "empty",
  },
  {
    key: "messages",
    label: "Messages",
    count: 0,
    href: "/messages",
    description: "Requests, replies, owner/member communication, and controlled intros.",
    status: "empty",
  },
  {
    key: "routing",
    label: "Routing",
    count: 0,
    href: "/routing-inbox",
    description: "AI/operator routing actions, member-fit paths, and staged movement.",
    status: "empty",
  },
  {
    key: "alerts",
    label: "Alerts",
    count: 0,
    href: "/alerts",
    description: "Urgent updates, action cards, and signal movement.",
    status: "empty",
  },
  {
    key: "members",
    label: "Member Network",
    count: 0,
    href: "/members",
    description: "Network by state, profile, need, strategy, and capability.",
    status: "empty",
  },
  {
    key: "intros",
    label: "Introductions",
    count: 0,
    href: "/introductions",
    description: "Controlled intros, routing responses, and connection movement.",
    status: "empty",
  },
];

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 30%), radial-gradient(circle at bottom right, rgba(148,163,184,.10), transparent 32%), linear-gradient(180deg,#020303,#07090d 50%,#020303)",
  color: "white",
  padding: "22px 16px 82px",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const shell: React.CSSProperties = {
  width: "min(1240px,100%)",
  margin: "0 auto",
};

const hero: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1fr) minmax(280px,360px)",
  gap: 18,
  border: "1px solid rgba(232,196,107,.28)",
  borderRadius: 30,
  padding: 24,
  background:
    "linear-gradient(135deg,rgba(255,255,255,.075),rgba(255,255,255,.026))",
  boxShadow: "0 28px 90px rgba(0,0,0,.38)",
  marginBottom: 16,
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  fontSize: 12,
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontWeight: 950,
  margin: "0 0 10px",
};

const title: React.CSSProperties = {
  fontSize: "clamp(44px,8vw,92px)",
  lineHeight: 0.88,
  margin: 0,
  letterSpacing: "-.06em",
};

const subtitle: React.CSSProperties = {
  color: "#cbd5e1",
  fontSize: 18,
  lineHeight: 1.55,
  maxWidth: 820,
  margin: "16px 0 0",
};

const actionRow: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginTop: 16,
};

const primaryAction: React.CSSProperties = {
  color: "#101010",
  textDecoration: "none",
  borderRadius: 15,
  padding: "12px 15px",
  minHeight: 45,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 950,
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  border: "1px solid rgba(232,196,107,.7)",
  cursor: "pointer",
};

const secondaryAction: React.CSSProperties = {
  color: "#fff",
  textDecoration: "none",
  borderRadius: 15,
  padding: "12px 15px",
  minHeight: 45,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 850,
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(255,255,255,.055)",
  cursor: "pointer",
};

const sideCard: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.18)",
  borderRadius: 24,
  padding: 18,
  background: "rgba(0,0,0,.32)",
  display: "flex",
  flexDirection: "column",
  gap: 8,
  justifyContent: "center",
};

const chip: React.CSSProperties = {
  color: "#e5e7eb",
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(255,255,255,.055)",
  borderRadius: 999,
  padding: "8px 10px",
  fontSize: 12,
  fontWeight: 850,
  display: "inline-flex",
  margin: "0 8px 8px 0",
};

const cardsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
  gap: 14,
  marginBottom: 16,
};

const cardStyle: React.CSSProperties = {
  position: "relative",
  minHeight: 210,
  overflow: "hidden",
  border: "1px solid rgba(232,196,107,.18)",
  borderRadius: 24,
  padding: 20,
  textDecoration: "none",
  color: "white",
  background:
    "linear-gradient(180deg,rgba(255,255,255,.065),rgba(255,255,255,.026))",
  boxShadow: "0 20px 70px rgba(0,0,0,.25)",
};

const muted: React.CSSProperties = {
  color: "#cbd5e1",
  lineHeight: 1.55,
};

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
        headers: localEmail
          ? {
              "x-vf-email": localEmail,
              "x-vf-admin": localEmail === OWNER_EMAIL ? "1" : "0",
            }
          : {},
      });

      const json = await response.json().catch(() => ({}));
      setState(json);
    } catch (error: any) {
      setState({
        ok: false,
        error: "Could not load dashboard.",
        details: error?.message || String(error),
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const cards = useMemo(() => {
    if (Array.isArray(state.cards) && state.cards.length) {
      const byKey = new Map<string, Card>();

      for (const card of fallbackCards) byKey.set(card.key, card);

      for (const card of state.cards) {
        const fallback = byKey.get(card.key);
        byKey.set(card.key, {
          ...(fallback || card),
          ...card,
          href: hrefForCard({ ...(fallback || card), ...card }),
        });
      }

      return Array.from(byKey.values());
    }

    return fallbackCards;
  }, [state.cards]);

  const cardByKey = useMemo(() => {
    const map = new Map<string, Card>();
    for (const card of cards) map.set(card.key, card);
    return map;
  }, [cards]);

  const activeTotal = useMemo(() => {
    if (state.summary?.total_active !== undefined) return Number(state.summary.total_active || 0);
    return cards.reduce((total, card) => total + Number(card.count || 0), 0);
  }, [cards, state.summary]);

  const urgent = Number(cardByKey.get("alerts")?.count || 0);
  const routed = Number(cardByKey.get("routing")?.count || 0);
  const messages = Number(cardByKey.get("messages")?.count || 0);
  const pain = Number(cardByKey.get("pain")?.count || 0);
  const signals = Number(cardByKey.get("signals")?.count || 0);
  const projects = Number(cardByKey.get("projects")?.count || 0);

  const visibleEmail = state.email || email || "member session";
  const isOwner = Boolean(state.owner) || cleanEmail(visibleEmail) === OWNER_EMAIL;

  return (
    <main style={page}>
      <style>{`
        a:hover,
        button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        @media (max-width: 820px) {
          .vf-hero-grid,
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

      <section style={shell}>
        <VaultForgeMemberNav
          title="Dashboard"
          subtitle="Command center, operating counts, and fast access to the VaultForge execution loop."
        />

        <VaultForgePulseStrip
          items={[
            { label: "COMMAND", value: "LIVE", tone: "gold" },
            { label: "SIGNALS", value: signals || "READY", tone: "silver" },
            { label: "MESSAGES", value: messages || "WATCHING", tone: "green" },
            { label: "ROUTING", value: routed || "QUEUED", tone: "blue" },
          ]}
        />

        <VaultForgeSignalBar
          urgent={urgent}
          high={pain + routed}
          normal={Math.max(0, activeTotal - urgent - pain - routed)}
          active={activeTotal}
          routed={routed}
          messages={messages}
        />

        <section className="vf-hero-grid" style={hero}>
          <div>
            <p style={eyebrow}>VAULTFORGE COMMAND CENTER</p>
            <h1 style={title}>Everything starts here.</h1>
            <p style={subtitle}>
              One clean operating view for intelligence, pain, projects, routing, messages, alerts, members, and execution.
            </p>

            <div style={{ marginTop: 16 }}>
              <span style={chip}>Active: {activeTotal}</span>
              <span style={chip}>Pain: {pain}</span>
              <span style={chip}>Signals: {signals}</span>
              <span style={chip}>Messages: {messages}</span>
              <span style={chip}>{isOwner ? "Owner/Admin View" : "Member View"}</span>
            </div>

            <div className="vf-actions" style={actionRow}>
              <Link href="/intelligence" style={primaryAction}>Open Intelligence</Link>
              <Link href="/pain" style={primaryAction}>Submit Pain</Link>
              <Link href="/submit" style={secondaryAction}>Create Project</Link>
              <Link href="/messages" style={secondaryAction}>Messages</Link>
              <button type="button" onClick={loadDashboard} style={secondaryAction}>
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          <aside style={sideCard}>
            <span style={{ ...eyebrow, marginBottom: 0 }}>Current Session</span>
            <strong style={{ color: "#fff", fontSize: 15, wordBreak: "break-word" }}>{visibleEmail}</strong>
            <span style={{ color: "#f8e7b0", fontWeight: 900, fontSize: 13 }}>
              {isOwner ? "Owner/Admin View" : "Member View"}
            </span>
            <div style={{ height: 1, background: "rgba(255,255,255,.12)", margin: "8px 0" }} />
            <span style={{ color: "#94a3b8", lineHeight: 1.45 }}>
              Core loop: Pain → Signal → Routing → Intro → Message → Execution.
            </span>
            {isOwner ? <Link href="/admin" style={primaryAction}>Admin Control</Link> : null}
          </aside>
        </section>

        {state.ok === false && state.error ? (
          <section
            style={{
              border: "1px solid rgba(239,68,68,.35)",
              background: "rgba(127,29,29,.22)",
              color: "#fee2e2",
              borderRadius: 18,
              padding: 16,
              marginBottom: 16,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <strong>Dashboard counts could not fully load.</strong>
            <span>{state.error}</span>
            {state.details ? <small>{state.details}</small> : null}
            <small>The navigation still works. This usually means one count table or API source needs review.</small>
          </section>
        ) : null}

        <VaultForgeStatGrid
          stats={[
            { label: "Active Items", value: activeTotal, detail: "Total visible operating records.", tone: "gold" },
            { label: "Pain Signals", value: pain, detail: "Submitted problems and pressure signals.", tone: "red" },
            { label: "Routing", value: routed, detail: "Routing actions and member-fit paths.", tone: "blue" },
            { label: "Messages", value: messages, detail: "Owner/member communication threads.", tone: "green" },
          ]}
        />

        <section style={cardsGrid}>
          {cards.map((card) => {
            const accent = accentForCard(card.key);
            const href = hrefForCard(card);

            return (
              <Link key={card.key} href={href} style={{ ...cardStyle, borderColor: `${accent}66` }}>
                <span
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: accent,
                  }}
                />

                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                  <span style={{ color: "#e5e7eb", fontWeight: 950, fontSize: 15 }}>{card.label}</span>
                  <span
                    style={{
                      color: card.count > 0 ? "#bbf7d0" : "#e5e7eb",
                      border: card.count > 0 ? "1px solid rgba(34,197,94,.28)" : "1px solid rgba(255,255,255,.14)",
                      background: card.count > 0 ? "rgba(22,101,52,.2)" : "rgba(255,255,255,.05)",
                      borderRadius: 999,
                      padding: "5px 8px",
                      fontSize: 11,
                      fontWeight: 950,
                    }}
                  >
                    {statusText(card)}
                  </span>
                </div>

                <strong style={{ display: "block", fontSize: 46, lineHeight: 1, marginTop: 18, color: "#f8e7b0" }}>
                  {card.count}
                </strong>

                <p style={{ ...muted, minHeight: 68, margin: "12px 0 18px" }}>{card.description}</p>

                <span style={{ color: "#fff", fontWeight: 950 }}>Open {card.label} →</span>
              </Link>
            );
          })}
        </section>

        <section
          style={{
            border: "1px solid rgba(255,255,255,.12)",
            borderRadius: 26,
            padding: 22,
            background: "rgba(255,255,255,.04)",
            marginTop: 18,
          }}
        >
          <p style={eyebrow}>Operating Map</p>
          <h2 style={{ margin: "0 0 16px", fontSize: 28 }}>Clean execution path.</h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
            {[
              ["1. Submit", "Pain form and Create form stay. They feed the signal engine."],
              ["2. Signal", "Pain, projects, alerts, and routing all open the clean Signal Room first."],
              ["3. Communicate", "Message Owner should route to the real owner/submitter, with admin fallback only."],
              ["4. Execute", "Routing, intros, messages, and activity move the deal/problem toward resolution."],
            ].map(([heading, body]) => (
              <div
                key={heading}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  border: "1px solid rgba(255,255,255,.12)",
                  borderRadius: 18,
                  padding: 16,
                  background: "rgba(3,7,18,.36)",
                  color: "#cbd5e1",
                  lineHeight: 1.45,
                }}
              >
                <strong style={{ color: "#f8e7b0" }}>{heading}</strong>
                <span>{body}</span>
              </div>
            ))}
          </div>
        </section>

        <VaultForgeCommandFooter />
      </section>
    </main>
  );
}
