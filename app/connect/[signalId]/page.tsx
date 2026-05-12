"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../../components/VaultForgeMemberNav";

type Row = Record<string, any>;

const LOCAL_KEY = "vf_simple_messages_local_v1";

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function readCookie(name: string) {
  if (typeof document === "undefined") return "";
  const match = document.cookie.split(";").map((x) => x.trim()).find((x) => x.startsWith(`${name}=`));
  if (!match) return "";
  try {
    return decodeURIComponent(match.slice(name.length + 1));
  } catch {
    return match.slice(name.length + 1);
  }
}

function currentEmail(params: URLSearchParams) {
  const queryEmail = cleanEmail(params.get("email") || params.get("from") || params.get("from_email"));
  if (queryEmail.includes("@")) return queryEmail;

  const keys = ["vf_email", "vf_member_email", "vf_admin_email", "email", "memberEmail"];
  for (const key of keys) {
    const local = cleanEmail(window.localStorage.getItem(key));
    if (local.includes("@")) return local;
    const session = cleanEmail(window.sessionStorage.getItem(key));
    if (session.includes("@")) return session;
  }

  return cleanEmail(readCookie("vf_email") || readCookie("vf_member_email") || readCookie("vf_admin_email"));
}

function param(params: URLSearchParams, names: string[]) {
  for (const name of names) {
    const value = clean(params.get(name));
    if (value) return value;
  }
  return "";
}

