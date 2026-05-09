"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type ActivityEvent = {
  id?: string;
  raw_id?: string;
  type?: string;
  title?: string;
  note?: string;
  priority?: string;
  created_at?: string;
  signal_id?: string;
  item_id?: string;
  introduction_id?: string;
  response?: string;
  member_email?: string;
  source?: string;
  raw?: Record<string, any>;
};

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.18), transparent 28%), radial-gradient(circle at top right, rgba(157,243,191,.13), transparent 25%), radial-gradient(circle at bottom right, rgba(181,92,255,.18), transparent 28%), linear-gradient(180deg,#02040a 0%,#071326 48%,#030509 100%)",
  color: "white",
  padding: "28px 18px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1180, margin: "0 auto" };

const hero: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.34)",
  background:
    "linear-gradient(145deg, rgba(232,196,107,.12), rgba(181,92,255,.10), rgba(255,255,255,.035))",
  borderRadius: 34,
  padding: 26,
  marginBottom: 22,
  boxShadow: "0 30px 90px rgba(0,0,0,.34)",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.13)",
  background:
    "linear-gradient(145deg, rgba(181,92,255,.10), rgba(232,196,107,.055), rgba(255,255,255,.03))",
  borderRadius: 28,
  padding: 22,
  boxShadow: "0 26px 80px rgba(0,0,0,.34)",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
  gap: 18,
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

const greenEyebrow: React.CSSProperties = {
  color: "#9df3bf",
  letterSpacing: 5,
  fontWeight: 950,
  fontSize: 12,
  marginBottom: 12,
  textTransform: "uppercase",
};

