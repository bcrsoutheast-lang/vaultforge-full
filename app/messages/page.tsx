"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

type Row = Record<string, any>;

type Card = {
  key: string;
  lane: string;
  title: string;
  from: string;
  to: string;
  latest: string;
  updated: string;
  count: number;
  rows: Row[];
  threadIds: string[];
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

function safeKey(value: string) {
  return compact(value)
    .replace(/[^a-z0-9@._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
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

  return lower(readCookie("vf_email") || readCookie("vf_member_email") || readCookie("vf_admin_email"));
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
  return first(row.thread_id, row.threadId, meta(row).thread_id, row.thread_key, meta(row).thread_key);
}

function threadKeyOf(row: Row) {
  return first(row.thread_key, meta(row).thread_key);
}

function dealIdOf(row: Row) {
  return first(row.deal_id, row.item_id, row.itemId, meta(row).deal_id, meta(row).item_id);
}

function signalIdOf(row: Row) {
  return first(row.signal_id, row.signalId, meta(row).signal_id);
}

function sourceOf(row: Row) {
  return compact(first(row.source, row.origin, row.message_type, row.type, meta(row).source, meta(row).origin));
}

function folderOf(row: Row) {
  return compact(first(row.folder, row.folder_key, meta(row).folder, meta(row).folder_key));
}

function rawSubjectOf(row: Row) {
  return first(row.subject, row.title, meta(row).subject, "VaultForge message");
}

function subjectOf(row: Row) {
  return clean(rawSubjectOf(row))
    .replace(/^(re:\s*)+/gi, "")
    .replace(/\s+/g, " ")
    .trim() || "VaultForge message";
}

function isGenericSubject(row: Row) {
  const s = compact(subjectOf(row));
  return s === "vaultforge message" || s === "message" || s === "vaultforge";
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

function isArchivedOrDeleted(row: Row) {
  const status = compact(first(row.status, meta(row).status));
  return row?.archived === true || row?.deleted === true || row?.is_archived === true || row?.is_deleted === true || status === "archived" || status === "deleted";
}

function laneOf(row: Row) {
  const folder = folderOf(row);
  const source = sourceOf(row);
  const thread = compact(threadIdOf(row));
  const subject = compact(subjectOf(row));

  const text = [folder, source, thread, subject].join(" ");

  if (text.includes("alert")) return "ALERTS";
  if (text.includes("pain")) return "PAIN";
  if (text.includes("activity")) return "ACTIVITY";
  if (text.includes("routing") || text.includes("route")) return "ROUTING";
  if (text.includes("intro")) return "INTRODUCTIONS";
  if (text.includes("project") || text.includes("deal")) return "PROJECTS";
  if (text.includes("member") || text.includes("connect")) return "MEMBERS";
  if (text.includes("signal") || signalIdOf(row)) return "SIGNALS";

  return "GENERAL";
}

function visibleToViewer(row: Row, viewer: string) {
  if (!viewer) return true;

  const from = fromOf(row);
  const to = toOf(row);
  const visible = lower(first((row as any).visible_to_email, (row as any).email, meta(row).visible_to_email));

  return from === viewer || to === viewer || visible === viewer || to === "owner@vaultforge.local" || to === "bcrsoutheast@gmail.com";
}

function messageKey(row: Row) {
  return safeKey(
    [
      idOf(row),
      threadIdOf(row),
      fromOf(row),
      toOf(row),
      subjectOf(row),
      bodyOf(row),
      createdOf(row).slice(0, 19),
    ].join("|")
  );
}

function conversationKey(row: Row) {
  const lane = laneOf(row);
  const deal = dealIdOf(row);
  const threadKey = threadKeyOf(row);
  const threadId = threadIdOf(row);
  const subject = subjectOf(row);
  const from = fromOf(row);
  const to = toOf(row);

  if (deal) return safeKey([lane, "deal", deal, from, to].join("|"));
  if (threadKey) return safeKey([lane, "thread-key", threadKey, from, to].join("|"));

  /*
    Critical:
    Generic "VaultForge message" rows are not safe to group by subject + participants.
    Many unrelated records share that title. For generic rows, use actual thread_id.
  */
  if (isGenericSubject(row) && threadId) {
    return safeKey([lane, "thread-id", threadId, from, to].join("|"));
  }

  return safeKey([lane, "subject", subject, from, to].join("|"));
}

function cardTitle(row: Row) {
  const subject = subjectOf(row);
  if (!isGenericSubject(row)) return subject;

  const lane = laneOf(row);
  const deal = dealIdOf(row);
  const signal = signalIdOf(row);

  if (lane === "SIGNALS" && signal) return `Signal conversation`;
  if (lane === "SIGNALS") return "Signal message";
  if (lane === "ALERTS") return "Alert message";
  if (lane === "PAIN") return "Pain message";
  if (deal) return "Deal message";

  return subject;
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
      apiRows = [
        ...(Array.isArray(data.messages) ? data.messages : []),
        ...(Array.isArray(data.threads) ? data.threads : []),
        ...(Array.isArray(data.items) ? data.items : []),
        ...(Array.isArray(data.data) ? data.data : []),
      ];
    } catch {
      apiRows = [];
    }

    const merged = [...readLocalMessages(), ...apiRows]
      .filter((row) => !isArchivedOrDeleted(row))
      .filter((row) => visibleToViewer(row, viewer));

    const map = new Map<string, Row>();

    merged.forEach((row) => {
      const key = messageKey(row);
      if (!map.has(key)) map.set(key, row);
    });

    const nextRows = Array.from(map.values()).sort((a, b) =>
      clean(createdOf(b)).localeCompare(clean(createdOf(a)))
    );

    setRows(nextRows);
    setStatus(nextRows.length ? "" : "No messages yet.");
  }

  useEffect(() => {
    load();
  }, []);

  function cleanupCard(card: Card, patch: Row) {
    const now = new Date().toISOString();
    const cardKeys = new Set(card.rows.map((row) => messageKey(row)));

    const patchedCardRows = card.rows.map((row) => ({
      ...row,
      ...patch,
      updated_at: now,
      metadata: {
        ...meta(row),
        ...meta(patch),
      },
    }));

    const local = readLocalMessages();
    const keptLocal = local.filter((row) => !cardKeys.has(messageKey(row)));
    const nextLocal = [...patchedCardRows, ...keptLocal];

    writeLocalMessages(nextLocal);

    setRows((current) =>
      current
        .map((row) => {
          if (!cardKeys.has(messageKey(row))) return row;

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

  function archiveCard(card: Card) {
    cleanupCard(card, {
      archived: true,
      is_archived: true,
      status: "archived",
      metadata: { status: "archived" },
    });
  }

  function deleteCard(card: Card) {
    cleanupCard(card, {
      deleted: true,
      is_deleted: true,
      status: "deleted",
      metadata: { status: "deleted" },
    });
  }

  const cards = useMemo(() => {
    const q = compact(query);
    const filtered = rows.filter((row) => {
      if (!q) return true;

      const text = compact(
        [
          laneOf(row),
          subjectOf(row),
          bodyOf(row),
          fromOf(row),
          toOf(row),
          dealIdOf(row),
          threadKeyOf(row),
          threadIdOf(row),
          signalIdOf(row),
        ].join(" ")
      );

      return text.includes(q);
    });

    const grouped = new Map<string, Card>();

    filtered.forEach((row) => {
      const key = conversationKey(row);
      const thread = threadIdOf(row);
      const created = createdOf(row);
      const existing = grouped.get(key);

      if (!existing) {
        grouped.set(key, {
          key,
          lane: laneOf(row),
          title: cardTitle(row),
          from: fromOf(row),
          to: toOf(row),
          latest: bodyOf(row),
          updated: created,
          count: 1,
          rows: [row],
          threadIds: thread ? [thread] : [],
        });
        return;
      }

      existing.rows.push(row);
      existing.count += 1;

      if (thread && !existing.threadIds.includes(thread)) {
        existing.threadIds.push(thread);
      }

      if (clean(created).localeCompare(clean(existing.updated)) > 0) {
        existing.latest = bodyOf(row);
        existing.updated = created;
        existing.title = cardTitle(row);
        existing.lane = laneOf(row);
      }
    });

    return Array.from(grouped.values()).sort((a, b) =>
      clean(b.updated).localeCompare(clean(a.updated))
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
          color: rgba(255,255,255,.45);
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
          subtitle="Clean conversation cards grouped by real deal ID, thread key, or thread ID."
          active="messages"
        />

        <section style={hero}>
          <div style={eyebrow}>VaultForge Message Command</div>
          <h1 style={title}>Conversation cards.</h1>

          <p style={lead}>
            One card equals one real conversation. Generic messages no longer collapse together.
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
            <button type="button" onClick={load} style={button}>Refresh</button>
            <Link href="/alerts" style={ghost}>Alerts</Link>
            <Link href="/pain-feed" style={ghost}>Pain Feed</Link>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
          </div>
        </section>

        <section style={{ display: "grid", gap: 18 }}>
          {cards.map((card) => {
            const openId = card.threadIds[0] || card.key;
            const threads = card.threadIds.join(",");

            return (
              <article key={card.key} style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 18 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={laneChip}>{card.lane}</div>

                    <h2 style={subject}>{card.title}</h2>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                      <span style={chip}>From: {card.from || "unknown"}</span>
                      <span style={chip}>To: {card.to || "unknown"}</span>
                      <span style={chip}>Messages: {card.count}</span>
                      <span style={chip}>Threads: {card.threadIds.length || 1}</span>
                    </div>

                    <p style={preview}>{card.latest || "No preview."}</p>
                  </div>

                  <div style={count}>{card.count}</div>
                </div>

                <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
                  <Link href={`/messages/${encodeURIComponent(openId)}?threads=${encodeURIComponent(threads)}`} style={button}>
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
  background: "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 28%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
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

const title: React.CSSProperties = {
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

const cardStyle: React.CSSProperties = {
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

const subject: React.CSSProperties = {
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

const count: React.CSSProperties = {
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
