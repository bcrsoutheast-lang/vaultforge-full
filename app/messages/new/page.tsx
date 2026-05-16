"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
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

  const keys = ["memberEmail", "vf_member_email", "email", "vf_email"];

  for (const key of keys) {
    try {
      const localValue = cleanEmail(window.localStorage.getItem(key));
      if (localValue.includes("@")) return localValue;

      const sessionValue = cleanEmail(window.sessionStorage.getItem(key));
      if (sessionValue.includes("@")) return sessionValue;
    } catch {
      // Continue.
    }
  }

  const cookieKeys = ["vf_member_email", "memberEmail", "email", "vf_email"];

  for (const key of cookieKeys) {
    const value = cleanEmail(readCookie(key));
    if (value.includes("@")) return value;
  }

  return "";
}

function getQuery() {
  if (typeof window === "undefined") return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

function safeDecode(value: string | null) {
  try {
    return clean(value ? decodeURIComponent(value) : "");
  } catch {
    return clean(value || "");
  }
}

function labelFromSource(source: string, type: string) {
  const key = `${source} ${type}`.toLowerCase();

  if (key.includes("pain") || key.includes("pressure")) return "Pressure Room";
  if (key.includes("deal") || key.includes("opportunity")) return "Opportunity Room";
  if (key.includes("signal")) return "Signal Room";
  if (key.includes("routing")) return "Routing Room";
  if (key.includes("project")) return "Project Room";
  if (key.includes("network") || key.includes("member")) return "Network Member";
  return "VaultForge Room";
}

function folderFromSource(source: string, type: string) {
  const key = `${source} ${type}`.toLowerCase();

  if (key.includes("pain") || key.includes("pressure")) return "pain";
  if (key.includes("deal") || key.includes("opportunity")) return "deals";
  if (key.includes("signal")) return "signals";
  if (key.includes("routing")) return "routing";
  if (key.includes("project")) return "projects";
  if (key.includes("network") || key.includes("member")) return "members";
  if (key.includes("alert")) return "alerts";
  return "general";
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 28%), radial-gradient(circle at 88% 8%, rgba(86,216,255,.10), transparent 26%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 96px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  width: "min(1080px,100%)",
  margin: "0 auto",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.24)",
  borderRadius: 28,
  padding: 22,
  background: "linear-gradient(145deg,rgba(255,255,255,.070),rgba(255,255,255,.030))",
  boxShadow: "0 28px 86px rgba(0,0,0,.30)",
  marginBottom: 18,
};

const label: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".16em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 11,
};

const muted: React.CSSProperties = {
  color: "#cbd5e1",
  lineHeight: 1.55,
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(0,0,0,.24)",
  color: "white",
  padding: 13,
  fontSize: 15,
  outline: "none",
};

