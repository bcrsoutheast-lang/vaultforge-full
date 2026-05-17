import Link from "next/link";
import { getCanonicalRoom } from "../../lib/vaultforgeCanonicalRooms";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = Promise<{ id: string }>;

export default async function PainRoomDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const room = await getCanonicalRoom("pain", id);

  return (
    <main className="vf-page">
      <style>{`
        .vf-page{min-height:100vh;background:radial-gradient(circle at top left,rgba(239,68,68,.14),transparent 30%),linear-gradient(180deg,#02040a,#071018 52%,#02040a);color:#fff;padding:22px 14px 80px;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        .vf-wrap{max-width:1180px;margin:0 auto;display:grid;gap:16px}
        .vf-card{border:1px solid rgba(239,68,68,.28);background:linear-gradient(145deg,rgba(35,8,8,.94),rgba(2,6,23,.98));border-radius:24px;padding:20px;box-shadow:0 24px 70px rgba(0,0,0,.28)}
        .vf-kicker{color:#fca5a5;font-size:12px;font-weight:950;letter-spacing:.16em;text-transform:uppercase}
        h1{font-size:clamp(42px,8vw,82px);line-height:.9;letter-spacing:-.07em;margin:10px 0 12px}
        p{color:#fee2e2;line-height:1.55}
        .vf-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(165px,1fr));gap:10px}
        .vf-metric{border:1px solid rgba(239,68,68,.18);background:rgba(127,29,29,.16);border-radius:16px;padding:12px}
        .vf-metric span{display:block;color:#fecaca;font-size:11px;text-transform:uppercase;letter-spacing:.12em;font-weight:900}
        .vf-metric strong{display:block;color:#fff;font-size:17px;margin-top:5px;overflow-wrap:anywhere}
        .vf-box-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}
        .vf-box{border:1px solid rgba(239,68,68,.18);background:rgba(127,29,29,.14);border-radius:20px;padding:16px}
        .vf-box h3{margin:0 0 10px}
        .vf-nav{display:flex;gap:9px;flex-wrap:wrap;margin-top:16px}
        .vf-nav a{color:#f8fafc;text-decoration:none;border:1px solid rgba(239,68,68,.26);background:rgba(127,29,29,.22);border-radius:999px;padding:10px 13px;font-weight:900;font-size:13px}
        .vf-nav a.primary{background:linear-gradient(135deg,#fecaca,#ef4444);color:#111827;border:0}
      `}</style>

      <div className="vf-wrap">
        <section className="vf-card">
          <div className="vf-kicker">Pain Execution Room</div>
          <h1>{room?.title || "Pain room not loaded"}</h1>
          <p>{room?.summary || "This id did not match a live pain room. Open a room from /pain-rooms so the current canonical id is used."}</p>
          <div className="vf-nav">
            <Link href="/pain-rooms">Back to Pain Rooms</Link>
            <Link href="/dashboard">Command</Link>
            <Link href={`/message-command/${encodeURIComponent("pain:" + id)}`} className="primary">Room Thread</Link>
          </div>
        </section>

        <section className="vf-card">
          <div className="vf-kicker">Pressure Data</div>
          <div className="vf-grid">
            <div className="vf-metric"><span>Market</span><strong>{room?.subtitle || "Not listed"}</strong></div>
            <div className="vf-metric"><span>Pain Type</span><strong>{room?.asset_type || "Not listed"}</strong></div>
            <div className="vf-metric"><span>Urgency</span><strong>{room?.urgency || "High"}</strong></div>
            <div className="vf-metric"><span>Capital Need</span><strong>{room?.capital_needed || "Not listed"}</strong></div>
            <div className="vf-metric"><span>Distress Score</span><strong>{room?.score || "88"}</strong></div>
            <div className="vf-metric"><span>Source</span><strong>{room?.source_table || "not-found"}</strong></div>
          </div>
        </section>

        <section className="vf-card">
          <div className="vf-kicker">Pain Execution AI</div>
          <div className="vf-box-grid">
            <div className="vf-box"><h3 style={{color:"#86efac"}}>What can be solved</h3><p>This room can be routed if the blocker, deadline, capital need, and decision-maker are clear.</p></div>
            <div className="vf-box"><h3 style={{color:"#fca5a5"}}>Execution risk</h3><p>Delay increases pressure. Pain rooms lose value when ownership, deadline, and next action are unclear.</p></div>
            <div className="vf-box"><h3 style={{color:"#93c5fd"}}>Next steps</h3><p>Assign owner, confirm deadline, route matched operator/capital/buyer profiles, and keep all messages tied to this room.</p></div>
          </div>
        </section>

        <section className="vf-card">
          <div className="vf-kicker">Execution Stack Matches</div>
          <div className="vf-box-grid">
            <div className="vf-box"><h3>Rescue Capital</h3><p>Capital match for funding gap, bridge need, refinance issue, or JV pressure.</p></div>
            <div className="vf-box"><h3>Operator Match</h3><p>Operator match for local execution, construction, PM, or turnaround work.</p></div>
            <div className="vf-box"><h3>Buyer / Exit Match</h3><p>Buyer match if the resolution path is sale, assignment, or liquidation.</p></div>
          </div>
        </section>
      </div>
    </main>
  );
}