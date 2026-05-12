"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

type Row = Record<string, any>;

const GROUPS = [
  { key: "pain", title: "Pain", href: "/pain-feed", terms: ["pain", "distress", "problem"] },
  { key: "alerts", title: "Alerts", href: "/alerts", terms: ["alert", "need-more-info", "need_more_info"] },
  { key: "activity", title: "Activity", href: "/activity", terms: ["activity", "event", "execution"] },
  { key: "routing", title: "Routing", href: "/routing-inbox", terms: ["routing", "route", "match"] },
  { key: "introductions", title: "Introductions", href: "/introductions", terms: ["intro", "introduction"] },
  { key: "projects", title: "Projects", href: "/projects", terms: ["project", "deal", "workstation"] },
  { key: "members", title: "Members", href: "/members", terms: ["member", "profile", "connect"] },
  { key: "signals", title: "Signals", href: "/signals", terms: ["signal"] },
  { key: "general", title: "General", href: "/messages", terms: [] },
];

const LOCAL_KEY = "vf_simple_messages_local_v1";

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

function currentEmail() {
  if (typeof window === "undefined") return "";

  const keys = ["vf_email", "vf_member_email", "vf_admin_email", "email", "memberEmail"];

  for (const key of keys) {
    const local = cleanEmail(window.localStorage.getItem(key));
    if (local.includes("@")) return local;

    const session = cleanEmail(window.sessionStorage.getItem(key));
    if (session.includes("@")) return session;
  }

  return cleanEmail(readCookie("vf_email") || readCookie("vf_member_email") || readCookie("vf_admin_email"));
}

function readLocalMessages() {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOCAL_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
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
    const text = clean(value);
    if (text) return text;
  }
  return "";
}

function threadId(row: Row) {
  return first(row.thread_id, row.threadId, meta(row).thread_id, row.id, "general");
}

function source(row: Row) {
  return first(row.source, row.message_type, row.type, meta(row).source, "general");
}

function title(row: Row) {
  return first(row.subject, row.title, meta(row).subject, "VaultForge message");
}

function body(row: Row) {
  return first(row.message, row.body, row.note, meta(row).message, "Message thread ready.");
}

function from(row: Row) {
  return cleanEmail(first(row.from_email, row.sender_email, row.member_email, meta(row).from_email));
}

function to(row: Row) {
  return cleanEmail(first(row.to_email, row.recipient_email, row.target_email, row.owner_email, meta(row).to_email));
}

function signal(row: Row) {
  return first(row.signal_id, row.signalId, meta(row).signal_id);
}

function created(row: Row) {
  return first(row.created_at, row.updated_at, meta(row).created_at);
}

