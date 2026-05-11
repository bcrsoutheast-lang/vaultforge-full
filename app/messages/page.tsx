"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function first(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }

  return "";
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

function getLocalEmail() {
  if (typeof window === "undefined") return "";

  const params = new URLSearchParams(window.location.search);
  const from = cleanEmail(params.get("from") || params.get("email") || params.get("viewer"));
  if (from.includes("@")) return from;

  const keys = ["vf_email", "vf_member_email", "vf_admin_email", "email", "memberEmail", "vf_member"];

  for (const key of keys) {
    try {
      const localValue = cleanEmail(window.localStorage.getItem(key));
      if (localValue.includes("@")) return localValue;

      const sessionValue = cleanEmail(window.sessionStorage.getItem(key));
      if (sessionValue.includes("@")) return sessionValue;
    } catch {
      // Continue.
    }
  }

  return cleanEmail(readCookie("vf_email") || readCookie("vf_member_email") || readCookie("vf_admin_email") || readCookie("email"));
}

function isOwnerEmail(email: string) {
  return cleanEmail(email) === OWNER_EMAIL || readCookie("vf_admin") === "1" || readCookie("isAdmin") === "true";
}

function param(params: URLSearchParams, names: string[]) {
  for (const name of names) {
    const value = clean(params.get(name));
    if (value) return value;
  }
  return "";
}

function paramEmail(params: URLSearchParams) {
  const names = [
    "owner_email",
    "created_by_email",
    "submitted_by_email",
    "creator_email",
    "recipient",
    "to",
    "member_email",
    "recipient_email",
    "target_email",
    "counterparty_email",
    "sender_email",
  ];

  for (const name of names) {
    const value = cleanEmail(params.get(name));
    if (value.includes("@")) return value;
  }

  return "";
}

function titleOf(row: any, fallback = "VaultForge signal/opportunity") {
  return first(row?.title, row?.signal_title, row?.headline, row?.name, row?.pain_label, fallback);
}

function ownerOf(row: any) {
  const candidates = [
    row?.owner_email,
    row?.created_by_email,
    row?.submitted_by_email,
    row?.creator_email,
    row?.submitted_by,
    row?.user_email,
    row?.member_email,
    row?.email,
    row?.recipient_email,
    row?.counterparty_email,
    row?.metadata?.owner_email,
    row?.metadata?.created_by_email,
    row?.metadata?.submitted_by_email,
    row?.metadata?.creator_email,
    row?.metadata?.submitted_by,
    row?.metadata?.user_email,
    row?.metadata?.member_email,
    row?.metadata?.email,
  ]
    .map(cleanEmail)
    .filter((email) => email.includes("@"));

  return candidates.find((email) => email !== OWNER_EMAIL) || candidates[0] || "";
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
    "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 30%), radial-gradient(circle at bottom right, rgba(148,163,184,.10), transparent 32%), linear-gradient(180deg,#020303,#07090d 50%,#020303)",
  color: "white",
  padding: "22px 16px 82px",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const wrap: React.CSSProperties = { width: "min(1080px,100%)", margin: "0 auto" };
const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.28)",
  borderRadius: 30,
  padding: 24,
  background: "linear-gradient(135deg,rgba(255,255,255,.075),rgba(255,255,255,.026))",
  boxShadow: "0 28px 90px rgba(0,0,0,.38)",
  marginBottom: 16,
};
const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  fontSize: 12,
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontWeight: 950,
  margin: "0 0 10px",
};
const muted: React.CSSProperties = { color: "#cbd5e1", lineHeight: 1.55 };
const chip: React.CSSProperties = {
  display: "inline-flex",
  border: "1px solid rgba(255,255,255,.14)",
  color: "#e5e7eb",
  background: "rgba(255,255,255,.055)",
  borderRadius: 999,
  padding: "8px 11px",
  fontWeight: 850,
  fontSize: 12,
  margin: "0 7px 7px 0",
};
const btn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#101010",
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  border: "1px solid rgba(232,196,107,.7)",
  textDecoration: "none",
  borderRadius: 15,
  padding: "12px 15px",
  fontWeight: 950,
  minHeight: 45,
  cursor: "pointer",
};
const ghost: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  background: "rgba(255,255,255,.055)",
  border: "1px solid rgba(255,255,255,.14)",
  textDecoration: "none",
  borderRadius: 15,
  padding: "12px 15px",
  fontWeight: 850,
  minHeight: 45,
  cursor: "pointer",
};
const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  minHeight: 56,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,.16)",
  background: "rgba(255,255,255,.07)",
  color: "white",
  padding: "0 16px",
  fontSize: 16,
  outline: "none",
};

