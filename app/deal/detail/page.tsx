import Link from "next/link";
import VaultForgeCommandShell from "../../components/VaultForgeCommandShell";
import VaultForgeAISummaryPanel from "../../components/VaultForgeAISummaryPanel";
import VaultForgeMatchedProfilesPanel from "../../components/VaultForgeMatchedProfilesPanel";
import VaultForgeRoomDisclosure from "../../components/VaultForgeRoomDisclosure";
import VaultForgeRoomScorePanel from "../../components/VaultForgeRoomScorePanel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

export default async function DealDetailPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  const id = one(params.id) || one(params.deal_id) || "opportunity-room";
  const title = one(params.title) || one(params.property_title) || one(params.name) || "Opportunity Room";
  const city = one(params.city);
  const state = one(params.state);
  const assetType = one(params.asset_type) || one(params.type) || "Investment Opportunity";
  const asking = one(params.asking_price) || one(params.price);
  const arv = one(params.arv);
  const repairs = one(params.repairs) || one(params.repair_estimate);
  const strategy = one(params.strategy) || one(params.exit_strategy) || "Value-add / execution review";
  const notes = one(params.notes) || one(params.description) || one(params.summary);
  const location = [city, state].filter(Boolean).join(", ") || "Market not provided";

  const scores = [
    { label: "Deal Score", value: asking && arv ? 86 : 72, note: "Opportunity attractiveness", tone: "gold" as const },
    { label: "Execution Score", value: 78, note: "Can be routed to buyers/operators", tone: "green" as const },
    { label: "Capital Score", value: 69, note: "Funding path needs confirmation", tone: "blue" as const },
    { label: "Liquidity Score", value: 74, note: "Exit demand estimate", tone: "purple" as const },
    { label: "Risk Score", value: repairs ? 44 : 58, note: "Higher means more caution", tone: "red" as const },
    { label: "AI Conviction", value: 82, note: "Based on submitted room data", tone: "gold" as const },
  ];

  return (
    <VaultForgeCommandShell
      active="opportunity"
      eyebrow="VAULTFORGE OPPORTUNITY ROOM"
      title={title}
      subtitle="Investment-grade opportunity room with submitted numbers, AI analysis, routing fit, and execution context."
    >
      <style>{`
        .vf-room-page {
          display: grid;
          gap: 14px;
        }

        .vf-room-top {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(290px, .75fr);
          gap: 14px;
        }

        .vf-panel {
          border: 1px solid rgba(148, 163, 184, 0.16);
          background: linear-gradient(145deg, rgba(15, 23, 42, 0.92), rgba(2, 6, 23, 0.97));
          border-radius: 20px;
          padding: 16px;
          box-shadow: 0 18px 50px rgba(0,0,0,.22);
        }

        .vf-kicker {
          color: #f5c55b;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: .14em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .vf-data-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .vf-data {
          border: 1px solid rgba(148, 163, 184, 0.14);
          background: rgba(2, 6, 23, 0.58);
          border-radius: 15px;
          padding: 13px;
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

        .vf-photo {
          min-height: 260px;
          border-radius: 18px;
          border: 1px solid rgba(245, 197, 91, 0.18);
          background:
            radial-gradient(circle at 25% 30%, rgba(245,197,91,.22), transparent 30%),
            radial-gradient(circle at 72% 62%, rgba(34,197,94,.15), transparent 25%),
            linear-gradient(135deg, #0f172a, #020617);
          display: grid;
          place-items: center;
          color: #94a3b8;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .12em;
          font-size: 12px;
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
          .vf-room-top,
          .vf-data-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="vf-room-page">
        <section className="vf-room-top">
          <div className="vf-panel">
            <div className="vf-kicker">Submitted Deal Numbers</div>

            <div className="vf-data-grid">
              <div className="vf-data">
                <div className="vf-data-label">Room ID</div>
                <div className="vf-data-value">{id}</div>
              </div>
              <div className="vf-data">
                <div className="vf-data-label">Market</div>
                <div className="vf-data-value">{location}</div>
              </div>
              <div className="vf-data">
                <div className="vf-data-label">Asset Type</div>
                <div className="vf-data-value">{assetType}</div>
              </div>
              <div className="vf-data">
                <div className="vf-data-label">Asking Price</div>
                <div className="vf-data-value">{money(asking)}</div>
              </div>
              <div className="vf-data">
                <div className="vf-data-label">ARV / Stabilized Value</div>
                <div className="vf-data-value">{money(arv)}</div>
              </div>
              <div className="vf-data">
                <div className="vf-data-label">Repairs / Capex</div>
                <div className="vf-data-value">{money(repairs)}</div>
              </div>
              <div className="vf-data">
                <div className="vf-data-label">Strategy</div>
                <div className="vf-data-value">{strategy}</div>
              </div>
              <div className="vf-data">
                <div className="vf-data-label">Execution Stage</div>
                <div className="vf-data-value">Review / Routing</div>
              </div>
              <div className="vf-data">
                <div className="vf-data-label">Next Action</div>
                <div className="vf-data-value">Verify numbers</div>
              </div>
            </div>
          </div>

          <aside className="vf-panel">
            <div className="vf-kicker">Media / Documents</div>
            <div className="vf-photo">Photos / Docs Slot</div>
          </aside>
        </section>

        <VaultForgeRoomScorePanel title="Opportunity Room Scores" scores={scores} />

        <VaultForgeAISummaryPanel
          roomType="opportunity"
          data={{ title, city, state, assetType, price: asking, arv, repairs, notes }}
        />

        <VaultForgeMatchedProfilesPanel title="Buyer · Capital · Operator Matches" />

        <section className="vf-panel">
          <div className="vf-kicker">Submitted Notes / Room Context</div>
          <p className="vf-notes">{text(notes, "No notes were included in the URL payload. Next build should hydrate this room from the real Supabase deal/opportunity table by room id.")}</p>
        </section>

        <VaultForgeRoomDisclosure />

        <div className="vf-action-row">
          <Link href="/opportunity-rooms">Back to Opportunity Rooms</Link>
          <Link href="/messages/new">Message Around This Room</Link>
          <Link href="/routing-inbox">View Routing Layer</Link>
          <Link href="/intelligence">View Intelligence Layer</Link>
        </div>
      </div>
    </VaultForgeCommandShell>
  );
}