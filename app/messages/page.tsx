"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

type Row = Record<string, any>;

const LOCAL_KEY = "vf_simple_messages_local_v1";

const FOLDERS = [
  {
    key: "pain",
    title: "Pain",
    label: "PAIN",
    href: "/pain-feed",
    terms: ["pain", "distress", "problem", "seller", "funding gap"],
    description: "Pain requests, distress signals, urgent help, and opportunity follow-up.",
  },
  {
    key: "alerts",
    title: "Alerts",
    label: "ALERT",
    href: "/alerts",
    terms: ["alert", "need-more-info", "need_more_info", "urgent", "priority"],
    description: "Alert follow-up, need-more-info messages, and owner/member responses.",
  },
  {
    key: "activity",
    title: "Activity",
    label: "LIVE",
    href: "/activity",
    terms: ["activity", "event", "execution", "follow-up"],
    description: "Execution activity, follow-up windows, and operational movement.",
  },
  {
    key: "routing",
    title: "Routing",
    label: "ROUTE",
    href: "/routing-inbox",
    terms: ["routing", "route", "match", "fit"],
    description: "Routing actions, member-fit messages, and match follow-up.",
  },
  {
    key: "introductions",
    title: "Introductions",
    label: "INTRO",
    href: "/introductions",
    terms: ["intro", "introduction"],
    description: "Controlled introductions and intro response threads.",
  },
  {
    key: "projects",
    title: "Projects",
    label: "DEAL",
    href: "/projects",
    terms: ["project", "deal", "workstation", "property"],
    description: "Project/deal-room communication and asset context.",
  },
  {
    key: "members",
    title: "Members",
    label: "NET",
    href: "/members",
    terms: ["member", "profile", "connect", "connection"],
    description: "Member-to-member connection requests and network conversations.",
  },
  {
    key: "signals",
    title: "Signals",
    label: "SIG",
    href: "/signals",
    terms: ["signal"],
    description: "Signal-specific messages connected to cards and rooms.",
  },
  {
    key: "general",
    title: "General",
    label: "MSG",
    href: "/messages",
    terms: [],
    description: "General VaultForge messages that are not tied to a specific folder.",
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

function currentEmail() {
  if (typeof window === "undefined") return "";

  const keys = ["vf_email", "vf_member_email", "vf_admin_email", "email", "memberEmail"];

  for (const key of keys) {
    const local = cleanEmail(window.localStorage.getItem(key));
    if (local.includes("@")) return local;

    const session = cleanEmail(window.sessionStorage.getItem(key));
    if (session.includes("@")) return session;
  }

  return cleanEmail(
    readCookie("vf_email") ||
      readCookie("vf_member_email") ||
      readCookie("vf_admin_email")
  );
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

function sourceOf(row: Row) {
  return first(row.source, row.message_type, row.type, meta(row).source, "general");
}

function subjectOf(row: Row) {
  return first(row.subject, row.title, meta(row).subject, "VaultForge message");
}

function bodyOf(row: Row) {
  return first(row.message, row.body, row.note, meta(row).message, "Message thread ready.");
}

function fromOf(row: Row) {
  return cleanEmail(first(row.from_email, row.sender_email, row.member_email, meta(row).from_email));
}

function toOf(row: Row) {
  return cleanEmail(first(row.to_email, row.recipient_email, row.target_email, row.owner_email, meta(row).to_email));
}

function signalOf(row: Row) {
  return first(row.signal_id, row.signalId, meta(row).signal_id);
}

function itemOf(row: Row) {
  return first(row.item_id, row.itemId, meta(row).item_id);
}

function createdOf(row: Row) {
  return first(row.created_at, row.updated_at, meta(row).created_at);
}

function groupKey(row: Row) {
  const text = `${sourceOf(row)} ${subjectOf(row)} ${bodyOf(row)} ${signalOf(row)}`.toLowerCase();

  for (const folder of FOLDERS) {
    if (folder.key === "general") continue;
    if (folder.terms.some((term) => text.includes(term))) return folder.key;
  }

  return "general";
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.15), transparent 28%), radial-gradient(circle at 90% 10%, rgba(181,92,255,.11), transparent 26%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
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
  background: "linear-gradient(145deg,rgba(255,255,255,.075),rgba(255,255,255,.032))",
  boxShadow: "0 28px 86px rgba(0,0,0,.30)",
  marginBottom: 18,
};

const folderCard: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.13)",
  borderRadius: 26,
  padding: 20,
  background: "linear-gradient(145deg,rgba(255,255,255,.070),rgba(255,255,255,.030))",
  boxShadow: "0 18px 54px rgba(0,0,0,.22)",
};

