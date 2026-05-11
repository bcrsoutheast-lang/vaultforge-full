"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type SignalRow = Record<string, any>;

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
      // keep going
    }
  }

  return cleanEmail(
    readCookie("vf_email") ||
      readCookie("vf_member_email") ||
      readCookie("vf_admin_email") ||
      readCookie("email")
  );
}

function isOwnerEmail(email: string) {
  return cleanEmail(email) === OWNER_EMAIL || readCookie("vf_admin") === "1" || readCookie("isAdmin") === "true";
}

function getParam(params: URLSearchParams, names: string[]) {
  for (const name of names) {
    const value = clean(params.get(name));
    if (value) return value;
  }
  return "";
}

function getParamEmail(params: URLSearchParams) {
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

function titleOf(signal: SignalRow, fallback = "VaultForge signal/opportunity") {
  return first(
    signal?.title,
    signal?.signal_title,
    signal?.headline,
    signal?.name,
    signal?.pain_label,
    signal?.metadata?.title,
    signal?.metadata?.signal_title,
    fallback
  );
}

function ownerFromSignal(signal: SignalRow) {
  const metadata = typeof signal?.metadata === "object" && signal.metadata ? signal.metadata : {};

  const candidates = [
    signal?.owner_email,
    signal?.submitted_by_email,
    signal?.created_by_email,
    signal?.creator_email,
    signal?.submitted_by,
    signal?.user_email,
    signal?.member_email,
    signal?.target_email,
    signal?.target_member_email,
    signal?.recipient_email,
    signal?.email,
    metadata.owner_email,
    metadata.submitted_by_email,
    metadata.created_by_email,
    metadata.creator_email,
    metadata.submitted_by,
    metadata.user_email,
    metadata.member_email,
    metadata.target_email,
    metadata.target_member_email,
    metadata.recipient_email,
    metadata.email,
  ]
    .map(cleanEmail)
    .filter((email) => email.includes("@"));

  return candidates.find((email) => email !== OWNER_EMAIL) || candidates[0] || "";
}

function parseRecipientFromLink(link: unknown) {
  const text = clean(link);
  if (!text) return "";

  try {
    const url = new URL(text, typeof window !== "undefined" ? window.location.origin : "https://vaultforge-full.vercel.app");
    return getParamEmail(url.searchParams);
  } catch {
    return "";
  }
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
  const [recipientSource, setRecipientSource] = useState("Resolving recipient...");
  const [itemId, setItemId] = useState("");
  const [signalId, setSignalId] = useState("");
  const [subject, setSubject] = useState("VaultForge connection request");
  const [body, setBody] = useState("I need more information about this VaultForge signal/opportunity.");
  const [busy, setBusy] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [status, setStatus] = useState("");
  const [debug, setDebug] = useState("");
  const [sent, setSent] = useState(false);
  const [savedThreadId, setSavedThreadId] = useState("");
  const [contextTitle, setContextTitle] = useState("VaultForge signal/opportunity");

  async function resolveRecipient() {
    const params = new URLSearchParams(window.location.search);
    const localEmail = getLocalEmail();
    const nextItemId = getParam(params, ["item_id", "deal_id", "project_id", "pain_id", "itemId"]);
    const nextSignalId = getParam(params, ["signal_id", "alert_id", "signalId"]);
    const urlRecipient = getParamEmail(params);
    const urlSubject = clean(params.get("subject"));
    const urlBody = clean(params.get("body") || params.get("message"));

    setFromEmail(localEmail);
    setItemId(nextItemId);
    setSignalId(nextSignalId);
    setStatus("");
    setDebug("");

    if (urlSubject) setSubject(urlSubject);
    else if (nextSignalId || nextItemId) setSubject("VaultForge alert follow-up");

    if (urlBody) setBody(urlBody);

    if (urlRecipient) {
      setToEmail(urlRecipient);
      setRecipientSource("URL recipient");
      return;
    }

    if (!nextSignalId) {
      setToEmail("");
      setRecipientSource("No signal_id or recipient in URL");
      setDebug("Open this page from Pain Feed / Signal Room / Alert action. A bare /messages/new URL cannot know who to contact.");
      return;
    }

    setResolving(true);
    setRecipientSource("Looking up Signal API...");

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
      const signal = data.signal || {};
      const directLinks = data.direct_links || signal.direct_links || {};

      const resolved =
        ownerFromSignal(signal) ||
        parseRecipientFromLink(directLinks.message_owner) ||
        parseRecipientFromLink(directLinks.message) ||
        parseRecipientFromLink(data.message_owner);

      const resolvedTitle = titleOf(signal, urlSubject || "VaultForge signal/opportunity");
      setContextTitle(resolvedTitle);

      if (resolved) {
        setToEmail(resolved);
        setRecipientSource(resolved === OWNER_EMAIL ? "Signal API admin fallback" : "Signal API owner");
        setDebug(
          `Resolved from /api/signals. owner_email=${clean(signal.owner_email) || "blank"} submitted_by_email=${clean(signal.submitted_by_email) || "blank"} member_email=${clean(signal.member_email) || "blank"} target_email=${clean(signal.target_email) || "blank"}`
        );
      } else {
        setToEmail("");
        setRecipientSource("Signal API returned no recipient");
        setDebug(JSON.stringify({ ok: data.ok, signal_owner: signal.owner_email || null, signal_member: signal.member_email || null, direct_links: directLinks || null }).slice(0, 900));
      }
    } catch (error: any) {
      setToEmail("");
      setRecipientSource("Signal lookup failed");
      setDebug(error?.message || String(error));
    } finally {
      setResolving(false);
    }
  }

  useEffect(() => {
    resolveRecipient();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selfMessage = fromEmail && toEmail && cleanEmail(fromEmail) === cleanEmail(toEmail);

  const canSend = useMemo(() => {
    return fromEmail.includes("@") && toEmail.includes("@") && body.trim().length >= 2 && !busy && !sent;
  }, [fromEmail, toEmail, body, busy, sent]);

  async function submit() {
    if (busy) return;

    setBusy(true);
    setStatus("");
    setDebug("");

    try {
      const sender = cleanEmail(fromEmail);
      const recipient = cleanEmail(toEmail);

      if (!sender) throw new Error("Login email missing. Please log in again.");
      if (!recipient) throw new Error("Missing recipient email. Press Resolve Recipient or open from Signal/Pain card.");
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
        setDebug(JSON.stringify(data, null, 2).slice(0, 1800));
        throw new Error(data?.error || data?.details || "Could not save connection request.");
      }

      const threadId = clean(data.thread_id);
      setSent(true);
      setSavedThreadId(threadId);
      setStatus(data?.note || data?.message || "Connection request saved.");

      if (threadId) {
        setTimeout(() => {
          window.location.href = `/messages/${encodeURIComponent(threadId)}?email=${encodeURIComponent(sender)}`;
        }, 700);
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
          <h1 style={{ fontSize: "clamp(52px,12vw,94px)", lineHeight: 0.9, margin: "0 0 18px" }}>
            {selfMessage ? "Add owner note." : "Request connection."}
          </h1>
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
            <button type="button" onClick={resolveRecipient} style={btn} disabled={resolving}>
              {resolving ? "Resolving..." : "Resolve Recipient"}
            </button>
            {savedThreadId ? <Link href={`/messages/${encodeURIComponent(savedThreadId)}?email=${encodeURIComponent(fromEmail)}`} style={btn}>Open Thread</Link> : null}
            {signalId ? <Link href={`/signals/${encodeURIComponent(signalId)}`} style={ghost}>Back to Signal</Link> : null}
            <Link href="/messages" style={ghost}>All Messages</Link>
            <Link href="/pain-feed" style={ghost}>Pain Feed</Link>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
            <Link href="/logout" style={{ ...ghost, color: "#fecaca", border: "1px solid rgba(239,68,68,.34)" }}>Logout</Link>
          </div>
        </section>

        {status && (
          <section style={{ ...card, color: status.toLowerCase().includes("could") || status.toLowerCase().includes("missing") ? "#ffd0d0" : "#bbf7d0" }}>
            <strong>{status}</strong>
          </section>
        )}

        {debug && (
          <section style={card}>
            <p style={eyebrow}>Resolver / Save Debug</p>
            <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", color: "#cbd5e1", fontSize: 13, lineHeight: 1.45, margin: 0 }}>
              {debug}
            </pre>
          </section>
        )}

        {!toEmail && (
          <section style={{ ...card, color: "#ffd0d0" }}>
            <strong>No recipient is resolved yet.</strong>
            <p style={muted}>
              The URL must include a recipient or a signal_id that resolves through the Signal API. Press Resolve Recipient after ownership SQL changes.
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

          <button type="button" onClick={submit} disabled={!canSend} style={{ ...btn, width: "100%", marginTop: 18, opacity: !canSend ? 0.58 : 1 }}>
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
