import Link from "next/link";
import VaultForgeCommandShell from "../components/VaultForgeCommandShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const painRooms = [
  {
    id: "pain-1",
    title: "Operator Collapse",
    location: "Atlanta, GA",
    pain: "Execution Failure",
    urgency: "CRITICAL",
    capital: "$480K",
    blocker: "Contractor abandonment",
    distress: 92,
    execution: 74,
    risk: 88,
    summary: "Construction halted with lender pressure increasing and timeline risk escalating.",
    status: "URGENT",
  },
  {
    id: "pain-2",
    title: "Bridge Gap",
    location: "Tampa, FL",
    pain: "Funding Gap",
    urgency: "HIGH",
    capital: "$220K",
    blocker: "Refinance delay",
    distress: 81,
    execution: 79,
    risk: 70,
    summary: "Temporary capital gap with viable exit path if funding arrives quickly.",
    status: "ROUTING",
  },
];

export default function PainFeedPage() {
  return (
    <VaultForgeCommandShell
      active="pain-feed"
      eyebrow="VAULTFORGE PAIN EXECUTION FLOW"
      title="Pain Feed"
      subtitle="Execution pressure, distress signals, funding gaps, operator issues, and active resolution opportunities."
    >
      <style>{`
        .vf-feed {
          display:grid;
          gap:16px;
        }

        .vf-card {
          border:1px solid rgba(239,68,68,.24);
          background:
            radial-gradient(circle at top right, rgba(239,68,68,.14), transparent 26%),
            linear-gradient(145deg, rgba(20,8,8,.96), rgba(2,6,23,.98));
          border-radius:24px;
          padding:18px;
          display:grid;
          grid-template-columns:120px minmax(0,1fr);
          gap:18px;
        }

        .vf-alert {
          border-radius:18px;
          min-height:120px;
          background:
            radial-gradient(circle at center, rgba(239,68,68,.22), transparent 44%),
            linear-gradient(135deg,#2b0909,#020617);
          border:1px solid rgba(239,68,68,.24);
          display:grid;
          place-items:center;
          color:#ef4444;
          font-size:38px;
          font-weight:950;
        }

        .vf-top {
          display:flex;
          justify-content:space-between;
          gap:12px;
          align-items:flex-start;
          flex-wrap:wrap;
        }

        .vf-kicker {
          color:#fca5a5;
          font-size:11px;
          font-weight:950;
          letter-spacing:.14em;
          text-transform:uppercase;
        }

        .vf-title {
          margin:6px 0;
          font-size:34px;
          line-height:.95;
          letter-spacing:-.06em;
          font-weight:950;
        }

        .vf-meta {
          color:#fecaca;
          font-size:14px;
          line-height:1.45;
        }

        .vf-status {
          border:1px solid rgba(239,68,68,.28);
          background:rgba(239,68,68,.12);
          color:#fecaca;
          border-radius:999px;
          padding:8px 12px;
          font-size:11px;
          font-weight:950;
          letter-spacing:.12em;
        }

        .vf-grid {
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
          border:1px solid rgba(239,68,68,.22);
          background:rgba(127,29,29,.22);
        }

        .vf-summary {
          margin-top:14px;
          color:#fee2e2;
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
          border:1px solid rgba(239,68,68,.24);
          background:rgba(127,29,29,.22);
        }

        @media (max-width: 860px) {
          .vf-card {
            grid-template-columns:1fr;
          }

          .vf-grid {
            grid-template-columns:1fr;
          }

          .vf-title {
            font-size:28px;
          }
        }
      `}</style>

      <div className="vf-feed">
        {painRooms.map((room) => (
          <article className="vf-card" key={room.id}>
            <div className="vf-alert">!</div>

            <div>
              <div className="vf-top">
                <div>
                  <div className="vf-kicker">Pain Execution Room</div>
                  <h2 className="vf-title">{room.title}</h2>
                  <div className="vf-meta">
                    {room.pain} · {room.location}
                  </div>
                </div>

                <div className="vf-status">{room.status}</div>
              </div>

              <div className="vf-grid">
                <div className="vf-box">
                  <div className="vf-box-label">Urgency</div>
                  <div className="vf-box-value">{room.urgency}</div>
                </div>

                <div className="vf-box">
                  <div className="vf-box-label">Capital Pressure</div>
                  <div className="vf-box-value">{room.capital}</div>
                </div>

                <div className="vf-box">
                  <div className="vf-box-label">Main Blocker</div>
                  <div className="vf-box-value">{room.blocker}</div>
                </div>
              </div>

              <div className="vf-score-row">
                <div className="vf-pill">Distress {room.distress}</div>
                <div className="vf-pill">Execution {room.execution}</div>
                <div className="vf-pill">Risk {room.risk}</div>
              </div>

              <div className="vf-summary">
                {room.summary}
              </div>

              <div className="vf-actions">
                <Link href={`/pain-room/${room.id}?title=${encodeURIComponent(room.title)}`}>Open Room</Link>
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