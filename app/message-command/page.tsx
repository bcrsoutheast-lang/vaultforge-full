"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Conversation = Record<string, any>;

const LANES = [
  { key: "alerts", label: "ALERTS", title: "Alerts", note: "Alert follow-up and urgent owner/member messages." },
  { key: "pain", label: "PAIN", title: "Pain", note: "Pain signal conversations and problem-routing." },
  { key: "signals", label: "SIGNALS", title: "Signals", note: "Signal room and intelligence messages." },
  { key: "routing", label: "ROUTING", title: "Routing", note: "Execution path and routing communication." },
  { key: "introductions", label: "INTRO", title: "Introductions", note: "Controlled introductions and replies." },
  { key: "projects", label: "PROJECTS", title: "Projects", note: "Project and deal-room messages." },
  { key: "members", label: "MEMBERS", title: "Members", note: "Member-to-member communication." },
  { key: "general", label: "GENERAL", title: "General", note: "Messages not tied to a lane yet." },
];

function clean(value: unknown) {
  return String(value || "").trim();
}

function lower(value: unknown) {
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

function currentEmail() {
  if (typeof window === "undefined") return "";

  for (const key of ["vf_email", "vf_member_email", "vf_admin_email", "email", "memberEmail"]) {
    const local = lower(window.localStorage.getItem(key));
    if (local.includes("@")) return local;

    const session = lower(window.sessionStorage.getItem(key));
    if (session.includes("@")) return session;
  }

  return lower(readCookie("vf_email") || readCookie("vf_member_email") || readCookie("vf_admin_email"));
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export default function MessageCommandPage() {
  const [email, setEmail] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState("all");
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState("Loading message command...");

  async function load() {
    const viewer = currentEmail();
    setEmail(viewer);
    setStatus("Loading message command...");

    try {
      const res = await fetch(`/api/message-command?email=${encodeURIComponent(viewer)}`, {
        cache: "no-store",
        headers: { "x-vf-email": viewer },
      });

      const data = await safeJson(res);

      setConversations(Array.isArray(data.conversations) ? data.conversations : []);
      setCounts(data.counts || {});
      setStatus("");
    } catch (error: any) {
      setStatus(error?.message || "Could not load message command.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(() => {
    const q = lower(query);

    return conversations.filter((item) => {
      if (selected !== "all" && item.folder !== selected) return false;

      if (!q) return true;

      return lower(
        [
          item.title,
          item.latest_message,
          item.from_email,
          item.to_email,
          item.thread_key,
          item.folder,
        ].join(" ")
      ).includes(q);
    });
  }, [conversations, query, selected]);

  const totalMessages = conversations.reduce((sum, item) => sum + Number(item.count || 0), 0);

  async function cleanup(convo: Conversation, action: "archive" | "delete") {
    const ids = Array.isArray(convo.message_ids) ? convo.message_ids : [];

    if (!ids.length) {
      setStatus("No message IDs found for cleanup.");
      return;
    }

    setStatus(action === "archive" ? "Archiving conversation..." : "Deleting conversation...");

    try {
      const res = await fetch("/api/message-command", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": email,
        },
        body: JSON.stringify({ action, ids, email }),
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || "Cleanup failed.");
      }

      setConversations((current) => current.filter((item) => item.thread_key !== convo.thread_key));
      setStatus(action === "archive" ? "Conversation archived." : "Conversation deleted.");
    } catch (error: any) {
      setStatus(error?.message || "Cleanup failed.");
    }
  }

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover { transform: translateY(-1px); filter: brightness(1.06); transition: all .16s ease; }
        input::placeholder { color: rgba(255,255,255,.45); }
        @media (max-width: 780px) {
          .vf-grid { grid-template-columns: 1fr !important; }
          .vf-actions { display: grid !important; grid-template-columns: 1fr !important; }
          .vf-actions > * { width: 100%; box-sizing: border-box; justify-content: center; }
        }
      `}</style>

      <div style={wrap}>
        <nav style={nav}>
          <Link href="/dashboard" style={navButton}>Dashboard</Link>
          <Link href="/alerts" style={navButton}>Alerts</Link>
          <Link href="/pain-feed" style={navButton}>Pain Feed</Link>
          <Link href="/projects" style={navButton}>Projects</Link>
          <Link href="/routing-inbox" style={navButton}>Routing</Link>
          <Link href="/message-command" style={navButtonActive}>Message Command</Link>
        </nav>

        <section className="vf-grid" style={hero}>
          <div>
            <div style={eyebrow}>VaultForge Message OS</div>
            <h1 style={heroTitle}>Bloomberg-grade messaging command.</h1>
            <p style={lead}>
              A clean isolated messaging route with canonical threads, lane cards, message counts,
              reply rooms, archive/delete cleanup, and collapsible conversation control.
            </p>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
              <span style={chip}>Signed in: {email || "unknown"}</span>
              <span style={chip}>Conversations: {conversations.length}</span>
              <span style={chip}>Messages: {totalMessages}</span>
            </div>

            <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 22 }}>
              <button type="button" onClick={load} style={button}>Refresh</button>
              <button type="button" onClick={() => setSelected("all")} style={ghost}>All Messages</button>
            </div>
          </div>

          <aside style={tape}>
            <div style={eyebrow}>Operating Tape</div>
            {LANES.slice(0, 6).map((lane) => (
              <button key={lane.key} type="button" onClick={() => setSelected(lane.key)} style={tapeRow}>
                <span>{lane.title}</span>
                <strong>{counts[lane.key] || 0}</strong>
              </button>
            ))}
          </aside>
        </section>

        <section style={sectionTop}>
          <div>
            <div style={eyebrow}>Message Lanes</div>
            <h2 style={sectionTitle}>Open by category.</h2>
          </div>
        </section>

        <section className="vf-grid" style={laneGrid}>
          {LANES.map((lane) => {
            const active = selected === lane.key;

            return (
              <button
                key={lane.key}
                type="button"
                onClick={() => setSelected(lane.key)}
                style={active ? laneCardActive : laneCard}
              >
                <div style={laneLabel}>{lane.label}</div>
                <div style={laneNumber}>{counts[lane.key] || 0}</div>
                <h3 style={laneTitle}>{lane.title}</h3>
                <p style={muted}>{lane.note}</p>
              </button>
            );
          })}
        </section>

        <section style={panel}>
          <div style={eyebrow}>Conversation Search</div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search names, lane, title, message, thread..."
            style={input}
          />
        </section>

        <section style={{ display: "grid", gap: 16 }}>
          {visible.map((convo) => {
            const isCollapsed = collapsed[convo.thread_key] === true;
            const href = `/message-command/${encodeURIComponent(convo.thread_key)}?title=${encodeURIComponent(convo.title || "Message Room")}`;

            return (
              <article key={convo.thread_key} style={conversation}>
                <div style={countBadge}>{convo.count}</div>
                <div style={laneChip}>{convo.lane_label || "GENERAL"}</div>

                <h2 style={conversationTitle}>{convo.title || "VaultForge message"}</h2>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={chip}>From: {convo.from_email || "unknown"}</span>
                  <span style={chip}>To: {convo.to_email || "unknown"}</span>
                  <span style={chip}>Messages: {convo.count}</span>
                </div>

                {!isCollapsed ? (
                  <p style={preview}>{convo.latest_message || "No preview available."}</p>
                ) : null}

                <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
                  <Link href={href} style={button}>Open Messages</Link>
                  <button type="button" onClick={() => setCollapsed((old) => ({ ...old, [convo.thread_key]: !isCollapsed }))} style={ghost}>
                    {isCollapsed ? "Expand" : "Collapse"}
                  </button>
                  <button type="button" onClick={() => cleanup(convo, "archive")} style={ghost}>Archive</button>
                  <button type="button" onClick={() => cleanup(convo, "delete")} style={danger}>Delete</button>
                </div>
              </article>
            );
          })}
        </section>

        {status ? <section style={panel}>{status}</section> : null}
      </div>
    </main>
  );
}

const page: React.CSSProperties = { minHeight: "100vh", background: "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 28%), linear-gradient(180deg,#020303,#071326 55%,#020303)", color: "white", padding: "22px 16px 96px", fontFamily: "Arial, sans-serif" };
const wrap: React.CSSProperties = { width: "min(1220px,100%)", margin: "0 auto" };
const nav: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 };
const navButton: React.CSSProperties = { display: "inline-flex", justifyContent: "center", alignItems: "center", borderRadius: 999, padding: "12px 16px", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.14)", color: "white", textDecoration: "none", fontWeight: 800 };
const navButtonActive: React.CSSProperties = { ...navButton, background: "rgba(232,196,107,.14)", border: "1px solid rgba(232,196,107,.28)", color: "#f8e7b0" };
const hero: React.CSSProperties = { display: "grid", gridTemplateColumns: "minmax(0,1.5fr) minmax(280px,.8fr)", gap: 22, border: "1px solid rgba(232,196,107,.22)", borderRadius: 30, padding: 28, marginBottom: 24, background: "linear-gradient(145deg,rgba(255,255,255,.07),rgba(255,255,255,.025))", boxShadow: "0 30px 90px rgba(0,0,0,.34)" };
const eyebrow: React.CSSProperties = { color: "#e8c46b", letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 950, fontSize: 12 };
const heroTitle: React.CSSProperties = { fontSize: "clamp(54px,10vw,104px)", lineHeight: .86, letterSpacing: "-.075em", margin: "12px 0 20px" };
const lead: React.CSSProperties = { color: "#cbd5e1", fontSize: 20, lineHeight: 1.55, maxWidth: 820 };
const tape: React.CSSProperties = { border: "1px solid rgba(255,255,255,.12)", borderRadius: 26, padding: 20, background: "rgba(0,0,0,.18)" };
const tapeRow: React.CSSProperties = { width: "100%", display: "flex", justifyContent: "space-between", gap: 12, padding: "14px 0", color: "white", background: "transparent", border: 0, borderBottom: "1px solid rgba(255,255,255,.09)", textAlign: "left", fontWeight: 850, cursor: "pointer" };
const sectionTop: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", margin: "26px 0 14px" };
const sectionTitle: React.CSSProperties = { fontSize: "clamp(34px,6vw,54px)", letterSpacing: "-.055em", lineHeight: 1, margin: "8px 0 0" };
const laneGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 16, marginBottom: 22 };
const laneCard: React.CSSProperties = { position: "relative", minHeight: 190, border: "1px solid rgba(255,255,255,.12)", borderRadius: 28, padding: 22, background: "rgba(255,255,255,.035)", color: "white", textAlign: "left", cursor: "pointer" };
const laneCardActive: React.CSSProperties = { ...laneCard, border: "1px solid rgba(232,196,107,.38)", background: "linear-gradient(145deg,rgba(232,196,107,.12),rgba(255,255,255,.035))" };
const laneLabel: React.CSSProperties = { color: "#38bdf8", letterSpacing: ".16em", textTransform: "uppercase", fontWeight: 950, fontSize: 12 };
const laneNumber: React.CSSProperties = { position: "absolute", top: 22, right: 22, fontSize: 58, fontWeight: 1000, color: "#f8e7b0", lineHeight: 1 };
const laneTitle: React.CSSProperties = { fontSize: 34, letterSpacing: "-.045em", margin: "42px 0 10px" };
const muted: React.CSSProperties = { color: "#cbd5e1", lineHeight: 1.5, margin: 0 };
const panel: React.CSSProperties = { border: "1px solid rgba(232,196,107,.18)", borderRadius: 28, padding: 22, marginBottom: 18, background: "rgba(255,255,255,.035)" };
const input: React.CSSProperties = { width: "100%", marginTop: 16, boxSizing: "border-box", borderRadius: 18, border: "1px solid rgba(255,255,255,.14)", background: "#081224", color: "white", padding: 16, fontSize: 16, outline: "none" };
const conversation: React.CSSProperties = { position: "relative", border: "1px solid rgba(255,255,255,.12)", borderRadius: 28, padding: 24, background: "rgba(255,255,255,.035)" };
const countBadge: React.CSSProperties = { position: "absolute", top: 24, right: 24, fontSize: 58, fontWeight: 1000, color: "#f8e7b0", lineHeight: 1 };
const laneChip: React.CSSProperties = { display: "inline-flex", borderRadius: 999, border: "1px solid rgba(232,196,107,.24)", color: "#f8e7b0", padding: "8px 12px", fontSize: 12, fontWeight: 900 };
const conversationTitle: React.CSSProperties = { fontSize: "clamp(30px,5vw,52px)", lineHeight: 1, margin: "18px 74px 16px 0" };
const preview: React.CSSProperties = { color: "#dbeafe", fontSize: 21, lineHeight: 1.5, marginTop: 18 };
const chip: React.CSSProperties = { borderRadius: 999, border: "1px solid rgba(255,255,255,.12)", padding: "8px 12px", fontSize: 12, color: "#dbeafe", display: "inline-flex" };
const button: React.CSSProperties = { display: "inline-flex", justifyContent: "center", alignItems: "center", borderRadius: 999, padding: "14px 20px", background: "linear-gradient(135deg,#f8e7b0,#e8c46b)", color: "#06100a", textDecoration: "none", fontWeight: 950, border: 0, cursor: "pointer" };
const ghost: React.CSSProperties = { ...button, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.14)", color: "white" };
const danger: React.CSSProperties = { ...button, background: "rgba(248,113,113,.12)", border: "1px solid rgba(248,113,113,.28)", color: "#fecaca" };
