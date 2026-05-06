"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProjectsClient from "./ProjectsClient";

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
    "radial-gradient(circle at top left, rgba(232,196,107,.15), transparent 30%), radial-gradient(circle at top right, rgba(157,243,191,.10), transparent 28%), linear-gradient(180deg,#030509,#071326 55%,#030509)",
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
    "linear-gradient(145deg, rgba(255,255,255,.07), rgba(255,255,255,.025))",
  borderRadius: 34,
  padding: 26,
  marginBottom: 22,
};

const btn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg,#f5d978,#9df3bf)",
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
  background: "rgba(255,255,255,.04)",
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
      <div style={wrap}>
        <section style={hero}>
          <div style={eyebrow}>VAULTFORGE DEAL ROOMS</div>

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

  return <ProjectsClient />;
}
