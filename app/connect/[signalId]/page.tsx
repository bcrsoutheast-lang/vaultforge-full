"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";
type SignalRow = Record<string, any>;

function clean(value: unknown) { return String(value || "").trim(); }
function cleanEmail(value: unknown) { return clean(value).toLowerCase(); }
function first(...values: unknown[]) { for (const value of values) { const text = clean(value); if (text) return text; } return ""; }

function readCookie(name: string) {
  if (typeof document === "undefined") return "";
  const match = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  if (!match) return "";
  try { return decodeURIComponent(match.slice(name.length + 1)); } catch { return match.slice(name.length + 1); }
}

function getLocalEmail(urlEmail = "") {
  const direct = cleanEmail(urlEmail);
  if (direct.includes("@")) return direct;
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

function isOwnerEmail(email: string) {
  return cleanEmail(email) === OWNER_EMAIL || readCookie("vf_admin") === "1" || readCookie("isAdmin") === "true";
}

function ownerFromSignal(signal: SignalRow) {
  const metadata = typeof signal?.metadata === "object" && signal.metadata ? signal.metadata : {};
  const candidates = [
    signal.owner_email, signal.submitted_by_email, signal.created_by_email, signal.creator_email, signal.submitted_by,
    signal.user_email, signal.member_email, signal.target_email, signal.target_member_email, signal.recipient_email, signal.email,
    metadata.owner_email, metadata.submitted_by_email, metadata.created_by_email, metadata.creator_email, metadata.submitted_by,
    metadata.user_email, metadata.member_email, metadata.target_email, metadata.target_member_email, metadata.recipient_email, metadata.email,
  ].map(cleanEmail).filter((email) => email.includes("@"));
  return candidates.find((email) => email !== OWNER_EMAIL) || candidates[0] || "";
}

function titleOf(signal: SignalRow) {
  return first(signal.title, signal.signal_title, signal.headline, signal.name, signal.pain_label, "VaultForge Signal");
}

function noteOf(signal: SignalRow) {
  return first(signal.note, signal.notes, signal.summary, signal.description, signal.message, signal.route_summary, "VaultForge signal/opportunity.");
}

async function safeJson(res: Response) { try { return await res.json(); } catch { return {}; } }

const page: React.CSSProperties = { minHeight: "100vh", background: "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 30%), linear-gradient(180deg,#020303,#071326 55%,#020303)", color: "white", padding: "22px 16px 82px", fontFamily: "Arial, sans-serif" };
const wrap: React.CSSProperties = { width: "min(980px,100%)", margin: "0 auto" };
const card: React.CSSProperties = { border: "1px solid rgba(232,196,107,.28)", borderRadius: 28, padding: 24, background: "rgba(255,255,255,.06)", marginBottom: 16 };
const eyebrow: React.CSSProperties = { color: "#e8c46b", letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 950, fontSize: 12 };
const muted: React.CSSProperties = { color: "#cbd5e1", lineHeight: 1.55 };
const chip: React.CSSProperties = { display: "inline-flex", border: "1px solid rgba(255,255,255,.14)", borderRadius: 999, padding: "8px 11px", color: "#e5e7eb", margin: "0 7px 7px 0", fontWeight: 850, fontSize: 12 };
const btn: React.CSSProperties = { display: "inline-flex", justifyContent: "center", alignItems: "center", minHeight: 46, borderRadius: 999, padding: "12px 16px", border: 0, background: "#e8c46b", color: "#06100a", fontWeight: 950, textDecoration: "none", cursor: "pointer" };
const ghost: React.CSSProperties = { ...btn, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.16)", color: "white" };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", borderRadius: 16, border: "1px solid rgba(255,255,255,.18)", background: "rgba(255,255,255,.08)", color: "white", padding: 14, fontSize: 16 };

