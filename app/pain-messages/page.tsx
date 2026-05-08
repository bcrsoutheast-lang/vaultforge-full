"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Thread = Record<string, any>;

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(181,92,255,.22), transparent 28%), radial-gradient(circle at top right, rgba(157,243,191,.16), transparent 24%), linear-gradient(180deg,#02040a 0%,#071326 50%,#030509 100%)",
  color: "white",
  padding: "28px 18px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1100, margin: "0 auto" };

const hero: React.CSSProperties = {
  border: "1px solid rgba(157,243,191,.30)",
  background:
    "linear-gradient(145deg, rgba(181,92,255,.13), rgba(157,243,191,.06), rgba(255,255,255,.035))",
  borderRadius: 32,
  padding: 26,
  marginBottom: 22,
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.14)",
  background:
    "linear-gradient(145deg, rgba(181,92,255,.13), rgba(157,243,191,.06), rgba(255,255,255,.035))",
  borderRadius: 28,
  padding: 22,
  marginBottom: 18,
  boxShadow: "0 26px 80px rgba(0,0,0,.34)",
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

const chip: React.CSSProperties = {
  display: "inline-flex",
  border: "1px solid rgba(157,243,191,.25)",
  color: "#9df3bf",
  background: "rgba(157,243,191,.07)",
  borderRadius: 999,
  padding: "8px 11px",
  fontWeight: 850,
  fontSize: 13,
  margin: "0 7px 7px 0",
};

function getEmail() {
  if (typeof window === "undefined") return "";
  try {
    return (
      localStorage.getItem("vf_email") ||
      sessionStorage.getItem("vf_email") ||
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

function formatDate(value: unknown) {
  const text = asText(value);
  if (!text) return "";
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return date.toLocaleString();
}

export default function PainMessagesPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [status, setStatus] = useState("Loading pain messages...");

  async function load() {
    setStatus("Loading pain messages...");

    try {
      const email = getEmail();

      const res = await fetch(`/api/pain/messages?email=${encodeURIComponent(email)}`, {
        cache: "no-store",
        headers: {
          "x-vf-email": email,
        },
      });

      const data = await res.json();

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Could not load pain messages.");
      }

      setThreads(Array.isArray(data?.threads) ? data.threads : []);
      setStatus("");
    } catch (error: any) {
      setStatus(error?.message || "Could not load pain messages.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main style={page}>
      <style>{`
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
          <div style={eyebrow}>Pain Signal Messages</div>
          <h1 style={{ fontSize: "clamp(52px,11vw,96px)", lineHeight: 0.9, margin: "0 0 18px" }}>
            Conversations tied to problems.
          </h1>
          <p style={{ ...muted, fontSize: 20 }}>
            This inbox shows message threads created from Pain Button signals so members can communicate around the exact problem.
          </p>

          <Link href="/pain" style={ghost}>Pain Feed</Link>
          <Link href="/pain-submit" style={btn}>Pain Button</Link>
          <Link href="/messages" style={ghost}>All Messages</Link>
          <button type="button" onClick={load} style={btn}>Refresh</button>
        </section>

        {status && <section style={hero}>{status}</section>}

        {!status && threads.length === 0 && (
          <section style={hero}>
            <strong>No pain message threads yet.</strong>
            <p style={muted}>
              Open a Pain signal, tap Message, and send the first note.
            </p>
          </section>
        )}

        {threads.map((thread) => {
          const latest = thread.latest_message || {};
          const pain = thread.pain || {};
          const painTitle = asText(pain.title, asText(pain.pain_type, "Pain Signal"));
          const body = asText(latest.body_text, "No message body.");
          const painId = asText(thread.pain_id);

          return (
            <article key={asText(thread.thread_key)} style={card}>
              <div style={eyebrow}>Pain Conversation</div>

              <div style={{ marginBottom: 12 }}>
                <span style={chip}>{asText(pain.asset_type, "Signal")}</span>
                <span style={chip}>{asText(pain.urgency_level, "Normal")}</span>
                {thread.unread_count > 0 && <span style={chip}>{thread.unread_count} unread</span>}
                <span style={chip}>{thread.messages?.length || 0} message{(thread.messages?.length || 0) === 1 ? "" : "s"}</span>
              </div>

              <h2 style={{ fontSize: "clamp(30px,7vw,54px)", lineHeight: 1, margin: "0 0 10px" }}>
                {painTitle}
              </h2>

              <p style={{ ...muted, fontSize: 18 }}>
                {body}
              </p>

              <p style={muted}>
                From: {asText(latest.sender_email || latest.from_email || latest.member_email, "Unknown")}
                <br />
                To: {asText(latest.recipient_email || latest.to_email, "Unknown")}
                <br />
                {formatDate(latest.created_at)}
              </p>

              {painId && <Link href={`/pain-message/${encodeURIComponent(painId)}`} style={btn}>Reply</Link>}
              <Link href="/pain" style={ghost}>Pain Feed</Link>
              <Link href="/messages" style={ghost}>All Messages</Link>
            </article>
          );
        })}
      </div>
    </main>
  );
}
