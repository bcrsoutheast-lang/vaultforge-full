"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(248,113,113,.16), transparent 28%), radial-gradient(circle at 88% 8%, rgba(232,196,107,.11), transparent 26%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 96px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  width: "min(1280px,100%)",
  margin: "0 auto",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(248,113,113,.32)",
  borderRadius: 30,
  padding: 24,
  background: "linear-gradient(145deg,rgba(248,113,113,.09),rgba(255,255,255,.03))",
  boxShadow: "0 28px 86px rgba(0,0,0,.34)",
  marginBottom: 20,
};

const label: React.CSSProperties = {
  color: "#fecaca",
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

const muted: React.CSSProperties = {
  color: "#cbd5e1",
  lineHeight: 1.55,
};

const button: React.CSSProperties = {
  minHeight: 50,
  borderRadius: 999,
  padding: "13px 18px",
  background: "linear-gradient(135deg,#fecaca,#e8c46b)",
  color: "#06100a",
  fontWeight: 950,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const ghost: React.CSSProperties = {
  ...button,
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(255,255,255,.060)",
  color: "white",
};

function AdminCard({
  href,
  title,
  body,
  tone,
}: {
  href: string;
  title: string;
  body: string;
  tone: string;
}) {
  return (
    <Link
      href={href}
      style={{
        border: `1px solid ${tone}66`,
        borderRadius: 26,
        padding: 22,
        textDecoration: "none",
        color: "white",
        background: "linear-gradient(145deg,rgba(255,255,255,.060),rgba(255,255,255,.025))",
        minHeight: 190,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ ...label, color: tone }}>OWNER CONTROL</div>
      <h2 style={{ fontSize: 30, lineHeight: 1.02, margin: "12px 0 10px" }}>{title}</h2>
      <p style={{ ...muted, margin: 0, flex: 1 }}>{body}</p>
      <div style={{ color: "#f8e7b0", fontWeight: 950, marginTop: 16 }}>Open →</div>
    </Link>
  );
}

export default function AdminCommandPage() {
  const [email, setEmail] = useState("");

  useEffect(() => {
    setEmail(getEmail());
  }, []);

  const isOwner = email === OWNER_EMAIL;

  if (email && !isOwner) {
    return (
      <main style={page}>
        <div style={wrap}>
          <section style={card}>
            <div style={label}>Owner Only</div>
            <h1 style={{ fontSize: "clamp(48px,8vw,88px)", lineHeight: 0.9, letterSpacing: "-.06em", margin: "12px 0" }}>
              Admin Command is separate.
            </h1>
            <p style={{ ...muted, fontSize: 20 }}>
              This page is owner-side only. Members should stay inside the member command system.
            </p>
            <Link href="/dashboard" style={button}>Return to Member Command</Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main style={page}>
      <style>{`
        a:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        @media(max-width:760px) {
          .vf-grid,
          .vf-actions {
            grid-template-columns: 1fr !important;
          }

          .vf-actions {
            display: grid !important;
            gap: 10px !important;
          }

          .vf-actions > * {
            width: 100%;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <section style={card}>
          <div style={label}>VaultForge Owner Command</div>

          <h1 style={{ fontSize: "clamp(56px,10vw,112px)", lineHeight: 0.88, letterSpacing: "-.07em", margin: "12px 0 18px" }}>
            Admin Command.
          </h1>

          <p style={{ ...muted, fontSize: 20, maxWidth: 980 }}>
            This is separate from the member operating system. Members get rooms, folders, messages, profile, and network.
            Owner/admin gets oversight, control, approvals, escalation, routing, cleanup, and security review.
          </p>

          <div className="vf-actions" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
            <Link href="/dashboard" style={ghost}>View Member Command</Link>
            <Link href="/admin" style={button}>Legacy Admin</Link>
            <Link href="/room-folders" style={ghost}>Room Folders</Link>
            <Link href="/opportunity-rooms" style={ghost}>Opportunity Rooms</Link>
            <Link href="/pressure-rooms" style={ghost}>Pressure Rooms</Link>
          </div>

          <p style={{ ...muted, fontSize: 13, marginTop: 16 }}>
            Signed in as owner: {email || "checking..."}
          </p>
        </section>

        <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 16 }}>
          <AdminCard href="/admin" title="Member / Approval Admin" body="Manage members, approvals, access, activation, and owner-side administrative actions." tone="#fecaca" />
          <AdminCard href="/room-folders" title="Room Control Map" body="Open the folder map for Opportunity and Pressure room stages." tone="#e8c46b" />
          <AdminCard href="/intelligence" title="Intelligence Review" body="Review intelligence layer, room signals, routing logic, and decision quality." tone="#56d8ff" />
          <AdminCard href="/opportunity-rooms/hot" title="Hot Opportunity Desk" body="Owner view of high-value opportunity rooms needing attention." tone="#9df3bf" />
          <AdminCard href="/pressure-rooms/urgent" title="Critical Pressure Desk" body="Owner view of urgent pressure rooms, funding gaps, and rescue situations." tone="#fecaca" />
          <AdminCard href="/messages" title="Execution Communications" body="Open communications and room threads from the owner command view." tone="#cbd5e1" />
        </section>
      </div>
    </main>
  );
}
