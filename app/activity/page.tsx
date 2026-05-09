"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type EventRow = Record<string, any>;

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

const muted: React.CSSProperties = {
  color: "rgba(255,255,255,.72)",
  lineHeight: 1.55,
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
  ).trim().toLowerCase();
}

function isOwner(email: string) {
  return email === OWNER_EMAIL || readCookie("vf_admin") === "1" || readCookie("isAdmin") === "true";
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function label(value: string) {
  const text = clean(value || "event").replace(/_/g, " ");
  return text.slice(0, 1).toUpperCase() + text.slice(1);
}

function first(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }
  return "";
}

function exactSignalId(item: EventRow | null) {
  return first(item?.signal_id, item?.signalId, item?.alert_id, item?.alertId);
}

function exactItemId(item: EventRow | null) {
  return first(item?.item_id, item?.itemId, item?.deal_id, item?.dealId, item?.project_id, item?.projectId, item?.property_id, item?.propertyId, item?.pain_id, item?.painId);
}

function exactIntroId(item: EventRow | null) {
  return first(item?.introduction_id, item?.intro_id, item?.introId, item?.id);
}

function exactSignalHref(item: EventRow | null) {
  const signalId = exactSignalId(item);
  return signalId ? `/signals/${encodeURIComponent(signalId)}` : "/intelligence";
}

function exactRoutingHref(item: EventRow | null) {
  const signalId = exactSignalId(item);
  return signalId ? `/routing-room/${encodeURIComponent(signalId)}` : "/routing-inbox";
}

function exactWorkHref(item: EventRow | null) {
  const itemId = exactItemId(item);
  return itemId ? `/deal-room/${encodeURIComponent(itemId)}` : "";
}

function exactIntroHref(item: EventRow | null) {
  const introId = exactIntroId(item);
  return introId ? `/introduction/${encodeURIComponent(introId)}` : "";
}

function titleOf(item: EventRow | null) {
  return first(item?.title, item?.name, item?.subject, item?.headline, "Activity event");
}

function noteOf(item: EventRow | null) {
  return first(item?.urgency_reason, item?.routing_reason, item?.note, item?.notes, item?.message, item?.description, item?.reason, "Exact activity event context.");
}

function priorityOf(item: EventRow | null) {
  return first(item?.priority, item?.severity, "medium").toLowerCase();
}

function actionOf(item: EventRow | null) {
  return first(item?.action, item?.routing_action, item?.response, item?.status, item?.type, "activity");
}

function toneOf(item: EventRow | null) {
  const priority = priorityOf(item);
  if (priority === "urgent") return "#ffb3b3";
  if (priority === "high") return "#f5d978";
  return "#9df3bf";
}

function visibleEmail(item: EventRow | null) {
  return first(
    item?.member_email,
    item?.target_email,
    item?.target_member_email,
    item?.visible_to_email,
    item?.recipient_email,
    item?.responder_email,
    item?.responding_member_email,
    item?.counterparty_email
  );
}

function InfoBox({ title, value }: { title: string; value?: string | number }) {
  return (
    <div style={card}>
      <div style={{ color: "#9df3bf", letterSpacing: 4, fontWeight: 900, fontSize: 11, marginBottom: 10, textTransform: "uppercase" }}>
        {title}
      </div>
      <p style={{ ...muted, fontSize: 18, margin: 0 }}>{value || "—"}</p>
    </div>
  );
}

async function readRoutingAction(email: string, owner: boolean, eventId: string) {
  const res = await fetch(`/api/routing/actions?email=${encodeURIComponent(email)}&owner=${owner ? "1" : "0"}`, {
    cache: "no-store",
    headers: {
      "x-vf-email": email,
      "x-vf-admin": owner ? "1" : "0",
    },
  });

  const data = await safeJson(res);
  const rows = Array.isArray(data?.actions) ? data.actions : [];

  return rows.find((item: EventRow) => clean(item.id) === eventId) || null;
}

async function readIntroduction(email: string, owner: boolean, eventId: string) {
  const res = await fetch(`/api/routing/introductions?email=${encodeURIComponent(email)}&owner=${owner ? "1" : "0"}`, {
    cache: "no-store",
    headers: {
      "x-vf-email": email,
      "x-vf-admin": owner ? "1" : "0",
    },
  });

  const data = await safeJson(res);
  const rows = Array.isArray(data?.introductions) ? data.introductions : [];

  return rows.find((item: EventRow) => clean(item.id) === eventId || exactIntroId(item) === eventId) || null;
}

async function readResponse(email: string, owner: boolean, eventId: string) {
  const res = await fetch(`/api/routing/introduction-responses?email=${encodeURIComponent(email)}&owner=${owner ? "1" : "0"}`, {
    cache: "no-store",
    headers: {
      "x-vf-email": email,
      "x-vf-admin": owner ? "1" : "0",
    },
  });

  const data = await safeJson(res);
  const rows = Array.isArray(data?.responses) ? data.responses : [];

  return rows.find((item: EventRow) => clean(item.id) === eventId || clean(item.response_id) === eventId) || null;
}

