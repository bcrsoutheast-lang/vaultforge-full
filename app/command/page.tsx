"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type QueueStats = {
  unrouted: number;
  pendingResponses: number;
  stalled: number;
};

export default function CommandPage() {
  const [criticalCount, setCriticalCount] = useState(0);
  const [queue, setQueue] = useState<QueueStats>({
    unrouted: 0,
    pendingResponses: 0,
    stalled: 0,
  });

  useEffect(() => {
    function load() {
      try {
        const deals = JSON.parse(localStorage.getItem("vaultforge_clean_deal_rooms") || "[]");
        const pains = JSON.parse(localStorage.getItem("vaultforge_clean_pain_rooms_v1") || "[]");

        const all = [...deals, ...pains];

        const critical = all.filter((r: any) => {
          const text = JSON.stringify(r).toLowerCase();
          return (
            text.includes("foreclosure") ||
            text.includes("auction") ||
            text.includes("emergency") ||
            text.includes("critical") ||
            text.includes("tax sale")
          );
        }).length;

        const unrouted = all.filter((r: any) => {
          const routeTo = r.routeTo || r.routedTo || r.routingNeeds;
          return !routeTo || (Array.isArray(routeTo) && !routeTo.length);
        }).length;

        const pending = all.filter((r: any) => {
          return r.messagePending || r.awaitingResponse;
        }).length;

        const stalled = all.filter((r: any) => {
          return r.stalled || r.noActivity;
        }).length;

        setCriticalCount(critical);
        setQueue({
          unrouted,
          pendingResponses: pending,
          stalled,
        });
      } catch (e) {
        console.error(e);
      }
    }

    load();

    const interval = setInterval(load, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main style={page}>
      <style>{`
        @keyframes pulseRed {
          0% { box-shadow: 0 0 0 0 rgba(255,50,50,.55); }
          70% { box-shadow: 0 0 0 14px rgba(255,50,50,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,50,50,0); }
        }

        @keyframes pulseGold {
          0% { box-shadow: 0 0 0 0 rgba(255,215,90,.35); }
          70% { box-shadow: 0 0 0 14px rgba(255,215,90,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,215,90,0); }
        }
      `}</style>

      <div style={wrap}>
        <nav style={nav}>
          <div style={brand}>VAULTFORGE</div>

          <Link href="/command" style={goldBtn}>Command</Link>
          <Link href="/deal-rooms" style={btn}>Deal Rooms</Link>
          <Link href="/pain-rooms" style={btn}>Pain Rooms</Link>
          <Link href="/messages" style={btn}>Messages</Link>
          <Link href="/profile" style={btn}>Profile</Link>
          <Link href="/logout" style={redBtn}>Logout</Link>
        </nav>

        {criticalCount > 0 ? (
          <section style={criticalBanner}>
            <div style={criticalDot} />
            <div>
              <div style={eyebrow}>Critical Pressure</div>
              <div style={criticalText}>
                {criticalCount} room(s) require immediate attention.
              </div>
            </div>
          </section>
        ) : null}

        <section style={hero}>
          <div style={eyebrow}>AI Routing Queue</div>

          <h1 style={heroTitle}>
            Routing + execution oversight.
          </h1>

          <p style={heroSub}>
            Active operational intelligence layer for pending routing,
            responses, and stalled execution.
          </p>
        </section>

        <section style={grid}>
          <div style={{ ...ticket, animation: "pulseGold 2s infinite" }}>
            <div style={ticketLabel}>Unrouted Rooms</div>
            <div style={ticketNumber}>{queue.unrouted}</div>
            <p style={ticketSub}>
              Rooms waiting for AI/member routing.
            </p>
          </div>

          <div style={{ ...ticket, animation: "pulseGold 2s infinite" }}>
            <div style={ticketLabel}>Pending Responses</div>
            <div style={ticketNumber}>{queue.pendingResponses}</div>
            <p style={ticketSub}>
              Rooms awaiting member response.
            </p>
          </div>

          <div style={{ ...ticket, animation: "pulseRed 2s infinite" }}>
            <div style={ticketLabel}>Stalled Rooms</div>
            <div style={ticketNumber}>{queue.stalled}</div>
            <p style={ticketSub}>
              Rooms needing escalation or action.
            </p>
          </div>
        </section>

        <section style={nextSection}>
          <div style={eyebrow}>Next Locked Phase</div>

          <h2 style={nextTitle}>
            Room Hydration Phase
          </h2>

          <div style={listWrap}>
            <div style={listCard}>
              <div style={listTitle}>Deal Rooms</div>

              <ul style={list}>
                <li>AI underwriting snapshot</li>
                <li>Spread analysis</li>
                <li>Buyer/lender/operator fit</li>
                <li>Risk + urgency scoring</li>
                <li>Execution path</li>
                <li>Best next move</li>
              </ul>
            </div>

            <div style={listCard}>
              <div style={listTitle}>Pain Rooms</div>

              <ul style={list}>
                <li>Severity meter</li>
                <li>Pressure analysis</li>
                <li>Solution pathing</li>
                <li>Ideal solver profile</li>
                <li>Funding pressure</li>
                <li>Escalation logic</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#05070d",
  color: "#f8fafc",
  padding: 18,
  fontFamily:
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const wrap: React.CSSProperties = {
  maxWidth: 1400,
  margin: "0 auto",
  paddingBottom: 120,
};

const nav: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
  marginBottom: 20,
};

const brand: React.CSSProperties = {
  color: "#ffd45a",
  fontWeight: 900,
  fontSize: 28,
  marginRight: 10,
};

const btn: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 999,
  padding: "12px 18px",
  textDecoration: "none",
  color: "#f8fafc",
  background: "#121826",
  fontWeight: 800,
};

const goldBtn: React.CSSProperties = {
  ...btn,
  background: "#ffd45a",
  color: "#111",
  border: 0,
};

const redBtn: React.CSSProperties = {
  ...btn,
  background: "#291116",
  color: "#ffb4b4",
  border: "1px solid rgba(255,70,70,.45)",
};

const hero: React.CSSProperties = {
  border: "1px solid rgba(255,215,90,.22)",
  borderRadius: 28,
  padding: 34,
  marginBottom: 22,
  background:
    "radial-gradient(circle at top right, rgba(255,215,90,.14), transparent 30%), linear-gradient(180deg,#080d19,#050816)",
};

const heroTitle: React.CSSProperties = {
  fontSize: "clamp(44px,8vw,88px)",
  lineHeight: .9,
  letterSpacing: -4,
  margin: "0 0 16px",
  fontWeight: 950,
};

const heroSub: React.CSSProperties = {
  color: "#cbd5e1",
  fontSize: 20,
  lineHeight: 1.4,
  maxWidth: 900,
};

const eyebrow: React.CSSProperties = {
  color: "#ffd45a",
  textTransform: "uppercase",
  letterSpacing: 6,
  fontWeight: 900,
  fontSize: 13,
  marginBottom: 14,
};

const criticalBanner: React.CSSProperties = {
  display: "flex",
  gap: 16,
  alignItems: "center",
  borderRadius: 20,
  padding: 20,
  marginBottom: 20,
  background: "#2a0f12",
  border: "1px solid rgba(255,70,70,.45)",
  animation: "pulseRed 2s infinite",
};

const criticalDot: React.CSSProperties = {
  width: 18,
  height: 18,
  borderRadius: 999,
  background: "#ff4444",
};

const criticalText: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 900,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 18,
  marginBottom: 24,
};

const ticket: React.CSSProperties = {
  background: "linear-gradient(180deg,#08101d,#050816)",
  borderRadius: 24,
  padding: 28,
  border: "1px solid rgba(255,215,90,.18)",
};

const ticketLabel: React.CSSProperties = {
  color: "#ffd45a",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: 5,
  marginBottom: 10,
};

const ticketNumber: React.CSSProperties = {
  fontSize: 64,
  lineHeight: 1,
  fontWeight: 950,
  marginBottom: 12,
};

const ticketSub: React.CSSProperties = {
  color: "#cbd5e1",
  lineHeight: 1.5,
};

const nextSection: React.CSSProperties = {
  background: "linear-gradient(180deg,#08101d,#050816)",
  borderRadius: 28,
  padding: 34,
  border: "1px solid rgba(255,215,90,.18)",
};

const nextTitle: React.CSSProperties = {
  fontSize: "clamp(34px,5vw,54px)",
  fontWeight: 950,
  margin: "0 0 20px",
};

const listWrap: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 18,
};

const listCard: React.CSSProperties = {
  background: "#111827",
  borderRadius: 24,
  padding: 24,
  border: "1px solid rgba(255,255,255,.08)",
};

const listTitle: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 900,
  marginBottom: 14,
};

const list: React.CSSProperties = {
  color: "#cbd5e1",
  lineHeight: 1.9,
};