const threadCard: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.13)",
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

const goldChip: React.CSSProperties = {
  ...chip,
  color: "#f8e7b0",
  border: "1px solid rgba(232,196,107,.28)",
  background: "rgba(232,196,107,.08)",
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
    <article style={threadCard}>
      <div>
        <span style={goldChip}>{sourceOf(row)}</span>
        {signalOf(row) ? <span style={chip}>Signal: {signalOf(row)}</span> : null}
        {itemOf(row) ? <span style={chip}>Item: {itemOf(row)}</span> : null}
      </div>

      <h3 style={{ fontSize: 24, margin: "10px 0 8px", letterSpacing: "-.03em" }}>
        {subjectOf(row)}
      </h3>

      <p style={{ color: "#cbd5e1", lineHeight: 1.55, marginTop: 0 }}>
        {bodyOf(row)}
      </p>

      <div>
        {fromOf(row) ? <span style={chip}>From: {fromOf(row)}</span> : null}
        {toOf(row) ? <span style={chip}>To: {toOf(row)}</span> : null}
        {createdOf(row) ? (
          <span style={chip}>{createdOf(row).slice(0, 19).replace("T", " ")}</span>
        ) : null}
      </div>

      <div style={{ marginTop: 14 }}>
        <Link href={`/messages/${encodeURIComponent(id)}`} style={button}>
          Open Thread
        </Link>
      </div>
    </article>
  );
}

function FolderBlock({
  folder,
  items,
}: {
  folder: (typeof FOLDERS)[number];
  items: Row[];
}) {
  const [open, setOpen] = useState(items.length > 0);

  return (
    <section style={folderCard}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div
            style={{
              color: "#e8c46b",
              letterSpacing: ".18em",
              textTransform: "uppercase",
              fontWeight: 950,
              fontSize: 12,
            }}
          >
            {folder.label}
          </div>

          <h2 style={{ fontSize: 34, margin: "8px 0 8px", letterSpacing: "-.045em" }}>
            {folder.title}
          </h2>

          <p style={{ color: "#cbd5e1", lineHeight: 1.45, margin: 0 }}>
            {folder.description}
          </p>
        </div>

        <div style={{ fontSize: 48, fontWeight: 1000, color: "#f8e7b0", lineHeight: 1 }}>
          {items.length}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          style={items.length ? button : ghost}
        >
          {open ? "Hide" : "Open"} Folder
        </button>

        <Link href={folder.href} style={ghost}>
          Go to {folder.title}
        </Link>
      </div>

      {open ? (
        <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
          {items.length ? (
            items.map((row, index) => (
              <ThreadRow key={`${threadId(row)}-${index}`} row={row} />
            ))
          ) : (
            <div style={threadCard}>No {folder.title.toLowerCase()} messages yet.</div>
          )}
        </div>
      ) : null}
    </section>
  );
}

