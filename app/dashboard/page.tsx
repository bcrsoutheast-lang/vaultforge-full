"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Summary = {
  email: string;
  profileComplete: boolean;
  counts: {
    activeDeals: number;
    myDeals: number;
    buyBucket: number;
    alerts: number;
    messages: number;
    members: number;
  };
};

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 30%), radial-gradient(circle at top right, rgba(157,243,191,.10), transparent 28%), linear-gradient(180deg, #030509 0%, #071326 55%, #030509 100%)",
  color: "white",
  padding: "26px 18px 90px",
  fontFamily: "Arial, sans-serif",
};

const wrapStyle: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
};

const navStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginBottom: 24,
  alignItems: "center",
  justifyContent: "space-between",
};

const navLeftStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
};

const navLinkStyle: React.CSSProperties = {
  color: "white",
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,.18)",
  borderRadius: 999,
  padding: "11px 15px",
  fontSize: 14,
  background: "rgba(255,255,255,.04)",
};

const logoutStyle: React.CSSProperties = {
  ...navLinkStyle,
  background: "rgba(255,255,255,.03)",
  cursor: "pointer",
};

const heroStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.16)",
  background:
    "linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.025))",
  borderRadius: 34,
  padding: "28px 22px",
  marginBottom: 22,
  boxShadow: "0 30px 90px rgba(0,0,0,.45)",
};

const heroGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: 20,
  alignItems: "center",
};

const logoStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 360,
  borderRadius: 22,
  boxShadow: "0 20px 70px rgba(0,0,0,.5)",
};

const eyebrowStyle: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: 5,
  fontWeight: 900,
  fontSize: 12,
  marginBottom: 12,
};

const titleStyle: React.CSSProperties = {
  fontSize: "clamp(44px, 10vw, 88px)",
  lineHeight: 0.9,
  letterSpacing: -3,
  margin: "0 0 16px",
};

const subtitleStyle: React.CSSProperties = {
  color: "rgba(255,255,255,.72)",
  fontSize: "clamp(18px, 3.8vw, 24px)",
  lineHeight: 1.4,
  margin: 0,
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: 16,
};

const cardStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.15)",
  background:
    "linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.025))",
  borderRadius: 26,
  padding: 22,
  textDecoration: "none",
  color: "white",
  boxShadow: "0 20px 60px rgba(0,0,0,.22)",
};

const mainCardStyle: React.CSSProperties = {
  ...cardStyle,
  minHeight: 205,
};

const countStyle: React.CSSProperties = {
  fontSize: 52,
  fontWeight: 950,
  lineHeight: 1,
  margin: "14px 0",
};

const pillStyle: React.CSSProperties = {
  display: "inline-block",
  color: "#9df3bf",
  border: "1px solid rgba(157,243,191,.35)",
  borderRadius: 999,
  padding: "7px 12px",
  fontSize: 12,
  letterSpacing: 1.4,
  marginBottom: 14,
  fontWeight: 900,
};

const sectionStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.13)",
  background: "rgba(255,255,255,.035)",
  borderRadius: 30,
  padding: 22,
  marginBottom: 20,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "clamp(30px, 6vw, 52px)",
  lineHeight: 0.95,
  letterSpacing: -2,
  margin: "0 0 12px",
};

const mutedStyle: React.CSSProperties = {
  color: "rgba(255,255,255,.66)",
  lineHeight: 1.5,
  fontSize: 16,
};

const primaryButtonStyle: React.CSSProperties = {
  display: "inline-block",
  background: "linear-gradient(135deg, #f4d47b, #9df3bf)",
  color: "#06101e",
  borderRadius: 999,
  padding: "14px 18px",
  textDecoration: "none",
  fontWeight: 950,
  marginTop: 14,
};

const listItemStyle: React.CSSProperties = {
  borderBottom: "1px solid rgba(255,255,255,.1)",
  padding: "13px 0",
  color: "rgba(255,255,255,.74)",
  fontSize: 16,
  lineHeight: 1.45,
};

function getEmail() {
  if (typeof window === "undefined") return "";
  return (
    window.localStorage.getItem("vf_email") ||
    window.sessionStorage.getItem("vf_email") ||
    ""
  )
    .trim()
    .toLowerCase();
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    "x-vf-email": getEmail(),
  };
}

function logout() {
  window.localStorage.removeItem("vf_email");
  window.sessionStorage.removeItem("vf_email");
  window.location.href = "/login";
}