const button: React.CSSProperties = {
  minHeight: 48,
  borderRadius: 999,
  padding: "12px 17px",
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
  fontWeight: 950,
  textDecoration: "none",
  border: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const ghost: React.CSSProperties = {
  ...button,
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(255,255,255,.060)",
  color: "white",
};

export default function NewMessagePage() {
  const [fromEmail, setFromEmail] = useState("");
  const [toEmail, setToEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [sentThread, setSentThread] = useState("");
  const [resolvedTitle, setResolvedTitle] = useState("");
  const [resolvedRoomType, setResolvedRoomType] = useState("");
  const [resolvedFolder, setResolvedFolder] = useState("");
  const [resolvedBackLink, setResolvedBackLink] = useState("");

  const context = useMemo(() => {
    const q = getQuery();

    const source = safeDecode(q.get("source"));
    const type = safeDecode(q.get("type"));
    const itemId = safeDecode(q.get("item_id") || q.get("itemId") || q.get("deal_id") || q.get("pain_id") || q.get("project_id"));
    const signalId = safeDecode(q.get("signal_id") || q.get("signalId"));
    const roomId = itemId || signalId || safeDecode(q.get("id"));
    const title = safeDecode(q.get("title") || q.get("room_title") || q.get("deal_title") || q.get("pain_title") || q.get("subject")) || "VaultForge Room";
    const subject = safeDecode(q.get("subject")) || title;
    const folder = safeDecode(q.get("folder") || q.get("folder_key")) || folderFromSource(source, type);
    const roomType = safeDecode(q.get("room_type")) || labelFromSource(source, type);
    const sourceRoute = safeDecode(q.get("source_route") || q.get("return_to") || q.get("room_url"));
    const matchReason = safeDecode(q.get("match_reason"));
    const recipient = cleanEmail(q.get("to") || q.get("recipient") || q.get("owner_email") || q.get("target_email"));

    return {
      source,
      type,
      itemId,
      signalId,
      roomId,
      title,
      subject,
      folder,
      roomType,
      sourceRoute,
      matchReason,
      recipient,
    };
  }, []);

  function effectiveTitle() {
    return clean(resolvedTitle || context.title || context.subject || "VaultForge Room");
  }

  function effectiveRoomType() {
    return clean(resolvedRoomType || context.roomType || "VaultForge Room");
  }

  function effectiveFolder() {
    return clean(resolvedFolder || context.folder || "general");
  }

  function effectiveRoomLink() {
    return clean(resolvedBackLink || context.sourceRoute || "");
  }

  async function resolveRoomContext(roomId: string, viewer: string) {
    const currentTitle = clean(context.title);
    const currentSubject = clean(context.subject);

    if (
      currentTitle &&
      currentTitle !== "VaultForge Room" &&
      currentTitle !== "Deal Room" &&
      currentTitle !== "Opportunity Room"
    ) {
      setResolvedTitle(currentTitle);
      return;
    }

    if (
      currentSubject &&
      currentSubject !== "VaultForge Room" &&
      currentSubject !== "Deal Room" &&
      currentSubject !== "Opportunity Room"
    ) {
      setResolvedTitle(currentSubject);
    }

    if (!roomId) return;

    const lower = `${context.source} ${context.type} ${context.folder} ${context.roomType}`.toLowerCase();
    const shouldTryPain =
      lower.includes("pain") ||
      lower.includes("pressure");

    const lookups = shouldTryPain
      ? [
          {
            kind: "pressure",
            url: `/api/pain/feed?id=${encodeURIComponent(roomId)}&email=${encodeURIComponent(viewer)}&owner=0`,
          },
          {
            kind: "opportunity",
            url: `/api/deal/detail?id=${encodeURIComponent(roomId)}`,
          },
        ]
      : [
          {
            kind: "opportunity",
            url: `/api/deal/detail?id=${encodeURIComponent(roomId)}`,
          },
          {
            kind: "pressure",
            url: `/api/pain/feed?id=${encodeURIComponent(roomId)}&email=${encodeURIComponent(viewer)}&owner=0`,
          },
        ];

    for (const item of lookups) {
      try {
        const response = await fetch(item.url, {
          cache: "no-store",
          credentials: "include",
          headers: {
            "x-vf-email": viewer,
            "x-vf-admin": "0",
          },
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok || data?.ok === false) continue;

        const row =
          data.deal ||
          data.record ||
          data.item ||
          data.pain ||
          (Array.isArray(data.pains) ? data.pains[0] : null) ||
          null;

        if (!row || typeof row !== "object") continue;

        const meta = row.metadata && typeof row.metadata === "object" ? row.metadata : {};

        const foundTitle = clean(
          row.title ||
            row.deal_title ||
            row.pain_title ||
            row.project_title ||
            row.headline ||
            row.name ||
            row.address ||
            meta.title ||
            meta.deal_title ||
            meta.pain_title
        );

        if (foundTitle) {
          setResolvedTitle(foundTitle);
        }

        if (item.kind === "pressure") {
          setResolvedRoomType("Pressure Room");
          setResolvedFolder("pain");
          setResolvedBackLink(`/pain-room/${encodeURIComponent(roomId)}`);
        } else {
          setResolvedRoomType("Opportunity Room");
          setResolvedFolder("deals");
          setResolvedBackLink(`/deal/detail?id=${encodeURIComponent(roomId)}`);
        }

        return;
      } catch {
        // Try next lookup.
      }
    }
  }

  useEffect(() => {
    const viewer = getEmail();
    setFromEmail(viewer);
    setToEmail(context.recipient || "bcrsoutheast@gmail.com");

    const roomId = context.roomId || context.itemId || context.signalId;
    resolveRoomContext(roomId, viewer);

    const startingTitle =
      context.title && context.title !== "VaultForge Room"
        ? context.title
        : context.subject && context.subject !== "VaultForge Room"
        ? context.subject
        : "";

    const opener = startingTitle
      ? `I'm requesting info / intro on ${startingTitle}.`
      : "I'm requesting info / intro from VaultForge.";

    setMessage(opener);
  }, [context]);

  async function sendMessage() {
    setStatus("Sending...");

    const payload = {
      from_email: fromEmail,
      sender_email: fromEmail,
      email: fromEmail,
      to_email: toEmail,
      recipient_email: toEmail,
      target_email: toEmail,
      owner_email: toEmail,
      item_id: context.itemId || context.roomId || null,
      signal_id: context.signalId || null,
      source: context.source || context.type || context.folder || "message",
      type: context.type || context.source || "room-message",
      folder: context.folder,
      folder_key: context.folder,
      subject: effectiveTitle(),
      title: effectiveTitle(),
      message,
      body: message,
      note: message,
      metadata: {
        room_title: effectiveTitle(),
        room_type: effectiveRoomType(),
        room_id: context.roomId,
        item_id: context.itemId || null,
        signal_id: context.signalId || null,
        source_route: effectiveRoomLink() || null,
        source: context.source || null,
        type: context.type || null,
        folder: effectiveFolder(),
        match_reason: context.matchReason || null,
        from_email: fromEmail,
        to_email: toEmail,
        subject: effectiveTitle(),
      },
    };

    const endpoints = ["/api/message-command", "/api/messages/new", "/api/simple-messages"];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-vf-email": fromEmail,
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok && data?.ok !== false) {
          const thread =
            clean(data.thread_id) ||
            clean(data.thread?.thread_id) ||
            clean(data.message?.thread_id) ||
            `${context.folder || "general"}-${context.roomId || Date.now()}`;

          setSentThread(thread);
          setStatus("Message sent with room context.");
          return;
        }
      } catch {
        // Try next endpoint.
      }
    }

    setStatus("Message saved locally could not be confirmed by backend. Try Message Command if it does not appear.");
  }

  const roomLink =
    effectiveRoomLink() ||
    (effectiveRoomType().toLowerCase().includes("pressure")
      ? context.roomId
        ? `/pain-room/${encodeURIComponent(context.roomId)}`
        : "/pressure-rooms"
      : context.roomId
      ? `/deal/detail?id=${encodeURIComponent(context.roomId)}`
      : "/dashboard");

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        input::placeholder, textarea::placeholder {
          color: rgba(255,255,255,.45);
        }

        @media(max-width:760px) {
          .vf-grid, .vf-actions {
            grid-template-columns: 1fr !important;
          }
          .vf-actions {
            display: grid !important;
            gap: 10px !important;
          }
          .vf-actions > * {
            width: 100%;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <nav style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
          <Link href="/dashboard" style={ghost}>Dashboard</Link>
          <Link href="/message-command" style={ghost}>Message Command</Link>
          <Link href={roomLink} style={ghost}>Back to Room</Link>
        </nav>

        <section style={card}>
          <div style={label}>VaultForge Message Context</div>
          <h1 style={{ fontSize: "clamp(44px,8vw,82px)", lineHeight: 0.9, letterSpacing: "-.06em", margin: "10px 0 14px" }}>
            {effectiveTitle()}
          </h1>

          <p style={{ ...muted, fontSize: 18, margin: 0 }}>
            This message is tied to the originating room so the thread does not lose the deal, pain, signal, or routing context.
          </p>

          <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10, marginTop: 16 }}>
            <section style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 18, padding: 13, background: "rgba(255,255,255,.04)" }}>
              <div style={label}>Room Type</div>
              <strong>{effectiveRoomType()}</strong>
            </section>
            <section style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 18, padding: 13, background: "rgba(255,255,255,.04)" }}>
              <div style={label}>Room ID</div>
              <strong>{context.roomId || "Not listed"}</strong>
            </section>
            <section style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 18, padding: 13, background: "rgba(255,255,255,.04)" }}>
              <div style={label}>Folder</div>
              <strong>{effectiveFolder()}</strong>
            </section>
            <section style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 18, padding: 13, background: "rgba(255,255,255,.04)" }}>
              <div style={label}>Subject</div>
              <strong>{effectiveTitle()}</strong>
            </section>
          </div>

          {context.matchReason ? (
            <section style={{ border: "1px solid rgba(232,196,107,.24)", borderRadius: 18, padding: 13, background: "rgba(232,196,107,.06)", marginTop: 12 }}>
              <div style={label}>Match Reason</div>
              <p style={{ ...muted, margin: "6px 0 0" }}>{context.matchReason}</p>
            </section>
          ) : null}
        </section>

        <section style={card}>
          <div style={label}>Send Message</div>

          <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
            <input style={input} value={fromEmail} onChange={(event) => setFromEmail(event.target.value)} placeholder="From email" />
            <input style={input} value={toEmail} onChange={(event) => setToEmail(event.target.value)} placeholder="To email" />
            <input style={input} value={effectiveTitle()} readOnly />
            <textarea
              style={{ ...input, minHeight: 150, resize: "vertical" }}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Write message..."
            />
          </div>

          <div className="vf-actions" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
            <button type="button" onClick={sendMessage} style={button}>Send Message</button>
            <Link href={roomLink} style={ghost}>Back to Room</Link>
            {sentThread ? <Link href={`/message-command/${encodeURIComponent(sentThread)}`} style={ghost}>Open Thread</Link> : null}
          </div>

          {status ? <p style={{ color: status.includes("sent") ? "#9df3bf" : "#f8e7b0", fontWeight: 900 }}>{status}</p> : null}
        </section>
      </div>
    </main>
  );
}
