"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type PainSignal = Record<string, any>;

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(181,92,255,.22), transparent 28%), radial-gradient(circle at top right, rgba(157,243,191,.16), transparent 24%), linear-gradient(180deg,#02040a 0%,#071326 50%,#030509 100%)",
  color: "white",
  padding: "28px 18px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 920, margin: "0 auto" };

const panel: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.14)",
  background:
    "linear-gradient(145deg, rgba(181,92,255,.13), rgba(157,243,191,.06), rgba(255,255,255,.035))",
  borderRadius: 28,
  padding: 22,
  marginBottom: 18,
};

const hero: React.CSSProperties = {
  ...panel,
  border: "1px solid rgba(157,243,191,.30)",
  padding: 26,
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

const btn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg,#f5d978,#9df3bf 55%,#b55cff)",
  color: "#06100a",
  textDecoration: "none",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 950,
  border: "none",
  margin: "7px 7px 0 0",
  minHeight: 46,
  cursor: "pointer",
};

const ghost: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  textDecoration: "none",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 900,
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.06)",
  margin: "7px 7px 0 0",
  minHeight: 46,
};

const eyebrow: React.CSSProperties = {
  color: "#9df3bf",
  letterSpacing: 5,
  fontWeight: 950,
  fontSize: 12,
  marginBottom: 12,
  textTransform: "uppercase",
};

const muted: React.CSSProperties = {
  color: "rgba(255,255,255,.72)",
  lineHeight: 1.55,
};

function getEmail() {
  if (typeof window === "undefined") return "";

  try {
    return (
      window.localStorage.getItem("vf_email") ||
      window.sessionStorage.getItem("vf_email") ||
      ""
    )
      .trim()
      .toLowerCase();
  } catch {
    return "";
  }
}

function asText(value: unknown, fallback = "") {
  const text = String(value || "").trim();
  return text || fallback;
}

function locationText(signal: PainSignal | null) {
  if (!signal) return "";

  return [signal.city, signal.state]
    .map((value) => asText(value))
    .filter(Boolean)
    .join(", ");
}

export default function PainMessagePage({ params }: { params: { id: string } }) {
  const [signal, setSignal] = useState<PainSignal | null>(null);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("Loading pain signal...");
  const [saving, setSaving] = useState(false);

  async function load() {
    setStatus("Loading pain signal...");

    try {
      const res = await fetch(`/api/pain/message?id=${encodeURIComponent(params.id)}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || "Could not load pain signal.");
      }

      setSignal(data.signal || null);
      setStatus("");
    } catch (error: any) {
      setStatus(error?.message || "Could not load pain signal.");
    }
  }

  async function send() {
    setStatus("");

    if (!message.trim()) {
      setStatus("Write a message before sending.");
      return;
    }

    setSaving(true);

    try {
      const email = getEmail();

      const res = await fetch("/api/pain/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": email,
        },
        body: JSON.stringify({
          pain_id: params.id,
          email,
          message,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Could not send message.");
      }

      setStatus("Message sent about this pain signal. Open Pain Messages to view the thread.");
      setMessage("");
    } catch (error: any) {
      setStatus(error?.message || "Could not send message.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    load();
  }, [params.id]);

  return (
    <main style={page}>
      <style>{`
        textarea::placeholder {
          color: rgba(255,255,255,.42);
        }

        a:hover,
        button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        @media (max-width: 760px) {
          a,
          button {
            width: 100%;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <section style={hero}>
          <div style={eyebrow}>Message About Pain Signal</div>
          <h1 style={{ fontSize: "clamp(48px,10vw,88px)", lineHeight: 0.9, margin: "0 0 18px" }}>
            Start the execution conversation.
          </h1>
          <p style={{ ...muted, fontSize: 20 }}>
            This sends a message tied to the selected Pain Button signal so the conversation is connected to the problem.
          </p>

          <Link href="/pain" style={ghost}>Pain Feed</Link>
          <Link href="/routing" style={ghost}>Routing</Link>
          <Link href="/pain-messages" style={ghost}>Pain Messages</Link>
          <Link href="/messages" style={ghost}>All Messages</Link>
        </section>

        {signal && (
          <section style={panel}>
            <div style={eyebrow}>Signal Context</div>
            <h2 style={{ fontSize: 34, margin: "0 0 10px" }}>
              {asText(signal.title, asText(signal.pain_type, "Pain Signal"))}
            </h2>
            <p style={muted}>{asText(signal.description, "No description.")}</p>
            <p style={muted}>
              {asText(signal.asset_type)}
              {locationText(signal) ? ` · ${locationText(signal)}` : ""}
            </p>
          </section>
        )}

        <section style={panel}>
          <div style={eyebrow}>Message</div>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Example: I’m interested in this signal. I can help with capital / buyer / operator / contractor solution. What is the timeline and who controls the deal?"
            style={{ ...input, minHeight: 170, resize: "vertical" }}
          />

          <button type="button" onClick={send} disabled={saving} style={btn}>
            {saving ? "Sending..." : "Send Message"}
          </button>

          {status && (
            <p style={{ color: status.toLowerCase().includes("sent") ? "#9df3bf" : "#ffd0d0", fontWeight: 950 }}>
              {status}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
