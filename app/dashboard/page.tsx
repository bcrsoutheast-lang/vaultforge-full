import Link from "next/link";
import VaultForgeCommandShell from "../components/VaultForgeCommandShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const metricCards = [
  {
    label: "Active Opportunities",
    value: "128",
    delta: "▲ 12",
    tone: "green",
    href: "/opportunity-rooms",
  },
  {
    label: "Active Pain Rooms",
    value: "93",
    delta: "▲ 7",
    tone: "red",
    href: "/pressure-rooms",
  },
  {
    label: "Execution Deals",
    value: "41",
    delta: "▲ 5",
    tone: "blue",
    href: "/projects",
  },
  {
    label: "Unread Messages",
    value: "27",
    delta: "▲ 9",
    tone: "purple",
    href: "/message-command",
  },
];

const opportunities = [
  {
    title: "Miami Multifamily Portfolio",
    meta: "Miami, FL · 276 Units",
    value: "$42.6M",
    score: "92",
    tag: "HOT",
  },
  {
    title: "Dallas Industrial Portfolio",
    meta: "Dallas, TX · 512K SF",
    value: "$38.7M",
    score: "89",
    tag: "NEW",
  },
  {
    title: "Tampa Retail Center",
    meta: "Tampa, FL · 84K SF",
    value: "$18.2M",
    score: "87",
    tag: "HOT",
  },
  {
    title: "Nashville Development Site",
    meta: "Nashville, TN · 8.4 Acres",
    value: "$12.7M",
    score: "84",
    tag: "WATCH",
  },
];

const painRooms = [
  {
    title: "Distressed Seller · Motivated",
    meta: "Atlanta, GA · Close in 14 days",
    signal: "Capital Gap: $2.1M",
    severity: "CRITICAL",
    eta: "2h",
  },
  {
    title: "Foreclosure · Auction Next Week",
    meta: "Orlando, FL · Auction 6/14",
    signal: "Est. Value: $1.8M",
    severity: "CRITICAL",
    eta: "3h",
  },
  {
    title: "Operator Needed · 220 Units",
    meta: "Houston, TX · Immediate",
    signal: "Net Loss: $18K/month",
    severity: "HIGH",
    eta: "5h",
  },
  {
    title: "Construction Halted",
    meta: "Tampa, FL · Permit Issue",
    signal: "Delay Cost: $67K/week",
    severity: "HIGH",
    eta: "6h",
  },
];

const recentActivity = [
  ["New message from Investor_8721", "2m"],
  ["Deal saved: Miami MF Deal", "5m"],
  ["Pain room updated: Atlanta Seller", "9m"],
  ["New intro accepted: Operator Network", "11m"],
  ["Routing match created", "14m"],
];

const routing = [
  ["12 New Matches Today", "AI matched buyers & operators"],
  ["7 Introductions Pending", "Waiting for member response"],
  ["4 Deals Moving to Execution", "Contracts or LOIs in progress"],
  ["3 Capital Solutions Ready", "Lender proposals available"],
];

function toneColor(tone: string) {
  if (tone === "green") return "#22c55e";
  if (tone === "red") return "#ef4444";
  if (tone === "blue") return "#38bdf8";
  if (tone === "purple") return "#a855f7";
  return "#f5c55b";
}

