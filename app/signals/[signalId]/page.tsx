"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type Signal = Record<string, any>;
type Action = Record<string, any>;
type Match = Record<string, any>;

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.18), transparent 28%), radial-gradient(circle at top right, rgba(157,243,191,.13), transparent 25%), radial-gradient(circle at bottom right, rgba(181,92,255,.18), transparent 28%), linear-gradient(180deg,#02040a 0%,#071326 48%,#030509 100%)",
  color: "white",
  padding: "28px 18px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1240, margin: "0 auto" };

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

const statGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
  gap: 14,
  marginBottom: 22,
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

const danger: React.CSSProperties = {
  ...ghost,
  color: "#ffd0d0",
  border: "1px solid rgba(255,120,120,.38)",
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

const greenEyebrow: React.CSSProperties = {
  color: "#9df3bf",
  letterSpacing: 5,
  fontWeight: 950,
  fontSize: 12,
  marginBottom: 12,
  textTransform: "uppercase",
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

function first(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }
  return "";
}

function label(value: string) {
  const text = clean(value || "signal").replace(/_/g, " ");
  return text.slice(0, 1).toUpperCase() + text.slice(1);
}

function priorityOf(signal: Signal | null) {
  return first(signal?.priority, signal?.severity, signal?.alert_priority, "medium").toLowerCase();
}

function toneOf(signal: Signal | null) {
  const priority = priorityOf(signal);
  if (priority === "urgent") return "#ffb3b3";
  if (priority === "high") return "#f5d978";
  return "#9df3bf";
}

function titleOf(signal: Signal | null, signalId: string) {
  return first(signal?.title, signal?.name, signal?.headline, signal?.signal_title, signal?.alert_title, `Signal ${signalId}`);
}

function noteOf(signal: Signal | null) {
  return first(signal?.message, signal?.description, signal?.note, signal?.summary, signal?.reason, "Exact signal context and routing intelligence.");
}

function exactItemId(signal: Signal | null) {
  return first(signal?.item_id, signal?.itemId, signal?.deal_id, signal?.project_id, signal?.property_id, signal?.pain_id);
}

function marketOf(signal: Signal | null) {
  return first(signal?.market, signal?.state, signal?.location, [signal?.city, signal?.state].filter(Boolean).join(", "));
}

function strategyOf(signal: Signal | null) {
  return first(signal?.strategy, signal?.asset_strategy, signal?.exit_strategy);
}

function roleNeeded(signal: Signal | null) {
  return first(signal?.role_needed, signal?.target_role, signal?.deal_need, "Buyer");
}

function signalScore(signal: Signal | null, actions: Action[], matches: Match[]) {
  let score = 52;
  const priority = priorityOf(signal);

  if (priority === "urgent") score += 18;
  if (priority === "high") score += 10;
  if (marketOf(signal)) score += 5;
  if (strategyOf(signal)) score += 5;
  if (exactItemId(signal)) score += 6;
  if (actions.length > 0) score += 8;
  if (matches.some((match) => clean(match.fit_level).toLowerCase() === "strong")) score += 8;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function matchTone(level: string) {
  const fit = clean(level).toLowerCase();
  if (fit === "strong") return "#9df3bf";
  if (fit === "possible") return "#f5d978";
  return "#ffb3b3";
}

function actionOf(action: Action) {
  return first(action.action, action.routing_action, "routing_action");
}

function actionTitle(action: Action) {
  return first(action.title, "Routing action");
}

function actionNote(action: Action) {
  return first(action.urgency_reason, action.routing_reason, action.note, action.routing_summary, "Routing action generated for owner review.");
}

function actionScore(action: Action) {
  const raw = Number(action.confidence_score || action.match_score || 0);
  if (Number.isFinite(raw) && raw > 0) return Math.max(0, Math.min(100, Math.round(raw)));
  return 58;
}

function StatCard({
  title,
  value,
  detail,
  tone,
}: {
  title: string;
  value: string | number;
  detail: string;
  tone?: string;
}) {
  return (
    <div style={{ ...card, borderColor: `${tone || "#9df3bf"}66` }}>
      <div style={{ ...greenEyebrow, color: tone || "#9df3bf" }}>{title}</div>
      <div style={{ fontSize: 42, fontWeight: 950, lineHeight: 1 }}>{value}</div>
      <p style={{ ...muted, marginBottom: 0 }}>{detail}</p>
    </div>
  );
}

async function loadSignals(currentEmail: string, owner: boolean) {
  const headers = {
    "x-vf-email": currentEmail,
    "x-vf-admin": owner ? "1" : "0",
  };

  const [storedRes, feedRes] = await Promise.all([
    fetch(`/api/intelligence/stored?email=${encodeURIComponent(currentEmail)}&owner=${owner ? "1" : "0"}`, {
      cache: "no-store",
      headers,
    }),
    fetch(`/api/intelligence/feed?email=${encodeURIComponent(currentEmail)}&owner=${owner ? "1" : "0"}`, {
      cache: "no-store",
      headers,
    }),
  ]);

  const storedData = await safeJson(storedRes);
  const feedData = await safeJson(feedRes);

  const stored = Array.isArray(storedData?.alerts)
    ? storedData.alerts
    : Array.isArray(storedData?.signals)
    ? storedData.signals
    : [];

  const generated = Array.isArray(feedData?.alerts)
    ? feedData.alerts
    : Array.isArray(feedData?.signals)
    ? feedData.signals
    : [];

  return [...stored, ...generated];
}

export default function SignalDetailPage() {
  const params = useParams();
  const signalId = decodeURIComponent(String(params?.signalId || ""));

  const [email, setEmail] = useState("");
  const [owner, setOwner] = useState(false);
  const [signal, setSignal] = useState<Signal | null>(null);
  const [actions, setActions] = useState<Action[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [status, setStatus] = useState("Loading exact signal...");
  const [matchStatus, setMatchStatus] = useState("");
  const [generateStatus, setGenerateStatus] = useState("");
  const [introStatus, setIntroStatus] = useState("");
  const [scoreBusy, setScoreBusy] = useState(false);
  const [generateBusy, setGenerateBusy] = useState(false);
  const [introBusyId, setIntroBusyId] = useState("");
  const [introEmailByAction, setIntroEmailByAction] = useState<Record<string, string>>({});

  const [routeRole, setRouteRole] = useState("Buyer");
  const [routePriority, setRoutePriority] = useState("medium");
  const [routeNote, setRouteNote] = useState("");

  async function loadRoutingActions(currentEmail: string, currentOwner: boolean) {
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
  }

  async function load() {
    setStatus("Loading exact signal...");

    try {
      const currentEmail = getEmail();
      const currentOwner = isOwner(currentEmail);

      setEmail(currentEmail);
      setOwner(currentOwner);

      if (!currentEmail) {
        setStatus("Login email not found. Please log in again.");
        return;
      }

      const rows = await loadSignals(currentEmail, currentOwner);
      const found =
        rows.find((item: Signal) => first(item.signal_id, item.alert_id, item.id) === signalId) ||
        rows.find((item: Signal) => clean(item.id) === signalId) ||
        null;

      setSignal(found);
      await loadRoutingActions(currentEmail, currentOwner);

      if (!found) {
        setStatus("Exact signal source card was not found in the feed, but this signal room can still hold routing actions.");
        return;
      }

      setRouteRole(roleNeeded(found));
      setRoutePriority(priorityOf(found));
      setStatus("");
    } catch (error: any) {
      setStatus(error?.message || "Could not load exact signal.");
    }
  }

  async function runMatchScoring() {
    setScoreBusy(true);
    setMatchStatus("Scoring member fit for this signal...");

    try {
      const currentEmail = email || getEmail();
      const currentOwner = owner || isOwner(currentEmail);

      const res = await fetch("/api/member/match-score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": currentEmail,
          "x-vf-admin": currentOwner ? "1" : "0",
        },
        body: JSON.stringify({
          signal_id: signalId,
          item_id: exactItemId(signal),
          state: first(signal?.state, signal?.market),
          market: marketOf(signal),
          city: signal?.city || "",
          strategy: strategyOf(signal),
          asset_type: first(signal?.property_type, signal?.asset_type, signal?.item_kind),
          role_needed: roleNeeded(signal),
          priority: priorityOf(signal),
          title: titleOf(signal, signalId),
          note: noteOf(signal),
        }),
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Could not score member matches.");
      }

      setMatches(Array.isArray(data?.top_matches) ? data.top_matches : []);
      setMatchStatus(`Scored ${data?.counts?.members || 0} members. Strong matches: ${data?.counts?.strong || 0}.`);
    } catch (error: any) {
      setMatchStatus(error?.message || "Could not score member matches.");
    } finally {
      setScoreBusy(false);
    }
  }

  async function stageIntroductionFromAction(action: Action) {
    if (!owner) {
      setIntroStatus("Owner/admin access required to stage introductions.");
      return;
    }

    const actionId = clean(action.id);
    const memberEmail = clean(introEmailByAction[actionId]).toLowerCase();

    if (!memberEmail) {
      setIntroStatus("Enter a member email before staging the introduction.");
      return;
    }

    setIntroBusyId(actionId);
    setIntroStatus("Staging controlled introduction...");

    try {
      const res = await fetch("/api/routing/introductions", {
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
          routing_action_id: actionId,
          signal_id: first(action.signal_id, signalId),
          item_id: first(action.item_id, itemId),
          title: `Intro: ${first(action.title, titleOf(signal, signalId))}`,
          note: first(action.urgency_reason, action.note, action.routing_summary, noteOf(signal)),
          member_email: memberEmail,
          visible_to_email: memberEmail,
          recipient_email: memberEmail,
          counterparty_email: email,
          priority: first(action.priority, routePriority),
          status: "staged",
          intro_status: "staged",
          source: "signal_detail_stage_intro",
        }),
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Could not stage introduction.");
      }

      setIntroStatus(data?.message || "Controlled introduction staged.");
      setIntroEmailByAction((prev) => ({ ...prev, [actionId]: "" }));
    } catch (error: any) {
      setIntroStatus(error?.message || "Could not stage introduction.");
    } finally {
      setIntroBusyId("");
    }
  }

  async function generateRoutingAction() {
    if (!owner) {
      setGenerateStatus("Owner/admin access required to generate routing actions.");
      return;
    }

    setGenerateBusy(true);
    setGenerateStatus("Generating routing action from this exact signal...");

    try {
      const currentEmail = email || getEmail();

      const res = await fetch("/api/routing/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": currentEmail,
          "x-vf-admin": "1",
        },
        body: JSON.stringify({
          email: currentEmail,
          admin_email: currentEmail,
          owner: "1",
          signal_id: signalId,
          item_id: exactItemId(signal),
          title: titleOf(signal, signalId),
          note: routeNote || noteOf(signal),
          state: first(signal?.state, signal?.market),
          market: marketOf(signal),
          city: signal?.city || "",
          strategy: strategyOf(signal),
          asset_type: first(signal?.property_type, signal?.asset_type, signal?.item_kind),
          role_needed: routeRole,
          priority: routePriority,
          source: "signal_detail_generate",
          source_table: signal?.source_table || "",
          item_kind: signal?.item_kind || "",
        }),
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Could not generate routing action.");
      }

      setGenerateStatus(data?.message || "Routing action generated.");
      setRouteNote("");
      await loadRoutingActions(currentEmail, true);
    } catch (error: any) {
      setGenerateStatus(error?.message || "Could not generate routing action.");
    } finally {
      setGenerateBusy(false);
    }
  }

  useEffect(() => {
    load();
  }, [signalId]);

  const tone = toneOf(signal);
  const score = useMemo(() => signalScore(signal, actions, matches), [signal, actions, matches]);
  const itemId = exactItemId(signal);

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
          <div style={{ ...greenEyebrow, color: tone }}>
            VaultForge Signal Detail · {owner ? "Owner View" : "Member View"}
          </div>

          <h1 style={{ fontSize: "clamp(54px,11vw,104px)", lineHeight: 0.86, margin: "0 0 18px" }}>
            {titleOf(signal, signalId)}
          </h1>

          <p style={{ ...muted, fontSize: 22 }}>
            {noteOf(signal)}
          </p>

          <div>
            <span style={chip}>Signal: {signalId}</span>
            {itemId && <span style={chip}>Item: {itemId}</span>}
            <span style={chip}>Priority: {label(priorityOf(signal))}</span>
            <span style={chip}>Score: {score}</span>
            <span style={chip}>Market: {marketOf(signal) || "Unassigned"}</span>
            <span style={chip}>Routes: {actions.length}</span>
            <span style={chip}>Matches: {matches.length}</span>
          </div>

          <div className="vf-actions" style={{ marginTop: 14 }}>
            <button type="button" style={btn} onClick={load}>Refresh Signal</button>
            <button type="button" style={btn} disabled={scoreBusy} onClick={runMatchScoring}>
              {scoreBusy ? "Scoring..." : "Score Member Fits"}
            </button>
            <Link href={`/routing-room/${encodeURIComponent(signalId)}`} style={ghost}>Routing Room</Link>
            {itemId && <Link href={`/deal-room/${encodeURIComponent(itemId)}`} style={ghost}>Work Area</Link>}
            <Link href="/activity" style={ghost}>Activity</Link>
            <Link href="/alerts" style={ghost}>Alerts</Link>
            <Link href="/intelligence" style={ghost}>Intelligence</Link>
            <Link href="/routing-inbox" style={ghost}>Routing Inbox</Link>
            {owner && <Link href="/admin-routing-confidence" style={ghost}>Routing Confidence</Link>}
            <Link href="/logout" style={danger}>Logout</Link>
          </div>

          {status && (
            <p style={{ color: status.toLowerCase().includes("could not") ? "#ffd0d0" : "#9df3bf", fontWeight: 900 }}>
              {status}
            </p>
          )}

          {matchStatus && (
            <p style={{ color: matchStatus.toLowerCase().includes("could not") ? "#ffd0d0" : "#9df3bf", fontWeight: 900 }}>
              {matchStatus}
            </p>
          )}

          {generateStatus && (
            <p style={{ color: generateStatus.toLowerCase().includes("could not") || generateStatus.toLowerCase().includes("required") ? "#ffd0d0" : "#9df3bf", fontWeight: 900 }}>
              {generateStatus}
            </p>
          )}

          {introStatus && (
            <p style={{ color: introStatus.toLowerCase().includes("could not") || introStatus.toLowerCase().includes("required") || introStatus.toLowerCase().includes("enter") ? "#ffd0d0" : "#9df3bf", fontWeight: 900 }}>
              {introStatus}
            </p>
          )}
        </section>

        <section style={statGrid}>
          <StatCard title="Signal Score" value={score} detail="Computed from signal priority, context, matches, and routing actions." tone={tone} />
          <StatCard title="Routing Actions" value={actions.length} detail="Generated routing records tied to this signal." />
          <StatCard title="Member Matches" value={matches.length} detail="Read-only member fit results." />
          <StatCard title="Priority" value={label(priorityOf(signal))} detail="Signal urgency level." tone={tone} />
          <StatCard title="Market" value={marketOf(signal) || "—"} detail="Best available market context." />
        </section>

        {owner && (
          <section style={hero}>
            <div style={greenEyebrow}>Owner Routing Generator</div>
            <h2 style={{ fontSize: 42, lineHeight: 1, margin: "0 0 14px" }}>
              Generate routing from this exact signal.
            </h2>
            <p style={{ ...muted, fontSize: 19 }}>
              This creates a routing record only. It does not notify members, stage introductions, or auto-dispatch.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
              <select style={input} value={routeRole} onChange={(event) => setRouteRole(event.target.value)}>
                <option value="Buyer" style={{ color: "#111" }}>Buyer</option>
                <option value="Lender / Capital" style={{ color: "#111" }}>Lender / Capital</option>
                <option value="Operator" style={{ color: "#111" }}>Operator</option>
                <option value="Contractor" style={{ color: "#111" }}>Contractor</option>
                <option value="Owner Review" style={{ color: "#111" }}>Owner Review</option>
              </select>

              <select style={input} value={routePriority} onChange={(event) => setRoutePriority(event.target.value)}>
                <option value="medium" style={{ color: "#111" }}>Medium</option>
                <option value="high" style={{ color: "#111" }}>High</option>
                <option value="urgent" style={{ color: "#111" }}>Urgent</option>
              </select>
            </div>

            <textarea
              style={{ ...input, minHeight: 120, marginTop: 14 }}
              value={routeNote}
              onChange={(event) => setRouteNote(event.target.value)}
              placeholder="Why should this signal be routed? What pressure, member fit, capital need, or buyer/operator need exists?"
            />

            <button type="button" style={btn} disabled={generateBusy} onClick={generateRoutingAction}>
              {generateBusy ? "Generating..." : "Generate Routing Action"}
            </button>
          </section>
        )}

        {actions.length > 0 && (
          <section style={hero}>
            <div style={greenEyebrow}>Generated Routing Actions</div>
            <section style={grid}>
              {actions.map((action, index) => (
                <article key={action.id || index} style={card}>
                  <div style={greenEyebrow}>{label(actionOf(action))}</div>
                  <h3 style={{ fontSize: 28, margin: "0 0 10px" }}>{actionTitle(action)}</h3>
                  <p style={muted}>{actionNote(action)}</p>
                  <span style={chip}>Confidence: {actionScore(action)}%</span>
                  {action.role_match && <span style={chip}>Role: {action.role_match}</span>}
                  {action.state_match && <span style={chip}>State: {action.state_match}</span>}
                  {action.strategy_match && <span style={chip}>Strategy: {action.strategy_match}</span>}
                  {owner && (
                    <div style={{ marginTop: 14 }}>
                      <input
                        style={input}
                        value={introEmailByAction[String(action.id || "")] || ""}
                        onChange={(event) =>
                          setIntroEmailByAction((prev) => ({
                            ...prev,
                            [String(action.id || "")]: event.target.value,
                          }))
                        }
                        placeholder="Member email to stage intro..."
                      />

                      <button
                        type="button"
                        style={btn}
                        disabled={introBusyId === String(action.id || "")}
                        onClick={() => stageIntroductionFromAction(action)}
                      >
                        {introBusyId === String(action.id || "") ? "Staging..." : "Stage Controlled Intro"}
                      </button>
                    </div>
                  )}

                  <div>
                    <Link href={`/routing-room/${encodeURIComponent(first(action.signal_id, signalId))}`} style={btn}>Routing Room</Link>
                    {first(action.item_id, itemId) && <Link href={`/deal-room/${encodeURIComponent(first(action.item_id, itemId))}`} style={ghost}>Work Area</Link>}
                    <Link href="/introductions" style={ghost}>Introductions</Link>
                  </div>
                </article>
              ))}
            </section>
          </section>
        )}

        {matches.length > 0 && (
          <section style={hero}>
            <div style={greenEyebrow}>Member Match Scoring</div>
            <h2 style={{ fontSize: 42, lineHeight: 1, margin: "0 0 14px" }}>
              Strongest member fits.
            </h2>
            <p style={{ ...muted, fontSize: 19 }}>
              Read-only scoring compares this signal context against member specialization. Nothing is routed or sent automatically.
            </p>

            <section style={grid}>
              {matches.map((match, index) => {
                const fitTone = matchTone(match.fit_level);

                return (
                  <article key={match.member_id || match.email || index} style={{ ...card, borderColor: `${fitTone}66` }}>
                    <div style={{ ...greenEyebrow, color: fitTone }}>
                      {label(match.fit_level || "weak")} Fit · {match.fit_score || 0}
                    </div>

                    <h3 style={{ fontSize: 28, margin: "0 0 10px" }}>
                      {match.full_name || match.email || "Member"}
                    </h3>

                    <div style={{ marginBottom: 12 }}>
                      {Array.isArray(match.roles) && match.roles.slice(0, 3).map((role: string) => (
                        <span key={role} style={chip}>{role}</span>
                      ))}
                      {Array.isArray(match.markets) && match.markets.slice(0, 3).map((market: string) => (
                        <span key={market} style={chip}>{market}</span>
                      ))}
                    </div>

                    {Array.isArray(match.reasons) && match.reasons.slice(0, 4).map((reason: string) => (
                      <p key={reason} style={{ ...muted, lineHeight: 1.45 }}>
                        {reason}
                      </p>
                    ))}

                    <Link href={`/member-intelligence/${encodeURIComponent(match.member_id || match.email || "")}`} style={btn}>
                      Member Detail
                    </Link>
                  </article>
                );
              })}
            </section>
          </section>
        )}

        <section style={{ ...hero, marginTop: 22 }}>
          <div style={greenEyebrow}>Current Safety Mode</div>
          <p style={{ ...muted, fontSize: 19 }}>
            Signal routing generation creates a routing record only. It does not auto-route, send notifications,
            create introductions, expose extra private data, or mutate members.
          </p>
        </section>
      </div>
    </main>
  );
}
