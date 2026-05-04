"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type AccessState = {
  email: string;
  profileComplete: boolean;
  paymentStatus: string;
  memberStatus: string;
  accessLevel: string;
  nextRequiredStep: string;
  hasFullAccess: boolean;
};

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 30%), radial-gradient(circle at top right, rgba(157,243,191,.10), transparent 28%), linear-gradient(180deg, #030509 0%, #071326 55%, #030509 100%)",
  color: "white",
  padding: "26px 18px 90px",
  fontFamily: "Arial, sans-serif",
};

const wrapStyle: React.CSSProperties = { maxWidth: 1120, margin: "0 auto" };
const navStyle: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24 };
const navLinkStyle: React.CSSProperties = { color: "white", textDecoration: "none", border: "1px solid rgba(255,255,255,.18)", borderRadius: 999, padding: "11px 15px", fontSize: 14, background: "rgba(255,255,255,.04)" };
const heroStyle: React.CSSProperties = { border: "1px solid rgba(255,255,255,.16)", background: "linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.025))", borderRadius: 34, padding: "30px 22px", marginBottom: 22, boxShadow: "0 30px 90px rgba(0,0,0,.45)" };
const sectionStyle: React.CSSProperties = { border: "1px solid rgba(255,255,255,.13)", background: "rgba(255,255,255,.035)", borderRadius: 30, padding: 22, marginBottom: 20 };
const cardStyle: React.CSSProperties = { border: "1px solid rgba(255,255,255,.15)", background: "linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.025))", borderRadius: 26, padding: 22, color: "white" };
const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 };
const eyebrowStyle: React.CSSProperties = { color: "#e8c46b", letterSpacing: 5, fontWeight: 900, fontSize: 12, marginBottom: 12 };
const titleStyle: React.CSSProperties = { fontSize: "clamp(44px, 10vw, 84px)", lineHeight: 0.9, letterSpacing: -3, margin: "0 0 16px" };
const mutedStyle: React.CSSProperties = { color: "rgba(255,255,255,.66)", lineHeight: 1.55, fontSize: 16 };
const disabledButtonStyle: React.CSSProperties = { display: "inline-block", background: "linear-gradient(135deg, #f4d47b, #9df3bf)", color: "#06101e", borderRadius: 999, padding: "15px 20px", textDecoration: "none", fontWeight: 950, marginTop: 14, border: 0, opacity: 0.55, cursor: "not-allowed" };
const primaryButtonStyle: React.CSSProperties = { display: "inline-block", background: "linear-gradient(135deg, #f4d47b, #9df3bf)", color: "#06101e", borderRadius: 999, padding: "15px 20px", textDecoration: "none", fontWeight: 950, marginTop: 14 };
const pillStyle: React.CSSProperties = { display: "inline-block", color: "#9df3bf", border: "1px solid rgba(157,243,191,.35)", borderRadius: 999, padding: "7px 12px", fontSize: 12, letterSpacing: 1.4, marginBottom: 14, fontWeight: 900 };

function getEmail() {
  if (typeof window === "undefined") return "";
  return (window.localStorage.getItem("vf_email") || window.sessionStorage.getItem("vf_email") || "").trim().toLowerCase();
}

function authHeaders() {
  return { "Content-Type": "application/json", "x-vf-email": getEmail() };
}

export default function PaymentPage() {
  const [access, setAccess] = useState<AccessState | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadAccess() {
    setLoading(true);
    setStatus("");

    if (!getEmail()) {
      setStatus("Session missing. Go to Login and enter your email again.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/member/access", { cache: "no-store", headers: authHeaders() });
      const data = await res.json();

      if (!res.ok) {
        setStatus(data?.error || "Could not load access status.");
        setAccess(null);
      } else {
        setAccess(data);
      }
    } catch {
      setStatus("Could not load payment status. Refresh and try again.");
      setAccess(null);
    }

    setLoading(false);
  }

  useEffect(() => { loadAccess(); }, []);

  const profileComplete = Boolean(access?.profileComplete);
  const hasFullAccess = Boolean(access?.hasFullAccess);

  return (
    <main style={shellStyle}>
      <div style={wrapStyle}>
        <nav style={navStyle}>
          <Link href="/dashboard" style={navLinkStyle}>Dashboard</Link>
          <Link href="/profile" style={navLinkStyle}>Profile</Link>
          <Link href="/terms" style={navLinkStyle}>Terms</Link>
        </nav>

        <section style={heroStyle}>
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <img src="/vaultforge-logo.png" alt="VaultForge" style={{ width: "100%", maxWidth: 380, borderRadius: 22 }} />
          </div>
          <div style={eyebrowStyle}>MEMBER ACCESS</div>
          <h1 style={titleStyle}>Unlock the VaultForge command center.</h1>
          <p style={{ ...mutedStyle, fontSize: 20 }}>
            Payment is the final launch gate after profile completion. Stripe checkout
            will connect here once your price is ready.
          </p>
        </section>

        {loading && <section style={sectionStyle}>Loading access status...</section>}
        {status && <section style={{ ...sectionStyle, color: "#ffd0d0" }}>{status}</section>}

        {!loading && access && (
          <>
            <section style={sectionStyle}>
              <div style={eyebrowStyle}>ACCESS STATUS</div>
              <div style={gridStyle}>
                <div style={cardStyle}>
                  <span style={pillStyle}>PROFILE</span>
                  <h2 style={{ fontSize: 34, margin: "0 0 10px" }}>{profileComplete ? "Complete" : "Required"}</h2>
                  <p style={mutedStyle}>
                    {profileComplete ? "Your operating profile is complete. Payment is the next gate." : "Complete your profile before payment unlock is available."}
                  </p>
                  {!profileComplete && <Link href="/profile" style={primaryButtonStyle}>Complete Profile</Link>}
                </div>

                <div style={cardStyle}>
                  <span style={pillStyle}>PAYMENT</span>
                  <h2 style={{ fontSize: 34, margin: "0 0 10px" }}>{hasFullAccess ? "Active" : "Pending"}</h2>
                  <p style={mutedStyle}>
                    {hasFullAccess ? "Your member access is active." : "Stripe is not connected yet. This page is ready for checkout when pricing is final."}
                  </p>
                  {profileComplete && !hasFullAccess && <button type="button" style={disabledButtonStyle} disabled>Stripe Checkout Coming Next</button>}
                </div>

                <div style={cardStyle}>
                  <span style={pillStyle}>ACCESS</span>
                  <h2 style={{ fontSize: 34, margin: "0 0 10px" }}>{hasFullAccess ? "Unlocked" : "Locked"}</h2>
                  <p style={mutedStyle}>Current status: {access.memberStatus || "profile_required"} / {access.paymentStatus || "unpaid"}</p>
                </div>
              </div>
            </section>

            <section style={sectionStyle}>
              <div style={eyebrowStyle}>FOUNDING MEMBER PRICING</div>
              <h2 style={{ fontSize: "clamp(34px, 8vw, 66px)", lineHeight: .95, margin: "0 0 12px" }}>
                $49 first month. $149/month after.
              </h2>
              <p style={{ ...mutedStyle, fontSize: 19 }}>
                Use this page as the holding step until Stripe is ready. When Stripe is connected,
                this same page becomes the payment checkout and then unlocks full member access.
              </p>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
