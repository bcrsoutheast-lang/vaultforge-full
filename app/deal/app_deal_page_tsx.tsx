import Link from "next/link";
import { listCanonicalRooms, type CanonicalRoom } from "../lib/vaultforgeCanonicalRooms";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function money(value: string) {
  const clean = String(value || "").trim();
  if (!clean) return "";
  if (clean.includes("$")) return clean;

  const n = Number(clean.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return clean;

  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function compact(value: string, max = 120) {
  const clean = String(value || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";

  return clean.length <= max
    ? clean
    : `${clean.slice(0, max).trim()}…`;
}

function Card({ room }: { room: CanonicalRoom }) {
  const ask = money(room.asking);
  const arv = money(room.arv);
  const repairs = money(room.repairs);
  const photo = room.photos?.[0] || "";

  return (
    <article className="vf-room-card">
      <div className="vf-line" />

      <Link
        href={`/deal-rooms/${encodeURIComponent(room.id)}`}
        className="vf-photo"
      >
        {photo ? <img src={photo} alt="" /> : null}
      </Link>

      <div className="vf-body">
        <div className="vf-card-top">
          <div>
            <div className="vf-kicker">Opportunity Room</div>

            <h2>{room.title}</h2>

            <p>{room.subtitle}</p>
          </div>

          <div className="vf-score">
            <strong>{room.score}</strong>

            <span>{room.status}</span>
          </div>
        </div>

        <div className="vf-pills">
          <span>
            {ask ? `Ask ${ask}` : "Ask not listed"}
          </span>

          <span>
            {arv ? `ARV ${arv}` : "ARV not listed"}
          </span>

          <span>
            {repairs ? `Repairs ${repairs}` : "Repairs not listed"}
          </span>

          <span>{room.asset_type}</span>

          {room.strategy ? (
            <span>{room.strategy}</span>
          ) : null}
        </div>

        <p className="vf-summary">
          {compact(
            room.ai_summary ||
              room.summary ||
              room.notes ||
              "Open room for deal numbers, AI analysis, matched profiles, alerts, and routing context."
          )}
        </p>

        <div className="vf-actions">
          <Link href={`/deal-rooms/${encodeURIComponent(room.id)}`}>
            Open Room
          </Link>

          <Link
            href={`/message-command/${encodeURIComponent(
              "deal:" + room.id
            )}`}
          >
            Thread
          </Link>
        </div>
      </div>
    </article>
  );
}

export default async function DealPage() {
  const rooms = await listCanonicalRooms("deal");

  return (
    <main className="vf-page">
      <style>{`
        .vf-page{
          min-height:100vh;
          background:
            radial-gradient(circle at top left,rgba(245,197,91,.12),transparent 30%),
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
          font-size:clamp(44px,9vw,86px);
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

        .vf-grid{
          display:grid;
          gap:14px
        }

        .vf-room-card{
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

        .vf-line{
          grid-column:1/-1;
          height:4px;
          border-radius:999px;
          background:linear-gradient(90deg,#f5c55b,transparent)
        }

        .vf-photo{
          height:130px;
          border-radius:16px;
          overflow:hidden;
          border:1px solid rgba(255,255,255,.12);
          background:
            radial-gradient(circle at top left,rgba(245,197,91,.18),transparent 30%),
            linear-gradient(135deg,#111827,#020617)
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
          color:#f5c55b;
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
          .vf-room-card{
            grid-template-columns:1fr
          }

          .vf-photo{
            height:160px
          }

          .vf-card-top h2{
            font-size:24px
          }
        }
      `}</style>

      <div className="vf-wrap">
        <section className="vf-hero">
          <div className="vf-kicker">
            VaultForge 5S Canonical Lane
          </div>

          <h1>Deal Rooms</h1>

          <p>
            One clean lane for deals, projects, and opportunities.
            Projects are no longer a separate member-facing system.
            Full numbers, AI, profiles, alerts, and routing live
            inside each room.
          </p>

          <div className="vf-nav">
            <Link href="/dashboard">Command</Link>

            <Link href="/deal-rooms" className="primary">
              Deal Rooms
            </Link>

            <Link href="/pain-rooms">
              Pain Rooms
            </Link>

            <Link href="/submit">
              Create Deal
            </Link>
          </div>
        </section>

        <section className="vf-panel">
          <div className="vf-kicker">
            Active Opportunity Cards
          </div>

          {!rooms.length ? (
            <p style={{ color: "#cbd5e1" }}>
              No deal records resolved yet.
            </p>
          ) : null}

          <div
            className="vf-grid"
            style={{ marginTop: 14 }}
          >
            {rooms.map((room) => (
              <Card
                key={`${room.source_table}:${room.id}`}
                room={room}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
