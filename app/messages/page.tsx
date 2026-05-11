"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Message = Record<string, any>;

type BucketKey =
  | "all"
  | "pain"
  | "alerts"
  | "activity"
  | "projects"
  | "routing"
  | "introductions"
  | "general"
  | "archived";

type Bucket = {
  key: BucketKey;
  title: string;
  label: string;
  subtitle: string;
  mission: string;
  href: string;
  threads: Message[];
  accent: string;
};

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

function fmt(value: unknown) {
  const date = new Date(String(value || ""));
  if (Number.isNaN(date.getTime())) return "Recent";
  return date.toLocaleString();
}

function metadataOf(thread: Message) {
  return typeof thread?.metadata === "object" && thread.metadata ? thread.metadata : {};
}

function textBlob(thread: Message) {
  const metadata = metadataOf(thread);

  return [
    thread.subject,
    thread.body,
    thread.message,
    thread.thread_id,
    thread.signal_id,
    thread.item_id,
    thread.status,
    thread.source,
    metadata.source,
    metadata.source_page,
    metadata.source_table,
    metadata.context_title,
    metadata.signal_id,
    metadata.item_id,
  ]
    .join(" ")
    .toLowerCase();
}

function threadCategory(thread: Message): BucketKey {
  if (thread.status === "archived") return "archived";

  const blob = textBlob(thread);

  if (blob.includes("pain") || blob.includes("vf_pain") || blob.includes("pain-room") || blob.includes("pain feed")) return "pain";
  if (blob.includes("alert") || blob.includes("need more info")) return "alerts";
  if (blob.includes("activity") || blob.includes("event")) return "activity";
  if (blob.includes("project") || blob.includes("deal-room") || blob.includes("deal room") || blob.includes("property")) return "projects";
  if (blob.includes("routing") || blob.includes("route")) return "routing";
  if (blob.includes("intro") || blob.includes("introduction")) return "introductions";

  return "general";
}

function latestThread(threads: Message[]) {
  if (!threads.length) return null;

  return [...threads].sort(
    (a, b) =>
      new Date(String(b.created_at || b.updated_at || 0)).getTime() -
      new Date(String(a.created_at || a.updated_at || 0)).getTime()
  )[0];
}

function latestPreview(threads: Message[]) {
  const latest = latestThread(threads);
  if (!latest) return "No conversations in this station.";
  return clean(latest.body || latest.message || latest.subject || "Open latest conversation.");
}

function latestTime(threads: Message[]) {
  const latest = latestThread(threads);
  if (!latest) return "—";
  return fmt(latest.created_at || latest.updated_at);
}

function unreadCount(threads: Message[], email: string) {
  const viewer = cleanEmail(email);

  return threads.filter((thread) => {
    const incoming = cleanEmail(thread.to_email) === viewer;
    return incoming && !thread.is_read && thread.status !== "archived" && thread.status !== "deleted";
  }).length;
}

function sourcePathForBucket(key: BucketKey) {
  if (key === "pain") return "/pain-feed";
  if (key === "alerts") return "/alerts";
  if (key === "activity") return "/activity";
  if (key === "projects") return "/projects";
  if (key === "routing") return "/routing-inbox";
  if (key === "introductions") return "/introductions";
  return "/messages";
}

function sourcePathForThread(thread: Message) {
  const category = threadCategory(thread);

  if (thread.signal_id && category !== "projects") {
    return `/signals/${encodeURIComponent(thread.signal_id)}`;
  }

  return sourcePathForBucket(category);
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.18), transparent 28%), radial-gradient(circle at 85% 10%, rgba(157,243,191,.12), transparent 26%), radial-gradient(circle at 90% 85%, rgba(181,92,255,.14), transparent 30%), linear-gradient(180deg,#020303 0%,#071326 48%,#020303 100%)",
  color: "white",
  padding: "22px 16px 92px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { width: "min(1240px,100%)", margin: "0 auto" };

const glass: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.28)",
  borderRadius: 32,
  padding: 24,
  background:
    "linear-gradient(145deg,rgba(255,255,255,.092),rgba(255,255,255,.034)), linear-gradient(135deg,rgba(232,196,107,.08),rgba(157,243,191,.035))",
  marginBottom: 16,
  boxShadow: "0 34px 110px rgba(0,0,0,.34)",
  backdropFilter: "blur(14px)",
};

