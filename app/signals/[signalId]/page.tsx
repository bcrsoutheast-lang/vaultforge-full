"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type Signal = Record<string, any>;
type RoutingAction = Record<string, any>;
type RelatedItem = Record<string, any>;

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
  const text = clean(value || "signal").replace(/_/g, " ");
  return text.slice(0, 1).toUpperCase() + text.slice(1);
}

function safeScore(value: unknown, fallback = 62) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function priorityTone(value: string) {
  const priority = clean(value).toLowerCase();
  if (priority === "urgent") return "#ffb3b3";
  if (priority === "high") return "#f5d978";
  return "#9df3bf";
}

function signalPriority(signal: Signal | null) {
  return clean(signal?.priority || signal?.severity || signal?.alert_priority || "medium").toLowerCase();
}

function signalScore(signal: Signal | null, actions: RoutingAction[]) {
  if (signal?.score !== undefined) return safeScore(signal.score);
  if (signal?.confidence_score !== undefined) return safeScore(signal.confidence_score);
  if (signal?.match_score !== undefined) return safeScore(signal.match_score);

  let score = 48;

  const priority = signalPriority(signal);
  if (priority === "urgent") score += 22;
  if (priority === "high") score += 14;

  if (actions.length > 0) score += 12;
  if (actions.some((item) => clean(item.action).includes("route_to"))) score += 8;
  if (actions.some((item) => clean(item.response).toLowerCase() === "interested")) score += 8;

  return Math.min(98, score);
}

function market(signal: Signal | null, item: RelatedItem | null) {
  return clean(
    signal?.market ||
      signal?.state ||
      signal?.location ||
      [item?.city, item?.state].filter(Boolean).join(", ")
  ) || "Unassigned market";
}

function pressureReason(signal: Signal | null, item: RelatedItem | null, actions: RoutingAction[]) {
  if (clean(signal?.pressure_reason)) return clean(signal.pressure_reason);
  if (clean(signal?.urgency_reason)) return clean(signal.urgency_reason);
  if (clean(signal?.reason)) return clean(signal.reason);

  const priority = signalPriority(signal);
  const hasCapital = actions.some((item) => clean(item.action).includes("lender"));
  const hasBuyer = actions.some((item) => clean(item.action).includes("buyer"));
  const hasOperator = actions.some((item) => clean(item.action).includes("operator") || clean(item.action).includes("contractor"));

  if (priority === "urgent") {
    return "Urgent signal pressure is present. This should be reviewed before it loses timing, leverage, or relationship momentum.";
  }

  if (hasCapital) {
    return "Capital routing activity suggests this signal may need lender, private money, or funding alignment.";
  }

  if (hasBuyer) {
    return "Buyer routing activity suggests this signal may fit active acquisition demand.";
  }

  if (hasOperator) {
    return "Operator or contractor routing activity suggests this signal needs execution capacity.";
  }

  if (clean(item?.seller_situation)) {
    return `Source object contains situation pressure: ${item.seller_situation}`;
  }

  return "Signal created from available opportunity, routing, pain, deal, or activity data. More context can be added through routing actions.";
}

function recommendedRoute(signal: Signal | null, actions: RoutingAction[]) {
  if (clean(signal?.recommended_route)) return clean(signal.recommended_route);
  if (clean(signal?.recommended_action)) return clean(signal.recommended_action);

  if (actions.some((item) => clean(item.action) === "route_to_buyer")) return "Route toward qualified buyers and acquisition demand.";
  if (actions.some((item) => clean(item.action) === "route_to_lender")) return "Route toward lender/private capital review.";
  if (actions.some((item) => clean(item.action) === "route_to_operator")) return "Route toward operator/JV execution support.";
  if (actions.some((item) => clean(item.action) === "route_to_contractor")) return "Route toward contractor/construction execution support.";
  if (actions.some((item) => clean(item.action) === "needs_review")) return "Owner review should happen before member delivery.";

  return "Open routing room and add owner routing context before delivery.";
}

