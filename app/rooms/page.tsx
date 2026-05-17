import Link from "next/link";
import { listRooms, type SimpleRoom } from "../lib/vaultforgeSimpleRooms";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function money(value: string) {
  const clean = String(value || "").trim();
  if (!clean) return "";
  if (clean.includes("$")) return clean;
  const n = Number(clean.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return clean;
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function compact(value: string, max = 120) {
  const clean = String(value || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  return clean.length <= max ? clean : `${clean.slice(0, max).trim()}…`;
}

function RoomCard({ room }: { room: SimpleRoom }) {
  const isPain = room.type === "pain";
  const accent = isPain ? "#ef4444" : "#f5c55b";
  const ask = money(room.asking);
  const arv = money(room.arv);
  const repairs = money(room.repairs);
  const photo = room.photos?.[0] || "";

  return (
    <article className={`vf-card ${isPain ? "pain" : "deal"}`}>
      <div className="vf-line" />

      <Link
        href={`/rooms/detail?type=${room.type}&id=${encodeURIComponent(room.id)}`}
        className={isPain ? "vf-alert" : "vf-photo"}
      >
        {photo && !isPain ? <img src={photo} alt="" /> : isPain ? "!" : null}
      </Link>

      <div>
        <div className="vf-card-top">
          <div>
            <div className="vf-kicker" style={{ color: accent }}>
              {isPain ? "Pain Room" : "Deal Room"}
            </div>

            <h2>{room.title}</h2>

            <p>{room.market}</p>
          </div>

          <div className="vf-score">
            <strong style={{ color: accent }}>{room.score}</strong>
            <span>{isPain ? room.urgency : room.status}</span>
          </div>
        </div>

        <div className="vf-pills">
          {isPain ? (
            <>
              <span>{room.capital_needed ? `Capital ${room.capital_needed}` : "Capital not listed"}</span>
              <span>{room.asset}</span>
              <span>{room.urgency}</span>
            </>
          ) : (
            <>
              <span>{ask ? `Ask ${ask}` : "Ask not listed"}</span>
              <span>{arv ? `ARV ${arv}` : "ARV not listed"}</span>
              <span>{repairs ? `Repairs ${repairs}` : "Repairs not listed"}</span>
              <span>{room.asset}</span>
            </>
          )}
        </div>

        <p className="vf-summary">
          {compact(
            room.summary ||
              (isPain
                ? "Open room for pressure, blockers, risk, AI next steps, profiles, and execution context."
                : "Open room for deal numbers, AI analysis, profiles, alerts, and routing context.")
          )}
        </p>

        <div className="vf-actions">
          <Link href={`/rooms/detail?type=${room.type}&id=${encodeURIComponent(room.id)}`}>
            Open Room
          </Link>

          <Link href={`/message-command/${encodeURIComponent(room.type + ":" + room.id)}`}>
            Thread
          </Link>
        </div>
      </div>
    </article>
  );
}

export default async function RoomsPage() {
  const [deals, pain] = await Promise.all([listRooms("deal"), listRooms("pain")]);

  return (
    <main className="vf-page">
      <style>{`
        .vf-page{
          min-height:100vh;
          background:
            radial-gradient(circle at top left,rgba(245,197,91,.12),transparent 30%),
            radial-gradient(circle at top right,rgba(239,68,68,.12),transparent 28%),
            linear-gradient(180deg,#02040a,#071018 52%,#02040a);
          color:#fff;
          padding:22px 14px 80px;
          font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif
        }

        .vf-wrap{
          max-width:1180px;
          margin:0 auto;
          display:grid;
          gap:16px
        }

        .vf-hero,.vf-panel{
          border:1px solid rgba(245,197,91,.24);
          background:linear-gradient(145deg,rgba(16,24,36,.94),rgba(2,6,23,.98));
          border-radius:24px;
          padding:20px;
          box-shadow:0 24px 70px rgba(0,0,0,.28)
        }

        .vf-kicker{
          color:#f5c55b;
          font-size:12px;
          font-weight:950;
          letter-spacing:.16em;
          text-transform:uppercase
        }

        h1{
          font-size:clamp(44px,9vw,88px);
          line-height:.9;
          letter-spacing:-.07em;
          margin:10px 0 12px
        }

        .vf-hero p{
          color:#cbd5e1;
          font-size:18px;
          line-height:1.5;
          max-width:920px
        }

        .vf-nav{
          display:flex;
          gap:9px;
          flex-wrap:wrap;
          margin-top:16px
        }

        .vf-nav a,.vf-actions a{
          color:#f8fafc;
          text-decoration:none;
          border:1px solid rgba(245,197,91,.25);
          background:rgba(245,197,91,.07);
          border-radius:999px;
          padding:10px 13px;
          font-weight:900;
          font-size:13px
        }

        .vf-nav a.primary,
        .vf-actions a:first-child{
          background:linear-gradient(135deg,#fde68a,#e8c46b);
          color:#111827;
          border:0
        }

        .vf-section-head{
          display:flex;
          justify-content:space-between;
          gap:12px;
          align-items:end;
          flex-wrap:wrap;
          margin-bottom:14px
        }

        .vf-section-head h2{
          font-size:clamp(32px,7vw,60px);
          line-height:.95;
          letter-spacing:-.06em;
          margin:8px 0 0
        }

        .vf-grid{
          display:grid;
          gap:14px
        }

        .vf-card{
          border:1px solid rgba(245,197,91,.22);
          background:
            radial-gradient(circle at top right,rgba(245,197,91,.09),transparent 28%),
            linear-gradient(145deg,rgba(12,16,25,.96),rgba(2,6,23,.99));
          border-radius:24px;
          padding:14px;
          display:grid;
          grid-template-columns:130px minmax(0,1fr);
          gap:14px
        }

        .vf-card.pain{
          border-color:rgba(239,68,68,.28);
          background:
            radial-gradient(circle at top right,rgba(239,68,68,.14),transparent 28%),
            linear-gradient(145deg,rgba(35,8,8,.96),rgba(2,6,23,.99))
        }

        .vf-line{
          grid-column:1/-1;
          height:4px;
          border-radius:999px;
          background:linear-gradient(90deg,#f5c55b,transparent)
        }

        .vf-card.pain .vf-line{
          background:linear-gradient(90deg,#ef4444,transparent)
        }

        .vf-photo,.vf-alert{
          height:130px;
          border-radius:16px;
          overflow:hidden;
          border:1px solid rgba(255,255,255,.12);
          background:
            radial-gradient(circle at top left,rgba(245,197,91,.18),transparent 30%),
            linear-gradient(135deg,#111827,#020617);
          display:grid;
          place-items:center;
          color:#ef4444;
          text-decoration:none;
          font-size:44px;
          font-weight:950
        }

        .vf-alert{
          background:
            radial-gradient(circle at center,rgba(239,68,68,.25),transparent 50%),
            linear-gradient(135deg,#2b0909,#020617);
          border-color:rgba(239,68,68,.28)
        }

        .vf-photo img{
          width:100%;
          height:100%;
          object-fit:cover;
          display:block
        }

        .vf-card-top{
          display:flex;
          justify-content:space-between;
          gap:12px
        }

        .vf-card-top h2{
          font-size:28px;
          line-height:.98;
          letter-spacing:-.055em;
          margin:6px 0;
          color:#fff
        }

        .vf-card-top p{
          color:#cbd5e1;
          margin:0;
          font-size:13px
        }

        .vf-score{
          text-align:right;
          flex:0 0 auto
        }

        .vf-score strong{
          display:block;
          font-size:30px;
          line-height:1
        }

        .vf-score span{
          display:block;
          color:#94a3b8;
          font-size:10px;
          letter-spacing:.14em;
          text-transform:uppercase;
          margin-top:4px
        }

        .vf-pills{
          display:flex;
          gap:8px;
          flex-wrap:wrap;
          margin-top:12px
        }

        .vf-pills span{
          border:1px solid rgba(255,255,255,.13);
          background:rgba(255,255,255,.045);
          color:#cbd5e1;
          border-radius:999px;
          padding:6px 9px;
          font-size:11px;
          font-weight:850
        }

        .vf-summary{
          color:#dbeafe;
          font-size:13px;
          line-height:1.45;
          margin:12px 0 0
        }

        .vf-actions{
          display:flex;
          gap:8px;
          flex-wrap:wrap;
          margin-top:12px
        }

        @media(max-width:700px){
          .vf-card{grid-template-columns:1fr}
          .vf-photo,.vf-alert{height:160px}
          .vf-card-top h2{font-size:24px}
        }
      `}</style>

      <div className="vf-wrap">
        <section className="vf-hero">
          <div className="vf-kicker">VaultForge New Room System</div>

          <h1>Rooms</h1>

          <p>
            This replaces the old scattered Opportunity, Projects, Pain Feed, and Pressure screens.
            One room system: Deal Rooms and Pain Rooms. Pain remains the intake form.
          </p>

          <div className="vf-nav">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/rooms" className="primary">Rooms</Link>
            <Link href="/pain">Pain Intake</Link>
          </div>
        </section>

        <section className="vf-panel">
          <div className="vf-section-head">
            <div>
              <div className="vf-kicker">Deal Rooms</div>
              <h2>{deals.length ? `${deals.length} active deal rooms` : "Deal Rooms"}</h2>
            </div>

            <Link href="/submit" className="primary">Create Deal</Link>
          </div>

          {!deals.length ? (
            <p style={{ color: "#cbd5e1" }}>
              No deal records resolved yet. This room system is live; data mapping is the next issue if records exist in Supabase.
            </p>
          ) : null}

          <div className="vf-grid">
            {deals.map((room) => (
              <RoomCard key={`${room.source_table}:${room.id}`} room={room} />
            ))}
          </div>
        </section>

        <section className="vf-panel">
          <div className="vf-section-head">
            <div>
              <div className="vf-kicker" style={{ color: "#fca5a5" }}>Pain Rooms</div>
              <h2>{pain.length ? `${pain.length} active pain rooms` : "Pain Rooms"}</h2>
            </div>

            <Link href="/pain" className="primary">Submit Pain</Link>
          </div>

          {!pain.length ? (
            <p style={{ color: "#cbd5e1" }}>
              No pain records resolved yet. Pain intake stays at /pain.
            </p>
          ) : null}

          <div className="vf-grid">
            {pain.map((room) => (
              <RoomCard key={`${room.source_table}:${room.id}`} room={room} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}