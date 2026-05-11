"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

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

function getLocalEmail(urlEmail = "") {
  const direct = cleanEmail(urlEmail);
  if (direct.includes("@")) return direct;

  if (typeof window === "undefined") return "";

  const keys = ["vf_email", "vf_member_email", "vf_admin_email", "email", "memberEmail", "vf_member"];

  for (const key of keys) {
    try {
      const localValue = cleanEmail(window.localStorage.getItem(key));
      if (localValue.includes("@")) return localValue;

      const sessionValue = cleanEmail(window.sessionStorage.getItem(key));
      if (sessionValue.includes("@")) return sessionValue;
    } catch {
      // continue
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

function ownerFromSignal(signal: SignalRow) {
  const metadata = typeof signal?.metadata === "object" && signal.metadata ? signal.metadata : {};

  const candidates = [
    signal.owner_email,
    signal.submitted_by_email,
    signal.created_by_email,
    signal.creator_email,
    signal.submitted_by,
    signal.user_email,
    signal.member_email,
    signal.target_email,
    signal.target_member_email,
    signal.recipient_email,
    signal.email,
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

function titleOf(signal: SignalRow) {
  return first(signal.title, signal.signal_title, signal.headline, signal.name, signal.pain_label, "VaultForge Signal");
}

function noteOf(signal: SignalRow) {
  return first(
    signal.note,
    signal.notes,
    signal.summary,
    signal.description,
    signal.message,
    signal.route_summary,
    "VaultForge signal/opportunity."
  );
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

export default function VaultForgeConnectPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const signalId = decodeURIComponent(String(params?.signalId || ""));
  const [fromEmail, setFromEmail] = useState("");
  const [toEmail, setToEmail] = useState("");
  const [itemId, setItemId] = useState("");
  const [signal, setSignal] = useState<SignalRow>({});
  const [subject, setSubject] = useState("VaultForge connection request");
  const [message, setMessage] = useState("I need more information about this VaultForge signal/opportunity.");
  const [status, setStatus] = useState("Loading signal...");
  const [debug, setDebug] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function loadSignal() {
    const email = getLocalEmail(searchParams.get("email") || "");
    setFromEmail(email);
    setStatus("Loading signal...");
    setDebug("");

    if (!signalId) {
      setStatus("Signal ID missing.");
      return;
    }

    try {
      const q = new URLSearchParams();
      if (email) q.set("email", email);
      if (isOwnerEmail(email)) q.set("owner", "1");

      const res = await fetch(`/api/signals/${encodeURIComponent(signalId)}?${q.toString()}`, {
        cache: "no-store",
        headers: {
          "x-vf-email": email,
          "x-vf-admin": isOwnerEmail(email) ? "1" : "0",
        },
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Signal lookup failed.");
      }

      const row = data.signal || {};
      const owner = ownerFromSignal(row);
      const nextItemId = first(row.item_id, row.pain_id, row.deal_id, data.item_id, searchParams.get("item_id"));

      setSignal(row);
      setToEmail(owner);
      setItemId(nextItemId);
      setSubject(`VaultForge follow-up: ${titleOf(row)}`);
      setStatus(owner ? "" : "Signal loaded, but no owner email was resolved.");
      setDebug(
        `Signal loaded from ${data.source || "api/signals"}. owner=${owner || "missing"} item=${nextItemId || "missing"} source_table=${row._source_table || row.source_table || "unknown"}`
      );
    } catch (error: any) {
      setStatus(error?.message || "Signal lookup failed.");
    }
  }

  useEffect(() => {
    loadSignal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signalId]);

  const selfMessage = fromEmail && toEmail && cleanEmail(fromEmail) === cleanEmail(toEmail);

  const canSave = useMemo(() => {
    return Boolean(fromEmail.includes("@") && toEmail.includes("@") && signalId && message.trim() && !busy && !saved);
  }, [fromEmail, toEmail, signalId, message, busy, saved]);

  async function save() {
    if (!canSave) return;

    setBusy(true);
    setStatus("");
    setDebug("");

    try {
      const payload = {
        from_email: fromEmail,
        member_email: fromEmail,
        to_email: toEmail,
        recipient_email: toEmail,
        owner_email: toEmail,
        signal_id: signalId,
        item_id: itemId,
        title: subject,
        subject,
        message,
        context_title: titleOf(signal),
      };

      const res = await fetch("/api/vf-connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": fromEmail,
        },
        body: JSON.stringify(payload),
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        setDebug(JSON.stringify(data, null, 2).slice(0, 1800));
        throw new Error(data?.error || data?.details || "Connection request could not be saved.");
      }

      setSaved(true);
      setStatus(data.message || "Connection request saved.");
      setDebug(JSON.stringify({ table: data.table, connect_id: data.connect_id, links: data.links }, null, 2));
    } catch (error: any) {
      setStatus(error?.message || "Connection request could not be saved.");
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
          <p style={eyebrow}>VaultForge Connect V1</p>
          <h1 style={{ fontSize: "clamp(50px,12vw,94px)", lineHeight: 0.9, margin: "0 0 18px" }}>
            {selfMessage ? "Owner note." : "Controlled request."}
          </h1>
          <p style={{ ...muted, fontSize: 20 }}>
            Clean new connection system. This bypasses the broken legacy message stack and saves a controlled operational activity record.
          </p>

          <div>
            <span style={chip}>From: {fromEmail || "unknown"}</span>
            <span style={chip}>To: {toEmail || "missing"}</span>
            <span style={chip}>Signal: {signalId || "missing"}</span>
            {itemId ? <span style={chip}>Item: {itemId}</span> : null}
            <span style={chip}>{saved ? "Saved" : "Draft"}</span>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
            <button type="button" onClick={loadSignal} style={btn}>Reload Signal</button>
            {signalId ? <Link href={`/signals/${encodeURIComponent(signalId)}`} style={ghost}>Back to Signal</Link> : null}
            <Link href="/pain-feed" style={ghost}>Pain Feed</Link>
            <Link href="/activity" style={ghost}>Activity</Link>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
          </div>
        </section>

        {status ? (
          <section style={{ ...card, color: status.toLowerCase().includes("saved") ? "#bbf7d0" : "#ffd0d0" }}>
            <strong>{status}</strong>
          </section>
        ) : null}

        {debug ? (
          <section style={card}>
            <p style={eyebrow}>System Output</p>
            <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", color: "#cbd5e1", margin: 0, fontSize: 13, lineHeight: 1.45 }}>
              {debug}
            </pre>
          </section>
        ) : null}

        <section style={card}>
          <p style={eyebrow}>Signal Context</p>
          <h2 style={{ fontSize: 36, margin: "0 0 10px" }}>{titleOf(signal)}</h2>
          <p style={{ ...muted, fontSize: 18 }}>{noteOf(signal)}</p>
        </section>

        <section style={card}>
          <p style={eyebrow}>Connection Details</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }}>
            <label>
              <strong>Your Email</strong>
              <input value={fromEmail} onChange={(event) => setFromEmail(cleanEmail(event.target.value))} placeholder="your@email.com" style={{ ...input, marginTop: 8 }} />
            </label>
            <label>
              <strong>Recipient / Owner Email</strong>
              <input value={toEmail} onChange={(event) => setToEmail(cleanEmail(event.target.value))} placeholder="owner@email.com" style={{ ...input, marginTop: 8 }} />
            </label>
          </div>

          <label style={{ display: "block", marginTop: 18 }}>
            <strong>Subject</strong>
            <input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Connection request" style={{ ...input, marginTop: 8 }} />
          </label>

          <label style={{ display: "block", marginTop: 18 }}>
            <strong>{selfMessage ? "Owner note / update" : "What information do you need?"}</strong>
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ask for price, access, photos, terms, timeline, owner contact release, or capital need..." style={{ ...input, minHeight: 190, lineHeight: 1.5, padding: 16, marginTop: 8 }} />
          </label>

          <button type="button" onClick={save} disabled={!canSave} style={{ ...btn, width: "100%", marginTop: 18, opacity: !canSave ? 0.55 : 1 }}>
            {saved ? "Saved" : busy ? "Saving..." : selfMessage ? "Save Owner Note" : "Save Controlled Request"}
          </button>
        </section>

        <section style={card}>
          <p style={eyebrow}>Safety Mode</p>
          <p style={muted}>This stores intent inside VaultForge activity. It does not release private contact details automatically.</p>
        </section>
      </div>
    </main>
  );
}
