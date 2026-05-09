"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Action = Record<string, any>;

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.18), transparent 28%), radial-gradient(circle at top right, rgba(157,243,191,.13), transparent 25%), radial-gradient(circle at bottom right, rgba(181,92,255,.18), transparent 28%), linear-gradient(180deg,#02040a 0%,#071326 48%,#030509 100%)",
  color: "white",
  padding: "28px 18px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  maxWidth: 1240,
  margin: "0 auto",
};

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
  gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
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

function clean(value: unknown) {
  return String(value || "").trim();
}

function label(value: string) {
  const text = clean(value || "").replace(/_/g, " ");
  return text.slice(0, 1).toUpperCase() + text.slice(1);
}

function tone(priority: string) {
  const value = clean(priority).toLowerCase();
  if (value === "urgent") return "#ffb3b3";
  if (value === "high") return "#f5d978";
  return "#9df3bf";
}

function safePercent(value: unknown) {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function confidence(action: Action) {
  if (action.confidence_score) return safePercent(action.confidence_score);

  let score = 40;

  if (clean(action.state_match)) score += 15;
  if (clean(action.strategy_match)) score += 15;
  if (clean(action.role_match)) score += 15;
  if (clean(action.priority).toLowerCase() === "urgent") score += 10;
  if (clean(action.priority).toLowerCase() === "high") score += 5;

  return Math.min(score, 98);
}

function urgencyReason(action: Action) {
  if (clean(action.urgency_reason)) return action.urgency_reason;

  const priority = clean(action.priority).toLowerCase();

  if (priority === "urgent") {
    return "Urgent workflow pressure or active opportunity detected.";
  }

  if (priority === "high") {
    return "High-value routing or relationship opportunity identified.";
  }

  return "Normal operational workflow movement.";
}

function routingSummary(action: Action) {
  const reasons: string[] = [];

  if (clean(action.state_match)) {
    reasons.push(`state fit: ${action.state_match}`);
  }

  if (clean(action.strategy_match)) {
    reasons.push(`strategy fit: ${action.strategy_match}`);
  }

  if (clean(action.role_match)) {
    reasons.push(`role fit: ${action.role_match}`);
  }

  if (reasons.length === 0) {
    reasons.push("general operational alignment");
  }

  return reasons.join(" · ");
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export default function RoutingRoomPage() {
  const params = useParams();
  const signalId = decodeURIComponent(String(params?.signalId || ""));

  const [actions, setActions] = useState<Action[]>([]);
  const [status, setStatus] = useState("Loading routing intelligence...");

  async function load() {
    setStatus("Loading routing intelligence...");

    try {
      const res = await fetch("/api/routing/actions", {
        cache: "no-store",
      });

      const data = await safeJson(res);

      const rows = Array.isArray(data?.actions)
        ? data.actions.filter((item: any) => String(item.signal_id || "") === signalId)
        : [];

      setActions(rows);
      setStatus(rows.length ? "" : "No routing actions found for this signal.");
    } catch (error: any) {
      setStatus(error?.message || "Could not load routing intelligence.");
    }
  }

  useEffect(() => {
    load();
  }, [signalId]);

  const routingPressure = useMemo(() => {
    return actions.filter((item) => clean(item.priority).toLowerCase() === "urgent").length;
  }, [actions]);

  return (
    <main style={page}>
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
            VaultForge Routing Intelligence
          </div>

          <h1 style={{
            fontSize:"clamp(56px,11vw,100px)",
            lineHeight:.88,
            margin:"0 0 18px"
          }}>
            Routing room.
          </h1>

          <p style={{
            color:"rgba(255,255,255,.72)",
            fontSize:22,
            lineHeight:1.55
          }}>
            Routing context now explains why a relationship, member, or opportunity was matched.
          </p>

          <div>
            <span style={chip}>Signal: {signalId}</span>
            <span style={chip}>Actions: {actions.length}</span>
            <span style={chip}>Urgent Pressure: {routingPressure}</span>
          </div>

          <div style={{ marginTop: 14 }}>
            <button type="button" style={btn} onClick={load}>
              Refresh Routing
            </button>

            <Link href="/activity" style={ghost}>Activity Stream</Link>
            <Link href="/alerts" style={ghost}>Alerts</Link>
            <Link href="/routing-inbox" style={ghost}>Routing Inbox</Link>
            <Link href="/intelligence" style={ghost}>Intelligence</Link>
          </div>

          {status && (
            <p style={{
              color: status.toLowerCase().includes("could not") ? "#ffd0d0" : "#9df3bf",
              fontWeight:900
            }}>
              {status}
            </p>
          )}
        </section>

        {actions.length > 0 && (
          <section style={grid}>
            {actions.map((action, index) => {
              const priorityTone = tone(action.priority);

              return (
                <article
                  key={action.id || index}
                  style={{
                    ...card,
                    borderColor: `${priorityTone}66`,
                  }}
                >
                  <div style={{
                    color:priorityTone,
                    letterSpacing:4,
                    fontWeight:900,
                    fontSize:12,
                    marginBottom:10,
                    textTransform:"uppercase"
                  }}>
                    {label(action.priority || "normal")} Routing Match
                  </div>

                  <h2 style={{
                    fontSize:32,
                    lineHeight:1.05,
                    margin:"0 0 12px"
                  }}>
                    {action.title || "Routing intelligence event"}
                  </h2>

                  <p style={{
                    color:"rgba(255,255,255,.72)",
                    lineHeight:1.6,
                    fontSize:18
                  }}>
                    {action.note || "Operational routing relationship identified."}
                  </p>

                  <div style={{ margin:"12px 0" }}>
                    <span style={chip}>
                      Confidence: {confidence(action)}%
                    </span>

                    <span style={chip}>
                      {routingSummary(action)}
                    </span>

                    {action.created_at && (
                      <span style={chip}>
                        {action.created_at}
                      </span>
                    )}
                  </div>

                  <section style={{
                    border:"1px solid rgba(255,255,255,.10)",
                    borderRadius:20,
                    padding:16,
                    marginTop:16,
                    background:"rgba(255,255,255,.035)"
                  }}>
                    <div style={{
                      color:"#9df3bf",
                      letterSpacing:4,
                      fontWeight:900,
                      fontSize:11,
                      marginBottom:10,
                      textTransform:"uppercase"
                    }}>
                      Routing Explanation
                    </div>

                    <p style={{
                      color:"rgba(255,255,255,.70)",
                      lineHeight:1.6
                    }}>
                      {urgencyReason(action)}
                    </p>

                    <div style={{ marginTop: 12 }}>
                      {clean(action.state_match) && (
                        <span style={chip}>
                          State Match: {action.state_match}
                        </span>
                      )}

                      {clean(action.strategy_match) && (
                        <span style={chip}>
                          Strategy Match: {action.strategy_match}
                        </span>
                      )}

                      {clean(action.role_match) && (
                        <span style={chip}>
                          Role Match: {action.role_match}
                        </span>
                      )}
                    </div>
                  </section>

                  <div style={{ marginTop: 18 }}>
                    {action.item_id && (
                      <Link
                        href={`/deal-room/${encodeURIComponent(action.item_id)}`}
                        style={btn}
                      >
                        Deal Room
                      </Link>
                    )}

                    <Link
                      href={`/signals/${encodeURIComponent(signalId)}`}
                      style={ghost}
                    >
                      Signal Detail
                    </Link>

                    <Link
                      href="/activity"
                      style={ghost}
                    >
                      Activity Stream
                    </Link>
                  </div>
                </article>
              );
            })}
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
            Current Routing Mode
          </div>

          <p style={{
            color:"rgba(255,255,255,.72)",
            fontSize:19,
            lineHeight:1.6
          }}>
            Routing intelligence is currently read-only. The platform explains why opportunities and members align but does not auto-contact, auto-route, or autonomously execute.
          </p>
        </section>
      </div>
    </main>
  );
}
