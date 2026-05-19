"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { locationFor, markPainRoomRead, painIntelligence, readPainRoom, safeText, setPainRoomState, type PainRoom, type PainState } from "../../lib/vaultforgePain";

const page: React.CSSProperties = { minHeight: "100vh", background: "#05070d", color: "#f7f7fb", padding: 18, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 1280, margin: "0 auto", paddingBottom: 90 };
const nav: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 18 };
const brand: React.CSSProperties = { color: "#ffd45a", fontSize: 27, fontWeight: 950, letterSpacing: -1, marginRight: 10 };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "13px 18px", fontWeight: 950, textDecoration: "none", display: "inline-block", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };
const redBtn: React.CSSProperties = { ...btn, background: "#271016", borderColor: "rgba(255,70,70,.48)", color: "#ffaaaa" };
const hero: React.CSSProperties = { border: "1px solid rgba(245,197,66,.28)", borderRadius: 28, padding: 30, marginBottom: 20, background: "radial-gradient(circle at top right, rgba(245,197,66,.16), transparent 32%), linear-gradient(180deg,#080d19,#050816)" };
const redHero: React.CSSProperties = { ...hero, borderColor: "rgba(255,70,70,.62)", background: "radial-gradient(circle at top right, rgba(255,30,60,.22), transparent 35%), linear-gradient(180deg,#170812,#050816)" };
const card: React.CSSProperties = { background: "linear-gradient(180deg,#080d19,#050816)", border: "1px solid rgba(245,197,66,.28)", borderRadius: 26, padding: 26, marginBottom: 22 };
const panel: React.CSSProperties = { background: "#121724", border: "1px solid rgba(207,216,230,.16)", borderRadius: 22, padding: 22 };
const activePanel: React.CSSProperties = { ...panel, borderColor: "rgba(245,197,66,.75)", boxShadow: "0 0 26px rgba(245,197,66,.18)" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 7, fontWeight: 950, fontSize: 15, marginBottom: 12 };
const h1: React.CSSProperties = { fontSize: "clamp(44px,8vw,86px)", lineHeight: 0.9, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(30px,5vw,52px)", lineHeight: 0.95, letterSpacing: -2, margin: "0 0 14px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 21, lineHeight: 1.35, margin: 0 };
const muted: React.CSSProperties = { color: "#aeb7c7", margin: "8px 0 0", lineHeight: 1.35 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(245px,1fr))", gap: 16 };
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
const photoStyle: React.CSSProperties = { width: "100%", maxHeight: 320, objectFit: "cover", borderRadius: 18, border: "1px solid rgba(245,197,66,.25)", marginBottom: 12 };

