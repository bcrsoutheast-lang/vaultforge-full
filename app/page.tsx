"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";
const FOUNDER_LIMIT = 50;
const FOUNDER_DEADLINE = "2026-05-22T23:59:59-04:00";

type Stats = {
  members?: number;
  deals?: number;
  pain?: number;
  signals?: number;
  routes?: number;
  markets?: number;
  founders?: number;
};

function cleanEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function readCookie(name: string) {
  if (typeof document === "undefined") return "";

  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!match) return "";

  try {
    return decodeURIComponent(match.slice(name.length + 1));
  } catch {
    return match.slice(name.length + 1);
  }
}

function getEmail() {
  if (typeof window === "undefined") return "";

  return cleanEmail(
    localStorage.getItem("vf_email") ||
      sessionStorage.getItem("vf_email") ||
      readCookie("vf_email") ||
      readCookie("vf_admin_email") ||
      ""
  );
}

function formatNumber(value: unknown, fallback = "—") {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return number.toLocaleString("en-US");
}

function timeParts(deadline: string) {
  const target = new Date(deadline).getTime();
  const now = Date.now();
  const ms = Math.max(0, target - now);

  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, expired: ms <= 0 };
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at 8% 0%, rgba(232,196,107,.22), transparent 30%), radial-gradient(circle at 88% 8%, rgba(255,36,24,.16), transparent 26%), radial-gradient(circle at 65% 64%, rgba(157,243,191,.10), transparent 28%), linear-gradient(180deg,#020202 0%,#071326 46%,#190705 74%,#020202 100%)",
  color: "white",
  fontFamily: "Arial, sans-serif",
  padding: "24px 16px 90px",
  overflow: "hidden",
};

const wrap: React.CSSProperties = {
  width: "min(1240px,100%)",
  margin: "0 auto",
};

const glass: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.24)",
  background: "linear-gradient(145deg,rgba(255,255,255,.075),rgba(255,255,255,.030))",
  borderRadius: 34,
  boxShadow: "0 32px 100px rgba(0,0,0,.38)",
};

const hero: React.CSSProperties = {
  ...glass,
  padding: "28px 24px",
  position: "relative",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  background: "rgba(255,255,255,.045)",
  borderRadius: 26,
  padding: 20,
  boxShadow: "0 20px 70px rgba(0,0,0,.24)",
};

const redCard: React.CSSProperties = {
  border: "1px solid rgba(255,72,58,.30)",
  background: "linear-gradient(145deg,rgba(255,72,58,.10),rgba(232,196,107,.07),rgba(255,255,255,.035))",
  borderRadius: 28,
  padding: 22,
  boxShadow: "0 22px 80px rgba(0,0,0,.28)",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
  gap: 16,
};

const button: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 52,
  borderRadius: 999,
  padding: "14px 20px",
  fontWeight: 950,
  textDecoration: "none",
  border: "none",
  color: "#06100a",
  background: "linear-gradient(135deg,#fff2b8,#e8c46b 42%,#9df3bf)",
  boxShadow: "0 0 34px rgba(232,196,107,.18)",
  cursor: "pointer",
};

const ghost: React.CSSProperties = {
  ...button,
  color: "white",
  background: "rgba(255,255,255,.060)",
  border: "1px solid rgba(255,255,255,.16)",
  boxShadow: "none",
};

const danger: React.CSSProperties = {
  ...button,
  color: "white",
  background: "linear-gradient(135deg,#ff4d3d,#8f1111)",
  boxShadow: "0 0 34px rgba(255,36,24,.18)",
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".26em",
  fontSize: 12,
  fontWeight: 950,
  textTransform: "uppercase",
};

const redEyebrow: React.CSSProperties = {
  ...eyebrow,
  color: "#ff5148",
};

const greenEyebrow: React.CSSProperties = {
  ...eyebrow,
  color: "#9df3bf",
};

const muted: React.CSSProperties = {
  color: "rgba(255,255,255,.74)",
  lineHeight: 1.55,
};

const chip: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  border: "1px solid rgba(157,243,191,.24)",
  color: "#9df3bf",
  background: "rgba(157,243,191,.075)",
  borderRadius: 999,
  padding: "8px 11px",
  fontWeight: 900,
  fontSize: 13,
  margin: "0 7px 7px 0",
};

const tickerItem = [
  "ATL distress signal detected",
  "Capital gap routed to private lender stack",
  "Buyer match created for Southeast operator",
  "Off-market opportunity surfaced",
  "Funding pressure flagged",
  "Operator needed for stalled project",
  "Developer route opened",
  "AI fit score updated",
  "Pain signal converted to execution room",
  "Deal room matched to member profile",
];

