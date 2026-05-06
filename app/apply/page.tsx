"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const FOUNDER_DEADLINE = new Date("2026-05-15T23:59:59-04:00").getTime();
const FOUNDER_LIMIT = 50;

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.18), transparent 32%), radial-gradient(circle at top right, rgba(157,243,191,.12), transparent 28%), linear-gradient(180deg,#030509,#071326 55%,#030509)",
  color: "white",
  padding: "28px 18px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
};

const nav: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 22,
};

const navBtn: React.CSSProperties = {
  color: "white",
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,.16)",
  borderRadius: 999,
  padding: "12px 16px",
  fontWeight: 850,
  background: "rgba(255,255,255,.04)",
};

const hero: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.30)",
  borderRadius: 34,
  padding: 28,
  background:
    "linear-gradient(145deg, rgba(255,255,255,.075), rgba(255,255,255,.025))",
  boxShadow: "0 28px 85px rgba(0,0,0,.36)",
  marginBottom: 22,
};

const section: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.14)",
  borderRadius: 30,
  padding: 24,
  background: "rgba(255,255,255,.04)",
  marginTop: 22,
};

const greenSection: React.CSSProperties = {
  ...section,
  border: "1px solid rgba(157,243,191,.26)",
  background:
    "linear-gradient(145deg, rgba(157,243,191,.08), rgba(255,255,255,.03))",
};

const goldSection: React.CSSProperties = {
  ...section,
  border: "1px solid rgba(232,196,107,.34)",
  background:
    "linear-gradient(145deg, rgba(232,196,107,.10), rgba(255,255,255,.03))",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(245px,1fr))",
  gap: 16,
  marginTop: 18,
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.13)",
  borderRadius: 24,
  padding: 20,
  background:
    "linear-gradient(145deg, rgba(255,255,255,.055), rgba(255,255,255,.02))",
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: 5,
  fontWeight: 950,
  fontSize: 12,
  textTransform: "uppercase",
  marginBottom: 12,
};

const greenEyebrow: React.CSSProperties = {
  ...eyebrow,
  color: "#9df3bf",
};

const title: React.CSSProperties = {
  fontSize: "clamp(50px,11vw,104px)",
  lineHeight: 0.88,
  letterSpacing: -3,
  margin: "0 0 18px",
};

const bigLine: React.CSSProperties = {
  fontSize: "clamp(36px,8vw,74px)",
  lineHeight: 0.95,
  letterSpacing: -2,
  margin: "0 0 14px",
};

const muted: React.CSSProperties = {
  color: "rgba(255,255,255,.70)",
  lineHeight: 1.55,
};

const primary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg,#f5d978,#9df3bf)",
  color: "#061120",
  borderRadius: 999,
  padding: "15px 22px",
  minHeight: 50,
  fontWeight: 950,
  textDecoration: "none",
  margin: "8px 8px 0 0",
};

const ghost: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.04)",
  borderRadius: 999,
  padding: "15px 22px",
  minHeight: 50,
  fontWeight: 900,
  textDecoration: "none",
  margin: "8px 8px 0 0",
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

const priceCard: React.CSSProperties = {
  ...card,
  border: "1px solid rgba(232,196,107,.28)",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.15), transparent 34%), rgba(255,255,255,.035)",
};

