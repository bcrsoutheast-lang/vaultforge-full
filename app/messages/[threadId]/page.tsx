"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type MessageRow = Record<string, any>;

function clean(value: unknown) {
  return String(value || "").trim();
}

function first(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }

  return "";
}

function currentEmail() {
  if (typeof window === "undefined") return "";

  return (
    window.localStorage.getItem("vf_email") ||
    window.localStorage.getItem("email") ||
    ""
  );
}

function threadKeyOf(row: MessageRow) {
  return first(row.thread_key, row.metadata?.thread_key);
}

function threadIdOf(row: MessageRow) {
  return first(row.thread_id, row.metadata?.thread_id);
}

function titleOf(row: MessageRow) {
  return (
    first(row.subject, row.title, "VaultForge message")
      .replace(/^(re:\s*)+/gi, "")
      .trim() || "VaultForge message"
  );
}

function bodyOf(row: MessageRow) {
  return first(row.message, row.body, row.note);
}

function createdOf(row: MessageRow) {
  return first(row.created_at, row.updated_at);
}

export default function ThreadPage({
  params,
}: {
  params: { threadId: string };
}) {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState("Loading thread...");

  const threadKey = useMemo(() => {
    if (typeof window === "undefined") return "";

    return (
      new URLSearchParams(window.location.search).get("thread_key") || ""
    );
  }, []);

  async function load() {
    try {
      const email = currentEmail();

      const response = await fetch(
        `/api/simple-messages?email=${encodeURIComponent(email)}`,
        {
          cache: "no-store",
          headers: {
            "x-vf-email": email,
          },
        }
      );

      const data = await response.json();

      const rows = Array.isArray(data.messages)
        ? data.messages
        : [];

      const filtered = rows.filter((row: MessageRow) => {
        if (threadKey) {
          return threadKeyOf(row) === threadKey;
        }

        return (
          threadIdOf(row) === decodeURIComponent(params.threadId || "")
        );
      });

      filtered.sort((a: MessageRow, b: MessageRow) =>
        createdOf(a).localeCompare(createdOf(b))
      );

      setMessages(filtered);
      setStatus(filtered.length ? "" : "No messages.");
    } catch (error) {
      console.error(error);
      setStatus("Could not load thread.");
    }
  }

  useEffect(() => {
    load();
  }, [params.threadId, threadKey]);

  return (
    <main style={page}>
      <div style={wrap}>
        <section style={hero}>
          <div style={eyebrow}>VaultForge Thread</div>

          <h1 style={heroTitle}>
            Message Room.
          </h1>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={chip}>
              Thread Key: {threadKey || "none"}
            </span>

            <span style={chip}>
              Messages: {messages.length}
            </span>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <Link href="/messages" style={button}>
              Back to Messages
            </Link>
          </div>
        </section>

        <section style={{ display: "grid", gap: 16 }}>
          {messages.map((message, index) => (
            <article
              key={`${threadIdOf(message)}-${index}`}
              style={card}
            >
              <h2 style={title}>
                {titleOf(message)}
              </h2>

              <p style={body}>
                {bodyOf(message)}
              </p>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={chip}>
                  From: {first(message.from_email, message.sender_email)}
                </span>

                <span style={chip}>
                  To: {first(message.to_email, message.recipient_email)}
                </span>

                <span style={chip}>
                  {createdOf(message)}
                </span>
              </div>
            </article>
          ))}
        </section>

        <section style={hero}>
          <h2>Reply</h2>

          <textarea
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            placeholder="Reply UI only for now."
            style={textarea}
          />

          <button style={button}>
            Send Reply
          </button>
        </section>

        {status ? (
          <section style={hero}>
            {status}
          </section>
        ) : null}
      </div>
    </main>
  );
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 96px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  width: "min(980px,100%)",
  margin: "0 auto",
};

const hero: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.18)",
  borderRadius: 28,
  padding: 24,
  marginBottom: 22,
  background: "rgba(255,255,255,.03)",
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  fontWeight: 900,
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontSize: 12,
};

const heroTitle: React.CSSProperties = {
  fontSize: "clamp(48px,10vw,90px)",
  lineHeight: .9,
  margin: "12px 0",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 24,
  padding: 20,
  background: "rgba(255,255,255,.03)",
};

const title: React.CSSProperties = {
  fontSize: 28,
  marginBottom: 12,
};

const body: React.CSSProperties = {
  color: "#dbeafe",
  lineHeight: 1.5,
  fontSize: 18,
};

const chip: React.CSSProperties = {
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,.12)",
  padding: "8px 12px",
  fontSize: 12,
  color: "#dbeafe",
};

const textarea: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  minHeight: 160,
  borderRadius: 18,
  background: "#081224",
  color: "white",
  padding: 16,
  border: "1px solid rgba(255,255,255,.12)",
  marginBottom: 16,
};

const button: React.CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  borderRadius: 999,
  padding: "14px 20px",
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
  textDecoration: "none",
  fontWeight: 900,
  border: 0,
};
