"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProjectsClient from "./ProjectsClient";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

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
    "radial-gradient(circle at top left, rgba(181,92,255,.24), transparent 28%), radial-gradient(circle at top right, rgba(157,243,191,.18), transparent 24%), radial-gradient(circle at bottom right, rgba(232,196,107,.16), transparent 28%), linear-gradient(180deg,#02040a 0%,#071326 45%,#030509 100%)",
  color: "white",
  padding: "28px 18px 90px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
};

const hero: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.28)",
  background:
    "linear-gradient(145deg, rgba(181,92,255,.18), rgba(157,243,191,.08), rgba(255,255,255,.03))",
  borderRadius: 34,
  padding: 26,
  marginBottom: 22,
};

const btn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg,#f5d978,#9df3bf 55%,#b55cff)",
  color: "#061120",
  borderRadius: 999,
  padding: "14px 22px",
  fontWeight: 950,
  textDecoration: "none",
  margin: "7px 7px 0 0",
  border: 0,
};

const ghost: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  border: "1px solid rgba(255,255,255,.18)",
  background: "linear-gradient(135deg, rgba(181,92,255,.20), rgba(255,255,255,.05))",
  borderRadius: 999,
  padding: "14px 22px",
  fontWeight: 900,
  textDecoration: "none",
  margin: "7px 7px 0 0",
};

const eyebrow: React.CSSProperties = {
  color: "#9df3bf",
  letterSpacing: 5,
  fontWeight: 950,
  fontSize: 12,
  marginBottom: 12,
  textTransform: "uppercase",
};

const muted: React.CSSProperties = {
  color: "rgba(255,255,255,.70)",
  lineHeight: 1.55,
  fontSize: 18,
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

function LockedScreen({
  reason,
}: {
  reason: "loading" | "login" | "profile" | "payment";
}) {
  return (
    <main style={page}>
      <style>{`
        a:hover,
        button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        @media (max-width: 760px) {
          a,
          button {
            box-sizing: border-box;
          }
        }
      `}</style>
      <div style={wrap}>
        <VaultForgeMemberNav
          title="Projects"
          subtitle="Deal rooms, saved targets, and project review tools"
        />

        <section style={hero}>
          <div style={eyebrow}>VAULTFORGE DEAL ROOMS</div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <span
              style={{
                border: "1px solid rgba(181,92,255,.36)",
                color: "#dcb8ff",
                borderRadius: 999,
                padding: "9px 13px",
                fontWeight: 900,
                background: "rgba(181,92,255,.12)",
              }}
            >
              Live Opportunity Network
            </span>

            <span
              style={{
                border: "1px solid rgba(157,243,191,.36)",
                color: "#9df3bf",
                borderRadius: 999,
                padding: "9px 13px",
                fontWeight: 900,
                background: "rgba(157,243,191,.10)",
              }}
            >
              Private Deal Intelligence
            </span>

            <span
              style={{
                border: "1px solid rgba(245,217,120,.36)",
                color: "#f5d978",
                borderRadius: 999,
                padding: "9px 13px",
                fontWeight: 900,
                background: "rgba(245,217,120,.10)",
              }}
            >
              Bloomberg-Style Command Flow
            </span>
          </div>

          <h1
            style={{
              fontSize: "clamp(54px,12vw,96px)",
              lineHeight: 0.88,
              margin: "0 0 18px",
              letterSpacing: -3,
            }}
          >
            {reason === "loading"
              ? "Checking access..."
              : reason === "login"
              ? "Create member access first."
              : reason === "profile"
              ? "Complete your profile first."
              : "Activate member access first."}
          </h1>

          <p style={muted}>
            {reason === "loading"
              ? "VaultForge is checking your member access before opening deal rooms."
              : reason === "login"
              ? "Log in or create member access before reviewing live deal rooms."
              : reason === "profile"
              ? "Your AI profile trains the routing engine before deal room access unlocks."
              : "Your profile is complete. Activate membership to unlock deal rooms, saved targets, and project review tools."}
          </p>

          {reason === "login" && (
            <Link href="/login" style={btn}>
              Login / Create Access
            </Link>
          )}

          {reason === "profile" && (
            <Link href="/profile" style={btn}>
              Complete Profile
            </Link>
          )}

          {reason === "payment" && (
            <Link href="/payment" style={btn}>
              Activate Access
            </Link>
          )}

          <Link href="/dashboard" style={ghost}>
            Dashboard
          </Link>

          <Link href="/" style={ghost}>
            Home
          </Link>
        </section>
      </div>
    </main>
  );
}

export default function ProjectsPage() {
  const [lockReason, setLockReason] = useState<
    "loading" | "login" | "profile" | "payment" | "open"
  >("loading");

  useEffect(() => {
    async function checkAccess() {
      try {
        const email = getEmail();

        if (!email) {
          setLockReason("login");
          return;
        }

        const res = await fetch(
          `/api/member/access?email=${encodeURIComponent(email)}`,
          {
            cache: "no-store",
            headers: {
              "x-vf-email": email,
            },
          }
        );

        const data: Access = await res.json();

        if (!data?.owner && !data?.profile_complete) {
          setLockReason("profile");
          return;
        }

        if (!data?.owner && !data?.paid && !data?.unlocked) {
          setLockReason("payment");
          return;
        }

        setLockReason("open");
      } catch {
        setLockReason("login");
      }
    }

    checkAccess();
  }, []);

  if (lockReason !== "open") {
    return <LockedScreen reason={lockReason} />;
  }

  return (
    <>
      <main style={page}>
        <div style={wrap}>
          <VaultForgeMemberNav
            title="Projects"
            subtitle="Deal rooms, saved targets, and project review tools"
          />
        </div>
      </main>
      <ProjectsClient />
    </>
  );
}