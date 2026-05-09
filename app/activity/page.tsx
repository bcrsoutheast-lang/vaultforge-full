"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type ActivityItem = {
  id: string;
  type: string;
  title: string;
  note?: string;
  priority?: string;
  created_at?: string;
  signal_id?: string;
  item_id?: string;
  introduction_id?: string;
  response?: string;
  member_email?: string;
};

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.18), transparent 28%), radial-gradient(circle at top right, rgba(157,243,191,.13), transparent 25%), radial-gradient(circle at bottom right, rgba(181,92,255,.18), transparent 28%), linear-gradient(180deg,#02040a 0%,#071326 48%,#030509 100%)",
  color: "white",
  padding: "28px 18px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1280, margin: "0 auto" };

const hero: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.34)",
  background:
    "linear-gradient(145deg, rgba(232,196,107,.12), rgba(181,92,255,.10), rgba(255,255,255,.035))",
  borderRadius: 34,
  padding: 26,
  marginBottom: 22,
  boxShadow: "0 30px 90px rgba(0,0,0,.34)",
};

const feedCard: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.13)",
  background:
    "linear-gradient(145deg, rgba(181,92,255,.10), rgba(232,196,107,.055), rgba(255,255,255,.03))",
  borderRadius: 24,
  padding: 22,
  marginBottom: 18,
  boxShadow: "0 26px 80px rgba(0,0,0,.30)",
};

const btn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg,#f5d978,#9df3bf 55%,#b55cff)",
  color: "#06100a",
  border: "none",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 950,
  textDecoration: "none",
  cursor: "pointer",
  margin: "6px 6px 0 0",
  minHeight: 46,
};

const ghost: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.055)",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 900,
  textDecoration: "none",
  cursor: "pointer",
  margin: "6px 6px 0 0",
  minHeight: 46,
};

const chip: React.CSSProperties = {
  display: "inline-flex",
  border: "1px solid rgba(157,243,191,.25)",
  color: "#9df3bf",
  background: "rgba(157,243,191,.07)",
  borderRadius: 999,
  padding: "8px 11px",
  fontWeight: 850,
  fontSize: 13,
  margin: "0 7px 7px 0",
};

function clean(value: unknown) {
  return String(value || "").trim();
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

  return (
    localStorage.getItem("vf_email") ||
    sessionStorage.getItem("vf_email") ||
    readCookie("vf_email") ||
    readCookie("vf_admin_email") ||
    ""
  )
    .trim()
    .toLowerCase();
}