function groupKey(row: Row) {
  const text = `${source(row)} ${title(row)} ${body(row)}`.toLowerCase();

  for (const group of GROUPS) {
    if (group.key === "general") continue;
    if (group.terms.some((term) => text.includes(term))) return group.key;
  }

  return "general";
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

function ThreadRow({ row }: { row: Row }) {
  const id = threadId(row);

  return (
    <article style={glass}>
      <div>
        <span style={chip}>{source(row)}</span>
        {signal(row) ? <span style={chip}>Signal: {signal(row)}</span> : null}
        {created(row) ? <span style={chip}>{created(row).slice(0, 19).replace("T", " ")}</span> : null}
      </div>

      <h3 style={{ fontSize: 24, margin: "10px 0 8px" }}>{title(row)}</h3>
      <p style={{ color: "#cbd5e1", lineHeight: 1.55 }}>{body(row)}</p>

      <div>
        {from(row) ? <span style={chip}>From: {from(row)}</span> : null}
        {to(row) ? <span style={chip}>To: {to(row)}</span> : null}
      </div>

      <div style={{ marginTop: 14 }}>
        <Link href={`/messages/${encodeURIComponent(id)}`} style={button}>Open Thread</Link>
      </div>
    </article>
  );
}

function Folder({ title, href, items }: { title: string; href: string; items: Row[] }) {
  const [open, setOpen] = useState(false);

  return (
    <section style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
        <div>
          <div style={{ color: "#e8c46b", letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 950, fontSize: 12 }}>
            {title}
          </div>
          <h2 style={{ fontSize: 36, margin: "8px 0 0" }}>{title} Messages</h2>
        </div>

        <div style={{ fontSize: 44, fontWeight: 1000, color: "#f8e7b0" }}>{items.length}</div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
        <button type="button" onClick={() => setOpen((value) => !value)} style={button}>
          {open ? "Hide" : "Open"} Folder
        </button>
        <Link href={href} style={ghost}>Go to {title}</Link>
      </div>

      {open ? (
        <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
          {items.length ? (
            items.map((row, index) => <ThreadRow key={`${threadId(row)}-${index}`} row={row} />)
          ) : (
            <div style={glass}>No {title.toLowerCase()} messages yet.</div>
          )}
        </div>
      ) : null}
    </section>
  );
}

export default function MessagesPage() {
  const [email, setEmail] = useState("");
  const [items, setItems] = useState<Row[]>([]);
  const [status, setStatus] = useState("Loading messages...");

  async function load() {
    const viewer = currentEmail();
    setEmail(viewer);
    setStatus("Loading messages...");

    const localRows = readLocalMessages();

    let apiRows: Row[] = [];

    try {
      const res = await fetch(`/api/simple-messages?email=${encodeURIComponent(viewer)}`, {
        cache: "no-store",
        headers: { "x-vf-email": viewer },
      });

      const data = await safeJson(res);

      apiRows = [
        ...(Array.isArray(data.messages) ? data.messages : []),
        ...(Array.isArray(data.threads) ? data.threads : []),
        ...(Array.isArray(data.items) ? data.items : []),
        ...(Array.isArray(data.data) ? data.data : []),
      ];
    } catch {
      apiRows = [];
    }

    const rows = [...localRows, ...apiRows].filter((row) => {
      const deleted = row?.is_deleted === true || String(row?.status || "").toLowerCase() === "deleted";
      if (deleted) return false;

      if (!viewer) return true;

      const rowFrom = from(row);
      const rowTo = to(row);

      return (
        rowFrom === viewer ||
        rowTo === viewer ||
        rowTo === "owner@vaultforge.local" ||
        cleanEmail(first(row.visible_to_email, row.email)) === viewer
      );
    });

    const seen = new Set<string>();
    const unique = rows.filter((row: Row) => {
      const key = `${threadId(row)}-${first(row.id, row.created_at, body(row))}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    unique.sort((a, b) => clean(created(b)).localeCompare(clean(created(a))));

    setItems(unique);
    setStatus(unique.length ? "" : "No messages yet.");
  }

  useEffect(() => {
    load();
  }, []);

  const grouped = useMemo(() => {
    const map: Record<string, Row[]> = {};
    for (const group of GROUPS) map[group.key] = [];

    for (const row of items) {
      const key = groupKey(row);
      map[key] = map[key] || [];
      map[key].push(row);
    }

    return map;
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
            justify-content: center;
          }
        }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav title="Messages" subtitle="Simple owner/member message center." active="messages" />

        <section style={card}>
          <div style={{ color: "#e8c46b", letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 950, fontSize: 12 }}>
            VaultForge Message Command
          </div>
          <h1 style={{ fontSize: "clamp(52px,10vw,96px)", lineHeight: 0.88, letterSpacing: "-.07em", margin: "12px 0 18px" }}>
            Message folders.
          </h1>
          <p style={{ color: "#cbd5e1", fontSize: 20, lineHeight: 1.55 }}>
            Every contact request gets a visible folder and thread room.
          </p>

          <div style={{ marginTop: 16 }}>
            <span style={chip}>Signed in: {email || "unknown"}</span>
            <span style={chip}>Messages: {items.length}</span>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
            <button type="button" onClick={load} style={button}>Refresh</button>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
            <Link href="/signals" style={ghost}>Signals</Link>
          </div>
        </section>

        <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
          {GROUPS.map((group) => (
            <Folder key={group.key} title={group.title} href={group.href} items={grouped[group.key] || []} />
          ))}
        </section>

        {status ? <section style={card}>{status}</section> : null}
      </div>
    </main>
  );
}