function needTags(signal: Signal | null, actions: RoutingAction[]) {
  const tags = new Set<string>();

  const source = [
    signal?.needs,
    signal?.deal_needs,
    signal?.alert_type,
    signal?.category,
    signal?.message,
    signal?.title,
    ...actions.map((item) => item.action),
    ...actions.map((item) => item.target_role),
  ]
    .flat()
    .join(" ")
    .toLowerCase();

  if (source.includes("buyer")) tags.add("Buyer Needed");
  if (source.includes("lender") || source.includes("capital") || source.includes("fund")) tags.add("Capital Needed");
  if (source.includes("operator") || source.includes("jv")) tags.add("Operator Needed");
  if (source.includes("contractor") || source.includes("repair") || source.includes("construction")) tags.add("Execution Needed");
  if (source.includes("review")) tags.add("Owner Review");
  if (source.includes("urgent")) tags.add("Urgent");

  if (tags.size === 0) tags.add("Routing Context Needed");

  return Array.from(tags);
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function StatCard({ title, value, detail, tone }: { title: string; value: string | number; detail: string; tone?: string }) {
  return (
    <div style={{ ...card, borderColor: `${tone || "#9df3bf"}66` }}>
      <div style={{ color: tone || "#9df3bf", letterSpacing: 4, fontWeight: 900, fontSize: 11, marginBottom: 10, textTransform: "uppercase" }}>
        {title}
      </div>
      <div style={{ fontSize: 42, fontWeight: 950, lineHeight: 1 }}>{value}</div>
      <p style={{ color: "rgba(255,255,255,.68)", lineHeight: 1.45, marginBottom: 0 }}>{detail}</p>
    </div>
  );
}

function InfoBox({ title, value }: { title: string; value?: string | number }) {
  return (
    <div style={card}>
      <div style={{ color: "#9df3bf", letterSpacing: 4, fontWeight: 900, fontSize: 11, marginBottom: 10, textTransform: "uppercase" }}>
        {title}
      </div>
      <p style={{ color: "rgba(255,255,255,.72)", lineHeight: 1.55, fontSize: 18, margin: 0 }}>{value || "—"}</p>
    </div>
  );
}

export default function SignalDetailPage() {
  const params = useParams();
  const signalId = decodeURIComponent(String(params?.signalId || ""));

  const [email, setEmail] = useState("");
  const [owner, setOwner] = useState(false);
  const [signal, setSignal] = useState<Signal | null>(null);
  const [item, setItem] = useState<RelatedItem | null>(null);
  const [actions, setActions] = useState<RoutingAction[]>([]);
  const [matches, setMatches] = useState<Record<string, any>[]>([]);
  const [matchStatus, setMatchStatus] = useState("");
  const [scoreBusy, setScoreBusy] = useState(false);
  const [status, setStatus] = useState("Loading signal intelligence...");

  async function load() {
    setStatus("Loading signal intelligence...");

    try {
      const currentEmail = getEmail();
      const currentOwner = isOwner(currentEmail);

      setEmail(currentEmail);
      setOwner(currentOwner);

      const headers = {
        "x-vf-email": currentEmail,
        "x-vf-admin": currentOwner ? "1" : "0",
      };

      const [storedRes, feedRes, actionRes] = await Promise.all([
        fetch(`/api/intelligence/stored?email=${encodeURIComponent(currentEmail)}&owner=${currentOwner ? "1" : "0"}`, {
          cache: "no-store",
          headers,
        }),
        fetch(`/api/intelligence/feed?email=${encodeURIComponent(currentEmail)}&owner=${currentOwner ? "1" : "0"}`, {
          cache: "no-store",
          headers,
        }),
        fetch(`/api/routing/actions?email=${encodeURIComponent(currentEmail)}&owner=${currentOwner ? "1" : "0"}&signal_id=${encodeURIComponent(signalId)}`, {
          cache: "no-store",
          headers,
        }),
      ]);

      const storedData = await safeJson(storedRes);
      const feedData = await safeJson(feedRes);
      const actionData = await safeJson(actionRes);

      const stored = Array.isArray(storedData?.alerts) ? storedData.alerts : [];
      const generated = Array.isArray(feedData?.alerts) ? feedData.alerts : [];
      const found =
        stored.find((entry: Signal) => String(entry.id) === signalId) ||
        generated.find((entry: Signal) => String(entry.id) === signalId) ||
        null;

      const actionRows = Array.isArray(actionData?.actions) ? actionData.actions : [];

      setSignal(found);
      setActions(actionRows);

      const itemId = clean(found?.item_id || found?.deal_id || found?.project_id || found?.pain_id || actionRows[0]?.item_id);

      if (itemId) {
        const itemRes = await fetch(`/api/intelligence/item/${encodeURIComponent(itemId)}?email=${encodeURIComponent(currentEmail)}&owner=${currentOwner ? "1" : "0"}`, {
          cache: "no-store",
          headers,
        });

        const itemData = await safeJson(itemRes);
        setItem(itemData?.item || null);
      } else {
        setItem(null);
      }

      setStatus(found || actionRows.length ? "" : "Signal not found yet, but this room can still collect routing context.");
    } catch (error: any) {
      setStatus(error?.message || "Could not load signal intelligence.");
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
          state: signal?.state || signal?.market || item?.state || actions[0]?.state_match || "",
          market: signal?.market || signal?.state || item?.state || actions[0]?.state_match || "",
          city: item?.city || "",
          strategy: signal?.strategy || item?.strategy || actions[0]?.strategy_match || "",
          asset_type: signal?.asset_type || item?.property_type || actions[0]?.asset_type || "",
          role_needed: signal?.role_needed || actions[0]?.role_match || actions[0]?.target_role || "",
          priority,
          title: signal?.title || item?.title || "VaultForge signal",
          note: signal?.message || signal?.description || pressure,
          urgency_reason: pressure,
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

  useEffect(() => {
    load();
  }, [signalId]);

  const priority = signalPriority(signal);
  const tone = priorityTone(priority);
  const score = signalScore(signal, actions);
  const tags = useMemo(() => needTags(signal, actions), [signal, actions]);
  const route = recommendedRoute(signal, actions);
  const pressure = pressureReason(signal, item, actions);

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
          .vf-signal-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .vf-signal-actions > * {
            width: 100%;
            margin: 0 !important;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <section style={{ ...hero, borderColor: `${tone}66` }}>
          <div style={{ color: tone, letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 12, textTransform: "uppercase" }}>
            VaultForge Signal Intelligence · {owner ? "Owner View" : "Member View"}
          </div>

          <h1 style={{ fontSize: "clamp(54px,11vw,104px)", lineHeight: 0.86, margin: "0 0 18px" }}>
            {signal?.title || "Signal detail"}
          </h1>

          <p style={{ color: "rgba(255,255,255,.72)", fontSize: 22, lineHeight: 1.55 }}>
            {signal?.message || signal?.description || "Signal intelligence context and routing explanation."}
          </p>

          <div>
            <span style={chip}>Signal: {signalId}</span>
            <span style={chip}>Priority: {label(priority)}</span>
            <span style={chip}>Score: {score}</span>
            <span style={chip}>Market: {market(signal, item)}</span>
            <span style={chip}>Routing Actions: {actions.length}</span>
          </div>

          <div className="vf-signal-actions" style={{ marginTop: 14 }}>
            <button type="button" style={btn} onClick={load}>Refresh Signal</button>
            <Link href={`/routing-room/${encodeURIComponent(signalId)}`} style={btn}>Routing Room</Link>
            <button type="button" style={btn} disabled={scoreBusy} onClick={runMatchScoring}>
              {scoreBusy ? "Scoring..." : "Score Member Fits"}
            </button>
            <Link href="/activity" style={ghost}>Activity Stream</Link>
            <Link href="/alerts" style={ghost}>Alerts</Link>
            <Link href="/intelligence" style={ghost}>Intelligence</Link>
            <Link href="/routing-inbox" style={ghost}>Routing Inbox</Link>
            <Link href="/introductions" style={ghost}>Introductions</Link>
            {owner && <Link href="/admin-intelligence" style={ghost}>Owner Intelligence</Link>}
            {item?.id && <Link href={`/deal-room/${encodeURIComponent(item.id)}`} style={ghost}>Deal Room</Link>}
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
        </section>

        <section style={statGrid}>
          <StatCard title="Signal Score" value={score} detail="Computed signal strength from priority, routing activity, and available confidence." tone={tone} />
          <StatCard title="Routing Actions" value={actions.length} detail="Actions currently tied to this signal." />
          <StatCard title="Need Tags" value={tags.length} detail="Detected needs from signal text and routing context." />
          <StatCard title="Market" value={market(signal, item)} detail="Best available market/location context." />
        </section>

        <section style={hero}>
          <div style={{ color: "#9df3bf", letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 12, textTransform: "uppercase" }}>
            Pressure Explanation
          </div>

          <h2 style={{ fontSize: 42, lineHeight: 1, margin: "0 0 14px" }}>
            Why this signal matters.
          </h2>

          <p style={{ color: "rgba(255,255,255,.72)", fontSize: 19, lineHeight: 1.6 }}>
            {pressure}
          </p>

          <div>
            {tags.map((tag) => (
              <span key={tag} style={chip}>{tag}</span>
            ))}
          </div>
        </section>

        <section style={hero}>
          <div style={{ color: "#9df3bf", letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 12, textTransform: "uppercase" }}>
            Recommended Route
          </div>

          <h2 style={{ fontSize: 42, lineHeight: 1, margin: "0 0 14px" }}>
            Next best controlled move.
          </h2>

          <p style={{ color: "rgba(255,255,255,.72)", fontSize: 19, lineHeight: 1.6 }}>
            {route}
          </p>

          <Link href={`/routing-room/${encodeURIComponent(signalId)}`} style={btn}>Open Routing Room</Link>
          {owner && <Link href="/admin-routing" style={ghost}>Admin Routing</Link>}
        </section>

        {matches.length > 0 && (
          <section style={hero}>
            <div style={{ color: "#9df3bf", letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 12, textTransform: "uppercase" }}>
              Member Match Scoring
            </div>

            <h2 style={{ fontSize: 42, lineHeight: 1, margin: "0 0 14px" }}>
              Strongest member fits.
            </h2>

            <p style={{ color: "rgba(255,255,255,.72)", fontSize: 19, lineHeight: 1.6 }}>
              Read-only scoring compares this signal against member specialization. Nothing is routed or sent automatically.
            </p>

            <section style={grid}>
              {matches.map((match, index) => {
                const fit = clean(match.fit_level).toLowerCase();
                const fitTone =
                  fit === "strong"
                    ? "#9df3bf"
                    : fit === "possible"
                    ? "#f5d978"
                    : "#ffb3b3";

                return (
                  <article key={match.member_id || match.email || index} style={{ ...card, borderColor: `${fitTone}66` }}>
                    <div style={{ color: fitTone, letterSpacing: 4, fontWeight: 900, fontSize: 11, marginBottom: 10, textTransform: "uppercase" }}>
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
                      <p key={reason} style={{ color: "rgba(255,255,255,.70)", lineHeight: 1.45 }}>
                        {reason}
                      </p>
                    ))}

                    <Link href={`/member-intelligence/${encodeURIComponent(match.member_id || match.email || "")}`} style={btn}>
                      Member Detail
                    </Link>

                    <Link href={`/routing-room/${encodeURIComponent(signalId)}`} style={ghost}>
                      Use in Routing Room
                    </Link>
                  </article>
                );
              })}
            </section>
          </section>
        )}

        {actions.length > 0 && (
          <section style={hero}>
            <div style={{ color: "#9df3bf", letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 12, textTransform: "uppercase" }}>
              Routing Context Attached
            </div>

            <section style={grid}>
              {actions.slice(0, 6).map((action, index) => (
                <article key={action.id || index} style={card}>
                  <div style={{ color: priorityTone(action.priority), letterSpacing: 4, fontWeight: 900, fontSize: 11, marginBottom: 10, textTransform: "uppercase" }}>
                    {label(action.action || "routing")}
                  </div>
                  <h3 style={{ fontSize: 28, margin: "0 0 10px" }}>{action.title || "Routing action"}</h3>
                  <p style={{ color: "rgba(255,255,255,.70)", lineHeight: 1.55 }}>{action.urgency_reason || action.note || "No routing explanation recorded."}</p>
                  {action.confidence_score && <span style={chip}>Confidence: {action.confidence_score}%</span>}
                  {action.state_match && <span style={chip}>State: {action.state_match}</span>}
                  {action.strategy_match && <span style={chip}>Strategy: {action.strategy_match}</span>}
                  {action.role_match && <span style={chip}>Role: {action.role_match}</span>}
                </article>
              ))}
            </section>
          </section>
        )}

        {item && (
          <section style={hero}>
            <div style={{ color: "#9df3bf", letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 12, textTransform: "uppercase" }}>
              Source Object Context
            </div>

            <h2 style={{ fontSize: 42, lineHeight: 1, margin: "0 0 14px" }}>{item.title || "Related deal / pain / project"}</h2>
            <p style={{ color: "rgba(255,255,255,.72)", fontSize: 19, lineHeight: 1.6 }}>
              {item.description || item.seller_situation || "No source description available."}
            </p>

            <section style={grid}>
              <InfoBox title="City / State" value={[item.city, item.state].filter(Boolean).join(", ")} />
              <InfoBox title="Property Type" value={item.property_type} />
              <InfoBox title="Strategy" value={item.strategy} />
              <InfoBox title="Status" value={item.status} />
              <InfoBox title="Asking Price" value={item.asking_price_display || item.asking_price} />
              <InfoBox title="ARV / Value" value={item.arv_display || item.arv} />
            </section>
          </section>
        )}

        <section style={hero}>
          <div style={{ color: "#9df3bf", letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 12, textTransform: "uppercase" }}>
            Current Safety Mode
          </div>

          <p style={{ color: "rgba(255,255,255,.72)", fontSize: 19, lineHeight: 1.6 }}>
            This page is read-only intelligence context. It does not auto-route, contact members, send introductions,
            mutate deals, or trigger autonomous AI behavior.
          </p>
        </section>
      </div>
    </main>
  );
}
