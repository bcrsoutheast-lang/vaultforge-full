"use client";

import Link from "next/link";

function clean(value: unknown) {
  return String(value || "").trim();
}

function encode(value: unknown) {
  return encodeURIComponent(clean(value));
}

export function buildRoomMessageHref({
  email,
  roomTitle,
  roomType,
  roomId,
  lane,
  sourceRoute,
  matchReason,
}: {
  email: string;
  roomTitle: string;
  roomType: string;
  roomId: string;
  lane: string;
  sourceRoute: string;
  matchReason: string;
}) {
  return (
    `/messages/new?to=${encode(email)}` +
    `&subject=${encode(roomTitle)}` +
    `&room_title=${encode(roomTitle)}` +
    `&title=${encode(roomTitle)}` +
    `&room_type=${encode(roomType)}` +
    `&room_id=${encode(roomId)}` +
    `&item_id=${encode(roomId)}` +
    `&source=${encode("room-match")}` +
    `&type=${encode(lane)}` +
    `&folder=${encode(lane === "pressure" ? "pain" : "deals")}` +
    `&source_route=${encode(sourceRoute)}` +
    `&match_reason=${encode(matchReason)}`
  );
}

export default function VaultForgeRoomMemberMatch({
  matches = [],
  room = {},
  lane = "opportunity",
}: {
  matches?: any[];
  room?: Record<string, any>;
  lane?: string;
}) {
  const roomId = clean(room.id || room.room_id || room.signal_id || room.item_id);
  const roomTitle = clean(
    room.title ||
      room.deal_title ||
      room.pain_title ||
      room.address ||
      "VaultForge Room"
  );

  const roomType =
    lane === "pressure" ? "Pressure Room" : "Opportunity Room";

  const sourceRoute =
    lane === "pressure"
      ? `/pain-room/${roomId}`
      : `/deal/detail?id=${roomId}`;

  return (
    <section
      style={{
        border: "1px solid rgba(232,196,107,.24)",
        borderRadius: 24,
        padding: 18,
        background:
          "linear-gradient(145deg,rgba(232,196,107,.05),rgba(255,255,255,.03))",
      }}
    >
      <div
        style={{
          color: "#e8c46b",
          fontSize: 11,
          letterSpacing: ".16em",
          textTransform: "uppercase",
          fontWeight: 900,
        }}
      >
        AI MATCH COMMAND STACK
      </div>

      <h2
        style={{
          fontSize: "clamp(34px,6vw,62px)",
          lineHeight: 0.95,
          margin: "10px 0 16px",
          letterSpacing: "-.05em",
        }}
      >
        Suggested members for this room.
      </h2>

      <div
        style={{
          display: "grid",
          gap: 14,
        }}
      >
        {matches.map((match: any, index: number) => {
          const email = clean(match.email);
          const fullName = clean(match.full_name || match.name || email);
          const reason = clean(match.reason || match.match_reason || "AI room fit");

          const href = buildRoomMessageHref({
            email,
            roomTitle,
            roomType,
            roomId,
            lane,
            sourceRoute,
            matchReason: reason,
          });

          return (
            <article
              key={`${email}-${index}`}
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
                  <strong style={{ fontSize: 22 }}>{fullName}</strong>

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

                <Link
                  href={href}
                  style={{
                    minHeight: 44,
                    borderRadius: 999,
                    padding: "10px 14px",
                    background:
                      "linear-gradient(135deg,#f8e7b0,#e8c46b)",
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
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