function safePart(value: string) {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function label(source: string) {
  const s = source.toLowerCase();
  if (s.includes("alert")) return "Alert message";
  if (s.includes("pain")) return "Pain message";
  if (s.includes("activity")) return "Activity message";
  if (s.includes("routing")) return "Routing message";
  if (s.includes("intro")) return "Introduction message";
  if (s.includes("project")) return "Project message";
  if (s.includes("member")) return "Member message";
  if (s.includes("signal")) return "Signal message";
  return "VaultForge message";
}

function defaultBody(source: string) {
  const s = source.toLowerCase();
  if (s.includes("alert")) return "I need more information about this VaultForge alert.";
  if (s.includes("pain")) return "I need more information about this pain request or opportunity.";
  if (s.includes("activity")) return "I am following up on this VaultForge activity item.";
  if (s.includes("routing")) return "I am following up on this routing opportunity.";
  if (s.includes("intro")) return "I am responding to this controlled introduction.";
  if (s.includes("project")) return "I need more information about this project or deal room.";
  if (s.includes("member")) return "I saw this member profile and would like to connect.";
  if (s.includes("signal")) return "I need more information about this VaultForge signal.";
  return "I need more information about this VaultForge opportunity.";
}

function readLocalMessages() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOCAL_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalMessage(row: Row) {
  const existing = readLocalMessages();
  const key = `${row.thread_id}-${row.created_at}-${row.message}`;
  const filtered = existing.filter((item: Row) => `${item.thread_id}-${item.created_at}-${item.message}` !== key);
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify([row, ...filtered].slice(0, 300)));
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

const wrap: React.CSSProperties = { width: "min(980px,100%)", margin: "0 auto" };

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

const chip: React.CSSProperties = {
  border: "1px solid rgba(157,243,191,.22)",
  borderRadius: 999,
  padding: "7px 10px",
  color: "#9df3bf",
  background: "rgba(157,243,191,.07)",
  margin: "0 7px 7px 0",
  fontSize: 12,
  fontWeight: 850,
  display: "inline-flex",
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

export default function ConnectPage({ params }: { params: { signalId: string } }) {
  const rawSignalId = decodeURIComponent(params.signalId || "");
  const signalId = clean(rawSignalId) || "general-message";

  const [fromEmail, setFromEmail] = useState("");
  const [toEmail, setToEmail] = useState("");
  const [source, setSource] = useState("message");
  const [itemId, setItemId] = useState("");
  const [subject, setSubject] = useState("VaultForge message");
  const [message, setMessage] = useState("I need more information about this VaultForge opportunity.");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search || "");
    const nextSource = param(params, ["source", "type", "context"]) || "message";
    setSource(nextSource);
    setFromEmail(currentEmail(params));
    setToEmail(cleanEmail(param(params, ["to", "recipient", "recipient_email", "target_email", "owner_email"])));
    setItemId(param(params, ["item_id", "itemId", "pain_id", "project_id", "deal_id"]));
    setSubject(param(params, ["subject", "title"]) || label(nextSource));
    setMessage(param(params, ["message", "body", "note"]) || defaultBody(nextSource));
  }, []);

  async function sendMessage() {
    if (busy) return;
    setBusy(true);
    setStatus("Saving message...");

    try {
      if (!fromEmail.includes("@")) throw new Error("Missing sender email. Log in again.");
      if (!clean(message)) throw new Error("Write a message first.");

      const threadId = safePart(`${source}-${signalId || itemId || "general-message"}`) || "general-message";
      const finalTo = cleanEmail(toEmail) || "owner@vaultforge.local";
      const now = new Date().toISOString();

      const row = {
        id: `local-${Date.now()}`,
        thread_id: threadId,
        from_email: fromEmail,
        sender_email: fromEmail,
        to_email: finalTo,
        recipient_email: finalTo,
        target_email: finalTo,
        owner_email: finalTo,
        signal_id: signalId,
        item_id: itemId || null,
        source,
        message_type: source,
        subject,
        title: subject,
        message,
        body: message,
        note: message,
        status: "open",
        created_at: now,
        updated_at: now,
        metadata: {
          thread_id: threadId,
          signal_id: signalId,
          item_id: itemId || null,
          source,
          from_email: fromEmail,
          to_email: finalTo,
          subject,
        },
      };

      writeLocalMessage(row);

      try {
        await fetch("/api/simple-messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-vf-email": fromEmail,
          },
          body: JSON.stringify(row),
        });
      } catch {
        // Local inbox copy still shows it.
      }

      setStatus("Message saved. Opening inbox...");
      window.location.href = "/messages";
    } catch (error: any) {
      setStatus(error?.message || "Message could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover { transform: translateY(-1px); transition: all .18s ease; filter: brightness(1.06); }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,.42); }
        @media (max-width: 760px) {
          .vf-grid, .vf-actions { grid-template-columns: 1fr !important; }
          .vf-actions { display: grid !important; gap: 10px !important; }
          .vf-actions > * { width: 100%; box-sizing: border-box; justify-content: center; }
        }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav title="Message" subtitle="Controlled owner/member communication." active="messages" />

        <section style={card}>
          <div style={{ color: "#9df3bf", letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 950, fontSize: 12 }}>
            VaultForge Communication
          </div>
          <h1 style={{ fontSize: "clamp(52px,10vw,92px)", lineHeight: 0.88, margin: "12px 0 18px", letterSpacing: "-.07em" }}>
            {label(source)}.
          </h1>
          <p style={{ color: "#cbd5e1", fontSize: 20, lineHeight: 1.55 }}>
            Send one controlled message. After save, VaultForge sends you back to the inbox so the thread is visible.
          </p>

          <div style={{ marginTop: 18 }}>
            <span style={chip}>From: {fromEmail || "missing"}</span>
            <span style={chip}>Type: {source}</span>
            <span style={chip}>Signal: {signalId}</span>
            {itemId ? <span style={chip}>Item: {itemId}</span> : null}
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 22 }}>
            <Link href="/messages" style={ghost}>All Messages</Link>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
            <Link href="/signals" style={ghost}>Signals</Link>
            <Link href="/members" style={ghost}>Members</Link>
          </div>
        </section>

        {status ? <section style={card}>{status}</section> : null}

        <section style={card}>
          <div style={{ color: "#e8c46b", letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 950, fontSize: 12 }}>
            Message Details
          </div>

          <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 18 }}>
            <div>
              <label style={{ display: "block", fontWeight: 900, marginBottom: 8 }}>Your Email</label>
              <input style={input} value={fromEmail} onChange={(event) => setFromEmail(cleanEmail(event.target.value))} />
            </div>

            <div>
              <label style={{ display: "block", fontWeight: 900, marginBottom: 8 }}>Send To</label>
              <input style={input} value={toEmail} onChange={(event) => setToEmail(cleanEmail(event.target.value))} placeholder="Owner/member email if known" />
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <label style={{ display: "block", fontWeight: 900, marginBottom: 8 }}>Subject</label>
            <input style={input} value={subject} onChange={(event) => setSubject(event.target.value)} />
          </div>

          <div style={{ marginTop: 18 }}>
            <label style={{ display: "block", fontWeight: 900, marginBottom: 8 }}>Message</label>
            <textarea style={{ ...input, minHeight: 180, resize: "vertical" }} value={message} onChange={(event) => setMessage(event.target.value)} />
          </div>

          <button type="button" onClick={sendMessage} disabled={busy} style={{ ...button, width: "100%", marginTop: 22, opacity: busy ? 0.65 : 1 }}>
            {busy ? "Saving..." : "Send Message"}
          </button>
        </section>
      </div>
    </main>
  );
}