function Stat({ label, value, sub }: { label: string; value: unknown; sub: string }) {
  return (
    <div style={card}>
      <div style={greenEyebrow}>{label}</div>
      <div style={{ fontSize: 46, fontWeight: 1000, lineHeight: 1, marginTop: 12 }}>
        {formatNumber(value)}
      </div>
      <p style={{ ...muted, margin: "10px 0 0", fontSize: 14 }}>{sub}</p>
    </div>
  );
}

function CountdownBox({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ ...card, textAlign: "center", padding: 16 }}>
      <div style={{ fontSize: 42, fontWeight: 1000, color: "#f8e7b0", lineHeight: 1 }}>
        {String(value).padStart(2, "0")}
      </div>
      <div style={{ ...muted, fontSize: 12, fontWeight: 900, marginTop: 6 }}>{label}</div>
    </div>
  );
}

export default function HomePage() {
  const [email, setEmail] = useState("");
  const [stats, setStats] = useState<Stats>({});
  const [clock, setClock] = useState(() => timeParts(FOUNDER_DEADLINE));

  useEffect(() => {
    setEmail(getEmail());

    const timer = window.setInterval(() => {
      setClock(timeParts(FOUNDER_DEADLINE));
    }, 1000);

    async function loadStats() {
      try {
        const response = await fetch("/api/home/stats", { cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (data?.ok) setStats(data.stats || {});
      } catch {
        // Homepage still renders if stats API is not ready.
      }
    }

    loadStats();

    return () => window.clearInterval(timer);
  }, []);

  const signedIn = email.includes("@");
  const owner = email === OWNER_EMAIL;
  const founders = Number(stats.founders || stats.members || 0);
  const founderSpotsLeft = Math.max(0, FOUNDER_LIMIT - founders);
  const founderWindowOpen = !clock.expired && founderSpotsLeft > 0;

  const primaryHref = signedIn ? "/dashboard" : "/profile";
  const primaryText = signedIn ? "Enter Command Center" : founderWindowOpen ? "Secure Founder Access" : "Apply for Launch Access";

  const launchPrice = founderWindowOpen
    ? "$49 for first 2 months · then $299/month"
    : "$99 for first 2 months · then $299/month";

  const liveStats = useMemo(
    () => ({
      members: stats.members ?? founders,
      deals: stats.deals,
      pain: stats.pain,
      signals: stats.signals,
      markets: stats.markets || 7,
    }),
    [stats, founders]
  );

  return (
    <main style={page}>
      <style>{`
        @keyframes vfTicker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @keyframes pulseGlow {
          0%,100% { box-shadow: 0 0 38px rgba(232,196,107,.16); }
          50% { box-shadow: 0 0 68px rgba(232,196,107,.34); }
        }

        a:hover, button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        .vf-logo {
          animation: pulseGlow 3s ease-in-out infinite;
        }

        .vf-ticker-track {
          display: flex;
          width: max-content;
          animation: vfTicker 42s linear infinite;
        }

        @media (max-width: 820px) {
          .vf-hero-grid,
          .vf-two,
          .vf-founder-grid,
          .vf-stats {
            grid-template-columns: 1fr !important;
          }

          .vf-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
          }

          .vf-actions > * {
            width: 100%;
            box-sizing: border-box;
          }

          .vf-logo-main {
            max-width: 280px !important;
          }
        }
      `}</style>

      <div style={wrap}>
        <nav
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            marginBottom: 18,
            flexWrap: "wrap",
          }}
        >
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, color: "white", textDecoration: "none" }}>
            <img
              src="/vaultforge-logo.png"
              alt="VaultForge"
              style={{ width: 52, height: 52, borderRadius: 14, objectFit: "cover", border: "1px solid rgba(232,196,107,.28)" }}
            />
            <div>
              <div style={{ fontSize: 23, fontWeight: 1000, letterSpacing: 1 }}>VaultForge</div>
              <div style={{ ...muted, fontSize: 13 }}>AI Intelligence · Private Execution Network</div>
            </div>
          </Link>

          <div className="vf-actions" style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
            <Link href="/login" style={ghost}>Login</Link>
            <Link href="/dashboard" style={ghost}>Member Area</Link>
            <Link href="/members" style={ghost}>Preview Members Command Center</Link>
            {owner ? <Link href="/admin" style={ghost}>Admin</Link> : null}
          </div>
        </nav>

        <section style={{ ...glass, padding: "10px 0", overflow: "hidden", marginBottom: 18 }}>
          <div className="vf-ticker-track">
            {[...tickerItem, ...tickerItem].map((item, index) => (
              <span
                key={`${item}-${index}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  color: index % 3 === 0 ? "#ff5148" : index % 3 === 1 ? "#e8c46b" : "#9df3bf",
                  fontWeight: 950,
                  letterSpacing: ".12em",
                  textTransform: "uppercase",
                  fontSize: 12,
                  padding: "0 28px",
                  whiteSpace: "nowrap",
                }}
              >
                ● {item}
              </span>
            ))}
          </div>
        </section>

        <section style={hero}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <img
              className="vf-logo vf-logo-main"
              src="/vaultforge-logo.png"
              alt="VaultForge logo"
              style={{
                width: "min(520px,88vw)",
                maxHeight: 260,
                objectFit: "contain",
                borderRadius: 30,
                border: "1px solid rgba(232,196,107,.24)",
                background: "rgba(0,0,0,.24)",
                padding: 12,
              }}
            />
          </div>

          <div className="vf-hero-grid" style={{ display: "grid", gridTemplateColumns: "1.15fr .85fr", gap: 22, alignItems: "stretch" }}>
            <div>
              <div style={redEyebrow}>AI-Powered Real Estate Intelligence Network</div>

              <h1 style={{ fontSize: "clamp(58px,11vw,124px)", lineHeight: 0.84, margin: "12px 0 18px", letterSpacing: "-.075em" }}>
                Signals. Routing. Execution.
              </h1>

              <p style={{ ...muted, fontSize: 23, maxWidth: 850 }}>
                VaultForge turns deals, distress, capital gaps, buyer demand, stalled projects, contractors, lenders,
                investors, and operators into a private AI-powered execution network.
              </p>

              <div style={{ margin: "18px 0" }}>
                <span style={chip}>AI Opportunity Routing</span>
                <span style={chip}>Private Member Network</span>
                <span style={chip}>Live Signal Pressure</span>
                <span style={chip}>Deal + Pain Workstations</span>
                <span style={chip}>Controlled Introductions</span>
              </div>

              <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
                <Link href={primaryHref} style={danger}>{primaryText}</Link>
                <Link href="/members" style={button}>Preview Members Command Center</Link>
                <Link href="/login" style={ghost}>Member Login</Link>
              </div>
            </div>

            <div style={redCard}>
              <div style={greenEyebrow}>{founderWindowOpen ? "Founder Access Window" : "Launch Access Open"}</div>

              <h2 style={{ fontSize: 42, lineHeight: 0.96, margin: "10px 0 12px" }}>
                {founderWindowOpen ? "First 50 founders or May 22." : "Founder cohort closed."}
              </h2>

              <p style={{ ...muted, fontSize: 18 }}>
                {founderWindowOpen
                  ? "Secure founder pricing before the first cohort closes."
                  : "Founder pricing is closed. Launch access is now open for new applicants."}
              </p>

              {founderWindowOpen ? (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, margin: "18px 0" }}>
                    <CountdownBox label="Days" value={clock.days} />
                    <CountdownBox label="Hours" value={clock.hours} />
                    <CountdownBox label="Min" value={clock.minutes} />
                    <CountdownBox label="Sec" value={clock.seconds} />
                  </div>

                  <div style={{ ...card, marginBottom: 14 }}>
                    <div style={redEyebrow}>Founder Seats Remaining</div>
                    <div style={{ fontSize: 58, fontWeight: 1000, lineHeight: 1, color: "#f8e7b0" }}>
                      {founderSpotsLeft}
                    </div>
                    <p style={{ ...muted, margin: "8px 0 0" }}>
                      Founder counter closes at 50 members or May 22, whichever comes first.
                    </p>
                  </div>
                </>
              ) : (
                <div style={{ ...card, margin: "18px 0" }}>
                  <div style={redEyebrow}>Live Network Momentum</div>
                  <p style={{ ...muted, marginBottom: 0 }}>
                    Founder countdown has been replaced by operating proof: member activity, live deals, pain signals, and routed opportunities.
                  </p>
                </div>
              )}

              <div style={{ borderTop: "1px solid rgba(255,255,255,.10)", paddingTop: 14 }}>
                <div style={{ color: "#9df3bf", fontWeight: 1000, fontSize: 24 }}>{launchPrice}</div>
                <p style={{ ...muted, margin: "8px 0 0", fontSize: 14 }}>
                  Private access. Application reviewed. Cancel before renewal.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="vf-stats" style={{ display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: 14, marginTop: 18 }}>
          <Stat label="Members" value={liveStats.members} sub="Private operator network." />
          <Stat label="Deals" value={liveStats.deals} sub="Workstations and deal rooms." />
          <Stat label="Pain Signals" value={liveStats.pain} sub="Distress converted into routes." />
          <Stat label="AI Routes" value={liveStats.signals} sub="Signals matched to execution paths." />
          <Stat label="Markets" value={liveStats.markets} sub="Geographies watched by the network." />
        </section>

        <section className="vf-two" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 18 }}>
          <div style={glass}>
            <div style={{ padding: 24 }}>
              <div style={greenEyebrow}>Inside the Command Center</div>
              <h2 style={{ fontSize: "clamp(42px,7vw,78px)", lineHeight: 0.9, margin: "12px 0" }}>
                Members don’t browse. They route.
              </h2>
              <p style={{ ...muted, fontSize: 20 }}>
                VaultForge is built around rooms: Smart AI, workstations, deal rooms, pain rooms, members, messages, and routing.
              </p>

              <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
                <Link href="/members" style={button}>Preview Members Command Center</Link>
                <Link href="/smart-ai" style={ghost}>Preview Smart AI</Link>
              </div>
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,.10)", padding: 18 }}>
              <div style={{ ...card, background: "linear-gradient(145deg,rgba(232,196,107,.12),rgba(255,255,255,.045))" }}>
                <div style={redEyebrow}>Live Execution Feed</div>
                {tickerItem.slice(0, 6).map((item) => (
                  <div
                    key={item}
                    style={{
                      borderTop: "1px solid rgba(255,255,255,.08)",
                      padding: "12px 0",
                      color: "#e5eefb",
                      fontWeight: 900,
                    }}
                  >
                    <span style={{ color: "#9df3bf" }}>●</span> {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={glass}>
            <div style={{ padding: 24 }}>
              <div style={redEyebrow}>The VaultForge Loop</div>
              <h2 style={{ fontSize: "clamp(42px,7vw,76px)", lineHeight: 0.92, margin: "12px 0" }}>
                Pain becomes signal. Signal becomes route.
              </h2>
              <p style={{ ...muted, fontSize: 20 }}>
                The platform watches problems, deals, funding gaps, market pressure, and member capabilities — then turns chaos into structured execution.
              </p>
            </div>

            <div style={{ padding: "0 24px 24px" }}>
              {["Pain / Deal Intake", "AI Signal Classification", "Member + Capital Fit", "Controlled Introduction", "Execution Room"].map((step, index) => (
                <div key={step} style={{ display: "grid", gridTemplateColumns: "54px 1fr", gap: 12, alignItems: "center", marginBottom: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 18, display: "grid", placeItems: "center", background: "linear-gradient(135deg,#ff5148,#e8c46b)", color: "#050302", fontWeight: 1000 }}>
                    {index + 1}
                  </div>
                  <div style={card}>
                    <strong>{step}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ ...glass, padding: 24, marginTop: 18 }}>
          <div style={redEyebrow}>Who VaultForge Is For</div>
          <h2 style={{ fontSize: "clamp(42px,7vw,76px)", lineHeight: 0.92, margin: "12px 0 18px" }}>
            Built for operators who move money, property, people, and pressure.
          </h2>

          <div style={grid}>
            {[
              ["Investors", "Find routed opportunities, operator fits, and private deal rooms."],
              ["Lenders", "See funding gaps, capital requests, and borrower/operator context."],
              ["Contractors", "Get connected where repair scope and stalled execution create opportunity."],
              ["Developers", "Track land, entitlement, utility, access, and builder routes."],
              ["Wholesalers", "Submit deals into controlled rooms instead of blasting lists."],
              ["Operators", "Solve pressure situations, run execution rooms, and get matched to demand."],
            ].map(([title, body]) => (
              <div key={title} style={card}>
                <div style={greenEyebrow}>{title}</div>
                <p style={{ ...muted, marginBottom: 0 }}>{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ ...glass, padding: 24, marginTop: 18 }}>
          <div style={redEyebrow}>{founderWindowOpen ? "Founding Member Offer" : "Launch Membership"}</div>
          <h2 style={{ fontSize: "clamp(42px,8vw,82px)", lineHeight: 0.9, margin: "12px 0 14px" }}>
            {founderWindowOpen ? "Founders get in before the network compounds." : "Launch access is now open."}
          </h2>

          <p style={{ ...muted, fontSize: 21, maxWidth: 900 }}>
            {founderWindowOpen
              ? "First 50 founders get $49 for the first 2 months, then $299/month. After the founder window closes, launch access moves to $99 for the first 2 months, then $299/month."
              : "Founder access has closed. New members can apply for launch access at $99 for the first 2 months, then $299/month."}
          </p>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            <Link href="/profile" style={danger}>{founderWindowOpen ? "Secure Founder Access" : "Apply for Launch Access"}</Link>
            <Link href="/login" style={ghost}>Login</Link>
            <Link href="/members" style={button}>Preview Command Center</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
