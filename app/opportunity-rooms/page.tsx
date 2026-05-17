import Link from "next/link";
import VaultForgeCommandShell from "../components/VaultForgeCommandShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const rooms = [
  {
    id: "opp-1",
    title: "Goober House",
    location: "Bartow County, GA",
    strategy: "Fix & Flip",
    asset: "Residential",
    ask: "$210K",
    arv: "$310K",
    repairs: "$50K",
    score: 84,
    execution: 77,
    risk: 42,
    summary: "Strong spread with moderate rehab risk and southeast buyer fit.",
    status: "ACTIVE",
  },
  {
    id: "opp-2",
    title: "Mountain Lion",
    location: "Atlanta, GA",
    strategy: "Value Add",
    asset: "Multifamily",
    ask: "$1.2M",
    arv: "$1.8M",
    repairs: "$240K",
    score: 89,
    execution: 82,
    risk: 37,
    summary: "High operator demand with strong upside and capital interest.",
    status: "ROUTED",
  },
];

export default function OpportunityRoomsPage() {
  return (
    <VaultForgeCommandShell
      active="opportunity"
      eyebrow="VAULTFORGE OPPORTUNITY FLOW"
      title="Opportunity Rooms"
      subtitle="High-signal investment opportunities with execution scoring, routing fit, and clean operational flow."
    >
      <style>{`
        .vf-feed {
          display:grid;
          gap:16px;
        }

        .vf-card {
          border:1px solid rgba(245,197,91,.18);
          background:
            radial-gradient(circle at top right, rgba(245,197,91,.08), transparent 26%),
            linear-gradient(145deg, rgba(10,15,28,.96), rgba(2,6,23,.98));
          border-radius:24px;
          padding:18px;
          display:grid;
          grid-template-columns:140px minmax(0,1fr);
          gap:18px;
        }

        .vf-photo {
          border-radius:18px;
          min-height:140px;
          background:
            radial-gradient(circle at top left, rgba(245,197,91,.18), transparent 28%),
            linear-gradient(135deg,#111827,#020617);
          border:1px solid rgba(148,163,184,.14);
        }

        .vf-top {
          display:flex;
          justify-content:space-between;
          gap:12px;
          align-items:flex-start;
          flex-wrap:wrap;
        }

        .vf-kicker {
          color:#f5c55b;
          font-size:11px;
          font-weight:950;
          letter-spacing:.14em;
          text-transform:uppercase;
        }

        .vf-title {
          margin:6px 0 6px;
          font-size:34px;
          line-height:.95;
          letter-spacing:-.06em;
          font-weight:950;
        }

        .vf-meta {
          color:#cbd5e1;
          font-size:14px;
          line-height:1.45;
        }

        .vf-status {
          border:1px solid rgba(34,197,94,.24);
          background:rgba(34,197,94,.08);
          color:#86efac;
          border-radius:999px;
          padding:8px 12px;
          font-size:11px;
          font-weight:950;
          letter-spacing:.12em;
        }

        .vf-econ {
          display:grid;
          grid-template-columns:repeat(3,minmax(0,1fr));
          gap:10px;
          margin-top:14px;
        }

        .vf-box {
          border:1px solid rgba(148,163,184,.14);
          background:rgba(2,6,23,.56);
          border-radius:14px;
          padding:12px;
        }

        .vf-box-label {
          color:#94a3b8;
          font-size:10px;
          font-weight:900;
          letter-spacing:.08em;
          text-transform:uppercase;
          margin-bottom:5px;
        }

        .vf-box-value {
          font-size:20px;
          font-weight:950;
        }

        .vf-score-row {
          display:flex;
          flex-wrap:wrap;
          gap:10px;
          margin-top:14px;
        }

        .vf-pill {
          border-radius:999px;
          padding:8px 12px;
          font-size:12px;
          font-weight:900;
          border:1px solid rgba(148,163,184,.14);
          background:rgba(2,6,23,.58);
        }

        .vf-summary {
          margin-top:14px;
          color:#e2e8f0;
          font-size:15px;
          line-height:1.5;
        }

        .vf-actions {
          display:flex;
          flex-wrap:wrap;
          gap:10px;
          margin-top:16px;
        }

        .vf-actions a {
          text-decoration:none;
          color:#f8fafc;
          border-radius:14px;
          padding:10px 14px;
          font-weight:900;
          font-size:13px;
          border:1px solid rgba(245,197,91,.24);
          background:rgba(245,197,91,.08);
        }

        @media (max-width: 860px) {
          .vf-card {
            grid-template-columns:1fr;
          }

          .vf-econ {
            grid-template-columns:1fr;
          }

          .vf-title {
            font-size:28px;
          }
        }
      `}</style>

      <div className="vf-feed">
        {rooms.map((room) => (
          <article className="vf-card" key={room.id}>
            <div className="vf-photo" />

            <div>
              <div className="vf-top">
                <div>
                  <div className="vf-kicker">Opportunity Room</div>
                  <h2 className="vf-title">{room.title}</h2>
                  <div className="vf-meta">
                    {room.asset} · {room.strategy} · {room.location}
                  </div>
                </div>

                <div className="vf-status">{room.status}</div>
              </div>

              <div className="vf-econ">
                <div className="vf-box">
                  <div className="vf-box-label">Ask</div>
                  <div className="vf-box-value">{room.ask}</div>
                </div>

                <div className="vf-box">
                  <div className="vf-box-label">ARV</div>
                  <div className="vf-box-value">{room.arv}</div>
                </div>

                <div className="vf-box">
                  <div className="vf-box-label">Repairs</div>
                  <div className="vf-box-value">{room.repairs}</div>
                </div>
              </div>

              <div className="vf-score-row">
                <div className="vf-pill">Deal {room.score}</div>
                <div className="vf-pill">Execution {room.execution}</div>
                <div className="vf-pill">Risk {room.risk}</div>
              </div>

              <div className="vf-summary">
                {room.summary}
              </div>

              <div className="vf-actions">
                <Link href={`/deal/detail?id=${room.id}&title=${encodeURIComponent(room.title)}`}>Open Room</Link>
                <Link href="/saved-rooms">Save</Link>
                <Link href="/archived-rooms">Archive</Link>
                <Link href="/deleted-rooms">Hide</Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </VaultForgeCommandShell>
  );
}