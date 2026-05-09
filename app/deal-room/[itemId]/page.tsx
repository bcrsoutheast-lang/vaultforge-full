"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type DealItem = Record<string, any>;
type Match = Record<string, any>;
type RoutingAction = Record<string, any>;

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
  color: "rgba(255,255,255,.70)",
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

function isOwnerEmail(email: string) {
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
  const text = clean(value || "item").replace(/_/g, " ");
  return text.slice(0, 1).toUpperCase() + text.slice(1);
}

function matchTone(level: string) {
  const fit = clean(level).toLowerCase();
  if (fit === "strong") return "#9df3bf";
  if (fit === "possible") return "#f5d978";
  return "#ffb3b3";
}

function dealPriority(item: DealItem | null) {
  return first(item?.priority, item?.urgency, item?.deal_priority, "medium").toLowerCase();
}

function dealScore(item: DealItem | null, matches: Match[], actions: RoutingAction[]) {
  let score = 50;
  const priority = dealPriority(item);

  if (priority === "urgent") score += 18;
  if (priority === "high") score += 10;
  if (first(item?.asking_price_display, item?.asking_price, item?.price)) score += 5;
  if (first(item?.arv_display, item?.arv, item?.value)) score += 5;
  if (first(item?.description, item?.seller_situation)) score += 5;
  if (matches.some((match) => clean(match.fit_level).toLowerCase() === "strong")) score += 12;
  if (actions.length > 0) score += 8;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function inferNeedTags(item: DealItem | null) {
  const source = [
    item?.title,
    item?.description,
    item?.seller_situation,
    item?.strategy,
    item?.property_type,
    item?.deal_need,
    item?.role_needed,
    item?.status,
  ]
    .join(" ")
    .toLowerCase();

  const tags = new Set<string>();

  if (source.includes("buyer") || source.includes("sell") || source.includes("dispo")) tags.add("Buyer Needed");
  if (source.includes("capital") || source.includes("lender") || source.includes("fund")) tags.add("Capital Needed");
  if (source.includes("operator") || source.includes("jv") || source.includes("partner")) tags.add("Operator Needed");
  if (source.includes("repair") || source.includes("contractor") || source.includes("construction")) tags.add("Execution Needed");
  if (source.includes("land")) tags.add("Land");
  if (source.includes("flip")) tags.add("Fix & Flip");
  if (source.includes("rental") || source.includes("hold")) tags.add("Buy & Hold");

  if (tags.size === 0) tags.add("Routing Context Needed");

  return Array.from(tags);
}

function valueText(item: DealItem | null) {
  return first(
    item?.asking_price_display,
    item?.asking_price,
    item?.price,
    item?.target_price,
    item?.arv_display,
    item?.arv
  );
}

function marketText(item: DealItem | null) {
  return first(item?.market, [item?.city, item?.state].filter(Boolean).join(", "), item?.state);
}

function itemTitle(item: DealItem | null, itemId: string) {
  return first(item?.title, item?.deal_title, item?.project_title, item?.property_title, item?.name, `Deal room ${itemId}`);
}

function itemDescription(item: DealItem | null) {
  return first(item?.description, item?.seller_situation, item?.summary, "Exact deal context, routing links, and member fit scoring.");
}

function exactSignalId(item: DealItem | null, itemId: string) {
  return first(item?.signal_id, item?.alert_id, `deal-${itemId}`);
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

function InfoBox({ title, value }: { title: string; value?: string | number }) {
  return (
    <div style={card}>
      <div style={greenEyebrow}>{title}</div>
      <p style={{ ...muted, fontSize: 18, margin: 0 }}>{value || "—"}</p>
    </div>
  );
}

async function loadItem({
  itemId,
  email,
  owner,
}: {
  itemId: string;
  email: string;
  owner: boolean;
}) {
  const res = await fetch(
    `/api/intelligence/item/${encodeURIComponent(itemId)}?email=${encodeURIComponent(email)}&owner=${owner ? "1" : "0"}`,
    {
      cache: "no-store",
      headers: {
        "x-vf-email": email,
        "x-vf-admin": owner ? "1" : "0",
      },
    }
  );

  const data = await safeJson(res);

  if (res.ok && data?.item) return data.item;

  return null;
}

export default function DealRoomPage() {
  const params = useParams();
  const itemId = decodeURIComponent(String(params?.itemId || ""));

  const [email, setEmail] = useState("");
  const [owner, setOwner] = useState(false);
  const [item, setItem] = useState<DealItem | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [actions, setActions] = useState<RoutingAction[]>([]);
  const [status, setStatus] = useState("Loading deal room...");
  const [matchStatus, setMatchStatus] = useState("");
  const [generateStatus, setGenerateStatus] = useState("");
  const [scoreBusy, setScoreBusy] = useState(false);
  const [generateBusy, setGenerateBusy] = useState(false);

  const [routeRole, setRouteRole] = useState("Buyer");
  const [routePriority, setRoutePriority] = useState("medium");
  const [routeNote, setRouteNote] = useState("");

  async function loadRoutingActions(currentEmail: string, currentOwner: boolean, signalId: string) {
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
    setStatus("Loading deal room...");

    try {
      const currentEmail = getEmail();
      const currentOwner = isOwnerEmail(currentEmail);

      setEmail(currentEmail);
      setOwner(currentOwner);

      if (!currentEmail) {
        setStatus("Login email not found. Please log in again.");
        return;
      }

      const found = await loadItem({
        itemId,
        email: currentEmail,
        owner: currentOwner,
      });

      setItem(found);

      const signalId = exactSignalId(found, itemId);
      await loadRoutingActions(currentEmail, currentOwner, signalId);

      if (!found) {
        setStatus("Exact item lookup did not find a source record yet, but this room can still generate routing context from the item ID.");
        return;
      }

      setStatus("");
    } catch (error: any) {
      setStatus(error?.message || "Could not load deal room.");
    }
  }

  async function runDealMatchScoring() {
    setScoreBusy(true);
    setMatchStatus("Scoring member fit for this deal...");

    try {
      const currentEmail = email || getEmail();
      const currentOwner = owner || isOwnerEmail(currentEmail);

      const res = await fetch("/api/member/match-score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": currentEmail,
          "x-vf-admin": currentOwner ? "1" : "0",
        },
        body: JSON.stringify({
          item_id: itemId,
          state: first(item?.state, item?.market),
          market: first(item?.market, item?.state),
          city: item?.city || "",
          strategy: first(item?.strategy, item?.asset_strategy),
          asset_type: first(item?.property_type, item?.asset_type, item?.item_kind),
          role_needed: first(item?.role_needed, item?.deal_need, routeRole),
          priority: dealPriority(item),
          title: itemTitle(item, itemId),
          note: first(item?.description, item?.seller_situation, item?.private_notes, routeNote),
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

  async function generateRoutingAction() {
    if (!owner) {
      setGenerateStatus("Owner/admin access required to generate routing actions.");
      return;
    }

    setGenerateBusy(true);
    setGenerateStatus("Generating routing action from this exact deal...");

    try {
      const currentEmail = email || getEmail();
      const signalId = exactSignalId(item, itemId);

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
          item_id: itemId,
          title: itemTitle(item, itemId),
          note: routeNote || itemDescription(item),
          state: first(item?.state, item?.market),
          market: first(item?.market, item?.state),
          city: item?.city || "",
          strategy: first(item?.strategy, item?.asset_strategy),
          asset_type: first(item?.property_type, item?.asset_type, item?.item_kind),
          role_needed: routeRole,
          priority: routePriority,
          source: "deal_room_generate",
          source_table: item?.source_table || "",
          item_kind: item?.item_kind || "",
        }),
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Could not generate routing action.");
      }

      setGenerateStatus(data?.message || "Routing action generated.");
      setRouteNote("");
      await loadRoutingActions(currentEmail, true, signalId);
    } catch (error: any) {
      setGenerateStatus(error?.message || "Could not generate routing action.");
    } finally {
      setGenerateBusy(false);
    }
  }

  useEffect(() => {
    load();
  }, [itemId]);

  const score = useMemo(() => dealScore(item, matches, actions), [item, matches, actions]);
  const needs = useMemo(() => inferNeedTags(item), [item]);
  const priority = dealPriority(item);
  const priorityColor = priority === "urgent" ? "#ffb3b3" : priority === "high" ? "#f5d978" : "#9df3bf";
  const signalId = exactSignalId(item, itemId);

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
          .vf-deal-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .vf-deal-actions > * {
            width: 100%;
            margin: 0 !important;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <section style={{ ...hero, borderColor: `${priorityColor}66` }}>
          <div style={{ ...greenEyebrow, color: priorityColor }}>
            VaultForge Deal Room · {owner ? "Owner View" : "Member View"}
          </div>

          <h1 style={{ fontSize: "clamp(54px,11vw,104px)", lineHeight: 0.86, margin: "0 0 18px" }}>
            {itemTitle(item, itemId)}
          </h1>

          <p style={{ ...muted, fontSize: 22 }}>
            {itemDescription(item)}
          </p>

          <div>
            <span style={chip}>Item: {itemId}</span>
            <span style={chip}>Signal: {signalId}</span>
            <span style={chip}>Priority: {label(priority)}</span>
            <span style={chip}>Score: {score}</span>
            <span style={chip}>Market: {marketText(item) || "Unassigned"}</span>
            <span style={chip}>Routes: {actions.length}</span>
            <span style={chip}>Matches: {matches.length}</span>
          </div>

          <div className="vf-deal-actions" style={{ marginTop: 14 }}>
            <button type="button" style={btn} onClick={load}>Refresh Deal Room</button>
            <button type="button" style={btn} disabled={scoreBusy} onClick={runDealMatchScoring}>
              {scoreBusy ? "Scoring..." : "Score Member Fits"}
            </button>
            <Link href={`/routing-room/${encodeURIComponent(signalId)}`} style={ghost}>Routing Room</Link>
            <Link href={`/signals/${encodeURIComponent(signalId)}`} style={ghost}>Signal</Link>
            <Link href="/activity" style={ghost}>Activity</Link>
            <Link href="/member-intelligence" style={ghost}>Member Intelligence</Link>
            <Link href="/routing-inbox" style={ghost}>Routing Inbox</Link>
            <Link href="/introductions" style={ghost}>Introductions</Link>
            {owner && <Link href="/admin-intelligence" style={ghost}>Owner Intelligence</Link>}
            <Link href="/logout" style={danger}>Logout</Link>
          </div>

          {status && (
            <p style={{ color: status.toLowerCase().includes("could not") || status.toLowerCase().includes("not found") ? "#ffd0d0" : "#9df3bf", fontWeight: 900 }}>
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
        </section>

        <section style={statGrid}>
          <StatCard title="Deal Score" value={score} detail="Computed from priority, deal context, matches, and routing actions." tone={priorityColor} />
          <StatCard title="Need Tags" value={needs.length} detail="Detected needs from available deal context." />
          <StatCard title="Member Matches" value={matches.length} detail="Read-only fit results from specialization scoring." />
          <StatCard title="Routing Actions" value={actions.length} detail="Generated routing actions tied to this exact item/signal." />
          <StatCard title="Value" value={valueText(item) || "—"} detail="Best available price/value indicator." />
        </section>

        {owner && (
          <section style={hero}>
            <div style={greenEyebrow}>Owner Routing Generator</div>
            <h2 style={{ fontSize: 42, lineHeight: 1, margin: "0 0 14px" }}>
              Generate routing from this exact deal.
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
              placeholder="Why should this deal be routed? What pressure, member fit, capital need, or buyer/operator need exists?"
            />

            <button type="button" style={btn} disabled={generateBusy} onClick={generateRoutingAction}>
              {generateBusy ? "Generating..." : "Generate Routing Action"}
            </button>
          </section>
        )}

        <section style={hero}>
          <div style={greenEyebrow}>Deal Need / Routing Context</div>
          <h2 style={{ fontSize: 42, lineHeight: 1, margin: "0 0 14px" }}>
            What this deal appears to need.
          </h2>
          <p style={{ ...muted, fontSize: 19 }}>
            These tags are inferred from the available deal/pain/project data and help owner decide where to route next.
          </p>
          <div>
            {needs.map((need) => (
              <span key={need} style={chip}>{need}</span>
            ))}
          </div>
        </section>

        {actions.length > 0 && (
          <section style={hero}>
            <div style={greenEyebrow}>Generated Routing Actions</div>
            <section style={grid}>
              {actions.map((action, index) => (
                <article key={action.id || index} style={card}>
                  <div style={greenEyebrow}>{label(first(action.action, action.routing_action, "route"))}</div>
                  <h3 style={{ fontSize: 28, margin: "0 0 10px" }}>{first(action.title, "Routing action")}</h3>
                  <p style={{ ...muted }}>{first(action.urgency_reason, action.note, action.routing_summary)}</p>
                  <span style={chip}>Confidence: {first(action.confidence_score, action.match_score, 0)}</span>
                  {action.role_match && <span style={chip}>Role: {action.role_match}</span>}
                  {action.state_match && <span style={chip}>State: {action.state_match}</span>}
                  {action.strategy_match && <span style={chip}>Strategy: {action.strategy_match}</span>}
                  <div>
                    <Link href={`/routing-room/${encodeURIComponent(first(action.signal_id, signalId))}`} style={btn}>Routing Room</Link>
                    <Link href="/activity" style={ghost}>Activity</Link>
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
              Read-only scoring compares this deal context against member specialization. Nothing is routed or sent automatically.
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

        {item && (
          <section style={hero}>
            <div style={greenEyebrow}>Source Object Details</div>
            <section style={grid}>
              <InfoBox title="Market" value={marketText(item)} />
              <InfoBox title="City" value={item.city} />
              <InfoBox title="State" value={item.state} />
              <InfoBox title="Source Table" value={item.source_table} />
              <InfoBox title="Property Type" value={first(item.property_type, item.asset_type, item.item_kind)} />
              <InfoBox title="Strategy" value={item.strategy} />
              <InfoBox title="Status" value={item.status} />
              <InfoBox title="Asking Price" value={first(item.asking_price_display, item.asking_price, item.price)} />
              <InfoBox title="ARV / Value" value={first(item.arv_display, item.arv, item.value)} />
              <InfoBox title="Repairs" value={first(item.repair_estimate_display, item.repairs, item.repair_estimate)} />
              {owner && <InfoBox title="Exact Address" value={item.exact_address} />}
              {owner && <InfoBox title="Contact Email" value={item.contact_email} />}
              {owner && <InfoBox title="Contact Phone" value={item.contact_phone} />}
              {owner && <InfoBox title="Private Notes" value={item.private_notes} />}
            </section>
          </section>
        )}

        <section style={{ ...hero, marginTop: 22 }}>
          <div style={greenEyebrow}>Current Safety Mode</div>
          <p style={{ ...muted, fontSize: 19 }}>
            Deal Room routing generation creates a routing record only. It does not auto-route, send notifications,
            create introductions, expose extra private data, or mutate members.
          </p>
        </section>
      </div>
    </main>
  );
}
