
"use client";

export default function DashboardPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(232,196,107,.10), transparent 30%), linear-gradient(180deg,#020617,#071326 55%,#020617)",
        color: "white",
        padding: 18,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <section
        style={{
          border: "1px solid rgba(232,196,107,.22)",
          borderRadius: 28,
          padding: 24,
          marginBottom: 24,
          background:
            "linear-gradient(135deg, rgba(232,196,107,.10), rgba(8,15,30,.92))",
        }}
      >
        <div
          style={{
            color: "#e8c46b",
            letterSpacing: ".28em",
            fontWeight: 900,
            fontSize: 12,
            marginBottom: 10,
          }}
        >
          VAULTFORGE COMMAND
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: 62,
            lineHeight: 0.95,
            fontWeight: 900,
          }}
        >
          Live operational radar.
        </h1>

        <p
          style={{
            color: "rgba(255,255,255,.72)",
            marginTop: 20,
            lineHeight: 1.7,
            fontSize: 18,
            maxWidth: 900,
          }}
        >
          Dashboard is now a signal surface instead of a storage feed.
          Rooms, folders, and workstations contain the operational deal flow.
        </p>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 18,
          marginBottom: 24,
        }}
      >
        {[
          ["Opportunity Rooms", "12 Active", "#38bdf8"],
          ["Pressure Rooms", "4 Critical", "#fb7185"],
          ["Routing", "9 Member Matches", "#a78bfa"],
          ["Alerts", "14 Unread", "#39ff14"],
          ["Messages", "6 Active Threads", "#facc15"],
          ["Intelligence", "3 New Rewrites", "#67e8f9"],
        ].map(([title, value, glow]) => (
          <div
            key={title}
            style={{
              border: `1px solid ${glow}55`,
              borderRadius: 24,
              padding: 20,
              background:
                "linear-gradient(180deg, rgba(15,23,42,.92), rgba(2,6,23,.96))",
              boxShadow: `0 0 22px ${glow}22`,
            }}
          >
            <div
              style={{
                color: glow,
                fontSize: 12,
                letterSpacing: ".16em",
                fontWeight: 900,
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Live Signal
            </div>

            <div
              style={{
                fontSize: 30,
                fontWeight: 900,
                marginBottom: 10,
              }}
            >
              {title}
            </div>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                borderRadius: 999,
                border: `1px solid ${glow}66`,
                color: glow,
                fontWeight: 800,
              }}
            >
              ● {value}
            </div>
          </div>
        ))}
      </section>

      <section
        style={{
          border: "1px solid rgba(57,255,20,.26)",
          background: "rgba(57,255,20,.06)",
          borderRadius: 22,
          padding: 18,
        }}
      >
        <div
          style={{
            color: "#39ff14",
            fontWeight: 900,
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
            fontWeight: 600,
          }}
        >
          VaultForge may route the same signal into multiple operational lanes
          when opportunities match several execution categories, pressure
          conditions, routing triggers, or member fit profiles.
        </p>
      </section>
    </main>
  );
}
