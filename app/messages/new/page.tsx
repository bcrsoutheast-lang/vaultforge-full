"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type RoomContext = {
  to: string;
  from: string;
  subject: string;
  title: string;
  roomType: string;
  roomId: string;
  signalId: string;
  folder: string;
  source: string;
  sourceRoute: string;
  matchReason: string;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

  const keys = ["vf_email", "vf_member_email", "memberEmail", "email"];

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

  const cookieValue = cleanEmail(readCookie("vf_email") || readCookie("vf_member_email"));
  return cookieValue.includes("@") ? cookieValue : "";
}

function first(...values: unknown[]) {
  for (const value of values) {
    if (Array.isArray(value)) {
      const found = value.find((item) => clean(item));
      if (found !== undefined) return clean(found);
      continue;
    }

    const text = clean(value);
    if (text) return text;
  }

  return "";
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseReferrerContext() {
  if (typeof document === "undefined") {
    return {
      roomId: "",
      roomType: "",
      sourceRoute: "",
      source: "",
      folder: "",
    };
  }

  const ref = clean(document.referrer);
  if (!ref) {
    return {
      roomId: "",
      roomType: "",
      sourceRoute: "",
      source: "",
      folder: "",
    };
  }

  try {
    const url = new URL(ref);
    const path = url.pathname;
    const parts = path.split("/").filter(Boolean).map(safeDecode);

    if (path.includes("/pain-room/")) {
      const id = clean(parts[parts.length - 1]);
      return {
        roomId: id,
        roomType: "Pressure Room",
        sourceRoute: `/pain-room/${encodeURIComponent(id)}`,
        source: "pressure-room",
        folder: "pain",
      };
    }

    if (path.includes("/routing-room/")) {
      const id = clean(parts[parts.length - 1]);
      return {
        roomId: id,
        roomType: "Routing Room",
        sourceRoute: `/routing-room/${encodeURIComponent(id)}`,
        source: "routing-room",
        folder: "routing",
      };
    }

    if (path.includes("/signals/")) {
      const id = clean(parts[parts.length - 1]);
      return {
        roomId: id,
        roomType: "Signal Room",
        sourceRoute: `/signals/${encodeURIComponent(id)}`,
        source: "signal-room",
        folder: "signals",
      };
    }

    if (path.includes("/deal/detail")) {
      const id = clean(url.searchParams.get("id"));
      return {
        roomId: id,
        roomType: "Opportunity Room",
        sourceRoute: id ? `/deal/detail?id=${encodeURIComponent(id)}` : "/deal/detail",
        source: "opportunity-room",
        folder: "deals",
      };
    }
  } catch {
    // Continue.
  }

  return {
    roomId: "",
    roomType: "",
    sourceRoute: "",
    source: "",
    folder: "",
  };
}

function readQueryContext(): RoomContext {
  if (typeof window === "undefined") {
    return {
      to: "bcrsoutheast@gmail.com",
      from: "",
      subject: "VaultForge Room",
      title: "VaultForge Room",
      roomType: "VaultForge Room",
      roomId: "",
      signalId: "",
      folder: "general",
      source: "message",
      sourceRoute: "",
      matchReason: "",
    };
  }

  const params = new URLSearchParams(window.location.search);
  const ref = parseReferrerContext();

  const roomId =
    clean(params.get("room_id")) ||
    clean(params.get("item_id")) ||
    clean(params.get("deal_id")) ||
    clean(params.get("pain_id")) ||
    clean(params.get("signal_id")) ||
    ref.roomId;

  const roomType =
    clean(params.get("room_type")) ||
    clean(params.get("type")) ||
    ref.roomType ||
    "VaultForge Room";

  const title =
    clean(params.get("room_title")) ||
    clean(params.get("title")) ||
    clean(params.get("subject")) ||
    "VaultForge Room";

  return {
    to: clean(params.get("to")) || "bcrsoutheast@gmail.com",
    from: getEmail(),
    subject: clean(params.get("subject")) || title || "VaultForge Room",
    title,
    roomType,
    roomId,
    signalId: clean(params.get("signal_id")) || roomId,
    folder: clean(params.get("folder")) || ref.folder || "general",
    source: clean(params.get("source")) || ref.source || "message",
    sourceRoute: clean(params.get("source_route")) || ref.sourceRoute || "",
    matchReason: clean(params.get("match_reason")),
  };
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function getRow(data: any) {
  return (
    data.deal ||
    data.project ||
    data.pain ||
    data.record ||
    data.item ||
    data.room ||
    data.signal ||
    data.action ||
    (Array.isArray(data.deals) ? data.deals[0] : null) ||
    (Array.isArray(data.projects) ? data.projects[0] : null) ||
    (Array.isArray(data.pains) ? data.pains[0] : null) ||
    (Array.isArray(data.items) ? data.items[0] : null) ||
    (Array.isArray(data.feed) ? data.feed[0] : null) ||
    (Array.isArray(data.rows) ? data.rows[0] : null) ||
    (Array.isArray(data.data) ? data.data[0] : null) ||
    null
  );
}

function roomTitleFromRow(row: any) {
  if (!row || typeof row !== "object") return "";

  const meta = row.metadata && typeof row.metadata === "object" ? row.metadata : {};

  return first(
    row.title,
    row.deal_title,
    row.pain_title,
    row.project_title,
    row.signal_title,
    row.headline,
    row.name,
    row.address,
    meta.title,
    meta.deal_title,
    meta.pain_title,
    meta.project_title,
    meta.signal_title,
    meta.address
  );
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.13), transparent 30%), radial-gradient(circle at 88% 8%, rgba(86,216,255,.10), transparent 26%), linear-gradient(180deg,#020617,#071326 55%,#020617)",
  color: "white",
  padding: "22px 16px 96px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  width: "min(1080px,100%)",
  margin: "0 auto",
};

const panel: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.22)",
  borderRadius: 30,
  padding: 24,
  background: "linear-gradient(145deg,rgba(255,255,255,.070),rgba(255,255,255,.030))",
  boxShadow: "0 28px 86px rgba(0,0,0,.30)",
  marginBottom: 20,
};

