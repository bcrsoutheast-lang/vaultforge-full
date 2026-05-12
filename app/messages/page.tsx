"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

type Row = Record<string, any>;

type MessageGroup = {
  key: string;
  title: string;
  subtitle: string;
  href: string;
  tone: "red" | "gold" | "blue" | "green";
  match?: string[];
};

const MESSAGE_GROUPS: MessageGroup[] = [
  {
    key: "alerts",
    title: "Alerts",
    subtitle: "Need more info, alert follow-ups, owner questions.",
    href: "/alerts",
    tone: "red",
    match: ["alert", "need-more-info", "need_more_info"],
  },
  {
    key: "pain",
    title: "Pain",
    subtitle: "Pain feed questions, owner contact, deal/problem requests.",
    href: "/pain-feed",
    tone: "gold",
    match: ["pain", "distress", "problem"],
  },
  {
    key: "activity",
    title: "Activity",
    subtitle: "Execution tape replies and movement follow-up.",
    href: "/activity",
    tone: "blue",
    match: ["activity", "event", "execution"],
  },
  {
    key: "routing",
    title: "Routing",
    subtitle: "Routing room, match review, and member-fit requests.",
    href: "/routing-inbox",
    tone: "green",
    match: ["routing", "route", "match"],
  },
  {
    key: "introductions",
    title: "Introductions",
    subtitle: "Controlled introductions and response follow-up.",
    href: "/introductions",
    tone: "gold",
    match: ["intro", "introduction"],
  },
  {
    key: "projects",
    title: "Projects",
    subtitle: "Project/workstation/deal room communication.",
    href: "/projects",
    tone: "blue",
    match: ["project", "workstation", "deal"],
  },
  {
    key: "members",
    title: "Members",
    subtitle: "Member profile connection requests.",
    href: "/members",
    tone: "green",
    match: ["member", "profile", "connect"],
  },
];

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

function sourceText(row: Row) {
  const m = meta(row);
  return [
    row.source,
    row.context_type,
    row.event_type,
    row.type,
    row.category,
    m.source,
    m.context_type,
    m.event_type,
    m.type,
    m.category,
    titleOf(row),
    bodyOf(row),
  ]
    .map((v) => clean(v).toLowerCase())
    .filter(Boolean)
    .join(" ");
}

