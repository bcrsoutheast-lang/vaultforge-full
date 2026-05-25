"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Folder = "active" | "unread" | "saved" | "archived" | "deleted";
type Lane = "Owner" | "Investor" | "Member" | "Deal Room" | "Pain Room" | "General";

type Thread = {
  id: string;
  lane: Lane;
  from: string;
  recipient: string;
  title: string;
  room: string;
  message: string;
  folder: Folder;
  unread: boolean;
  createdAt: string;
};

const THREADS_KEY = "vf_message_center_threads_v1";
const FOREVER_KEY = "vf_message_center_deleted_forever_v1";

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at 18% 10%, rgba(245,197,66,.12), transparent 32%), radial-gradient(circle at 86% 8%, rgba(120,0,30,.18), transparent 34%), #05070b",
  color: "#f7f8ff",
  padding: "28px 20px 90px",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const shell: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
};

const row: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  alignItems: "center",
};

const nav: React.CSSProperties = {
  ...row,
  marginBottom: 20,
};

const brand: React.CSSProperties = {
  color: "#ffda5e",
  fontWeight: 1000,
  fontSize: 28,
  letterSpacing: "-.04em",
};

const button: React.CSSProperties = {
  border: "1px solid rgba(207,216,230,.18)",
  background: "rgba(18,24,38,.92)",
  color: "#f7f8ff",
  borderRadius: 999,
  padding: "12px 18px",
  fontWeight: 900,
  textDecoration: "none",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const goldButton: React.CSSProperties = {
  ...button,
  background: "linear-gradient(135deg,#ffe16a,#f4bf37)",
  color: "#080a10",
  border: "1px solid rgba(255,220,90,.65)",
};

const redButton: React.CSSProperties = {
  ...button,
  background: "rgba(90,10,18,.72)",
  color: "#ffb2b2",
  border: "1px solid rgba(255,65,65,.65)",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(207,216,230,.16)",
  borderRadius: 26,
  background: "rgba(15,21,34,.88)",
  padding: 24,
  marginBottom: 20,
};

const goldCard: React.CSSProperties = {
  ...card,
  borderColor: "rgba(245,197,66,.42)",
  background:
    "linear-gradient(135deg,rgba(22,25,37,.96),rgba(33,31,20,.82))",
};

const tile: React.CSSProperties = {
  border: "1px solid rgba(245,197,66,.35)",
  borderRadius: 22,
  background: "rgba(17,23,36,.78)",
  padding: 20,
  color: "#f7f8ff",
  textAlign: "left",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))",
  gap: 14,
};

const threadGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(285px,1fr))",
  gap: 14,
};

const input: React.CSSProperties = {
  width: "100%",
  border: "1px solid rgba(207,216,230,.18)",
  background: "rgba(18,24,38,.92)",
  color: "#f7f8ff",
  borderRadius: 18,
  padding: "14px 16px",
  fontSize: 16,
  outline: "none",
  boxSizing: "border-box",
};

const label: React.CSSProperties = {
  color: "#ffda5e",
  textTransform: "uppercase",
  letterSpacing: ".34em",
  fontSize: 12,
  fontWeight: 1000,
  display: "block",
  marginBottom: 8,
};

const eyebrow: React.CSSProperties = {
  color: "#ffda5e",
  textTransform: "uppercase",
  letterSpacing: ".34em",
  fontSize: 12,
  fontWeight: 1000,
};

const h1: React.CSSProperties = {
  fontSize: "clamp(42px,7vw,82px)",
  lineHeight: ".92",
  letterSpacing: "-.08em",
  margin: "12px 0",
  fontWeight: 1000,
};

const h2: React.CSSProperties = {
  fontSize: "clamp(30px,4.5vw,54px)",
  lineHeight: ".95",
  letterSpacing: "-.065em",
  margin: "10px 0",
  fontWeight: 1000,
};

const h3: React.CSSProperties = {
  fontSize: 28,
  lineHeight: 1,
  letterSpacing: "-.05em",
  margin: "8px 0",
  fontWeight: 1000,
};

const sub: React.CSSProperties = {
  color: "rgba(235,240,255,.78)",
  fontSize: 20,
  lineHeight: 1.45,
  margin: "8px 0",
};

const muted: React.CSSProperties = {
  color: "rgba(235,240,255,.68)",
  fontSize: 15,
  lineHeight: 1.45,
  margin: "6px 0",
};

