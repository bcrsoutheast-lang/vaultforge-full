"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const FOUNDER_DEADLINE = new Date("2026-05-15T23:59:59-04:00").getTime();
const FOUNDER_LIMIT = 50;

const OWNER_LOGO = "/vaultforge-logo.png";

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at 18% 8%, rgba(218, 173, 71, .18), transparent 30%), radial-gradient(circle at 85% 12%, rgba(184, 20, 34, .20), transparent 32%), radial-gradient(circle at 52% 74%, rgba(218, 173, 71, .08), transparent 38%), linear-gradient(180deg, #020204 0%, #08090d 42%, #110305 74%, #020204 100%)",
  color: "#fff7e4",
  fontFamily:
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Arial, sans-serif",
  padding: "24px 16px 90px",
  overflowX: "hidden",
};

const wrap: React.CSSProperties = {
  maxWidth: 1220,
  margin: "0 auto",
};

const topBar: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  marginBottom: 24,
  position: "sticky",
  top: 14,
  zIndex: 50,
  padding: "12px 14px",
  border: "1px solid rgba(218,173,71,.18)",
  borderRadius: 999,
  background: "rgba(2,2,4,.72)",
  backdropFilter: "blur(16px)",
  boxShadow: "0 22px 70px rgba(0,0,0,.35)",
};

const brandLockup: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  minWidth: 0,
};

const brandMark: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 14,
  objectFit: "cover",
  border: "1px solid rgba(218,173,71,.42)",
  boxShadow: "0 0 28px rgba(218,173,71,.18)",
};

const brandText: React.CSSProperties = {
  color: "#f3ca64",
  fontWeight: 950,
  letterSpacing: 3,
  fontSize: 14,
  whiteSpace: "nowrap",
};

const navGroup: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const navBtn: React.CSSProperties = {
  color: "#fff7e4",
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,.15)",
  borderRadius: 999,
  padding: "10px 14px",
  fontSize: 13,
  background: "rgba(255,255,255,.035)",
  fontWeight: 800,
};

const hero: React.CSSProperties = {
  position: "relative",
  overflow: "hidden",
  textAlign: "center",
  border: "1px solid rgba(218,173,71,.26)",
  borderRadius: 38,
  padding: "36px 18px 42px",
  background:
    "linear-gradient(135deg, rgba(255,255,255,.075), rgba(255,255,255,.018) 48%, rgba(184,20,34,.10)), radial-gradient(circle at top, rgba(218,173,71,.11), transparent 45%)",
  boxShadow: "0 35px 110px rgba(0,0,0,.66), inset 0 1px 0 rgba(255,255,255,.12)",
};

const signalGrid: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  opacity: 0.34,
  backgroundImage:
    "linear-gradient(rgba(218,173,71,.13) 1px, transparent 1px), linear-gradient(90deg, rgba(218,173,71,.13) 1px, transparent 1px)",
  backgroundSize: "58px 58px",
  maskImage: "radial-gradient(circle at center, black, transparent 72%)",
  pointerEvents: "none",
};

const redPulse: React.CSSProperties = {
  position: "absolute",
  width: 340,
  height: 340,
  borderRadius: "50%",
  right: -90,
  top: -100,
  background: "rgba(184,20,34,.26)",
  filter: "blur(40px)",
  pointerEvents: "none",
};

const goldPulse: React.CSSProperties = {
  position: "absolute",
  width: 380,
  height: 380,
  borderRadius: "50%",
  left: -110,
  bottom: -130,
  background: "rgba(218,173,71,.16)",
  filter: "blur(42px)",
  pointerEvents: "none",
};

const heroInner: React.CSSProperties = {
  position: "relative",
  zIndex: 2,
};

const logo: React.CSSProperties = {
  width: "100%",
  maxWidth: 570,
  borderRadius: 30,
  boxShadow:
    "0 35px 110px rgba(0,0,0,.72), 0 0 58px rgba(218,173,71,.19), 0 0 44px rgba(184,20,34,.12)",
  margin: "4px auto 30px",
  display: "block",
  border: "1px solid rgba(218,173,71,.22)",
};

