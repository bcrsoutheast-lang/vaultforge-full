// FULL REPLACEMENT FILE
// app/message-command/page.tsx

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type LaneTotals = {
  conversations: number;
  messages: number;
  unread: number;
};

export default function MessageCommandPage() {
  const [openLane, setOpenLane] = useState<string | null>(null);

  const lanes = useMemo(
    () => [
      {
        key: "alerts",
        title: "Alerts",
        description: "Alert follow-up, owner requests, and urgent message traffic.",
        totals: { conversations: 0, messages: 0, unread: 0 } as LaneTotals,
      },
      {
        key: "pain",
        title: "Pain",
        description: "Pain signal conversations and problem-routing follow-up.",
        totals: { conversations: 2, messages: 2, unread: 2 } as LaneTotals,
      },
      {
        key: "signals",
        title: "Signals",
        description: "Signal-room messages and intelligence follow-up.",
        totals: { conversations: 0, messages: 0, unread: 0 } as LaneTotals,
      },
      {
        key: "routing",
        title: "Routing",
        description: "Routing requests, member-fit paths, and execution handoffs.",
        totals: { conversations: 0, messages: 0, unread: 0 } as LaneTotals,
      },
      {
        key: "introductions",
        title: "Introductions",
        description: "Controlled introduction conversations.",
        totals: { conversations: 0, messages: 0, unread: 0 } as LaneTotals,
      },
      {
        key: "projects",
        title: "Projects",
        description: "Project and deal-room communication.",
        totals: { conversations: 0, messages: 0, unread: 0 } as LaneTotals,
      },
    ],
    []
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 28%), linear-gradient(180deg,#030509,#071326 55%,#030509)",
        color: "white",
        padding: 20,
        fontFamily: "Inter, sans-serif",
      }}
    >
      <section
        style={{
          border: "1px solid rgba(232,196,107,.16)",
          borderRadius: 28,
          padding: 24,
          marginBottom: 28,
          background: "rgba(9,15,28,.88)",
        }}
      >
        <div
          style={{
            color: "#e8c46b",
            letterSpacing: 2,
            textTransform: "uppercase",
            fontWeight: 900,
            fontSize: 13,
            marginBottom: 10,
          }}
        >
          VaultForge Messaging
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: 72,
            lineHeight: 0.95,
            fontWeight: 950,
          }}
        >
          Conversation
          <br />
          Command.
        </h1>

        <p
          style={{
            color: "rgba(255,255,255,.72)",
            fontSize: 22,
            lineHeight: 1.7,
            maxWidth: 900,
            marginTop: 20,
          }}
        >
          Open by category. Every route has its own communication lane,
          unread count, and execution thread.
        </p>
      </section>

      {!openLane ? (
        <section>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
              gap: 22,
            }}
          >
            {lanes.map((lane) => (
              <button
                key={lane.key}
                onClick={() => setOpenLane(lane.key)}
                style={{
                  border: "1px solid rgba(255,255,255,.08)",
                  borderRadius: 26,
                  padding: 24,
                  background: "rgba(8,14,26,.92)",
                  textAlign: "left",
                  cursor: "pointer",
                  color: "white",
                }}
              >
                <div
                  style={{
                    color: "#38bdf8",
                    fontWeight: 900,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    marginBottom: 16,
                  }}
                >
                  {lane.title}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 18,
                  }}
                >
                  <div
                    style={{
                      fontSize: 52,
                      fontWeight: 950,
                    }}
                  >
                    {lane.totals.messages}
                  </div>

                  <div
                    style={{
                      background:
                        lane.totals.unread > 0
                          ? "rgba(248,113,113,.14)"
                          : "rgba(255,255,255,.05)",
                      border:
                        lane.totals.unread > 0
                          ? "1px solid rgba(248,113,113,.35)"
                          : "1px solid rgba(255,255,255,.08)",
                      borderRadius: 999,
                      padding: "8px 14px",
                      fontWeight: 900,
                      color:
                        lane.totals.unread > 0 ? "#fecaca" : "rgba(255,255,255,.7)",
                    }}
                  >
                    {lane.totals.unread} unread
                  </div>
                </div>

                <div
                  style={{
                    color: "rgba(255,255,255,.7)",
                    lineHeight: 1.7,
                    fontSize: 17,
                  }}
                >
                  {lane.description}
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section
          style={{
            border: "1px solid rgba(255,255,255,.08)",
            borderRadius: 28,
            padding: 24,
            background: "rgba(8,14,26,.92)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 14,
              flexWrap: "wrap",
              marginBottom: 24,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 48,
                fontWeight: 950,
              }}
            >
              {openLane} lane
            </h2>

            <button
              onClick={() => setOpenLane(null)}
              style={{
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,.12)",
                background: "transparent",
                color: "white",
                padding: "12px 20px",
                cursor: "pointer",
                fontWeight: 900,
              }}
            >
              Close / Back To Cards
            </button>
          </div>

          <div
            style={{
              border: "1px solid rgba(255,255,255,.08)",
              borderRadius: 22,
              padding: 20,
              background: "rgba(255,255,255,.03)",
            }}
          >
            <div
              style={{
                fontSize: 34,
                fontWeight: 900,
                marginBottom: 14,
              }}
            >
              Inquiry on Mountain Lion
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginBottom: 18,
              }}
            >
              <span style={pill}>Messages: 2</span>
              <span style={unreadPill}>Unread: 2</span>
            </div>

            <div
              style={{
                color: "rgba(255,255,255,.78)",
                fontSize: 18,
                lineHeight: 1.7,
                marginBottom: 24,
              }}
            >
              Need more information on this opportunity.
            </div>

            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <Link href="/message-command/thread-demo" style={buttonPrimary}>
                Open Messages
              </Link>

              <button style={buttonGhost}>Mark Read</button>
              <button style={buttonGhost}>Save</button>
              <button style={buttonDanger}>Archive</button>
              <button style={buttonDanger}>Delete</button>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

const pill: React.CSSProperties = {
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,.12)",
  padding: "8px 12px",
  color: "#dbeafe",
  fontSize: 13,
};

const unreadPill: React.CSSProperties = {
  ...pill,
  color: "#fecaca",
  border: "1px solid rgba(248,113,113,.32)",
  background: "rgba(248,113,113,.12)",
  fontWeight: 900,
};

const buttonPrimary: React.CSSProperties = {
  background: "#f5d97b",
  color: "#111",
  borderRadius: 999,
  padding: "14px 22px",
  textDecoration: "none",
  fontWeight: 900,
};

const buttonGhost: React.CSSProperties = {
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,.12)",
  background: "transparent",
  color: "white",
  padding: "14px 22px",
  fontWeight: 900,
  cursor: "pointer",
};

const buttonDanger: React.CSSProperties = {
  borderRadius: 999,
  border: "1px solid rgba(248,113,113,.32)",
  background: "rgba(248,113,113,.08)",
  color: "#fecaca",
  padding: "14px 22px",
  fontWeight: 900,
  cursor: "pointer",
};
