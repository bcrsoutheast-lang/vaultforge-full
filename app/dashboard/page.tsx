"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Stats = {
  deals: number;
  members: number;
  bucket: number;
  messages: number;
  alerts: number;
  warning?: string;
};

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

const wrap: React.CSSProperties = { maxWidth: 1180, margin: "0 auto" };

const hero: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.28)",
  background: "rgba(255,255,255,.045)",
  borderRadius: 34,
  padding: 24,
  marginBottom: 22,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  gap: 16,
};

const pane: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.13)",
  background:
    "linear-gradient(145deg, rgba(255,255,255,.07), rgba(255,255,255,.025))",
  borderRadius: 28,
  padding: 22,
  boxShadow: "0 25px 75px rgba(0,0,0,.22)",
};

const btn: React.CSSProperties = {
  display: "inline-block",
  background: "#f5d978",
  color: "#06100a",
  textDecoration: "none",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 900,
  border: "none",
  margin: "6px 6px 0 0",
};

const ghost: React.CSSProperties = {
  display: "inline-block",
  color: "white",
  textDecoration: "none",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 900,
  border: "1px solid rgba(255,255,255,.16)",
  background: "rgba(255,255,255,.04)",
  margin: "6px 6px 0 0",
};

const topAccount: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 18,
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

