"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

type Row = Record<string, any>;

type ConversationCard = {
  key: string;
  threadId: string;
  threadKey: string;
  lane: string;
  title: string;
  from: string;
  to: string;
  latest: string;
  latestAt: string;
  count: number;
  rows: Row[];
};

const LOCAL_KEY = "vf_simple_messages_local_v1";

function clean(value: unknown) {
  return String(value || "").trim();
}

function lower(value: unknown) {
  return clean(value).toLowerCase();
}

function compact(value: unknown) {
  return lower(value).replace(/\s+/g, " ");
}

function first(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }

  return "";
}

function meta(row: Row) {
  return typeof row?.metadata === "object" && row.metadata ? row.metadata : {};
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
    const local = lower(window.localStorage.getItem(key));
    if (local.includes("@")) return local;

    const session = lower(window.sessionStorage.getItem(key));
    if (session.includes("@")) return session;
  }

  return lower(
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
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(rows.slice(0, 600)));
}

function idOf(row: Row) {
  return first(row.id, meta(row).id);
}

function threadIdOf(row: Row) {
  return first(row.thread_id, row.threadId, meta(row).thread_id);
}

function threadKeyOf(row: Row) {
  return first(row.thread_key, meta(row).thread_key);
}

function rawSubjectOf(row: Row) {
  return first(row.subject, row.title, meta(row).subject, "VaultForge message");
}

function titleOf(row: Row) {
  return (
    clean(rawSubjectOf(row))
      .replace(/^(re:\s*)+/gi, "")
      .replace(/\s+/g, " ")
      .trim() || "VaultForge message"
  );
}

function bodyOf(row: Row) {
  return first(row.message, row.body, row.note, row.content, meta(row).message, "");
}

function fromOf(row: Row) {
  return lower(first(row.from_email, row.sender_email, row.member_email, meta(row).from_email));
}

function toOf(row: Row) {
  return lower(first(row.to_email, row.recipient_email, row.target_email, row.owner_email, meta(row).to_email));
}

function createdOf(row: Row) {
  return first(row.updated_at, row.created_at, meta(row).updated_at, meta(row).created_at);
}

function statusOf(row: Row) {
  return compact(first(row.status, meta(row).status));
}

function isArchivedOrDeleted(row: Row) {
  return (
    row?.archived === true ||
    row?.deleted === true ||
    row?.is_archived === true ||
    row?.is_deleted === true ||
    statusOf(row) === "archived" ||
    statusOf(row) === "deleted"
  );
}

function visibleToViewer(row: Row, viewer: string) {
  if (!viewer) return true;

  const from = fromOf(row);
  const to = toOf(row);
  const visible = lower(first((row as any).visible_to_email, (row as any).email, meta(row).visible_to_email));

  return (
    from === viewer ||
    to === viewer ||
    visible === viewer ||
    to === "owner@vaultforge.local" ||
    to === "bcrsoutheast@gmail.com"
  );
}

function laneOf(row: Row) {
  const text = compact(
    [
      row.folder,
      row.folder_key,
      row.source,
      row.origin,
      row.message_type,
      row.thread_id,
      row.thread_key,
      row.subject,
      meta(row).folder,
      meta(row).source,
    ].join(" ")
  );

  if (text.includes("alert")) return "ALERTS";
  if (text.includes("pain")) return "PAIN";
  if (text.includes("activity")) return "ACTIVITY";
  if (text.includes("routing") || text.includes("route")) return "ROUTING";
  if (text.includes("intro")) return "INTRODUCTIONS";
  if (text.includes("project") || text.includes("deal")) return "PROJECTS";
  if (text.includes("member") || text.includes("connect")) return "MEMBERS";
  if (text.includes("signal")) return "SIGNALS";

  return "GENERAL";
}

function rowDedupeKey(row: Row) {
  const id = idOf(row);
  if (id) return `id:${id}`;

  return [
    threadKeyOf(row),
    threadIdOf(row),
    fromOf(row),
    toOf(row),
    titleOf(row),
    bodyOf(row),
    createdOf(row),
  ]
    .join("|")
    .toLowerCase();
}

