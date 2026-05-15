"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Props = {
  title?: string;
  subtitle?: string;
  active?: string;
};

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
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

  const keys = ["vf_email", "vf_member_email", "vf_admin_email", "email", "memberEmail"];
  for (const key of keys) {
    const localValue = cleanEmail(window.localStorage.getItem(key));
    if (localValue.includes("@")) return localValue;

    const sessionValue = cleanEmail(window.sessionStorage.getItem(key));
    if (sessionValue.includes("@")) return sessionValue;
  }

  return cleanEmail(readCookie("vf_email") || readCookie("vf_member_email") || readCookie("vf_admin_email"));
}

function workspaceFromPath(pathname: string) {
  if (pathname === "/" || pathname.includes("dashboard")) return "Command Center";
  if (pathname.includes("opportunity-rooms")) return "Opportunity Rooms";
  if (pathname.includes("pressure-rooms")) return "Pressure Rooms";
  if (pathname.includes("saved-rooms")) return "Saved Rooms";
  if (pathname.includes("archived-rooms")) return "Archived Rooms";
  if (pathname.includes("deleted-rooms")) return "Deleted Rooms";
  if (pathname.includes("opportunity-room")) return "Opportunity Room";
  if (pathname.includes("pressure-room")) return "Pressure Room";
  if (pathname.includes("workstations") || pathname.includes("projects")) return "Workstations";
  if (pathname.includes("submit")) return "Submit Opportunity";
  if (pathname.includes("pain")) return "Submit Pressure";
  if (pathname.includes("intelligence") || pathname.includes("smart-ai")) return "Intelligence";
  if (pathname.includes("messages")) return "Messages";
  if (pathname.includes("profile-dashboard") || pathname === "/profile") return "Profile Dashboard";
  if (pathname.includes("members") || pathname.includes("network")) return "Network";
  return "Command Center";
}

function isActive(pathname: string, href: string, key: string, active = "") {
  const current = active.toLowerCase();
  const cleanHref = href.split("?")[0];

  if (current && (current === key.toLowerCase() || current === cleanHref.toLowerCase())) return true;
  if (cleanHref === "/dashboard") return pathname === "/dashboard" || pathname === "/";
  if (cleanHref === "/opportunity-rooms") return pathname.startsWith("/opportunity-rooms") || pathname.startsWith("/opportunity-room");
  if (cleanHref === "/pressure-rooms") return pathname.startsWith("/pressure-rooms") || pathname.startsWith("/pressure-room");
  if (cleanHref === "/workstations") return pathname.startsWith("/workstations") || pathname.startsWith("/projects");
  if (cleanHref === "/intelligence") return pathname.startsWith("/intelligence") || pathname.startsWith("/smart-ai");
  if (cleanHref === "/profile-dashboard") return pathname.startsWith("/profile-dashboard") || pathname === "/profile";
  if (cleanHref === "/members") return pathname.startsWith("/members") || pathname.startsWith("/network");
  return pathname.startsWith(cleanHref);
}

const memberLinks = [
  { label: "Command", href: "/dashboard", key: "dashboard", tag: "HOME" },
  { label: "Opportunity Rooms", href: "/opportunity-rooms", key: "opportunity", tag: "UPSIDE" },
  { label: "Pressure Rooms", href: "/pressure-rooms", key: "pressure", tag: "FIX" },
  { label: "Workstations", href: "/workstations", key: "workstations", tag: "5S" },
  { label: "Intelligence", href: "/intelligence", key: "intelligence", tag: "AI" },
  { label: "Messages", href: "/messages", key: "messages", tag: "COMMS" },
  { label: "Profile", href: "/profile-dashboard", key: "profile", tag: "ME" },
  { label: "Network", href: "/members", key: "members", tag: "OPS" },
];

const shell: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.30)",
  borderRadius: 34,
  padding: 18,
  background:
    "linear-gradient(145deg,rgba(255,255,255,.092),rgba(255,255,255,.030)), radial-gradient(circle at top left,rgba(232,196,107,.16),transparent 34%), radial-gradient(circle at bottom right,rgba(157,243,191,.09),transparent 32%)",
  boxShadow: "0 28px 96px rgba(0,0,0,.36)",
  color: "white",
  marginBottom: 20,
  backdropFilter: "blur(14px)",
};

const top: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(220px,.9fr) minmax(260px,1.25fr) minmax(180px,.75fr)",
  alignItems: "center",
  gap: 14,
  marginBottom: 16,
};

const logoWrap: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  textDecoration: "none",
  color: "white",
  minWidth: 0,
};

const logoBox: React.CSSProperties = {
  width: 120,
  height: 76,
  borderRadius: 18,
  border: "1px solid rgba(232,196,107,.32)",
  background: "rgba(0,0,0,.38)",
  boxShadow: "0 18px 54px rgba(0,0,0,.38)",
  overflow: "hidden",
  flex: "0 0 auto",
  display: "grid",
  placeItems: "center",
};

