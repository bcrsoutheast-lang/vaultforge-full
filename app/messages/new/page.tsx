
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../../components/VaultForgeMemberNav";

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.18), transparent 28%), radial-gradient(circle at top right, rgba(181,92,255,.20), transparent 24%), radial-gradient(circle at bottom right, rgba(157,243,191,.14), transparent 28%), linear-gradient(180deg,#02040a 0%,#071326 50%,#030509 100%)",
  color: "white",
  padding: "28px 18px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 980, margin: "0 auto" };

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.28)",
  background:
    "linear-gradient(145deg, rgba(232,196,107,.12), rgba(181,92,255,.10), rgba(255,255,255,.035))",
  borderRadius: 34,
  padding: 26,
  marginBottom: 22,
  boxShadow: "0 26px 80px rgba(0,0,0,.34)",
};

const btn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg,#f5d978,#9df3bf 55%,#b55cff)",
  color: "#06100a",
  textDecoration: "none",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 950,
  border: "none",
  margin: "7px 7px 0 0",
  minHeight: 46,
  cursor: "pointer",
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
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.06)",
  margin: "7px 7px 0 0",
  minHeight: 46,
  cursor: "pointer",
};

const danger: React.CSSProperties = {
  ...ghost,
  border: "1px solid rgba(255,120,120,.38)",
  color: "#ffd0d0",
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.075)",
  color: "white",
  padding: 15,
  fontSize: 16,
};

const label: React.CSSProperties = {
  display: "block",
  fontWeight: 950,
  margin: "0 0 8px",
};

const eyebrow: React.CSSProperties = {
  color: "#9df3bf",
  letterSpacing: 5,
  fontWeight: 950,
  fontSize: 12,
  marginBottom: 12,
  textTransform: "uppercase",
};

const muted: React.CSSProperties = {
  color: "rgba(255,255,255,.72)",
  lineHeight: 1.55,
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
  margin: "0 7px 7px 0",
};

function cleanEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function clean(value: unknown) {
  return String(value || "").trim();
}

function getLocalEmail() {
  if (typeof window === "undefined") return "";

  try {
    return cleanEmail(
      localStorage.getItem("vf_email") ||
        sessionStorage.getItem("vf_email") ||
        ""
    );
  } catch {
    return "";
  }
}

function getParam(params: URLSearchParams, names: string[]) {
  for (const name of names) {
    const value = clean(params.get(name));
    if (value) return value;
  }

  return "";
}

