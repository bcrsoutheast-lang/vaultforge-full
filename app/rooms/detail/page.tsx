import Link from "next/link";
import { getRoom, type SimpleRoomType } from "../../lib/vaultforgeSimpleRooms";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function money(value: string) {
  const clean = String(value || "").trim();
  if (!clean) return "Not listed";
  if (clean.includes("$")) return clean;
  const n = Number(clean.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return clean;
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default async function RoomDetailPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const typeRaw = first(params.type);
  const type: SimpleRoomType = typeRaw === "pain" ? "pain" : "deal";
  const id = first(params.id);
  const room = await getRoom(type, id);
  const isPain = type === "pain";

  return (
    <main className={isPain ? "vf-page pain" : "vf-page"}>
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

        .vf-page.pain{
          background:
            radial-gradient(circle at top left,rgba(239,68,68,.14),transparent 30%),
            linear-gradient(180deg,#02040a,#071018 52%,#02040a)
        }

        .vf-wrap{
          max-width:1180px;
          margin:0 auto;
          display:grid;
          gap:16px
        }

        .vf-card{
          border:1px solid rgba(245,197,91,.24);
          background:linear-gradient(145deg,rgba(16,24,36,.94),rgba(2,6,23,.98));
          border-radius:24px;
          padding:20px;
          box-shadow:0 24px 70px rgba(0,0,0,.28)
        }

        .vf-page.pain .vf-card{
          border-color:rgba(239,68,68,.28);
          background:linear-gradient(145deg,rgba(35,8,8,.94),rgba(2,6,23,.98))
        }

        .vf-kicker{
          color:#f5c55b;
          font-size:12px;
          font-weight:950;
          letter-spacing:.16em;
          text-transform:uppercase
        }

        .vf-page.pain .vf-kicker{color:#fca5a5}

        h1{
          font-size:clamp(42px,8vw,82px);
          line-height:.9;
          letter-spacing:-.07em;
          margin:10px 0 12px
        }

        p{
          color:#cbd5e1;
          line-height:1.55
        }

        .vf-page.pain p{color:#fee2e2}

        .vf-grid{
          display:grid;
          grid-template-columns:repeat(auto-fit,minmax(165px,1fr));
          gap:10px
        }

        .vf-metric{
          border:1px solid rgba(148,163,184,.16);
          background:rgba(2,6,23,.38);
          border-radius:16px;
          padding:12px
        }

        .vf-metric span{
          display:block;
          color:#94a3b8;
          font-size:11px;
          text-transform:uppercase;
          letter-spacing:.12em;
          font-weight:900
        }

        .vf-metric strong{
          display:block;
          color:#fff;
          font-size:17px;
          margin-top:5px;
          overflow-wrap:anywhere
        }

        .vf-box-grid{
          display:grid;
          grid-template-columns:repeat(auto-fit,minmax(240px,1fr));
          gap:12px
        }

        .vf-box{
          border:1px solid rgba(148,163,184,.18);
          background:rgba(15,23,42,.78);
          border-radius:20px;
          padding:16px
        }

        .vf-box h3{margin:0 0 10px}

        .vf-nav{
          display:flex;
          gap:9px;
          flex-wrap:wrap;
          margin-top:16px
        }

        .vf-nav a{
          color:#f8fafc;
          text-decoration:none;
          border:1px solid rgba(245,197,91,.25);
          background:rgba(245,197,91,.07);
          border-radius:999px;
          padding:10px 13px;
          font-weight:900;
          font-size:13px
        }

        .vf-nav a.primary{
          background:linear-gradient(135deg,#fde68a,#e8c46b);
          color:#111827;
          border:0
        }
      `}</style>

      <div className="vf-wrap">
        <section className="vf-card">
          <div className="vf-kicker">{isPain ? "Pain Room" : "Deal Room"}</div>

          <h1>{room?.title || (isPain ? "Pain room not loaded" : "Deal room not loaded")}</h1>

          <p>
            {room?.summary ||
              "This id did not match a live room. Open a room from /rooms so the current room id is used."}
          </p>

          <div className="vf-nav">
            <Link href="/rooms">Back to Rooms</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href={`/message-command/${encodeURIComponent(type + ":" + id)}`} className="primary">
              Room Thread
            </Link>
          </div>
        </section>

        <section className="vf-card">
          <div className="vf-kicker">
            {isPain ? "Pressure Data" : "Submitted Numbers"}
          </div>

          <div className="vf-grid">
            <div className="vf-metric"><span>Market</span><strong>{room?.market || "Not listed"}</strong></div>
            <div className="vf-metric"><span>Asset / Type</span><strong>{room?.asset || "Not listed"}</strong></div>
            <div className="vf-metric"><span>Strategy</span><strong>{room?.strategy || "Not listed"}</strong></div>
            <div className="vf-metric"><span>Status</span><strong>{room?.status || "Not listed"}</strong></div>
            <div className="vf-metric"><span>Urgency</span><strong>{room?.urgency || "Not listed"}</strong></div>
            <div className="vf-metric"><span>Score</span><strong>{room?.score || (isPain ? "88" : "84")}</strong></div>
            <div className="vf-metric"><span>Asking</span><strong>{money(room?.asking || "")}</strong></div>
            <div className="vf-metric"><span>ARV / Value</span><strong>{money(room?.arv || "")}</strong></div>
            <div className="vf-metric"><span>Repairs</span><strong>{money(room?.repairs || "")}</strong></div>
            <div className="vf-metric"><span>Capital Need</span><strong>{room?.capital_needed || "Not listed"}</strong></div>
            <div className="vf-metric"><span>Source Table</span><strong>{room?.source_table || "not-found"}</strong></div>
          </div>
        </section>

        <section className="vf-card">
          <div className="vf-kicker">{isPain ? "Pain Execution AI" : "Deal Room AI"}</div>

          <div className="vf-box-grid">
            <div className="vf-box">
              <h3 style={{ color: "#86efac" }}>
                {isPain ? "What can be solved" : "What looks good"}
              </h3>
              <p>
                {isPain
                  ? "This room can be routed if the blocker, deadline, capital need, and decision-maker are clear."
                  : "This room can support underwriting, buyer fit, capital routing, and execution review once numbers and documents are complete."}
              </p>
            </div>

            <div className="vf-box">
              <h3 style={{ color: "#fca5a5" }}>
                {isPain ? "Execution risk" : "What needs caution"}
              </h3>
              <p>
                {isPain
                  ? "Delay increases pressure. Pain rooms lose value when ownership, deadline, and next action are unclear."
                  : "Verify title, documents, repairs, occupancy, capital assumptions, and exit path before routing heavily."}
              </p>
            </div>

            <div className="vf-box">
              <h3 style={{ color: "#93c5fd" }}>Next steps</h3>
              <p>
                {isPain
                  ? "Assign owner, confirm deadline, route matched operator/capital/buyer profiles, and keep messages tied to this room."
                  : "Confirm economics, attach docs/photos, route matched buyers, capital, and operators, then move toward review or archive."}
              </p>
            </div>
          </div>
        </section>

        <section className="vf-card">
          <div className="vf-kicker">Matched Profiles</div>

          <div className="vf-box-grid">
            <div className="vf-box"><h3>{isPain ? "Rescue Capital" : "Buyer Match"}</h3><p>Fit based on geography, room type, strategy, urgency, and execution profile.</p></div>
            <div className="vf-box"><h3>{isPain ? "Operator Match" : "Capital Match"}</h3><p>Fit based on local execution, funding need, operator capacity, and market focus.</p></div>
            <div className="vf-box"><h3>{isPain ? "Buyer / Exit Match" : "Operator Match"}</h3><p>Fit based on ability to move the room toward resolution.</p></div>
          </div>
        </section>
      </div>
    </main>
  );
}
