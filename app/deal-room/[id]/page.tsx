import Link from "next/link";
import { getCanonicalRoom } from "../../lib/vaultforgeCanonicalRooms";
import DealActions from "./DealActions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = Promise<{ id: string }>;

function money(value: string) {
  const clean = String(value || "").trim();
  if (!clean) return "Not listed";
  if (clean.includes("$")) return clean;
  const n = Number(clean.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return clean;
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default async function DealRoomDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const room = await getCanonicalRoom("deal", id);

  return (
    <main className="vf-page">
      <style>{`
        .vf-page{min-height:100vh;background:radial-gradient(circle at top left,rgba(245,197,91,.12),transparent 30%),linear-gradient(180deg,#02040a,#071018 52%,#02040a);color:#fff;padding:22px 14px 80px;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        .vf-wrap{max-width:1180px;margin:0 auto;display:grid;gap:16px}
        .vf-card{border:1px solid rgba(245,197,91,.24);background:linear-gradient(145deg,rgba(16,24,36,.94),rgba(2,6,23,.98));border-radius:24px;padding:20px;box-shadow:0 24px 70px rgba(0,0,0,.28)}
        .vf-kicker{color:#f5c55b;font-size:12px;font-weight:950;letter-spacing:.16em;text-transform:uppercase}
        h1{font-size:clamp(42px,8vw,82px);line-height:.9;letter-spacing:-.07em;margin:10px 0 12px}
        p{color:#cbd5e1;line-height:1.55}
        .vf-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(165px,1fr));gap:10px}
        .vf-metric{border:1px solid rgba(148,163,184,.16);background:rgba(2,6,23,.38);border-radius:16px;padding:12px}
        .vf-metric span{display:block;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:.12em;font-weight:900}
        .vf-metric strong{display:block;color:#fff;font-size:17px;margin-top:5px;overflow-wrap:anywhere}
        .vf-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px}
        .vf-btn{border:1px solid rgba(245,197,91,.25);background:rgba(245,197,91,.07);color:#f8fafc;border-radius:12px;padding:10px 16px;font-weight:900;font-size:14px;cursor:pointer}
        .vf-btn-danger{background:#dc2626;border-color:#dc2626;color:#fff}
        .vf-btn-danger:hover{background:#b91c1c}
        .vf-btn:hover{filter:brightness(1.1)}
        .vf-btn:disabled{opacity:0.5;cursor:not-allowed}
      `}</style>

      <div className="vf-wrap">
        <section className="vf-card">
          <div className="vf-kicker">Deal Room</div>
          <h1>{room?.title || "Deal room not loaded"}</h1>
          <p>{room?.summary || "This id did not match a live deal room. Open a room from /deal-rooms so the current canonical id is used."}</p>
          
          {room?.id && <DealActions dealId={room.id} />}

          <div className="vf-nav" style={{display:"flex",gap:"9px",flexWrap:"wrap",marginTop:"16px"}}>
            <Link href="/deal-rooms" style={{color:"#f8fafc",textDecoration:"none",border:"1px solid rgba(245,197,91,.25)",background:"rgba(245,197,91,.07)",borderRadius:"999px",padding:"10px 13px",fontWeight:900,fontSize:"13px"}}>Back to Deal Rooms</Link>
            <Link href="/dashboard" style={{color:"#f8fafc",textDecoration:"none",border:"1px solid rgba(245,197,91,.25)",background:"rgba(245,197,91,.07)",borderRadius:"999px",padding:"10px 13px",fontWeight:900,fontSize:"13px"}}>Command</Link>
            <Link href={`/message-command/${encodeURIComponent("deal:" + id)}`} style={{color:"#111827",textDecoration:"none",background:"linear-gradient(135deg,#fde68a,#e8c46b)",borderRadius:"999px",padding:"10px 13px",fontWeight:900,fontSize:"13px",border:0}}>Room Thread</Link>
          </div>
        </section>

        <section className="vf-card">
          <div className="vf-kicker">Submitted Numbers</div>
          <div className="vf-grid">
            <div className="vf-metric"><span>Market</span><strong>{room?.subtitle || "Not listed"}</strong></div>
            <div className="vf-metric"><span>Asset</span><strong>{room?.asset_type || "Not listed"}</strong></div>
            <div className="vf-metric"><span>Strategy</span><strong>{room?.strategy || "Not listed"}</strong></div>
            <div className="vf-metric"><span>Asking</span><strong>{money(room?.asking || "")}</strong></div>
            <div className="vf-metric"><span>ARV / Value</span><strong>{money(room?.arv || "")}</strong></div>
            <div className="vf-metric"><span>Repairs</span><strong>{money(room?.repairs || "")}</strong></div>
            <div className="vf-metric"><span>Fit Score</span><strong>{room?.score || "84"}</strong></div>
            <div className="vf-metric"><span>Source</span><strong>{room?.source_table || "not-found"}</strong></div>
          </div>
        </section>
      </div>
    </main>
  );
}
