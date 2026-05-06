"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type FounderStatus = {
  ok?: boolean;
  founder?: {
    window_open?: boolean;
    limit?: number;
    count?: number;
    slots_remaining?: number;
    deadline_label?: string;
    countdown?: {
      days?: number;
      hours?: number;
      minutes?: number;
      seconds?: number;
    };
  };
  pricing?: {
    tier?: string;
    headline?: string;
    first_month?: number;
    onboarding_fee?: number;
    monthly?: number;
    copy?: string;
  };
};

const wrap: React.CSSProperties = {
  border: "1px solid rgba(157,243,191,.26)",
  background:
    "linear-gradient(145deg, rgba(157,243,191,.10), rgba(232,196,107,.07), rgba(255,255,255,.03))",
  borderRadius: 30,
  padding: 24,
  color: "white",
  margin: "22px 0",
};

const eyebrow: React.CSSProperties = {
  color: "#9df3bf",
  letterSpacing: 5,
  fontWeight: 950,
  fontSize: 12,
  marginBottom: 12,
};

const btn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 48,
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 950,
  textDecoration: "none",
  background: "#f5d978",
  color: "#061120",
  marginTop: 16,
};

const ghost: React.CSSProperties = {
  ...btn,
  background: "rgba(255,255,255,.05)",
  color: "white",
  border: "1px solid rgba(255,255,255,.16)",
  marginLeft: 8,
};

function money(value: unknown) {
  const n = Number(value || 0);
  if (!n) return "$0";
  return `$${n.toLocaleString("en-US")}`;
}

function countdownText(data: FounderStatus) {
  const c = data.founder?.countdown || {};
  const d = Number(c.days || 0);
  const h = Number(c.hours || 0);
  const m = Number(c.minutes || 0);
  const s = Number(c.seconds || 0);

  return `${d}d ${h}h ${m}m ${s}s`;
}

export default function FounderAccessBanner() {
  const [status, setStatus] = useState<FounderStatus | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/founder/status", { cache: "no-store" });
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus(null);
    }
  }

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 30000);
    return () => window.clearInterval(timer);
  }, []);

  const open = status?.founder?.window_open;
  const slots = Number(status?.founder?.slots_remaining || 0);
  const count = Number(status?.founder?.count || 0);
  const limit = Number(status?.founder?.limit || 50);
  const pricing = status?.pricing || {};

  return (
    <section style={wrap}>
      <div style={eyebrow}>
        {open ? "FOUNDING MEMBER WINDOW" : "STANDARD ACCESS"}
      </div>

      <h2 style={{ fontSize: "clamp(34px, 8vw, 62px)", lineHeight: 0.95, margin: "0 0 14px" }}>
        {open ? "First 50 founders or May 15 — whichever comes first." : "Standard access is now open."}
      </h2>

      {open ? (
        <>
          <p style={{ color: "rgba(255,255,255,.78)", fontSize: 21, lineHeight: 1.45 }}>
            Founding members get access for <strong>{money(pricing.first_month)} first month</strong>,
            then <strong>{money(pricing.monthly)}/month</strong>. After the founder window closes,
            new members pay <strong>$99 to join</strong>, then <strong>$199/month</strong>.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
              gap: 12,
              marginTop: 18,
            }}
          >
            <Metric label="Founder Slots Left" value={`${slots}`} />
            <Metric label="Founders Claimed" value={`${count}/${limit}`} />
            <Metric label="Clock" value={countdownText(status || {})} />
          </div>
        </>
      ) : (
        <p style={{ color: "rgba(255,255,255,.78)", fontSize: 21, lineHeight: 1.45 }}>
          Founder access has closed. Standard access is <strong>$99 to join</strong>,
          then <strong>$199/month</strong> for the VaultForge Member Command Center.
        </p>
      )}

      <Link href="/profile" style={btn}>
        Request / Complete Access
      </Link>
      <Link href="/dashboard" style={ghost}>
        Enter Command Center
      </Link>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,.14)",
        background: "rgba(0,0,0,.16)",
        borderRadius: 22,
        padding: 16,
      }}
    >
      <div style={{ color: "#9df3bf", fontWeight: 900 }}>{label}</div>
      <div style={{ fontSize: 34, fontWeight: 950, marginTop: 6 }}>{value}</div>
    </div>
  );
}