function getParamEmail(params: URLSearchParams) {
  return cleanEmail(
    getParam(params, ["to", "email", "member_email", "recipient_email", "target_email"])
  );
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export default function NewMessagePage() {
  const [fromEmail, setFromEmail] = useState("");
  const [toEmail, setToEmail] = useState("");
  const [itemId, setItemId] = useState("");
  const [signalId, setSignalId] = useState("");
  const [subject, setSubject] = useState("VaultForge connection request");
  const [body, setBody] = useState(
    "I saw this VaultForge opportunity/member profile and would like to connect."
  );
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextItemId = getParam(params, ["item_id", "deal_id", "project_id", "pain_id"]);
    const nextSignalId = getParam(params, ["signal_id", "alert_id"]);

    setFromEmail(getLocalEmail());
    setToEmail(getParamEmail(params));
    setItemId(nextItemId);
    setSignalId(nextSignalId);

    if (nextSignalId || nextItemId) {
      setSubject("VaultForge alert follow-up");
      setBody("I need more information about this VaultForge signal/opportunity.");
    }
  }, []);

  const canSend = useMemo(() => {
    return fromEmail.includes("@") && toEmail.includes("@") && body.trim().length >= 2;
  }, [fromEmail, toEmail, body]);

  async function submit() {
    if (busy) return;

    setBusy(true);
    setStatus("");

    try {
      const sender = cleanEmail(fromEmail);
      const recipient = cleanEmail(toEmail);

      if (!sender) throw new Error("Login email missing. Please log in again.");
      if (!recipient) throw new Error("Missing recipient email.");
      if (!clean(body)) throw new Error("Write a message before sending.");

      const payload = {
        from_email: sender,
        sender_email: sender,
        to_email: recipient,
        recipient_email: recipient,
        target_email: recipient,
        subject: clean(subject) || "VaultForge connection request",
        message: clean(body),
        body: clean(body),
        message_type: itemId || signalId ? "alert_connection_request" : "member_connection_request",
        source: "messages_new_page",
        item_id: itemId || null,
        signal_id: signalId || null,
      };

      const res = await fetch("/api/messages/new", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": sender,
          "x-vf-recipient-email": recipient,
        },
        body: JSON.stringify(payload),
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Could not save connection request.");
      }

      setSent(true);
      setStatus(data?.message || "Connection request saved.");
    } catch (error: any) {
      setStatus(error?.message || "Could not send message.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={page}>
      <style>{`
        a:hover,
        button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        textarea::placeholder,
        input::placeholder {
          color: rgba(255,255,255,.48);
        }

        @media (max-width: 760px) {
          a,
          button {
            width: 100%;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav
          title="New Message"
          subtitle="Private member connection request"
        />

        <section style={card}>
          <div style={eyebrow}>VaultForge Message Thread</div>
          <h1 style={{ fontSize: "clamp(52px,12vw,94px)", lineHeight: 0.9, margin: "0 0 18px" }}>
            Request connection.
          </h1>
          <p style={{ ...muted, fontSize: 20 }}>
            This sends a controlled VaultForge connection request. It does not expose private contact details outside the platform.
          </p>

          <div>
            <span style={chip}>From: {fromEmail || "unknown"}</span>
            <span style={chip}>To: {toEmail || "missing"}</span>
            {signalId && <span style={chip}>Signal: {signalId}</span>}
            {itemId && <span style={chip}>Item: {itemId}</span>}
            <span style={chip}>{sent ? "Saved" : "Draft"}</span>
          </div>

          <Link href="/members" style={ghost}>Back to Members</Link>
          <Link href="/alerts" style={ghost}>Alerts</Link>
          <Link href="/messages" style={ghost}>All Messages</Link>
          <Link href="/dashboard" style={ghost}>Dashboard</Link>
          <Link href="/logout" style={danger}>Logout</Link>
        </section>

        {status && (
          <section
            style={{
              ...card,
              color:
                status.toLowerCase().includes("could") ||
                status.toLowerCase().includes("missing") ||
                status.toLowerCase().includes("required")
                  ? "#ffd0d0"
                  : "#9df3bf",
            }}
          >
            <strong>{status}</strong>
          </section>
        )}

        <section style={card}>
          <div style={eyebrow}>Connection Details</div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }}>
            <div>
              <label style={label}>Your Email</label>
              <input
                value={fromEmail}
                onChange={(event) => setFromEmail(cleanEmail(event.target.value))}
                placeholder="your@email.com"
                style={input}
              />
            </div>

            <div>
              <label style={label}>Recipient Email</label>
              <input
                value={toEmail}
                onChange={(event) => setToEmail(cleanEmail(event.target.value))}
                placeholder="member@email.com"
                style={input}
              />
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <label style={label}>Subject</label>
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Connection request"
              style={input}
            />
          </div>

          <div style={{ marginTop: 18 }}>
            <label style={label}>What information do you need?</label>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Example: I need more information about price, access, photos, timeline, owner contact release, or capital need..."
              style={{ ...input, minHeight: 190, lineHeight: 1.5 }}
            />
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={!canSend || busy || sent}
            style={{
              ...btn,
              width: "100%",
              marginTop: 18,
              opacity: !canSend || busy || sent ? 0.58 : 1,
            }}
          >
            {sent ? "Request Saved" : busy ? "Sending..." : "Send Connection Request"}
          </button>
        </section>

        <section style={{ ...card, borderColor: "rgba(157,243,191,.22)" }}>
          <div style={eyebrow}>Current Safety Mode</div>
          <p style={muted}>
            This page records a controlled message request. It does not automatically release private contact information.
          </p>
        </section>
      </div>
    </main>
  );
}