const label: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

const button: React.CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: 48,
  borderRadius: 999,
  padding: "12px 16px",
  textDecoration: "none",
  fontWeight: 950,
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
  border: 0,
  cursor: "pointer",
};

const ghost: React.CSSProperties = {
  ...button,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.16)",
  color: "white",
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 18,
  background: "rgba(2,6,23,.72)",
  color: "white",
  minHeight: 52,
  padding: "14px 16px",
  fontSize: 16,
  outline: "none",
};

const textarea: React.CSSProperties = {
  ...input,
  minHeight: 170,
  resize: "vertical",
  lineHeight: 1.5,
};

export default function NewMessagePage() {
  const initial = useMemo(readQueryContext, []);
  const [context, setContext] = useState<RoomContext>(initial);
  const [fromEmail, setFromEmail] = useState("");
  const [toEmail, setToEmail] = useState(initial.to);
  const [subject, setSubject] = useState(initial.subject);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [sentThread, setSentThread] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setFromEmail(user?.email || getEmail() || "Owner");
    });
  }, []);

  async function resolveRoomTitle(ctx: RoomContext) {
    if (!ctx.roomId) return;

    const currentTitle = clean(ctx.title);
    if (
      currentTitle &&
      currentTitle !== "VaultForge Room" &&
      currentTitle !== "Deal Room" &&
      currentTitle !== "Opportunity Room" &&
      currentTitle !== "Pressure Room" &&
      currentTitle !== "Routing Room" &&
      currentTitle !== "Signal Room"
    ) {
      return;
    }

    const email = getEmail();

    const kind = clean(ctx.roomType).toLowerCase();
    const source = clean(ctx.source).toLowerCase();

    const pressureFirst = kind.includes("pressure") || source.includes("pressure") || source.includes("pain") || ctx.sourceRoute.includes("/pain-room/");
    const routingFirst = kind.includes("routing") || source.includes("routing") || ctx.sourceRoute.includes("/routing-room/");
    const signalFirst = kind.includes("signal") || source.includes("signal") || ctx.sourceRoute.includes("/signals/");

    const lookups = pressureFirst
      ? [
          { type: "Pressure Room", folder: "pain", route: `/pain-room/${encodeURIComponent(ctx.roomId)}`, url: `/api/pain/feed?id=${encodeURIComponent(ctx.roomId)}&email=${encodeURIComponent(email)}&owner=0` },
          { type: "Opportunity Room", folder: "deals", route: `/deal/detail?id=${encodeURIComponent(ctx.roomId)}`, url: `/api/deal/detail?id=${encodeURIComponent(ctx.roomId)}&email=${encodeURIComponent(email)}&owner=0` },
          { type: "Opportunity Room", folder: "deals", route: `/deal/detail?id=${encodeURIComponent(ctx.roomId)}`, url: `/api/deal/feed?id=${encodeURIComponent(ctx.roomId)}&email=${encodeURIComponent(email)}&owner=0` },
        ]
      : routingFirst
      ? [
          { type: "Routing Room", folder: "routing", route: `/routing-room/${encodeURIComponent(ctx.roomId)}`, url: `/api/routing/actions?signal_id=${encodeURIComponent(ctx.roomId)}&email=${encodeURIComponent(email)}&owner=0` },
          { type: "Signal Room", folder: "signals", route: `/signals/${encodeURIComponent(ctx.roomId)}`, url: `/api/signals/${encodeURIComponent(ctx.roomId)}?email=${encodeURIComponent(email)}&owner=0` },
          { type: "Pressure Room", folder: "pain", route: `/pain-room/${encodeURIComponent(ctx.roomId)}`, url: `/api/pain/feed?id=${encodeURIComponent(ctx.roomId)}&email=${encodeURIComponent(email)}&owner=0` },
        ]
      : signalFirst
      ? [
          { type: "Signal Room", folder: "signals", route: `/signals/${encodeURIComponent(ctx.roomId)}`, url: `/api/signals/${encodeURIComponent(ctx.roomId)}?email=${encodeURIComponent(email)}&owner=0` },
          { type: "Routing Room", folder: "routing", route: `/routing-room/${encodeURIComponent(ctx.roomId)}`, url: `/api/routing/actions?signal_id=${encodeURIComponent(ctx.roomId)}&email=${encodeURIComponent(email)}&owner=0` },
        ]
      : [
          { type: "Opportunity Room", folder: "deals", route: `/deal/detail?id=${encodeURIComponent(ctx.roomId)}`, url: `/api/deal/detail?id=${encodeURIComponent(ctx.roomId)}&email=${encodeURIComponent(email)}&owner=0` },
          { type: "Opportunity Room", folder: "deals", route: `/deal/detail?id=${encodeURIComponent(ctx.roomId)}`, url: `/api/deal/feed?id=${encodeURIComponent(ctx.roomId)}&email=${encodeURIComponent(email)}&owner=0` },
          { type: "Pressure Room", folder: "pain", route: `/pain-room/${encodeURIComponent(ctx.roomId)}`, url: `/api/pain/feed?id=${encodeURIComponent(ctx.roomId)}&email=${encodeURIComponent(email)}&owner=0` },
        ];

    for (const lookup of lookups) {
      try {
        const response = await fetch(lookup.url, {
          cache: "no-store",
          credentials: "include",
          headers: {
            "x-vf-email": email,
            "x-vf-admin": "0",
          },
        });

        const data = await safeJson(response);
        const row = getRow(data);
        const foundTitle = roomTitleFromRow(row);

        if (response.ok && foundTitle) {
          setContext((prev) => ({
            ...prev,
            title: foundTitle,
            subject: foundTitle,
            roomType: lookup.type,
            folder: lookup.folder,
            sourceRoute: prev.sourceRoute || lookup.route,
          }));

          setSubject(foundTitle);

          setMessage((old) => {
            if (old && !old.includes("VaultForge")) return old;
            return `I'm requesting info / intro on ${foundTitle}.`;
          });

          return;
        }
      } catch {
        // Try next lookup.
      }
    }
  }

  useEffect(() => {
    setToEmail(initial.to || "bcrsoutheast@gmail.com");

    const startingTitle = clean(initial.title);
    const opener =
      startingTitle && startingTitle !== "VaultForge Room"
        ? `I'm requesting info / intro on ${startingTitle}.`
        : "I'm requesting info / intro from VaultForge.";

    setMessage(opener);
    resolveRoomTitle(initial);
  }, []);

  const displayTitle = clean(context.title) || "VaultForge Room";
  const displaySubject = clean(subject) || displayTitle;
  const displayRoomType = clean(context.roomType) || "VaultForge Room";
  const displayFolder = clean(context.folder) || "general";
  const displayRoomId = clean(context.roomId) || "Not listed";
  const backHref = clean(context.sourceRoute) || "/dashboard";

  async function sendMessage() {
    setStatus("Sending message...");

    const payload = {
      from_email: fromEmail,
      to_email: toEmail,
      subject: displaySubject,
      title: displaySubject,
      body: message,
      message,
      source: context.source || "room-message",
      type: context.source || "room-message",
      folder: displayFolder,
      room_title: displayTitle,
      room_type: displayRoomType,
      room_id: context.roomId || null,
      item_id: context.roomId || null,
      signal_id: context.signalId || null,
      source_route: context.sourceRoute || null,
      match_reason: context.matchReason || null,
      metadata: {
        room_title: displayTitle,
        room_type: displayRoomType,
        room_id: context.roomId || null,
        folder: displayFolder,
        source_route: context.sourceRoute || null,
        match_reason: context.matchReason || null,
      },
    };

    try {
      const response = await fetch("/api/messages/new", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": fromEmail,
          "x-vf-admin": "0",
        },
        body: JSON.stringify(payload),
      });

      const data = await safeJson(response);

      if (!response.ok || data?.ok === false) {
        setStatus(clean(data?.error || data?.message) || "Message could not be saved.");
        return;
      }

      setStatus("Message sent and tied to room context.");
      setSentThread(clean(data.thread_key || data.threadId || data.id));
    } catch (error: any) {
      setStatus(clean(error?.message) || "Message could not be sent.");
    }
  }

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        @media(max-width:760px) {
          .vf-grid {
            grid-template-columns: 1fr !important;
          }

          .vf-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
          }

          .vf-actions > * {
            width: 100%;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <div className="vf-actions" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
          <Link href="/dashboard" style={ghost}>Dashboard</Link>
          <Link href="/message-command" style={ghost}>Message Command</Link>
          <Link href={backHref} style={ghost}>Back To Room</Link>
        </div>

        <section style={panel}>
          <div style={label}>VaultForge Request Info / Intro</div>

          <h1
            style={{
              fontSize: "clamp(50px,9vw,92px)",
              lineHeight: 0.88,
              letterSpacing: "-.075em",
              margin: "12px 0 18px",
            }}
          >
            {displayTitle}
          </h1>

          <p style={{ color: "#cbd5e1", lineHeight: 1.6, fontSize: 19, marginTop: 0 }}>
            This message is tied to the originating room so the thread does not lose the deal, pain, signal, routing, or intro context.
          </p>

          <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12, marginTop: 18 }}>
            {[
              ["Room Type", displayRoomType],
              ["Room ID", displayRoomId],
              ["Folder", displayFolder],
              ["Subject", displaySubject],
            ].map(([name, value]) => (
              <div
                key={name}
                style={{
                  border: "1px solid rgba(255,255,255,.12)",
                  borderRadius: 18,
                  padding: 14,
                  background: "rgba(255,255,255,.04)",
                  overflowWrap: "anywhere",
                }}
              >
                <div style={label}>{name}</div>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section style={panel}>
          <div style={label}>Send Message</div>

          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            <input style={input} value={fromEmail} readOnly placeholder="From email" />
            <input style={input} value={toEmail} onChange={(event) => setToEmail(event.target.value)} placeholder="To email" />
            <input style={input} value={displaySubject} onChange={(event) => setSubject(event.target.value)} placeholder="Subject" />
            <textarea style={textarea} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Message" />
          </div>

          <div className="vf-actions" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
            <button type="button" onClick={sendMessage} style={button}>Send Message</button>
            <Link href={backHref} style={ghost}>Back To Room</Link>
            {sentThread ? <Link href={`/message-command/${encodeURIComponent(sentThread)}`} style={ghost}>Open Thread</Link> : null}
          </div>

          {status ? (
            <p style={{ color: status.toLowerCase().includes("sent") ? "#9df3bf" : "#f8e7b0", fontWeight: 900, marginTop: 14 }}>
              {status}
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
