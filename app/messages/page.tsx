"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

type Row = Record<string, any>;

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

  const keys = ["vf_email", "vf_member_email", "vf_admin_email", "email", "memberEmail"];

  for (const key of keys) {
    const localValue = cleanEmail(window.localStorage.getItem(key));
    if (localValue.includes("@")) return localValue;

    const sessionValue = cleanEmail(window.sessionStorage.getItem(key));
    if (sessionValue.includes("@")) return sessionValue;
  }

  return cleanEmail(readCookie("vf_email") || readCookie("vf_member_email") || readCookie("vf_admin_email"));
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function meta(row: Row) {
  return typeof row?.metadata === "object" && row.metadata ? row.metadata : {};
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

function signalIdOf(row: Row) {
  const m = meta(row);
  return first(row.signal_id, row.signalId, row.thread_signal_id, m.signal_id, m.thread_signal_id);
}

function itemIdOf(row: Row) {
  const m = meta(row);
  return first(row.item_id, row.itemId, row.pain_id, row.deal_id, row.project_id, m.item_id, m.pain_id, m.deal_id, m.project_id);
}

function titleOf(row: Row) {
  const m = meta(row);
  return first(row.title, row.subject, row.thread_title, row.signal_title, m.title, m.subject, m.thread_title, m.signal_title, "VaultForge Message");
}

function bodyOf(row: Row) {
  const m = meta(row);
  return first(row.body, row.message, row.note, row.notes, row.summary, row.preview, m.body, m.message, m.note, m.notes, m.summary, "Message thread ready for review.");
}

function fromOf(row: Row) {
  const m = meta(row);
  return cleanEmail(first(row.from_email, row.sender_email, row.created_by_email, row.member_email, m.from_email, m.sender_email, m.created_by_email, m.member_email));
}

function toOf(row: Row) {
  const m = meta(row);
  return cleanEmail(first(row.to_email, row.recipient_email, row.target_email, row.owner_email, m.to_email, m.recipient_email, m.target_email, m.owner_email));
}

function statusOf(row: Row) {
  const m = meta(row);
  return first(row.status, row.message_status, row.thread_status, m.status, m.message_status, m.thread_status, "Open");
}

function sourceOf(row: Row) {
  const m = meta(row);
  return first(row.source, row.context_type, row.event_type, row.type, m.source, m.context_type, m.event_type, m.type, "Message");
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 28%), radial-gradient(circle at 88% 10%, rgba(74,222,128,.10), transparent 26%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 96px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { width: "min(1220px,100%)", margin: "0 auto" };

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.24)",
  borderRadius: 30,
  padding: 24,
  background: "linear-gradient(145deg,rgba(255,255,255,.070),rgba(255,255,255,.030))",
  boxShadow: "0 28px 86px rgba(0,0,0,.30)",
  marginBottom: 18,
};

const glass: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 22,
  padding: 18,
  background: "rgba(255,255,255,.045)",
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

const muted: React.CSSProperties = { color: "#cbd5e1", lineHeight: 1.55 };

const button: React.CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: 50,
  borderRadius: 999,
  padding: "12px 18px",
  border: 0,
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
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

const chip: React.CSSProperties = {
  border: "1px solid rgba(157,243,191,.22)",
  borderRadius: 999,
  padding: "7px 10px",
  color: "#9df3bf",
  background: "rgba(157,243,191,.07)",
  margin: "0 7px 7px 0",
  fontSize: 12,
  fontWeight: 850,
  display: "inline-flex",
};

function Metric({ label, value, tone }: { label: string; value: string; tone: "blue" | "green" | "gold" | "red" }) {
  const color = tone === "blue" ? "#38bdf8" : tone === "green" ? "#4ade80" : tone === "red" ? "#f87171" : "#e8c46b";

  return (
    <section style={glass}>
      <div style={{ color, fontWeight: 950, letterSpacing: ".14em", textTransform: "uppercase", fontSize: 12 }}>{label}</div>
      <div style={{ fontSize: 52, fontWeight: 1000, lineHeight: 1, marginTop: 12 }}>{value}</div>
    </section>
  );
}

function MessageCard({ row, viewer }: { row: Row; viewer: string }) {
  const signalId = signalIdOf(row);
  const itemId = itemIdOf(row);
  const from = fromOf(row);
  const to = toOf(row);
  const source = sourceOf(row);

  const replyHref = signalId
    ? `/connect/${encodeURIComponent(signalId)}?email=${encodeURIComponent(viewer)}${itemId ? `&item_id=${encodeURIComponent(itemId)}` : ""}`
    : "/messages/new";

  return (
    <article style={glass}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <span style={chip}>{source}</span>
        <span style={{ ...chip, color: "#f8e7b0", borderColor: "rgba(232,196,107,.26)", background: "rgba(232,196,107,.08)" }}>
          {statusOf(row)}
        </span>
        {signalId ? <span style={{ ...chip, color: "#8fd3ff", borderColor: "rgba(56,189,248,.28)", background: "rgba(56,189,248,.08)" }}>Signal Linked</span> : null}
      </div>

      <h3 style={{ fontSize: 30, lineHeight: 1.02, margin: "14px 0 10px" }}>{titleOf(row)}</h3>
      <p style={muted}>{bodyOf(row)}</p>

      <div style={{ marginTop: 12 }}>
        {from ? <span style={chip}>From: {from}</span> : null}
        {to ? <span style={chip}>To: {to}</span> : null}
        {signalId ? <span style={chip}>Signal: {signalId}</span> : null}
        {itemId ? <span style={chip}>Item: {itemId}</span> : null}
      </div>

      <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
        <Link href={replyHref} style={button}>Reply / Continue</Link>
        {signalId ? <Link href={`/signals/${encodeURIComponent(signalId)}`} style={ghost}>Open Signal</Link> : null}
        {signalId ? <Link href={`/routing-room/${encodeURIComponent(signalId)}`} style={ghost}>Routing Room</Link> : null}
        <Link href="/activity" style={ghost}>Activity</Link>
      </div>
    </article>
  );
}