const eyebrow: React.CSSProperties = {
  color: "#f3ca64",
  letterSpacing: 5,
  fontWeight: 950,
  fontSize: 12,
  marginBottom: 14,
  textTransform: "uppercase",
};

const redEyebrow: React.CSSProperties = {
  ...eyebrow,
  color: "#ff4d55",
};

const title: React.CSSProperties = {
  fontSize: "clamp(48px, 10.4vw, 112px)",
  lineHeight: 0.86,
  letterSpacing: -4,
  margin: "0 auto 22px",
  maxWidth: 1050,
  fontWeight: 950,
};

const subtitle: React.CSSProperties = {
  color: "rgba(255,247,228,.76)",
  fontSize: "clamp(19px, 3.6vw, 28px)",
  lineHeight: 1.34,
  maxWidth: 930,
  margin: "0 auto 28px",
};

const primary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #ffe08a, #c8912d 58%, #7b1118)",
  color: "#050305",
  textDecoration: "none",
  borderRadius: 999,
  padding: "16px 24px",
  fontWeight: 950,
  fontSize: 16,
  margin: "8px",
  minHeight: 52,
  border: "1px solid rgba(255,224,138,.55)",
  boxShadow: "0 18px 50px rgba(218,173,71,.22)",
};

const secondary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff7e4",
  textDecoration: "none",
  border: "1px solid rgba(218,173,71,.24)",
  borderRadius: 999,
  padding: "16px 24px",
  fontWeight: 850,
  fontSize: 16,
  margin: "8px",
  background: "rgba(255,255,255,.045)",
  minHeight: 52,
};

const danger: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff7e4",
  textDecoration: "none",
  border: "1px solid rgba(255,77,85,.42)",
  borderRadius: 999,
  padding: "16px 24px",
  fontWeight: 900,
  fontSize: 16,
  margin: "8px",
  background: "rgba(184,20,34,.14)",
  minHeight: 52,
};

const statRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
  gap: 14,
  marginTop: 28,
};

const stat: React.CSSProperties = {
  border: "1px solid rgba(218,173,71,.17)",
  background: "linear-gradient(180deg, rgba(0,0,0,.34), rgba(255,255,255,.025))",
  borderRadius: 24,
  padding: 18,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,.06)",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: 18,
  marginTop: 22,
};

const section: React.CSSProperties = {
  position: "relative",
  marginTop: 26,
  border: "1px solid rgba(218,173,71,.16)",
  background:
    "linear-gradient(145deg, rgba(255,255,255,.055), rgba(255,255,255,.018)), radial-gradient(circle at top right, rgba(184,20,34,.10), transparent 36%)",
  borderRadius: 32,
  padding: 24,
  boxShadow: "0 24px 80px rgba(0,0,0,.34)",
  overflow: "hidden",
};

const commandSection: React.CSSProperties = {
  ...section,
  border: "1px solid rgba(255,77,85,.24)",
  background:
    "linear-gradient(145deg, rgba(184,20,34,.11), rgba(255,255,255,.028)), radial-gradient(circle at top left, rgba(218,173,71,.13), transparent 38%)",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(218,173,71,.15)",
  background:
    "linear-gradient(180deg, rgba(255,255,255,.058), rgba(255,255,255,.02))",
  borderRadius: 26,
  padding: 22,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,.065)",
};

const hotCard: React.CSSProperties = {
  ...card,
  border: "1px solid rgba(255,77,85,.26)",
  background:
    "linear-gradient(180deg, rgba(184,20,34,.12), rgba(255,255,255,.02))",
};

const cardTitle: React.CSSProperties = {
  fontSize: 24,
  margin: "0 0 10px",
  color: "#fff7e4",
};

const muted: React.CSSProperties = {
  color: "rgba(255,247,228,.68)",
  lineHeight: 1.58,
  fontSize: 16,
};

const bigLine: React.CSSProperties = {
  fontSize: "clamp(36px, 7.4vw, 76px)",
  lineHeight: 0.95,
  letterSpacing: -2.5,
  margin: "0 0 14px",
  fontWeight: 950,
};

const gold: React.CSSProperties = {
  color: "#f3ca64",
};

const red: React.CSSProperties = {
  color: "#ff4d55",
};

