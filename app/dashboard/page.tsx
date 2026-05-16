"use client";

import Link from "next/link";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

type SignalCard = {
  title: string;
  value: string;
  color: string;
  href: string;
  eyebrow: string;
};

const signalCards: SignalCard[] = [
  {
    title: "Opportunity Rooms",
    value: "12 Active",
    color: "#38bdf8",
    href: "/opportunity-rooms",
    eyebrow: "Upside",
  },
  {
    title: "Pressure Rooms",
    value: "4 Critical",
    color: "#fb7185",
    href: "/pressure-rooms",
    eyebrow: "Fix",
  },
  {
    title: "Routing",
    value: "9 Member Matches",
    color: "#a78bfa",
    href: "/routing-inbox",
    eyebrow: "Match Flow",
  },
  {
    title: "Alerts",
    value: "14 Unread",
    color: "#39ff14",
    href: "/alerts?lane=new",
    eyebrow: "Triggers",
  },
  {
    title: "Messages",
    value: "6 Active Threads",
    color: "#facc15",
    href: "/message-command",
    eyebrow: "Comms",
  },
  {
    title: "Intelligence",
    value: "3 New Rewrites",
    color: "#67e8f9",
    href: "/intelligence",
    eyebrow: "AI",
  },
];

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.12), transparent 30%), radial-gradient(circle at 88% 8%, rgba(86,216,255,.10), transparent 25%), linear-gradient(180deg,#020617,#071326 55%,#020617)",
  color: "white",
  padding: "22px 16px 96px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  width: "min(1180px,100%)",
  margin: "0 auto",
};

const panel: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.22)",
  borderRadius: 30,
  padding: 24,
  background: "linear-gradient(145deg,rgba(255,255,255,.070),rgba(255,255,255,.030))",
  boxShadow: "0 28px 86px rgba(0,0,0,.30)",
  marginBottom: 22,
};

const label: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

function SignalTile({ card }: { card: SignalCard }) {
  return (
    <Link
      href={card.href}
      style={{
        border: `1px solid ${card.color}55`,
        borderRadius: 24,
        padding: 22,
        minHeight: 154,
        background: "linear-gradient(180deg,rgba(15,23,42,.92),rgba(2,6,23,.96))",
        boxShadow: `0 0 22px ${card.color}22`,
        color: "white",
        textDecoration: "none",
        display: "block",
      }}
    >
      <div
        style={{
          color: card.color,
          fontSize: 12,
          letterSpacing: ".16em",
          fontWeight: 950,
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        Live Signal
      </div>

      <div
        style={{
          color: "rgba(255,255,255,.55)",
          fontSize: 11,
          letterSpacing: ".14em",
          fontWeight: 950,
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        {card.eyebrow}
      </div>

      <div
        style={{
          fontSize: "clamp(30px,5vw,46px)",
          lineHeight: 1,
          fontWeight: 950,
          marginBottom: 16,
          letterSpacing: "-.045em",
        }}
      >
        {card.title}
      </div>

      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 14px",
          borderRadius: 999,
          border: `1px solid ${card.color}66`,
          color: card.color,
          fontWeight: 950,
          background: `${card.color}10`,
        }}
      >
        ● {card.value}
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        @media(max-width:760px) {
          .vf-signal-grid {
            grid-template-columns: 1fr !important;
          }

          .vf-quick-actions {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav
          title="Command Center"
          subtitle="Members get full VaultForge: rooms, intelligence, messages, network, alerts, and profile. Owner controls stay hidden."
          active="dashboard"
        />

        <section style={panel}>
          <div style={label}>VaultForge Command</div>

          <h1
            style={{
              margin: "12px 0 16px",
              fontSize: "clamp(54px,10vw,104px)",
              lineHeight: 0.88,
              letterSpacing: "-.075em",
              fontWeight: 950,
            }}
          >
            Live operational radar.
          </h1>

          <p
            style={{
              color: "rgba(255,255,255,.72)",
              margin: 0,
              lineHeight: 1.7,
              fontSize: 20,
              maxWidth: 920,
            }}
          >
            Dashboard is a signal surface, not a storage feed. Click a signal tile to enter the correct room, folder, or command lane.
          </p>
        </section>

        <section
          className="vf-signal-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,minmax(0,1fr))",
            gap: 18,
            marginBottom: 22,
          }}
        >
          {signalCards.map((card) => (
            <SignalTile key={card.title} card={card} />
          ))}
        </section>

        <section
          style={{
            border: "1px solid rgba(57,255,20,.26)",
            background: "rgba(57,255,20,.06)",
            borderRadius: 22,
            padding: 18,
            marginBottom: 22,
            boxShadow: "0 0 24px rgba(57,255,20,.10)",
          }}
        >
          <div
            style={{
              color: "#39ff14",
              fontWeight: 950,
              letterSpacing: ".14em",
              fontSize: 12,
              marginBottom: 10,
              textTransform: "uppercase",
            }}
          >
            Routing Intelligence Notice
          </div>

          <p
            style={{
              margin: 0,
              color: "#d9ffd0",
              lineHeight: 1.7,
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            VaultForge may route the same signal into multiple operational lanes when opportunities match several execution categories, pressure conditions, routing triggers, or member fit profiles.
          </p>
        </section>

        <section style={panel}>
          <div style={label}>Quick Command</div>

          <h2
            style={{
              margin: "10px 0 16px",
              fontSize: "clamp(38px,7vw,74px)",
              lineHeight: 0.9,
              letterSpacing: "-.06em",
            }}
          >
            Enter the desk.
          </h2>

          <div
            className="vf-quick-actions"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,minmax(0,1fr))",
              gap: 12,
            }}
          >
            {[
              ["Submit Opportunity", "/submit"],
              ["Submit Pain", "/pain"],
              ["Network", "/network"],
              ["Profile", "/profile"],
            ].map(([name, href]) => (
              <Link
                key={name}
                href={href}
                style={{
                  border: "1px solid rgba(255,255,255,.14)",
                  borderRadius: 18,
                  padding: 16,
                  color: "white",
                  textDecoration: "none",
                  fontWeight: 950,
                  background: "rgba(255,255,255,.045)",
                }}
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
