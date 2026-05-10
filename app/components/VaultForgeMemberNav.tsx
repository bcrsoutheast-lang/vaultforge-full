"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type Props = {
  title?: string;
  subtitle?: string;
};

const shell: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.26)",
  background:
    "linear-gradient(145deg, rgba(232,196,107,.11), rgba(181,92,255,.08), rgba(255,255,255,.035))",
  borderRadius: 28,
  padding: 18,
  marginBottom: 22,
  boxShadow: "0 26px 80px rgba(0,0,0,.30)",
};

const top: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 14,
  flexWrap: "wrap",
};

const brand: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const mark: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 15,
  background:
    "linear-gradient(135deg,#f5d978,#b88912 42%,#343434 43%,#d8d8d8 68%,#111)",
  boxShadow: "0 0 36px rgba(232,196,107,.22)",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 22,
  lineHeight: 1.05,
  fontWeight: 950,
};

const subStyle: React.CSSProperties = {
  margin: "4px 0 0",
  color: "rgba(255,255,255,.68)",
  fontSize: 13,
  lineHeight: 1.35,
};

const navGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
  gap: 10,
  marginTop: 16,
};

const link: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  minHeight: 42,
  borderRadius: 16,
  padding: "10px 13px",
  textDecoration: "none",
  color: "white",
  fontWeight: 900,
  border: "1px solid rgba(255,255,255,.13)",
  background: "rgba(255,255,255,.055)",
};

const hotLink: React.CSSProperties = {
  ...link,
  color: "#06100a",
  background: "linear-gradient(135deg,#f5d978,#9df3bf 55%,#b55cff)",
  border: "none",
};

const adminLink: React.CSSProperties = {
  ...link,
  border: "1px solid rgba(245,217,120,.38)",
  color: "#f5d978",
};

const dangerLink: React.CSSProperties = {
  ...link,
  border: "1px solid rgba(255,120,120,.34)",
  color: "#ffd0d0",
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

export default function VaultForgeMemberNav({
  title = "VaultForge",
  subtitle = "Private real estate intelligence network",
}: Props) {
  const [email, setEmail] = useState("");

  useEffect(() => {
    setEmail(getEmail());
  }, []);

  const owner = email === OWNER_EMAIL || readCookie("vf_admin") === "1" || readCookie("isAdmin") === "true";

  return (
    <section style={shell}>
      <style>{`
        a:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }
      `}</style>

      <div style={top}>
        <div style={brand}>
          <div style={mark} />
          <div>
            <h1 style={titleStyle}>{title}</h1>
            <p style={subStyle}>{subtitle}</p>
          </div>
        </div>

        <span style={chip}>{email ? `Signed in: ${email}` : "No session email"}</span>
      </div>

      <nav style={navGrid}>
        <Link href="/dashboard" style={link}>
          <span>Dashboard</span>
          <span>→</span>
        </Link>

        <Link href="/pain" style={hotLink}>
          <span>Pain Button</span>
          <span>FORM</span>
        </Link>

        <Link href="/pain-feed" style={link}>
          <span>Pain Feed</span>
          <span>FEED</span>
        </Link>

        <Link href="/activity" style={link}>
          <span>Activity</span>
          <span>→</span>
        </Link>

        <Link href="/alerts" style={link}>
          <span>Alerts</span>
          <span>→</span>
        </Link>

        <Link href="/routing-inbox" style={link}>
          <span>Routing</span>
          <span>→</span>
        </Link>

        <Link href="/introductions" style={link}>
          <span>Introductions</span>
          <span>→</span>
        </Link>

        <Link href="/messages" style={link}>
          <span>Messages</span>
          <span>→</span>
        </Link>

        <Link href="/members" style={link}>
          <span>Members</span>
          <span>→</span>
        </Link>

        <Link href="/projects" style={link}>
          <span>Projects</span>
          <span>→</span>
        </Link>

        <Link href="/profile" style={link}>
          <span>Profile</span>
          <span>→</span>
        </Link>

        {owner && (
          <Link href="/admin" style={adminLink}>
            <span>Admin</span>
            <span>OWNER</span>
          </Link>
        )}

        <Link href="/logout" style={dangerLink}>
          <span>Logout</span>
          <span>→</span>
        </Link>
      </nav>
    </section>
  );
}