function FounderCountdown() {
  const launchDate = new Date("2026-05-10T00:00:00-04:00").getTime();
  const [remaining, setRemaining] = useState(launchDate - Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining(launchDate - Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [launchDate]);

  if (remaining <= 0) return null;

  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((remaining / (1000 * 60)) % 60);
  const seconds = Math.floor((remaining / 1000) % 60);

  return (
    <section style={{ ...hero, borderColor: "rgba(157,243,191,.35)" }}>
      <div style={{ ...eyebrow, color: "#9df3bf" }}>Founding Member Window</div>
      <h2 style={{ fontSize: "clamp(36px,8vw,70px)", lineHeight: 0.95, margin: "0 0 14px" }}>
        {days}d {hours}h {minutes}m {seconds}s
      </h2>
      <p style={{ ...muted, fontSize: 18 }}>
        Founding access is $49 for the first month through May 10. After that, new access moves to $99 for the first month, then $149/month unless canceled before renewal.
      </p>
    </section>
  );
}

function StatPane({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div style={pane}>
      <div style={eyebrow}>{label}</div>
      <div style={{ fontSize: 54, fontWeight: 950, lineHeight: 1 }}>{value}</div>
      <p style={muted}>{detail}</p>
    </div>
  );
}

function AccessNotice({ access }: { access: Access | null }) {
  if (!access) return null;

  if (access.owner) {
    return (
      <section style={{ ...hero, borderColor: "rgba(157,243,191,.35)" }}>
        <div style={{ ...eyebrow, color: "#9df3bf" }}>Owner Bypass Active</div>
        <p style={{ ...muted, fontSize: 18 }}>
          You are not locked out. Owner access remains open while payment/profile lock is being prepared.
        </p>
        <Link href="/profile" style={btn}>Edit Profile / Alerts</Link>
      </section>
    );
  }

  if (!access.profile_complete) {
    return (
      <section style={{ ...hero, borderColor: "rgba(232,196,107,.35)" }}>
        <div style={eyebrow}>Profile Required</div>
        <h2 style={{ fontSize: 34, margin: "0 0 12px" }}>Complete your profile to continue.</h2>
        <p style={muted}>Profile controls member type, markets, buy box, and alert preferences.</p>
        <Link href="/profile" style={btn}>Complete Profile</Link>
      </section>
    );
  }

  if (!access.paid) {
    return (
      <section style={{ ...hero, borderColor: "rgba(232,196,107,.35)" }}>
        <div style={eyebrow}>Payment Next</div>
        <h2 style={{ fontSize: 34, margin: "0 0 12px" }}>Profile complete. Payment unlock is next.</h2>
        <p style={muted}>Stripe lock is not active yet. This is the safe preview step.</p>
        <Link href="/payment" style={btn}>Go to Payment</Link>
        <Link href="/profile" style={ghost}>Edit Profile</Link>
      </section>
    );
  }

  return null;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    deals: 0,
    members: 0,
    bucket: 0,
    messages: 0,
    alerts: 0,
  });
  const [access, setAccess] = useState<Access | null>(null);
  const [status, setStatus] = useState("Loading dashboard...");

  async function loadDashboard() {
    setStatus("Loading dashboard...");
    try {
      const email = getEmail();

      const [statsRes, accessRes] = await Promise.all([
        fetch(`/api/dashboard/stats?email=${encodeURIComponent(email)}`, {
          cache: "no-store",
          headers: { "x-vf-email": email },
        }),
        fetch(`/api/member/access?email=${encodeURIComponent(email)}`, {
          cache: "no-store",
          headers: { "x-vf-email": email },
        }),
      ]);

      const statsData = await statsRes.json();
      const accessData = await accessRes.json();

      const statsPayload = statsData?.stats || statsData || {};

      setStats({
        deals: Number(statsPayload?.deals || 0),
        members: Number(statsPayload?.members || 0),
        bucket: Number(statsPayload?.bucket || 0),
        messages: Number(statsPayload?.messages || 0),
        alerts: Number(statsPayload?.alerts || 0),
        warning: statsPayload?.warning || statsData?.warning || "",
      });

      setAccess(accessData);
      setStatus("");
    } catch {
      setStatus("");
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <main style={page}>
      <div style={wrap}>
        <div style={topAccount}>
          <div style={{ ...eyebrow, marginBottom: 0 }}>VaultForge</div>
          <div>
            <Link href="/profile" style={ghost}>Profile</Link>
            <Link href="/payment" style={ghost}>Payment</Link>
            <Link href="/logout" style={ghost}>Logout</Link>
          </div>
        </div>

        <section style={hero}>
          <div style={eyebrow}>VaultForge Dashboard</div>
          <h1 style={{ fontSize: "clamp(56px,12vw,104px)", lineHeight: 0.88, margin: "0 0 18px" }}>
            Member command center.
          </h1>
          <p style={{ ...muted, fontSize: 20 }}>
            Track deal flow, saved targets, messages, alerts, and live platform activity.
          </p>

          <div style={{ marginBottom: 12 }}>
            <div style={{ ...eyebrow, marginBottom: 6 }}>Main Actions</div>
            <Link href="/submit" style={btn}>Create Deal</Link>
            <Link href="/projects" style={ghost}>Projects</Link>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ ...eyebrow, marginBottom: 6 }}>Management</div>
            <Link href="/buy-bucket" style={ghost}>Buy Bucket</Link>
            <Link href="/messages" style={ghost}>Messages</Link>
            <Link href="/alerts" style={ghost}>Alerts</Link>
          </div>

          <div>
            <div style={{ ...eyebrow, marginBottom: 6 }}>Account</div>
            <Link href="/profile" style={btn}>Profile / Alert Preferences</Link>
            <Link href="/payment" style={ghost}>Payment</Link>
          </div>
        </section>

        <AccessNotice access={access} />
        <FounderCountdown />

        {status && <section style={hero}>{status}</section>}

        {stats.warning && (
          <section style={{ ...hero, color: "#ffd0d0" }}>
            {stats.warning}
          </section>
        )}

        <section style={grid}>
          <StatPane label="Active Deals" value={stats.deals} detail="Total deal rooms in the system." />
          <StatPane label="Members" value={stats.members} detail="Member records tracked." />
          <StatPane label="Buy Bucket" value={stats.bucket} detail="Saved acquisition targets." />
          <StatPane label="Messages" value={stats.messages} detail="Deal-tied conversations." />
          <StatPane label="Alerts" value={stats.alerts} detail="Routing and match signals." />
        </section>
      </div>
    </main>
  );
}