function Nav() {
  return (
    <nav style={nav}>
      <div style={brand}>VAULTFORGE</div>
      <Link href="/command" style={btn}>Command</Link>
      <Link href="/network" style={btn}>Network</Link>
      <Link href="/pain-rooms" style={goldBtn}>Pain Rooms</Link>
      <Link href="/pain-intake" style={btn}>Pain Intake</Link>
      <Link href="/messages" style={btn}>Messages</Link>
      <Link href="/logout" style={redBtn}>Logout</Link>
    </nav>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section style={card}><div style={eyebrow}>{title}</div>{children}</section>;
}

function Value({ title, value }: { title: string; value: unknown }) {
  return <div style={panel}><div style={eyebrow}>{title}</div><p style={sub}>{safeText(value, "Not listed")}</p></div>;
}

function Meter({ title, value }: { title: string; value: number }) {
  return <div style={panel}><div style={eyebrow}>{title}</div><h2 style={h2}>{value}%</h2><div style={{ height: 10, background: "#070a12", borderRadius: 999, overflow: "hidden" }}><div style={{ width: `${Math.max(0, Math.min(100, value))}%`, height: "100%", background: "#ffdc68" }} /></div></div>;
}

export default function PainRoomPage({ params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id || "");
  const [room, setRoom] = useState<PainRoom | null>(null);
  const [openPanel, setOpenPanel] = useState<"summary" | "facts" | "pressure" | "photos" | "messages" | "notes">("summary");

  useEffect(() => {
    const found = readPainRoom(id);
    setRoom(found);
    if (found) markPainRoomRead(found.id);
  }, [id]);

  const intel = useMemo(() => room ? painIntelligence(room) : null, [room]);

  if (!room || !intel) {
    return (
      <main style={page}>
        <div style={wrap}>
          <Nav />
          <section style={hero}>
            <div style={eyebrow}>Pain Room</div>
            <h1 style={h1}>Room not found.</h1>
            <p style={sub}>Go back to Pain Rooms and open a current room.</p>
            <div style={{ ...row, marginTop: 20 }}><Link href="/pain-rooms" style={goldBtn}>Back to Pain Rooms</Link></div>
          </section>
        </div>
      </main>
    );
  }

  function move(state: PainState) {
    setPainRoomState(room!.id, state);
    setRoom({ ...room!, roomState: state });
  }

  return (
    <main style={page}>
      <div style={wrap}>
        <Nav />

        <section style={intel.severityScore >= 80 ? redHero : hero}>
          {room.coverPhoto ? <img src={room.coverPhoto} alt={room.title} style={photoStyle} /> : null}
          <div style={eyebrow}>Pain Room • {room.roomState}</div>
          <h1 style={h1}>{room.title}</h1>
          <p style={sub}>{locationFor(room)}</p>
          <p style={muted}>{room.painTypes.join(", ")} • Needs {room.needs.join(", ")} • Severity {room.severity}</p>
        </section>

        <Section title="Room Controls">
          <div style={grid}>
            <button type="button" style={openPanel === "summary" ? activePanel : panel} onClick={() => setOpenPanel("summary")}><div style={eyebrow}>AI Diagnosis</div><h2 style={h2}>{intel.severityScore}%</h2><p style={muted}>{intel.banner}</p></button>
            <button type="button" style={openPanel === "facts" ? activePanel : panel} onClick={() => setOpenPanel("facts")}><div style={eyebrow}>Problem Facts</div><h2 style={h2}>{room.painTypes.length}</h2><p style={muted}>pain type(s)</p></button>
            <button type="button" style={openPanel === "pressure" ? activePanel : panel} onClick={() => setOpenPanel("pressure")}><div style={eyebrow}>Pressure</div><h2 style={h2}>{intel.blockerScore}%</h2><p style={muted}>blocker score</p></button>
            <button type="button" style={openPanel === "photos" ? activePanel : panel} onClick={() => setOpenPanel("photos")}><div style={eyebrow}>Photos</div><h2 style={h2}>{room.photos.length}</h2><p style={muted}>uploaded</p></button>
            <button type="button" style={openPanel === "messages" ? activePanel : panel} onClick={() => setOpenPanel("messages")}><div style={eyebrow}>Messages</div><h2 style={h2}>Open</h2><p style={muted}>room thread</p></button>
            <button type="button" style={openPanel === "notes" ? activePanel : panel} onClick={() => setOpenPanel("notes")}><div style={eyebrow}>Notes</div><h2 style={h2}>{room.notes ? "1" : "0"}</h2><p style={muted}>AI context</p></button>
          </div>
        </Section>

        <Section title="Actions">
          <div style={row}>
            <button type="button" style={goldBtn} onClick={() => move("saved")}>Save</button>
            <button type="button" style={btn} onClick={() => move("archived")}>Archive</button>
            <button type="button" style={redBtn} onClick={() => move("deleted")}>Delete</button>
            <Link href="/pain-rooms" style={btn}>Back</Link>
          </div>
        </Section>

        {openPanel === "summary" ? (
          <Section title="AI Intelligence">
            <div style={grid}>
              <Meter title="Severity" value={intel.severityScore} />
              <Meter title="Capital Need" value={intel.capitalScore} />
              <Meter title="Execution Difficulty" value={intel.difficulty} />
              <Value title="Best Next Move" value={intel.bestNextMove} />
              <Value title="If Nothing Happens" value={intel.consequence} />
            </div>
          </Section>
        ) : null}

        {openPanel === "facts" ? (
          <Section title="Problem Facts">
            <div style={grid}>
              <Value title="Pain Type" value={room.painTypes.join(", ")} />
              <Value title="Needs" value={room.needs.join(", ")} />
              <Value title="Control Status" value={room.controlStatus} />
              <Value title="Current Status" value={room.currentStatus} />
              <Value title="Owner Situation" value={room.ownerSituation} />
              <Value title="Access Status" value={room.accessStatus} />
            </div>
          </Section>
        ) : null}

        {openPanel === "pressure" ? (
          <>
            <Section title="Blockers + Risk">
              <div style={grid}>
                <Value title="Blockers" value={room.blockers.join(", ")} />
                <Value title="Risks" value={room.risks.join(", ")} />
                <Value title="Root Cause" value={room.rootCause} />
                <Value title="Title Status" value={room.titleStatus} />
                <Value title="Permit Status" value={room.permitStatus} />
                <Value title="Legal Status" value={room.legalStatus} />
              </div>
            </Section>
            <Section title="Numbers + Burn">
              <div style={grid}>
                <Value title="Ask Price" value={room.askPrice} />
                <Value title="Value / ARV" value={room.value} />
                <Value title="Repairs / Work" value={room.repairs} />
                <Value title="Monthly Burn" value={room.monthlyBurn} />
                <Value title="Money Needed Now" value={room.moneyNeededNow} />
                <Value title="Deadline" value={room.deadline} />
              </div>
            </Section>
          </>
        ) : null}

        {openPanel === "photos" ? (
          <Section title="Photos">
            {room.photos.length ? <div style={grid}>{room.photos.map((photo, index) => <img key={`${index}-${photo.slice(0, 20)}`} src={photo} alt={`Pain ${index + 1}`} style={photoStyle} />)}</div> : <p style={sub}>No photos saved.</p>}
          </Section>
        ) : null}

        {openPanel === "messages" ? (
          <Section title="Messages">
            <p style={sub}>Open the message thread tied to this room.</p>
            <div style={{ ...row, marginTop: 18 }}><Link href={`/messages?type=pain&room=${encodeURIComponent(room.id)}&subject=${encodeURIComponent("Pain Room: " + room.title)}`} style={goldBtn}>Open Message Thread</Link></div>
          </Section>
        ) : null}

        {openPanel === "notes" ? (
          <Section title="Notes + AI Context">
            <p style={sub}>{safeText(room.notes, "No notes added.")}</p>
            <p style={muted}>{safeText(room.desiredSolution)}</p>
          </Section>
        ) : null}
      </div>
    </main>
  );
}
