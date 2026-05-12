"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

type Row = Record<string, any>;
type ThreadGroup = {
  threadId: string;
  folder: string;
  subject: string;
  from: string;
  to: string;
  latest: string;
  count: number;
  rows: Row[];
  updated: string;
};

const LOCAL_KEY = "vf_simple_messages_local_v1";

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
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

function threadId(row: Row) {
  return first(row.thread_id, meta(row).thread_id, row.id, "general");
}

function sourceOf(row: Row) {
  return first(
    row.source,
    row.message_type,
    meta(row).source,
    "general"
  ).toLowerCase();
}

function subjectOf(row: Row) {
  return first(
    row.subject,
    row.title,
    meta(row).subject,
    "VaultForge message"
  );
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
  return cleanEmail(
    first(
      row.from_email,
      row.sender_email,
      meta(row).from_email
    )
  );
}

function toOf(row: Row) {
  return cleanEmail(
    first(
      row.to_email,
      row.recipient_email,
      meta(row).to_email
    )
  );
}

function createdOf(row: Row) {
  return first(
    row.updated_at,
    row.created_at,
    meta(row).updated_at,
    meta(row).created_at
  );
}

function folderOf(row: Row) {
  const source = sourceOf(row);

  if (
    source.includes("alert") ||
    threadId(row).includes("alert")
  ) {
    return "ALERTS";
  }

  if (
    source.includes("pain") ||
    threadId(row).includes("pain")
  ) {
    return "PAIN";
  }

  if (
    source.includes("signal") ||
    threadId(row).includes("signal")
  ) {
    return "SIGNALS";
  }

  if (
    source.includes("routing") ||
    threadId(row).includes("routing")
  ) {
    return "ROUTING";
  }

  if (
    source.includes("project") ||
    source.includes("deal")
  ) {
    return "PROJECTS";
  }

  if (
    source.includes("member") ||
    source.includes("connect")
  ) {
    return "MEMBERS";
  }

  return "GENERAL";
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

  return cleanEmail(
    window.localStorage.getItem("vf_email") ||
    readCookie("vf_email")
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
    JSON.stringify(rows.slice(0, 400))
  );
}

