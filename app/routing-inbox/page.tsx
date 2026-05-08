"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Access = {
  email?: string;
  owner?: boolean;
  profile_complete?: boolean;
  paid?: boolean;
  unlocked?: boolean;
};

type RoutingAction = {
  id?: string;
  signal_id?: string;
  item_id?: string;
  action?: string;
  status?: string;
  title?: string;
  note?: string;
  target_role?: string;
  target_email?: string;
  priority?: string;
  source?: string;
  created_by?: string;
  created_at?: string;
};

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

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
  gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
  gap: 18,
};

const stats: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
  gap: 14,
  marginBottom: 22,
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

function clean(value: unknown) {
  return String(value || "").trim();
}

function actionLabel(action: string) {
  const text = String(action || "routing_action").replace(/_/g, " ");
  return text.slice(0, 1).toUpperCase() + text.slice(1);
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

async function saveResponse({
  email,
  action,
  response,
}: {
  email: string;
  action: RoutingAction;
  response: string;
}) {
  const res = await fetch("/api/routing/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-vf-email": email,
    },
    body: JSON.stringify({
      email,
      signal_id: action.signal_id,
      action_id: action.id,
      item_id: action.item_id,
      title: action.title,
      priority: action.priority,
      source: "routing_inbox",
      response,
      note: action.note,
    }),
  });

  const data = await safeJson(res);

  if (!res.ok || data?.ok === false) {
    throw new Error(data?.error || data?.details || "Could not save routing response.");
  }

  return data;
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div style={card}>
      <div style={{ color: "#9df3bf", fontSize: 12, letterSpacing: 4, fontWeight: 900, marginBottom: 10 }}>
        ROUTING
      </div>
      <div style={{ fontSize: 42, fontWeight: 900 }}>{value}</div>
      <div style={{ color: "rgba(255,255,255,.72)" }}>{label}</div>
    </div>
  );
}

