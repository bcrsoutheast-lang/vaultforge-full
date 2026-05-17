"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ShellProps = {
  children?: React.ReactNode;
  active?: string;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  email?: string;
};

const navItems = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", tag: "RADAR" },
  { key: "deals", label: "Deal Rooms", href: "/deal-rooms", tag: "DEALS" },
  { key: "pain", label: "Pain", href: "/pain", tag: "INTAKE" },
  { key: "pain-rooms", label: "Pain Rooms", href: "/pain-rooms", tag: "EXEC" },
  { key: "messages", label: "Messages", href: "/message-command", tag: "MSG" },
  { key: "profile", label: "Profile", href: "/profile", tag: "ID" },
];

function readCookie(name: string) {
  if (typeof document === "undefined") return "";
  const found = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));

  return found ? decodeURIComponent(found.slice(name.length + 1)) : "";
}

function cleanEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

export default function VaultForgeCommandShell({
  children,
  active = "dashboard",
  title = "VaultForge Command Center",
  subtitle = "Deal Rooms and Pain Rooms are the operating lanes. Pain is the intake. Alerts, routing, intelligence, scoring, and matching attach inside rooms.",
  eyebrow = "VAULTFORGE 5S COMMAND CENTER",
  email = "",
}: ShellProps) {
  const [clientEmail, setClientEmail] = useState(email);

  useEffect(() => {
    const cookieEmail =
      readCookie("vf_email") ||
      readCookie("vf_member_email") ||
      readCookie("email") ||
      "";

    const localEmail =
      window.localStorage.getItem("vf_email") ||
      window.localStorage.getItem("vf_member_email") ||
      window.localStorage.getItem("email") ||
      "";

    setClientEmail(cleanEmail(email || cookieEmail || localEmail || "member@vaultforge.local"));
  }, [email]);

  const displayEmail = useMemo(
    () => cleanEmail(clientEmail || email || "member@vaultforge.local"),
    [clientEmail, email]
  );

  return (
    <main className="vf-shell">
      <style>{`
        .vf-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(245,197,91,.13), transparent 28%),
            radial-gradient(circle at top right, rgba(239,68,68,.12), transparent 26%),
            linear-gradient(180deg,#02040a,#071018 52%,#02040a);
          color: #f8fafc;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .vf-layout {
          display: grid;
          grid-template-columns: 260px minmax(0, 1fr);
          min-height: 100vh;
        }

        .vf-rail {
          border-right: 1px solid rgba(245,197,91,.18);
          background: linear-gradient(180deg,rgba(2,6,23,.98),rgba(5,10,18,.96));
          padding: 20px 14px;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow: auto;
        }

        .vf-logo-box {
          border: 1px solid rgba(245,197,91,.26);
          background: rgba(245,197,91,.06);
          border-radius: 18px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .vf-logo {
          font-size: 25px;
          font-weight: 950;
          letter-spacing: -.04em;
          color: #f5c55b;
          margin: 0;
        }

        .vf-micro {
          color: #94a3b8;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: .12em;
          font-weight: 900;
          margin-top: 5px;
        }

        .vf-user-box {
          border: 1px solid rgba(148,163,184,.18);
          background: rgba(15,23,42,.72);
          border-radius: 16px;
          padding: 14px;
          margin-bottom: 14px;
          overflow-wrap: anywhere;
        }

        .vf-user-email {
          font-weight: 950;
          margin-bottom: 4px;
          font-size: 13px;
          line-height: 1.3;
        }

        .vf-nav-link {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          color: #e5e7eb;
          text-decoration: none;
          padding: 12px;
          border-radius: 13px;
          margin-bottom: 7px;
          border: 1px solid transparent;
          font-size: 13px;
          font-weight: 900;
        }

        .vf-nav-link.selected {
          border-color: rgba(245,197,91,.38);
          background: linear-gradient(90deg,rgba(245,197,91,.18),rgba(245,197,91,.06));
          color: #fef3c7;
        }

        .vf-main {
          min-width: 0;
          padding: 16px 18px 80px;
        }

        .vf-mobile-nav {
          display: none;
        }

        .vf-ticker {
          border: 1px solid rgba(148,163,184,.16);
          background: rgba(2,6,23,.88);
          border-radius: 18px;
          padding: 11px 14px;
          margin-bottom: 14px;
          overflow: hidden;
          white-space: nowrap;
          color: #e5e7eb;
          font-size: 12px;
          font-weight: 800;
        }

        .vf-ticker-inner {
          display: inline-block;
          min-width: 100%;
          animation: vfTicker 24s linear infinite;
        }

        @keyframes vfTicker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-42%); }
        }

        .vf-danger {
          border: 1px solid rgba(239,68,68,.34);
          background: linear-gradient(90deg,rgba(127,29,29,.62),rgba(20,8,8,.94));
          color: #fee2e2;
          border-radius: 18px;
          padding: 14px 16px;
          margin-bottom: 14px;
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .vf-danger a {
          color: #fef3c7;
          text-decoration: none;
          font-weight: 950;
          border: 1px solid rgba(245,197,91,.3);
          border-radius: 12px;
          padding: 8px 10px;
        }

        .vf-hero {
          border: 1px solid rgba(245,197,91,.22);
          background: linear-gradient(145deg,rgba(16,24,36,.9),rgba(2,6,23,.96));
          border-radius: 24px;
          padding: 22px;
          margin-bottom: 16px;
        }

        .vf-eyebrow {
          color: #f5c55b;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: .16em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .vf-title {
          margin: 0;
          font-size: clamp(36px,6vw,68px);
          line-height: .95;
          letter-spacing: -.07em;
          font-weight: 950;
        }

        .vf-subtitle {
          color: #cbd5e1;
          font-size: 18px;
          line-height: 1.45;
          max-width: 900px;
          margin: 12px 0 0;
        }

        @media (max-width: 860px) {
          .vf-layout { display: block; }
          .vf-rail { display: none; }
          .vf-main { padding: 12px 10px 90px; }

          .vf-mobile-nav {
            display: block;
            position: sticky;
            top: 0;
            z-index: 50;
            margin: -12px -10px 12px;
            padding: 10px;
            border-bottom: 1px solid rgba(245,197,91,.22);
            background: rgba(2,6,23,.96);
            backdrop-filter: blur(14px);
          }

          .vf-mobile-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            margin-bottom: 9px;
          }

          .vf-mobile-logo {
            color: #f5c55b;
            font-weight: 950;
            letter-spacing: -.03em;
            font-size: 18px;
          }

          .vf-mobile-email {
            color: #94a3b8;
            font-size: 11px;
            font-weight: 800;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 170px;
          }

          .vf-mobile-scroll {
            display: flex;
            gap: 8px;
            overflow-x: auto;
            padding-bottom: 3px;
            -webkit-overflow-scrolling: touch;
          }

          .vf-mobile-scroll a {
            flex: 0 0 auto;
            color: #e5e7eb;
            text-decoration: none;
            border: 1px solid rgba(148,163,184,.2);
            background: rgba(15,23,42,.74);
            padding: 9px 11px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 900;
          }

          .vf-mobile-scroll a.selected {
            border-color: rgba(245,197,91,.45);
            color: #fef3c7;
            background: rgba(245,197,91,.12);
          }

          .vf-title {
            font-size: clamp(36px,14vw,58px);
            line-height: .92;
          }

          .vf-subtitle { font-size: 16px; }

          .vf-danger a {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>

      <div className="vf-layout">
        <aside className="vf-rail">
          <div className="vf-logo-box">
            <h1 className="vf-logo">VAULTFORGE</h1>
            <div className="vf-micro">5S AI Command Center</div>
          </div>

          <div className="vf-user-box">
            <div className="vf-user-email">{displayEmail}</div>
            <div style={{ color: "#22c55e", fontSize: 12, fontWeight: 950 }}>
              AI ROUTING ACTIVE
            </div>
          </div>

          <nav>
            {navItems.map((item) => {
              const selected = active === item.key || active === item.href.replace("/", "");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`vf-nav-link${selected ? " selected" : ""}`}
                >
                  <span>{item.label}</span>
                  <span
                    style={{
                      color: selected ? "#f5c55b" : "#94a3b8",
                      fontSize: 10,
                      letterSpacing: ".11em",
                    }}
                  >
                    {item.tag}
                  </span>
                </Link>
              );
            })}

            <Link href="/logout" className="vf-nav-link" style={{ color: "#fecaca" }}>
              <span>Logout</span>
              <span style={{ color: "#fca5a5", fontSize: 10 }}>EXIT</span>
            </Link>
          </nav>
        </aside>

        <section className="vf-main">
          <div className="vf-mobile-nav">
            <div className="vf-mobile-top">
              <div className="vf-mobile-logo">VAULTFORGE</div>
              <div className="vf-mobile-email">{displayEmail}</div>
            </div>

            <div className="vf-mobile-scroll">
              {navItems.map((item) => {
                const selected = active === item.key || active === item.href.replace("/", "");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={selected ? "selected" : ""}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <Link href="/logout">Logout</Link>
            </div>
          </div>

          <div className="vf-ticker">
            <span className="vf-ticker-inner">
              VAULTFORGE 5S · DEAL ROOMS + PAIN ROOMS ONLY · PAIN IS INTAKE · ALERTS ROUTE INSIDE ROOMS · MULTI-PROFILE MATCHING · CAPITAL FIT · OPERATOR FIT · BUYER FIT · CLEAN ACTIVE FLOW · ARCHIVE COMPLETED · HIDE CLUTTER · DEAL ROOMS + PAIN ROOMS ONLY
            </span>
          </div>

          <div className="vf-danger">
            <strong>🔥 EXECUTION PRESSURE ACTIVE</strong>
            <span>Rooms may match multiple qualified buyers, lenders, operators, and execution profiles.</span>
            <Link href="/pain-rooms">View Pain Rooms</Link>
          </div>

          <section className="vf-hero">
            <div className="vf-eyebrow">{eyebrow}</div>
            <h1 className="vf-title">{title}</h1>
            <p className="vf-subtitle">{subtitle}</p>
          </section>

          {children}
        </section>
      </div>
    </main>
  );
}