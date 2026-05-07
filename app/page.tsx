"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const FOUNDER_DEADLINE = new Date("2026-05-15T23:59:59-04:00").getTime();
const FOUNDER_LIMIT = 50;

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top, rgba(214,170,62,.20), transparent 34%), radial-gradient(circle at 80% 10%, rgba(157,243,191,.13), transparent 26%), linear-gradient(180deg, #030509 0%, #071326 58%, #030509 100%)",
  color: "white",
  fontFamily: "Arial, sans-serif",
  padding: "28px 18px 90px",
};

const wrap: React.CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
};

const topBar: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 14,
  marginBottom: 34,
};

const navBtn: React.CSSProperties = {
  color: "white",
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,.18)",
  borderRadius: 999,
  padding: "11px 16px",
  fontSize: 14,
  background: "rgba(255,255,255,.04)",
};

const hero: React.CSSProperties = {
  textAlign: "center",
  border: "1px solid rgba(255,255,255,.16)",
  borderRadius: 34,
  padding: "34px 18px 42px",
  background:
    "linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.025))",
  boxShadow: "0 30px 90px rgba(0,0,0,.45)",
};

const logo: React.CSSProperties = {
  width: "100%",
  maxWidth: 620,
  borderRadius: 26,
  boxShadow: "0 25px 80px rgba(0,0,0,.55)",
  marginBottom: 30,
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: 5,
  fontWeight: 900,
  fontSize: 13,
  marginBottom: 14,
  textTransform: "uppercase",
};

const greenEyebrow: React.CSSProperties = {
  ...eyebrow,
  color: "#9df3bf",
};

const title: React.CSSProperties = {
  fontSize: "clamp(48px, 11vw, 106px)",
  lineHeight: 0.88,
  letterSpacing: -3,
  margin: "0 auto 22px",
  maxWidth: 1020,
};

const subtitle: React.CSSProperties = {
  color: "rgba(255,255,255,.76)",
  fontSize: "clamp(20px, 4vw, 29px)",
  lineHeight: 1.35,
  maxWidth: 920,
  margin: "0 auto 28px",
};

const primary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #f4d47b, #9df3bf)",
  color: "#06101e",
  textDecoration: "none",
  borderRadius: 999,
  padding: "16px 24px",
  fontWeight: 950,
  fontSize: 17,
  margin: "8px",
  minHeight: 50,
};

const secondary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,.22)",
  borderRadius: 999,
  padding: "16px 24px",
  fontWeight: 800,
  fontSize: 17,
  margin: "8px",
  background: "rgba(255,255,255,.04)",
  minHeight: 50,
};

const statRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 14,
  marginTop: 30,
};

const stat: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(0,0,0,.18)",
  borderRadius: 22,
  padding: 18,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(245px, 1fr))",
  gap: 18,
  marginTop: 22,
};

const section: React.CSSProperties = {
  marginTop: 26,
  border: "1px solid rgba(255,255,255,.13)",
  background: "rgba(255,255,255,.04)",
  borderRadius: 30,
  padding: 24,
};

const commandSection: React.CSSProperties = {
  ...section,
  border: "1px solid rgba(157,243,191,.24)",
  background:
    "linear-gradient(145deg, rgba(157,243,191,.08), rgba(255,255,255,.035))",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.13)",
  background:
    "linear-gradient(180deg, rgba(255,255,255,.055), rgba(255,255,255,.02))",
  borderRadius: 24,
  padding: 22,
};

const cardTitle: React.CSSProperties = {
  fontSize: 24,
  margin: "0 0 10px",
};

const muted: React.CSSProperties = {
  color: "rgba(255,255,255,.68)",
  lineHeight: 1.55,
  fontSize: 16,
};

const bigLine: React.CSSProperties = {
  fontSize: "clamp(36px, 8vw, 76px)",
  lineHeight: 0.95,
  letterSpacing: -2,
  margin: "0 0 14px",
};

const gold: React.CSSProperties = {
  color: "#e8c46b",
};

const green: React.CSSProperties = {
  color: "#9df3bf",
};

const listItem: React.CSSProperties = {
  borderBottom: "1px solid rgba(255,255,255,.1)",
  padding: "14px 0",
  color: "rgba(255,255,255,.78)",
  fontSize: 17,
  lineHeight: 1.45,
};

