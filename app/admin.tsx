"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 30%), radial-gradient(circle at top right, rgba(157,243,191,.10), transparent 28%), linear-gradient(180deg,#030509,#071326 55%,#030509)",
  color: "white",
  padding: "28px 18px 90px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
};

const hero: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.30)",
  background: "rgba(255,255,255,.045)",
  borderRadius: 34,
  padding: 24,
  marginBottom: 22,
  boxShadow: "0 28px 90px rgba(0,0,0,.28)",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
  gap: 16,
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.13)",
  background:
    "linear-gradient(145deg, rgba(255,255,255,.075), rgba(255,255,255,.025))",
  borderRadius: 28,
  padding: 20,
  boxShadow: "0 25px 75px rgba(0,0,0,.22)",
};

const btn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#f5d978",
  color: "#06100a",
  textDecoration: "none",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 900,
  border: "none",
  margin: "6px 6px 0 0",
  minHeight: 46,
};

const ghost: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  textDecoration: "none",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 900,
  border: "1px solid rgba(255,255,255,.16)",
  background: "rgba(255,255,255,.04)",
  margin: "6px 6px 0 0",
  minHeight: 46,
};

const danger: React.CSSProperties = {
  ...ghost,
  border: "1px solid rgba(255,120,120,.38)",
  color: "#ffd0d0",
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
  color: "rgba(255,255,255,.68)",
  lineHeight: 1.5,
};

function cleanEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function readStoredEmail() {
  if (typeof window === "undefined") return "";

  return cleanEmail(
    localStorage.getItem("vf_email") ||
      sessionStorage.getItem("vf_email") ||
      localStorage.getItem("vf_admin_email") ||
      sessionStorage.getItem("vf_admin_email") ||
      ""
  );
}

function readAdminFlag() {
  if (typeof window === "undefined") return false;

  const raw = [
    localStorage.getItem("vf_admin"),
    sessionStorage.getItem("vf_admin"),
    localStorage.getItem("isAdmin"),
    sessionStorage.getItem("isAdmin"),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return raw.includes("1") || raw.includes("true") || raw.includes("yes");
}

function AdminCard({
  label,
  title,
  text,
  href,
  button,
  dangerous,
}: {
  label: string;
  title: string;
  text: string;
  href: string;
  button: string;
  dangerous?: boolean;
}) {
  return (
    <article style={card}>
      <div style={eyebrow}>{label}</div>
      <h2 style={{ fontSize: 30, lineHeight: 1.05, margin: "0 0 10px" }}>
        {title}
      </h2>
      <p style={{ ...muted, fontSize: 17 }}>{text}</p>
      <Link href={href} style={dangerous ? danger : ghost}>
        {button}
      </Link>
    </article>
  );
}

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [adminFlag, setAdminFlag] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setEmail(readStoredEmail());
    setAdminFlag(readAdminFlag());
    setReady(true);
  }, []);

  const owner = useMemo(() => {
    return cleanEmail(email) === OWNER_EMAIL || adminFlag;
  }, [email, adminFlag]);

  if (!ready) {
    return (
      <main style={page}>
        <div style={wrap}>
          <section style={hero}>Loading admin...</section>
        </div>
      </main>
    );
  }

  if (!owner) {
    return (
      <main style={page}>
        <div style={wrap}>
          <section style={hero}>
            <div style={eyebrow}>Admin Access</div>
            <h1
              style={{
                fontSize: "clamp(52px,11vw,94px)",
                lineHeight: 0.9,
                margin: "0 0 18px",
              }}
            >
              Admin login required.
            </h1>
            <p style={{ ...muted, fontSize: 20 }}>
              This page is reserved for the VaultForge owner/admin account.
            </p>
            <Link href="/admin-login" style={btn}>
              Admin Login
            </Link>
            <Link href="/dashboard" style={ghost}>
              Dashboard
            </Link>
            <Link href="/logout" style={ghost}>
              Logout
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main style={page}>
      <div style={wrap}>
        <section style={hero}>
          <div style={eyebrow}>VaultForge Admin</div>
          <h1
            style={{
              fontSize: "clamp(56px,12vw,104px)",
              lineHeight: 0.88,
              margin: "0 0 18px",
            }}
          >
            Owner control center.
          </h1>
          <p style={{ ...muted, fontSize: 20 }}>
            Admin page restored without touching client UI files, login route,
            middleware, Supabase rules, or member routes. Use this as the safe
            admin command screen while the platform is stabilized.
          </p>

          <Link href="/dashboard" style={btn}>
            Member Dashboard
          </Link>
          <Link href="/submit" style={ghost}>
            Create Deal
          </Link>
          <Link href="/projects" style={ghost}>
            Review Deals
          </Link>
          <Link href="/buy-bucket" style={ghost}>
            Buy Bucket
          </Link>
          <Link href="/messages" style={ghost}>
            Messages
          </Link>
          <Link href="/logout" style={ghost}>
            Logout
          </Link>
        </section>

        <section style={grid}>
          <AdminCard
            label="Deals"
            title="Review deal rooms"
            text="Open Projects to review submitted opportunities, view deal rooms, and continue deal moderation work."
            href="/projects"
            button="Open Projects"
          />

          <AdminCard
            label="Create"
            title="Submit test opportunities"
            text="Use the create flow to test Residential, Commercial, and Land submissions without changing auth."
            href="/submit"
            button="Open Create"
          />

          <AdminCard
            label="Members"
            title="Member network"
            text="Open the member network area. Full admin member tools can be rebuilt here later without breaking current access."
            href="/network"
            button="Open Network"
          />

          <AdminCard
            label="Messages"
            title="Conversation center"
            text="Open the messages area to test deal-tied communications and restore richer message features next."
            href="/messages"
            button="Open Messages"
          />

          <AdminCard
            label="Buy Bucket"
            title="Saved acquisition targets"
            text="Open Buy Bucket to verify saved deal tracking and restore the richer UI without touching auth again."
            href="/buy-bucket"
            button="Open Buy Bucket"
          />

          <AdminCard
            label="Safety"
            title="Logout and retest"
            text="Use logout to test public, member, and admin access states after deploy."
            href="/logout"
            button="Logout"
            dangerous
          />
        </section>

        <section style={{ ...hero, marginTop: 22, borderColor: "rgba(255,120,120,.30)" }}>
          <div style={eyebrow}>Important</div>
          <p style={{ ...muted, fontSize: 18 }}>
            This page is intentionally self-contained because you said there is
            no AdminClient file. It does not add middleware. It does not change
            cookies. It does not touch BuyBucketClient, MessagesClient,
            Dashboard, Login, or Supabase.
          </p>
        </section>
      </div>
    </main>
  );
}
