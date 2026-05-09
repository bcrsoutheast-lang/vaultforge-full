"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

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

const fieldGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  gap: 14,
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

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.075)",
  color: "white",
  padding: 14,
  fontSize: 15,
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

  if (priority === "urgent") return "Urgent workflow pressure or active opportunity detected.";
  if (priority === "high") return "High-value routing or relationship opportunity identified.";
  return "Normal operational workflow movement.";
}

function routingSummary(action: Action) {
  if (clean(action.routing_summary)) return action.routing_summary;

  const reasons: string[] = [];

  if (clean(action.state_match)) reasons.push(`state fit: ${action.state_match}`);
  if (clean(action.strategy_match)) reasons.push(`strategy fit: ${action.strategy_match}`);
  if (clean(action.role_match)) reasons.push(`role fit: ${action.role_match}`);

  if (reasons.length === 0) reasons.push("general operational alignment");

  return reasons.join(" · ");
}

function defaultUrgency(priority: string, action: string) {
  const p = clean(priority).toLowerCase();
  if (p === "urgent") return "Urgent workflow pressure or active opportunity detected.";
  if (p === "high" || action === "high_priority") return "High-value routing or relationship opportunity identified.";
  if (action === "needs_review") return "Owner review needed before routing can continue.";
  if (action === "watch") return "Watchlist item being monitored before further action.";
  return "Normal operational workflow movement.";
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label style={{ display: "block" }}>
      <strong style={{ display: "block", marginBottom: 8 }}>{label}</strong>
      <input
        style={input}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export default function RoutingRoomPage() {
  const params = useParams();
  const signalId = decodeURIComponent(String(params?.signalId || ""));

  const [email, setEmail] = useState("");
  const [owner, setOwner] = useState(false);
  const [actions, setActions] = useState<Action[]>([]);
  const [status, setStatus] = useState("Loading routing intelligence...");
  const [busy, setBusy] = useState(false);

  const [action, setAction] = useState("route_to_buyer");
  const [priority, setPriority] = useState("medium");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [stateMatch, setStateMatch] = useState("");
  const [strategyMatch, setStrategyMatch] = useState("");
  const [roleMatch, setRoleMatch] = useState("");
  const [urgency, setUrgency] = useState("");
  const [confidenceScore, setConfidenceScore] = useState("75");
  const [itemId, setItemId] = useState("");

  async function load() {
    setStatus("Loading routing intelligence...");

    try {
      const currentEmail = getEmail();
      const currentOwner = isOwner(currentEmail);

      setEmail(currentEmail);
      setOwner(currentOwner);

      const res = await fetch(
        `/api/routing/actions?email=${encodeURIComponent(currentEmail)}&owner=${currentOwner ? "1" : "0"}&signal_id=${encodeURIComponent(signalId)}`,
        {
          cache: "no-store",
          headers: {
            "x-vf-email": currentEmail,
            "x-vf-admin": currentOwner ? "1" : "0",
          },
        }
      );

      const data = await safeJson(res);

      const rows = Array.isArray(data?.actions) ? data.actions : [];

      setActions(rows);
      setStatus(rows.length ? "" : "No routing actions found for this signal yet.");
    } catch (error: any) {
      setStatus(error?.message || "Could not load routing intelligence.");
    }
  }

  async function logContextAction() {
    if (!owner) {
      setStatus("Owner/admin access required to log routing context.");
      return;
    }

    setBusy(true);
    setStatus("Logging routing context...");

    try {
      const res = await fetch("/api/routing/actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": email,
          "x-vf-admin": "1",
        },
        body: JSON.stringify({
          email,
          admin_email: email,
          owner: "1",
          signal_id: signalId,
          item_id: itemId,
          action,
          priority,
          title: title || `${label(action)} routing context`,
          note,
          state_match: stateMatch,
          strategy_match: strategyMatch,
          role_match: roleMatch,
          urgency_reason: urgency || defaultUrgency(priority, action),
          confidence_score: confidenceScore,
          source: "routing_room_context",
        }),
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Could not log routing context.");
      }

      setStatus(data?.message || "Routing context logged safely.");
      setTitle("");
      setNote("");
      setItemId("");
      await load();
    } catch (error: any) {
      setStatus(error?.message || "Could not log routing context.");
    } finally {
      setBusy(false);
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
      <style>{`
        a:hover,
        button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        @media (max-width: 760px) {
          .vf-routing-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .vf-routing-actions > * {
            width: 100%;
            margin: 0 !important;
            box-sizing: border-box;
          }
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
            Routing context explains why a relationship, member, or opportunity was matched.
          </p>

          <div>
            <span style={chip}>Signal: {signalId}</span>
            <span style={chip}>Actions: {actions.length}</span>
            <span style={chip}>Urgent Pressure: {routingPressure}</span>
            <span style={chip}>{owner ? "Owner Controls" : "Member Read-only"}</span>
          </div>

          <div className="vf-routing-actions" style={{ marginTop: 14 }}>
            <button type="button" style={btn} onClick={load}>
              Refresh Routing
            </button>

            <Link href="/activity" style={ghost}>Activity Stream</Link>
            <Link href="/alerts" style={ghost}>Alerts</Link>
            <Link href="/routing-inbox" style={ghost}>Routing Inbox</Link>
            <Link href="/intelligence" style={ghost}>Intelligence</Link>
            {owner && <Link href="/admin-routing" style={ghost}>Admin Routing</Link>}
          </div>

          {status && (
            <p style={{
              color: status.toLowerCase().includes("could not") || status.toLowerCase().includes("required") ? "#ffd0d0" : "#9df3bf",
              fontWeight:900
            }}>
              {status}
            </p>
          )}
        </section>

        {owner && (
          <section style={hero}>
            <div style={{
              color:"#9df3bf",
              letterSpacing:5,
              fontWeight:950,
              fontSize:12,
              marginBottom:12,
              textTransform:"uppercase"
            }}>
              Owner Context Logger
            </div>

            <h2 style={{ fontSize: 42, lineHeight: 1, margin: "0 0 14px" }}>
              Add routing intelligence.
            </h2>

            <p style={{ color: "rgba(255,255,255,.72)", fontSize: 18, lineHeight: 1.55 }}>
              This logs context only. It does not contact members, send notifications, or auto-route.
            </p>

            <div style={fieldGrid}>
              <label style={{ display: "block" }}>
                <strong style={{ display: "block", marginBottom: 8 }}>Action</strong>
                <select style={input} value={action} onChange={(event) => setAction(event.target.value)}>
                  <option value="route_to_buyer" style={{ color: "#111" }}>Route to Buyer</option>
                  <option value="route_to_lender" style={{ color: "#111" }}>Route to Lender</option>
                  <option value="route_to_operator" style={{ color: "#111" }}>Route to Operator</option>
                  <option value="route_to_contractor" style={{ color: "#111" }}>Route to Contractor</option>
                  <option value="needs_review" style={{ color: "#111" }}>Needs Review</option>
                  <option value="watch" style={{ color: "#111" }}>Watch</option>
                  <option value="high_priority" style={{ color: "#111" }}>High Priority</option>
                </select>
              </label>

              <label style={{ display: "block" }}>
                <strong style={{ display: "block", marginBottom: 8 }}>Priority</strong>
                <select style={input} value={priority} onChange={(event) => setPriority(event.target.value)}>
                  <option value="medium" style={{ color: "#111" }}>Medium</option>
                  <option value="high" style={{ color: "#111" }}>High</option>
                  <option value="urgent" style={{ color: "#111" }}>Urgent</option>
                </select>
              </label>

              <Field label="Title" value={title} onChange={setTitle} placeholder="Ex: Georgia buyer fit for duplex signal" />
              <Field label="Related Item ID" value={itemId} onChange={setItemId} placeholder="Optional deal/project/pain id" />
              <Field label="State / Market Match" value={stateMatch} onChange={setStateMatch} placeholder="Georgia, Tennessee, Texas..." />
              <Field label="Strategy Match" value={strategyMatch} onChange={setStrategyMatch} placeholder="Fix & Flip, BRRRR, Private Money..." />
              <Field label="Role Match" value={roleMatch} onChange={setRoleMatch} placeholder="Buyer, Lender, Operator..." />
              <Field label="Confidence Score" value={confidenceScore} onChange={setConfidenceScore} placeholder="0-100" />
            </div>

            <div style={{ marginTop: 16 }}>
              <strong style={{ display: "block", marginBottom: 8 }}>Urgency / Routing Reason</strong>
              <textarea
                style={{ ...input, minHeight: 110 }}
                value={urgency}
                onChange={(event) => setUrgency(event.target.value)}
                placeholder="Why is this being routed? What pressure, opportunity, or fit created the match?"
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <strong style={{ display: "block", marginBottom: 8 }}>Owner Note</strong>
              <textarea
                style={{ ...input, minHeight: 110 }}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Internal owner/admin context for this routing decision..."
              />
            </div>

            <button type="button" style={{ ...btn, marginTop: 16 }} disabled={busy} onClick={logContextAction}>
              {busy ? "Logging..." : "Log Routing Context"}
            </button>
          </section>
        )}

        {actions.length > 0 && (
          <section style={grid}>
            {actions.map((actionItem, index) => {
              const priorityTone = tone(actionItem.priority);

              return (
                <article
                  key={actionItem.id || index}
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
                    {label(actionItem.priority || "normal")} Routing Match
                  </div>

                  <h2 style={{
                    fontSize:32,
                    lineHeight:1.05,
                    margin:"0 0 12px"
                  }}>
                    {actionItem.title || "Routing intelligence event"}
                  </h2>

                  <p style={{
                    color:"rgba(255,255,255,.72)",
                    lineHeight:1.6,
                    fontSize:18
                  }}>
                    {actionItem.note || "Operational routing relationship identified."}
                  </p>

                  <div style={{ margin:"12px 0" }}>
                    <span style={chip}>Confidence: {confidence(actionItem)}%</span>
                    <span style={chip}>{routingSummary(actionItem)}</span>
                    {actionItem.created_at && <span style={chip}>{actionItem.created_at}</span>}
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

                    <p style={{ color:"rgba(255,255,255,.70)", lineHeight:1.6 }}>
                      {urgencyReason(actionItem)}
                    </p>

                    <div style={{ marginTop: 12 }}>
                      {clean(actionItem.state_match) && <span style={chip}>State Match: {actionItem.state_match}</span>}
                      {clean(actionItem.strategy_match) && <span style={chip}>Strategy Match: {actionItem.strategy_match}</span>}
                      {clean(actionItem.role_match) && <span style={chip}>Role Match: {actionItem.role_match}</span>}
                    </div>
                  </section>

                  <div style={{ marginTop: 18 }}>
                    {actionItem.item_id && (
                      <Link href={`/deal-room/${encodeURIComponent(actionItem.item_id)}`} style={btn}>
                        Deal Room
                      </Link>
                    )}

                    <Link href={`/signals/${encodeURIComponent(signalId)}`} style={ghost}>
                      Signal Detail
                    </Link>

                    <Link href="/activity" style={ghost}>
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

          <p style={{ color:"rgba(255,255,255,.72)", fontSize:19, lineHeight:1.6 }}>
            Routing intelligence is currently controlled and read-only for members. Owner can log context,
            but the platform does not auto-contact, auto-route, or autonomously execute.
          </p>
        </section>
      </div>
    </main>
  );
}