function getTimeLeft() {
  const diff = FOUNDER_DEADLINE - Date.now();

  if (diff <= 0) {
    return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
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
    <article style={card}>
      <div style={greenEyebrow}>{label}</div>
      <h3 style={{ fontSize: 26, margin: "0 0 10px" }}>{title}</h3>
      <p style={muted}>{text}</p>
      {tags.length > 0 && (
        <div style={{ marginTop: 12 }}>
          {tags.map((tag) => (
            <span key={tag} style={chip}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

function StepCard({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <article style={card}>
      <div style={greenEyebrow}>STEP {number}</div>
      <h3 style={{ fontSize: 28, margin: "0 0 10px" }}>{title}</h3>
      <p style={muted}>{text}</p>
    </article>
  );
}

export default function ApplyPage() {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());
  const [founderCount, setFounderCount] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let alive = true;

    async function loadFounderStatus() {
      try {
        const res = await fetch("/api/founder/status", { cache: "no-store" });
        const data = await res.json();

        if (!alive) return;

        setFounderCount(Number(data?.founder?.count || 0));
      } catch {
        // Keep page alive even if status fails.
      }
    }

    loadFounderStatus();

    return () => {
      alive = false;
    };
  }, []);

  const founderOpen = !timeLeft.expired && founderCount < FOUNDER_LIMIT;
  const slotsLeft = Math.max(0, FOUNDER_LIMIT - founderCount);

  return (
    <main style={page}>
      <style>{`
        @media (max-width: 760px) {
          .vf-apply-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .vf-apply-actions > * {
            width: 100%;
            margin: 0 !important;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <nav style={nav}>
          <Link href="/" style={navBtn}>
            VaultForge Home
          </Link>
          <div>
            <Link href="/login" style={navBtn}>
              Login
            </Link>{" "}
            <Link href="/dashboard" style={navBtn}>
              Preview Command Center
            </Link>
          </div>
        </nav>

        <section style={hero}>
          <div style={greenEyebrow}>MEMBER ACCESS</div>

          <h1 style={title}>
            Create access. Train your AI profile. Unlock the private real estate command network.
          </h1>

          <p style={{ ...muted, fontSize: 22, maxWidth: 940 }}>
            VaultForge is built for serious real estate players who want smarter routing,
            better deal visibility, private network leverage, capital/operator connections,
            and AI-powered opportunity signals.
          </p>

          <div className="vf-apply-actions">
            <Link href="/login" style={primary}>
              Create Member Access
            </Link>
            <Link href="/dashboard" style={ghost}>
              Preview Member Command Center
            </Link>
            <Link href="/terms" style={ghost}>
              Read Member Rules
            </Link>
          </div>
        </section>

        <section style={founderOpen ? goldSection : section}>
          <div style={eyebrow}>
            {founderOpen ? "FOUNDING MEMBER WINDOW" : "STANDARD MEMBER ACCESS"}
          </div>

          {founderOpen ? (
            <>
              <h2 style={bigLine}>
                First 50 founders or May 15 — whichever comes first.
              </h2>
              <p style={{ ...muted, fontSize: 20 }}>
                Founding members get access for <strong style={{ color: "#9df3bf" }}>$49 first month</strong>,
                then <strong style={{ color: "#e8c46b" }}> $199/month</strong> unless canceled before renewal.
                After the founder window closes, standard access becomes <strong style={{ color: "#e8c46b" }}>$99 to join</strong>,
                then <strong style={{ color: "#e8c46b" }}> $199/month</strong>.
              </p>

              <div style={grid}>
                <div style={priceCard}>
                  <div style={greenEyebrow}>Founder Slots Left</div>
                  <div style={{ fontSize: 52, fontWeight: 950 }}>{slotsLeft}</div>
                  <p style={muted}>Founder access closes at 50 members or May 15.</p>
                </div>

                <div style={priceCard}>
                  <div style={greenEyebrow}>Founders Claimed</div>
                  <div style={{ fontSize: 52, fontWeight: 950 }}>{founderCount}/{FOUNDER_LIMIT}</div>
                  <p style={muted}>Early members get priority position inside the network.</p>
                </div>

                <div style={priceCard}>
                  <div style={greenEyebrow}>Countdown</div>
                  <div style={{ fontSize: 38, fontWeight: 950 }}>
                    {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m
                  </div>
                  <p style={muted}>Founder window deadline: May 15.</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <h2 style={bigLine}>Standard access is open.</h2>
              <p style={{ ...muted, fontSize: 20 }}>
                Standard access is <strong style={{ color: "#e8c46b" }}>$99 to join</strong>,
                then <strong style={{ color: "#e8c46b" }}> $199/month</strong> unless canceled before renewal.
              </p>
            </>
          )}
        </section>

        <section style={greenSection}>
          <div style={greenEyebrow}>HOW ACCESS WORKS</div>
          <h2 style={bigLine}>Simple flow. Strong signal. Better routing.</h2>

          <div style={grid}>
            <StepCard
              number="1"
              title="Create Member Access"
              text="Create your account first. Public visitors should not fill out the AI profile before account creation."
            />
            <StepCard
              number="2"
              title="Train Your AI Profile"
              text="After login, define your markets, role, buy box, project types, strategy, needs, and what you can provide."
            />
            <StepCard
              number="3"
              title="Unlock Full Access"
              text="Payment unlocks the full Member Command Center, smart alerts, network routing, deal rooms, and messaging."
            />
          </div>
        </section>

        <section style={section}>
          <div style={eyebrow}>WHAT MEMBERS GET</div>
          <h2 style={bigLine}>Inside the Member Command Center.</h2>

          <div style={grid}>
            <FeatureCard
              label="AI Routing"
              title="Smart Match Alerts"
              text="VaultForge compares live deals against member profiles, buy boxes, markets, roles, strategies, and needs."
              tags={["Match Score", "Why Matched", "Routing"]}
            />

            <FeatureCard
              label="Deal Flow"
              title="Deal Rooms"
              text="Create and review structured residential, commercial, and land opportunities with photos and decision data."
              tags={["Residential", "Commercial", "Land"]}
            />

            <FeatureCard
              label="Network"
              title="Member Directory"
              text="Find buyers, sellers, lenders, contractors, wholesalers, operators, developers, and partners."
              tags={["Buyers", "Lenders", "Operators"]}
            />

            <FeatureCard
              label="Acquisition"
              title="Buy Bucket"
              text="Save opportunities, track targets, and create demand signals the platform can use for smarter routing."
              tags={["Watchlist", "Saved Targets", "Demand"]}
            />

            <FeatureCard
              label="Communication"
              title="Messages"
              text="Keep deal and member communication inside the system instead of scattered across texts and DMs."
              tags={["Deal Threads", "Follow Up", "Contact"]}
            />

            <FeatureCard
              label="Profile"
              title="AI Training Profile"
              text="Your profile teaches VaultForge what you want, where you operate, and how you can help others."
              tags={["Markets", "Roles", "Needs"]}
            />
          </div>
        </section>

        <section style={section}>
          <div style={eyebrow}>WHO SHOULD APPLY</div>
          <h2 style={bigLine}>Built for real estate players who can act.</h2>

          <div style={grid}>
            {[
              "Buyers looking for targeted acquisition flow.",
              "Private lenders and capital sources looking for opportunity.",
              "Wholesalers and deal sources with real inventory.",
              "Contractors and operators who can execute projects.",
              "Developers looking for land, commercial, and value-add plays.",
              "Sellers and problem-solvers who need routing, capital, or operators.",
              "Realtors and brokers with access to relationships and deal flow.",
              "JV partners who can bring money, skill, execution, or access.",
            ].map((item) => (
              <article key={item} style={card}>
                <p style={{ ...muted, fontSize: 18, margin: 0 }}>{item}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={greenSection}>
          <div style={greenEyebrow}>WHY IT IS DIFFERENT</div>
          <h2 style={bigLine}>The AI does not just store deals. It routes opportunity.</h2>
          <p style={{ ...muted, fontSize: 20 }}>
            Most real estate tools are databases, CRMs, listing pages, or chat groups. VaultForge is being built
            as a private intelligence network where member profiles and deal data create routing signals,
            match confidence, and action paths.
          </p>

          <div style={grid}>
            <FeatureCard
              label="Signal"
              title="Explainable Matching"
              text="See why a deal surfaced: market fit, project type fit, strategy fit, capital fit, provider fit, or margin signal."
            />
            <FeatureCard
              label="Speed"
              title="Less Searching"
              text="The stronger the member profile and deal data, the more the platform can push relevant opportunities forward."
            />
            <FeatureCard
              label="Moat"
              title="Network Intelligence"
              text="Every new member, deal, alert, save, and routing signal makes the network smarter and harder to copy."
            />
          </div>
        </section>

        <section style={hero}>
          <div style={greenEyebrow}>REQUEST ACCESS</div>
          <h2 style={bigLine}>Ready to enter the command network?</h2>
          <p style={{ ...muted, fontSize: 21 }}>
            Create member access first. Then train your AI profile. Full subscription activation comes after profile setup.
          </p>

          <div className="vf-apply-actions">
            <Link href="/login" style={primary}>
              {founderOpen ? "Create Member Access — $49 First Month" : "Create Member Access"}
            </Link>
            <Link href="/dashboard" style={ghost}>
              Preview Member Command Center
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
