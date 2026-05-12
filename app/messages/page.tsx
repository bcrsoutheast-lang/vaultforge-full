// FULL REPLACEMENT FILE
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

type Row = Record<string, any>;

const LOCAL_KEY = "vf_simple_messages_local_v1";

const FOLDERS = [
  { key: "alerts", title: "Alerts", label: "ALERT", href: "/alerts", description: "Alert follow-up and owner/member alert responses." },
  { key: "pain", title: "Pain", label: "PAIN", href: "/pain-feed", description: "Pain requests and distress signals." },
  { key: "activity", title: "Activity", label: "LIVE", href: "/activity", description: "Execution activity and follow-up windows." },
  { key: "routing", title: "Routing", label: "ROUTE", href: "/routing-inbox", description: "Routing actions and match follow-up." },
  { key: "introductions", title: "Introductions", label: "INTRO", href: "/introductions", description: "Controlled introductions." },
  { key: "projects", title: "Projects", label: "DEAL", href: "/projects", description: "Project/deal-room communication." },
  { key: "members", title: "Members", label: "NET", href: "/members", description: "Member-to-member conversations." },
  { key: "signals", title: "Signals", label: "SIG", href: "/signals", description: "Signal-room messages only." },
  { key: "general", title: "General", label: "MSG", href: "/messages", description: "General messages." },
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

function writeLocalMessages(rows: Row[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(rows.slice(0, 400)));
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
  return first(row.source, row.message_type, row.type, meta(row).source, "general").toLowerCase();
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

function rowKey(row: Row) {
  return `${threadId(row)}-${first(row.id, row.created_at, bodyOf(row))}`;
}

function folderOverride(row: Row) {
  return first(row.folder, row.folder_key, meta(row).folder, meta(row).folder_key).toLowerCase();
}

function isArchivedOrDeleted(row: Row) {
  const status = first(row.status, meta(row).status).toLowerCase();
  return row?.is_deleted === true || row?.is_archived === true || status === "deleted" || status === "archived";
}

function groupKey(row: Row) {
  const override = folderOverride(row);
  if (override && FOLDERS.some((folder) => folder.key === override)) return override;

  const source = sourceOf(row);

  if (source.includes("alert")) return "alerts";
  if (source.includes("pain")) return "pain";
  if (source.includes("activity")) return "activity";
  if (source.includes("routing")) return "routing";
  if (source.includes("intro")) return "introductions";
  if (source.includes("project") || source.includes("deal")) return "projects";
  if (source.includes("member") || source.includes("connect")) return "members";
  if (source.includes("signal")) return "signals";

  if ((source === "message" || source === "general") && signalOf(row)) {
    return "alerts";
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
      if (isArchivedOrDeleted(row)) return false;

      if (!viewer) return true;

      const rowFrom = fromOf(row);
      const rowTo = toOf(row);
      const visible = cleanEmail(
        (row as any)?.visible_to_email ||
        (row as any)?.email
      );

      return (
        rowFrom === viewer ||
        rowTo === viewer ||
        visible === viewer ||
        rowTo === "owner@vaultforge.local"
      );
    });

    const seen = new Set<string>();
    const unique = rows.filter((row) => {
      const key = rowKey(row);
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

  return (
    <main style={{ minHeight: "100vh", background: "#020303", color: "white", padding: 20 }}>
      <div style={{ width: "min(1200px,100%)", margin: "0 auto" }}>
        <VaultForgeMemberNav
          title="Messages"
          subtitle="All owner, member, alert, pain, signal, activity, and project conversations."
          active="messages"
        />

        <div style={{ marginBottom: 20 }}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search messages..."
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 14,
              background: "#111827",
              color: "white",
              border: "1px solid rgba(255,255,255,.12)"
            }}
          />
        </div>

        {FOLDERS.map((folder) => (
          <section
            key={folder.key}
            style={{
              border: "1px solid rgba(255,255,255,.12)",
              borderRadius: 20,
              padding: 20,
              marginBottom: 18,
              background: "rgba(255,255,255,.03)"
            }}
          >
            <h2>{folder.title}</h2>

            {(grouped[folder.key] || []).length ? (
              grouped[folder.key].map((row, index) => (
                <article
                  key={`${rowKey(row)}-${index}`}
                  style={{
                    border: "1px solid rgba(255,255,255,.08)",
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 12
                  }}
                >
                  <h3>{subjectOf(row)}</h3>
                  <p>{bodyOf(row)}</p>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Link
                      href={`/messages/${encodeURIComponent(threadId(row))}`}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 999,
                        background: "#e8c46b",
                        color: "#000",
                        textDecoration: "none",
                        fontWeight: 700
                      }}
                    >
                      Open Thread
                    </Link>
                  </div>
                </article>
              ))
            ) : (
              <p>No {folder.title.toLowerCase()} messages.</p>
            )}
          </section>
        ))}

        {status ? <div>{status}</div> : null}
      </div>
    </main>
  );
}
