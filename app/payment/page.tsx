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

const wrap: React.CSSProperties = { maxWidth: 980, margin: "0 auto" };

const hero: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.30)",
  background: "linear-gradient(135deg, rgba(255,255,255,.075), rgba(255,255,255,.025))",
  borderRadius: 34,
  padding: 26,
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

const btn: React.CSSProperties = {
  display: "inline-block",
  background: "#f5d978",
  color: "#06100a",
  textDecoration: "none",
  borderRadius: 999,
  padding: "14px 20px",
  fontWeight: 950,
  border: "none",
  margin: "7px 7px 0 0",
  cursor: "pointer",
};

const ghost: React.CSSProperties = {
  display: "inline-block",
  color: "white",
  textDecoration: "none",
  borderRadius: 999,
  padding: "14px 20px",
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

const muted: React.CSSProperties = {
  color: "rgba(255,255,255,.70)",
  lineHeight: 1.55,
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
      const res = await fetch(`/api/member/access?email=${encodeURIComponent(email)}`, {
        cache: "no-store",
        headers: { "x-vf-email": email },
      });
      const data = await res.json();
      setAccess(data);
      setStatus("");
    } catch {
      setStatus("");
    }
  }

  async function startCheckout() {
    setCheckoutStatus("Starting checkout...");
    try {
      const email = getEmail();
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-vf-email": email },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      setCheckoutStatus(data?.message || "Stripe is not connected yet. Checkout setup is ready for the final Stripe step.");
    } catch (error: any) {
      setCheckoutStatus(error?.message || "Could not start checkout.");
    }
  }

  useEffect(() => {
    loadAccess();
  }, []);

  const owner = Boolean(access?.owner);
  const unlocked = Boolean(access?.unlocked);

  return (
    <main style={page}>
      <div style={wrap}>
        <section style={hero}>
          <div style={eyebrow}>VaultForge Access</div>
          <h1 style={{ fontSize: "clamp(54px, 12vw, 96px)", lineHeight: 0.88, margin: "0 0 18px" }}>
            Activate member access.
          </h1>
          <p style={{ ...muted, fontSize: 20 }}>
            Complete your profile first. Then activate membership to unlock the full VaultForge member area.
          </p>
          <Link href="/dashboard" style={ghost}>Dashboard</Link>
          <Link href="/profile" style={ghost}>Edit Profile</Link>
        </section>

        {status && <section style={pane}>{status}</section>}

        {owner && (
          <section style={{ ...pane, borderColor: "rgba(157,243,191,.45)" }}>
            <div style={{ ...eyebrow, color: "#9df3bf" }}>Owner Access</div>
            <h2 style={{ fontSize: 38, margin: "0 0 12px" }}>You are not locked.</h2>
            <p style={muted}>Owner bypass is active. You can keep testing while member access rules are built.</p>
            <Link href="/dashboard" style={btn}>Continue to Dashboard</Link>
            <button type="button" style={ghost} onClick={startCheckout}>Test Checkout Route</button>
          </section>
        )}

        {!owner && unlocked && (
          <section style={{ ...pane, borderColor: "rgba(157,243,191,.45)" }}>
            <div style={{ ...eyebrow, color: "#9df3bf" }}>Access Active</div>
            <h2 style={{ fontSize: 38, margin: "0 0 12px" }}>Your member access is active.</h2>
            <Link href="/dashboard" style={btn}>Enter Dashboard</Link>
          </section>
        )}

        {!owner && !unlocked && (
          <>
            <section style={pane}>
              <div style={eyebrow}>Current Status</div>
              <p style={muted}>Email: <strong>{access?.email || "Not detected"}</strong></p>
              <p style={muted}>Profile: <strong>{access?.profile_complete ? "Complete" : "Incomplete"}</strong></p>
              <p style={muted}>Payment: <strong>{access?.paid ? "Active" : "Not active"}</strong></p>
            </section>

            {!access?.profile_complete && (
              <section style={{ ...pane, borderColor: "rgba(232,196,107,.35)" }}>
                <div style={eyebrow}>Step 1 Required</div>
                <h2 style={{ fontSize: 36, margin: "0 0 12px" }}>Complete your profile first.</h2>
                <p style={muted}>The payment button appears after required profile fields are complete.</p>
                <Link href="/profile" style={btn}>Complete Profile</Link>
              </section>
            )}

            {access?.profile_complete && !access?.paid && (
              <section style={{ ...pane, borderColor: "rgba(232,196,107,.35)" }}>
                <div style={eyebrow}>Step 2 Payment</div>
                <h2 style={{ fontSize: 36, margin: "0 0 12px" }}>Founding access: $49 today.</h2>
                <p style={muted}>
                  Founding Member Access is $49 for the first month. After the first month, membership renews at $149/month unless canceled before renewal.
                </p>
                <p style={muted}>
                  After May 10, new member access increases to $99 for the first month, then $149/month.
                </p>
                <button type="button" style={btn} onClick={startCheckout}>Activate Access — $49 Today</button>
              </section>
            )}
          </>
        )}

        {checkoutStatus && (
          <section style={{ ...pane, color: checkoutStatus.toLowerCase().includes("not connected") ? "#e8c46b" : "#9df3bf" }}>
            <strong>{checkoutStatus}</strong>
          </section>
        )}

        <section style={pane}>
          <div style={eyebrow}>Billing Terms</div>
          <p style={muted}>
            Membership may be canceled before renewal. Access, billing, and cancellation controls will connect to Stripe during the final lock step.
          </p>
        </section>
      </div>
    </main>
  );
}
