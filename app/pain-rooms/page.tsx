import Link from "next/link";
import { listCanonicalRooms, type CanonicalRoom } from "../lib/vaultforgeCanonicalRooms";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function compact(value: string, max = 125) {
  const clean = String(value || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  return clean.length <= max ? clean : `${clean.slice(0, max).trim()}…`;
}

function Card({ room }: { room: CanonicalRoom }) {
  return (
    <article className="vf-room-card">
      <div className="vf-line" />
      <Link href={`/pain-rooms/${encodeURIComponent(room.id)}`} className="vf-alert">!</Link>

      <div className="vf-body">
        <div className="vf-card-top">
          <div>
            <div className="vf-kicker">Pain Execution Room</div>
            <h2>{room.title}</h2>
            <p>{room.subtitle}</p>
          </div>
          <div className="vf-score">
            <strong>{room.score}</strong>
            <span>{room.urgency}</span>
          </div>
        </div>

        <div className="vf-pills">
          <span>{room.capital_needed ? `Capital ${room.capital_needed}` : "Capital not listed"}</span>
          <span>{room.asset_type}</span>
          <span>{room.status}</span>
          <span>{room.source_table}</span>
        </div>

        <p className="vf-summary">{compact(room.ai_summary || room.summary || room.notes || "Open room for pressure summary, blockers, risk, matched profiles, AI next steps, and routing context.")}</p>

        <div className="vf-actions">
          <Link href={`/pain-rooms/${encodeURIComponent(room.id)}`}>Open Room</Link>
          <Link href={`/message-command/${encodeURIComponent("pain:" + room.id)}`}>Thread</Link>
        </div>
      </div>
    </article>
  );
}

export default async function PainRoomsPage() {
  const rooms = await listCanonicalRooms("pain");

  return (
    <main className="vf-page">
      <style>{`
        .vf-page{min-height:100vh;background:radial-gradient(circle at top left,rgba(239,68,68,.14),transparent 30%),linear-gradient(180deg,#02040a,#071018 52%,#02040a);color:#fff;padding:22px 14px 80px;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        .vf-wrap{max-width:1180px;margin:0 auto;display:grid;gap:16px}
        .vf-hero,.vf-panel{border:1px solid rgba(239,68,68,.28);background:linear-gradient(145deg,rgba(35,8,8,.94),rgba(2,6,23,.98));border-radius:24px;padding:20px;box-shadow:0 24px 70px rgba(0,0,0,.28)}
        .vf-kicker{color:#fca5a5;font-size:12px;font-weight:950;letter-spacing:.16em;text-transform:uppercase}
        h1{font-size:clamp(44px,9vw,86px);line-height:.9;letter-spacing:-.07em;margin:10px 0 12px}
        .vf-hero p{color:#fecaca;font-size:18px;line-height:1.5;max-width:920px}
        .vf-nav{display:flex;gap:9px;flex-wrap:wrap;margin-top:16px}
        .vf-nav a,.vf-actions a{color:#f8fafc;text-decoration:none;border:1px solid rgba(239,68,68,.26);background:rgba(127,29,29,.22);border-radius:999px;padding:10px 13px;font-weight:900;font-size:13px}
        .vf-nav a.primary,.vf-actions a:first-child{background:linear-gradient(135deg,#fecaca,#ef4444);color:#111827;border:0}
        .vf-grid{display:grid;gap:14px}
        .vf-room-card{border:1px solid rgba(239,68,68,.26);background:radial-gradient(circle at top right,rgba(239,68,68,.14),transparent 28%),linear-gradient(145deg,rgba(35,8,8,.96),rgba(2,6,23,.99));border-radius:24px;padding:14px;display:grid;grid-template-columns:110px minmax(0,1fr);gap:14px}
        .vf-line{grid-column:1/-1;height:4px;border-radius:999px;background:linear-gradient(90deg,#ef4444,transparent)}
        .vf-alert{height:110px;border-radius:16px;overflow:hidden;border:1px solid rgba(239,68,68,.28);background:radial-gradient(circle at center,rgba(239,68,68,.25),transparent 50%),linear-gradient(135deg,#2b0909,#020617);display:grid;place-items:center;color:#ef4444;text-decoration:none;font-size:44px;font-weight:950}
        .vf-card-top{display:flex;justify-content:space-between;gap:12px}
        .vf-card-top h2{font-size:28px;line-height:.98;letter-spacing:-.055em;margin:6px 0;color:#fff}
        .vf-card-top p{color:#fecaca;margin:0;font-size:13px}
        .vf-score{text-align:right;flex:0 0 auto}
        .vf-score strong{display:block;color:#ef4444;font-size:30px;line-height:1}
        .vf-score span{display:block;color:#fecaca;font-size:10px;letter-spacing:.14em;text-transform:uppercase;margin-top:4px}
        .vf-pills{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
        .vf-pills span{border:1px solid rgba(239,68,68,.18);background:rgba(127,29,29,.18);color:#fee2e2;border-radius:999px;padding:6px 9px;font-size:11px;font-weight:850}
        .vf-summary{color:#fee2e2;font-size:13px;line-height:1.45;margin:12px 0 0}
        .vf-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
        @media(max-width:700px){.vf-room-card{grid-template-columns:1fr}.vf-alert{height:120px}.vf-card-top h2{font-size:24px}}
      `}</style>

      <div className="vf-wrap">
        <section className="vf-hero">
          <div className="vf-kicker">VaultForge 5S Canonical Lane</div>
          <h1>Pain Rooms</h1>
          <p>One clean lane for pain, pressure, distress, funding gaps, operator problems, and execution blockers. Pain Feed is no longer a separate member-facing system.</p>
          <div className="vf-nav">
            <Link href="/dashboard">Command</Link>
            <Link href="/deal-rooms">Deal Rooms</Link>
            <Link href="/pain-rooms" className="primary">Pain Rooms</Link>
            <Link href="/pain">Create Pain</Link>
          </div>
        </section>

        <section className="vf-panel">
          <div className="vf-kicker">Active Pain Cards</div>
          {!rooms.length ? <p style={{ color: "#fecaca" }}>No pain records resolved yet. This page is live; the next fix would be table/column mapping if Supabase records exist.</p> : null}
          <div className="vf-grid" style={{ marginTop: 14 }}>
            {rooms.map((room) => <Card key={`${room.source_table}:${room.id}`} room={room} />)}
          </div>
        </section>
      </div>
    </main>
  );
}