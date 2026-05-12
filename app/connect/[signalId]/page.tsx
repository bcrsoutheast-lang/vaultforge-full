"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../../components/VaultForgeMemberNav";

type SaveResult = Record<string, any>;

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

  const params = new URLSearchParams(window.location.search);
  const queryEmail = cleanEmail(params.get("email"));
  if (queryEmail.includes("@")) return queryEmail;

  const keys = ["vf_email", "vf_member_email", "vf_admin_email", "email", "memberEmail"];

  for (const key of keys) {
    const localValue = cleanEmail(window.localStorage.getItem(key));
    if (localValue.includes("@")) return localValue;

    const sessionValue = cleanEmail(window.sessionStorage.getItem(key));
    if (sessionValue.includes("@")) return sessionValue;
  }

  return cleanEmail(readCookie("vf_email") || readCookie("vf_member_email") || readCookie("vf_admin_email"));
}

function param(name: string) {
  if (typeof window === "undefined") return "";
  return clean(new URLSearchParams(window.location.search).get(name));
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
    "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 28%), radial-gradient(circle at 88% 10%, rgba(74,222,128,.10), transparent 26%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 96px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  width: "min(980px,100%)",
  margin: "0 auto",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.24)",
  borderRadius: 30,
  padding: 24,
  background: "linear-gradient(145deg,rgba(255,255,255,.070),rgba(255,255,255,.030))",
  boxShadow: "0 28px 86px rgba(0,0,0,.30)",
  marginBottom: 18,
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.16)",
  background: "rgba(255,255,255,.08)",
  color: "white",
  padding: 14,
  fontSize: 16,
  outline: "none",
};

const label: React.CSSProperties = {
  display: "block",
  color: "white",
  fontWeight: 900,
  marginBottom: 8,
};