export default function MessagesPage() {
  const [email, setEmail] = useState("");
  const [items, setItems] = useState<Row[]>([]);
  const [status, setStatus] = useState("Loading messages...");

  async function load() {
    const viewer = getEmail();
    setEmail(viewer);
    setStatus("Loading messages...");

    try {
      const urls = [
        `/api/messages?email=${encodeURIComponent(viewer)}&owner=0`,
        `/api/pain/messages?email=${encodeURIComponent(viewer)}&owner=0`,
        `/api/routing/introductions?email=${encodeURIComponent(viewer)}&owner=0`,
      ];

      const collected: Row[] = [];

      for (const url of urls) {
        try {
          const res = await fetch(url, {
            cache: "no-store",
            headers: { "x-vf-email": viewer || "", "x-vf-admin": "0" },
          });

          const data = await safeJson(res);
          const list = [
            ...(Array.isArray(data.messages) ? data.messages : []),
            ...(Array.isArray(data.threads) ? data.threads : []),
            ...(Array.isArray(data.items) ? data.items : []),
            ...(Array.isArray(data.introductions) ? data.introductions : []),
            ...(Array.isArray(data.data) ? data.data : []),
          ];

          collected.push(...list);
        } catch {
          // Keep loading other message-compatible sources.
        }
      }

      const seen = new Set<string>();
      const unique = collected.filter((item) => {
        const key = first(item.id, signalIdOf(item), itemIdOf(item), titleOf(item) + bodyOf(item));
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setItems(unique);
      setStatus(unique.length ? "" : "No messages connected yet.");
    } catch (error: any) {
      setStatus(error?.message || "Could not load messages.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(() => {
    const linked = items.filter((item) => signalIdOf(item)).length;
    const open = items.filter((item) => !statusOf(item).toLowerCase().includes("archiv") && !statusOf(item).toLowerCase().includes("closed")).length;
    const ownerReady = items.filter((item) => toOf(item) || fromOf(item)).length;

    return { total: items.length, linked, open, ownerReady };
  }, [items]);

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        @media (max-width: 820px) {
          .vf-grid,
          .vf-four,
          .vf-actions {
            grid-template-columns: 1fr !important;
          }

          .vf-actions {
            display: grid !important;
            gap: 10px !important;
          }

          .vf-actions > * {
            width: 100%;
            box-sizing: border-box;
            justify-content: center;
          }
        }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav
          title="Messages"
          subtitle="Controlled owner/member communication, replies, signal context, and execution follow-up."
          active="messages"
        />

        <section style={card}>
          <div style={eyebrow}>VaultForge Message Command</div>
          <h1 style={{ fontSize: "clamp(52px,10vw,96px)", lineHeight: 0.88, letterSpacing: "-.07em", margin: "12px 0 18px" }}>
            Communication center.
          </h1>
          <p style={{ ...muted, fontSize: 20, maxWidth: 980 }}>
            Keep communication simple: message owner, reply, keep context tied to the signal, and move the deal or problem forward.
          </p>

          <div style={{ marginTop: 16 }}>
            <span style={chip}>Signed in: {email || "unknown"}</span>
            <span style={chip}>Threads: {counts.total}</span>
            <span style={chip}>Open: {counts.open}</span>
            <span style={chip}>Signal Linked: {counts.linked}</span>
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
            <Link href="/signals" style={ghost}>Signals</Link>
            <Link href="/activity" style={ghost}>Activity</Link>
            <Link href="/pain-feed" style={ghost}>Pain Feed</Link>
            <button type="button" onClick={load} style={button}>Refresh</button>
          </div>
        </section>

        <section className="vf-four" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 16, marginBottom: 18 }}>
          <Metric label="Threads" value={String(counts.total)} tone="blue" />
          <Metric label="Open" value={String(counts.open)} tone="green" />
          <Metric label="Signal Linked" value={String(counts.linked)} tone="gold" />
          <Metric label="Owner Ready" value={String(counts.ownerReady)} tone="red" />
        </section>

        <section style={card}>
          <div style={eyebrow}>Message Queue</div>
          <h2 style={{ fontSize: 42, lineHeight: 1, margin: "10px 0 18px" }}>Keep it clean and actionable.</h2>

          {items.length ? (
            <div style={{ display: "grid", gap: 14 }}>
              {items.map((item, index) => (
                <MessageCard key={clean(item.id) || `${signalIdOf(item)}-${index}`} row={item} viewer={email} />
              ))}
            </div>
          ) : (
            <div style={glass}>
              <h3 style={{ marginTop: 0 }}>No messages yet.</h3>
              <p style={muted}>
                Messages will appear here when a member contacts an owner, replies to a signal,
                asks for more info, or responds to an introduction.
              </p>
              <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
                <Link href="/signals" style={button}>Open Signals</Link>
                <Link href="/pain-feed" style={ghost}>Pain Feed</Link>
              </div>
            </div>
          )}
        </section>

        {status ? <section style={card}>{status}</section> : null}
      </div>
    </main>
  );
}