function groupFor(row: Row) {
  const source = sourceText(row);

  for (const group of MESSAGE_GROUPS) {
    if ((group.match || []).some((term) => source.includes(term))) {
      return group.key;
    }
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

const wrap: React.CSSProperties = {
  width: "min(1220px,100%)",
  margin: "0 auto",
};

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

const muted: React.CSSProperties = {
  color: "#cbd5e1",
  lineHeight: 1.55,
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

function colorFor(tone: string) {
  if (tone === "red") return "#f87171";
  if (tone === "blue") return "#38bdf8";
  if (tone === "green") return "#4ade80";
  return "#e8c46b";
}

function MessageRow({ row, viewer }: { row: Row; viewer: string }) {
  const signalId = signalIdOf(row);
  const itemId = itemIdOf(row);
  const replyHref = signalId
    ? `/connect/${encodeURIComponent(signalId)}?email=${encodeURIComponent(viewer)}${itemId ? `&item_id=${encodeURIComponent(itemId)}` : ""}`
    : "/messages/new";

  return (
    <div style={{ ...glass, padding: 16 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <span style={chip}>{statusOf(row)}</span>
        {signalId ? <span style={chip}>Signal Linked</span> : null}
      </div>

      <h4 style={{ margin: "12px 0 8px", fontSize: 22 }}>{titleOf(row)}</h4>
      <p style={{ ...muted, margin: 0 }}>{bodyOf(row)}</p>

      <div style={{ marginTop: 10 }}>
        {fromOf(row) ? <span style={chip}>From: {fromOf(row)}</span> : null}
        {toOf(row) ? <span style={chip}>To: {toOf(row)}</span> : null}
      </div>

      <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
        <Link href={replyHref} style={button}>Reply</Link>
        {signalId ? <Link href={`/signals/${encodeURIComponent(signalId)}`} style={ghost}>Signal</Link> : null}
        {signalId ? <Link href={`/routing-room/${encodeURIComponent(signalId)}`} style={ghost}>Routing</Link> : null}
      </div>
    </div>
  );
}

function GroupCard({
  group,
  items,
  viewer,
}: {
  group: MessageGroup;
  items: Row[];
  viewer: string;
}) {
  const [open, setOpen] = useState(false);
  const color = colorFor(group.tone);

  return (
    <section
      style={{
        ...card,
        borderColor: items.length ? `${color}66` : "rgba(255,255,255,.12)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <div style={{ ...eyebrow, color }}>{group.title}</div>
          <h2 style={{ fontSize: 38, lineHeight: 1, margin: "10px 0 8px" }}>{group.title} Messages</h2>
          <p style={{ ...muted, margin: 0 }}>{group.subtitle}</p>
        </div>

        <div
          style={{
            width: 86,
            height: 86,
            borderRadius: 22,
            display: "grid",
            placeItems: "center",
            background: "rgba(255,255,255,.055)",
            border: `1px solid ${color}66`,
            color,
            fontSize: 42,
            fontWeight: 1000,
          }}
        >
          {items.length}
        </div>
      </div>

      <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
        <button type="button" onClick={() => setOpen((value) => !value)} style={button}>
          {open ? "Hide" : "Open"} {group.title}
        </button>
        <Link href={group.href} style={ghost}>Go to {group.title}</Link>
      </div>

      {open ? (
        <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
          {items.length ? (
            items.map((item, index) => (
              <MessageRow key={clean(item.id) || `${signalIdOf(item)}-${index}`} row={item} viewer={viewer} />
            ))
          ) : (
            <div style={glass}>
              <p style={{ ...muted, margin: 0 }}>No {group.title.toLowerCase()} messages yet.</p>
            </div>
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
          // keep page alive
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

  const grouped = useMemo(() => {
    const map: Record<string, Row[]> = {};

    for (const group of MESSAGE_GROUPS) {
      map[group.key] = [];
    }

    map.general = [];

    for (const item of items) {
      const key = groupFor(item);
      if (!map[key]) map.general.push(item);
      else map[key].push(item);
    }

    return map;
  }, [items]);

  const openCount = items.filter((item) => !statusOf(item).toLowerCase().includes("closed") && !statusOf(item).toLowerCase().includes("archive")).length;
  const linkedCount = items.filter((item) => signalIdOf(item)).length;

  const generalGroup: MessageGroup = {
    key: "general",
    title: "General",
    subtitle: "Messages that are not tied to a specific folder yet.",
    href: "/messages",
    tone: "blue",
  };

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
          subtitle="Organized message folders for alerts, pain, activity, routing, introductions, projects, and members."
          active="messages"
        />

        <section style={card}>
          <div style={eyebrow}>VaultForge Message Command</div>
          <h1 style={{ fontSize: "clamp(52px,10vw,96px)", lineHeight: 0.88, letterSpacing: "-.07em", margin: "12px 0 18px" }}>
            Message folders.
          </h1>
          <p style={{ ...muted, fontSize: 20, maxWidth: 980 }}>
            Every message has a place. Open the card for the page it came from, see the count, reply, and keep the context attached.
          </p>

          <div style={{ marginTop: 16 }}>
            <span style={chip}>Signed in: {email || "unknown"}</span>
            <span style={chip}>Total: {items.length}</span>
            <span style={chip}>Open: {openCount}</span>
            <span style={chip}>Signal Linked: {linkedCount}</span>
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
            <Link href="/signals" style={ghost}>Signals</Link>
            <Link href="/activity" style={ghost}>Activity</Link>
            <button type="button" onClick={load} style={button}>Refresh</button>
          </div>
        </section>

        <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
          {MESSAGE_GROUPS.map((group) => (
            <GroupCard key={group.key} group={group} items={grouped[group.key] || []} viewer={email} />
          ))}

          <GroupCard
            group={generalGroup}
            items={grouped.general || []}
            viewer={email}
          />
        </section>

        {status ? <section style={card}>{status}</section> : null}
      </div>
    </main>
  );
}
