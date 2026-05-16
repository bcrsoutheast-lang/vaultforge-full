"use client";

import Link from "next/link";

function clean(value: unknown) {
  return String(value || "").trim();
}

type Match = {
  full_name?: string;
  email?: string;
  score?: number;
  reason?: string;
  role?: string;
};

export default function VaultForgeSignalCommandStack({
  signal = {},
  matches = [],
}: {
  signal?: Record<string, any>;
  matches?: Match[];
}) {
  const signalId = clean(
    signal.id ||
      signal.signal_id ||
      signal.item_id
  );

  const signalTitle =
    clean(
      signal.title ||
        signal.signal_title ||
        signal.name ||
        signal.address
    ) || "VaultForge Signal";

  const top = matches.slice(0, 4);
  const overflow = Math.max(0, matches.length - top.length);

  return (
    <section
      style={{
        border: "1px solid rgba(86,216,255,.22)",
        borderRadius: 24,
        padding: 18,
        marginTop: 18,
        background:
          "linear-gradient(145deg,rgba(86,216,255,.05),rgba(255,255,255,.03))",
      }}
    >
      <div
        style={{
          color: "#56d8ff",
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: ".16em",
          textTransform: "uppercase",
        }}
      >
        Signal Intelligence Command Stack
      </div>

      <h2
        style={{
          fontSize: "clamp(34px,6vw,62px)",
          lineHeight: 0.95,
          margin: "10px 0 14px",
          letterSpacing: "-.05em",
        }}
      >
        Signal routing intelligence.
      </h2>

      <p
        style={{
          color: "#cbd5e1",
          lineHeight: 1.6,
          marginTop: 0,
        }}
      >
        Signals now inherit the same institutional routing layer used inside
        Opportunity and Pressure Rooms.
      </p>

      <div
        style={{
          display: "grid",
          gap: 12,
        }}
      >
        {top.map((match, index) => {
          const lane =
            index === 0
              ? "Primary Match"
              : index === 1
              ? "Execution Fit"
              : index === 2
              ? "Capital Fit"
              : "Pressure Specialist";

          return (
            <article
              key={`${match.email}-${index}`}
              style={{
                border: "1px solid rgba(255,255,255,.12)",
                borderRadius: 18,
                padding: 14,
                background: "rgba(255,255,255,.035)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div
                    style={{
                      color: "#56d8ff",
                      fontSize: 11,
                      letterSpacing: ".16em",
                      textTransform: "uppercase",
                      fontWeight: 900,
                    }}
                  >
                    {lane}
                  </div>

                  <strong style={{ fontSize: 24 }}>
                    {clean(match.full_name || match.email || "VaultForge Member")}
                  </strong>

                  <p
                    style={{
                      color: "#cbd5e1",
                      margin: "6px 0 0",
                      lineHeight: 1.5,
                    }}
                  >
                    {clean(match.reason || "Signal intelligence fit")}
                  </p>
                </div>

                <div
                  style={{
                    minWidth: 62,
                    height: 58,
                    borderRadius: 16,
                    border: "1px solid rgba(86,216,255,.28)",
                    display: "grid",
                    placeItems: "center",
                    color: "#a7ecff",
                    fontWeight: 1000,
                    background: "rgba(86,216,255,.06)",
                    fontSize: 20,
                  }}
                >
                  {clean(match.score || "94")}%
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 12,
                }}
              >
                <Link
                  href={
                    `/messages/new?to=${encodeURIComponent(clean(match.email))}` +
                    `&room_title=${encodeURIComponent(signalTitle)}` +
                    `&room_type=${encodeURIComponent("Signal Room")}` +
                    `&room_id=${encodeURIComponent(signalId)}` +
                    `&source=${encodeURIComponent("signal-room")}` +
                    `&type=${encodeURIComponent("signal")}` +
                    `&source_route=${encodeURIComponent(`/signals/${signalId}`)}`
                  }
                  style={{
                    minHeight: 42,
                    borderRadius: 999,
                    padding: "10px 14px",
                    background:
                      "linear-gradient(135deg,#8fe8ff,#56d8ff)",
                    color: "#031118",
                    fontWeight: 900,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  Route Intro
                </Link>

                <Link
                  href="/network"
                  style={{
                    minHeight: 42,
                    borderRadius: 999,
                    padding: "10px 14px",
                    border: "1px solid rgba(255,255,255,.14)",
                    background: "rgba(255,255,255,.06)",
                    color: "white",
                    fontWeight: 900,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  Open Network
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      {overflow > 0 ? (
        <section
          style={{
            border: "1px solid rgba(255,255,255,.10)",
            borderRadius: 18,
            padding: 14,
            background: "rgba(255,255,255,.03)",
            marginTop: 14,
          }}
        >
          <div
            style={{
              color: "#56d8ff",
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: ".16em",
              textTransform: "uppercase",
            }}
          >
            Overflow Routing Hidden
          </div>

          <p
            style={{
              color: "#cbd5e1",
              margin: "8px 0 0",
              lineHeight: 1.5,
            }}
          >
            {overflow} additional signal-compatible members were hidden to keep
            the intelligence layer clean and readable.
          </p>
        </section>
      ) : null}
    </section>
  );
}
