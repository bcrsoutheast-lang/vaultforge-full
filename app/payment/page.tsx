"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Access = {
  email: string;
  owner: boolean;
  profile_complete: boolean;
  payment_status: string;
  access_status: string;
  paid: boolean;
  unlocked: boolean;
  next_step: string;
};

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 30%), radial-gradient(circle at top right, rgba(157,243,191,.10), transparent 28%), linear-gradient(180deg,#030509,#071326 55%,#030509)",
  color: "white",
  padding: "28px 18px 90px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  maxWidth: 1080,
  margin: "0 auto",
};

const hero: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.30)",
  background:
    "linear-gradient(135deg, rgba(255,255,255,.075), rgba(255,255,255,.025))",
  borderRadius: 34,
  padding: 28,
  marginBottom: 22,
  boxShadow: "0 30px 90px rgba(0,0,0,.38)",
};

const pane: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.13)",
  background: "rgba(255,255,255,.04)",
  borderRadius: 28,
  padding: 22,
  marginBottom: 18,
};

const greenPane: React.CSSProperties = {
  ...pane,
  border: "1px solid rgba(157,243,191,.28)",
  background:
    "linear-gradient(145deg, rgba(157,243,191,.08), rgba(255,255,255,.03))",
};

const goldPane: React.CSSProperties = {
  ...pane,
  border: "1px solid rgba(232,196,107,.30)",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 34%), rgba(255,255,255,.035)",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
  gap: 16,
  marginTop: 18,
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  background: "rgba(0,0,0,.18)",
  borderRadius: 24,
  padding: 20,
};

const btn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg,#f5d978,#9df3bf)",
  color: "#06100a",
  textDecoration: "none",
  borderRadius: 999,
  padding: "14px 22px",
  fontWeight: 950,
  border: "none",
  margin: "7px 7px 0 0",
  cursor: "pointer",
};

const ghost: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  textDecoration: "none",
  borderRadius: 999,
  padding: "14px 22px",
  fontWeight: 900,
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.04)",
  margin: "7px 7px 0 0",
  cursor: "pointer",
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: 5,
  fontWeight: 900,
  fontSize: 12,
  marginBottom: 12,
  textTransform: "uppercase",
};

const greenEyebrow: React.CSSProperties = {
  ...eyebrow,
  color: "#9df3bf",
};

const muted: React.CSSProperties = {
  color: "rgba(255,255,255,.70)",
  lineHeight: 1.6,
  fontSize: 17,
};

function getEmail() {
  if (typeof window === "undefined") return "";

  return (
    localStorage.getItem("vf_email") ||
    sessionStorage.getItem("vf_email") ||
    ""
  )
    .trim()
    .toLowerCase();
}

