"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.18), transparent 28%), radial-gradient(circle at top right, rgba(181,92,255,.18), transparent 25%), radial-gradient(circle at bottom right, rgba(157,243,191,.13), transparent 30%), linear-gradient(180deg,#050302 0%,#2a130b 34%,#071326 72%,#030509 100%)",
  color: "white",
  fontFamily: "Arial, sans-serif",
  padding: "28px 18px 90px",
};

const wrap: React.CSSProperties = {
  maxWidth: 1220,
  margin: "0 auto",
};

const nav: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  marginBottom: 22,
};

const logoBox: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const mark: React.CSSProperties = {
  width: 46,
  height: 46,
  borderRadius: 16,
  background:
    "linear-gradient(135deg,#f5d978,#b88912 42%,#343434 43%,#d8d8d8 68%,#111)",
  boxShadow: "0 0 38px rgba(232,196,107,.26)",
};

const hero: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.34)",
  background:
    "linear-gradient(145deg, rgba(232,196,107,.13), rgba(82,27,18,.58), rgba(181,92,255,.09), rgba(255,255,255,.035))",
  borderRadius: 36,
  padding: "34px 28px",
  boxShadow: "0 40px 120px rgba(0,0,0,.42)",
  overflow: "hidden",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.13)",
  background:
    "linear-gradient(145deg, rgba(232,196,107,.10), rgba(181,92,255,.08), rgba(255,255,255,.035))",
  borderRadius: 28,
  padding: 22,
  boxShadow: "0 26px 80px rgba(0,0,0,.30)",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(245px,1fr))",
  gap: 16,
};

const btn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 48,
  borderRadius: 999,
  padding: "13px 20px",
  fontWeight: 950,
  textDecoration: "none",
  border: "none",
  cursor: "pointer",
  color: "#06100a",
  background: "linear-gradient(135deg,#f5d978,#9df3bf 55%,#b55cff)",
  margin: "7px 7px 0 0",
};

const ghost: React.CSSProperties = {
  ...btn,
  color: "white",
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.18)",
};