const stationCard: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.22)",
  borderRadius: 28,
  padding: 22,
  background: "linear-gradient(145deg,rgba(255,255,255,.086),rgba(255,255,255,.032))",
  color: "white",
  textDecoration: "none",
  display: "block",
  boxShadow: "0 20px 70px rgba(0,0,0,.28)",
  cursor: "pointer",
  textAlign: "left",
  minHeight: 260,
};

const threadCard: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.24)",
  borderRadius: 28,
  padding: 22,
  background: "linear-gradient(145deg,rgba(255,255,255,.072),rgba(255,255,255,.026))",
  marginBottom: 14,
  boxShadow: "0 20px 70px rgba(0,0,0,.24)",
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

const muted: React.CSSProperties = { color: "#cbd5e1", lineHeight: 1.55 };

const button: React.CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: 46,
  borderRadius: 999,
  padding: "12px 16px",
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
  ...ghost,
  border: "1px solid rgba(255,120,120,.35)",
  color: "#ffd0d0",
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.08)",
  color: "white",
  padding: "15px 16px",
  fontSize: 16,
  outline: "none",
};

const chip: React.CSSProperties = {
  display: "inline-flex",
  border: "1px solid rgba(157,243,191,.22)",
  borderRadius: 999,
  padding: "7px 10px",
  color: "#9df3bf",
  background: "rgba(157,243,191,.07)",
  margin: "0 7px 7px 0",
  fontSize: 12,
  fontWeight: 850,
};

const softChip: React.CSSProperties = {
  ...chip,
  color: "#e5e7eb",
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(255,255,255,.055)",
};