function conversationKey(row: Row) {
  /*
    Source of truth:
    1) thread_key when present
    2) thread_id fallback
    3) subject + participants only if no thread identity exists
  */
  const threadKey = threadKeyOf(row);
  if (threadKey) return `thread_key:${threadKey}`;

  const threadId = threadIdOf(row);
  if (threadId) return `thread_id:${threadId}`;

  return `fallback:${titleOf(row)}|${fromOf(row)}|${toOf(row)}`.toLowerCase();
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
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Loading messages...");

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

      /*
        Important:
        API returns data.messages and data.threads with the same rows.
        Use messages only so counts do not double.
      */
      apiRows = Array.isArray(data.messages) ? data.messages : [];
    } catch {
      apiRows = [];
    }

    const merged = [...readLocalMessages(), ...apiRows]
      .filter((row) => !isArchivedOrDeleted(row))
      .filter((row) => visibleToViewer(row, viewer));

    const deduped = new Map<string, Row>();

    merged.forEach((row) => {
      const key = rowDedupeKey(row);
      if (!deduped.has(key)) deduped.set(key, row);
    });

    const nextRows = Array.from(deduped.values()).sort((a, b) =>
      clean(createdOf(b)).localeCompare(clean(createdOf(a)))
    );

    setRows(nextRows);
    setStatus(nextRows.length ? "" : "No messages yet.");
  }

  useEffect(() => {
    load();
  }, []);

  function cleanupCard(card: ConversationCard, patch: Row) {
    const now = new Date().toISOString();
    const keys = new Set(card.rows.map((row) => rowDedupeKey(row)));

    const patchedRows = card.rows.map((row) => ({
      ...row,
      ...patch,
      updated_at: now,
      metadata: {
        ...meta(row),
        ...meta(patch),
      },
    }));

    const local = readLocalMessages();
    const keptLocal = local.filter((row) => !keys.has(rowDedupeKey(row)));
    writeLocalMessages([...patchedRows, ...keptLocal]);

    setRows((current) =>
      current
        .map((row) => {
          if (!keys.has(rowDedupeKey(row))) return row;

          return {
            ...row,
            ...patch,
            updated_at: now,
            metadata: {
              ...meta(row),
              ...meta(patch),
            },
          };
        })
        .filter((row) => !isArchivedOrDeleted(row))
    );
  }

  function archiveCard(card: ConversationCard) {
    cleanupCard(card, {
      archived: true,
      is_archived: true,
      status: "archived",
      metadata: { status: "archived" },
    });
  }

  function deleteCard(card: ConversationCard) {
    cleanupCard(card, {
      deleted: true,
      is_deleted: true,
      status: "deleted",
      metadata: { status: "deleted" },
    });
  }

  const cards = useMemo(() => {
    const search = compact(query);

    const filtered = rows.filter((row) => {
      if (!search) return true;

      const text = compact(
        [
          titleOf(row),
          bodyOf(row),
          fromOf(row),
          toOf(row),
          laneOf(row),
          threadKeyOf(row),
          threadIdOf(row),
        ].join(" ")
      );

      return text.includes(search);
    });

    const grouped = new Map<string, ConversationCard>();

    filtered.forEach((row) => {
      const key = conversationKey(row);
      const existing = grouped.get(key);
      const updated = createdOf(row);
      const threadId = threadIdOf(row);

      if (!existing) {
        grouped.set(key, {
          key,
          threadId,
          threadKey: threadKeyOf(row),
          lane: laneOf(row),
          title: titleOf(row),
          from: fromOf(row),
          to: toOf(row),
          latest: bodyOf(row),
          latestAt: updated,
          count: 1,
          rows: [row],
        });
        return;
      }

      existing.rows.push(row);
      existing.count += 1;

      if (threadId && !existing.threadId) existing.threadId = threadId;
      if (threadKeyOf(row) && !existing.threadKey) existing.threadKey = threadKeyOf(row);

      if (clean(updated).localeCompare(clean(existing.latestAt)) > 0) {
        existing.latest = bodyOf(row);
        existing.latestAt = updated;
        existing.title = titleOf(row);
        existing.lane = laneOf(row);
        existing.from = fromOf(row);
        existing.to = toOf(row);
      }
    });

    return Array.from(grouped.values()).sort((a, b) =>
      clean(b.latestAt).localeCompare(clean(a.latestAt))
    );
  }, [rows, query]);

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover {
          transform: translateY(-1px);
          filter: brightness(1.06);
          transition: all .18s ease;
        }

        input::placeholder {
          color: rgba(255,255,255,.44);
        }

        @media (max-width: 760px) {
          .vf-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
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
          subtitle="Clean conversation cards grouped by thread key."
          active="messages"
        />

        <section style={hero}>
          <div style={eyebrow}>VaultForge Message Command</div>
          <h1 style={heroTitle}>Conversation cards.</h1>

          <p style={lead}>
            One card per real conversation. Counts use messages only, not duplicate thread rows.
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
            <span style={chip}>Signed in: {viewerEmail || "unknown"}</span>
            <span style={chip}>Cards: {cards.length}</span>
            <span style={chip}>Messages: {rows.length}</span>
          </div>

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search conversations..."
            style={input}
          />

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <button type="button" onClick={load} style={button}>
              Refresh
            </button>
            <Link href="/alerts" style={ghost}>Alerts</Link>
            <Link href="/pain-feed" style={ghost}>Pain Feed</Link>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
          </div>
        </section>

        <section style={{ display: "grid", gap: 18 }}>
          {cards.map((card) => {
            const openId = card.threadId || card.key;
            const href = `/messages/${encodeURIComponent(openId)}?thread_key=${encodeURIComponent(card.threadKey)}&conversation_key=${encodeURIComponent(card.key)}`;

            return (
              <article key={card.key} style={conversationCard}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 18 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={laneChip}>{card.lane}</div>

                    <h2 style={cardTitle}>{card.title}</h2>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                      <span style={chip}>From: {card.from || "unknown"}</span>
                      <span style={chip}>To: {card.to || "unknown"}</span>
                      <span style={chip}>Messages: {card.count}</span>
                    </div>

                    <p style={preview}>{card.latest || "No preview."}</p>
                  </div>

                  <div style={countBadge}>{card.count}</div>
                </div>

                <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
                  <Link href={href} style={button}>
                    Open Messages
                  </Link>

                  <button type="button" onClick={() => archiveCard(card)} style={ghost}>
                    Archive
                  </button>

                  <button type="button" onClick={() => deleteCard(card)} style={danger}>
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </section>

        {status ? <section style={hero}>{status}</section> : null}
      </div>
    </main>
  );
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 28%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  width: "min(1180px,100%)",
  margin: "0 auto",
};

const hero: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.22)",
  borderRadius: 30,
  padding: 24,
  marginBottom: 22,
  background: "linear-gradient(145deg,rgba(255,255,255,.065),rgba(255,255,255,.028))",
  boxShadow: "0 28px 86px rgba(0,0,0,.30)",
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  fontWeight: 950,
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontSize: 12,
};

const heroTitle: React.CSSProperties = {
  fontSize: "clamp(52px,10vw,96px)",
  lineHeight: .88,
  letterSpacing: "-.075em",
  margin: "12px 0 18px",
};

const lead: React.CSSProperties = {
  color: "#cbd5e1",
  fontSize: 19,
  lineHeight: 1.5,
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.16)",
  background: "rgba(9,18,37,.95)",
  color: "white",
  padding: 16,
  fontSize: 16,
  outline: "none",
};

