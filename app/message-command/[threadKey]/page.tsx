"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type MessageRow = Record<string, any>;

function clean(v: unknown) {
  return String(v || "").trim();
}

function lower(v: unknown) {
  return clean(v).toLowerCase();
}

function readCookie(n: string) {
  if (typeof document === "undefined") return "";

  const m = document.cookie
    .split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${n}=`));

  if (!m) return "";

  try {
    return decodeURIComponent(m.slice(n.length + 1));
  } catch {
    return m.slice(n.length + 1);
  }
}

function currentEmail() {
  if (typeof window === "undefined") return "";

  for (const k of [
    "vf_email",
    "vf_member_email",
    "vf_admin_email",
    "email",
    "memberEmail",
  ]) {
    const l = lower(window.localStorage.getItem(k));
    if (l.includes("@")) return l;

    const s = lower(window.sessionStorage.getItem(k));
    if (s.includes("@")) return s;
  }

  return lower(
    readCookie("vf_email") ||
      readCookie("vf_member_email") ||
      readCookie("vf_admin_email")
  );
}

async function safeJson(r: Response) {
  try {
    return await r.json();
  } catch {
    return {};
  }
}

function titleOf(r: MessageRow) {
  return clean(r.title || r.subject || "VaultForge conversation").replace(
    /^(re:\s*)+/gi,
    ""
  );
}

function bodyOf(r: MessageRow) {
  return clean(r.message || r.body || r.note || "");
}

function sourceOfThread(k: string) {
  const v = lower(k);

  return v.includes(":") ? v.split(":")[0] || "general" : "general";
}

function roomForSource(s: string) {
  if (s === "pain") return "Pain Coordination";
  if (s === "project") return "Deal Coordination";
  if (s === "member") return "Member Coordination";
  if (s === "alert") return "Execution Coordination";
  if (s === "signal") return "Execution Coordination";
  if (s === "routing") return "Execution Coordination";
  if (s === "introduction") return "Execution Coordination";
  return "General Coordination";
}

export default function MessageThreadPage({
  params,
}: {
  params: { threadKey: string };
}) {
  const threadKey = decodeURIComponent(params.threadKey || "");
  const source = sourceOfThread(threadKey);
  const room = roomForSource(source);

  const backHref = `/message-command`;

  const [email, setEmail] = useState("");
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState("Loading conversation...");
  const [busy, setBusy] = useState(false);
  const [busyAction, setBusyAction] = useState("");

  const title = useMemo(
    () =>
      typeof window === "undefined"
        ? "Execution Room"
        : clean(
            new URLSearchParams(window.location.search).get("title") ||
              "Execution Room"
          ),
    []
  );

  async function load() {
    const viewer = currentEmail();

    setEmail(viewer);
    setStatus("Loading conversation...");

    try {
      const res = await fetch(
        `/api/message-command?mode=thread&thread_key=${encodeURIComponent(
          threadKey
        )}&email=${encodeURIComponent(viewer)}`,
        {
          cache: "no-store",
          headers: {
            "x-vf-email": viewer,
          },
        }
      );

      const data = await safeJson(res);

      const rows = Array.isArray(data.messages) ? data.messages : [];

      setMessages(rows);
      setStatus("");

      if (rows.length) {
        await fetch("/api/message-command", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-vf-email": viewer,
          },
          body: JSON.stringify({
            action: "read",
            ids: rows
              .map((m: MessageRow) => clean(m.id))
              .filter(Boolean),
            email: viewer,
            thread_key: threadKey,
            action_scope: "thread",
          }),
        });
      }
    } catch (e: any) {
      setStatus(e?.message || "Could not load conversation.");
    }
  }

  useEffect(() => {
    load();
  }, [threadKey]);

  async function apiAction(action: string, ids: string[] = []) {
    const viewer = email || currentEmail();

    const res = await fetch("/api/message-command", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-vf-email": viewer,
      },
      body: JSON.stringify({
        action,
        ids,
        email: viewer,
        thread_key: threadKey,
        action_scope: "thread",
      }),
    });

    const data = await safeJson(res);

    if (!res.ok || data?.ok === false) {
      throw new Error(data?.details || data?.error || "Action failed.");
    }
  }

  async function sendReply() {
    const text = clean(reply);

    if (!text) {
      setStatus("Write a reply first.");
      return;
    }

    const viewer = email || currentEmail();

    if (!viewer.includes("@")) {
      setStatus("Missing signed-in email.");
      return;
    }

    const latest = messages[messages.length - 1] || {};

    const latestFrom = lower(latest.from_email);
    const latestTo = lower(latest.to_email || latest.owner_email);

    const toEmail =
      latestFrom && latestFrom !== viewer
        ? latestFrom
        : latestTo || "bcrsoutheast@gmail.com";

    setBusy(true);
    setStatus("Sending reply...");

    try {
      const res = await fetch("/api/message-command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": viewer,
        },
        body: JSON.stringify({
          thread_key: threadKey,
          source,
          from_email: viewer,
          to_email: toEmail,
          subject: titleOf(latest) || title,
          title: titleOf(latest) || title,
          message: text,
          body: text,
          note: text,
        }),
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(
          data?.details || data?.error || "Reply could not be sent."
        );
      }

      setReply("");

      await load();

      setStatus("Reply sent.");
    } catch (e: any) {
      setStatus(e?.message || "Reply could not be sent.");
    } finally {
      setBusy(false);
    }
  }

  async function threadAction(
    action: "archive" | "delete" | "save" | "unsave"
  ) {
    const ids = messages
      .map((m) => clean(m.id))
      .filter(Boolean);

    setBusyAction(action);
    setStatus(`${action}...`);

    try {
      await apiAction(action, ids);

      if (action === "archive" || action === "delete") {
        window.location.href = backHref;
        return;
      }

      await load();

      setStatus(`${action} complete.`);
    } catch (e: any) {
      setStatus(e?.message || "Action failed.");
    } finally {
      setBusyAction("");
    }
  }

  return (
    <main style={page}>
      <style>{`
        a:hover,button:hover{
          transform:translateY(-1px);
          filter:brightness(1.06);
          transition:all .16s ease
        }

        textarea::placeholder{
          color:rgba(255,255,255,.45)
        }

        @media(max-width:760px){
          .vf-actions{
            display:grid!important;
            grid-template-columns:1fr!important
          }

          .vf-actions>*{
            width:100%;
            box-sizing:border-box;
            justify-content:center
          }
        }
      `}</style>

      <div style={wrap}>
        <nav style={nav}>
          <Link href={backHref} style={navButtonActive}>
            Back to Messages
          </Link>

          <Link href="/dashboard" style={navButton}>
            Dashboard
          </Link>

          <Link href="/projects" style={navButton}>
            Projects
          </Link>

          <Link href="/pain-feed" style={navButton}>
            Pain Feed
          </Link>

          <Link href="/members" style={navButton}>
            Members
          </Link>
        </nav>

        <section style={hero}>
          <div style={eyebrow}>VaultForge Execution Communications</div>

          <h1 style={heroTitle}>{title}</h1>

          <p style={heroSubtitle}>
            AI routing remains in the background. Members work conversations,
            opportunities, pressure situations, and execution directly from the
            room.
          </p>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={chip}>{room}</span>
            <span style={chip}>Messages: {messages.length}</span>
            <span style={chip}>{email || "Browser Session"}</span>
          </div>

          <div className="vf-actions" style={actionRow}>
            <Link href={backHref} style={button}>
              Close Room
            </Link>

            <button type="button" onClick={load} style={ghost}>
              Refresh
            </button>

            <button
              type="button"
              onClick={() => threadAction("save")}
              disabled={!!busyAction}
              style={savedButton}
            >
              Save Conversation
            </button>

            <button
              type="button"
              onClick={() => threadAction("unsave")}
              disabled={!!busyAction}
              style={ghost}
            >
              Remove Save
            </button>

            <button
              type="button"
              onClick={() => threadAction("archive")}
              disabled={!!busyAction || !messages.length}
              style={ghost}
            >
              Archive
            </button>

            <button
              type="button"
              onClick={() => threadAction("delete")}
              disabled={!!busyAction || !messages.length}
              style={danger}
            >
              Delete
            </button>
          </div>
        </section>

        <section style={{ display: "grid", gap: 16 }}>
          {messages.map((m) => (
            <article
              key={clean(m.id) || `${m.created_at}-${m.message}`}
              style={card}
            >
              <div style={cardTop}>
                <div>
                  <div style={cardEyebrow}>Conversation</div>

                  <h2 style={msgTitle}>{titleOf(m)}</h2>
                </div>

                <span style={m.read === true ? chip : unreadChip}>
                  {m.read === true ? "Read" : "Unread"}
                </span>
              </div>

              <p style={body}>{bodyOf(m)}</p>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={chip}>
                  From: {m.from_email || "unknown"}
                </span>

                <span style={chip}>
                  To: {m.to_email || "unknown"}
                </span>

                <span style={chip}>{m.created_at || ""}</span>
              </div>
            </article>
          ))}
        </section>

        <section style={hero}>
          <div style={eyebrow}>Reply</div>

          <h2 style={replyTitle}>Continue Conversation</h2>

          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write your reply..."
            style={textarea}
          />

          <button
            type="button"
            onClick={sendReply}
            disabled={busy}
            style={{ ...button, opacity: busy ? 0.65 : 1 }}
          >
            {busy ? "Sending..." : "Send Reply"}
          </button>
        </section>

        {status ? <section style={statusBox}>{status}</section> : null}
      </div>
    </main>
  );
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 28%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 96px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  width: "min(980px,100%)",
  margin: "0 auto",
};

const nav: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginBottom: 18,
};

const navButton: React.CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  borderRadius: 999,
  padding: "12px 16px",
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.14)",
  color: "white",
  textDecoration: "none",
  fontWeight: 800,
};

const navButtonActive: React.CSSProperties = {
  ...navButton,
  background: "rgba(232,196,107,.14)",
  border: "1px solid rgba(232,196,107,.28)",
  color: "#f8e7b0",
};

const hero: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.22)",
  borderRadius: 30,
  padding: 24,
  marginBottom: 18,
  background:
    "linear-gradient(145deg,rgba(255,255,255,.07),rgba(255,255,255,.025))",
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

const heroTitle: React.CSSProperties = {
  fontSize: "clamp(48px,10vw,92px)",
  lineHeight: 0.88,
  letterSpacing: "-.07em",
  margin: "12px 0 18px",
};

const heroSubtitle: React.CSSProperties = {
  color: "#cbd5e1",
  lineHeight: 1.6,
  maxWidth: 860,
  marginTop: -6,
  marginBottom: 18,
};

const chip: React.CSSProperties = {
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,.12)",
  padding: "8px 12px",
  fontSize: 12,
  color: "#dbeafe",
  display: "inline-flex",
};

const unreadChip: React.CSSProperties = {
  ...chip,
  border: "1px solid rgba(248,113,113,.32)",
  background: "rgba(248,113,113,.10)",
  color: "#fecaca",
  fontWeight: 900,
};

const actionRow: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginTop: 18,
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 24,
  padding: 20,
  background: "rgba(255,255,255,.035)",
};

const cardTop: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "flex-start",
};

const cardEyebrow: React.CSSProperties = {
  color: "#e8c46b",
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: ".12em",
  textTransform: "uppercase",
};

const msgTitle: React.CSSProperties = {
  fontSize: 28,
  margin: "8px 0 12px",
};

const body: React.CSSProperties = {
  color: "#dbeafe",
  fontSize: 19,
  lineHeight: 1.55,
};

const textarea: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  minHeight: 170,
  borderRadius: 18,
  background: "#081224",
  color: "white",
  padding: 16,
  border: "1px solid rgba(255,255,255,.12)",
  marginBottom: 16,
  outline: "none",
  fontSize: 16,
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
  fontWeight: 950,
  border: 0,
  cursor: "pointer",
};

const ghost: React.CSSProperties = {
  ...button,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.14)",
  color: "white",
};

const savedButton: React.CSSProperties = {
  ...button,
  background: "rgba(232,196,107,.14)",
  border: "1px solid rgba(232,196,107,.35)",
  color: "#f8e7b0",
};

const danger: React.CSSProperties = {
  ...button,
  background: "rgba(248,113,113,.12)",
  border: "1px solid rgba(248,113,113,.28)",
  color: "#fecaca",
};

const replyTitle: React.CSSProperties = {
  marginTop: 10,
  fontSize: 34,
  letterSpacing: "-.04em",
};

const statusBox: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.22)",
  borderRadius: 24,
  padding: 18,
  background: "rgba(255,255,255,.04)",
  color: "#f8e7b0",
  fontWeight: 700,
};