export default function MessagesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [viewer, setViewer] = useState("");
  const [query, setQuery] = useState("");

  async function load() {
    const email = currentEmail();
    setViewer(email);

    let apiRows: Row[] = [];

    try {
      const res = await fetch(
        `/api/simple-messages?email=${encodeURIComponent(email)}`,
        {
          cache: "no-store",
          headers: {
            "x-vf-email": email,
          },
        }
      );

      const data = await res.json();

      apiRows = [
        ...(Array.isArray(data.messages) ? data.messages : []),
        ...(Array.isArray(data.threads) ? data.threads : []),
      ];
    } catch {
      apiRows = [];
    }

    const merged = [...readLocalMessages(), ...apiRows];

    const visible = merged.filter((row) => {
      if (row?.is_archived || row?.is_deleted) return false;

      const from = fromOf(row);
      const to = toOf(row);

      return (
        from === email ||
        to === email ||
        to === "owner@vaultforge.local"
      );
    });

    const dedupe = new Map<string, Row>();

    visible.forEach((row) => {
      const key = `${threadId(row)}-${bodyOf(row)}`;

      if (!dedupe.has(key)) {
        dedupe.set(key, row);
      }
    });

    setRows(Array.from(dedupe.values()));
  }

  useEffect(() => {
    load();
  }, []);

  function updateThread(thread: string, patch: Row) {
    const next = rows.map((row) => {
      if (threadId(row) !== thread) return row;

      return {
        ...row,
        ...patch,
      };
    });

    setRows(next);
    writeLocalMessages(next);
  }

  function archiveThread(thread: string) {
    updateThread(thread, {
      is_archived: true,
      status: "archived",
    });
  }

  function deleteThread(thread: string) {
    updateThread(thread, {
      is_deleted: true,
      status: "deleted",
    });
  }

  const groupedThreads = useMemo(() => {
    const filtered = rows.filter((row) => {
      const text = [
        subjectOf(row),
        bodyOf(row),
        fromOf(row),
        toOf(row),
        threadId(row),
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(query.toLowerCase());
    });

    const map = new Map<string, ThreadGroup>();

    filtered.forEach((row) => {
      const thread = threadId(row);

      if (!map.has(thread)) {
        map.set(thread, {
          threadId: thread,
          folder: folderOf(row),
          subject: subjectOf(row),
          from: fromOf(row),
          to: toOf(row),
          latest: bodyOf(row),
          count: 1,
          rows: [row],
          updated: createdOf(row),
        });
      } else {
        const existing = map.get(thread)!;

        existing.count += 1;
        existing.rows.push(row);

        if (
          clean(createdOf(row)).localeCompare(
            clean(existing.updated)
          ) > 0
        ) {
          existing.latest = bodyOf(row);
          existing.updated = createdOf(row);
        }
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      clean(b.updated).localeCompare(clean(a.updated))
    );
  }, [rows, query]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#020303,#071326 55%,#020303)",
        color: "white",
        padding: "22px 16px 100px",
      }}
    >
      <div style={{ width: "min(1180px,100%)", margin: "0 auto" }}>
        <VaultForgeMemberNav
          title="Messages"
          subtitle="VaultForge communication command center."
          active="messages"
        />

        <section style={heroCard}>
          <h1 style={heroTitle}>Message threads.</h1>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginBottom: 18,
            }}
          >
            <div style={chip}>Viewer: {viewer || "unknown"}</div>
            <div style={chip}>Threads: {groupedThreads.length}</div>
          </div>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search messages, threads, people..."
            style={input}
          />
        </section>

        <section
          style={{
            display: "grid",
            gap: 18,
          }}
        >
          {groupedThreads.map((thread, index) => (
            <article
              key={`${thread.threadId}-${index}`}
              style={threadCard}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={folderChip}>
                    {thread.folder}
                  </div>

                  <h2
                    style={{
                      fontSize: 38,
                      margin: "14px 0 12px",
                      lineHeight: 1,
                    }}
                  >
                    {thread.subject}
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
                      From: {thread.from || "unknown"}
                    </div>

                    <div style={chip}>
                      To: {thread.to || "unknown"}
                    </div>

                    <div style={chip}>
                      Messages: {thread.count}
                    </div>
                  </div>

                  <p
                    style={{
                      color: "#d1d5db",
                      lineHeight: 1.6,
                      marginTop: 0,
                      fontSize: 20,
                    }}
                  >
                    {thread.latest}
                  </p>
                </div>

                <div
                  style={{
                    fontSize: 62,
                    fontWeight: 1000,
                    color: "#e8c46b",
                    lineHeight: 1,
                  }}
                >
                  {thread.count}
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
                    thread.threadId
                  )}`}
                  style={button}
                >
                  Open Messages
                </Link>

                <button
                  type="button"
                  onClick={() => archiveThread(thread.threadId)}
                  style={ghost}
                >
                  Archive
                </button>

                <button
                  type="button"
                  onClick={() => deleteThread(thread.threadId)}
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

const heroCard: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.10)",
  borderRadius: 30,
  padding: 26,
  background: "rgba(255,255,255,.03)",
  marginBottom: 22,
};

const heroTitle: React.CSSProperties = {
  fontSize: "clamp(56px,10vw,104px)",
  lineHeight: .9,
  margin: "0 0 18px",
};

const threadCard: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.10)",
  borderRadius: 28,
  padding: 24,
  background: "rgba(255,255,255,.03)",
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: 16,
  borderRadius: 18,
  background: "#091225",
  border: "1px solid rgba(255,255,255,.12)",
  color: "white",
};

const chip: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,.10)",
  background: "rgba(255,255,255,.05)",
  fontSize: 12,
  fontWeight: 800,
};

const folderChip: React.CSSProperties = {
  display: "inline-flex",
  padding: "10px 14px",
  borderRadius: 999,
  border: "1px solid rgba(232,196,107,.18)",
  background: "rgba(232,196,107,.08)",
  color: "#f8e7b0",
  fontWeight: 900,
  letterSpacing: ".08em",
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
  border: "1px solid rgba(255,255,255,.10)",
  color: "white",
};

const danger: React.CSSProperties = {
  ...button,
  background: "rgba(255,80,80,.12)",
  border: "1px solid rgba(255,80,80,.18)",
  color: "#fecaca",
};