const listItem: React.CSSProperties = {
  borderBottom: "1px solid rgba(218,173,71,.12)",
  padding: "15px 0",
  color: "rgba(255,247,228,.78)",
  fontSize: 17,
  lineHeight: 1.45,
};

const countdownBox: React.CSSProperties = {
  marginTop: 26,
  border: "1px solid rgba(218,173,71,.38)",
  background:
    "radial-gradient(circle at top left, rgba(218,173,71,.18), transparent 33%), radial-gradient(circle at bottom right, rgba(184,20,34,.20), transparent 38%), linear-gradient(135deg, rgba(255,255,255,.075), rgba(255,255,255,.02))",
  borderRadius: 32,
  padding: 24,
  textAlign: "left",
  boxShadow: "0 30px 100px rgba(0,0,0,.44)",
};

const countdownGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(68px, 1fr))",
  gap: 12,
  marginTop: 18,
};

const timeCard: React.CSSProperties = {
  border: "1px solid rgba(218,173,71,.18)",
  background: "rgba(0,0,0,.34)",
  borderRadius: 22,
  padding: "16px 10px",
  textAlign: "center",
};

const chip: React.CSSProperties = {
  display: "inline-flex",
  border: "1px solid rgba(218,173,71,.25)",
  color: "#f3ca64",
  background: "rgba(218,173,71,.07)",
  borderRadius: 999,
  padding: "8px 11px",
  fontWeight: 850,
  fontSize: 12,
  margin: "0 7px 7px 0",
};

const redChip: React.CSSProperties = {
  ...chip,
  border: "1px solid rgba(255,77,85,.30)",
  color: "#ff6b72",
  background: "rgba(184,20,34,.12)",
};

const feedPanel: React.CSSProperties = {
  border: "1px solid rgba(218,173,71,.19)",
  background: "rgba(0,0,0,.28)",
  borderRadius: 28,
  padding: 18,
};

const feedRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "96px 1fr auto",
  gap: 12,
  alignItems: "center",
  borderBottom: "1px solid rgba(218,173,71,.10)",
  padding: "13px 0",
  color: "rgba(255,247,228,.82)",
  fontSize: 14,
};

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString("en-US");
}