const conversationCard: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 30,
  padding: 24,
  background: "linear-gradient(145deg,rgba(255,255,255,.058),rgba(255,255,255,.024))",
  boxShadow: "0 22px 70px rgba(0,0,0,.25)",
};

const laneChip: React.CSSProperties = {
  display: "inline-flex",
  border: "1px solid rgba(232,196,107,.28)",
  borderRadius: 999,
  padding: "9px 13px",
  color: "#f8e7b0",
  background: "rgba(232,196,107,.09)",
  fontSize: 13,
  fontWeight: 950,
  letterSpacing: ".09em",
};

const cardTitle: React.CSSProperties = {
  fontSize: "clamp(30px,6vw,48px)",
  lineHeight: 1,
  letterSpacing: "-.045em",
  margin: "14px 0 14px",
};

const preview: React.CSSProperties = {
  color: "#cbd5e1",
  fontSize: 20,
  lineHeight: 1.55,
  margin: 0,
};

const countBadge: React.CSSProperties = {
  minWidth: 58,
  textAlign: "right",
  fontSize: 58,
  fontWeight: 1000,
  color: "#f8e7b0",
  lineHeight: 1,
};

const chip: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.13)",
  borderRadius: 999,
  padding: "8px 11px",
  color: "#dbeafe",
  background: "rgba(255,255,255,.055)",
  fontSize: 12,
  fontWeight: 850,
  display: "inline-flex",
};

const button: React.CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: 48,
  borderRadius: 999,
  padding: "12px 18px",
  border: 0,
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
  fontWeight: 950,
  textDecoration: "none",
  cursor: "pointer",
};

const ghost: React.CSSProperties = {
  ...button,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.16)",
  color: "white",
};

const danger: React.CSSProperties = {
  ...button,
  background: "rgba(248,113,113,.12)",
  border: "1px solid rgba(248,113,113,.28)",
  color: "#fecaca",
};