export default function VaultForgeConnectPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const signalId = decodeURIComponent(String(params?.signalId || ""));
  const [fromEmail, setFromEmail] = useState("");
  const [toEmail, setToEmail] = useState("");
  const [itemId, setItemId] = useState("");
  const [signal, setSignal] = useState<SignalRow>({});
  const [subject, setSubject] = useState("VaultForge message");
  const [message, setMessage] = useState("I need more information about this opportunity.");
  const [status, setStatus] = useState("Loading signal...");
  const [debug, setDebug] = useState("");
  const [busy, setBusy] = useState(false);
  const [savedThread, setSavedThread] = useState("");

  async function loadSignal() {
    const email = getLocalEmail(searchParams.get("email") || "");
    setFromEmail(email);
    setStatus("Loading signal...");
    setDebug("");

    try {
      const q = new URLSearchParams();
      if (email) q.set("email", email);
      if (isOwnerEmail(email)) q.set("owner", "1");
      const res = await fetch(`/api/signals/${encodeURIComponent(signalId)}?${q.toString()}`, {
        cache: "no-store",
        headers: { "x-vf-email": email, "x-vf-admin": isOwnerEmail(email) ? "1" : "0" },
      });
      const data = await safeJson(res);
      if (!res.ok || data?.ok === false) throw new Error(data?.error || data?.details || "Signal lookup failed.");
      const row = data.signal || {};
      const owner = ownerFromSignal(row);
      const nextItemId = first(row.item_id, row.pain_id, row.deal_id, searchParams.get("item_id"));
      setSignal(row);
      setToEmail(owner);
      setItemId(nextItemId);
      setSubject(`VaultForge message: ${titleOf(row)}`);
      setStatus(owner ? "" : "Signal loaded, but owner email is missing.");
      setDebug(`Owner=${owner || "missing"} Signal=${signalId} Item=${nextItemId || "missing"}`);
    } catch (error: any) {
      setStatus(error?.message || "Could not load signal.");
    }
  }

  useEffect(() => { loadSignal(); }, [signalId]);

  const canSave = useMemo(() => Boolean(fromEmail.includes("@") && toEmail.includes("@") && message.trim() && !busy && !savedThread), [fromEmail, toEmail, message, busy, savedThread]);

  async function save() {
    setBusy(true);
    setStatus("");
    try {
      const res = await fetch("/api/simple-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-vf-email": fromEmail },
        body: JSON.stringify({ from_email: fromEmail, to_email: toEmail, owner_email: toEmail, signal_id: signalId, item_id: itemId, subject, body: message, context_title: titleOf(signal) }),
      });
      const data = await safeJson(res);
      if (!res.ok || data?.ok === false) {
        setDebug(JSON.stringify(data, null, 2).slice(0, 1400));
        throw new Error(data?.error || data?.details || "Message could not be saved.");
      }
      setSavedThread(data.thread_id || "");
      setStatus("Message saved.");
      setDebug(`Saved to ${data.table}. Thread=${data.thread_id}`);
    } catch (error: any) {
      setStatus(error?.message || "Message could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={page}>
      <div style={wrap}>
        <section style={card}>
          <p style={eyebrow}>VaultForge Simple Messages</p>
          <h1 style={{ fontSize: "clamp(48px,11vw,86px)", lineHeight: 0.9, margin: "10px 0 18px" }}>Message owner.</h1>
          <p style={{ ...muted, fontSize: 18 }}>Simple owner communication only. Message, reply, done.</p>
          <span style={chip}>From: {fromEmail || "unknown"}</span>
          <span style={chip}>To: {toEmail || "missing"}</span>
          <span style={chip}>Signal: {signalId || "missing"}</span>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            <button type="button" onClick={loadSignal} style={btn}>Reload Signal</button>
            {savedThread ? <Link href={`/messages/${encodeURIComponent(savedThread)}?email=${encodeURIComponent(fromEmail)}`} style={btn}>Open Thread</Link> : null}
            <Link href={`/signals/${encodeURIComponent(signalId)}`} style={ghost}>Signal</Link>
            <Link href="/messages" style={ghost}>Inbox</Link>
            <Link href="/pain-feed" style={ghost}>Pain Feed</Link>
          </div>
        </section>
        {status ? <section style={{ ...card, color: status.toLowerCase().includes("saved") ? "#bbf7d0" : "#ffd0d0" }}><strong>{status}</strong></section> : null}
        {debug ? <section style={card}><p style={eyebrow}>Debug</p><pre style={{ color: "#cbd5e1", whiteSpace: "pre-wrap" }}>{debug}</pre></section> : null}
        <section style={card}><p style={eyebrow}>Signal</p><h2>{titleOf(signal)}</h2><p style={muted}>{noteOf(signal)}</p></section>
        <section style={card}>
          <p style={eyebrow}>Message</p>
          <label><strong>Your Email</strong><input value={fromEmail} onChange={(e) => setFromEmail(cleanEmail(e.target.value))} style={{ ...input, marginTop: 8, marginBottom: 14 }} /></label>
          <label><strong>Owner Email</strong><input value={toEmail} onChange={(e) => setToEmail(cleanEmail(e.target.value))} style={{ ...input, marginTop: 8, marginBottom: 14 }} /></label>
          <label><strong>Subject</strong><input value={subject} onChange={(e) => setSubject(e.target.value)} style={{ ...input, marginTop: 8, marginBottom: 14 }} /></label>
          <label><strong>Message</strong><textarea value={message} onChange={(e) => setMessage(e.target.value)} style={{ ...input, minHeight: 160, marginTop: 8 }} /></label>
          <button type="button" onClick={save} disabled={!canSave} style={{ ...btn, width: "100%", marginTop: 18, opacity: canSave ? 1 : 0.55 }}>{busy ? "Saving..." : savedThread ? "Saved" : "Send Message"}</button>
        </section>
      </div>
    </main>
  );
}