export default function MessagesPage() {
  const [viewerEmail, setViewerEmail] = useState("");
  const [items, setItems] = useState<Row[]>([]);
  const [status, setStatus] = useState("Loading messages...");
  const [query, setQuery] = useState("");

  async function load() {
    const viewer = currentEmail();
    setViewerEmail(viewer);
    setStatus("Loading messages...");

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

    const rows = [...readLocalMessages(), ...apiRows].filter((row) => {
      const deleted = row?.is_deleted === true || String(row?.status || "").toLowerCase() === "deleted";
      if (deleted) return false;

      if (!viewer) return true;

      const rowFrom = fromOf(row);
      const rowTo = toOf(row);
      const visible = cleanEmail(first(row.visible_to_email, row.email));

      return (
        rowFrom === viewer ||
        rowTo === viewer ||
        visible === viewer ||
        rowTo === "owner@vaultforge.local"
      );
    });

    const seen = new Set<string>();
    const unique = rows.filter((row) => {
      const key = `${threadId(row)}-${first(row.id, row.created_at, bodyOf(row))}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    unique.sort((a, b) => clean(createdOf(b)).localeCompare(clean(createdOf(a))));

    setItems(unique);
    setStatus(unique.length ? "" : "No messages yet.");
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;

    return items.filter((row) => {
      const text = [
        threadId(row),
        sourceOf(row),
        subjectOf(row),
        bodyOf(row),
        fromOf(row),
        toOf(row),
        signalOf(row),
        itemOf(row),
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(q);
    });
  }, [items, query]);

  const grouped = useMemo(() => {
    const map: Record<string, Row[]> = {};
    FOLDERS.forEach((folder) => (map[folder.key] = []));

    filtered.forEach((row) => {
      const key = groupKey(row);
      map[key] = map[key] || [];
      map[key].push(row);
    });

    return map;
  }, [filtered]);

  const activeCount = filtered.length;
  const foldersWithMessages = FOLDERS.filter((folder) => (grouped[folder.key] || []).length > 0).length;

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        input::placeholder {
          color: rgba(255,255,255,.45);
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
        <VaultForgeMemberNav
          title="Messages"
          subtitle="All owner, member, alert, pain, signal, activity, and project conversations."
          active="messages"
        />

        <section style={card}>
          <div
            style={{
              color: "#9df3bf",
              letterSpacing: ".18em",
              textTransform: "uppercase",
              fontWeight: 950,
              fontSize: 12,
            }}
          >
            VaultForge Message Command
          </div>

          <h1
            style={{
              fontSize: "clamp(54px,10vw,104px)",
              lineHeight: 0.88,
              letterSpacing: "-.075em",
              margin: "12px 0 18px",
            }}
          >
            All messages.
          </h1>

          <p style={{ color: "#cbd5e1", fontSize: 20, lineHeight: 1.55 }}>
            One clean command center for every contact request and thread. Messages are
            separated by Pain, Alerts, Activity, Routing, Introductions, Projects,
            Members, Signals, and General.
          </p>

          <div style={{ marginTop: 16 }}>
            <span style={chip}>Signed in: {viewerEmail || "unknown"}</span>
            <span style={chip}>Messages: {activeCount}</span>
            <span style={chip}>Active folders: {foldersWithMessages}</span>
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
            <button type="button" onClick={load} style={button}>
              Refresh Messages
            </button>
            <Link href="/dashboard" style={ghost}>
              Dashboard
            </Link>
            <Link href="/alerts" style={ghost}>
              Alerts
            </Link>
            <Link href="/signals" style={ghost}>
              Signals
            </Link>
          </div>
        </section>

        <section style={card}>
          <div
            style={{
              color: "#e8c46b",
              letterSpacing: ".18em",
              textTransform: "uppercase",
              fontWeight: 950,
              fontSize: 12,
              marginBottom: 12,
            }}
          >
            Search Threads
          </div>

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by message, email, signal, item, source..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,.16)",
              background: "rgba(255,255,255,.08)",
              color: "white",
              padding: 16,
              fontSize: 16,
              outline: "none",
            }}
          />
        </section>

        <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16 }}>
          {FOLDERS.map((folder) => (
            <FolderBlock
              key={folder.key}
              folder={folder}
              items={grouped[folder.key] || []}
            />
          ))}
        </section>

        {status ? <section style={card}>{status}</section> : null}
      </div>
    </main>
  );
}