function isOwner(email: string) {
  return (
    email === OWNER_EMAIL ||
    readCookie("vf_admin") === "1" ||
    readCookie("isAdmin") === "true"
  );
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function label(value: string) {
  const text = clean(value || "activity").replace(/_/g, " ");
  return text.slice(0, 1).toUpperCase() + text.slice(1);
}

function tone(type: string) {
  const value = clean(type).toLowerCase();

  if (value.includes("response")) return "#9df3bf";
  if (value.includes("intro")) return "#f5d978";
  if (value.includes("routing")) return "#d8b5ff";

  return "#9df3bf";
}

function heatLabel(item: ActivityItem) {
  const priority = clean(item.priority).toLowerCase();
  const response = clean(item.response).toLowerCase();
  const type = clean(item.type).toLowerCase();

  if (
    priority === "urgent" ||
    response === "interested" ||
    response === "request_call" ||
    response === "request_intro"
  ) {
    return "Hot";
  }

  if (
    priority === "high" ||
    response === "need_details" ||
    type.includes("controlled_introduction")
  ) {
    return "Warm";
  }

  return "Normal";
}

function heatTone(labelValue: string) {
  if (labelValue === "Hot") return "#ffb3b3";
  if (labelValue === "Warm") return "#f5d978";
  return "#9df3bf";
}

export default function ActivityStreamPage() {
  const [email, setEmail] = useState("");
  const [owner, setOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feed, setFeed] = useState<ActivityItem[]>([]);
  const [filter, setFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);

    try {
      const currentEmail = getEmail();
      const currentOwner = isOwner(currentEmail);

      setEmail(currentEmail);
      setOwner(currentOwner);

      const headers = {
        "x-vf-email": currentEmail,
        "x-vf-admin": currentOwner ? "1" : "0",
      };

      const [routingRes, introRes, introResponseRes] = await Promise.all([
        fetch(`/api/routing/actions?email=${encodeURIComponent(currentEmail)}&owner=${currentOwner ? "1" : "0"}`, {
          cache: "no-store",
          headers,
        }),
        fetch(`/api/routing/introductions?email=${encodeURIComponent(currentEmail)}&owner=${currentOwner ? "1" : "0"}`, {
          cache: "no-store",
          headers,
        }),
        fetch(`/api/routing/introduction-responses?email=${encodeURIComponent(currentEmail)}&owner=${currentOwner ? "1" : "0"}`, {
          cache: "no-store",
          headers,
        }),
      ]);

      const routingData = await safeJson(routingRes);
      const introData = await safeJson(introRes);
      const responseData = await safeJson(introResponseRes);

      const routingItems = Array.isArray(routingData?.actions)
        ? routingData.actions.map((item: any) => ({
            id: `routing-${item.id || Math.random()}`,
            type: "routing_action",
            title: item.title || "Routing action created",
            note: item.note,
            priority: item.priority,
            created_at: item.created_at,
            signal_id: item.signal_id,
            item_id: item.item_id,
          }))
        : [];

      const introItems = Array.isArray(introData?.introductions)
        ? introData.introductions.map((item: any) => ({
            id: `intro-${item.id || Math.random()}`,
            type: "controlled_introduction",
            title: item.title || "Controlled introduction staged",
            note: item.note,
            priority: item.priority,
            created_at: item.created_at,
            signal_id: item.signal_id,
            item_id: item.item_id,
            introduction_id: item.id,
          }))
        : [];

      const responseItems = Array.isArray(responseData?.responses)
        ? responseData.responses.map((item: any) => ({
            id: `response-${item.id || Math.random()}`,
            type: `introduction_response_${item.response || "activity"}`,
            title: item.title || "Introduction response received",
            note: item.note,
            priority: item.priority,
            created_at: item.created_at,
            signal_id: item.signal_id,
            item_id: item.item_id,
            introduction_id: item.introduction_id,
            response: item.response,
            member_email: item.member_email,
          }))
        : [];

      const merged = [...routingItems, ...introItems, ...responseItems]
        .sort((a, b) => {
          const aTime = new Date(a.created_at || 0).getTime();
          const bTime = new Date(b.created_at || 0).getTime();
          return bTime - aTime;
        })
        .slice(0, 120);

      setFeed(merged);
    } catch {
      setFeed([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const metrics = useMemo(() => {
    return {
      total: feed.length,
      routing: feed.filter((item) => item.type.includes("routing")).length,
      intros: feed.filter((item) => item.type.includes("introduction") && !item.type.includes("response")).length,
      responses: feed.filter((item) => item.type.includes("response")).length,
      urgent: feed.filter((item) => clean(item.priority).toLowerCase() === "urgent").length,
      high: feed.filter((item) => clean(item.priority).toLowerCase() === "high").length,
      medium: feed.filter((item) => clean(item.priority).toLowerCase() === "medium").length,
      hot: feed.filter((item) => heatLabel(item) === "Hot").length,
      warm: feed.filter((item) => heatLabel(item) === "Warm").length,
      normal: feed.filter((item) => heatLabel(item) === "Normal").length,
    };
  }, [feed]);

  const filteredFeed = useMemo(() => {
    let list = feed;

    if (filter === "routing") {
      list = list.filter((item) => item.type.includes("routing"));
    }

    if (filter === "introductions") {
      list = list.filter((item) => item.type.includes("introduction") && !item.type.includes("response"));
    }

    if (filter === "responses") {
      list = list.filter((item) => item.type.includes("response"));
    }

    if (priorityFilter !== "all") {
      list = list.filter((item) => clean(item.priority).toLowerCase() === priorityFilter);
    }

    const q = search.trim().toLowerCase();

    if (q) {
      list = list.filter((item) => {
        const searchable = [
          item.type,
          item.title,
          item.note,
          item.priority,
          item.created_at,
          item.signal_id,
          item.item_id,
          item.introduction_id,
          item.response,
          item.member_email,
        ]
          .map((value) => String(value || "").toLowerCase())
          .join(" ");

        return searchable.includes(q);
      });
    }

    return list;
  }, [feed, filter, priorityFilter, search]);

  const latestRouting = useMemo(() => {
    return feed.find((item) => item.type.includes("routing")) || null;
  }, [feed]);

  const latestIntro = useMemo(() => {
    return feed.find((item) => item.type.includes("introduction") && !item.type.includes("response")) || null;
  }, [feed]);

  const latestResponse = useMemo(() => {
    return feed.find((item) => item.type.includes("response")) || null;
  }, [feed]);

  function TapeCard({
    labelText,
    item,
    emptyText,
  }: {
    labelText: string;
    item: ActivityItem | null;
    emptyText: string;
  }) {
    const itemTone = tone(item?.type || "");

    return (
      <div
        style={{
          border: `1px solid ${item ? `${itemTone}66` : "rgba(255,255,255,.12)"}`,
          background: "rgba(255,255,255,.055)",
          borderRadius: 22,
          padding: 18,
        }}
      >
        <div
          style={{
            color: item ? itemTone : "#9df3bf",
            letterSpacing: 4,
            fontWeight: 900,
            fontSize: 11,
            marginBottom: 10,
            textTransform: "uppercase",
          }}
        >
          {labelText}
        </div>

        <strong style={{ fontSize: 20, lineHeight: 1.1 }}>
          {item?.title || emptyText}
        </strong>

        <p
          style={{
            color: "rgba(255,255,255,.66)",
            lineHeight: 1.45,
            marginBottom: 0,
          }}
        >
          {item?.note || "No recent event recorded."}
        </p>

        <div style={{ marginTop: 10 }}>
          {item && (
            <span
              style={{
                ...chip,
                color: heatTone(heatLabel(item)),
                border: `1px solid ${heatTone(heatLabel(item))}66`,
                background: "rgba(255,255,255,.055)",
              }}
            >
              {heatLabel(item)}
            </span>
          )}
          {item?.priority && <span style={chip}>{item.priority}</span>}
          {item?.created_at && <span style={chip}>{item.created_at}</span>}
        </div>
      </div>
    );
  }


  const groupedFeed = useMemo(() => {
    const now = Date.now();

    const groups = {
      justNow: [] as ActivityItem[],
      today: [] as ActivityItem[],
      earlier: [] as ActivityItem[],
    };

    for (const item of filteredFeed) {
      const created = new Date(item.created_at || 0).getTime();

      if (!created || Number.isNaN(created)) {
        groups.earlier.push(item);
        continue;
      }

      const diff = now - created;
      const oneHour = 1000 * 60 * 60;
      const oneDay = oneHour * 24;

      if (diff <= oneHour) {
        groups.justNow.push(item);
      } else if (diff <= oneDay) {
        groups.today.push(item);
      } else {
        groups.earlier.push(item);
      }
    }

    return groups;
  }, [filteredFeed]);

  function FeedSection({
    title,
    items,
  }: {
    title: string;
    items: ActivityItem[];
  }) {
    if (items.length === 0) return null;

    return (
      <section style={{ marginBottom: 26 }}>
        <div
          style={{
            color:"#9df3bf",
            letterSpacing:5,
            fontWeight:950,
            fontSize:12,
            marginBottom:14,
            textTransform:"uppercase"
          }}
        >
          {title}
        </div>

        {items.map((item) => {
          const itemTone = tone(item.type);
          const heat = heatLabel(item);
          const heatColor = heatTone(heat);

          return (
            <article
              key={item.id}
              style={{
                ...feedCard,
                borderColor:
                  clean(item.priority).toLowerCase() === "urgent"
                    ? "rgba(255,120,120,.72)"
                    : clean(item.priority).toLowerCase() === "high"
                    ? "rgba(245,217,120,.72)"
                    : `${itemTone}66`,
              }}
            >
              <div style={{
                color:itemTone,
                letterSpacing:4,
                fontWeight:900,
                fontSize:12,
                marginBottom:10,
                textTransform:"uppercase"
              }}>
                {label(item.type)}
              </div>

              <h2 style={{
                fontSize:32,
                lineHeight:1.05,
                margin:"0 0 12px"
              }}>
                {item.title}
              </h2>

              <p style={{
                color:"rgba(255,255,255,.72)",
                lineHeight:1.6,
                fontSize:18
              }}>
                {item.note || "Operational activity recorded in the VaultForge intelligence layer."}
              </p>

              <div style={{ margin:"12px 0" }}>
                <span
                  style={{
                    ...chip,
                    color: heatColor,
                    border: `1px solid ${heatColor}66`,
                    background: "rgba(255,255,255,.055)",
                  }}
                >
                  {heat}
                </span>

                {item.priority && (
                  <span style={chip}>{item.priority}</span>
                )}

                {item.response && (
                  <span style={chip}>{label(item.response)}</span>
                )}

                {item.member_email && (
                  <span style={chip}>{item.member_email}</span>
                )}

                {item.created_at && (
                  <span style={chip}>{item.created_at}</span>
                )}
              </div>

              <div>
                {item.introduction_id && (
                  <Link
                    href={`/introduction/${encodeURIComponent(item.introduction_id)}`}
                    style={btn}
                  >
                    Open Introduction
                  </Link>
                )}

                {item.signal_id && (
                  <Link
                    href={`/routing-room/${encodeURIComponent(item.signal_id)}`}
                    style={ghost}
                  >
                    Routing Room
                  </Link>
                )}

                {item.item_id && (
                  <Link
                    href={`/deal-room/${encodeURIComponent(item.item_id)}`}
                    style={ghost}
                  >
                    Deal Room
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </section>
    );
  }


  function MetricCard({
    title,
    value,
    detail,
    emphasis,
  }: {
    title: string;
    value: number | string;
    detail: string;
    emphasis?: "urgent" | "high" | "normal";
  }) {
    const border =
      emphasis === "urgent"
        ? "rgba(255,120,120,.72)"
        : emphasis === "high"
        ? "rgba(245,217,120,.72)"
        : "rgba(157,243,191,.34)";

    return (
      <div
        style={{
          border: `1px solid ${border}`,
          background:
            "linear-gradient(145deg, rgba(181,92,255,.10), rgba(232,196,107,.055), rgba(255,255,255,.03))",
          borderRadius: 24,
          padding: 20,
          boxShadow: "0 22px 70px rgba(0,0,0,.28)",
        }}
      >
        <div
          style={{
            color: emphasis === "urgent" ? "#ffb3b3" : emphasis === "high" ? "#f5d978" : "#9df3bf",
            letterSpacing: 4,
            fontWeight: 900,
            fontSize: 11,
            marginBottom: 10,
            textTransform: "uppercase",
          }}
        >
          {title}
        </div>

        <div style={{ fontSize: 42, fontWeight: 950, lineHeight: 1 }}>
          {value}
        </div>

        <p style={{ color: "rgba(255,255,255,.68)", lineHeight: 1.45, marginBottom: 0 }}>
          {detail}
        </p>
      </div>
    );
  }

  return (
    <main style={page}>
      <style>{`
        a:hover,
        button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.05);
        }
      `}</style>

      <div style={wrap}>
        <section style={hero}>
          <div style={{
            color:"#9df3bf",
            letterSpacing:5,
            fontWeight:950,
            fontSize:12,
            marginBottom:12,
            textTransform:"uppercase"
          }}>
            VaultForge Global Activity Stream
          </div>

          <h1 style={{
            fontSize:"clamp(58px,12vw,108px)",
            lineHeight:.86,
            margin:"0 0 18px"
          }}>
            Live operational feed.
          </h1>

          <p style={{
            color:"rgba(255,255,255,.72)",
            fontSize:22,
            lineHeight:1.5
          }}>
            Unified intelligence stream across routing, introductions, and member responses.
            This is the beginning of the Bloomberg-style operational terminal layer.
          </p>

          <div>
            <span style={chip}>Feed Events: {metrics.total}</span>
            <span style={chip}>Routing: {metrics.routing}</span>
            <span style={chip}>Introductions: {metrics.intros}</span>
            <span style={chip}>Responses: {metrics.responses}</span>
            <span style={chip}>Urgent: {metrics.urgent}</span>
            <span style={chip}>High: {metrics.high}</span>
            <span style={chip}>Medium: {metrics.medium}</span>
            <span style={chip}>{owner ? "Owner View" : "Member View"}</span>
          </div>

          <div style={{ marginTop: 14 }}>
            <button type="button" style={btn} onClick={load}>
              Refresh Feed
            </button>

            <Link href="/dashboard" style={ghost}>Dashboard</Link>
            <Link href="/alerts" style={ghost}>Alerts</Link>
            <Link href="/routing-inbox" style={ghost}>Routing Inbox</Link>
            <Link href="/introductions" style={ghost}>Introductions</Link>

            {owner && (
              <Link href="/admin-intelligence" style={btn}>
                Owner Intelligence
              </Link>
            )}
          </div>
        </section>

        <section style={hero}>
          <div style={{
            color:"#9df3bf",
            letterSpacing:5,
            fontWeight:950,
            fontSize:12,
            marginBottom:12,
            textTransform:"uppercase"
          }}>
            Market Tape
          </div>

          <h2 style={{
            fontSize:42,
            lineHeight:1,
            margin:"0 0 14px"
          }}>
            Latest platform movement.
          </h2>

          <p style={{
            color:"rgba(255,255,255,.72)",
            fontSize:18,
            lineHeight:1.55
          }}>
            Fast snapshot of the newest routing, introduction, and member-response events.
          </p>

          <div style={{
            display:"grid",
            gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",
            gap:14
          }}>
            <TapeCard labelText="Latest Routing" item={latestRouting} emptyText="No routing activity yet" />
            <TapeCard labelText="Latest Introduction" item={latestIntro} emptyText="No introductions yet" />
            <TapeCard labelText="Latest Response" item={latestResponse} emptyText="No member responses yet" />
          </div>
        </section>

        <section style={hero}>
          <div style={{
            color:"#9df3bf",
            letterSpacing:5,
            fontWeight:950,
            fontSize:12,
            marginBottom:12,
            textTransform:"uppercase"
          }}>
            Command Metrics
          </div>

          <h2 style={{
            fontSize:42,
            lineHeight:1,
            margin:"0 0 14px"
          }}>
            Platform pressure board.
          </h2>

          <p style={{
            color:"rgba(255,255,255,.72)",
            fontSize:18,
            lineHeight:1.55
          }}>
            Read-only operational pressure snapshot across the current feed.
          </p>

          <div style={{
            display:"grid",
            gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",
            gap:14
          }}>
            <MetricCard
              title="Urgent Pressure"
              value={metrics.urgent}
              detail="Urgent events in the current activity window."
              emphasis={metrics.urgent > 0 ? "urgent" : "normal"}
            />
            <MetricCard
              title="High Priority"
              value={metrics.high}
              detail="High-priority opportunities and workflow events."
              emphasis={metrics.high > 0 ? "high" : "normal"}
            />
            <MetricCard
              title="Routing Volume"
              value={metrics.routing}
              detail="Routing actions captured in the operating stream."
            />
            <MetricCard
              title="Intro Volume"
              value={metrics.intros}
              detail="Controlled introductions staged or visible."
            />
            <MetricCard
              title="Response Volume"
              value={metrics.responses}
              detail="Member responses captured from intro/routing flow."
            />
            <MetricCard
              title="Hot Events"
              value={metrics.hot}
              detail="Urgent, interested, call, or intro-request events."
              emphasis={metrics.hot > 0 ? "urgent" : "normal"}
            />
            <MetricCard
              title="Warm Events"
              value={metrics.warm}
              detail="High-priority, detail-needed, or intro-stage events."
              emphasis={metrics.warm > 0 ? "high" : "normal"}
            />
          </div>
        </section>

        <section style={hero}>
          <div style={{
            color:"#9df3bf",
            letterSpacing:5,
            fontWeight:950,
            fontSize:12,
            marginBottom:12,
            textTransform:"uppercase"
          }}>
            Terminal Filters
          </div>

          <button type="button" style={filter === "all" ? btn : ghost} onClick={() => setFilter("all")}>
            All Activity
          </button>
          <button type="button" style={filter === "routing" ? btn : ghost} onClick={() => setFilter("routing")}>
            Routing
          </button>
          <button type="button" style={filter === "introductions" ? btn : ghost} onClick={() => setFilter("introductions")}>
            Introductions
          </button>
          <button type="button" style={filter === "responses" ? btn : ghost} onClick={() => setFilter("responses")}>
            Responses
          </button>

          <div style={{ marginTop: 18 }}>
            <button type="button" style={priorityFilter === "all" ? btn : ghost} onClick={() => setPriorityFilter("all")}>
              All Priorities
            </button>
            <button type="button" style={priorityFilter === "urgent" ? btn : ghost} onClick={() => setPriorityFilter("urgent")}>
              Urgent
            </button>
            <button type="button" style={priorityFilter === "high" ? btn : ghost} onClick={() => setPriorityFilter("high")}>
              High
            </button>
            <button type="button" style={priorityFilter === "medium" ? btn : ghost} onClick={() => setPriorityFilter("medium")}>
              Medium
            </button>
          </div>

          <div style={{ marginTop: 18 }}>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search activity by title, note, member email, type, priority, or ID..."
              style={{
                width: "100%",
                boxSizing: "border-box",
                borderRadius: 20,
                border: "1px solid rgba(255,255,255,.18)",
                background: "rgba(255,255,255,.075)",
                color: "white",
                padding: 16,
                fontSize: 16,
                outline: "none",
              }}
            />
          </div>

          <p style={{
            color:"rgba(255,255,255,.72)",
            lineHeight:1.6,
            marginBottom:0
          }}>
            Showing {filteredFeed.length} of {feed.length} events. Type filter: {label(filter)}. Priority filter: {label(priorityFilter)}. Search: {search.trim() || "None"}.
          </p>

          {search.trim() && (
            <button type="button" style={ghost} onClick={() => setSearch("")}>
              Clear Search
            </button>
          )}
        </section>

        {loading ? (
          <section style={hero}>
            Loading activity stream...
          </section>
        ) : filteredFeed.length === 0 ? (
          <section style={hero}>
            No activity available yet.
          </section>
        ) : (
          <section>
            <FeedSection title="Just Now" items={groupedFeed.justNow} />
            <FeedSection title="Today" items={groupedFeed.today} />
            <FeedSection title="Earlier" items={groupedFeed.earlier} />
          </section>
        )}

        <section style={{ ...hero, marginTop: 22 }}>
          <div style={{
            color:"#9df3bf",
            letterSpacing:5,
            fontWeight:950,
            fontSize:12,
            marginBottom:12,
            textTransform:"uppercase"
          }}>
            Current Safety Mode
          </div>

          <p style={{
            color:"rgba(255,255,255,.72)",
            fontSize:19,
            lineHeight:1.6
          }}>
            This stream is read-only. It does not send notifications, create automations,
            mutate deals, or trigger autonomous AI behavior.
          </p>
        </section>
      </div>
    </main>
  );
}
