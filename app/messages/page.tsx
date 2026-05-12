"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

type Row = Record<string, any>;

const LOCAL_KEY = "vf_simple_messages_local_v1";

function clean(value: unknown) {
  return String(value || "").trim();
}

function compact(value: unknown) {
  return clean(value).toLowerCase().replace(/\s+/g, " ");
}

function safe(value: unknown) {
  return compact(value)
    .replace(/[^a-z0-9@._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function first(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }
  return "";
}

function meta(row: Row) {
  return typeof row?.metadata === "object" && row.metadata
    ? row.metadata
    : {};
}

function subjectOf(row: Row) {
  return first(
    row.subject,
    row.title,
    meta(row).subject,
    "VaultForge message"
  )
    .replace(/^(re:\s*)+/gi, "")
    .trim();
}

function bodyOf(row: Row) {
  return first(
    row.message,
    row.body,
    row.note,
    meta(row).message,
    ""
  );
}

function fromOf(row: Row) {
  return first(
    row.from_email,
    row.sender_email,
    meta(row).from_email
  ).toLowerCase();
}

function toOf(row: Row) {
  return first(
    row.to_email,
    row.recipient_email,
    row.target_email,
    meta(row).to_email
  ).toLowerCase();
}

function createdOf(row: Row) {
  return first(
    row.updated_at,
    row.created_at,
    meta(row).updated_at,
    meta(row).created_at
  );
}

function laneOf(row: Row) {
  const source = compact(
    first(
      row.folder,
      row.folder_key,
      row.source,
      row.message_type,
      meta(row).folder,
      meta(row).source
    )
  );

  if (source.includes("alert")) return "ALERTS";
  if (source.includes("pain")) return "PAIN";
  if (source.includes("signal")) return "SIGNALS";
  if (source.includes("routing")) return "ROUTING";
  if (source.includes("project")) return "PROJECTS";
  if (source.includes("member")) return "MEMBERS";

  return "GENERAL";
}

function threadIdsOf(rows: Row[]) {
  return Array.from(
    new Set(
      rows
        .map((row) =>
          first(
            row.thread_id,
            row.thread_key,
            meta(row).thread_id
          )
        )
        .filter(Boolean)
    )
  );
}

function readLocalMessages() {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(LOCAL_KEY) || "[]"
    );

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalMessages(rows: Row[]) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    LOCAL_KEY,
    JSON.stringify(rows.slice(0, 500))
  );
}

function currentEmail() {
  if (typeof window === "undefined") return "";

  return (
    window.localStorage.getItem("vf_email") ||
    ""
  ).toLowerCase();
}