export default function ActivityEventDetailPage() {
  const params = useParams();

  const eventType = decodeURIComponent(String(params?.eventType || ""));
  const eventId = decodeURIComponent(String(params?.eventId || ""));

  const [email, setEmail] = useState("");
  const [owner, setOwner] = useState(false);
  const [event, setEvent] = useState<EventRow | null>(null);
  const [status, setStatus] = useState("Loading exact activity event...");

  async function load() {
    setStatus("Loading exact activity event...");

    try {
      const currentEmail = getEmail();
      const currentOwner = isOwner(currentEmail);

      setEmail(currentEmail);
      setOwner(currentOwner);

      if (!currentEmail) {
        setStatus("Login email not found. Please log in again.");
        return;
      }

      let found: EventRow | null = null;
      const type = eventType.toLowerCase();

      if (type.includes("routing")) {
        found = await readRoutingAction(currentEmail, currentOwner, eventId);
      } else if (type.includes("intro")) {
        found = await readIntroduction(currentEmail, currentOwner, eventId);
      } else if (type.includes("response")) {
        found = await readResponse(currentEmail, currentOwner, eventId);
      }

      setEvent(found);
      setStatus(found ? "" : "Exact activity event not found for this account.");
    } catch (error: any) {
      setStatus(error?.message || "Could not load exact activity event.");
    }
  }

  useEffect(() => {
    load();
  }, [eventType, eventId]);

  const tone = toneOf(event);

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
          .vf-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .vf-actions > * {
            width: 100%;
            margin: 0 !important;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <section style={{ ...hero, borderColor: `${tone}66` }}>
          <div style={{ color: tone, letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 12, textTransform: "uppercase" }}>
            Exact Activity Event · {owner ? "Owner View" : "Member View"}
          </div>

          <h1 style={{ fontSize: "clamp(54px,11vw,104px)", lineHeight: 0.86, margin: "0 0 18px" }}>
            {titleOf(event)}
          </h1>

          <p style={{ ...muted, fontSize: 22 }}>
            {noteOf(event)}
          </p>

          <div>
            <span style={chip}>Type: {label(eventType)}</span>
            <span style={chip}>Event: {eventId}</span>
            <span style={chip}>Priority: {label(priorityOf(event))}</span>
            <span style={chip}>Action: {label(actionOf(event))}</span>
            {visibleEmail(event) && <span style={chip}>Email: {visibleEmail(event)}</span>}
          </div>

          <div className="vf-actions" style={{ marginTop: 14 }}>
            <button type="button" style={btn} onClick={load}>Refresh Event</button>
            <Link href="/activity" style={ghost}>Back to Activity</Link>
            <Link href="/routing-inbox" style={ghost}>Routing Inbox</Link>
            <Link href="/introductions" style={ghost}>Introductions</Link>
            {event && exactIntroHref(event) && <Link href={exactIntroHref(event)} style={ghost}>Introduction</Link>}
            {event && exactSignalId(event) && <Link href={exactSignalHref(event)} style={ghost}>Signal</Link>}
            {event && exactSignalId(event) && <Link href={exactRoutingHref(event)} style={ghost}>Routing Room</Link>}
            {event && exactWorkHref(event) && <Link href={exactWorkHref(event)} style={ghost}>Work Area</Link>}
          </div>

          {status && (
            <p style={{ color: status.toLowerCase().includes("could not") || status.toLowerCase().includes("not found") ? "#ffd0d0" : "#9df3bf", fontWeight: 900 }}>
              {status}
            </p>
          )}
        </section>

        {event && (
          <>
            <section style={grid}>
              <InfoBox title="Event Type" value={eventType} />
              <InfoBox title="Event ID" value={eventId} />
              <InfoBox title="Signal ID" value={exactSignalId(event)} />
              <InfoBox title="Item ID" value={exactItemId(event)} />
              <InfoBox title="Intro ID" value={exactIntroId(event)} />
              <InfoBox title="Status" value={first(event.status, event.routing_status, event.intro_status)} />
              <InfoBox title="Created" value={event.created_at} />
              <InfoBox title="Updated" value={event.updated_at} />
              <InfoBox title="Source" value={event.source} />
              <InfoBox title="State Match" value={event.state_match} />
              <InfoBox title="Strategy Match" value={event.strategy_match} />
              <InfoBox title="Role Match" value={event.role_match} />
            </section>

            <section style={{ ...hero, marginTop: 22 }}>
              <div style={{ color: "#9df3bf", letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 12, textTransform: "uppercase" }}>
                Connected Exact Work
              </div>

              {exactIntroHref(event) && <Link href={exactIntroHref(event)} style={btn}>Open Introduction</Link>}
              {exactSignalId(event) && <Link href={exactSignalHref(event)} style={ghost}>Open Signal</Link>}
              {exactSignalId(event) && <Link href={exactRoutingHref(event)} style={ghost}>Open Routing Room</Link>}
              {exactWorkHref(event) && <Link href={exactWorkHref(event)} style={ghost}>Open Work Area</Link>}
            </section>
          </>
        )}

        <section style={{ ...hero, marginTop: 22 }}>
          <div style={{ color: "#9df3bf", letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 12, textTransform: "uppercase" }}>
            Current Safety Mode
          </div>
          <p style={{ ...muted, fontSize: 19 }}>
            This page reads one exact activity record only. It does not send messages, create routing, stage introductions, or mutate records.
          </p>
        </section>
      </div>
    </main>
  );
}