export default function PaymentPage() {
  const [access, setAccess] = useState<Access | null>(null);
  const [status, setStatus] = useState("Checking access...");
  const [checkoutStatus, setCheckoutStatus] = useState("");

  async function loadAccess() {
    setStatus("Checking access...");

    try {
      const email = getEmail();

      const res = await fetch(
        `/api/member/access?email=${encodeURIComponent(email)}`,
        {
          cache: "no-store",
          headers: {
            "x-vf-email": email,
          },
        }
      );

      const data = await res.json();

      setAccess(data);
      setStatus("");
    } catch {
      setStatus("");
    }
  }

  async function startCheckout() {
    setCheckoutStatus("Starting secure checkout...");

    try {
      const email = getEmail();

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": email,
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      setCheckoutStatus(
        data?.message ||
          "Stripe is not connected yet. Checkout architecture is prepared for the final Stripe activation step."
      );
    } catch (error: any) {
      setCheckoutStatus(
        error?.message || "Could not start checkout."
      );
    }
  }

  useEffect(() => {
    loadAccess();
  }, []);

  const owner = Boolean(access?.owner);
  const unlocked = Boolean(access?.unlocked);

  return (
    <main style={page}>
      <style>{`
        @media (max-width: 760px) {
          .vf-payment-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .vf-payment-actions > * {
            width: 100%;
            margin: 0 !important;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <section style={hero}>
          <div style={greenEyebrow}>MEMBER ACCESS ACTIVATION</div>

          <h1
            style={{
              fontSize: "clamp(54px, 12vw, 98px)",
              lineHeight: 0.88,
              margin: "0 0 18px",
              letterSpacing: -3,
            }}
          >
            Unlock the Member Command Center.
          </h1>

          <p style={{ ...muted, fontSize: 21, maxWidth: 900 }}>
            VaultForge is being built as a private AI-powered real estate intelligence network.
            Profile completion trains the routing engine. Member activation unlocks access to smart alerts,
            deal rooms, network intelligence, buy buckets, messaging, and AI routing signals.
          </p>

          <div className="vf-payment-actions">
            <Link href="/dashboard" style={ghost}>
              Preview Dashboard
            </Link>

            <Link href="/profile" style={ghost}>
              Edit Profile
            </Link>

            <Link href="/apply" style={ghost}>
              Member Access
            </Link>
          </div>
        </section>

        {status && (
          <section style={pane}>
            <strong>{status}</strong>
          </section>
        )}

        {owner && (
          <section style={greenPane}>
            <div style={greenEyebrow}>OWNER ACCESS</div>

            <h2 style={{ fontSize: 40, margin: "0 0 12px" }}>
              Owner bypass is active.
            </h2>

            <p style={muted}>
              Your account is unlocked for development, testing, admin routing,
              dashboard access, alerts, and checkout flow verification.
            </p>

            <div className="vf-payment-actions">
              <Link href="/dashboard" style={btn}>
                Continue To Dashboard
              </Link>

              <button
                type="button"
                style={ghost}
                onClick={startCheckout}
              >
                Test Checkout Route
              </button>
            </div>
          </section>
        )}

        {!owner && unlocked && (
          <section style={greenPane}>
            <div style={greenEyebrow}>ACCESS ACTIVE</div>

            <h2 style={{ fontSize: 40, margin: "0 0 12px" }}>
              Your member access is active.
            </h2>

            <p style={muted}>
              Full Member Command Center access is unlocked.
            </p>

            <Link href="/dashboard" style={btn}>
              Enter Command Center
            </Link>
          </section>
        )}

        {!owner && !unlocked && (
          <>
            <section style={pane}>
              <div style={eyebrow}>CURRENT STATUS</div>

              <div style={grid}>
                <div style={card}>
                  <div style={greenEyebrow}>EMAIL</div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>
                    {access?.email || "Not detected"}
                  </div>
                </div>

                <div style={card}>
                  <div style={greenEyebrow}>PROFILE</div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>
                    {access?.profile_complete ? "Complete" : "Incomplete"}
                  </div>
                </div>

                <div style={card}>
                  <div style={greenEyebrow}>PAYMENT</div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>
                    {access?.paid ? "Active" : "Inactive"}
                  </div>
                </div>
              </div>
            </section>

            {!access?.profile_complete && (
              <section style={goldPane}>
                <div style={eyebrow}>STEP 1 REQUIRED</div>

                <h2 style={{ fontSize: 40, margin: "0 0 12px" }}>
                  Complete your profile first.
                </h2>

                <p style={muted}>
                  Your AI profile trains the routing engine with markets,
                  roles, buy box, strategies, alert preferences, needs,
                  and what you can provide.
                </p>

                <Link href="/profile" style={btn}>
                  Complete Profile
                </Link>
              </section>
            )}

            {access?.profile_complete && !access?.paid && (
              <>
                <section style={goldPane}>
                  <div style={eyebrow}>FOUNDING ACCESS</div>

                  <h2 style={{ fontSize: 42, margin: "0 0 12px" }}>
                    Activate access — $49 today.
                  </h2>

                  <p style={{ ...muted, fontSize: 19 }}>
                    First 50 founders or May 15 — whichever comes first.
                    Founding access is
                    <strong style={{ color: "#9df3bf" }}> $49 for the first month</strong>,
                    then
                    <strong style={{ color: "#e8c46b" }}> $199/month</strong>
                    unless canceled before renewal.
                  </p>

                  <p style={muted}>
                    After the founder window closes, standard access becomes
                    <strong style={{ color: "#e8c46b" }}> $99 to join</strong>,
                    then
                    <strong style={{ color: "#e8c46b" }}> $199/month</strong>.
                  </p>

                  <div className="vf-payment-actions">
                    <button
                      type="button"
                      style={btn}
                      onClick={startCheckout}
                    >
                      Activate Founder Access — $49
                    </button>

                    <Link href="/dashboard" style={ghost}>
                      Preview Dashboard
                    </Link>
                  </div>
                </section>

                <section style={pane}>
                  <div style={eyebrow}>WHAT UNLOCKS AFTER PAYMENT</div>

                  <div style={grid}>
                    <div style={card}>
                      <div style={greenEyebrow}>ALERTS</div>
                      <p style={muted}>
                        AI smart routing alerts and opportunity signals.
                      </p>
                    </div>

                    <div style={card}>
                      <div style={greenEyebrow}>DEAL ROOMS</div>
                      <p style={muted}>
                        Create, route, manage, and track acquisition opportunities.
                      </p>
                    </div>

                    <div style={card}>
                      <div style={greenEyebrow}>NETWORK</div>
                      <p style={muted}>
                        Member directory access to buyers, lenders, operators, and partners.
                      </p>
                    </div>

                    <div style={card}>
                      <div style={greenEyebrow}>BUY BUCKET</div>
                      <p style={muted}>
                        Save and track target opportunities and demand signals.
                      </p>
                    </div>

                    <div style={card}>
                      <div style={greenEyebrow}>MESSAGES</div>
                      <p style={muted}>
                        Private communication and opportunity coordination.
                      </p>
                    </div>

                    <div style={card}>
                      <div style={greenEyebrow}>AI ROUTING</div>
                      <p style={muted}>
                        Match scoring, confidence signals, and strategy alignment.
                      </p>
                    </div>
                  </div>
                </section>
              </>
            )}
          </>
        )}

        {checkoutStatus && (
          <section
            style={{
              ...pane,
              color: checkoutStatus.toLowerCase().includes("not connected")
                ? "#e8c46b"
                : "#9df3bf",
            }}
          >
            <strong>{checkoutStatus}</strong>
          </section>
        )}

        <section style={pane}>
          <div style={eyebrow}>BILLING TERMS</div>

          <p style={muted}>
            Membership may be canceled before renewal. Stripe activation,
            subscription controls, and billing automation will be connected
            during the final secure launch phase.
          </p>
        </section>
      </div>
    </main>
  );
}