const eyebrow: React.CSSProperties = {
  color: "#9df3bf",
  letterSpacing: ".22em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

const goldEyebrow: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".22em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

const button: React.CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: 52,
  borderRadius: 999,
  padding: "13px 18px",
  border: 0,
  background: "linear-gradient(135deg,#f8e7b0,#9df3bf,#b55cff)",
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

const chip: React.CSSProperties = {
  display: "inline-flex",
  border: "1px solid rgba(157,243,191,.25)",
  background: "rgba(157,243,191,.08)",
  color: "#9df3bf",
  borderRadius: 999,
  padding: "8px 11px",
  fontWeight: 850,
  margin: "0 7px 7px 0",
  fontSize: 12,
};

export default function ConnectPage({ params }: { params: { signalId: string } }) {
  const decodedSignalId = decodeURIComponent(params.signalId || "");
  const [email, setEmail] = useState("");
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("VaultForge connection request");
  const [message, setMessage] = useState("I saw this VaultForge opportunity/member profile and would like to connect.");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<SaveResult | null>(null);

  useEffect(() => {
    const viewer = getEmail();
    const to =
      cleanEmail(param("to")) ||
      cleanEmail(param("recipient")) ||
      cleanEmail(param("recipient_email")) ||
      cleanEmail(param("owner_email")) ||
      cleanEmail(param("target_email"));

    const querySubject = clean(param("subject"));
    const queryMessage = clean(param("message") || param("body") || param("note"));

    setEmail(viewer);
    setRecipient(to);

    if (querySubject) setSubject(querySubject);
    if (queryMessage) setMessage(queryMessage);
  }, []);

  const itemId = useMemo(() => clean(param("item_id") || param("itemId") || param("pain_id") || param("project_id")), []);
  const source = useMemo(() => clean(param("source") || param("type") || "connect"), []);

  async function submit() {
    setSaving(true);
    setStatus("Saving controlled connection request...");
    setResult(null);

    const fallbackRecipient = recipient || email;

    try {
      const payload = {
        from_email: email,
        sender_email: email,
        email,
        member_email: email,
        to_email: fallbackRecipient,
        recipient_email: fallbackRecipient,
        target_email: fallbackRecipient,
        owner_email: fallbackRecipient,
        signal_id: decodedSignalId,
        item_id: itemId,
        source,
        subject,
        title: subject,
        message,
        body: message,
        note: message,
        status: "open",
        metadata: {
          signal_id: decodedSignalId,
          item_id: itemId,
          source,
          from_email: email,
          to_email: fallbackRecipient,
          subject,
        },
      };

      const endpoints = ["/api/messages/new", "/api/messages"];

      let last: SaveResult = {};

      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-vf-email": email,
            },
            body: JSON.stringify(payload),
          });

          const data = await safeJson(res);
          last = data;

          if (res.ok && data.ok !== false) {
            setResult(data);
            setStatus("Connection request saved.");
            return;
          }
        } catch (error: any) {
          last = { ok: false, error: error?.message || "Request failed." };
        }
      }

      setResult(last);
      setStatus("Connection request could not be saved.");
    } catch (error: any) {
      setResult({ ok: false, error: error?.message || "Connection request could not be saved." });
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
            justify-content: center;
          }
        }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav
          title="Messages"
          subtitle="Controlled owner/member communication."
          active="messages"
        />

        <section style={card}>
          <p style={eyebrow}>VaultForge Message Thread</p>
          <h1 style={{ fontSize: "clamp(54px,11vw,102px)", lineHeight: 0.88, margin: "10px 0 18px", letterSpacing: "-.07em" }}>
            Request connection.
          </h1>
          <p style={{ color: "#cbd5e1", fontSize: 20, lineHeight: 1.5 }}>
            This records a controlled VaultForge connection request. It does not expose private contact details outside the platform.
          </p>

          <div style={{ marginTop: 18 }}>
            <span style={chip}>From: {email || "missing"}</span>
            <span style={chip}>To: {recipient || "owner/member fallback"}</span>
            {decodedSignalId ? <span style={chip}>Signal: {decodedSignalId}</span> : null}
            {itemId ? <span style={chip}>Item: {itemId}</span> : null}
            <span style={chip}>Draft</span>
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 22 }}>
            <Link href="/members" style={ghost}>Back to Members</Link>
            <Link href="/alerts" style={ghost}>Alerts</Link>
            <Link href="/messages" style={ghost}>All Messages</Link>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
          </div>
        </section>

        {status ? (
          <section style={card}>
            <h2 style={{ margin: 0, color: status.includes("saved") ? "#9df3bf" : "#ffd0d0" }}>{status}</h2>
          </section>
        ) : null}

        <section style={card}>
          <p style={goldEyebrow}>Connection Details</p>

          <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={label}>Your Email</label>
              <input style={input} value={email} onChange={(e) => setEmail(cleanEmail(e.target.value))} placeholder="your@email.com" />
            </div>

            <div>
              <label style={label}>Recipient Email</label>
              <input style={input} value={recipient} onChange={(e) => setRecipient(cleanEmail(e.target.value))} placeholder="owner/member email, optional fallback" />
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <label style={label}>Subject</label>
            <input style={input} value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>

          <div style={{ marginTop: 18 }}>
            <label style={label}>What information do you need?</label>
            <textarea
              style={{ ...input, minHeight: 170, resize: "vertical" }}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <button type="button" onClick={submit} disabled={saving} style={{ ...button, width: "100%", marginTop: 22, opacity: saving ? 0.65 : 1 }}>
            {saving ? "Saving..." : "Send Connection Request"}
          </button>
        </section>

        <section style={card}>
          <p style={goldEyebrow}>Current Safety Mode</p>
          <p style={{ color: "#cbd5e1", fontSize: 18, lineHeight: 1.5 }}>
            This page records a controlled message request. It does not automatically release private contact information.
          </p>
        </section>

        {result ? (
          <section style={card}>
            <p style={goldEyebrow}>System Output</p>
            <pre style={{ whiteSpace: "pre-wrap", color: "#cbd5e1", fontSize: 13, overflowX: "auto" }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </section>
        ) : null}
      </div>
    </main>
  );
}