function SectionTitle({
  title,
  actionHref,
}: {
  title: string;
  actionHref?: string;
}) {
  return (
    <div className="vf-section-title">
      <h2>{title}</h2>
      {actionHref ? <Link href={actionHref}>VIEW ALL</Link> : null}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <VaultForgeCommandShell
      active="dashboard"
      eyebrow="VAULTFORGE AI COMMAND CENTER"
      title="Live Command Center"
      subtitle="Opportunity rooms and Pain rooms are the only true room lanes. Alerts, routing, intelligence, and messages now operate as background command layers."
    >
      <style>{`
        .vf-dashboard {
          display: grid;
          gap: 14px;
        }

        .vf-metrics {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .vf-metric {
          text-decoration: none;
          color: #f8fafc;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at bottom right, rgba(245, 197, 91, 0.09), transparent 36%),
            linear-gradient(145deg, rgba(15, 23, 42, 0.92), rgba(2, 6, 23, 0.96));
          border-radius: 18px;
          padding: 16px;
          min-height: 122px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 18px 50px rgba(0,0,0,.24);
        }

        .vf-metric-label {
          color: #cbd5e1;
          font-size: 11px;
          font-weight: 950;
          letter-spacing: .1em;
          text-transform: uppercase;
        }

        .vf-metric-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 10px;
        }

        .vf-metric-value {
          font-size: 38px;
          font-weight: 950;
          letter-spacing: -0.06em;
        }

        .vf-metric-delta {
          font-size: 13px;
          font-weight: 950;
        }

        .vf-spark {
          height: 28px;
          width: 100%;
          border-radius: 10px;
          background:
            linear-gradient(135deg, transparent 0 14%, rgba(34,197,94,.28) 15% 16%, transparent 17% 28%, rgba(34,197,94,.32) 29% 31%, transparent 32% 42%, rgba(34,197,94,.30) 43% 45%, transparent 46% 57%, rgba(34,197,94,.34) 58% 60%, transparent 61% 72%, rgba(34,197,94,.38) 73% 76%, transparent 77% 100%);
          border: 1px solid rgba(148, 163, 184, 0.08);
        }

        .vf-main-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.7fr) minmax(290px, .8fr);
          gap: 14px;
        }

        .vf-panel {
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top left, rgba(245, 197, 91, 0.07), transparent 30%),
            linear-gradient(145deg, rgba(15, 23, 42, 0.92), rgba(2, 6, 23, 0.97));
          border-radius: 20px;
          padding: 16px;
          box-shadow: 0 18px 50px rgba(0,0,0,.22);
        }

        .vf-section-title {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          margin-bottom: 12px;
        }

        .vf-section-title h2 {
          margin: 0;
          color: #f5c55b;
          font-size: 15px;
          font-weight: 950;
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        .vf-section-title a {
          color: #fef3c7;
          text-decoration: none;
          border: 1px solid rgba(245,197,91,.28);
          border-radius: 10px;
          padding: 7px 9px;
          font-size: 11px;
          font-weight: 950;
        }

        .vf-heat-grid {
          display: grid;
          grid-template-columns: 1.25fr .75fr;
          gap: 12px;
        }

        .vf-map {
          min-height: 255px;
          border-radius: 18px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at 22% 35%, rgba(245, 197, 91, 0.78), transparent 14%),
            radial-gradient(circle at 50% 44%, rgba(239, 68, 68, 0.8), transparent 18%),
            radial-gradient(circle at 70% 58%, rgba(249, 115, 22, 0.74), transparent 16%),
            radial-gradient(circle at 38% 70%, rgba(220, 38, 38, 0.78), transparent 17%),
            linear-gradient(135deg, rgba(127, 29, 29, 0.7), rgba(8, 13, 24, 1));
          position: relative;
          overflow: hidden;
        }

        .vf-map::after {
          content: "";
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px);
          background-size: 26px 26px;
          opacity: .5;
        }

        .vf-state-list {
          display: grid;
          gap: 10px;
        }

        .vf-state {
          display: grid;
          grid-template-columns: 24px 1fr 52px;
          gap: 10px;
          align-items: center;
          color: #e5e7eb;
          font-size: 14px;
        }

        .vf-bar {
          height: 6px;
          border-radius: 999px;
          background: linear-gradient(90deg, #f5c55b, #ef4444);
        }

        .vf-value {
          color: #ef4444;
          font-weight: 950;
          text-align: right;
        }

        .vf-lower-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .vf-room-row {
          display: grid;
          grid-template-columns: 64px minmax(0, 1fr) 48px;
          gap: 12px;
          align-items: center;
          padding: 10px 0;
          border-top: 1px solid rgba(148, 163, 184, 0.12);
        }

        .vf-thumb {
          width: 64px;
          height: 46px;
          border-radius: 10px;
          border: 1px solid rgba(245, 197, 91, 0.2);
          background:
            radial-gradient(circle at 30% 30%, rgba(245,197,91,.5), transparent 30%),
            linear-gradient(135deg, #0f172a, #111827);
        }

        .vf-room-title {
          font-weight: 950;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .vf-room-meta {
          color: #94a3b8;
          font-size: 12px;
          margin-top: 3px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .vf-room-money {
          color: #22c55e;
          font-weight: 950;
          font-size: 13px;
          margin-top: 3px;
        }

        .vf-score {
          color: #22c55e;
          font-size: 22px;
          font-weight: 950;
          text-align: right;
        }

        .vf-pain-row {
          display: grid;
          grid-template-columns: 46px minmax(0, 1fr) 58px;
          gap: 12px;
          align-items: center;
          padding: 11px 0;
          border-top: 1px solid rgba(239, 68, 68, 0.17);
        }

        .vf-pain-icon {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          background: radial-gradient(circle, rgba(248,113,113,.8), rgba(127,29,29,.72));
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .vf-severity {
          color: #f87171;
          font-size: 11px;
          font-weight: 950;
          text-align: right;
        }

        .vf-eta {
          color: #ef4444;
          font-size: 12px;
          font-weight: 950;
          text-align: right;
          margin-top: 4px;
        }

        .vf-side-stack {
          display: grid;
          gap: 14px;
        }

        .vf-pressure-gauge {
          min-height: 162px;
          display: grid;
          place-items: center;
          border-radius: 18px;
          border: 1px solid rgba(239, 68, 68, 0.22);
          background: radial-gradient(circle, rgba(239,68,68,.2), transparent 55%);
        }

        .vf-gauge-number {
          font-size: 58px;
          color: #ef4444;
          font-weight: 950;
          letter-spacing: -0.08em;
        }

        .vf-gauge-label {
          text-align: center;
          color: #fecaca;
          font-weight: 950;
          letter-spacing: .12em;
          font-size: 12px;
          text-transform: uppercase;
        }

        .vf-feed-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          padding: 11px 0;
          border-top: 1px solid rgba(148, 163, 184, 0.12);
          font-size: 13px;
        }

        .vf-feed-time {
          color: #94a3b8;
          white-space: nowrap;
          font-weight: 800;
        }

        .vf-shortcuts {
          display: grid;
          gap: 9px;
        }

        .vf-shortcuts a {
          color: #f8fafc;
          text-decoration: none;
          border: 1px solid rgba(245,197,91,.22);
          border-radius: 13px;
          padding: 12px;
          background: rgba(245,197,91,.05);
          font-weight: 900;
        }

        .vf-bottom-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .vf-routing-row {
          padding: 11px 0;
          border-top: 1px solid rgba(148, 163, 184, 0.12);
        }

        .vf-routing-title {
          font-weight: 950;
        }

        .vf-routing-sub {
          color: #94a3b8;
          font-size: 12px;
          margin-top: 3px;
        }

        .vf-funnel {
          display: grid;
          gap: 6px;
          margin-top: 8px;
        }

        .vf-funnel div {
          margin: 0 auto;
          height: 38px;
          display: grid;
          place-items: center;
          color: white;
          font-weight: 950;
          font-size: 12px;
          border-radius: 8px;
        }

        .vf-funnel-1 { width: 92%; background: #2563eb; }
        .vf-funnel-2 { width: 76%; background: #7c3aed; }
        .vf-funnel-3 { width: 61%; background: #dc2626; }
        .vf-funnel-4 { width: 45%; background: #d97706; }
        .vf-funnel-5 { width: 31%; background: #16a34a; }

        @media (max-width: 1180px) {
          .vf-metrics {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .vf-main-grid,
          .vf-heat-grid,
          .vf-lower-grid,
          .vf-bottom-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .vf-dashboard {
            gap: 10px;
          }

          .vf-metrics {
            grid-template-columns: 1fr 1fr;
            gap: 9px;
          }

          .vf-metric {
            min-height: 104px;
            padding: 12px;
            border-radius: 15px;
          }

          .vf-metric-label {
            font-size: 9px;
          }

          .vf-metric-value {
            font-size: 30px;
          }

          .vf-panel {
            padding: 13px;
            border-radius: 17px;
          }

          .vf-map {
            min-height: 190px;
          }

          .vf-room-row {
            grid-template-columns: 52px minmax(0, 1fr) 40px;
            gap: 9px;
          }

          .vf-thumb {
            width: 52px;
            height: 42px;
          }

          .vf-score {
            font-size: 18px;
          }

          .vf-pain-row {
            grid-template-columns: 40px minmax(0, 1fr) 48px;
            gap: 9px;
          }

          .vf-pain-icon {
            width: 40px;
            height: 40px;
          }

          .vf-shortcuts {
            grid-template-columns: 1fr 1fr;
          }

          .vf-shortcuts a {
            font-size: 12px;
            padding: 10px;
          }
        }
      `}</style>

      <div className="vf-dashboard">
        <section className="vf-metrics">
          {metricCards.map((card) => (
            <Link key={card.label} href={card.href} className="vf-metric">
              <div className="vf-metric-label">{card.label}</div>
              <div className="vf-metric-row">
                <div className="vf-metric-value">{card.value}</div>
                <div
                  className="vf-metric-delta"
                  style={{ color: toneColor(card.tone) }}
                >
                  {card.delta}
                </div>
              </div>
              <div
                className="vf-spark"
                style={{
                  background:
                    card.tone === "red"
                      ? "linear-gradient(135deg, transparent 0 14%, rgba(239,68,68,.28) 15% 16%, transparent 17% 28%, rgba(239,68,68,.32) 29% 31%, transparent 32% 42%, rgba(239,68,68,.30) 43% 45%, transparent 46% 57%, rgba(239,68,68,.34) 58% 60%, transparent 61% 72%, rgba(239,68,68,.38) 73% 76%, transparent 77% 100%)"
                      : undefined,
                }}
              />
            </Link>
          ))}
        </section>

        <section className="vf-main-grid">
          <div className="vf-dashboard">
            <div className="vf-panel">
              <SectionTitle title="Market Intelligence Overview" actionHref="/intelligence" />

              <div className="vf-heat-grid">
                <div>
                  <div className="vf-map" />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "#94a3b8",
                      fontSize: 11,
                      marginTop: 8,
                    }}
                  >
                    <span>Low</span>
                    <span>State Pressure Heat</span>
                    <span>Extreme</span>
                  </div>
                </div>

                <div>
                  <SectionTitle title="Top Pressure States" />
                  <div className="vf-state-list">
                    {[
                      ["1", "Florida", "92.1"],
                      ["2", "Georgia", "88.3"],
                      ["3", "Texas", "81.7"],
                      ["4", "Tennessee", "78.8"],
                      ["5", "North Carolina", "74.2"],
                    ].map(([rank, state, value]) => (
                      <div className="vf-state" key={state}>
                        <span>{rank}</span>
                        <span>{state}</span>
                        <span className="vf-value">{value}</span>
                        <span />
                        <span className="vf-bar" />
                        <span />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <section className="vf-lower-grid">
              <div className="vf-panel">
                <SectionTitle title="Top Opportunity Rooms" actionHref="/opportunity-rooms" />
                {opportunities.map((item) => (
                  <div className="vf-room-row" key={item.title}>
                    <div className="vf-thumb" />
                    <div style={{ minWidth: 0 }}>
                      <div className="vf-room-title">{item.title}</div>
                      <div className="vf-room-meta">{item.meta}</div>
                      <div className="vf-room-money">{item.value}</div>
                    </div>
                    <div className="vf-score">{item.score}</div>
                  </div>
                ))}
              </div>

              <div className="vf-panel" style={{ borderColor: "rgba(239,68,68,.28)" }}>
                <SectionTitle title="Urgent Pain Rooms" actionHref="/pressure-rooms" />
                {painRooms.map((item) => (
                  <div className="vf-pain-row" key={item.title}>
                    <div className="vf-pain-icon" />
                    <div style={{ minWidth: 0 }}>
                      <div className="vf-room-title">{item.title}</div>
                      <div className="vf-room-meta">{item.meta}</div>
                      <div className="vf-room-money" style={{ color: "#fecaca" }}>
                        {item.signal}
                      </div>
                    </div>
                    <div>
                      <div className="vf-severity">{item.severity}</div>
                      <div className="vf-eta">{item.eta}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="vf-bottom-grid">
              <div className="vf-panel">
                <SectionTitle title="Routing Activity" actionHref="/routing-inbox" />
                {routing.map(([title, text]) => (
                  <div className="vf-routing-row" key={title}>
                    <div className="vf-routing-title">{title}</div>
                    <div className="vf-routing-sub">{text}</div>
                  </div>
                ))}
              </div>

              <div className="vf-panel">
                <SectionTitle title="Execution Pipeline" />
                <div className="vf-funnel">
                  <div className="vf-funnel-1">Intake / Signal · 166</div>
                  <div className="vf-funnel-2">Routed · 89</div>
                  <div className="vf-funnel-3">Negotiation · 41</div>
                  <div className="vf-funnel-4">Under Contract · 17</div>
                  <div className="vf-funnel-5">Closed · 6</div>
                </div>
              </div>

              <div className="vf-panel">
                <SectionTitle title="AI Command Insights" actionHref="/intelligence" />
                <div className="vf-routing-row">
                  🔥 Distress spike detected in Central Florida counties.
                </div>
                <div className="vf-routing-row">
                  💧 Capital demand up 27% for multifamily deals.
                </div>
                <div className="vf-routing-row">
                  🏗️ Operator shortage in Texas markets is critical.
                </div>
              </div>
            </section>
          </div>

          <aside className="vf-side-stack">
            <div className="vf-panel">
              <SectionTitle title="Market Pressure" />
              <div className="vf-pressure-gauge">
                <div>
                  <div className="vf-gauge-label">Very High</div>
                  <div className="vf-gauge-number">78</div>
                  <div className="vf-gauge-label">/100</div>
                </div>
              </div>
            </div>

            <div className="vf-panel">
              <SectionTitle title="Live Alert Feed" actionHref="/alerts" />
              {[
                ["Foreclosure Spike", "Hillsborough County, FL", "CRITICAL"],
                ["Price Drop Surge", "Broward County, FL", "HIGH"],
                ["Distressed Seller Added", "Orlando, FL", "HIGH"],
                ["Lender Pullback", "Construction Loans", "HIGH"],
              ].map(([title, text, severity]) => (
                <div className="vf-feed-row" key={title}>
                  <div>
                    <div style={{ fontWeight: 950 }}>{title}</div>
                    <div style={{ color: "#94a3b8", fontSize: 12 }}>{text}</div>
                  </div>
                  <div className="vf-severity">{severity}</div>
                </div>
              ))}
            </div>

            <div className="vf-panel">
              <SectionTitle title="Recent Activity" />
              {recentActivity.map(([text, time]) => (
                <div className="vf-feed-row" key={text}>
                  <span>{text}</span>
                  <span className="vf-feed-time">{time}</span>
                </div>
              ))}
            </div>

            <div className="vf-panel">
              <SectionTitle title="Command Shortcuts" />
              <div className="vf-shortcuts">
                <Link href="/submit">+ New Opportunity</Link>
                <Link href="/pain">+ New Pain Room</Link>
                <Link href="/alerts">View Alerts</Link>
                <Link href="/members">Find Operator</Link>
                <Link href="/message-command">Messages</Link>
                <Link href="/intelligence">AI Search</Link>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </VaultForgeCommandShell>
  );
}