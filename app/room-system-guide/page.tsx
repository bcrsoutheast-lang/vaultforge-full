"use client";

import Link from "next/link";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 28%), radial-gradient(circle at 88% 8%, rgba(56,189,248,.11), transparent 26%), radial-gradient(circle at 62% 54%, rgba(157,243,191,.075), transparent 28%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  width: "min(1180px,100%)",
  margin: "0 auto",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.24)",
  borderRadius: 30,
  background: "linear-gradient(145deg,rgba(255,255,255,.070),rgba(255,255,255,.030))",
  padding: 24,
  marginBottom: 20,
  boxShadow: "0 28px 86px rgba(0,0,0,.30)",
};

const glass: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 24,
  padding: 20,
  background: "rgba(255,255,255,.045)",
};

const label: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

const muted: React.CSSProperties = {
  color: "#cbd5e1",
  lineHeight: 1.55,
};

const button: React.CSSProperties = {
  minHeight: 50,
  borderRadius: 999,
  padding: "13px 18px",
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
  fontWeight: 950,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const ghost: React.CSSProperties = {
  ...button,
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(255,255,255,.060)",
  color: "white",
};

function Step({
  number,
  title,
  body,
  tone,
}: {
  number: string;
  title: string;
  body: string;
  tone: string;
}) {
  return (
    <section style={{ ...glass, borderColor: `${tone}66` }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 16,
          border: `1px solid ${tone}88`,
          display: "grid",
          placeItems: "center",
          color: tone,
          fontWeight: 1000,
          marginBottom: 14,
          background: "rgba(255,255,255,.04)",
        }}
      >
        {number}
      </div>

      <h3 style={{ fontSize: 28, lineHeight: 1, margin: "0 0 10px" }}>{title}</h3>
      <p style={{ ...muted, margin: 0 }}>{body}</p>
    </section>
  );
}

function ExampleBox({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: string;
}) {
  return (
    <section style={{ ...glass, borderColor: `${tone}66` }}>
      <div style={{ ...label, color: tone }}>{title}</div>

      <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
        {items.map((item) => (
          <div
            key={item}
            style={{
              border: "1px solid rgba(255,255,255,.10)",
              borderRadius: 16,
              padding: 12,
              background: "rgba(0,0,0,.16)",
              color: "#e5e7eb",
              lineHeight: 1.45,
              fontWeight: 750,
            }}
          >
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function RoomSystemGuidePage() {
  return (
    <main style={page}>
      <style>{`
        a:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        @media(max-width:760px) {
          .vf-grid,
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
          }
        }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav
          title="Room System Guide"
          subtitle="How rooms, folders, buttons, and workflow stages move like a river."
          active="workstations"
        />

        <section style={card}>
          <div style={label}>VaultForge 5S / Kaizen Operating Card</div>

          <h1
            style={{
              fontSize: "clamp(52px,10vw,104px)",
              lineHeight: 0.88,
              letterSpacing: "-.07em",
              margin: "12px 0 18px",
            }}
          >
            Buttons mark the room. Folders organize the work.
          </h1>

          <p style={{ ...muted, fontSize: 21, maxWidth: 980 }}>
            When you click Hot, Needs Capital, Solved, Archived, or Dead inside a room, you are not supposed to leave the room.
            You are labeling/moving the work so it appears in the right folder while you keep operating inside the room.
          </p>

          <div className="vf-actions" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 22 }}>
            <Link href="/opportunity-rooms" style={button}>Opportunity Rooms</Link>
            <Link href="/pressure-rooms" style={button}>Pressure Rooms</Link>
            <Link href="/room-folders" style={ghost}>Folder Map</Link>
            <Link href="/workstations" style={ghost}>Workstations</Link>
          </div>
        </section>

        <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 16, marginBottom: 20 }}>
          <Step
            number="1"
            title="Open a room"
            body="You enter an Opportunity Room or Pressure Room. This is where the work happens."
            tone="#56d8ff"
          />
          <Step
            number="2"
            title="Click a stage"
            body="Hot, Needs Capital, Critical, Solved, Archived, Dead, etc. These are workflow labels."
            tone="#e8c46b"
          />
          <Step
            number="3"
            title="Stay in room"
            body="The button should not throw you out. You keep working, messaging, diagnosing, and routing."
            tone="#9df3bf"
          />
          <Step
            number="4"
            title="Folder updates"
            body="That room now appears in the matching folder desk, like Hot, Funding Gap, Saved, or Solved."
            tone="#fecaca"
          />
        </section>

        <section style={card}>
          <div style={label}>Simple Example</div>

          <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
            <ExampleBox
              title="Opportunity Example"
              tone="#56d8ff"
              items={[
                "You open Opportunity Room 123.",
                "You click Needs Capital.",
                "You stay inside Opportunity Room 123.",
                "Room 123 now appears in /opportunity-rooms/needs-capital.",
                "Later, a lender/capital workflow can be triggered from that folder.",
              ]}
            />

            <ExampleBox
              title="Pressure Example"
              tone="#fecaca"
              items={[
                "You open Pressure Room 555.",
                "You click Urgent or Funding Gap.",
                "You stay inside Pressure Room 555.",
                "Room 555 now appears in /pressure-rooms/urgent or /pressure-rooms/funding-gap.",
                "Later, operator/capital/rescue routing can happen from that folder.",
              ]}
            />
          </div>
        </section>

        <section style={card}>
          <div style={label}>What Each Button Means</div>

          <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 16, marginTop: 16 }}>
            <ExampleBox
              title="Opportunity Buttons"
              tone="#56d8ff"
              items={[
                "Hot = priority opportunity.",
                "Underwrite = needs numbers verified.",
                "Needs Buyer = send to buyer/disposition lane.",
                "Needs Capital = send to capital/funding lane.",
                "Needs Operator = needs execution/operator help.",
                "Dead = not worth working right now.",
              ]}
            />

            <ExampleBox
              title="Pressure Buttons"
              tone="#fecaca"
              items={[
                "Critical = emergency attention.",
                "Funding Gap = money/capital problem.",
                "Legal / Title = title, liens, probate, attorney issue.",
                "Contractor Failure = execution or rehab breakdown.",
                "Solved = pressure handled.",
                "Escalated = owner/admin needs to step in.",
              ]}
            />

            <ExampleBox
              title="Universal Controls"
              tone="#e8c46b"
              items={[
                "Save Room = keep on watchlist.",
                "Archive Room = remove from active flow, not deleted.",
                "Delete Room = cleanup/dead pile.",
                "Internal Thread = open message/work thread.",
                "Back to Lane = return to Opportunity or Pressure lane.",
                "Command = return to main dashboard.",
              ]}
            />
          </div>
        </section>

        <section style={card}>
          <div style={label}>The River Flow</div>

          <div
            style={{
              border: "1px solid rgba(232,196,107,.28)",
              borderRadius: 26,
              padding: 22,
              background: "rgba(232,196,107,.06)",
              textAlign: "center",
              fontSize: "clamp(24px,5vw,44px)",
              lineHeight: 1.2,
              fontWeight: 1000,
              color: "#f8e7b0",
            }}
          >
            Intake → Room → Stage Button → Folder → Execution → Solved / Closed / Archived
          </div>

          <p style={{ ...muted, fontSize: 18, marginTop: 18 }}>
            This is the clean VaultForge operating logic. No clutter. No random feeds. Every deal, pressure item, and room has a place.
          </p>
        </section>
      </div>
    </main>
  );
}
