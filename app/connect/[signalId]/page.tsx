"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const LOCAL_KEY = "vf_simple_messages_local_v1";

function clean(v: unknown) {
  return String(v || "").trim();
}

function email(v: unknown) {
  return clean(v).toLowerCase();
}

function cookie(name: string) {
  if (typeof document === "undefined") return "";
  const row = document.cookie.split(";").map((x) => x.trim()).find((x) => x.startsWith(name + "="));
  if (!row) return "";
  try {
    return decodeURIComponent(row.slice(name.length + 1));
  } catch {
    return row.slice(name.length + 1);
  }
}

function viewer(params: URLSearchParams) {
  const q = email(params.get("email") || params.get("from") || params.get("from_email") || params.get("member_email"));
  if (q.includes("@")) return q;

  const keys = ["vf_email", "vf_member_email", "vf_admin_email", "email", "memberEmail"];
  for (const key of keys) {
    const local = email(window.localStorage.getItem(key));
    if (local.includes("@")) return local;
    const session = email(window.sessionStorage.getItem(key));
    if (session.includes("@")) return session;
  }

  return email(cookie("vf_email") || cookie("vf_member_email") || cookie("vf_admin_email"));
}

function first(params: URLSearchParams, names: string[]) {
  for (const name of names) {
    const value = clean(params.get(name));
    if (value) return value;
  }
  return "";
}

function safe(value: string) {
  return clean(value).toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90);
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

function body(source: string) {
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

function readLocal() {
  try {
    const rows = JSON.parse(window.localStorage.getItem(LOCAL_KEY) || "[]");
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function writeLocal(row: Record<string, any>) {
  const rows = readLocal();
  const key = `${row.thread_id}-${row.signal_id}-${row.item_id}-${row.source}`;
  const filtered = rows.filter((r: any) => `${r.thread_id}-${r.signal_id}-${r.item_id}-${r.source}` !== key);
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify([row, ...filtered].slice(0, 300)));
}

export default function ConnectAutoSavePage({ params }: { params: { signalId: string } }) {
  const rawSignalId = decodeURIComponent(params.signalId || "");
  const [status, setStatus] = useState("Creating message and opening inbox...");

  useEffect(() => {
    async function run() {
      const search = new URLSearchParams(window.location.search || "");
      const source = first(search, ["source", "type", "context"]) || "message";
      const signalId =
        clean(rawSignalId) ||
        first(search, ["signal_id", "signalId", "alert_id", "routing_id", "id"]) ||
        first(search, ["item_id", "itemId", "pain_id", "project_id", "deal_id"]) ||
        "general-message";
      const itemId = first(search, ["item_id", "itemId", "pain_id", "project_id", "deal_id"]);
      const fromEmail = viewer(search);
      const toEmail = email(first(search, ["to", "recipient", "recipient_email", "target_email", "owner_email"])) || "owner@vaultforge.local";
      const subject = first(search, ["subject", "title"]) || label(source);
      const message = first(search, ["message", "body", "note"]) || body(source);
      const threadId = safe(`${source}-${signalId || itemId || "general-message"}`) || "general-message";

      if (!fromEmail.includes("@")) {
        setStatus("Missing login email. Go to Dashboard, then click Message Owner again.");
        return;
      }

      const now = new Date().toISOString();
      const row = {
        id: `local-${Date.now()}`,
        thread_id: threadId,
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
        metadata: { thread_id: threadId, signal_id: signalId, item_id: itemId || null, source, from_email: fromEmail, to_email: toEmail }
      };

      writeLocal(row);

      try {
        await fetch("/api/simple-messages", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-vf-email": fromEmail },
          body: JSON.stringify(row)
        });
      } catch {}

      window.location.replace("/messages");
    }

    run();
  }, [rawSignalId]);

  const page: React.CSSProperties = {
    minHeight: "100vh",
    background: "linear-gradient(180deg,#020303,#071326 55%,#020303)",
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
  };

  const button: React.CSSProperties = {
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 50,
    borderRadius: 999,
    padding: "12px 18px",
    background: "linear-gradient(135deg,#f8e7b0,#9df3bf,#b55cff)",
    color: "#06100a",
    fontWeight: 950,
    textDecoration: "none",
  };

  return (
    <main style={page}>
      <section style={card}>
        <div style={{ color: "#e8c46b", letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 950, fontSize: 12 }}>
          VaultForge Contact Handoff
        </div>
        <h1 style={{ fontSize: "clamp(46px,10vw,82px)", lineHeight: 0.9, letterSpacing: "-.06em", margin: "14px 0" }}>
          Opening inbox.
        </h1>
        <p style={{ color: "#cbd5e1", fontSize: 18, lineHeight: 1.55 }}>{status}</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 22 }}>
          <Link href="/messages" style={button}>Open Messages</Link>
          <Link href="/dashboard" style={{ ...button, background: "rgba(255,255,255,.06)", color: "white", border: "1px solid rgba(255,255,255,.16)" }}>Dashboard</Link>
        </div>
      </section>
    </main>
  );
}
