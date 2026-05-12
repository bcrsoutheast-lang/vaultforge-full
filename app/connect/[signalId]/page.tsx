"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const LOCAL_KEY = "vf_simple_messages_local_v1";

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

function currentEmail(params: URLSearchParams) {
  const queryEmail = cleanEmail(
    params.get("email") ||
      params.get("from") ||
      params.get("from_email") ||
      params.get("member_email")
  );

  if (queryEmail.includes("@")) return queryEmail;

  const keys = ["vf_email", "vf_member_email", "vf_admin_email", "email", "memberEmail"];

  for (const key of keys) {
    const local = cleanEmail(window.localStorage.getItem(key));
    if (local.includes("@")) return local;

    const session = cleanEmail(window.sessionStorage.getItem(key));
    if (session.includes("@")) return session;
  }

  return cleanEmail(
    readCookie("vf_email") ||
      readCookie("vf_member_email") ||
      readCookie("vf_admin_email")
  );
}

function firstParam(params: URLSearchParams, names: string[]) {
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

function writeLocalMessage(row: Record<string, any>) {
  const existing = readLocalMessages();
  const rowKey = `${row.thread_id}-${row.signal_id}-${row.item_id}-${row.source}-${row.subject}`;
  const filtered = existing.filter((item: Record<string, any>) => {
    const itemKey = `${item.thread_id}-${item.signal_id}-${item.item_id}-${item.source}-${item.subject}`;
    return itemKey !== rowKey;
  });

  window.localStorage.setItem(LOCAL_KEY, JSON.stringify([row, ...filtered].slice(0, 300)));
}

function fireAndForgetApiSave(row: Record<string, any>) {
  fetch("/api/simple-messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-vf-email": cleanEmail(row.from_email),
    },
    body: JSON.stringify(row),
  }).catch(() => {
    // Local inbox copy already exists.
  });
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 30%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "28px 18px 96px",
  fontFamily: "Arial, sans-serif",
};

const card: React.CSSProperties = {
  width: "min(820px,100%)",
  margin: "0 auto",
  border: "1px solid rgba(232,196,107,.28)",
  borderRadius: 30,
  padding: 26,
  background: "linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.03))",
  boxShadow: "0 28px 86px rgba(0,0,0,.32)",
};

const button: React.CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: 56,
  borderRadius: 999,
  padding: "13px 22px",
  border: 0,
  background: "linear-gradient(135deg,#f8e7b0,#9df3bf,#b55cff)",
  color: "#06100a",
  fontWeight: 950,
  textDecoration: "none",
};

const ghost: React.CSSProperties = {
  ...button,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.16)",
  color: "white",
};

const chip: React.CSSProperties = {
  display: "inline-flex",
  border: "1px solid rgba(157,243,191,.24)",
  background: "rgba(157,243,191,.08)",
  color: "#9df3bf",
  borderRadius: 999,
  padding: "8px 11px",
  fontWeight: 850,
  margin: "0 7px 7px 0",
  fontSize: 12,
};

export default function ConnectNoAutoRedirectPage({ params }: { params: { signalId: string } }) {
  const rawSignalId = decodeURIComponent(params.signalId || "");
  const startedRef = useRef(false);

  const [status, setStatus] = useState("Saving message...");
  const [threadId, setThreadId] = useState("");
  const [sourceLabel, setSourceLabel] = useState("message");
  const [signalLabel, setSignalLabel] = useState("");
  const [fromLabel, setFromLabel] = useState("");

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    try {
      const search = new URLSearchParams(window.location.search || "");
      const source = firstParam(search, ["source", "type", "context"]) || "message";

      const signalId =
        clean(rawSignalId) ||
        firstParam(search, ["signal_id", "signalId", "alert_id", "routing_id", "id"]) ||
        firstParam(search, ["item_id", "itemId", "pain_id", "project_id", "deal_id"]) ||
        "general-message";

      const itemId = firstParam(search, ["item_id", "itemId", "pain_id", "project_id", "deal_id"]);
      const fromEmail = currentEmail(search);
      const toEmail =
        cleanEmail(firstParam(search, ["to", "recipient", "recipient_email", "target_email", "owner_email"])) ||
        "owner@vaultforge.local";

      const subject = firstParam(search, ["subject", "title"]) || label(source);
      const message = firstParam(search, ["message", "body", "note"]) || defaultBody(source);
      const nextThreadId = safePart(`${source}-${signalId || itemId || "general-message"}`) || "general-message";

      setSourceLabel(source);
      setSignalLabel(signalId);
      setFromLabel(fromEmail);
      setThreadId(nextThreadId);

      if (!fromEmail.includes("@")) {
        setStatus("Missing login email. Go to Dashboard, then click Message Owner again.");
        return;
      }

      const now = new Date().toISOString();

      const row = {
        id: `local-${Date.now()}`,
        thread_id: nextThreadId,
        from_email: fromEmail,
        sender_email: fromEmail,
        to_email: toEmail,
        recipient_email: toEmail,
        target_email: toEmail,
        owner_email: toEmail,
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
          thread_id: nextThreadId,
          signal_id: signalId,
          item_id: itemId || null,
          source,
          from_email: fromEmail,
          to_email: toEmail,
          subject,
        },
      };

      writeLocalMessage(row);
      fireAndForgetApiSave(row);

      setStatus("Message saved. Open Messages to view it.");
    } catch (error: any) {
      setStatus(error?.message || "Could not create message. Use Open Messages below.");
    }
  }, [rawSignalId]);

  return (
    <main style={page}>
      <section style={card}>
        <div
          style={{
            color: "#e8c46b",
            letterSpacing: ".18em",
            textTransform: "uppercase",
            fontWeight: 950,
            fontSize: 12,
            marginBottom: 12,
          }}
        >
          VaultForge Contact Handoff
        </div>

        <h1
          style={{
            fontSize: "clamp(46px,10vw,82px)",
            lineHeight: 0.9,
            letterSpacing: "-.06em",
            margin: "0 0 18px",
          }}
        >
          Message saved.
        </h1>

        <p style={{ color: "#cbd5e1", fontSize: 18, lineHeight: 1.55 }}>
          {status}
        </p>

        <div style={{ marginTop: 18 }}>
          {fromLabel ? <span style={chip}>From: {fromLabel}</span> : null}
          {sourceLabel ? <span style={chip}>Type: {sourceLabel}</span> : null}
          {signalLabel ? <span style={chip}>Signal: {signalLabel}</span> : null}
          {threadId ? <span style={chip}>Thread: {threadId}</span> : null}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 24 }}>
          <Link href="/messages" style={button}>
            Open Messages
          </Link>
          {threadId ? (
            <Link href={`/messages/${encodeURIComponent(threadId)}`} style={ghost}>
              Open Thread
            </Link>
          ) : null}
          <Link href="/dashboard" style={ghost}>
            Dashboard
          </Link>
          <Link href="/alerts" style={ghost}>
            Alerts
          </Link>
        </div>
      </section>
    </main>
  );
}