export default function RoutingInboxPage() {
  const [email, setEmail] = useState("");
  const [actions, setActions] = useState<RoutingAction[]>([]);
  const [status, setStatus] = useState("Loading routing inbox...");
  const [responseBusy, setResponseBusy] = useState("");
  const [responseMessage, setResponseMessage] = useState("");

  async function load() {
    try {
      const currentEmail = getEmail();
      setEmail(currentEmail);

      const owner =
        currentEmail === OWNER_EMAIL ||
        readCookie("vf_admin") === "1";

      const res = await fetch(
        `/api/routing/actions?email=${encodeURIComponent(currentEmail)}&owner=${owner ? "1" : "0"}`,
        {
          cache: "no-store",
          headers: {
            "x-vf-email": currentEmail,
            "x-vf-admin": owner ? "1" : "0",
          },
        }
      );

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || "Could not load routing inbox.");
      }

      setActions(Array.isArray(data?.actions) ? data.actions : []);
      setStatus("");
    } catch (error: any) {
      setStatus(error?.message || "Could not load routing inbox.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const metrics = useMemo(() => {
    return {
      total: actions.length,
      urgent: actions.filter((a) => clean(a.priority).toLowerCase() === "urgent").length,
      buyers: actions.filter((a) => clean(a.action) === "route_to_buyer").length,
      lenders: actions.filter((a) => clean(a.action) === "route_to_lender").length,
      operators: actions.filter((a) => clean(a.action) === "route_to_operator").length,
      review: actions.filter((a) => clean(a.action) === "needs_review").length,
    };
  }, [actions]);

  async function handleResponse(action: RoutingAction, response: string) {
    try {
      const email = getEmail();

      setResponseBusy(`${action.id}-${response}`);
      setResponseMessage("Saving routing response...");

      const result = await saveResponse({
        email,
        action,
        response,
      });

      setResponseMessage(result?.message || "Routing response saved safely.");
    } catch (error: any) {
      setResponseMessage(error?.message || "Could not save routing response.");
    } finally {
      setResponseBusy("");
    }
  }

  return (
    <main style={page}>
      <div style={wrap}>
        <section style={hero}>
          <div style={{ color: "#9df3bf", fontSize: 12, letterSpacing: 5, fontWeight: 900, marginBottom: 12 }}>
            VAULTFORGE ROUTING INBOX
          </div>

          <h1 style={{ fontSize: "clamp(54px,10vw,102px)", lineHeight: .88, margin: "0 0 18px" }}>
            Routed opportunities.
          </h1>

          <p style={{ color: "rgba(255,255,255,.72)", fontSize: 21, lineHeight: 1.5 }}>
            Buyer, lender, operator, contractor, and review actions routed through the VaultForge intelligence layer.
          </p>

          <Link href="/alerts" style={ghost}>Alerts</Link>
          <Link href="/intelligence" style={ghost}>Intelligence Map</Link>
          <Link href="/projects" style={ghost}>Deal Rooms</Link>
          <Link href="/dashboard" style={ghost}>Dashboard</Link>
          <button type="button" onClick={load} style={btn}>Refresh Inbox</button>

          {status && (
            <p style={{ color: "#f5d978", fontWeight: 900 }}>
              {status}
            </p>
          )}

          {responseMessage && (
            <p
              style={{
                color:
                  responseMessage.toLowerCase().includes("could not")
                    ? "#ffd0d0"
                    : "#9df3bf",
                fontWeight: 900,
              }}
            >
              {responseMessage}
            </p>
          )}
        </section>

        <section style={stats}>
          <Stat label="Total Routed" value={metrics.total} />
          <Stat label="Urgent" value={metrics.urgent} />
          <Stat label="Buyer Routes" value={metrics.buyers} />
          <Stat label="Lender Routes" value={metrics.lenders} />
          <Stat label="Operator Routes" value={metrics.operators} />
          <Stat label="Needs Review" value={metrics.review} />
        </section>

        {actions.length === 0 ? (
          <section style={hero}>
            <strong>No routing actions yet.</strong>
          </section>
        ) : (
          <section style={grid}>
            {actions.map((action, index) => (
              <article key={action.id || `${action.action}-${index}`} style={card}>
                <div style={{ color: "#9df3bf", fontSize: 12, letterSpacing: 4, fontWeight: 900, marginBottom: 10 }}>
                  {actionLabel(action.action || "routing_action")}
                </div>

                <h2 style={{ fontSize: 30, lineHeight: 1.05, margin: "0 0 10px" }}>
                  {action.title || "Routing Action"}
                </h2>

                <p style={{ color: "rgba(255,255,255,.72)", lineHeight: 1.55 }}>
                  {action.note || "No routing note recorded."}
                </p>

                <div style={{ marginBottom: 14 }}>
                  {action.priority && <span style={chip}>{action.priority}</span>}
                  {action.target_role && <span style={chip}>{action.target_role}</span>}
                  {action.created_at && <span style={chip}>{action.created_at}</span>}
                </div>

                {action.signal_id && (
                  <Link
                    href={`/routing-room/${encodeURIComponent(action.signal_id)}`}
                    style={btn}
                  >
                    Open Routing Room
                  </Link>
                )}

                {action.signal_id && (
                  <Link
                    href={`/signals/${encodeURIComponent(action.signal_id)}`}
                    style={ghost}
                  >
                    Open Signal
                  </Link>
                )}

                {action.item_id && (
                  <Link
                    href={`/deal-room/${encodeURIComponent(action.item_id)}`}
                    style={ghost}
                  >
                    Open Deal Room
                  </Link>
                )}

                <div style={{ marginTop: 12 }}>
                  <button
                    type="button"
                    style={btn}
                    disabled={!!responseBusy}
                    onClick={() => handleResponse(action, "interested")}
                  >
                    {responseBusy === `${action.id}-interested`
                      ? "Saving..."
                      : "Interested"}
                  </button>

                  <button
                    type="button"
                    style={ghost}
                    disabled={!!responseBusy}
                    onClick={() => handleResponse(action, "need_more_info")}
                  >
                    {responseBusy === `${action.id}-need_more_info`
                      ? "Saving..."
                      : "Need More Info"}
                  </button>

                  <button
                    type="button"
                    style={ghost}
                    disabled={!!responseBusy}
                    onClick={() => handleResponse(action, "request_call")}
                  >
                    {responseBusy === `${action.id}-request_call`
                      ? "Saving..."
                      : "Request Call"}
                  </button>

                  <button
                    type="button"
                    style={ghost}
                    disabled={!!responseBusy}
                    onClick={() => handleResponse(action, "request_intro")}
                  >
                    {responseBusy === `${action.id}-request_intro`
                      ? "Saving..."
                      : "Request Intro"}
                  </button>

                  <button
                    type="button"
                    style={ghost}
                    disabled={!!responseBusy}
                    onClick={() => handleResponse(action, "pass")}
                  >
                    {responseBusy === `${action.id}-pass`
                      ? "Saving..."
                      : "Pass"}
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