export default function NewMessagePage() {
  const [fromEmail, setFromEmail] = useState("");
  const [toEmail, setToEmail] = useState("");
  const [recipientSource, setRecipientSource] = useState("Resolving recipient");
  const [itemId, setItemId] = useState("");
  const [signalId, setSignalId] = useState("");
  const [subject, setSubject] = useState("VaultForge connection request");
  const [body, setBody] = useState("I need more information about this VaultForge signal/opportunity.");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [sent, setSent] = useState(false);
  const [savedThreadId, setSavedThreadId] = useState("");
  const [contextTitle, setContextTitle] = useState("VaultForge signal/opportunity");

  useEffect(() => {
    async function init() {
      const params = new URLSearchParams(window.location.search);
      const nextItemId = param(params, ["item_id", "deal_id", "project_id", "pain_id", "itemId"]);
      const nextSignalId = param(params, ["signal_id", "alert_id", "signalId"]);
      const urlRecipient = paramEmail(params);
      const localEmail = getLocalEmail();
      const urlSubject = clean(params.get("subject"));
      const urlBody = clean(params.get("body") || params.get("message"));

      setFromEmail(localEmail);
      setItemId(nextItemId);
      setSignalId(nextSignalId);

      if (urlSubject) setSubject(urlSubject);
      else if (nextSignalId || nextItemId) setSubject("VaultForge signal follow-up");

      if (urlBody) setBody(urlBody);

      if (urlRecipient) {
        setToEmail(urlRecipient);
        setRecipientSource("URL recipient");
      }

      if (nextSignalId) {
        try {
          const q = new URLSearchParams();
          if (localEmail) q.set("email", localEmail);
          if (isOwnerEmail(localEmail)) q.set("owner", "1");

          const res = await fetch(`/api/signals/${encodeURIComponent(nextSignalId)}?${q.toString()}`, {
            cache: "no-store",
            headers: {
              "x-vf-email": localEmail,
              "x-vf-admin": isOwnerEmail(localEmail) ? "1" : "0",
            },
          });

          const data = await safeJson(res);
          const signal = data.signal || null;
          const owner = ownerOf(signal);
          const resolvedTitle = titleOf(signal, urlSubject || "VaultForge signal/opportunity");

          setContextTitle(resolvedTitle);

          if (owner) {
            setToEmail(owner);
            setRecipientSource(owner === OWNER_EMAIL ? "Admin fallback from Signal API" : "Signal/project owner");
          } else if (!urlRecipient) {
            setToEmail("");
            setRecipientSource("Missing owner on signal");
          }
        } catch {
          if (!urlRecipient) setRecipientSource("Signal lookup failed");
        }
      } else if (!urlRecipient) {
        setRecipientSource("No signal or recipient provided");
      }
    }

    init();
  }, []);

  const selfMessage = fromEmail && toEmail && cleanEmail(fromEmail) === cleanEmail(toEmail);

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
        owner_email: recipient,
        subject: clean(subject) || "VaultForge connection request",
        message: clean(body),
        body: clean(body),
        message_type: selfMessage ? "owner_note" : itemId || signalId ? "signal_connection_request" : "member_connection_request",
        source: "messages_new_page",
        item_id: itemId || null,
        signal_id: signalId || null,
        context_title: contextTitle,
        recipient_source: recipientSource,
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

      const threadId = clean(data.thread_id);
      setSent(true);
      setSavedThreadId(threadId);
      setStatus(data?.note || data?.message || "Connection request saved.");

      if (threadId) {
        try {
          const url = `/messages/${encodeURIComponent(threadId)}?email=${encodeURIComponent(sender)}`;
          window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
          setTimeout(() => {
            window.location.href = url;
          }, 600);
        } catch {
          // Button still appears.
        }
      }
    } catch (error: any) {
      setStatus(error?.message || "Could not send message.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover { transform: translateY(-1px); transition: all .18s ease; filter: brightness(1.06); }
        textarea::placeholder, input::placeholder { color: rgba(255,255,255,.48); }
        @media (max-width: 760px) { a, button { width: 100%; box-sizing: border-box; } }
      `}</style>

      <div style={wrap}>
        <section style={card}>
          <p style={eyebrow}>VaultForge Message Thread</p>
          <h1 style={{ fontSize: "clamp(52px,12vw,94px)", lineHeight: 0.9, margin: "0 0 18px" }}>{selfMessage ? "Add owner note." : "Request connection."}</h1>
          <p style={{ ...muted, fontSize: 20 }}>
            {selfMessage
              ? "You are the detected owner. This saves an owner note/thread instead of sending a request to yourself."
              : "This sends a controlled VaultForge connection request to the actual owner/recipient when available."}
          </p>

          <div>
            <span style={chip}>From: {fromEmail || "unknown"}</span>
            <span style={chip}>To: {toEmail || "missing"}</span>
            <span style={chip}>Source: {recipientSource}</span>
            {signalId && <span style={chip}>Signal: {signalId}</span>}
            {itemId && <span style={chip}>Item: {itemId}</span>}
            <span style={chip}>{sent ? "Saved" : "Draft"}</span>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
            {savedThreadId ? <Link href={`/messages/${encodeURIComponent(savedThreadId)}?email=${encodeURIComponent(fromEmail)}`} style={btn}>Open Thread</Link> : null}
            {signalId ? <Link href={`/signals/${encodeURIComponent(signalId)}`} style={ghost}>Back to Signal</Link> : null}
            <Link href="/messages" style={ghost}>All Messages</Link>
            <Link href="/pain-feed" style={ghost}>Pain Feed</Link>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
            <Link href="/logout" style={{ ...ghost, color: "#fecaca", border: "1px solid rgba(239,68,68,.34)" }}>Logout</Link>
          </div>
        </section>

        {status && <section style={{ ...card, color: status.toLowerCase().includes("could") || status.toLowerCase().includes("missing") ? "#ffd0d0" : "#bbf7d0" }}><strong>{status}</strong></section>}

        {!toEmail && (
          <section style={{ ...card, color: "#ffd0d0" }}>
            <strong>No recipient was passed into this page.</strong>
            <p style={muted}>
              Open this from a Pain card, Signal Room, Member card, or Alert action. A blank message page cannot know which owner/member to contact.
            </p>
          </section>
        )}

        <section style={card}>
          <p style={eyebrow}>Connection Details</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }}>
            <label>
              <strong>Your Email</strong>
              <input value={fromEmail} onChange={(event) => setFromEmail(cleanEmail(event.target.value))} placeholder="your@email.com" style={{ ...input, marginTop: 8 }} />
            </label>
            <label>
              <strong>Recipient Email</strong>
              <input value={toEmail} onChange={(event) => setToEmail(cleanEmail(event.target.value))} placeholder="member@email.com" style={{ ...input, marginTop: 8 }} />
            </label>
          </div>

          <label style={{ display: "block", marginTop: 18 }}>
            <strong>Subject</strong>
            <input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Connection request" style={{ ...input, marginTop: 8 }} />
          </label>

          <label style={{ display: "block", marginTop: 18 }}>
            <strong>{selfMessage ? "Owner note / update" : "What information do you need?"}</strong>
            <textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Ask for price, access, photos, timeline, owner contact release, or capital need..." style={{ ...input, minHeight: 190, lineHeight: 1.5, padding: 16, marginTop: 8 }} />
          </label>

          <button type="button" onClick={submit} disabled={!canSend || busy || sent} style={{ ...btn, width: "100%", marginTop: 18, opacity: !canSend || busy || sent ? 0.58 : 1 }}>
            {sent ? "Saved" : busy ? "Saving..." : selfMessage ? "Save Owner Note" : "Send Connection Request"}
          </button>
        </section>

        <section style={card}>
          <p style={eyebrow}>Safety Mode</p>
          <p style={muted}>This records a controlled message request/thread. It does not automatically release private contact information.</p>
        </section>
      </div>
    </main>
  );
}