export default function MessagesCommandCenter() {
  const [email, setEmail] = useState("");
  const [threads, setThreads] = useState<Message[]>([]);
  const [status, setStatus] = useState("Loading messages...");
  const [busyThread, setBusyThread] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState("");
  const [activeBucket, setActiveBucket] = useState<BucketKey>("all");

  async function load(nextShowArchived = showArchived) {
    const viewer = getEmail();
    setEmail(viewer);
    setStatus("Loading messages...");

    if (!viewer) {
      setThreads([]);
      setStatus("Login email not found. Please log in again.");
      return;
    }

    try {
      const query = new URLSearchParams();
      query.set("email", viewer);
      if (nextShowArchived) query.set("include_archived", "1");

      const res = await fetch(`/api/simple-messages?${query.toString()}`, {
        cache: "no-store",
        headers: { "x-vf-email": viewer },
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) throw new Error(data?.error || "Could not load messages.");

      setThreads(Array.isArray(data.threads) ? data.threads : []);
      setStatus("");
    } catch (error: any) {
      setStatus(error?.message || "Could not load messages.");
    }
  }

  async function cleanup(threadId: string, action: "archive" | "restore" | "delete") {
    if (!threadId) return;

    setBusyThread(threadId);
    setStatus("");

    try {
      const endpoint =
        action === "delete"
          ? `/api/simple-messages?thread_id=${encodeURIComponent(threadId)}`
          : "/api/simple-messages";

      const res = await fetch(endpoint, {
        method: action === "delete" ? "DELETE" : "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": email,
        },
        body: JSON.stringify({
          email,
          thread_id: threadId,
          action,
        }),
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) throw new Error(data?.error || `Could not ${action} thread.`);

      await load(showArchived);
    } catch (error: any) {
      setStatus(error?.message || `Could not ${action} thread.`);
    } finally {
      setBusyThread("");
    }
  }

  useEffect(() => {
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buckets = useMemo<Bucket[]>(() => {
    const activeThreads = threads.filter((thread) => thread.status !== "deleted");
    const nonArchived = activeThreads.filter((thread) => thread.status !== "archived");
    const archived = activeThreads.filter((thread) => thread.status === "archived");

    const bucketMap: Record<BucketKey, Message[]> = {
      all: nonArchived,
      pain: [],
      alerts: [],
      activity: [],
      projects: [],
      routing: [],
      introductions: [],
      general: [],
      archived,
    };

    for (const thread of nonArchived) {
      const category = threadCategory(thread);
      if (category === "archived") bucketMap.archived.push(thread);
      else bucketMap[category].push(thread);
    }

    return [
      {
        key: "all",
        title: "All Messages",
        label: "Command",
        subtitle: "Everything active.",
        mission: "One clean view across the whole network.",
        href: "/messages",
        threads: bucketMap.all,
        accent: "#e8c46b",
      },
      {
        key: "pain",
        title: "Pain",
        label: "Intake",
        subtitle: "Pain feed and problem requests.",
        mission: "Problems that need action, routing, or owner contact.",
        href: "/pain-feed",
        threads: bucketMap.pain,
        accent: "#ef4444",
      },
      {
        key: "alerts",
        title: "Alerts",
        label: "Signals",
        subtitle: "Need More Info and alert responses.",
        mission: "High-signal follow-ups from intelligence windows.",
        href: "/alerts",
        threads: bucketMap.alerts,
        accent: "#f59e0b",
      },
      {
        key: "activity",
        title: "Activity",
        label: "Events",
        subtitle: "Activity stream and event replies.",
        mission: "Operational movement from the live activity board.",
        href: "/activity",
        threads: bucketMap.activity,
        accent: "#38bdf8",
      },
      {
        key: "projects",
        title: "Projects",
        label: "Deals",
        subtitle: "Deal rooms and property work.",
        mission: "Project, property, and deal-room conversations.",
        href: "/projects",
        threads: bucketMap.projects,
        accent: "#9df3bf",
      },
      {
        key: "routing",
        title: "Routing",
        label: "Flow",
        subtitle: "Routing action conversations.",
        mission: "Member fit, routing, and execution movement.",
        href: "/routing-inbox",
        threads: bucketMap.routing,
        accent: "#b55cff",
      },
      {
        key: "introductions",
        title: "Introductions",
        label: "Network",
        subtitle: "Controlled intro conversations.",
        mission: "Warm introductions and connection control.",
        href: "/introductions",
        threads: bucketMap.introductions,
        accent: "#fb7185",
      },
      {
        key: "general",
        title: "General",
        label: "Inbox",
        subtitle: "Unsorted conversations.",
        mission: "Everything useful that has not been assigned a source yet.",
        href: "/messages",
        threads: bucketMap.general,
        accent: "#94a3b8",
      },
      {
        key: "archived",
        title: "Archived",
        label: "Cleaned",
        subtitle: "Stored for review.",
        mission: "Closed or cleaned conversations kept out of the way.",
        href: "/messages",
        threads: bucketMap.archived,
        accent: "#64748b",
      },
    ];
  }, [threads]);

  const activeBucketData = buckets.find((bucket) => bucket.key === activeBucket) || buckets[0];

  const activeThreads = useMemo(() => {
    const q = search.trim().toLowerCase();
    const bucket = buckets.find((item) => item.key === activeBucket);
    let source = bucket ? bucket.threads : threads;

    if (activeBucket === "archived") {
      source = source.filter((thread) => thread.status === "archived");
    }

    if (!q) return source;

    return source.filter((thread) =>
      [
        thread.subject,
        thread.body,
        thread.from_email,
        thread.to_email,
        thread.thread_id,
        thread.signal_id,
        thread.item_id,
        thread.status,
        textBlob(thread),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [threads, buckets, activeBucket, search]);

  const totalActive = buckets.find((bucket) => bucket.key === "all")?.threads.length || 0;
  const totalArchived = buckets.find((bucket) => bucket.key === "archived")?.threads.length || 0;
  const totalUnread = unreadCount(threads, email);
  const highPriorityCount =
    buckets.find((bucket) => bucket.key === "pain")?.threads.length ||
    0 + (buckets.find((bucket) => bucket.key === "alerts")?.threads.length || 0);

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.07);
        }

        input::placeholder {
          color: rgba(255,255,255,.42);
        }

        @media (max-width: 860px) {
          .vf-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .vf-actions > * {
            width: 100%;
            box-sizing: border-box;
            justify-content: center;
            margin: 0 !important;
          }

          .vf-stations {
            grid-template-columns: 1fr !important;
          }

          .vf-metrics {
            grid-template-columns: 1fr 1fr !important;
          }
        }

        @media (max-width: 540px) {
          .vf-metrics {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div style={wrap}>
        <nav style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <Link href="/dashboard" style={{ color: "#f8e7b0", textDecoration: "none", fontWeight: 950, letterSpacing: ".12em" }}>
            VAULTFORGE
          </Link>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href="/pain-feed" style={ghost}>Pain Feed</Link>
            <Link href="/alerts" style={ghost}>Alerts</Link>
            <Link href="/activity" style={ghost}>Activity</Link>
            <Link href="/routing-inbox" style={ghost}>Routing</Link>
          </div>
        </nav>

        <section style={glass}>
          <p style={eyebrow}>VaultForge Communications OS</p>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.5fr) minmax(260px,.8fr)", gap: 18, alignItems: "end" }}>
            <div>
              <h1 style={{ fontSize: "clamp(54px,11vw,104px)", lineHeight: 0.84, margin: "10px 0 18px", letterSpacing: "-.07em" }}>
                Message command center.
              </h1>
              <p style={{ ...muted, fontSize: 19, maxWidth: 760 }}>
                Every conversation has a station. Pain, alerts, projects, routing, introductions, and activity stay organized so operators know exactly where to work.
              </p>
            </div>
            <div style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 24, padding: 16, background: "rgba(0,0,0,.18)" }}>
              <p style={{ ...eyebrow, color: "#9df3bf" }}>Operator View</p>
              <p style={{ ...muted, margin: "0 0 8px" }}>Signed in</p>
              <strong style={{ overflowWrap: "anywhere" }}>{email || "unknown"}</strong>
            </div>
          </div>

          <div className="vf-metrics" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12, marginTop: 20 }}>
            <div style={{ border: "1px solid rgba(232,196,107,.24)", borderRadius: 22, padding: 16, background: "rgba(232,196,107,.08)" }}>
              <p style={eyebrow}>Active</p>
              <strong style={{ fontSize: 42 }}>{totalActive}</strong>
            </div>
            <div style={{ border: "1px solid rgba(157,243,191,.24)", borderRadius: 22, padding: 16, background: "rgba(157,243,191,.07)" }}>
              <p style={{ ...eyebrow, color: "#9df3bf" }}>Unread</p>
              <strong style={{ fontSize: 42 }}>{totalUnread}</strong>
            </div>
            <div style={{ border: "1px solid rgba(239,68,68,.24)", borderRadius: 22, padding: 16, background: "rgba(239,68,68,.07)" }}>
              <p style={{ ...eyebrow, color: "#fecaca" }}>Pressure</p>
              <strong style={{ fontSize: 42 }}>{highPriorityCount}</strong>
            </div>
            <div style={{ border: "1px solid rgba(148,163,184,.22)", borderRadius: 22, padding: 16, background: "rgba(148,163,184,.07)" }}>
              <p style={{ ...eyebrow, color: "#cbd5e1" }}>Archived</p>
              <strong style={{ fontSize: 42 }}>{totalArchived}</strong>
            </div>
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            <button type="button" onClick={() => load(showArchived)} style={button}>
              Refresh Command
            </button>
            <button
              type="button"
              onClick={() => {
                const next = !showArchived;
                setShowArchived(next);
                load(next);
                if (next) setActiveBucket("archived");
                else if (activeBucket === "archived") setActiveBucket("all");
              }}
              style={ghost}
            >
              {showArchived ? "Hide Archived" : "Load Archived"}
            </button>
            <Link href="/messages" style={ghost}>Inbox</Link>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
          </div>
        </section>

        <section className="vf-stations" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(255px,1fr))", gap: 14, marginBottom: 16 }}>
          {buckets.map((bucket) => {
            if (bucket.key === "archived" && !showArchived) return null;

            const count = bucket.threads.length;
            const unread = unreadCount(bucket.threads, email);
            const active = activeBucket === bucket.key;

            return (
              <button
                key={bucket.key}
                type="button"
                onClick={() => setActiveBucket(bucket.key)}
                style={{
                  ...stationCard,
                  borderColor: active ? bucket.accent : "rgba(232,196,107,.22)",
                  background: active
                    ? `linear-gradient(145deg,${bucket.accent}28,rgba(255,255,255,.055))`
                    : stationCard.background,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                  <div>
                    <p style={{ ...eyebrow, color: bucket.accent }}>{bucket.label}</p>
                    <h2 style={{ fontSize: 30, lineHeight: 1, margin: "0 0 10px" }}>{bucket.title}</h2>
                  </div>
                  <div style={{ width: 54, height: 54, borderRadius: 18, display: "grid", placeItems: "center", border: `1px solid ${bucket.accent}66`, color: bucket.accent, background: `${bucket.accent}12`, fontWeight: 950 }}>
                    {count}
                  </div>
                </div>

                <p style={{ ...muted, minHeight: 42, marginTop: 4 }}>{bucket.subtitle}</p>
                <p style={{ color: "#94a3b8", fontSize: 13, minHeight: 40, lineHeight: 1.35 }}>
                  {bucket.mission}
                </p>

                <div style={{ marginTop: 12 }}>
                  <span style={chip}>{count} total</span>
                  <span style={unread ? chip : softChip}>{unread} unread</span>
                </div>

                <div style={{ borderTop: "1px solid rgba(255,255,255,.10)", paddingTop: 12, marginTop: 12 }}>
                  <p style={{ color: "#cbd5e1", fontSize: 13, lineHeight: 1.4, margin: 0 }}>
                    {latestPreview(bucket.threads).slice(0, 108)}
                  </p>
                  <p style={{ color: "#94a3b8", fontSize: 12, margin: "8px 0 0" }}>{latestTime(bucket.threads)}</p>
                </div>
              </button>
            );
          })}
        </section>

        <section style={glass}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
            <div>
              <p style={{ ...eyebrow, color: activeBucketData.accent }}>{activeBucketData.label} Station</p>
              <h2 style={{ fontSize: 36, lineHeight: 1, margin: "0 0 8px" }}>{activeBucketData.title}</h2>
              <p style={{ ...muted, margin: 0 }}>{activeBucketData.mission}</p>
            </div>
            <Link href={activeBucketData.href} style={ghost}>
              Open Source Page
            </Link>
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search sender, owner, subject, signal id, thread id..."
            style={input}
          />
        </section>

        {status ? <section style={glass}>{status}</section> : null}

        {activeThreads.length === 0 && !status ? (
          <section style={glass}>No conversations in this station yet.</section>
        ) : null}

        {activeThreads.map((thread) => {
          const archived = thread.status === "archived";
          const threadId = clean(thread.thread_id);
          const busy = busyThread === threadId;
          const category = threadCategory(thread);
          const bucket = buckets.find((item) => item.key === category) || buckets[0];

          return (
            <article
              key={threadId}
              style={{
                ...threadCard,
                opacity: archived ? 0.72 : 1,
                borderColor: archived ? "rgba(148,163,184,.32)" : `${bucket.accent}77`,
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 14, alignItems: "start" }}>
                <div>
                  <p style={{ ...eyebrow, color: bucket.accent }}>{archived ? "Archived Thread" : `${bucket.title} Thread`}</p>
                  <h2 style={{ margin: "0 0 8px", fontSize: 28 }}>{thread.subject || "VaultForge message"}</h2>
                  <p style={{ ...muted, margin: "0 0 12px" }}>{thread.body || "Open conversation."}</p>
                </div>
                <div style={{ border: `1px solid ${bucket.accent}55`, borderRadius: 16, padding: "9px 11px", color: bucket.accent, background: `${bucket.accent}12`, fontWeight: 950 }}>
                  {category.toUpperCase()}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "12px 0" }}>
                <span style={softChip}>From: {thread.from_email}</span>
                <span style={softChip}>To: {thread.to_email}</span>
                <span style={softChip}>Status: {thread.status || "open"}</span>
                <span style={softChip}>{fmt(thread.created_at)}</span>
                {thread.signal_id ? <span style={softChip}>Signal: {thread.signal_id}</span> : null}
              </div>

              <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                <Link href={`/messages/${encodeURIComponent(threadId)}?email=${encodeURIComponent(email)}`} style={button}>
                  Open Thread
                </Link>

                <Link href={sourcePathForThread(thread)} style={ghost}>
                  Open Source
                </Link>

                {archived ? (
                  <button type="button" disabled={busy} onClick={() => cleanup(threadId, "restore")} style={ghost}>
                    {busy ? "Working..." : "Restore"}
                  </button>
                ) : (
                  <button type="button" disabled={busy} onClick={() => cleanup(threadId, "archive")} style={ghost}>
                    {busy ? "Working..." : "Archive"}
                  </button>
                )}

                <button type="button" disabled={busy} onClick={() => cleanup(threadId, "delete")} style={danger}>
                  {busy ? "Working..." : "Delete"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