function CommandCard({
  href,
  label,
  title,
  description,
  count,
  primary = false,
}: {
  href: string;
  label: string;
  title: string;
  description: string;
  count?: number | string;
  primary?: boolean;
}) {
  return (
    <Link href={href} style={primary ? mainCardStyle : cardStyle}>
      <span style={pillStyle}>{label}</span>
      <h3 style={{ fontSize: primary ? 34 : 26, margin: "0 0 10px", lineHeight: 1 }}>
        {title}
      </h3>
      {count !== undefined && <div style={countStyle}>{count}</div>}
      <p style={mutedStyle}>{description}</p>
    </Link>
  );
}

function MetricCard({
  label,
  value,
  note,
}: {
  label: string;
  value: number | string;
  note: string;
}) {
  return (
    <div style={cardStyle}>
      <span style={pillStyle}>{label}</span>
      <div style={countStyle}>{value}</div>
      <p style={mutedStyle}>{note}</p>
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadSummary() {
    setLoading(true);
    setError("");

    if (!getEmail()) {
      setError("Session missing. Go to Login and enter your email again.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/dashboard/summary", {
        cache: "no-store",
        headers: authHeaders(),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Session missing. Login again.");
        setSummary(null);
      } else {
        setSummary(data);
      }
    } catch {
      setError("Could not load dashboard. Refresh and try again.");
      setSummary(null);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadSummary();
  }, []);

  const profileStatus = summary?.profileComplete ? "Ready" : "Needs Setup";

  return (
    <main style={shellStyle}>
      <div style={wrapStyle}>
        <nav style={navStyle}>
          <div style={navLeftStyle}>
            <Link href="/" style={navLinkStyle}>Home</Link>
            <Link href="/profile" style={navLinkStyle}>Profile</Link>
            <Link href="/submit" style={navLinkStyle}>Create Deal</Link>
            <Link href="/projects" style={navLinkStyle}>Projects</Link>
            <Link href="/buy-bucket" style={navLinkStyle}>Buy Bucket</Link>
            <Link href="/alerts" style={navLinkStyle}>Alerts</Link>
            <Link href="/messages" style={navLinkStyle}>Messages</Link>
            <Link href="/network" style={navLinkStyle}>Network</Link>
          </div>
          <button onClick={logout} style={logoutStyle}>
            Logout
          </button>
        </nav>

        <section style={heroStyle}>
          <div style={heroGridStyle}>
            <div style={{ textAlign: "center" }}>
              <img src="/vaultforge-logo.png" alt="VaultForge" style={logoStyle} />
            </div>

            <div>
              <div style={eyebrowStyle}>MEMBER COMMAND CENTER</div>
              <h1 style={titleStyle}>
                Execute deals faster.
                <span style={{ color: "#e8c46b" }}> Route capital smarter.</span>
              </h1>
              <p style={subtitleStyle}>
                Your VaultForge workspace connects deal creation, buy boxes,
                alerts, member demand, messages, and execution partners into one
                private operating system.
              </p>

              {summary?.email && (
                <p style={{ color: "rgba(255,255,255,.52)", marginTop: 16 }}>
                  Logged in as {summary.email}
                </p>
              )}

              <Link href="/submit" style={primaryButtonStyle}>
                Create New Deal
              </Link>
            </div>
          </div>
        </section>

        {loading && <section style={cardStyle}>Loading command center...</section>}

        {error && (
          <section
            style={{
              ...cardStyle,
              color: "#ffd0d0",
              borderColor: "rgba(255,107,107,.55)",
              marginBottom: 18,
            }}
          >
            {error}
            <div style={{ marginTop: 16 }}>
              <Link href="/login" style={navLinkStyle}>Login again</Link>
            </div>
          </section>
        )}

        {!loading && !error && summary && (
          <>
            <section style={sectionStyle}>
              <div style={eyebrowStyle}>LIVE OPERATING SNAPSHOT</div>
              <h2 style={sectionTitleStyle}>
                Your business pulse in one screen.
              </h2>
              <div style={gridStyle}>
                <MetricCard
                  label="ACTIVE DEALS"
                  value={summary.counts.activeDeals}
                  note="Live opportunities available inside the network."
                />
                <MetricCard
                  label="YOUR DEALS"
                  value={summary.counts.myDeals}
                  note="Opportunities you have submitted into the system."
                />
                <MetricCard
                  label="BUY BUCKET"
                  value={summary.counts.buyBucket}
                  note="Deals you saved as interest and demand signals."
                />
                <MetricCard
                  label="ALERTS"
                  value={summary.counts.alerts}
                  note="Unread routing signals and match activity."
                />
              </div>
            </section>

            {!summary.profileComplete && (
              <section
                style={{
                  ...sectionStyle,
                  borderColor: "rgba(157,243,191,.38)",
                  background:
                    "linear-gradient(135deg, rgba(157,243,191,.10), rgba(255,255,255,.035))",
                }}
              >
                <div style={eyebrowStyle}>NEXT BEST ACTION</div>
                <h2 style={sectionTitleStyle}>Complete your operating profile.</h2>
                <p style={{ ...mutedStyle, fontSize: 19 }}>
                  Your profile powers routing, buyer/lender matching, service needs,
                  markets, asset types, capital range, and alerts.
                </p>
                <Link href="/profile" style={primaryButtonStyle}>
                  Build Profile + Buy Box
                </Link>
              </section>
            )}

            <section style={sectionStyle}>
              <div style={eyebrowStyle}>CORE WORKFLOWS</div>
              <h2 style={sectionTitleStyle}>
                Everything needed to move business.
              </h2>

              <div style={gridStyle}>
                <CommandCard
                  href="/submit"
                  label="CREATE"
                  title="Create Deal"
                  description="Submit residential, commercial, or land opportunities with structured details and AI routing."
                  primary
                />
                <CommandCard
                  href="/projects"
                  label="DEAL ROOM"
                  title="Active Deals"
                  description="Open deal rooms, review opportunities, save prospects, message owners, and archive clutter."
                  count={summary.counts.activeDeals}
                  primary
                />
                <CommandCard
                  href="/buy-bucket"
                  label="SAVED"
                  title="Buy Bucket"
                  description="Track opportunities you want to pursue. These signals shape future routing."
                  count={summary.counts.buyBucket}
                  primary
                />
              </div>
            </section>

            <section style={sectionStyle}>
              <div style={eyebrowStyle}>NETWORK INTELLIGENCE</div>
              <h2 style={sectionTitleStyle}>Capital, partners, alerts, and communication.</h2>

              <div style={gridStyle}>
                <CommandCard
                  href="/network"
                  label="MEMBERS"
                  title="Member Network"
                  description="Buyers, lenders, contractors, developers, operators, partners, and deal sources."
                  count={summary.counts.members}
                />
                <CommandCard
                  href="/alerts"
                  label="SIGNALS"
                  title="Alerts"
                  description="Matched deals, profile signals, buy bucket activity, and routing triggers."
                  count={summary.counts.alerts}
                />
                <CommandCard
                  href="/messages"
                  label="COMMS"
                  title="Messages"
                  description="Keep deal and network conversations organized inside VaultForge."
                  count={summary.counts.messages}
                />
                <CommandCard
                  href="/profile"
                  label={profileStatus.toUpperCase()}
                  title="Profile + Buy Box"
                  description="Set your markets, member role, asset types, price range, services, and needs."
                  count={summary.profileComplete ? "✓" : "!"}
                />
              </div>
            </section>

            <section style={sectionStyle}>
              <div style={eyebrowStyle}>OPERATING LANES</div>
              <h2 style={sectionTitleStyle}>Built around how deals actually get done.</h2>

              <div style={gridStyle}>
                <div style={cardStyle}>
                  <span style={pillStyle}>DEALS</span>
                  <h3 style={{ fontSize: 26, margin: "0 0 10px" }}>Source + Submit</h3>
                  <p style={mutedStyle}>
                    Put opportunities into a structured system instead of losing them in texts.
                  </p>
                </div>

                <div style={cardStyle}>
                  <span style={pillStyle}>CAPITAL</span>
                  <h3 style={{ fontSize: 26, margin: "0 0 10px" }}>Funding Signals</h3>
                  <p style={mutedStyle}>
                    Route capital needs to lenders and members who match the deal type.
                  </p>
                </div>

                <div style={cardStyle}>
                  <span style={pillStyle}>EXECUTION</span>
                  <h3 style={{ fontSize: 26, margin: "0 0 10px" }}>Operators + Vendors</h3>
                  <p style={mutedStyle}>
                    Match projects with people who can execute: contractors, developers, and partners.
                  </p>
                </div>

                <div style={cardStyle}>
                  <span style={pillStyle}>RESULTS</span>
                  <h3 style={{ fontSize: 26, margin: "0 0 10px" }}>Follow the Action</h3>
                  <p style={mutedStyle}>
                    Use saved deals, alerts, and messages to push opportunities forward.
                  </p>
                </div>
              </div>
            </section>

            <section style={sectionStyle}>
              <div style={eyebrowStyle}>TODAY'S COMMAND LIST</div>
              <div style={listItemStyle}>Review active deals and save anything that fits your buy box.</div>
              <div style={listItemStyle}>Complete your profile so routing knows who you are and what you need.</div>
              <div style={listItemStyle}>Create any new opportunity that needs capital, partners, buyers, or execution.</div>
              <div style={listItemStyle}>Check alerts and messages for current match activity.</div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