function parseThreads(): Thread[] {
  if (typeof window === "undefined") return [];

  try {
    const rows = JSON.parse(window.localStorage.getItem(THREADS_KEY) || "[]");
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function saveThreads(threads: Thread[]) {
  window.localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
}

function deletedForeverIds(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const rows = JSON.parse(window.localStorage.getItem(FOREVER_KEY) || "[]");
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function saveDeletedForever(id: string) {
  const ids = Array.from(new Set([...deletedForeverIds(), id]));
  window.localStorage.setItem(FOREVER_KEY, JSON.stringify(ids));
}

function currentEmail() {
  if (typeof window === "undefined") return "";

  return (
    window.localStorage.getItem("vf_email") ||
    window.localStorage.getItem("vaultforge_email") ||
    window.localStorage.getItem("email") ||
    ""
  );
}

function folderTitle(folder: Folder) {
  if (folder === "active") return "Active Threads";
  if (folder === "unread") return "Unread Threads";
  if (folder === "saved") return "Saved Threads";
  if (folder === "archived") return "Archived Threads";
  return "Deleted Threads";
}

function StatCard({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...tile,
        cursor: "pointer",
        minHeight: 150,
        borderColor: active ? "rgba(245,197,66,.75)" : "rgba(245,197,66,.35)",
      }}
    >
      <div style={eyebrow}>{label}</div>
      <div style={{ color: "#1e90ff", fontSize: 44, fontWeight: 1000, margin: "8px 0" }}>{count}</div>
      <p style={muted}>thread(s)</p>
      <p style={{ ...muted, color: "#ffda5e", fontWeight: 950 }}>Tap to open</p>
    </button>
  );
}

export default function MessagesPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [folder, setFolder] = useState<Folder>("active");
  const [selected, setSelected] = useState<Thread | null>(null);

  const [lane, setLane] = useState<Lane>("Owner");
  const [from, setFrom] = useState("");
  const [recipient, setRecipient] = useState("VaultForge Owner");
  const [title, setTitle] = useState("");
  const [room, setRoom] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const forever = new Set(deletedForeverIds());
    const loaded = parseThreads().filter((thread) => !forever.has(thread.id));

    setThreads(loaded);

    const email = currentEmail();
    if (email) setFrom(email);
  }, []);

  const grouped = useMemo(() => {
    return {
      active: threads.filter((thread) => thread.folder === "active"),
      unread: threads.filter((thread) => thread.unread && thread.folder !== "deleted"),
      saved: threads.filter((thread) => thread.folder === "saved"),
      archived: threads.filter((thread) => thread.folder === "archived"),
      deleted: threads.filter((thread) => thread.folder === "deleted"),
    };
  }, [threads]);

  const visible = folder === "unread" ? grouped.unread : grouped[folder];

  function persist(next: Thread[]) {
    setThreads(next);
    saveThreads(next);
  }

  function createThread() {
    const cleanTitle = title.trim();
    const cleanMessage = message.trim();

    if (!cleanTitle && !cleanMessage) return;

    const thread: Thread = {
      id: `thread-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      lane,
      from: from.trim() || "Not listed",
      recipient: recipient.trim() || "VaultForge Owner",
      title: cleanTitle || "Untitled Message",
      room: room.trim() || "General",
      message: cleanMessage || "No message entered.",
      folder: "active",
      unread: true,
      createdAt: new Date().toLocaleString(),
    };

    const next = [thread, ...threads];
    persist(next);
    setSelected(thread);
    setFolder("active");
    setTitle("");
    setRoom("");
    setMessage("");
  }

  function moveThread(id: string, nextFolder: Folder) {
    const next = threads.map((thread) =>
      thread.id === id
        ? { ...thread, folder: nextFolder, unread: nextFolder === "unread" ? true : thread.unread }
        : thread
    );

    persist(next);

    if (selected?.id === id) {
      setSelected({ ...selected, folder: nextFolder });
    }

    setFolder(nextFolder);
  }

  function markRead(id: string, unread: boolean) {
    const next = threads.map((thread) =>
      thread.id === id ? { ...thread, unread } : thread
    );

    persist(next);

    if (selected?.id === id) {
      setSelected({ ...selected, unread });
    }
  }

  function deleteForever(id: string) {
    saveDeletedForever(id);
    const next = threads.filter((thread) => thread.id !== id);
    persist(next);
    setSelected(null);
    setFolder("deleted");
  }

  return (
    <main style={page}>
      <div style={shell}>
        <nav style={nav}>
          <div style={brand}>VAULTFORGE</div>
          <Link href="/" style={button}>Home</Link>
          <Link href="/investor-room" style={button}>Investor Room</Link>
          <Link href="/command" style={button}>Command</Link>
          <Link href="/messages" style={goldButton}>Messages</Link>
          <Link href="/logout" style={redButton}>Logout</Link>
        </nav>

        <section style={goldCard}>
          <div style={eyebrow}>VaultForge Message Command</div>
          <h1 style={h1}>Messages by room, sender, recipient, and title.</h1>
          <p style={sub}>
            This is the clean message center. It is separate from member area. Every thread should show From, Recipient, Title, Room, and Message.
          </p>
        </section>

        <section style={card}>
          <div style={eyebrow}>Message Folders</div>
          <div style={{ ...grid, marginTop: 16 }}>
            <StatCard label="Active" count={grouped.active.length} active={folder === "active"} onClick={() => setFolder("active")} />
            <StatCard label="Unread" count={grouped.unread.length} active={folder === "unread"} onClick={() => setFolder("unread")} />
            <StatCard label="Saved" count={grouped.saved.length} active={folder === "saved"} onClick={() => setFolder("saved")} />
            <StatCard label="Archived" count={grouped.archived.length} active={folder === "archived"} onClick={() => setFolder("archived")} />
            <StatCard label="Deleted" count={grouped.deleted.length} active={folder === "deleted"} onClick={() => setFolder("deleted")} />
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Create Command Thread</div>

          <div style={{ ...grid, marginTop: 16 }}>
            <label>
              <span style={label}>Lane</span>
              <select value={lane} onChange={(event) => setLane(event.target.value as Lane)} style={input}>
                <option>Owner</option>
                <option>Investor</option>
                <option>Member</option>
                <option>Deal Room</option>
                <option>Pain Room</option>
                <option>General</option>
              </select>
            </label>

            <label>
              <span style={label}>From</span>
              <input value={from} onChange={(event) => setFrom(event.target.value)} placeholder="sender email/name" style={input} />
            </label>

            <label>
              <span style={label}>Recipient</span>
              <input value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="recipient email/name" style={input} />
            </label>

            <label>
              <span style={label}>Title</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="message title" style={input} />
            </label>

            <label>
              <span style={label}>Room</span>
              <input value={room} onChange={(event) => setRoom(event.target.value)} placeholder="Deal Room / Pain Room / General" style={input} />
            </label>
          </div>

          <label style={{ display: "block", marginTop: 16 }}>
            <span style={label}>Message</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Write the message here"
              rows={5}
              style={{ ...input, resize: "vertical" }}
            />
          </label>

          <div style={{ ...row, marginTop: 16 }}>
            <button type="button" onClick={createThread} style={goldButton}>
              Create Message Thread
            </button>
          </div>
        </section>

        {selected ? (
          <section style={card}>
            <div style={eyebrow}>{selected.lane} • {selected.folder}</div>
            <h2 style={h2}>{selected.title}</h2>

            <div style={{ ...grid, marginTop: 14 }}>
              <div style={tile}>
                <div style={eyebrow}>From</div>
                <p style={sub}>{selected.from}</p>
              </div>

              <div style={tile}>
                <div style={eyebrow}>Recipient</div>
                <p style={sub}>{selected.recipient}</p>
              </div>

              <div style={tile}>
                <div style={eyebrow}>Room</div>
                <p style={sub}>{selected.room}</p>
              </div>
            </div>

            <div style={{ ...tile, marginTop: 14 }}>
              <div style={eyebrow}>Message</div>
              <p style={sub}>{selected.message}</p>
              <p style={muted}>Created: {selected.createdAt}</p>
            </div>

            <div style={{ ...row, marginTop: 16 }}>
              <button type="button" style={goldButton} onClick={() => moveThread(selected.id, "active")}>Active</button>
              <button type="button" style={button} onClick={() => markRead(selected.id, false)}>Mark Read</button>
              <button type="button" style={button} onClick={() => markRead(selected.id, true)}>Mark Unread</button>
              <button type="button" style={button} onClick={() => moveThread(selected.id, "saved")}>Save</button>
              <button type="button" style={button} onClick={() => moveThread(selected.id, "archived")}>Archive</button>
              <button type="button" style={redButton} onClick={() => moveThread(selected.id, "deleted")}>Delete</button>
              {selected.folder === "deleted" ? (
                <button type="button" style={redButton} onClick={() => deleteForever(selected.id)}>Delete Forever</button>
              ) : null}
              <button type="button" style={button} onClick={() => setSelected(null)}>Close</button>
            </div>
          </section>
        ) : null}

        <section style={card}>
          <div style={eyebrow}>{folderTitle(folder)}</div>
          <h2 style={h2}>Thread Cards</h2>

          {visible.length ? (
            <div style={threadGrid}>
              {visible.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => {
                    setSelected(thread);
                    markRead(thread.id, false);
                  }}
                  style={{
                    ...tile,
                    cursor: "pointer",
                    borderColor: thread.unread ? "rgba(245,197,66,.78)" : "rgba(245,197,66,.35)",
                  }}
                >
                  <div style={eyebrow}>{thread.lane} • {thread.folder}</div>
                  <h3 style={h3}>{thread.title}</h3>
                  <p style={muted}>
                    <strong style={{ color: "#f7f8ff" }}>From:</strong> {thread.from}
                  </p>
                  <p style={muted}>
                    <strong style={{ color: "#f7f8ff" }}>Recipient:</strong> {thread.recipient}
                  </p>
                  <p style={muted}>
                    <strong style={{ color: "#f7f8ff" }}>Room:</strong> {thread.room}
                  </p>
                  <p style={muted}>{thread.message}</p>
                  <p style={{ ...muted, color: "#ffda5e", fontWeight: 950 }}>Open Thread</p>
                </button>
              ))}
            </div>
          ) : (
            <div style={tile}>
              <h3 style={h3}>No threads here.</h3>
              <p style={sub}>Create a thread or open another folder.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
