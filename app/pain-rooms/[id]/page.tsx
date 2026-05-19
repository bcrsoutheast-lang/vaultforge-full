"use client";

import React from "react";

type Room = {
  id: string;
  title: string;
  city: string;
  state: string;
  severity: string;
  needs: string[];
  notes: string;
};

function getRoom(id: string): Room {
  if (typeof window === "undefined") {
    return {
      id,
      title: "Pain Room",
      city: "Unknown",
      state: "GA",
      severity: "Medium",
      needs: [],
      notes: "",
    };
  }

  try {
    const raw = localStorage.getItem("vf_pain_rooms");
    const rooms = raw ? JSON.parse(raw) : [];
    const found = rooms.find((r: any) => r.id === id);

    return (
      found || {
        id,
        title: "Pain Room",
        city: "Unknown",
        state: "GA",
        severity: "Medium",
        needs: [],
        notes: "",
      }
    );
  } catch {
    return {
      id,
      title: "Pain Room",
      city: "Unknown",
      state: "GA",
      severity: "Medium",
      needs: [],
      notes: "",
    };
  }
}

function buildPainIntel(room: Room) {
  const severityMap: Record<string, string> = {
    Low: "Monitor",
    Medium: "Active",
    High: "Urgent",
    Critical: "Immediate Attention",
  };

  return {
    urgency: severityMap[room.severity] || "Active",
    routing:
      room.needs.length > 0
        ? room.needs.join(", ")
        : "Lender, Operator, Contractor",
    summary:
      room.notes ||
      "AI routing engine detected operational pressure and recommends immediate network review.",
  };
}

export default function PainRoomPage({
  params,
}: {
  params: { id: string };
}) {
  const room = getRoom(params.id);
  const intel = buildPainIntel(room);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#05070d",
        color: "#f3f4f6",
        padding: 24,
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gap: 24,
        }}
      >
        <section
          style={{
            border: "1px solid rgba(255,215,0,.25)",
            borderRadius: 24,
            padding: 28,
            background:
              "linear-gradient(135deg, rgba(10,14,30,.96), rgba(5,7,13,.98))",
          }}
        >
          <div
            style={{
              color: "#f5d15f",
              letterSpacing: 6,
              fontWeight: 800,
              marginBottom: 18,
            }}
          >
            PAIN ROOM
          </div>

          <h1
            style={{
              fontSize: 54,
              lineHeight: 1,
              margin: 0,
              fontWeight: 900,
            }}
          >
            {room.title}
          </h1>

          <p
            style={{
              marginTop: 18,
              color: "#b8c0d4",
              fontSize: 20,
            }}
          >
            {room.city}, {room.state}
          </p>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
            gap: 20,
          }}
        >
          <div
            style={{
              border: "1px solid rgba(255,215,0,.15)",
              borderRadius: 20,
              padding: 22,
              background: "#0c1222",
            }}
          >
            <div style={{ color: "#f5d15f", letterSpacing: 4 }}>
              AI URGENCY
            </div>

            <h2 style={{ fontSize: 36 }}>{intel.urgency}</h2>
          </div>

          <div
            style={{
              border: "1px solid rgba(255,215,0,.15)",
              borderRadius: 20,
              padding: 22,
              background: "#0c1222",
            }}
          >
            <div style={{ color: "#f5d15f", letterSpacing: 4 }}>
              NETWORK ROUTING
            </div>

            <h2 style={{ fontSize: 28 }}>{intel.routing}</h2>
          </div>
        </section>

        <section
          style={{
            border: "1px solid rgba(255,215,0,.15)",
            borderRadius: 20,
            padding: 22,
            background: "#0c1222",
          }}
        >
          <div
            style={{
              color: "#f5d15f",
              letterSpacing: 4,
              marginBottom: 14,
            }}
          >
            AI INTELLIGENCE SUMMARY
          </div>

          <p
            style={{
              color: "#c8d1e4",
              fontSize: 18,
              lineHeight: 1.7,
            }}
          >
            {intel.summary}
          </p>
        </section>
      </div>
    </main>
  );
}
