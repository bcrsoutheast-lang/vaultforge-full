"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function clean(value: unknown) { return String(value || "").trim(); }
function firstParam(params: URLSearchParams, names: string[]) { for (const name of names) { const value = clean(params.get(name)); if (value) return value; } return ""; }

export default function MessageNewBridge() {
  const [target, setTarget] = useState("");
  const [message, setMessage] = useState("Opening simple message system...");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const signalId = firstParam(params, ["signal_id", "signalId", "alert_id"]);
    const email = firstParam(params, ["email", "from", "viewer"]);
    const itemId = firstParam(params, ["item_id", "itemId", "pain_id", "deal_id", "project_id"]);
    if (signalId) {
      const url = new URL(`/connect/${encodeURIComponent(signalId)}`, window.location.origin);
      if (email) url.searchParams.set("email", email);
      if (itemId) url.searchParams.set("item_id", itemId);
      setTarget(url.pathname + url.search);
      window.location.replace(url.pathname + url.search);
      return;
    }
    setMessage("This page needs a signal_id. Open Message Owner from Pain Feed or Signal Room.");
  }, []);

  return <main style={{ minHeight: "100vh", background: "linear-gradient(180deg,#020303,#071326)", color: "white", padding: 24, fontFamily: "Arial, sans-serif" }}><section style={{ maxWidth: 820, margin: "0 auto", border: "1px solid rgba(232,196,107,.28)", borderRadius: 28, padding: 24, background: "rgba(255,255,255,.06)" }}><p style={{ color: "#e8c46b", fontWeight: 950, letterSpacing: ".18em" }}>VAULTFORGE MESSAGE BRIDGE</p><h1>Simple messages.</h1><p>{message}</p>{target ? <Link href={target} style={{ color: "#e8c46b" }}>Open Connect</Link> : <Link href="/pain-feed" style={{ color: "#e8c46b" }}>Pain Feed</Link>}</section></main>;
}