const muted: React.CSSProperties = {
  color: "rgba(255,255,255,.70)",
  lineHeight: 1.55,
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

function heatLabel(item: ActivityEvent) {
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

function heatTone(value: string) {
  if (value === "Hot") return "#ffb3b3";
  if (value === "Warm") return "#f5d978";
  return "#9df3bf";
}

function InfoBox({ title, value }: { title: string; value?: string | number }) {
  return (
    <div style={card}>
      <div style={greenEyebrow}>{title}</div>
      <p style={{ ...muted, fontSize: 18, margin: 0 }}>{value || "—"}</p>
    </div>
  );
}

function normalizeEvent(type: string, item: any): ActivityEvent {
  if (type === "routing") {
    return {
      id: `routing-${item.id}`,
      raw_id: item.id,
      type: "routing_action",
      title: item.title || "Routing action created",
      note: item.note,
      priority: item.priority,
      created_at: item.created_at,
      signal_id: item.signal_id,
      item_id: item.item_id,
      source: item.source,
      raw: item,
    };
  }

  if (type === "introduction") {
    return {
      id: `intro-${item.id}`,
      raw_id: item.id,
      type: "controlled_introduction",
      title: item.title || "Controlled introduction staged",
      note: item.note,
      priority: item.priority,
      created_at: item.created_at,
      signal_id: item.signal_id,
      item_id: item.item_id,
      introduction_id: item.id,
      member_email: item.member_email,
      source: item.source,
      raw: item,
    };
  }

  return {
    id: `response-${item.id}`,
    raw_id: item.id,
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
    source: item.source,
    raw: item,
  };
}

export default function ActivityEventDetailPage() {
  const params = useParams();
  const eventType = decodeURIComponent(String(params?.eventType || ""));
  const eventId = decodeURIComponent(String(params?.eventId || ""));

  const [email, setEmail] = useState("");
  const [owner, setOwner] = useState(false);
  const [event, setEvent] = useState<ActivityEvent | null>(null);
  const [status, setStatus] = useState("Loading activity event...");

  async function load() {
    setStatus("Loading activity event...");

    try {
      const currentEmail = getEmail();
      const currentOwner = isOwner(currentEmail);

      setEmail(currentEmail);
      setOwner(currentOwner);

      const headers = {
        "x-vf-email": currentEmail,
        "x-vf-admin": currentOwner ? "1" : "0",
      };

      let found: ActivityEvent | null = null;

      if (eventType === "routing") {
        const res = await fetch(`/api/routing/actions?email=${encodeURIComponent(currentEmail)}&owner=${currentOwner ? "1" : "0"}`, {
          cache: "no-store",
          headers,
        });
        const data = await safeJson(res);
        const row = Array.isArray(data?.actions) ? data.actions.find((item: any) => String(item.id) === eventId) : null;
        if (row) found = normalizeEvent("routing", row);
      }

      if (eventType === "introduction") {
        const res = await fetch(`/api/routing/introductions?email=${encodeURIComponent(currentEmail)}&owner=${currentOwner ? "1" : "0"}`, {
          cache: "no-store",
          headers,
        });
        const data = await safeJson(res);
        const row = Array.isArray(data?.introductions) ? data.introductions.find((item: any) => String(item.id) === eventId) : null;
        if (row) found = normalizeEvent("introduction", row);
      }

      if (eventType === "response") {
        const res = await fetch(`/api/routing/introduction-responses?email=${encodeURIComponent(currentEmail)}&owner=${currentOwner ? "1" : "0"}`, {
          cache: "no-store",
          headers,
        });
        const data = await safeJson(res);
        const row = Array.isArray(data?.responses) ? data.responses.find((item: any) => String(item.id) === eventId) : null;
        if (row) found = normalizeEvent("response", row);
      }

      setEvent(found);
      setStatus(found ? "" : "Activity event not found for this account.");
    } catch (error: any) {
      setStatus(error?.message || "Could not load activity event.");
    }
  }

  useEffect(() => {
    load();
  }, [eventType, eventId]);

  const eventTone = useMemo(() => tone(event?.type || ""), [event?.type]);
  const heat = useMemo(() => heatLabel(event || {}), [event]);
  const heatColor = useMemo(() => heatTone(heat), [heat]);

  return (
    <main style={page}>
      <style>{`
        a:hover,
        button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        @media (max-width: 760px) {
          .vf-event-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .vf-event-actions > * {
            width: 100%;
            margin: 0 !important;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <section style={{ ...hero, borderColor: `${eventTone}66` }}>
          <div style={{ ...greenEyebrow, color: eventTone }}>
            Activity Event Detail · {owner ? "Owner View" : "Member View"}
          </div>

          <h1 style={{ fontSize: "clamp(52px,10vw,92px)", lineHeight: 0.88, margin: "0 0 18px" }}>
            {event?.title || "Activity event"}
          </h1>

          <p style={{ ...muted, fontSize: 21 }}>
            {event?.note || status || "Exact operational event loaded from the activity stream."}
          </p>

          <div style={{ margin: "12px 0" }}>
            <span style={{ ...chip, color: heatColor, border: `1px solid ${heatColor}66` }}>{heat}</span>
            {event?.priority && <span style={chip}>{event.priority}</span>}
            {event?.response && <span style={chip}>{label(event.response)}</span>}
            {event?.member_email && <span style={chip}>{event.member_email}</span>}
            {event?.created_at && <span style={chip}>{event.created_at}</span>}
          </div>

          <div className="vf-event-actions">
            <Link href="/activity" style={btn}>Back to Activity</Link>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
            <Link href="/alerts" style={ghost}>Alerts</Link>
            <Link href="/routing-inbox" style={ghost}>Routing Inbox</Link>
            <Link href="/introductions" style={ghost}>Introductions</Link>
            {owner && <Link href="/admin-intelligence" style={ghost}>Owner Intelligence</Link>}
            <button type="button" onClick={load} style={ghost}>Refresh Event</button>
          </div>

          {status && (
            <p style={{ color: status.toLowerCase().includes("not found") || status.toLowerCase().includes("could not") ? "#ffd0d0" : "#9df3bf", fontWeight: 900 }}>
              {status}
            </p>
          )}
        </section>

        {event && (
          <>
            <section style={grid}>
              <InfoBox title="Event Type" value={label(event.type || "")} />
              <InfoBox title="Heat" value={heat} />
              <InfoBox title="Priority" value={event.priority} />
              <InfoBox title="Response" value={event.response ? label(event.response) : ""} />
              <InfoBox title="Signal ID" value={event.signal_id} />
              <InfoBox title="Item ID" value={event.item_id} />
              <InfoBox title="Introduction ID" value={event.introduction_id} />
              <InfoBox title="Raw Event ID" value={event.raw_id} />
            </section>

            <section style={{ ...hero, marginTop: 22 }}>
              <div style={greenEyebrow}>Connected Work Areas</div>

              {event.introduction_id && (
                <Link href={`/introduction/${encodeURIComponent(event.introduction_id)}`} style={btn}>
                  Open Introduction
                </Link>
              )}

              {owner && event.introduction_id && (
                <Link href={`/admin-introduction-review/${encodeURIComponent(event.introduction_id)}`} style={ghost}>
                  Owner Intro Review
                </Link>
              )}

              {event.signal_id && (
                <Link href={`/routing-room/${encodeURIComponent(event.signal_id)}`} style={ghost}>
                  Routing Room
                </Link>
              )}

              {event.signal_id && (
                <Link href={`/signals/${encodeURIComponent(event.signal_id)}`} style={ghost}>
                  Signal Detail
                </Link>
              )}

              {event.item_id && (
                <Link href={`/deal-room/${encodeURIComponent(event.item_id)}`} style={ghost}>
                  Deal Room
                </Link>
              )}
            </section>

            {owner && event.raw && (
              <section style={{ ...hero, marginTop: 22 }}>
                <div style={greenEyebrow}>Owner Debug / Raw Event</div>
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    color: "rgba(255,255,255,.72)",
                    background: "rgba(0,0,0,.26)",
                    borderRadius: 20,
                    padding: 16,
                    overflow: "auto",
                  }}
                >
                  {JSON.stringify(event.raw, null, 2)}
                </pre>
              </section>
            )}

            <section style={{ ...hero, marginTop: 22 }}>
              <div style={greenEyebrow}>Current Safety Mode</div>
              <p style={{ ...muted, fontSize: 19 }}>
                This page is read-only. It opens exact activity context but does not trigger automation, notifications, dispatch, or data mutations.
              </p>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