function getTimeLeft() {
  const diff = FOUNDER_DEADLINE - Date.now();

  if (diff <= 0) {
    return {
      expired: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  return {
    expired: false,
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function FeatureCard({
  label,
  title,
  text,
  tags = [],
  hot = false,
}: {
  label: string;
  title: string;
  text: string;
  tags?: string[];
  hot?: boolean;
}) {
  return (
    <div style={hot ? hotCard : card}>
      <div style={hot ? redEyebrow : eyebrow}>{label}</div>
      <h3 style={cardTitle}>{title}</h3>
      <p style={muted}>{text}</p>
      {tags.length > 0 && (
        <div style={{ marginTop: 14 }}>
          {tags.map((tag, index) => (
            <span key={tag} style={hot && index === 0 ? redChip : chip}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function FlowCard({
  step,
  title,
  text,
}: {
  step: string;
  title: string;
  text: string;
}) {
  return (
    <div style={card}>
      <div style={redEyebrow}>{step}</div>
      <h3 style={cardTitle}>{title}</h3>
      <p style={muted}>{text}</p>
    </div>
  );
}

function MarketSignal({
  market,
  signal,
  status,
  hot = false,
}: {
  market: string;
  signal: string;
  status: string;
  hot?: boolean;
}) {
  return (
    <div style={feedRow}>
      <strong style={{ color: hot ? "#ff6b72" : "#f3ca64", letterSpacing: 1 }}>
        {market}
      </strong>
      <span>{signal}</span>
      <span style={hot ? redChip : chip}>{status}</span>
    </div>
  );
}

export default function HomePage() {
  const [stats, setStats] = useState({
    members: 0,
    deals: 0,
    saved: 0,
    alerts: 0,
    markets: 6,
    founders: 0,
  });

  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  useEffect(() => {
    let mounted = true;

    async function loadStats() {
      try {
        const [statsRes, founderRes] = await Promise.all([
          fetch("/api/public/stats", { cache: "no-store" }),
          fetch("/api/founder/status", { cache: "no-store" }),
        ]);

        const data = await statsRes.json();
        const founderData = await founderRes.json();

        if (!mounted) return;

        setStats({
          members: Number(data?.members || 0),
          deals: Number(data?.deals || 0),
          saved: Number(data?.saved || 0),
          alerts: Number(data?.alerts || 0),
          markets: Number(data?.markets || 6),
          founders: Number(founderData?.founder?.count || 0),
        });
      } catch {
        // Keep homepage live even if stats are temporarily unavailable.
      }
    }

    loadStats();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const founderActive = !timeLeft.expired && stats.founders < FOUNDER_LIMIT;
  const founderSlotsLeft = Math.max(0, FOUNDER_LIMIT - stats.founders);

  const liveStats = useMemo(
    () => [
      {
        label: "PRIVATE MEMBERS",
        value: stats.members > 0 ? formatNumber(stats.members) : "Curated",
        text: "Investors, lenders, operators, sources, buyers, and partners entering the private network.",
      },
      {
        label: "DEAL SIGNALS",
        value: stats.deals > 0 ? formatNumber(stats.deals) : "Routing",
        text: "Residential, commercial, land, distress, capital, and execution opportunities structured into signal flow.",
      },
      {
        label: "INTELLIGENCE ALERTS",
        value: formatNumber(stats.alerts),
        text: "Routing signals generated from deal data, market pressure, member needs, buy boxes, and operator fit.",
      },
      {
        label: "TARGET MARKETS",
        value: `${formatNumber(stats.markets)}+`,
        text: "Initial Southeast and high-activity real estate markets targeted for private member routing.",
      },
    ],
    [stats]
  );

  return (
    <main style={page}>
      <style>{`
        @media (max-width: 760px) {
          .vf-home-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .vf-home-actions > * {
            width: 100%;
            margin: 0 !important;
            box-sizing: border-box;
          }

          .vf-topbar {
            align-items: flex-start !important;
            border-radius: 24px !important;
            flex-direction: column !important;
          }

          .vf-navgroup {
            width: 100%;
            justify-content: flex-start !important;
          }

          .vf-feed-row {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div style={wrap}>
        <header className="vf-topbar" style={topBar}>
          <div style={brandLockup}>
            <img src={OWNER_LOGO} alt="VaultForge" style={brandMark} />
            <div>
              <div style={brandText}>VAULTFORGE</div>
              <div style={{ color: "rgba(255,247,228,.58)", fontSize: 12, marginTop: 2 }}>
                Intelligent-Driven Real Estate Network
              </div>
            </div>
          </div>

          <nav className="vf-navgroup" style={navGroup}>
            <Link href="/terms" style={navBtn}>
              Rules
            </Link>
            <Link href="/apply" style={navBtn}>
              Apply
            </Link>
            <Link href="/login" style={navBtn}>
              Member Login
            </Link>
          </nav>
        </header>

        <section style={hero}>
          <div style={signalGrid} />
          <div style={redPulse} />
          <div style={goldPulse} />

          <div style={heroInner}>
            <img src={OWNER_LOGO} alt="VaultForge" style={logo} />

            <div style={redEyebrow}>PRIVATE REAL ESTATE INTELLIGENCE NETWORK</div>

            <h1 style={title}>
              The <span style={gold}>Bloomberg sidekick</span> for real estate players.
            </h1>

            <p style={subtitle}>
              VaultForge is an intelligent-driven private network where capital, operators,
              buyers, lenders, sources, and opportunity are routed through one command system.
              Signals become action. Deals find the right people. Execution moves faster.
            </p>

            <div className="vf-home-actions">
              <Link href="/apply" style={primary}>
                {founderActive ? "Request Founding Access" : "Request Member Access"}
              </Link>
              <Link href="/dashboard" style={danger}>
                Preview Command Center
              </Link>
              <Link href="/terms" style={secondary}>
                Read Network Rules
              </Link>
            </div>

            <div style={statRow}>
              {liveStats.map((item) => (
                <div key={item.label} style={stat}>
                  <div style={{ ...eyebrow, marginBottom: 8 }}>{item.label}</div>
                  <div style={{ fontSize: 34, fontWeight: 950 }}>{item.value}</div>
                  <p style={muted}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={commandSection}>
          <div style={redEyebrow}>LIVE INTELLIGENCE FEEL</div>
          <h2 style={bigLine}>
            Not another listing board. <span style={gold}>A private market terminal.</span>
          </h2>
          <p style={{ ...muted, fontSize: 20, maxWidth: 980 }}>
            VaultForge is built to read the market through member needs, project pressure, capital gaps,
            buyer demand, distress signals, and execution capacity. The platform does not just show data.
            It turns real estate movement into routed opportunity.
          </p>

          <div style={grid}>
            <div style={feedPanel}>
              <div style={eyebrow}>MARKET SIGNAL FEED</div>
              <div className="vf-feed-row">
                <MarketSignal
                  market="ATL"
                  signal="Investor demand rising around value-add residential assets"
                  status="ACTIVE"
                />
                <MarketSignal
                  market="TPA"
                  signal="Capital gap detected across land and small commercial projects"
                  status="PRESSURE"
                  hot
                />
                <MarketSignal
                  market="CLT"
                  signal="Operator match potential for stalled renovation pipeline"
                  status="MATCH"
                />
                <MarketSignal
                  market="BHM"
                  signal="Distress signal flagged for buyer/lender routing"
                  status="URGENT"
                  hot
                />
                <MarketSignal
                  market="JAX"
                  signal="Acquisition profile aligns with active buy-box demand"
                  status="ROUTE"
                />
              </div>
            </div>

            <div style={feedPanel}>
              <div style={redEyebrow}>ROUTING ENGINE</div>
              <h3 style={{ ...cardTitle, fontSize: 32 }}>Signals → Matches → Introductions.</h3>
              <p style={{ ...muted, fontSize: 18 }}>
                The goal is simple: stop letting valuable opportunities die in scattered texts,
                cold calls, dead spreadsheets, and disconnected relationships. VaultForge organizes
                the network so the right opportunity finds the right player faster.
              </p>
              <div style={{ marginTop: 18 }}>
                <span style={redChip}>Urgency</span>
                <span style={chip}>Capital Fit</span>
                <span style={chip}>Operator Fit</span>
                <span style={redChip}>Distress Signal</span>
                <span style={chip}>Buy Box Match</span>
              </div>
            </div>
          </div>
        </section>

        {founderActive ? (
          <section style={countdownBox}>
            <div style={redEyebrow}>SELECTED FOUNDING NETWORK</div>
            <h2 style={bigLine}>
              Founder access is limited to the first <span style={gold}>50 selected members</span> or{" "}
              <span style={red}>May 15</span> — whichever comes first.
            </h2>
            <p style={{ ...muted, fontSize: 20 }}>
              The first cohort is intentionally limited. VaultForge needs serious players first:
              investors, lenders, operators, deal sources, buyers, contractors, developers, and partners
              who can create movement inside the network. Founder access starts at{" "}
              <strong style={gold}>$49 for the first month</strong>, then{" "}
              <strong style={gold}>$199/month</strong> unless canceled before renewal.
            </p>

            <div style={countdownGrid}>
              <div style={timeCard}>
                <div style={{ fontSize: 34, fontWeight: 950 }}>{timeLeft.days}</div>
                <div style={{ ...muted, fontSize: 13 }}>DAYS</div>
              </div>
              <div style={timeCard}>
                <div style={{ fontSize: 34, fontWeight: 950 }}>{timeLeft.hours}</div>
                <div style={{ ...muted, fontSize: 13 }}>HOURS</div>
              </div>
              <div style={timeCard}>
                <div style={{ fontSize: 34, fontWeight: 950 }}>{timeLeft.minutes}</div>
                <div style={{ ...muted, fontSize: 13 }}>MINUTES</div>
              </div>
              <div style={timeCard}>
                <div style={{ fontSize: 34, fontWeight: 950 }}>{timeLeft.seconds}</div>
                <div style={{ ...muted, fontSize: 13 }}>SECONDS</div>
              </div>
            </div>

            <div style={statRow}>
              <div style={stat}>
                <div style={{ ...eyebrow, marginBottom: 8 }}>FOUNDER POSITIONS LEFT</div>
                <div style={{ fontSize: 38, fontWeight: 950 }}>{founderSlotsLeft}</div>
                <p style={muted}>The founding network closes automatically at 50 members or May 15.</p>
              </div>
              <div style={stat}>
                <div style={{ ...eyebrow, marginBottom: 8 }}>FOUNDERS CLAIMED</div>
                <div style={{ fontSize: 38, fontWeight: 950 }}>
                  {stats.founders}/{FOUNDER_LIMIT}
                </div>
                <p style={muted}>Early members get priority position inside the private intelligence layer.</p>
              </div>
            </div>

            <div className="vf-home-actions" style={{ marginTop: 20 }}>
              <Link href="/apply" style={primary}>
                Request Founding Access — $49 First Month
              </Link>
              <Link href="/dashboard" style={danger}>
                Preview Member Command Center
              </Link>
            </div>
          </section>
        ) : (
          <section style={countdownBox}>
            <div style={redEyebrow}>STANDARD MEMBER ACCESS</div>
            <h2 style={bigLine}>Founder access has closed.</h2>
            <p style={{ ...muted, fontSize: 20 }}>
              Standard access is now <strong style={gold}>$99 to join</strong>, then{" "}
              <strong style={gold}>$199/month</strong> unless canceled before renewal.
            </p>
            <Link href="/apply" style={primary}>
              Apply for Member Access
            </Link>
          </section>
        )}

        <section style={section}>
          <div style={eyebrow}>WHO BELONGS INSIDE</div>
          <h2 style={bigLine}>
            Built for serious real estate players. <span style={red}>Not spectators.</span>
          </h2>

          <div style={grid}>
            <FeatureCard
              label="CAPITAL"
              title="Lenders & Capital Sources"
              text="Hard money, private capital, bridge, DSCR, construction, transactional funding, and JV capital looking for organized opportunity flow."
              tags={["Capital Fit", "Funding Gaps", "Deal Execution"]}
              hot
            />
            <FeatureCard
              label="ACQUISITION"
              title="Investors & Buyers"
              text="Flippers, landlords, developers, funds, and acquisition operators who need targeted opportunities matched to their buy box."
              tags={["Buy Box", "Markets", "Strategy"]}
            />
            <FeatureCard
              label="SUPPLY"
              title="Deal Sources & Wholesalers"
              text="Relationship-driven sources with real access to off-market, distressed, commercial, land, and value-add opportunities."
              tags={["Signal Source", "Inventory", "Relationships"]}
            />
            <FeatureCard
              label="EXECUTION"
              title="Operators & Contractors"
              text="GCs, project managers, rehab teams, development operators, and execution partners who turn opportunity into finished outcomes."
              tags={["Execution", "Capacity", "Operators"]}
              hot
            />
            <FeatureCard
              label="PARTNERS"
              title="Title, Legal & Strategic Partners"
              text="Transaction partners who help opportunities move from signal to closing with trust, speed, and structure."
              tags={["Trust", "Closing", "Infrastructure"]}
            />
            <FeatureCard
              label="PROBLEM SOLVERS"
              title="Sellers, Connectors & Deal Makers"
              text="People with access, pain points, relationship leverage, market knowledge, or problems that need capital, operators, or buyers."
              tags={["Access", "Pain", "Routing"]}
            />
          </div>
        </section>

        <section style={commandSection}>
          <div style={redEyebrow}>HOW VAULTFORGE MOVES</div>
          <h2 style={bigLine}>
            The network is trained by profiles, deals, pressure, and action.
          </h2>
          <p style={{ ...muted, fontSize: 20 }}>
            Members do not just create accounts. They train the intelligence layer with markets,
            roles, buy boxes, strategies, needs, capital, execution capacity, and what they can provide.
            That profile becomes the routing map.
          </p>

          <div style={grid}>
            <FlowCard
              step="STEP 1"
              title="Request Access"
              text="Start with member access. VaultForge is built around selected network quality, not random public noise."
            />
            <FlowCard
              step="STEP 2"
              title="Train the Intelligence Profile"
              text="Define your markets, roles, needs, buy box, capital, strategy, and what you can bring to the table."
            />
            <FlowCard
              step="STEP 3"
              title="Enter the Command Center"
              text="Use alerts, routing inbox, introductions, deal rooms, intelligence feeds, member data, and activity signals."
            />
          </div>

          <div className="vf-home-actions" style={{ marginTop: 18 }}>
            <Link href="/apply" style={primary}>
              Start Access Flow
            </Link>
            <Link href="/login" style={secondary}>
              Member Login
            </Link>
          </div>
        </section>

        <section style={section}>
          <div style={eyebrow}>WHAT MEMBERS GET INSIDE</div>
          <h2 style={bigLine}>
            A private workspace for <span style={gold}>signals, routes, introductions, and execution.</span>
          </h2>

          <div style={grid}>
            <FeatureCard
              label="INTELLIGENCE"
              title="Smart Alerts"
              text="Opportunity signals organized around market movement, member profile fit, urgency, capital need, operator need, and execution potential."
              tags={["Urgency", "Why Matched", "Confidence"]}
              hot
            />
            <FeatureCard
              label="ROUTING"
              title="Routing Inbox"
              text="A focused inbox for opportunities routed by profile, strategy, role, market, pressure, and fit."
              tags={["Routed", "Relevant", "Actionable"]}
            />
            <FeatureCard
              label="INTRODUCTIONS"
              title="Controlled Introductions"
              text="Owner-reviewed introductions create cleaner deal movement without turning the network into chaos."
              tags={["Controlled", "Private", "Trackable"]}
            />
            <FeatureCard
              label="DEAL ROOMS"
              title="Exact Work Rooms"
              text="Every real signal, deal, pain point, or route should open its own exact room instead of dumping members into generic pages."
              tags={["Exact IDs", "Context", "Deal Work"]}
            />
            <FeatureCard
              label="ACTIVITY"
              title="Network Activity Feed"
              text="Routing actions, staged intros, responses, pressure events, and market movement become visible operational intelligence."
              tags={["Activity", "Pressure", "Movement"]}
            />
            <FeatureCard
              label="PROFILE"
              title="AI Training Profile"
              text="The profile is not a basic form. It is the data layer that teaches VaultForge how to route opportunity."
              tags={["Buy Box", "Needs", "Can Provide"]}
              hot
            />
          </div>
        </section>

        <section style={section}>
          <div style={redEyebrow}>INTELLIGENT-DRIVEN ADVANTAGE</div>
          <h2 style={bigLine}>
            VaultForge is designed to become smarter as the network moves.
          </h2>
          <div style={listItem}>Reads opportunities against member markets, roles, buy boxes, capital, strategies, and execution capacity.</div>
          <div style={listItem}>Surfaces why a match matters instead of dumping raw listings into a dead feed.</div>
          <div style={listItem}>Turns member profiles into routing intelligence, not static directory cards.</div>
          <div style={listItem}>Creates a private operating layer where deal flow, capital flow, and operator flow can converge.</div>
          <div style={listItem}>Builds proprietary network data as members create, route, respond, save, and act.</div>
        </section>

        <section style={section}>
          <div style={eyebrow}>WHY THE NETWORK HAS VALUE</div>
          <h2 style={bigLine}>
            One routed relationship can be worth more than the platform cost for years.
          </h2>
          <p style={{ ...muted, fontSize: 20 }}>
            VaultForge is not priced like generic software because the value is not buttons on a screen.
            The value is private access, intelligent routing, faster execution, organized deal context,
            quality members, capital visibility, and being closer to the right opportunity before the crowd sees it.
          </p>
        </section>

        <section style={{ ...hero, marginTop: 26 }}>
          <div style={signalGrid} />
          <div style={redPulse} />
          <div style={heroInner}>
            <div style={redEyebrow}>PRIVATE ACCESS</div>
            <h2 style={bigLine}>
              If you need capital, deal flow, operators, buyers, or private market intelligence — this is where you belong.
            </h2>
            <p style={subtitle}>
              VaultForge is being built for people who move real estate, solve problems, create opportunity,
              deploy capital, operate projects, and turn signals into action.
            </p>
            <div className="vf-home-actions">
              <Link href="/apply" style={primary}>
                {founderActive ? "Request Founding Access" : "Apply for Member Access"}
              </Link>
              <Link href="/dashboard" style={danger}>
                Preview Member Command Center
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
