"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function clean(value: unknown) {
  return String(value || "").trim();
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

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
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

function firstParam(params: URLSearchParams, names: string[]) {
  for (const name of names) {
    const value = clean(params.get(name));
    if (value) return value;
  }
  return "";
}

function buildConnectUrl(params: URLSearchParams) {
  const source = firstParam(params, ["source", "type", "context"]) || "alert";
  const signalId =
    firstParam(params, ["signal_id", "signalId", "alert_id", "routing_id", "id"]) ||
    firstParam(params, ["item_id", "itemId", "pain_id", "project_id", "deal_id"]) ||
    "alert-general-message";

  const itemId = firstParam(params, ["item_id", "itemId", "pain_id", "project_id", "deal_id"]);
  const to = firstParam(params, ["to", "recipient", "recipient_email", "target_email", "owner_email"]);
  const email = currentEmail(params);
  const subject = firstParam(params, ["subject", "title"]) || "Need more information";
  const message = firstParam(params, ["message", "body", "note"]) || "I need more information about this VaultForge alert.";

  const next = new URLSearchParams();
  next.set("source", source);
  next.set("subject", subject);
  next.set("message", message);

  if (itemId) next.set("item_id", itemId);
  if (to) next.set("to", to);
  if (email) next.set("email", email);

  return `/connect/${encodeURIComponent(signalId)}?${next.toString()}`;
}

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

export default function VaultForgeConnectBridgePage() {
  const [target, setTarget] = useState("/connect/alert-general-message?source=alert");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search || "");
    const nextTarget = buildConnectUrl(params);
    setTarget(nextTarget);
    window.location.replace(nextTarget);
  }, []);

  return (
    <main style={page}>
      <section style={card}>
        <div style={{ color: "#e8c46b", letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 950, fontSize: 12 }}>
          VaultForge Connect Bridge
        </div>
        <h1 style={{ fontSize: "clamp(42px,9vw,78px)", lineHeight: 0.92, letterSpacing: "-.06em", margin: "14px 0" }}>
          Opening message.
        </h1>
        <p style={{ color: "#cbd5e1", fontSize: 18, lineHeight: 1.55 }}>
          Missing signal id no longer blocks. VaultForge is opening a safe alert message.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 22 }}>
          <Link href={target} style={button}>Open Message</Link>
          <Link href="/messages" style={{ ...button, background: "rgba(255,255,255,.06)", color: "white", border: "1px solid rgba(255,255,255,.16)" }}>Message Center</Link>
        </div>
      </section>
    </main>
  );
}
