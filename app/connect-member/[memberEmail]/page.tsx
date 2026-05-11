"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

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

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 30%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 92px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { width: "min(980px,100%)", margin: "0 auto" };

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.28)",
  borderRadius: 28,
  padding: 24,
  background: "rgba(255,255,255,.06)",
  marginBottom: 16,
  boxShadow: "0 24px 80px rgba(0,0,0,.26)",
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

const muted: React.CSSProperties = { color: "#cbd5e1", lineHeight: 1.55 };

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.08)",
  color: "white",
  padding: 14,
  fontSize: 16,
  outline: "none",
};

const button: React.CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: 48,
  borderRadius: 999,
  padding: "12px 18px",
  border: 0,
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
  fontWeight: 950,
  textDecoration: "none",
  cursor: "pointer",
};

const ghost: React.CSSProperties = {
  ...button,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.16)",
  color: "white",
};

export default function ConnectMemberPage() {
  const params = useParams();
  const memberEmail = cleanEmail(decodeURIComponent(String(params?.memberEmail || "")));

  const [fromEmail, setFromEmail] = useState("");
  const [subject, setSubject] = useState("VaultForge member connection request");
  const [message, setMessage] = useState("I saw your VaultForge member profile and would like to connect.");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [threadUrl, setThreadUrl] = useState("");

  useEffect(() => {
    setFromEmail(getEmail());
  }, []);

  async function send() {
    setSaving(true);
    setStatus("Sending controlled connection request...");
    setThreadUrl("");

    try {
      if (!fromEmail) throw new Error("Your login email was not detected.");
      if (!memberEmail) throw new Error("Member recipient email missing.");
      if (!message.trim()) throw new Error("Message required.");

      const res = await fetch("/api/simple-messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": fromEmail,
        },
        body: JSON.stringify({
          from_email: fromEmail,
          to_email: memberEmail,
          subject,
          body: message,
          signal_id: `member_${memberEmail.replace(/[^a-zA-Z0-9]/g, "_")}`,
          item_id: memberEmail,
          context_title: "Member network connection",
        }),
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Connection request could not be saved.");
      }

      setStatus("Connection request saved.");
      setThreadUrl(data?.links?.thread || "/messages");
    } catch (error: any) {
      setStatus(error?.message || "Connection request could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        input::placeholder, textarea::placeholder {
          color: rgba(255,255,255,.42);
        }

        @media (max-width: 760px) {
          .vf-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .vf-actions > * {
            width: 100%;
            box-sizing: border-box;
            justify-content: center;
          }
        }
      `}</style>

      <div style={wrap}>
        <section style={card}>
          <p style={eyebrow}>VaultForge Member Connect</p>
          <h1 style={{ fontSize: "clamp(50px,10vw,92px)", lineHeight: 0.88, margin: "10px 0 18px", letterSpacing: "-.06em" }}>
            Request connection.
          </h1>
          <p style={{ ...muted, fontSize: 18 }}>
            This sends a controlled VaultForge member connection request. It does not expose private contact information outside the platform.
          </p>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
            <span style={ghost}>From: {fromEmail || "unknown"}</span>
            <span style={ghost}>To: {memberEmail || "missing"}</span>
            <span style={ghost}>Member Network</span>
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            <Link href="/members" style={ghost}>Back to Members</Link>
            <Link href="/messages" style={ghost}>All Messages</Link>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
          </div>
        </section>

        {status ? (
          <section style={card}>
            <strong>{status}</strong>
            {threadUrl ? (
              <div style={{ marginTop: 14 }}>
                <Link href={threadUrl} style={button}>Open Thread</Link>
              </div>
            ) : null}
          </section>
        ) : null}

        <section style={card}>
          <p style={eyebrow}>Connection Details</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <label>
              <strong>Your Email</strong>
              <input value={fromEmail} onChange={(event) => setFromEmail(event.target.value)} style={{ ...input, marginTop: 8 }} />
            </label>
            <label>
              <strong>Recipient Email</strong>
              <input value={memberEmail} readOnly style={{ ...input, marginTop: 8, opacity: 0.72 }} />
            </label>
          </div>

          <label style={{ display: "block", marginTop: 14 }}>
            <strong>Subject</strong>
            <input value={subject} onChange={(event) => setSubject(event.target.value)} style={{ ...input, marginTop: 8 }} />
          </label>

          <label style={{ display: "block", marginTop: 14 }}>
            <strong>What do you want to say?</strong>
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} style={{ ...input, minHeight: 170, marginTop: 8 }} />
          </label>

          <button type="button" disabled={saving || !fromEmail || !memberEmail} onClick={send} style={{ ...button, width: "100%", marginTop: 18, opacity: saving || !fromEmail || !memberEmail ? 0.55 : 1 }}>
            {saving ? "Saving..." : "Send Connection Request"}
          </button>
        </section>

        <section style={card}>
          <p style={eyebrow}>Safety Mode</p>
          <p style={muted}>This records a controlled member-network request and keeps private contact details protected until routed or accepted.</p>
        </section>
      </div>
    </main>
  );
}
