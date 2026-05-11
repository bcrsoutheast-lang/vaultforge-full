"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Props = {
  title?: string;
  subtitle?: string;
  active?: string;
};

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
  if (pathname === "/" || pathname.includes("dashboard")) return "Dashboard";
  if (pathname.includes("pain-feed")) return "Pain Feed";
  if (pathname.includes("pain-room")) return "Pain Room";
  if (pathname.includes("pain")) return "Pain Button";
  if (pathname.includes("signals")) return "Signals";
  if (pathname.includes("routing-room")) return "Routing Room";
  if (pathname.includes("routing")) return "Routing";
  if (pathname.includes("introduction")) return "Introductions";
  if (pathname.includes("messages")) return "Messages";
  if (pathname.includes("activity")) return "Activity";
  if (pathname.includes("alerts")) return "Alerts";
  if (pathname.includes("projects")) return "Projects";
  if (pathname.includes("members")) return "Members";
  if (pathname.includes("network")) return "Network";
  if (pathname.includes("profile")) return "Profile";
  if (pathname.includes("intelligence")) return "Intelligence";
  if (pathname.includes("admin")) return "Admin";
  return "Command Center";
}

function isActive(pathname: string, href: string, key: string, active = "") {
  const current = active.toLowerCase();
  if (current && (current === key.toLowerCase() || current === href.toLowerCase())) return true;
  if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
  return pathname.startsWith(href);
}

const links = [
  { label: "Dashboard", href: "/dashboard", key: "dashboard", tag: "HOME" },
  { label: "Pain Button", href: "/pain", key: "pain", tag: "FORM" },
  { label: "Pain Feed", href: "/pain-feed", key: "pain-feed", tag: "FEED" },
  { label: "Activity", href: "/activity", key: "activity", tag: "LIVE" },
  { label: "Alerts", href: "/alerts", key: "alerts", tag: "SIGNAL" },
  { label: "Routing", href: "/routing-inbox", key: "routing", tag: "FLOW" },
  { label: "Introductions", href: "/introductions", key: "introductions", tag: "INTRO" },
  { label: "Messages", href: "/messages", key: "messages", tag: "MSG" },
  { label: "Members", href: "/members", key: "members", tag: "NET" },
  { label: "Projects", href: "/projects", key: "projects", tag: "DEAL" },
  { label: "Profile", href: "/profile", key: "profile", tag: "ID" },
  { label: "Logout", href: "/logout", key: "logout", tag: "EXIT", danger: true },
];

const shell: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.28)",
  borderRadius: 30,
  padding: 18,
  background:
    "linear-gradient(145deg,rgba(255,255,255,.085),rgba(255,255,255,.030)), radial-gradient(circle at top left,rgba(232,196,107,.14),transparent 34%), radial-gradient(circle at bottom right,rgba(181,92,255,.10),transparent 34%)",
  boxShadow: "0 24px 90px rgba(0,0,0,.34)",
  color: "white",
  marginBottom: 18,
};

const top: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(150px,.75fr) minmax(220px,1.4fr) minmax(150px,.75fr)",
  alignItems: "center",
  gap: 14,
  marginBottom: 16,
};

const logoWrap: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  textDecoration: "none",
  color: "white",
  minWidth: 0,
};

const mark: React.CSSProperties = {
  width: 58,
  height: 58,
  borderRadius: 18,
  border: "1px solid rgba(232,196,107,.42)",
  background:
    "linear-gradient(135deg,#e8c46b 0%,#e8c46b 42%,#f8fafc 43%,#cbd5e1 58%,#111827 59%,#05070a 100%)",
  boxShadow: "0 14px 42px rgba(232,196,107,.20), inset 0 1px 0 rgba(255,255,255,.34)",
  flex: "0 0 auto",
};

const center: React.CSSProperties = {
  textAlign: "center",
  border: "1px solid rgba(232,196,107,.22)",
  borderRadius: 22,
  padding: "12px 14px",
  background: "rgba(0,0,0,.22)",
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
  padding: "7px 11px",
  fontSize: 12,
  fontWeight: 900,
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4,minmax(0,1fr))",
  gap: 10,
};