const countdownBox: React.CSSProperties = {
  marginTop: 26,
  border: "1px solid rgba(232,196,107,.35)",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.20), transparent 34%), linear-gradient(135deg, rgba(255,255,255,.09), rgba(255,255,255,.025))",
  borderRadius: 30,
  padding: 24,
  textAlign: "left",
};

const countdownGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(68px, 1fr))",
  gap: 12,
  marginTop: 18,
};

const timeCard: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.13)",
  background: "rgba(0,0,0,.24)",
  borderRadius: 20,
  padding: "16px 10px",
  textAlign: "center",
};

const chip: React.CSSProperties = {
  display: "inline-flex",
  border: "1px solid rgba(157,243,191,.25)",
  color: "#9df3bf",
  background: "rgba(157,243,191,.07)",
  borderRadius: 999,
  padding: "8px 11px",
  fontWeight: 800,
  fontSize: 13,
  margin: "0 7px 7px 0",
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
}: {
  label: string;
  title: string;
  text: string;
  tags?: string[];
}) {
  return (
    <div style={card}>
      <div style={greenEyebrow}>{label}</div>
      <h3 style={cardTitle}>{title}</h3>
      <p style={muted}>{text}</p>
      {tags.length > 0 && (
        <div style={{ marginTop: 14 }}>
          {tags.map((tag) => (
            <span key={tag} style={chip}>
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
      <div style={greenEyebrow}>{step}</div>
      <h3 style={cardTitle}>{title}</h3>
      <p style={muted}>{text}</p>
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
        label: "MEMBERS",
        value: stats.members > 0 ? formatNumber(stats.members) : "Opening",
        text: "Qualified operators, investors, lenders, buyers, and deal sources entering the private network.",
      },
      {
        label: "DEALS",
        value: stats.deals > 0 ? formatNumber(stats.deals) : "Building",
        text: "Structured residential, commercial, and land opportunities routed through the intelligence engine.",
      },
      {
        label: "SMART ALERTS",
        value: formatNumber(stats.alerts),
        text: "AI-style routing signals generated from deal data, profiles, markets, buy boxes, and member needs.",
      },
      {
        label: "MARKETS",
        value: `${formatNumber(stats.markets)}+`,
        text: "Initial Southeast and high-activity real estate markets targeted for member routing.",
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
        }
      `}</style>

      <div style={wrap}>
        <header style={topBar}>
          <div style={{ color: "#e8c46b", fontWeight: 900, letterSpacing: 4 }}>
            VAULTFORGE
          </div>
          <div>
            <Link href="/terms" style={navBtn}>
              Terms
            </Link>{" "}
            <Link href="/login" style={navBtn}>
              Member Login
            </Link>
          </div>
        </header>

        <section style={hero}>
          <img src="/vaultforge-logo.png" alt="VaultForge" style={logo} />

          <div style={greenEyebrow}>PRIVATE AI REAL ESTATE INTELLIGENCE NETWORK</div>

          <h1 style={title}>
            The command center for{" "}
            <span style={gold}>deals, capital, operators, and private opportunity.</span>
          </h1>

          <p style={subtitle}>
            VaultForge uses AI-powered routing, smart match scoring, member buy boxes, deal rooms,
            and private network intelligence to move serious real estate opportunities to the people
            who can actually act on them.
          </p>

          <div className="vf-home-actions">
            <Link href="/apply" style={primary}>
              {founderActive ? "Create Member Access" : "Request Member Access"}
            </Link>
            <Link href="/dashboard" style={secondary}>
              Preview Member Command Center
            </Link>
            <Link href="/terms" style={secondary}>
              Read Member Rules
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
        </section>

        {founderActive ? (
          <section style={countdownBox}>
            <div style={eyebrow}>FOUNDING MEMBER WINDOW</div>
            <h2 style={bigLine}>
              First <span style={green}>50 founders</span> or{" "}
              <span style={gold}>May 15</span> — whichever comes first.
            </h2>
            <p style={{ ...muted, fontSize: 20 }}>
              Founding members get access for <strong style={green}>$49 for the first month</strong>,
              then <strong style={gold}> $199/month</strong> unless canceled before renewal.
              When the first 50 founder slots are claimed or May 15 hits, standard access becomes
              <strong style={gold}> $99 to join</strong>, then{" "}
              <strong style={gold}>$199/month</strong>.
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
                <div style={{ ...eyebrow, marginBottom: 8 }}>FOUNDER SLOTS LEFT</div>
                <div style={{ fontSize: 38, fontWeight: 950 }}>{founderSlotsLeft}</div>
                <p style={muted}>Founder access closes automatically at 50 members or May 15.</p>
              </div>
              <div style={stat}>
                <div style={{ ...eyebrow, marginBottom: 8 }}>FOUNDERS CLAIMED</div>
                <div style={{ fontSize: 38, fontWeight: 950 }}>
                  {stats.founders}/{FOUNDER_LIMIT}
                </div>
                <p style={muted}>Early members get priority position inside the private network.</p>
              </div>
            </div>

            <div className="vf-home-actions" style={{ marginTop: 20 }}>
              <Link href="/apply" style={primary}>
                Create Member Access — $49 First Month
              </Link>
              <Link href="/dashboard" style={secondary}>
                Preview Member Command Center
              </Link>
            </div>
          </section>
        ) : (
          <section style={countdownBox}>
            <div style={eyebrow}>STANDARD MEMBER ACCESS</div>
            <h2 style={bigLine}>Founder access has closed.</h2>
            <p style={{ ...muted, fontSize: 20 }}>
              Standard access is now <strong style={gold}>$99 to join</strong>,
              then <strong style={gold}> $199/month</strong> unless canceled before renewal.
            </p>
            <Link href="/apply" style={primary}>
              Apply for Member Access
            </Link>
          </section>
        )}

        <section style={commandSection}>
          <div style={greenEyebrow}>HOW ACCESS WORKS</div>
          <h2 style={bigLine}>
            Create access. Train your profile. <span style={green}>Unlock the network.</span>
          </h2>
          <p style={{ ...muted, fontSize: 20 }}>
            Public visitors should create a member access account first. After login, they train their
            AI profile with markets, strategies, roles, needs, and what they can provide. Payment unlocks
            full command center access when Stripe goes live.
          </p>

          <div style={grid}>
            <FlowCard
              step="STEP 1"
              title="Create Member Access"
              text="Start at the access page, then create your login. Public visitors should not fill out the AI profile before account creation."
            />
            <FlowCard
              step="STEP 2"
              title="Train Your AI Profile"
              text="Define your markets, buy box, strategy, roles, project types, needs, and what you can provide."
            />
            <FlowCard
              step="STEP 3"
              title="Unlock Full Access"
              text="Founding members unlock the full Member Command Center, smart alerts, network routing, deal rooms, and messaging."
            />
          </div>

          <Link href="/apply" style={primary}>
            Start Access Flow
          </Link>
        </section>

        <section style={commandSection}>
          <div style={greenEyebrow}>WHAT VAULTFORGE IS</div>
          <h2 style={bigLine}>
            Not a listing site. <span style={green}>A private real estate operating system.</span>
          </h2>
          <p style={{ ...muted, fontSize: 20 }}>
            VaultForge is built for people who need speed, access, intelligence, and execution.
            Members do not just browse. They create deal rooms, train profiles, save targets,
            receive smart routing alerts, and connect with buyers, lenders, operators, contractors,
            developers, sellers, and partners.
          </p>

          <div style={grid}>
            <FeatureCard
              label="AI Routing"
              title="Smart Match Engine"
              text="The system compares deals against member profiles, markets, project types, strategies, needs, capital, and provider abilities."
              tags={["Score", "Why Matched", "Routing"]}
            />
            <FeatureCard
              label="Command Center"
              title="Member Command Center"
              text="One place for deals, alerts, buy buckets, messages, member network intelligence, and profile-driven routing."
              tags={["Deals", "Alerts", "Network"]}
            />
            <FeatureCard
              label="Private Network"
              title="Execution-Focused Members"
              text="The platform is for serious buyers, lenders, operators, contractors, wholesalers, sellers, developers, and real estate problem solvers."
              tags={["Private", "Vetted", "Action"]}
            />
          </div>
        </section>

        <section style={section}>
          <div style={eyebrow}>WHAT MEMBERS GET INSIDE</div>
          <h2 style={bigLine}>
            Every section exists to help members{" "}
            <span style={green}>find, route, and execute opportunity.</span>
          </h2>

          <div style={grid}>
            <FeatureCard
              label="Create"
              title="Deal Rooms"
              text="Submit residential, commercial, and land opportunities with photos, pricing, strategy, seller situation, repair estimates, notes, and routing fields."
              tags={["Photos", "Numbers", "Strategy"]}
            />
            <FeatureCard
              label="Alerts"
              title="AI Smart Alerts"
              text="See why the system matched a deal to a member, buyer, lender, operator, strategy, or market."
              tags={["Match Score", "Why Matched", "Confidence"]}
            />
            <FeatureCard
              label="Buy Side"
              title="Buy Bucket"
              text="Save opportunities, track targets, and create demand signals that help the platform understand what members actually want."
              tags={["Watchlist", "Demand", "Targets"]}
            />
            <FeatureCard
              label="Network"
              title="Member Directory"
              text="Find members by role, state, project type, strategy, needs, and what they can provide."
              tags={["Buyers", "Lenders", "Operators"]}
            />
            <FeatureCard
              label="Messaging"
              title="Deal Communication"
              text="Keep opportunity conversations and member communications tied to the system instead of scattered across random messages."
              tags={["Threads", "Contact", "Follow Up"]}
            />
            <FeatureCard
              label="Profile"
              title="AI Training Profile"
              text="Members train the engine after login with markets, roles, buy boxes, project types, strategies, needs, provider abilities, and alert preferences."
              tags={["Buy Box", "Needs", "Can Provide"]}
            />
          </div>
        </section>

        <section style={section}>
          <div style={eyebrow}>WHO WE ARE LOOKING FOR</div>
          <h2 style={bigLine}>
            Built for serious real estate players. <span style={gold}>Not spectators.</span>
          </h2>

          <div style={grid}>
            {[
              "Buyers looking for targeted acquisition flow.",
              "Private lenders and capital sources looking for opportunities.",
              "Wholesalers and deal sources with real inventory.",
              "Contractors and operators who can execute projects.",
              "Developers looking for land, commercial, and value-add plays.",
              "Sellers and problem-solvers who need routing, capital, or operators.",
              "Realtors and brokers with access to deal flow and relationships.",
              "JV partners who can bring money, skill, execution, or access.",
            ].map((item) => (
              <div key={item} style={card}>
                <p style={{ ...muted, fontSize: 18, margin: 0 }}>{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={section}>
          <div style={eyebrow}>THE AI ADVANTAGE</div>
          <h2 style={bigLine}>
            The AI does not just store deals. <span style={green}>It routes opportunity.</span>
          </h2>
          <div style={listItem}>Scans live deals against member markets, roles, buy boxes, and strategies.</div>
          <div style={listItem}>Scores member/deal fit and surfaces confidence signals.</div>
          <div style={listItem}>
            Explains why a match appeared, including market fit, asset fit, strategy fit, capital fit,
            and margin signals.
          </div>
          <div style={listItem}>Turns member profiles into a routing engine instead of a static directory.</div>
          <div style={listItem}>
            Creates a private intelligence feed that becomes stronger as more members and deals enter the system.
          </div>
        </section>

        <section style={section}>
          <div style={eyebrow}>WHY $199/MONTH MAKES SENSE</div>
          <h2 style={bigLine}>One useful relationship or routed opportunity can pay for the year.</h2>
          <p style={{ ...muted, fontSize: 20 }}>
            VaultForge is not priced like a generic software tool because it is not trying to be one.
            The value is access, signal, routing, private network density, organized deal intelligence,
            and speed to the right person. Members are paying for leverage.
          </p>
        </section>

        <section style={{ ...hero, marginTop: 26 }}>
          <div style={greenEyebrow}>PRIVATE ACCESS</div>
          <h2 style={bigLine}>
            If you need access, speed, capital, operators, or smarter deal flow — this is where you belong.
          </h2>
          <p style={subtitle}>
            VaultForge is being built as a private AI-powered real estate intelligence network.
            Members create opportunities, define needs, route signals, and connect with people who can move deals forward.
          </p>
          <div className="vf-home-actions">
            <Link href="/apply" style={primary}>
              {founderActive ? "Create Member Access — $49 First Month" : "Apply for Member Access"}
            </Link>
            <Link href="/dashboard" style={secondary}>
              Preview Member Command Center
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}