export default function MessagesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [query, setQuery] = useState("");

  async function load() {
    const email = currentEmail();

    let apiRows: Row[] = [];

    try {
      const res = await fetch(
        `/api/simple-messages?email=${encodeURIComponent(email)}`,
        {
          cache: "no-store",
        }
      );

      const data = await res.json();

      apiRows = Array.isArray(data.messages)
        ? data.messages
        : [];
    } catch {
      apiRows = [];
    }

    const merged = [
      ...readLocalMessages(),
      ...apiRows,
    ];

    const dedupe = new Map<string, Row>();

    merged.forEach((row) => {
      const key = safe(
        [
          row.id,
          subjectOf(row),
          bodyOf(row),
          createdOf(row),
        ].join("|")
      );

      if (!dedupe.has(key)) {
        dedupe.set(key, row);
      }
    });

    setRows(Array.from(dedupe.values()));
  }

  useEffect(() => {
    load();
  }, []);

  function archiveConversation(cardRows: Row[]) {
    const next = rows.map((row) => {
      const match = cardRows.some(
        (item) => item.id === row.id
      );

      if (!match) return row;

      return {
        ...row,
        archived: true,
        is_archived: true,
        status: "archived",
      };
    });

    setRows(next);
    writeLocalMessages(next);
  }

  function deleteConversation(cardRows: Row[]) {
    const next = rows.map((row) => {
      const match = cardRows.some(
        (item) => item.id === row.id
      );

      if (!match) return row;

      return {
        ...row,
        deleted: true,
        is_deleted: true,
        status: "deleted",
      };
    });

    setRows(next);
    writeLocalMessages(next);
  }

  const grouped = useMemo(() => {
    const filtered = rows.filter((row) => {
      if (
        row?.archived ||
        row?.deleted ||
        row?.is_archived ||
        row?.is_deleted
      ) {
        return false;
      }

      const text = compact(
        [
          subjectOf(row),
          bodyOf(row),
          fromOf(row),
          toOf(row),
          row.deal_id,
          row.thread_key,
        ].join(" ")
      );

      return text.includes(compact(query));
    });

    const groups = new Map<string, Row[]>();

    filtered.forEach((row) => {
      const dealId = clean(row.deal_id);
      const threadKey = clean(row.thread_key);

      let key = "";

      if (dealId) {
        key = `deal-${dealId}`;
      } else if (threadKey) {
        key = `thread-${threadKey}`;
      } else {
        key = safe(
          [
            subjectOf(row),
            fromOf(row),
            toOf(row),
          ].join("|")
        );
      }

      if (!groups.has(key)) {
        groups.set(key, []);
      }

      groups.get(key)!.push(row);
    });

    return Array.from(groups.entries())
      .map(([key, rows]) => {
        rows.sort((a, b) =>
          compact(createdOf(b)).localeCompare(
            compact(createdOf(a))
          )
        );

        const latest = rows[0];

        return {
          key,
          rows,
          subject: subjectOf(latest),
          latest: bodyOf(latest),
          lane: laneOf(latest),
          from: fromOf(latest),
          to: toOf(latest),
          count: rows.length,
          threadIds: threadIdsOf(rows),
          updated: createdOf(latest),
        };
      })
      .sort((a, b) =>
        compact(b.updated).localeCompare(
          compact(a.updated)
        )
      );
  }, [rows, query]);

  return (
    <main style={page}>
      <div style={wrap}>
        <VaultForgeMemberNav
          title="Messages"
          subtitle="Real grouped conversation cards."
          active="messages"
        />

        <section style={hero}>
          <div style={eyebrow}>
            VAULTFORGE MESSAGE COMMAND
          </div>

          <h1 style={title}>
            Conversation cards.
          </h1>

          <p style={lead}>
            Related messages are now grouped by
            real conversation identity using
            deal IDs and thread keys.
          </p>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginBottom: 18,
            }}
          >
            <div style={chip}>
              Cards: {grouped.length}
            </div>

            <div style={chip}>
              Messages: {rows.length}
            </div>
          </div>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations..."
            style={input}
          />
        </section>

        <section
          style={{
            display: "grid",
            gap: 18,
          }}
        >
          {grouped.map((card) => (
            <article
              key={card.key}
              style={cardStyle}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 18,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={laneChip}>
                    {card.lane}
                  </div>

                  <h2 style={subject}>
                    {card.subject}
                  </h2>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                      marginBottom: 14,
                    }}
                  >
                    <div style={chip}>
                      From: {card.from}
                    </div>

                    <div style={chip}>
                      To: {card.to}
                    </div>

                    <div style={chip}>
                      Messages: {card.count}
                    </div>
                  </div>

                  <p style={preview}>
                    {card.latest}
                  </p>
                </div>

                <div style={count}>
                  {card.count}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  marginTop: 18,
                }}
              >
                <Link
                  href={`/messages/${encodeURIComponent(
                    card.threadIds[0] || card.key
                  )}?threads=${encodeURIComponent(
                    card.threadIds.join(",")
                  )}`}
                  style={button}
                >
                  Open Messages
                </Link>

                <button
                  type="button"
                  onClick={() =>
                    archiveConversation(card.rows)
                  }
                  style={ghost}
                >
                  Archive
                </button>

                <button
                  type="button"
                  onClick={() =>
                    deleteConversation(card.rows)
                  }
                  style={danger}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "24px 16px 100px",
};

const wrap: React.CSSProperties = {
  width: "min(1180px,100%)",
  margin: "0 auto",
};

const hero: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.18)",
  borderRadius: 30,
  padding: 24,
  marginBottom: 22,
  background:
    "linear-gradient(145deg,rgba(255,255,255,.06),rgba(255,255,255,.03))",
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  fontWeight: 900,
  letterSpacing: ".16em",
  fontSize: 12,
};

const title: React.CSSProperties = {
  fontSize: "clamp(56px,10vw,100px)",
  lineHeight: .9,
  margin: "12px 0 18px",
};

const lead: React.CSSProperties = {
  color: "#cbd5e1",
  fontSize: 20,
  lineHeight: 1.5,
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.12)",
  background: "#091225",
  color: "white",
  padding: 16,
};

const cardStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 28,
  padding: 24,
  background:
    "linear-gradient(145deg,rgba(255,255,255,.05),rgba(255,255,255,.02))",
};

const laneChip: React.CSSProperties = {
  display: "inline-flex",
  padding: "9px 13px",
  borderRadius: 999,
  border: "1px solid rgba(232,196,107,.24)",
  background: "rgba(232,196,107,.08)",
  color: "#f8e7b0",
  fontWeight: 900,
  letterSpacing: ".08em",
};

const subject: React.CSSProperties = {
  fontSize: "clamp(34px,6vw,52px)",
  lineHeight: 1,
  margin: "14px 0",
};

const preview: React.CSSProperties = {
  color: "#d1d5db",
  fontSize: 21,
  lineHeight: 1.55,
};

const count: React.CSSProperties = {
  fontSize: 62,
  fontWeight: 1000,
  color: "#f8e7b0",
};

const chip: React.CSSProperties = {
  padding: "8px 11px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,.12)",
  background: "rgba(255,255,255,.05)",
  fontSize: 12,
  fontWeight: 800,
};

const button: React.CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "12px 18px",
  borderRadius: 999,
  border: 0,
  background: "#e8c46b",
  color: "#000",
  textDecoration: "none",
  fontWeight: 900,
};

const ghost: React.CSSProperties = {
  ...button,
  background: "rgba(255,255,255,.05)",
  border: "1px solid rgba(255,255,255,.12)",
  color: "white",
};

const danger: React.CSSProperties = {
  ...button,
  background: "rgba(255,80,80,.12)",
  border: "1px solid rgba(255,80,80,.22)",
  color: "#fecaca",
};
