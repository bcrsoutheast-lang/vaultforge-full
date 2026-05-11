"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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

function getEmail() {
  if (typeof window === "undefined") return "";

  return (
    window.localStorage.getItem("vf_email") ||
    window.sessionStorage.getItem("vf_email") ||
    readCookie("vf_email") ||
    readCookie("vf_member_email") ||
    readCookie("vf_admin_email") ||
    ""
  )
    .trim()
    .toLowerCase();
}

export default function NeedMoreInfoBridgePage() {
  const [target, setTarget] = useState("");
  const [message, setMessage] = useState("Opening simple owner message...");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const signalId = clean(params.get("signal_id") || params.get("signalId") || params.get("alert_id"));
    const itemId = clean(params.get("item_id") || params.get("itemId") || params.get("pain_id") || params.get("deal_id"));
    const email = clean(params.get("email") || getEmail());

    if (signalId) {
      const url = new URL(`/connect/${encodeURIComponent(signalId)}`, window.location.origin);
      if (email) url.searchParams.set("email", email);
      if (itemId) url.searchParams.set("item_id", itemId);

      setTarget(url.pathname + url.search);
      window.location.replace(url.pathname + url.search);
      return;
    }

    setMessage("Missing signal_id. Go back to Alerts and open Need More Info from an alert card.");
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg,#020303,#071326)",
        color: "white",
        padding: 24,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <section
        style={{
          maxWidth: 820,
          margin: "0 auto",
          border: "1px solid rgba(232,196,107,.28)",
          borderRadius: 28,
          padding: 24,
          background: "rgba(255,255,255,.06)",
        }}
      >
        <p style={{ color: "#e8c46b", fontWeight: 950, letterSpacing: ".18em" }}>VAULTFORGE CONNECT BRIDGE</p>
        <h1>Need more info.</h1>
        <p>{message}</p>
        {target ? (
          <Link href={target} style={{ color: "#e8c46b" }}>
            Open Connect
          </Link>
        ) : (
          <Link href="/alerts" style={{ color: "#e8c46b" }}>
            Back to Alerts
          </Link>
        )}
      </section>
    </main>
  );
}
