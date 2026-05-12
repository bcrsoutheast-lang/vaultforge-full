// FULL REPLACEMENT FILE
// app/signals/[signalId]/page.tsx

import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function SignalRoomPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(232,196,107,.12), transparent 28%), linear-gradient(180deg,#030509,#071326 55%,#030509)",
        color: "white",
        padding: 20,
        fontFamily: "Inter, sans-serif",
      }}
    >
      <section
        style={{
          border: "1px solid rgba(232,196,107,.18)",
          borderRadius: 28,
          padding: 24,
          background: "rgba(9,15,28,.88)",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontSize: 14,
            letterSpacing: 2,
            color: "#e8c46b",
            marginBottom: 10,
            textTransform: "uppercase",
            fontWeight: 800,
          }}
        >
          VaultForge Signal Room
        </div>

        <h1
          style={{
            fontSize: 54,
            lineHeight: 1,
            margin: 0,
            fontWeight: 900,
          }}
        >
          Signal Intelligence.
        </h1>

        <p
          style={{
            marginTop: 18,
            color: "rgba(255,255,255,.72)",
            fontSize: 18,
            lineHeight: 1.6,
            maxWidth: 900,
          }}
        >
          Operational signal routing, communication, execution pressure,
          activity tracking, and member coordination.
        </p>
      </section>

      <section
        style={{
          border: "1px solid rgba(255,255,255,.08)",
          borderRadius: 24,
          padding: 20,
          marginBottom: 24,
          background: "rgba(10,16,28,.86)",
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: 38 }}>AI Summary</h2>

        <div
          style={{
            background: "rgba(255,255,255,.03)",
            borderRadius: 18,
            padding: 18,
            border: "1px solid rgba(255,255,255,.08)",
            color: "rgba(255,255,255,.82)",
            lineHeight: 1.8,
            fontSize: 17,
          }}
        >
          This room consolidates the signal into one operational view. The
          routing layer should rank matching members, explain strategic fit,
          track communication flow, and coordinate execution movement.
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            marginTop: 18,
          }}
        >
          <div
            style={{
              background: "#f5d97b",
              color: "#111",
              padding: "8px 14px",
              borderRadius: 999,
              fontWeight: 800,
            }}
          >
            Signal Score: 75
          </div>

          <div
            style={{
              background: "#f5d97b",
              color: "#111",
              padding: "8px 14px",
              borderRadius: 999,
              fontWeight: 800,
            }}
          >
            Routing: 0
          </div>

          <div
            style={{
              background: "#f5d97b",
              color: "#111",
              padding: "8px 14px",
              borderRadius: 999,
              fontWeight: 800,
            }}
          >
            Messages: 0
          </div>
        </div>
      </section>

      <section
        style={{
          border: "1px solid rgba(255,255,255,.08)",
          borderRadius: 24,
          padding: 20,
          background: "rgba(10,16,28,.86)",
          marginBottom: 24,
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: 38 }}>
          Photos / Asset Context
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
            gap: 18,
          }}
        >
          {[
            "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=1200&auto=format&fit=crop",
          ]
            .filter((url) => {
              const value = String(url || "").trim().toLowerCase();

              if (!value) return false;
              if (value === "null") return false;
              if (value === "undefined") return false;
              if (value.includes("[object object]")) return false;

              return value.startsWith("http");
            })
            .map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "block",
                  borderRadius: 20,
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,.08)",
                  background: "#05070c",
                }}
              >
                <img
                  src={url}
                  alt="VaultForge signal asset"
                  style={{
                    width: "100%",
                    height: 280,
                    objectFit: "cover",
                    display: "block",
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </a>
            ))}
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
          gap: 20,
        }}
      >
        {[
          {
            title: "Routing Actions",
            body: "No routing actions connected yet.",
          },
          {
            title: "Messages",
            body: "No message thread connected yet. Use Message Command to start communication.",
          },
          {
            title: "Activity",
            body: "No activity events connected yet.",
          },
          {
            title: "Alerts",
            body: "No alerts connected yet.",
          },
        ].map((card) => (
          <div
            key={card.title}
            style={{
              border: "1px solid rgba(255,255,255,.08)",
              borderRadius: 24,
              padding: 22,
              background: "rgba(10,16,28,.86)",
            }}
          >
            <h3 style={{ marginTop: 0, fontSize: 34 }}>{card.title}</h3>

            <p
              style={{
                color: "rgba(255,255,255,.72)",
                lineHeight: 1.7,
                fontSize: 17,
              }}
            >
              {card.body}
            </p>
          </div>
        ))}
      </section>

      <div
        style={{
          display: "flex",
          gap: 14,
          flexWrap: "wrap",
          marginTop: 30,
        }}
      >
        <Link
          href="/message-command"
          style={{
            background: "#f5d97b",
            color: "#111",
            padding: "14px 22px",
            borderRadius: 999,
            textDecoration: "none",
            fontWeight: 900,
          }}
        >
          Open Message Command
        </Link>

        <Link
          href="/alerts"
          style={{
            border: "1px solid rgba(255,255,255,.12)",
            color: "white",
            padding: "14px 22px",
            borderRadius: 999,
            textDecoration: "none",
            fontWeight: 800,
          }}
        >
          Back To Alerts
        </Link>
      </div>
    </main>
  );
}