export default function VaultForgeMemberNav({ title, subtitle, active = "" }: Props) {
  const [email, setEmail] = useState("");
  const [pathname, setPathname] = useState("/");

  useEffect(() => {
    setEmail(getEmail());

    if (typeof window !== "undefined") {
      setPathname(window.location.pathname || "/");
    }
  }, []);

  const workspace = useMemo(() => title || workspaceFromPath(pathname), [title, pathname]);

  return (
    <header style={shell}>
      <style>{`
        .vf-command-link:hover,
        .vf-logo-link:hover {
          transform: translateY(-1px);
          filter: brightness(1.08);
          transition: all .18s ease;
        }

        @media (max-width: 920px) {
          .vf-command-top {
            grid-template-columns: 1fr !important;
            text-align: center !important;
          }

          .vf-logo-link {
            justify-content: center !important;
          }

          .vf-command-right {
            justify-content: center !important;
          }

          .vf-command-grid {
            grid-template-columns: repeat(2,minmax(0,1fr)) !important;
          }
        }

        @media (max-width: 520px) {
          .vf-command-grid {
            grid-template-columns: 1fr !important;
          }

          .vf-command-link {
            min-height: 58px !important;
          }
        }
      `}</style>

      <section className="vf-command-top" style={top}>
        <Link href="/dashboard" className="vf-logo-link" style={logoWrap}>
          <div style={mark} aria-hidden="true" />
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "#f8e7b0", fontWeight: 950, letterSpacing: ".16em", fontSize: 14 }}>
              VAULTFORGE
            </div>
            <div style={{ color: "#cbd5e1", fontSize: 13, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Private Deal Flow OS
            </div>
          </div>
        </Link>

        <div style={center}>
          <div style={{ color: "#e8c46b", fontWeight: 950, letterSpacing: ".18em", fontSize: 12, textTransform: "uppercase" }}>
            VaultForge Command Center
          </div>
          <div style={{ fontSize: "clamp(24px,5vw,42px)", lineHeight: 1, fontWeight: 950, marginTop: 5, letterSpacing: "-.045em" }}>
            {workspace}
          </div>
          {subtitle ? (
            <div style={{ color: "#cbd5e1", lineHeight: 1.35, marginTop: 8, fontSize: 14 }}>{subtitle}</div>
          ) : (
            <div style={{ color: "#94a3b8", lineHeight: 1.35, marginTop: 8, fontSize: 14 }}>
              Intelligence · Routing · Messaging · Execution
            </div>
          )}
        </div>

        <div className="vf-command-right" style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap", minWidth: 0 }}>
          <span style={pill}>{email || "Signed in"}</span>
          <Link href="/dashboard" style={{ ...pill, color: "#f8e7b0", borderColor: "rgba(232,196,107,.28)", background: "rgba(232,196,107,.08)", textDecoration: "none" }}>
            Dashboard
          </Link>
        </div>
      </section>

      <nav className="vf-command-grid" style={grid}>
        {links.map((link) => {
          const selected = isActive(pathname, link.href, link.key, active);

          return (
            <Link
              key={link.href}
              href={link.href}
              className="vf-command-link"
              style={{
                minHeight: 62,
                borderRadius: 18,
                border: selected
                  ? "1px solid rgba(232,196,107,.68)"
                  : link.danger
                  ? "1px solid rgba(255,120,120,.30)"
                  : "1px solid rgba(255,255,255,.14)",
                background: selected
                  ? "linear-gradient(135deg,#f8e7b0,#9df3bf,#b55cff)"
                  : "rgba(255,255,255,.055)",
                color: selected ? "#06100a" : link.danger ? "#ffd0d0" : "white",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                padding: "12px 16px",
                fontWeight: 950,
                boxShadow: selected ? "0 14px 36px rgba(232,196,107,.18)" : "none",
              }}
            >
              <span>{link.label}</span>
              <span style={{ fontSize: 12, opacity: selected ? 0.88 : 0.70, letterSpacing: ".08em" }}>{link.tag}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
