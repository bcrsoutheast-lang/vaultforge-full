type SummaryInput = {
  roomType?: "opportunity" | "pain";
  title?: string;
  city?: string;
  state?: string;
  assetType?: string;
  price?: string | number;
  arv?: string | number;
  repairs?: string | number;
  urgency?: string;
  notes?: string;
  painType?: string;
  capitalNeeded?: string | number;
};

function money(value: unknown) {
  const raw = String(value || "").replace(/[^0-9.]/g, "");
  const num = Number(raw);
  if (!Number.isFinite(num) || num <= 0) return "";
  return num.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default function VaultForgeAISummaryPanel({
  roomType = "opportunity",
  data = {},
}: {
  roomType?: "opportunity" | "pain";
  data?: SummaryInput;
}) {
  const isPain = roomType === "pain";
  const title = data.title || (isPain ? "Unclassified Pain Room" : "Opportunity Room");
  const location = [data.city, data.state].filter(Boolean).join(", ") || "Market not provided";
  const asset = data.assetType || data.painType || "Real estate execution item";

  const asking = money(data.price);
  const arv = money(data.arv);
  const repairs = money(data.repairs);
  const capital = money(data.capitalNeeded);

  const good = isPain
    ? [
        "The issue is structured enough to route into action instead of sitting as a loose problem.",
        location !== "Market not provided"
          ? `${location} gives VaultForge a geography anchor for matching local operators, capital, and market context.`
          : "Once location is confirmed, VaultForge can attach county/state pressure intelligence.",
        capital
          ? `Capital pressure is visible at ${capital}, which helps match lenders, JV partners, or rescue capital.`
          : "Capital need can be clarified and routed once the room owner updates numbers.",
      ]
    : [
        asking && arv ? `The submitted spread between ${asking} and ${arv} gives the room a starting underwriting anchor.` : "The room can become investment-grade once asking price, ARV, and repair data are confirmed.",
        asset ? `${asset} gives the AI a strategy lane for buyer and operator matching.` : "Asset type should be confirmed for cleaner routing.",
        location !== "Market not provided" ? `${location} creates a market-filtered match path for buyers, operators, and lenders.` : "Location data needs to be completed for stronger fit scoring.",
      ];

  const bad = isPain
    ? [
        "The biggest risk is delay. Pain rooms lose value when there is no owner, deadline, or next action.",
        "If the capital gap, legal deadline, or operator blocker is not confirmed, routing quality drops.",
        "If no member is assigned, the room becomes clutter instead of execution.",
      ]
    : [
        "Submitted opportunity data may be incomplete until documents, photos, title, occupancy, and debt facts are confirmed.",
        repairs ? `Repair estimate of ${repairs} should be verified against scope and contractor pricing.` : "Repair estimate is missing or unverified.",
        "Buyer interest does not equal execution unless capital, operator, and diligence paths are attached.",
      ];

  const next = isPain
    ? [
        "Assign room owner and define the next action.",
        "Confirm deadline, dollar pressure, and decision maker.",
        "Route to matched operators, capital partners, or buyers.",
        "Attach all messages and intros to this room instead of creating loose conversations.",
      ]
    : [
        "Verify asking price, ARV, repairs, occupancy, and exit strategy.",
        "Attach documents/photos and underwriting notes.",
        "Route to top buyer, lender, and operator matches.",
        "Move the room into negotiation, diligence, or archive based on response.",
      ];

  return (
    <section className={`vf-ai-panel ${isPain ? "pain" : "opportunity"}`}>
      <style>{`
        .vf-ai-panel {
          border: 1px solid rgba(245, 197, 91, 0.2);
          background:
            radial-gradient(circle at top right, rgba(245,197,91,.08), transparent 28%),
            linear-gradient(145deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.98));
          border-radius: 22px;
          padding: 18px;
          box-shadow: 0 18px 50px rgba(0,0,0,.22);
        }

        .vf-ai-panel.pain {
          border-color: rgba(239, 68, 68, 0.32);
          background:
            radial-gradient(circle at top right, rgba(239,68,68,.14), transparent 30%),
            radial-gradient(circle at bottom left, rgba(245,197,91,.08), transparent 26%),
            linear-gradient(145deg, rgba(20, 8, 8, 0.96), rgba(2, 6, 23, 0.98));
        }

        .vf-ai-kicker {
          color: #f5c55b;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: .16em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .vf-ai-title {
          margin: 0 0 8px;
          font-size: 25px;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        .vf-ai-sub {
          color: #cbd5e1;
          margin: 0 0 16px;
          line-height: 1.5;
        }

        .vf-ai-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .vf-ai-box {
          border: 1px solid rgba(148, 163, 184, 0.14);
          background: rgba(2, 6, 23, 0.58);
          border-radius: 16px;
          padding: 14px;
        }

        .vf-ai-box h3 {
          margin: 0 0 10px;
          font-size: 12px;
          letter-spacing: .1em;
          text-transform: uppercase;
          font-weight: 950;
        }

        .vf-ai-box.good h3 { color: #22c55e; }
        .vf-ai-box.bad h3 { color: #ef4444; }
        .vf-ai-box.next h3 { color: #38bdf8; }

        .vf-ai-box ul {
          margin: 0;
          padding-left: 18px;
          color: #dbeafe;
          line-height: 1.45;
          font-size: 13px;
        }

        .vf-ai-box li {
          margin-bottom: 8px;
        }

        @media (max-width: 900px) {
          .vf-ai-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="vf-ai-kicker">
        {isPain ? "VAULTFORGE PAIN EXECUTION ANALYSIS" : "VAULTFORGE OPPORTUNITY AI ANALYSIS"}
      </div>
      <h2 className="vf-ai-title">{title}</h2>
      <p className="vf-ai-sub">
        {isPain
          ? `Pain room classified around ${asset} in ${location}. VaultForge should treat this as an execution problem, not a passive lead.`
          : `Opportunity room classified around ${asset} in ${location}. VaultForge should turn this into an underwriting and routing decision.`}
      </p>

      <div className="vf-ai-grid">
        <div className="vf-ai-box good">
          <h3>{isPain ? "What can be solved" : "What looks good"}</h3>
          <ul>{good.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>

        <div className="vf-ai-box bad">
          <h3>{isPain ? "Execution risk" : "What needs caution"}</h3>
          <ul>{bad.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>

        <div className="vf-ai-box next">
          <h3>Next steps</h3>
          <ul>{next.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      </div>
    </section>
  );
}