const eyebrow: React.CSSProperties = {
  color: "#ff5048",
  letterSpacing: 6,
  fontSize: 12,
  fontWeight: 950,
  textTransform: "uppercase",
  marginBottom: 14,
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
  border: "1px solid rgba(157,243,191,.25)",
  color: "#9df3bf",
  background: "rgba(157,243,191,.07)",
  borderRadius: 999,
  padding: "8px 11px",
  fontWeight: 850,
  fontSize: 13,
  margin: "0 7px 7px 0",
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

export default function HomePage() {
  const [email, setEmail] = useState("");

  useEffect(() => {
    setEmail(getEmail());
  }, []);

  const signedIn = email.includes("@");
  const owner = email === OWNER_EMAIL;

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        @media (max-width: 760px) {
          nav {
            flex-direction: column;
            align-items: flex-start !important;
          }

          a, button {
            width: 100%;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <nav style={nav}>
          <div style={logoBox}>
            <div style={mark} />
            <div>
              <div style={{ fontSize: 22, fontWeight: 950, letterSpacing: 1 }}>VaultForge</div>
              <div style={{ ...muted, fontSize: 13 }}>Private Deal Flow · Real Execution</div>
            </div>
          </div>

          <div>
            {signedIn ? (
              <>
                <span style={chip}>Signed in: {email}</span>
                <Link href="/dashboard" style={ghost}>Dashboard</Link>
                {owner && <Link href="/admin" style={ghost}>Admin</Link>}
              </>
            ) : (
              <>
                <Link href="/login" style={ghost}>Login</Link>
                <Link href="/profile" style={btn}>Create Founder Access</Link>
              </>
            )}
          </div>
        </nav>

        <section style={hero}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 24, alignItems: "center" }}>
            <div>
              <div style={eyebrow}>Private Real Estate Intelligence Network</div>
              <h1 style={{ fontSize: "clamp(56px,11vw,112px)", lineHeight: 0.86, margin: "0 0 18px" }}>
                The <span style={{ color: "#f5d978" }}>Bloomberg Sidekick</span> for real estate operators.
              </h1>
              <p style={{ ...muted, fontSize: 22 }}>
                VaultForge routes deals, capital, operators, lenders, buyers, sellers, contractors, developers,
                and private market signals into one controlled execution network.
              </p>

              <div style={{ margin: "18px 0" }}>
                <span style={chip}>AI Opportunity Routing</span>
                <span style={chip}>Controlled Introductions</span>
                <span style={chip}>Signal Pressure</span>
                <span style={chip}>Private Network</span>
              </div>

              <Link href={signedIn ? "/dashboard" : "/profile"} style={btn}>
                {signedIn ? "Enter Command Center" : "Create Founder Access"}
              </Link>
              <Link href="/member-preview" style={ghost}>Preview Command Center</Link>
              <Link href="/pain" style={ghost}>Open Pain Intelligence</Link>
            </div>

            <div style={card}>
              <div style={greenEyebrow}>Live Operating Thesis</div>
              <h2 style={{ fontSize: 42, lineHeight: 1, margin: "0 0 12px" }}>
                Signals. Routes. Execution.
              </h2>
              <p style={{ ...muted, fontSize: 18 }}>
                The platform is built to take pain, projects, off-market opportunities, funding gaps,
                buyer needs, and stalled execution — then route them through members, alerts,
                introductions, and activity timelines.
              </p>

              <div style={grid}>
                <div style={card}>
                  <div style={greenEyebrow}>Pain</div>
                  <strong>Intake engine</strong>
                  <p style={muted}>Problems become routable market signals.</p>
                </div>
                <div style={card}>
                  <div style={greenEyebrow}>Routing</div>
                  <strong>Member fit</strong>
                  <p style={muted}>Signals route toward buyers, capital, and operators.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section style={{ ...grid, marginTop: 22 }}>
          <div style={card}>
            <div style={eyebrow}>Members</div>
            <h3 style={{ fontSize: 32, margin: "0 0 8px" }}>Private operator network.</h3>
            <p style={muted}>Member directory, state filters, routing inbox, introductions, and communication.</p>
            <Link href="/members" style={ghost}>View Members</Link>
          </div>

          <div style={card}>
            <div style={eyebrow}>Pain Button</div>
            <h3 style={{ fontSize: 32, margin: "0 0 8px" }}>Pressure into opportunity.</h3>
            <p style={muted}>Distress, funding gaps, buyer needs, project stalls, city issues, and private opportunities.</p>
            <Link href="/pain" style={btn}>Open Pain Button</Link>
          </div>

          <div style={card}>
            <div style={eyebrow}>Intelligence</div>
            <h3 style={{ fontSize: 32, margin: "0 0 8px" }}>Live market signal map.</h3>
            <p style={muted}>Alerts, routing rooms, activity rooms, and exact signal paths.</p>
            <Link href="/intelligence" style={ghost}>View Intelligence</Link>
          </div>

          <div style={card}>
            <div style={eyebrow}>Execution</div>
            <h3 style={{ fontSize: 32, margin: "0 0 8px" }}>Move from signal to close.</h3>
            <p style={muted}>Deals, projects, communication, controlled intros, and activity tracking.</p>
            <Link href="/activity" style={ghost}>View Activity</Link>
          </div>
        </section>

        <section style={{ ...hero, marginTop: 22 }}>
          <div style={greenEyebrow}>Founder Access</div>
          <h2 style={{ fontSize: "clamp(38px,8vw,74px)", lineHeight: 0.95, margin: "0 0 14px" }}>
            First 50 founders or launch window — whichever comes first.
          </h2>
          <p style={{ ...muted, fontSize: 20 }}>
            Founding access starts at <strong style={{ color: "#9df3bf" }}>$49 first month</strong>, then
            <strong style={{ color: "#f5d978" }}> $199/month</strong> unless canceled before renewal.
          </p>
          <Link href="/profile" style={btn}>Create Founder Access</Link>
          <Link href="/login" style={ghost}>Member Login</Link>
        </section>
      </div>
    </main>
  );
}
