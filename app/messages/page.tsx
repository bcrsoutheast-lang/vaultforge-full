"use client";

import { Suspense, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function clean(value: unknown) {
  return String(value || "").trim();
}

function firstParam(params: URLSearchParams, names: string[]) {
  for (const name of names) {
    const value = clean(params.get(name));
    if (value) return value;
  }

  return "";
}

function buildConnectUrl(params: URLSearchParams) {
  const signalId =
    firstParam(params, ["signal_id", "signalId", "alert_id", "routing_id", "id"]) ||
    firstParam(params, ["item_id", "itemId", "pain_id", "project_id", "deal_id"]) ||
    "general-message";

  const next = new URLSearchParams();

  const email = firstParam(params, ["email", "from", "from_email", "member_email"]);
  const to = firstParam(params, ["to", "recipient", "recipient_email", "target_email", "owner_email"]);
  const itemId = firstParam(params, ["item_id", "itemId", "pain_id", "project_id", "deal_id"]);
  const subject = firstParam(params, ["subject", "title"]);
  const message = firstParam(params, ["message", "body", "note"]);
  const source = firstParam(params, ["source", "type", "context"]) || "message";

  if (email) next.set("email", email);
  if (to) next.set("to", to);
  if (itemId) next.set("item_id", itemId);
  if (subject) next.set("subject", subject);
  if (message) next.set("message", message);
  next.set("source", source);

  return `/connect/${encodeURIComponent(signalId)}?${next.toString()}`;
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
  width: "min(780px,100%)",
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

function RedirectBody() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const target = useMemo(() => {
    return buildConnectUrl(new URLSearchParams(searchParams.toString()));
  }, [searchParams]);

  useEffect(() => {
    router.replace(target);
  }, [router, target]);

  return (
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
        VaultForge Message Redirect
      </div>

      <h1
        style={{
          fontSize: "clamp(46px,10vw,82px)",
          lineHeight: 0.9,
          letterSpacing: "-.06em",
          margin: "0 0 18px",
        }}
      >
        Opening message window.
      </h1>

      <p style={{ color: "#cbd5e1", fontSize: 18, lineHeight: 1.55 }}>
        The old new-message form has been retired. VaultForge is opening the shared
        controlled message window instead.
      </p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 22 }}>
        <Link href={target} style={button}>
          Open Message Window
        </Link>
        <Link href="/messages" style={ghost}>
          Message Center
        </Link>
        <Link href="/dashboard" style={ghost}>
          Dashboard
        </Link>
      </div>
    </section>
  );
}

function LoadingBody() {
  return (
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
        VaultForge Message Redirect
      </div>

      <h1
        style={{
          fontSize: "clamp(46px,10vw,82px)",
          lineHeight: 0.9,
          letterSpacing: "-.06em",
          margin: "0 0 18px",
        }}
      >
        Opening message window.
      </h1>

      <p style={{ color: "#cbd5e1", fontSize: 18, lineHeight: 1.55 }}>
        Loading message context...
      </p>
    </section>
  );
}

export default function NewMessageRedirectPage() {
  return (
    <main style={page}>
      <Suspense fallback={<LoadingBody />}>
        <RedirectBody />
      </Suspense>
    </main>
  );
}
