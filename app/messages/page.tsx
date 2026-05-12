"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

type Row = Record<string, any>;

type ConversationCard = {
  key: string;
  lane: string;
  subject: string;
  from: string;
  to: string;
  latestBody: string;
  latestAt: string;
  count: number;
  threadIds: string[];
  rows: Row[];
};

const LOCAL_KEY = "vf_simple_messages_local_v1";

const LANE_LABELS: Record<string, string> = {
  alerts: "ALERTS",
  pain: "PAIN",
  activity: "ACTIVITY",
  routing: "ROUTING",
  introductions: "INTRODUCTIONS",
  projects: "PROJECTS",
  members: "MEMBERS",
  signals: "SIGNALS",
  general: "GENERAL",
};

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function compact(value: string) {
  return clean(value).toLowerCase().replace(/\s+/g, " ");
}

function safeKey(value: string) {
  return compact(value)
    .replace(/[^a-z0-9@._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 130);
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
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(rows.slice(0, 500)));
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
  return first(row.message, row.body, row.note, row.content, meta(row).message, "");
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
  return first(row.updated_at, row.created_at, meta(row).updated_at, meta(row).created_at);
}

function normalizeSubject(value: string) {
  const cleaned = clean(value)
    .replace(/^(re:\s*)+/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || "VaultForge message";
}

function laneOf(row: Row) {
  const source = sourceOf(row);
  const thread = threadId(row).toLowerCase();
  const subject = subjectOf(row).toLowerCase();

  if (source.includes("alert") || thread.includes("alert") || subject.includes("alert")) return "alerts";
  if (source.includes("pain") || thread.includes("pain") || subject.includes("pain")) return "pain";
  if (source.includes("activity") || thread.includes("activity")) return "activity";
  if (source.includes("routing") || source.includes("route") || thread.includes("routing") || thread.includes("route")) return "routing";
  if (source.includes("intro") || thread.includes("intro")) return "introductions";
  if (source.includes("project") || source.includes("deal") || thread.includes("project") || thread.includes("deal")) return "projects";
  if (source.includes("member") || source.includes("connect") || thread.includes("member")) return "members";
  if (source.includes("signal") || thread.includes("signal") || signalOf(row)) return "signals";

  return "general";
}

function isArchivedOrDeleted(row: Row) {
  const status = first(row.status, meta(row).status).toLowerCase();
  return row?.is_deleted === true || row?.is_archived === true || status === "deleted" || status === "archived";
}

function visibleToViewer(row: Row, viewer: string) {
  if (!viewer) return true;

  const from = fromOf(row);
  const to = toOf(row);
  const visible = cleanEmail(first((row as any).visible_to_email, (row as any).email, meta(row).visible_to_email));

  return (
    from === viewer ||
    to === viewer ||
    visible === viewer ||
    to === "owner@vaultforge.local" ||
    to === "bcrsoutheast@gmail.com"
  );
}

function messageDedupeKey(row: Row) {
  return safeKey(
    [
      threadId(row),
      fromOf(row),
      toOf(row),
      normalizeSubject(subjectOf(row)),
      bodyOf(row),
      createdOf(row).slice(0, 19),
    ].join("|")
  );
}

function conversationKey(row: Row) {
  const lane = laneOf(row);
  const subject = normalizeSubject(subjectOf(row));
  const from = fromOf(row);
  const to = toOf(row);
  const signal = signalOf(row);
  const item = itemOf(row);

  if (subject.toLowerCase() !== "vaultforge message") {
    return safeKey([lane, subject, from, to].join("|"));
  }

  if (signal) {
    return safeKey([lane, "signal", signal, from, to].join("|"));
  }

  if (item) {
    return safeKey([lane, "item", item, from, to].join("|"));
  }

  return safeKey([lane, subject, from, to].join("|"));
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

    const deduped = new Map<string, Row>();

    merged.forEach((row) => {
      const key = messageDedupeKey(row);
      if (!deduped.has(key)) deduped.set(key, row);
    });

    const rows = Array.from(deduped.values()).sort((a, b) =>
      clean(createdOf(b)).localeCompare(clean(createdOf(a)))
    );

    setItems(rows);
    setStatus(rows.length ? "" : "No messages yet.");
  }

  useEffect(() => {
    load();
  }, []);

  function cleanupConversation(card: ConversationCard, patch: Row) {
    const local = readLocalMessages();
    const existingKeys = new Set(local.map((row) => messageDedupeKey(row)));

    const patchedRows = card.rows.map((row) => ({
      ...row,
      ...patch,
      updated_at: new Date().toISOString(),
      metadata: {
        ...meta(row),
        ...meta(patch),
      },
    }));

    const preservedLocal = local.filter((row) => !card.threadIds.includes(threadId(row)));
    const missingRows = patchedRows.filter((row) => !existingKeys.has(messageDedupeKey(row)));

    const nextLocal = [...patchedRows, ...missingRows, ...preservedLocal];

    writeLocalMessages(nextLocal);
    setItems((current) =>
      current
        .map((row) => {
          if (!card.threadIds.includes(threadId(row))) return row;
          return {
            ...row,
            ...patch,
            updated_at: new Date().toISOString(),
            metadata: {
              ...meta(row),
              ...meta(patch),
            },
          };
        })
        .filter((row) => !isArchivedOrDeleted(row))
    );
  }

  function archiveConversation(card: ConversationCard) {
    cleanupConversation(card, {
      is_archived: true,
      status: "archived",
      metadata: { status: "archived" },
    });
  }

  function deleteConversation(card: ConversationCard) {
    cleanupConversation(card, {
      is_deleted: true,
      status: "deleted",
      metadata: { status: "deleted" },
    });
  }

  const cards = useMemo(() => {
    const q = compact(query);
    const filtered = items.filter((row) => {
      if (!q) return true;

      const text = compact(
        [
          laneOf(row),
          subjectOf(row),
          bodyOf(row),
          fromOf(row),
          toOf(row),
          threadId(row),
          signalOf(row),
          itemOf(row),
        ].join(" ")
      );

      return text.includes(q);
    });

    const map = new Map<string, ConversationCard>();

    filtered.forEach((row) => {
      const key = conversationKey(row);
      const thread = threadId(row);
      const created = createdOf(row);
      const existing = map.get(key);

      if (!existing) {
        map.set(key, {
          key,
          lane: laneOf(row),
          subject: normalizeSubject(subjectOf(row)),
          from: fromOf(row),
          to: toOf(row),
          latestBody: bodyOf(row),
          latestAt: created,
          count: 1,
          threadIds: [thread],
          rows: [row],
        });
        return;
      }

      existing.rows.push(row);
      existing.count += 1;

      if (!existing.threadIds.includes(thread)) {
        existing.threadIds.push(thread);
      }

      if (clean(created).localeCompare(clean(existing.latestAt)) > 0) {
        existing.latestBody = bodyOf(row);
        existing.latestAt = created;
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      clean(b.latestAt).localeCompare(clean(a.latestAt))
    );
  }, [items, query]);

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
          subtitle="Clean conversation cards grouped by thread, member, alert, signal, pain, and project context."
          active="messages"
        />

        <section style={heroCard}>
          <div style={eyebrow}>VaultForge Message Command</div>
          <h1 style={heroTitle}>Conversation cards.</h1>

          <p style={lead}>
            One card equals one related conversation. The number on each card is the
            message count inside that conversation.
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
            <span style={chip}>Signed in: {viewerEmail || "unknown"}</span>
            <span style={chip}>Conversation cards: {cards.length}</span>
            <span style={chip}>Raw messages: {items.length}</span>
          </div>

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, email, tag, signal, subject, or message..."
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
            const openHref = `/messages/${encodeURIComponent(card.threadIds[0])}?threads=${encodeURIComponent(card.threadIds.join(","))}`;

            return (
              <article key={card.key} style={conversationCard}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 18 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={laneChip}>{LANE_LABELS[card.lane] || card.lane.toUpperCase()}</div>

                    <h2 style={cardTitle}>{card.subject}</h2>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                      <span style={chip}>From: {card.from || "unknown"}</span>
                      <span style={chip}>To: {card.to || "unknown"}</span>
                      <span style={chip}>Messages: {card.count}</span>
                      <span style={chip}>Threads: {card.threadIds.length}</span>
                    </div>

                    <p style={preview}>{card.latestBody || "No preview available."}</p>
                  </div>

                  <div style={countBadge}>{card.count}</div>
                </div>

                <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
                  <Link href={openHref} style={button}>Open Messages</Link>

                  <button type="button" onClick={() => archiveConversation(card)} style={ghost}>
                    Archive
                  </button>

                  <button type="button" onClick={() => deleteConversation(card)} style={danger}>
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </section>

        {status ? <section style={heroCard}>{status}</section> : null}
      </div>
    </main>
  );
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.15), transparent 28%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  width: "min(1180px,100%)",
  margin: "0 auto",
};

const heroCard: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.22)",
  borderRadius: 30,
  padding: 24,
  background: "linear-gradient(145deg,rgba(255,255,255,.070),rgba(255,255,255,.030))",
  boxShadow: "0 28px 86px rgba(0,0,0,.30)",
  marginBottom: 20,
};

const conversationCard: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 30,
  padding: 24,
  background: "linear-gradient(145deg,rgba(255,255,255,.060),rgba(255,255,255,.025))",
  boxShadow: "0 22px 70px rgba(0,0,0,.25)",
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontWeight: 950,
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
  fontSize: "clamp(30px,6vw,46px)",
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