const center: React.CSSProperties = {
  textAlign: "center",
  border: "1px solid rgba(232,196,107,.24)",
  borderRadius: 24,
  padding: "13px 14px",
  background: "linear-gradient(135deg,rgba(0,0,0,.30),rgba(255,255,255,.035))",
  minWidth: 0,
};

const pill: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid rgba(157,243,191,.25)",
  borderRadius: 999,
  color: "#9df3bf",
  background: "rgba(157,243,191,.075)",
  padding: "8px 11px",
  fontSize: 12,
  fontWeight: 900,
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  textDecoration: "none",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(8,minmax(0,1fr))",
  gap: 9,
};

export default function VaultForgeMemberNav({ title, subtitle, active = "" }: Props) {
  const [email, setEmail] = useState("");
  const [pathname, setPathname] = useState("/");

  useEffect(() => {
    setEmail(getEmail());
    if (typeof window !== "undefined") setPathname(window.location.pathname || "/");
  }, []);

  const workspace = useMemo(() => title || workspaceFromPath(pathname), [title, pathname]);
  const isOwner = email === OWNER_EMAIL;

  return (
    <header style={shell}>
      <style>{`
        .vf-command-link:hover,
        .vf-logo-link:hover,
        .vf-command-pill:hover {
          transform: translateY(-1px);
          filter: brightness(1.08);
          transition: all .18s ease;
        }

        .vf-command-link { transition: all .18s ease; }

        @media (max-width: 1120px) {
          .vf-command-grid { grid-template-columns: repeat(4,minmax(0,1fr)) !important; }
        }

        @media (max-width: 920px) {
          .vf-command-top { grid-template-columns: 1fr !important; text-align: center !important; }
          .vf-logo-link { justify-content: center !important; }
          .vf-command-right { justify-content: center !important; }
          .vf-command-grid { grid-template-columns: repeat(2,minmax(0,1fr)) !important; }
        }

        @media (max-width: 520px) {
          .vf-command-grid { grid-template-columns: 1fr !important; }
          .vf-command-link { min-height: 58px !important; }
          .vf-logo-mark { width: 104px !important; height: 66px !important; }
        }
      `}</style>

      <section className="vf-command-top" style={top}>
        <Link href="/dashboard" className="vf-logo-link" style={logoWrap}>
          <div className="vf-logo-mark" style={logoBox}>
            <img
              src="/vaultforge-logo.png"
              alt="VaultForge"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ color: "#f8e7b0", fontWeight: 950, letterSpacing: ".16em", fontSize: 14 }}>
              VAULTFORGE
            </div>
            <div style={{ color: "#cbd5e1", fontSize: 13, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Member Operating System
            </div>
          </div>
        </Link>

        <div style={center}>
          <div style={{ color: "#e8c46b", fontWeight: 950, letterSpacing: ".18em", fontSize: 12, textTransform: "uppercase" }}>
            Member Command
          </div>

          <div style={{ fontSize: "clamp(25px,5vw,44px)", lineHeight: 1, fontWeight: 950, marginTop: 6, letterSpacing: "-.045em" }}>
            {workspace}
          </div>

          <div style={{ color: "#94a3b8", lineHeight: 1.35, marginTop: 8, fontSize: 14 }}>
            {subtitle || "Member rooms, folders, profile, messages, and network flow."}
          </div>
        </div>

        <div className="vf-command-right" style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap", minWidth: 0 }}>
          <span style={pill}>{email || "Signed in"}</span>

          {isOwner ? (
            <Link
              href="/admin-command"
              className="vf-command-pill"
              style={{ ...pill, color: "#fecaca", borderColor: "rgba(248,113,113,.34)", background: "rgba(248,113,113,.08)" }}
            >
              Admin Command
            </Link>
          ) : null}

          <Link href="/logout" className="vf-command-pill" style={{ ...pill, color: "#ffd0d0", borderColor: "rgba(255,120,120,.28)", background: "rgba(255,120,120,.065)" }}>Logout</Link>
        </div>
      </section>

      <nav className="vf-command-grid" style={grid}>
        {memberLinks.map((item) => {
          const activeLink = isActive(pathname, item.href, item.key, active);

          return (
            <Link
              key={item.href}
              href={item.href}
              className="vf-command-link"
              style={{
                minHeight: 72,
                borderRadius: 20,
                padding: 12,
                textDecoration: "none",
                color: activeLink ? "#06100a" : "white",
                border: activeLink ? "1px solid rgba(232,196,107,.95)" : "1px solid rgba(255,255,255,.13)",
                background: activeLink
                  ? "linear-gradient(135deg,#f8e7b0,#e8c46b)"
                  : "linear-gradient(145deg,rgba(255,255,255,.060),rgba(255,255,255,.020))",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 7,
                boxShadow: activeLink ? "0 14px 34px rgba(232,196,107,.16)" : "none",
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 950, letterSpacing: ".16em", opacity: activeLink ? 0.84 : 0.62 }}>
                {item.tag}
              </span>
              <span style={{ fontWeight: 950, lineHeight: 1.05 }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
