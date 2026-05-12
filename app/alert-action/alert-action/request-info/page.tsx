"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
  const q = email(params.get("email") || params.get("from") || params.get("from_email"));
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

function build(params: URLSearchParams) {
  const source = first(params, ["source", "type", "context"]) || "alert";
  const signalId =
    first(params, ["signal_id", "signalId", "alert_id", "routing_id", "id"]) ||
    first(params, ["item_id", "itemId", "pain_id", "project_id", "deal_id"]) ||
    "alert-general-message";

  const next = new URLSearchParams();
  next.set("source", source);
  next.set("subject", first(params, ["subject", "title"]) || "Need more information");
  next.set("message", first(params, ["message", "body", "note"]) || "I need more information about this VaultForge alert.");

  const itemId = first(params, ["item_id", "itemId", "pain_id", "project_id", "deal_id"]);
  const to = first(params, ["to", "recipient", "recipient_email", "target_email", "owner_email"]);
  const e = viewer(params);

  if (itemId) next.set("item_id", itemId);
  if (to) next.set("to", to);
  if (e) next.set("email", e);

  return `/connect/${encodeURIComponent(signalId)}?${next.toString()}`;
}

export default function BridgePage() {
  const [target, setTarget] = useState("/connect/alert-general-message?source=alert");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search || "");
    const next = build(params);
    setTarget(next);
    window.location.replace(next);
  }, []);

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg,#020303,#071326)", color: "white", padding: 28, fontFamily: "Arial, sans-serif" }}>
      <section style={{ border: "1px solid rgba(232,196,107,.28)", borderRadius: 30, padding: 26, background: "rgba(255,255,255,.06)" }}>
        <div style={{ color: "#e8c46b", letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 950, fontSize: 12 }}>VaultForge Connect Bridge</div>
        <h1>Opening message.</h1>
        <p style={{ color: "#cbd5e1" }}>VaultForge is opening a safe message thread.</p>
        <Link href={target} style={{ color: "#e8c46b", fontWeight: 900 }}>Open Message</Link>
      </section>
    </main>
  );
}
