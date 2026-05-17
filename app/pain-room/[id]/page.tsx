import Link from "next/link";
import VaultForgeCommandShell from "../../components/VaultForgeCommandShell";
import VaultForgeAISummaryPanel from "../../components/VaultForgeAISummaryPanel";
import VaultForgeMatchedProfilesPanel from "../../components/VaultForgeMatchedProfilesPanel";
import VaultForgeRoomDisclosure from "../../components/VaultForgeRoomDisclosure";
import VaultForgeRoomScorePanel from "../../components/VaultForgeRoomScorePanel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function money(value: unknown) {
  const raw = String(value || "").replace(/[^0-9.]/g, "");
  const num = Number(raw);
  if (!Number.isFinite(num) || num <= 0) return "Not provided";
  return num.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function text(value: unknown, fallback = "Not provided") {
  const clean = String(value || "").trim();
  return clean || fallback;
}

export default async function PainRoomPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const query = await searchParams;

  const title = one(query.title) || one(query.pain_title) || one(query.name) || "Pain Execution Room";
  const city = one(query.city);
  const state = one(query.state);
  const painType = one(query.pain_type) || one(query.type) || "Execution Pressure";
  const urgency = one(query.urgency) || one(query.priority) || "High";
  const capitalNeeded = one(query.capital_needed) || one(query.amount_needed) || one(query.gap);
  const assetType = one(query.asset_type) || "Real estate problem";
  const deadline = one(query.deadline) || one(query.timeline) || "Deadline not provided";
  const blocker = one(query.blocker) || one(query.execution_blocker) || "Blocker not provided";
  const notes = one(query.notes) || one(query.description) || one(query.summary);
  const location = [city, state].filter(Boolean).join(", ") || "Market not provided";

  const scores = [
    { label: "Distress Score", value: 91, note: "Pain severity and urgency", tone: "red" as const },
    { label: "Urgency Score", value: urgency.toLowerCase().includes("critical") ? 96 : 88, note: "Time-pressure rating", tone: "red" as const },
    { label: "Execution Score", value: 79, note: "Can be acted on with right players", tone: "green" as const },
    { label: "Capital Stress", value: capitalNeeded ? 84 : 62, note: "Funding pressure indicator", tone: "gold" as const },
    { label: "Resolution Probability", value: 73, note: "Improves with matched profiles", tone: "blue" as const },
    { label: "AI Conviction", value: 89, note: "Strong problem-routing fit", tone: "purple" as const },
  ];

  const painProfiles = [
    {
      name: "Emergency Capital Desk",
      role: "Rescue Capital Match",
      score: 93,
      market: state || "Sunbelt",
      reason: "Best fit for fast capital gap, bridge funding, refinance pressure, or JV rescue scenario.",
      capacity: "Capital",
    },
    {
      name: "Turnaround Operator Network",
      role: "Operator Match",
      score: 90,
      market: location,
      reason: "Fits operational pain where boots-on-ground, PM, construction, or execution leadership may be needed.",
      capacity: "Operator",
    },
    {
      name: "Distress Buyer Group",
      role: "Buyer / Exit Match",
      score: 86,
      market: state || "Southeast",
      reason: "Can provide exit path if the pain room needs acquisition, assignment, or liquidation.",
      capacity: "Buyer",
    },
    {
      name: "Local Problem Solver",
      role: "Execution Specialist",
      score: 82,
      market: location,
      reason: "Potential fit for local verification, access, documents, city/county issue, or vendor coordination.",
      capacity: "Local execution",
    },
  ];

  return (
    <VaultForgeCommandShell
      active="pain"
      eyebrow="VAULTFORGE PAIN EXECUTION ROOM"
      title={title}
      subtitle="Pain rooms are VaultForge’s execution moat: pressure, blockers, risk, urgency, routing, matched profiles, and next actions in one clean command room."
    >
      <style>{`
        .vf-pain-room {
          display: grid;
          gap: 14px;
        }

        .vf-pain-top {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(290px, .85fr);
          gap: 14px;
        }

        .vf-panel {
          border: 1px solid rgba(148, 163, 184, 0.16);
          background: linear-gradient(145deg, rgba(15, 23, 42, 0.92), rgba(2, 6, 23, 0.97));
          border-radius: 20px;
          padding: 16px;
          box-shadow: 0 18px 50px rgba(0,0,0,.22);
        }

        .vf-panel.critical {
          border-color: rgba(239, 68, 68, 0.32);
          background:
            radial-gradient(circle at top right, rgba(239,68,68,.14), transparent 28%),
            linear-gradient(145deg, rgba(20, 8, 8, 0.96), rgba(2, 6, 23, 0.98));
        }

        .vf-kicker {
          color: #f5c55b;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: .14em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .vf-pressure-banner {
          border: 1px solid rgba(239, 68, 68, 0.38);
          background: linear-gradient(90deg, rgba(127,29,29,.72), rgba(20,8,8,.94));
          border-radius: 18px;
          padding: 15px;
          color: #fee2e2;
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .vf-pressure-banner strong {
          color: #fca5a5;
          font-size: 15px;
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .vf-data-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-top: 14px;
        }

        .vf-data {
          border: 1px solid rgba(148, 163, 184, 0.14);
          background: rgba(2, 6, 23, 0.58);
          border-radius: 15px;
          padding: 13px;
        }

        .vf-data.hot {
          border-color: rgba(239,68,68,.28);
          background: rgba(127,29,29,.18);
        }

        .vf-data-label {
          color: #94a3b8;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .08em;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .vf-data-value {
          color: #f8fafc;
          font-size: 18px;
          font-weight: 950;
          overflow-wrap: anywhere;
        }

        .vf-clock {
          min-height: 260px;
          border-radius: 18px;
          border: 1px solid rgba(239, 68, 68, 0.25);
          background:
            radial-gradient(circle at center, rgba(239,68,68,.24), transparent 52%),
            linear-gradient(135deg, #1f0707, #020617);
          display: grid;
          place-items: center;
          text-align: center;
          padding: 22px;
        }

        .vf-clock-number {
          color: #ef4444;
          font-size: 62px;
          line-height: .9;
          font-weight: 950;
          letter-spacing: -0.08em;
        }

        .vf-clock-label {
          color: #fecaca;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: .14em;
          text-transform: uppercase;
          margin-top: 10px;
        }

        .vf-timeline {
          display: grid;
          gap: 10px;
        }

        .vf-step {
          display: grid;
          grid-template-columns: 32px minmax(0, 1fr);
          gap: 12px;
          align-items: start;
          padding: 10px 0;
          border-top: 1px solid rgba(148, 163, 184, 0.12);
        }

        .vf-dot {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          color: #020617;
          background: #f5c55b;
          font-weight: 950;
          font-size: 12px;
        }

        .vf-step-title {
          font-weight: 950;
        }

        .vf-step-text {
          color: #cbd5e1;
          font-size: 13px;
          line-height: 1.45;
          margin-top: 3px;
        }

        .vf-risk-list {
          display: grid;
          gap: 9px;
        }

        .vf-risk {
          border: 1px solid rgba(239,68,68,.18);
          background: rgba(127,29,29,.13);
          border-radius: 14px;
          padding: 12px;
          color: #fee2e2;
          font-size: 13px;
          line-height: 1.45;
        }

        .vf-notes {
          color: #cbd5e1;
          line-height: 1.55;
          margin: 0;
        }

        .vf-action-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .vf-action-row a {
          color: #f8fafc;
          text-decoration: none;
          border: 1px solid rgba(245,197,91,.25);
          background: rgba(245,197,91,.07);
          border-radius: 13px;
          padding: 11px 13px;
          font-weight: 900;
          font-size: 13px;
        }

        @media (max-width: 980px) {
          .vf-pain-top,
          .vf-data-grid {
            grid-template-columns: 1fr;
          }

          .vf-clock-number {
            font-size: 52px;
          }
        }
      `}</style>

      <div className="vf-pain-room">
        <section className="vf-pain-top">
          <div className="vf-panel critical">
            <div className="vf-kicker">Pressure Summary</div>

            <div className="vf-pressure-banner">
              <strong>Execution pressure active</strong>
              <span>{painType} · {location} · Urgency: {urgency}</span>
            </div>

            <div className="vf-data-grid">
              <div className="vf-data">
                <div className="vf-data-label">Pain Room ID</div>
                <div className="vf-data-value">{id}</div>
              </div>
              <div className="vf-data">
                <div className="vf-data-label">Market</div>
                <div className="vf-data-value">{location}</div>
              </div>
              <div className="vf-data">
                <div className="vf-data-label">Pain Type</div>
                <div className="vf-data-value">{painType}</div>
              </div>
              <div className="vf-data hot">
                <div className="vf-data-label">Urgency</div>
                <div className="vf-data-value">{urgency}</div>
              </div>
              <div className="vf-data hot">
                <div className="vf-data-label">Capital Needed</div>
                <div className="vf-data-value">{money(capitalNeeded)}</div>
              </div>
              <div className="vf-data">
                <div className="vf-data-label">Asset / Context</div>
                <div className="vf-data-value">{assetType}</div>
              </div>
              <div className="vf-data">
                <div className="vf-data-label">Deadline</div>
                <div className="vf-data-value">{deadline}</div>
              </div>
              <div className="vf-data">
                <div className="vf-data-label">Main Blocker</div>
                <div className="vf-data-value">{blocker}</div>
              </div>
              <div className="vf-data">
                <div className="vf-data-label">Next Action</div>
                <div className="vf-data-value">Route execution help</div>
              </div>
            </div>
          </div>

          <aside className="vf-panel critical">
            <div className="vf-kicker">Execution Clock</div>
            <div className="vf-clock">
              <div>
                <div className="vf-clock-number">NOW</div>
                <div className="vf-clock-label">Pain rooms lose value when delayed</div>
              </div>
            </div>
          </aside>
        </section>

        <VaultForgeRoomScorePanel title="Pain Room Execution Scores" scores={scores} />

        <VaultForgeAISummaryPanel
          roomType="pain"
          data={{ title, city, state, assetType, painType, urgency, capitalNeeded, notes }}
        />

        <VaultForgeMatchedProfilesPanel title="Execution Stack Matches" profiles={painProfiles} />

        <section className="vf-panel critical">
          <div className="vf-kicker">What Happens If Nothing Is Done?</div>
          <div className="vf-risk-list">
            <div className="vf-risk">Pressure continues to rise and the room becomes harder to resolve as time passes.</div>
            <div className="vf-risk">Capital options may narrow if the deadline, documents, or decision maker are not confirmed quickly.</div>
            <div className="vf-risk">Operator or buyer confidence may drop if execution blockers are not clarified.</div>
            <div className="vf-risk">The room should be archived or hidden if no next action exists, per VaultForge 5S cleanup discipline.</div>
          </div>
        </section>

        <section className="vf-panel">
          <div className="vf-kicker">Execution Timeline</div>
          <div className="vf-timeline">
            {[
              ["1", "Pain intake", "Problem has entered VaultForge and needs structured classification."],
              ["2", "AI classification", "System identifies urgency, capital pressure, blockers, and probable route path."],
              ["3", "Matched profile routing", "Multiple buyers, lenders, operators, or specialists can be attached to the room."],
              ["4", "Intro / message / action", "Communication should stay tied to this room so execution history is clean."],
              ["5", "Resolve / archive / hide", "Room should move through the 5S cleanup model as action completes or stalls."],
            ].map(([num, stepTitle, stepText]) => (
              <div className="vf-step" key={num}>
                <div className="vf-dot">{num}</div>
                <div>
                  <div className="vf-step-title">{stepTitle}</div>
                  <div className="vf-step-text">{stepText}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="vf-panel">
          <div className="vf-kicker">Submitted Notes / Pain Context</div>
          <p className="vf-notes">{text(notes, "No notes were included in the URL payload. Next build should hydrate this pain room from the real Supabase pain table by room id.")}</p>
        </section>

        <VaultForgeRoomDisclosure />

        <div className="vf-action-row">
          <Link href="/pressure-rooms">Back to Pain Rooms</Link>
          <Link href="/messages/new">Message Around This Pain</Link>
          <Link href="/routing-inbox">View Routing Layer</Link>
          <Link href="/intelligence">View Intelligence Layer</Link>
        </div>
      </div>
    </VaultForgeCommandShell>
  );
}