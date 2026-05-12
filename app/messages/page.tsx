"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

type Row = Record<string, any>;

const LOCAL_KEY = "vf_simple_messages_local_v1";

const FOLDERS = [
  { key: "alerts", title: "Alerts" },
  { key: "pain", title: "Pain" },
  { key: "activity", title: "Activity" },
  { key: "routing", title: "Routing" },
  { key: "introductions", title: "Introductions" },
  { key: "projects", title: "Projects" },
  { key: "members", title: "Members" },
  { key: "signals", title: "Signals" },
  { key: "general", title: "General" },
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

  return cleanEmail(
    window.localStorage.getItem("vf_email") ||
    readCookie("vf_email")
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
  return first(row.thread_id, meta(row).thread_id, row.id, "general");
}

function sourceOf(row: Row) {
  return first(row.source, row.message_type, meta(row).source, "general").toLowerCase();
}

function subjectOf(row: Row) {
  return first(row.subject, row.title, meta(row).subject, "VaultForge message");
}

function bodyOf(row: Row) {
  return first(row.message, row.body, row.note, meta(row).message, "");
}

function fromOf(row: Row) {
  return cleanEmail(first(row.from_email, row.sender_email, meta(row).from_email));
}

function toOf(row: Row) {
  return cleanEmail(first(row.to_email, row.recipient_email, meta(row).to_email));
}

function createdOf(row: Row) {
  return first(row.created_at, row.updated_at, meta(row).created_at);
}

function folderOf(row: Row) {
  const source = sourceOf(row);

  if (source.includes("alert")) return "alerts";
  if (source.includes("pain")) return "pain";
  if (source.includes("activity")) return "activity";
  if (source.includes("routing")) return "routing";
  if (source.includes("intro")) return "introductions";
  if (source.includes("project")) return "projects";
  if (source.includes("member")) return "members";
  if (source.includes("signal")) return "signals";

  return "general";
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
      const res = await fetch(`/api/simple-messages?email=${encodeURIComponent(email)}`, {
        cache: "no-store",
        headers: {
          "x-vf-email": email,
        },
      });

      const data = await res.json();

      apiRows = [
        ...(Array.isArray(data.messages) ? data.messages : []),
        ...(Array.isArray(data.threads) ? data.threads : []),
      ];
    } catch {
      apiRows = [];
    }

    const merged = [...readLocalMessages(), ...apiRows];

    const seen = new Set<string>();

    const unique = merged.filter((row) => {
      const key = `${threadId(row)}-${bodyOf(row)}`;

      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    });

    unique.sort((a, b) => {
      return clean(createdOf(b)).localeCompare(clean(createdOf(a)));
    });

    setRows(unique);
  }

  useEffect(() => {
    load();
  }, []);

  function updateRow(thread: string, patch: Row) {
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
    updateRow(thread, {
      is_archived: true,
      status: "archived",
    });
  }

  function deleteThread(thread: string) {
    updateRow(thread, {
      is_deleted: true,
      status: "deleted",
    });
  }

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (row?.is_archived || row?.is_deleted) return false;

      const text = [
        subjectOf(row),
        bodyOf(row),
        fromOf(row),
        toOf(row),
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(query.toLowerCase());
    });
  }, [rows, query]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020303",
        color: "white",
        padding: "24px 16px 90px",
      }}
    >
      <div style={{ width: "min(1200px,100%)", margin: "0 auto" }}>
        <VaultForgeMemberNav
          title="Messages"
          subtitle="VaultForge communication command center."
          active="messages"
        />

        <section
          style={{
            border: "1px solid rgba(255,255,255,.12)",
            borderRadius: 26,
            padding: 24,
            background: "rgba(255,255,255,.03)",
            marginBottom: 20,
          }}
        >
          <h1
            style={{
              fontSize: "clamp(48px,10vw,88px)",
              lineHeight: .9,
              marginBottom: 16,
            }}
          >
            Message command.
          </h1>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginBottom: 18,
            }}
          >
            <div style={chip}>Viewer: {viewer || "unknown"}</div>
            <div style={chip}>Threads: {filtered.length}</div>
          </div>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search messages..."
            style={{
              width: "100%",
              padding: 16,
              borderRadius: 16,
              background: "#111827",
              border: "1px solid rgba(255,255,255,.12)",
              color: "white",
              boxSizing: "border-box",
            }}
          />
        </section>

        <section
          style={{
            display: "grid",
            gap: 16,
          }}
        >
          {filtered.map((row, index) => {
            const thread = threadId(row);

            return (
              <article
                key={`${thread}-${index}`}
                style={{
                  border: "1px solid rgba(255,255,255,.12)",
                  borderRadius: 24,
                  padding: 20,
                  background: "rgba(255,255,255,.04)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div style={goldChip}>
                      {folderOf(row).toUpperCase()}
                    </div>

                    <h2
                      style={{
                        margin: "10px 0 10px",
                        fontSize: 28,
                      }}
                    >
                      {subjectOf(row)}
                    </h2>

                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        marginBottom: 10,
                      }}
                    >
                      <div style={chip}>
                        From: {fromOf(row) || "unknown"}
                      </div>

                      <div style={chip}>
                        To: {toOf(row) || "unknown"}
                      </div>

                      <div style={chip}>
                        Thread: {thread}
                      </div>
                    </div>

                    <p
                      style={{
                        color: "#cbd5e1",
                        lineHeight: 1.6,
                        marginTop: 0,
                      }}
                    >
                      {bodyOf(row)}
                    </p>
                  </div>

                  <div
                    style={{
                      fontSize: 42,
                      fontWeight: 900,
                      color: "#e8c46b",
                    }}
                  >
                    {index + 1}
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
                  <Link href={`/messages/${encodeURIComponent(thread)}`} style={button}>
                    Open Messages
                  </Link>

                  <button
                    type="button"
                    onClick={() => archiveThread(thread)}
                    style={ghost}
                  >
                    Archive
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteThread(thread)}
                    style={danger}
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}

const chip: React.CSSProperties = {
  padding: "7px 10px",
  borderRadius: 999,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.12)",
  fontSize: 12,
  fontWeight: 800,
};

const goldChip: React.CSSProperties = {
  ...chip,
  background: "rgba(232,196,107,.10)",
  border: "1px solid rgba(232,196,107,.22)",
  color: "#f8e7b0",
};

const button: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: 999,
  border: 0,
  background: "#e8c46b",
  color: "#000",
  fontWeight: 800,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const ghost: React.CSSProperties = {
  ...button,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.12)",
  color: "white",
};

const danger: React.CSSProperties = {
  ...button,
  background: "rgba(255,80,80,.12)",
  border: "1px solid rgba(255,80,80,.22)",
  color: "#fecaca",
};
