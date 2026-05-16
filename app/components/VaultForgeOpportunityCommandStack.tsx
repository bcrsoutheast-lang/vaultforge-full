"use client";

import Link from "next/link";

function clean(value: unknown) {
  return String(value || "").trim();
}

type AnyProps = {
  lane?: string;
  room?: Record<string, any>;
  roomId?: string;
  title?: string;
  matches?: Array<Record<string, any>>;
  [key: string]: any;
};

export default function VaultForgeOpportunityCommandStack(props: AnyProps) {
  const {
    room = {},
    roomId = "",
    title = "AI Opportunity Match",
    matches = [],
  } = props || {};

  const finalRoomId =
    clean(roomId) ||
    clean(room.id || room.room_id || room.signal_id || room.item_id);

  const roomTitle =
    clean(
      room.title ||
        room.deal_title ||
        room.project_title ||
        room.headline ||
        room.address ||
        room.name
    ) || title;

  const visibleMatches = Array.isArray(matches) ? matches.slice(0, 4) : [];
  const overflow = Array.isArray(matches) ? Math.max(0, matches.length - visibleMatches.length) : 0;

  return (
    <section
      style={{
        border: "1px solid rgba(232,196,107,.22)",
        borderRadius: 24,
        padding: 18,
        marginTop: 18,
        background:
          "linear-gradient(145deg,rgba(232,196,107,.05),rgba(255,255,255,.03))",
      }}
    >
      <div
        style={{
          color: "#e8c46b",
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: ".16em",
          textTransform: "uppercase",
        }}
      >
        Opportunity Match Command Stack
      </div>

      <h2
        style={{
          fontSize: "clamp(34px,6vw,62px)",
          lineHeight: 0.95,
          margin: "10px 0 14px",
          letterSpacing: "-.05em",
        }}
      >
        Institutional member routing.
      </h2>

      <p
        style={{
          color: "#cbd5e1",
          lineHeight: 1.6,
          marginTop: 0,
        }}
      >
        VaultForge prioritizes capital, buyer, operator, and execution-fit members instead of flooding the room with clutter.
      </p>

      {visibleMatches.length ? (
        <div style={{ display: "grid", gap: 12 }}>
          {visibleMatches.map((match, index) => {
            const roleLabel =
              index === 0
                ? "Primary Match"
                : index === 1
                ? "Capital Fit"
                : index === 2
                ? "Buyer Fit"
                : "Operator Fit";

            const email = clean(match.email || match.member_email || match.user_email);
            const name = clean(match.full_name || match.name || match.display_name || email || "VaultForge Member");
            const reason = clean(match.reason || match.match_reason || "AI room fit");
            const score = clean(match.score || match.match_score || "92");

            const href =
              `/messages/new?to=${encodeURIComponent(email)}` +
              `&subject=${encodeURIComponent(roomTitle)}` +
              `&room_title=${encodeURIComponent(roomTitle)}` +
              `&title=${encodeURIComponent(roomTitle)}` +
              `&room_type=${encodeURIComponent("Opportunity Room")}` +
              `&room_id=${encodeURIComponent(finalRoomId)}` +
              `&item_id=${encodeURIComponent(finalRoomId)}` +
              `&source=${encodeURIComponent("opportunity-room")}` +
              `&type=${encodeURIComponent("opportunity")}` +
              `&folder=${encodeURIComponent("deals")}` +
              `&source_route=${encodeURIComponent(`/deal/detail?id=${finalRoomId}`)}` +
              `&match_reason=${encodeURIComponent(reason)}`;

            return (
              <article
                key={`${email || name}-${index}`}
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
                        color: "#e8c46b",
                        fontSize: 11,
                        letterSpacing: ".16em",
                        textTransform: "uppercase",
                        fontWeight: 900,
                      }}
                    >
                      {roleLabel}
                    </div>

                    <strong style={{ fontSize: 24 }}>{name}</strong>

                    <p
                      style={{
                        color: "#cbd5e1",
                        margin: "6px 0 0",
                        lineHeight: 1.5,
                      }}
                    >
                      {reason}
                    </p>
                  </div>

                  <div
                    style={{
                      minWidth: 62,
                      height: 58,
                      borderRadius: 16,
                      border: "1px solid rgba(232,196,107,.28)",
                      display: "grid",
                      placeItems: "center",
                      color: "#f8e7b0",
                      fontWeight: 1000,
                      background: "rgba(232,196,107,.06)",
                      fontSize: 20,
                    }}
                  >
                    {score}%
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
                    href={href}
                    style={{
                      minHeight: 42,
                      borderRadius: 999,
                      padding: "10px 14px",
                      background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
                      color: "#06100a",
                      fontWeight: 900,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    Request Intro
                  </Link>

                  <Link
                    href="/members"
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
      ) : (
        <section
          style={{
            border: "1px solid rgba(255,255,255,.12)",
            borderRadius: 18,
            padding: 14,
            background: "rgba(255,255,255,.035)",
          }}
        >
          <p style={{ color: "#cbd5e1", margin: 0, lineHeight: 1.5 }}>
            No opportunity matches are loaded yet. Network routing can populate this stack once room/member fit data is available.
          </p>
        </section>
      )}

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
              color: "#e8c46b",
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: ".16em",
              textTransform: "uppercase",
            }}
          >
            Overflow Matches Hidden
          </div>

          <p
            style={{
              color: "#cbd5e1",
              margin: "8px 0 0",
              lineHeight: 1.5,
            }}
          >
            {overflow} additional compatible members were hidden to prevent signal clutter in this opportunity room.
          </p>
        </section>
      ) : null}
    </section>
  );
}
