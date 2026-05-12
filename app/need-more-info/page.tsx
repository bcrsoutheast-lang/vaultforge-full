"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function clean(value: unknown) {
  return String(value || "").trim();
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

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
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

function buildThreadUrl(params: URLSearchParams) {
  const source = firstParam(params, ["source", "type", "context"]) || "alert";
  const signalId =
    firstParam(params, ["signal_id", "signalId", "alert_id", "routing_id", "id"]) ||
    firstParam(params, ["item_id", "itemId", "pain_id", "project_id", "deal_id"]) ||
    "alert-general-message";

  const itemId = firstParam(params, ["item_id", "itemId", "pain_id", "project_id", "deal_id"]);
  const to = firstParam(params, ["to", "recipient", "recipient_email", "target_email", "owner_email"]);
  const email = currentEmail(params);
  const subject = firstParam(params, ["subject", "title"]) || "Need more information";
  const message =
    firstParam(params, ["message", "body", "note"]) ||
    "I need more information about this VaultForge alert.";

  const threadId = safePart(`${source}-${signalId || itemId || "general-message"}`) || "alert-general-message";

  const next = new URLSearchParams();
  next.set("source", source);
  next.set("signal_id", signalId || "alert-general-message");
  next.set("subject", subject);
  next.set("message", message);

  if (itemId) next.set("item_id", itemId);
  if (to) next.set("to", to);
  if (email) next.set("email", email);

  return `/messages/${encodeURIComponent(threadId)}?${next.toString()}`;
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 28%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
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
  minHeight: 50,
  borderRadius: 999,
  padding: "12px 18px",
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

export default function VaultForgeConnectBridgePage() {
  const [target, setTarget] = useState("/messages/alert-general-message?source=alert&signal_id=alert-general-message");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search || "");
    const nextTarget = buildThreadUrl(params);
    setTarget(nextTarget);
    window.location.replace(nextTarget);
  }, []);

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
          VaultForge Connect Bridge
        </div>

        <h1
          style={{
            fontSize: "clamp(42px,9vw,78px)",
            lineHeight: 0.92,
            letterSpacing: "-.06em",
            margin: "0 0 18px",
          }}
        >
          Opening message thread.
        </h1>

        <p style={{ color: "#cbd5e1", fontSize: 18, lineHeight: 1.55 }}>
          This bridge no longer blocks when an alert is missing a signal id. It opens a safe
          VaultForge message thread instead.
        </p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 22 }}>
          <Link href={target} style={button}>
            Open Message Thread
          </Link>
          <Link href="/messages" style={ghost}>
            Message Center
          </Link>
          <Link href="/alerts" style={ghost}>
            Alerts
          </Link>
          <Link href="/dashboard" style={ghost}>
            Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
