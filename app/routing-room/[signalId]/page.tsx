"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type Access = {
  email?: string;
  owner?: boolean;
  profile_complete?: boolean;
  paid?: boolean;
  unlocked?: boolean;
};

type Signal = {
  id: string;
  source?: string;
  alert_type?: string;
  priority?: string;
  score?: number;
  title?: string;
  message?: string;
  member_email?: string;
  member_name?: string;
  item_id?: string;
  item_title?: string;
  deal_id?: string;
  deal_title?: string;
  state?: string;
  market?: string;
  source_table?: string;
  safe_href?: string;
};

type RelatedItem = {
  id?: string;
  title?: string;
  source_table?: string;
  item_kind?: string;
  city?: string;
  state?: string;
  property_type?: string;
  strategy?: string;
  status?: string;
  asking_price_display?: string;
  arv_display?: string;
  repair_estimate_display?: string;
  description?: string;
  seller_situation?: string;
  deal_needs?: string[];
  main_photo_url?: string;
  exact_address?: string;
  contact_email?: string;
  contact_phone?: string;
  private_notes?: string;
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
  gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
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

const danger: React.CSSProperties = {
  ...ghost,
  color: "#ffd0d0",
  border: "1px solid rgba(255,120,120,.38)",
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: 5,
  fontWeight: 950,
  fontSize: 12,
  marginBottom: 12,
  textTransform: "uppercase",
};

const greenEyebrow: React.CSSProperties = { ...eyebrow, color: "#9df3bf" };

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

function isOwner(email: string, access: Access | null) {
  return cleanEmail(email) === OWNER_EMAIL || access?.owner === true;
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function priorityTone(priority: string) {
  const p = String(priority || "").toLowerCase();
  if (p === "urgent") return "#ff9f9f";
  if (p === "high") return "#f5d978";
  if (p === "medium") return "#9df3bf";
  return "#d8b5ff";
}

function typeLabel(type: string) {
  const t = String(type || "opportunity").replace(/_/g, " ");
  return t.slice(0, 1).toUpperCase() + t.slice(1);
}

function actionLabel(action: string) {
  const text = String(action || "manual_note").replace(/_/g, " ");
  return text.slice(0, 1).toUpperCase() + text.slice(1);
}

function itemIdFor(signal: Signal | null, item: RelatedItem | null) {
  return clean(item?.id || signal?.item_id || signal?.deal_id);
}

function normalizeSignal(value: any): Signal {
  return {
    id: clean(value.id),
    source: clean(value.source),
    alert_type: clean(value.alert_type),
    priority: clean(value.priority),
    score: Number(value.score || 0),
    title: clean(value.title || value.alert_title || value.match_title),
    message: clean(value.message || value.alert_message || value.alert_body || value.body),
    member_email: clean(value.member_email || value.recipient_email || value.matched_member_email),
    member_name: clean(value.member_name),
    item_id: clean(value.item_id || value.deal_id || value.project_id || value.property_id || value.pain_id),
    item_title: clean(value.item_title || value.deal_title || value.project_title || value.property_title),
    deal_id: clean(value.deal_id || value.project_id || value.property_id),
    deal_title: clean(value.deal_title || value.project_title || value.item_title),
    state: clean(value.state),
    market: clean(value.market),
    source_table: clean(value.source_table),
    safe_href: clean(value.safe_href) || "/projects",
  };
}

function dealRoomHref(signal: Signal | null) {
  const itemId = clean(signal?.item_id || signal?.deal_id);
  if (!itemId) return "";
  return `/deal-room/${encodeURIComponent(itemId)}`;
}

function RoutingPanel({
  title,
  text,
  status,
}: {
  title: string;
  text: string;
  status: string;
}) {
  return (
    <div style={card}>
      <div style={greenEyebrow}>{title}</div>
      <h3 style={{ fontSize: 28, margin: "0 0 10px" }}>{status}</h3>
      <p style={{ ...muted, fontSize: 17, marginBottom: 0 }}>{text}</p>
    </div>
  );
}


async function logRoutingAction({
  email,
  signal,
  item,
  action,
  note,
  targetRole,
}: {
  email: string;
  signal: Signal | null;
  item: RelatedItem | null;
  action: string;
  note: string;
  targetRole: string;
}) {
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
      signal_id: signal?.id,
      item_id: itemIdFor(signal, item),
      deal_id: item?.item_kind === "deal_or_project" ? itemIdFor(signal, item) : "",
      pain_id: item?.item_kind === "pain_signal" ? itemIdFor(signal, item) : "",
      action,
      target_role: targetRole,
      note,
      title: signal?.title || item?.title || "VaultForge routing action",
      signal_title: signal?.title,
      item_title: item?.title,
      priority: signal?.priority || "medium",
      source: "routing_room",
      source_table: item?.source_table || signal?.source_table,
    }),
  });

  const data = await safeJson(res);

  if (!res.ok || data?.ok === false) {
    throw new Error(data?.error || data?.details || "Could not log routing action.");
  }

  return data;
}

async function loadRoutingActions(email: string, owner: boolean, signal: Signal | null, item: RelatedItem | null) {
  const params = new URLSearchParams();
  params.set("email", email);
  params.set("owner", owner ? "1" : "0");

  if (signal?.id) params.set("signal_id", signal.id);

  const itemId = itemIdFor(signal, item);
  if (itemId) params.set("item_id", itemId);

  const res = await fetch(`/api/routing/actions?${params.toString()}`, {
    cache: "no-store",
    headers: {
      "x-vf-email": email,
      "x-vf-admin": owner ? "1" : "0",
    },
  });

  const data = await safeJson(res);

  if (!res.ok || data?.ok === false) {
    return [];
  }

  return Array.isArray(data?.actions) ? data.actions : [];
}

function LockedScreen({ reason }: { reason: "login" | "profile" | "payment" | "loading" }) {
  return (
    <main style={page}>
      <div style={wrap}>
        <section style={hero}>
          <div style={greenEyebrow}>VaultForge Routing Room</div>
          <h1 style={{ fontSize: "clamp(54px,12vw,100px)", lineHeight: 0.88, margin: "0 0 18px" }}>
            {reason === "loading"
              ? "Checking routing-room access..."
              : reason === "login"
              ? "Login required."
              : reason === "profile"
              ? "Complete your profile first."
              : "Activate access first."}
          </h1>
          {reason === "login" && <Link href="/login" style={btn}>Login / Create Access</Link>}
          {reason === "profile" && <Link href="/profile" style={btn}>Complete Profile</Link>}
          {reason === "payment" && <Link href="/payment" style={btn}>Activate Access</Link>}
          <Link href="/alerts" style={ghost}>Back to Alerts</Link>
        </section>
      </div>
    </main>
  );
}

export default function RoutingRoomPage() {
  const params = useParams();
  const signalId = decodeURIComponent(String(params?.signalId || ""));

  const [email, setEmail] = useState("");
  const [access, setAccess] = useState<Access | null>(null);
  const [lockReason, setLockReason] = useState<"loading" | "login" | "profile" | "payment" | "open">("loading");
  const [signal, setSignal] = useState<Signal | null>(null);
  const [item, setItem] = useState<RelatedItem | null>(null);
  const [actions, setActions] = useState<RoutingAction[]>([]);
  const [actionNote, setActionNote] = useState("");
  const [actionBusy, setActionBusy] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [status, setStatus] = useState("Loading routing room...");

  async function load() {
    setStatus("Loading routing room...");

    try {
      const currentEmail = getEmail();
      setEmail(currentEmail);

      if (!currentEmail) {
        setLockReason("login");
        setStatus("");
        return;
      }

      const accessRes = await fetch(`/api/member/access?email=${encodeURIComponent(currentEmail)}`, {
        cache: "no-store",
        headers: { "x-vf-email": currentEmail },
      });

      const accessData = await safeJson(accessRes);
      setAccess(accessData);

      if (!accessData?.owner && !accessData?.profile_complete) {
        setLockReason("profile");
        setStatus("");
        return;
      }

      if (!accessData?.owner && !accessData?.paid && !accessData?.unlocked) {
        setLockReason("payment");
        setStatus("");
        return;
      }

      const owner = isOwner(currentEmail, accessData);

      const [storedRes, feedRes] = await Promise.all([
        fetch(`/api/intelligence/stored?email=${encodeURIComponent(currentEmail)}&owner=${owner ? "1" : "0"}`, {
          cache: "no-store",
          headers: {
            "x-vf-email": currentEmail,
            "x-vf-admin": owner ? "1" : "0",
          },
        }),
        fetch(`/api/intelligence/feed?email=${encodeURIComponent(currentEmail)}&owner=${owner ? "1" : "0"}`, {
          cache: "no-store",
          headers: {
            "x-vf-email": currentEmail,
            "x-vf-admin": owner ? "1" : "0",
          },
        }),
      ]);

      const storedData = await safeJson(storedRes);
      const feedData = await safeJson(feedRes);

      const stored = Array.isArray(storedData?.alerts) ? storedData.alerts.map(normalizeSignal) : [];
      const generated = Array.isArray(feedData?.alerts) ? feedData.alerts.map(normalizeSignal) : [];

      const found = stored.find((item) => item.id === signalId) || generated.find((item) => item.id === signalId) || null;
      setSignal(found);

      const itemId = clean(found?.item_id || found?.deal_id);

      const relatedItem = itemId
        ? await (async () => {
            const itemRes = await fetch(`/api/intelligence/item/${encodeURIComponent(itemId)}?email=${encodeURIComponent(currentEmail)}&owner=${owner ? "1" : "0"}`, {
              cache: "no-store",
              headers: {
                "x-vf-email": currentEmail,
                "x-vf-admin": owner ? "1" : "0",
              },
            });

            const itemData = await safeJson(itemRes);
            return itemData?.item || null;
          })()
        : null;

      setItem(relatedItem);

      const loadedActions = await loadRoutingActions(currentEmail, owner, found, relatedItem);
      setActions(loadedActions);

      setLockReason("open");
      setStatus(found ? "" : "Routing signal was not found in current stored or generated feed.");
    } catch (error: any) {
      setLockReason("open");
      setStatus(error?.message || "Could not load routing room.");
    }
  }

  async function handleRoutingAction(action: string, targetRole: string) {
    if (!owner) {
      setActionMessage("Owner/admin access required to log routing actions.");
      return;
    }

    setActionBusy(action);
    setActionMessage("Logging routing action...");

    try {
      const result = await logRoutingAction({
        email,
        signal,
        item,
        action,
        targetRole,
        note: actionNote,
      });

      setActionMessage(result?.message || "Routing action logged safely.");
      setActionNote("");

      const loadedActions = await loadRoutingActions(email, owner, signal, item);
      setActions(loadedActions);
    } catch (error: any) {
      setActionMessage(error?.message || "Could not log routing action.");
    } finally {
      setActionBusy("");
    }
  }

  useEffect(() => {
    load();
  }, [signalId]);

  const owner = useMemo(() => isOwner(email, access), [email, access]);
  const tone = priorityTone(signal?.priority || "medium");
  const type = String(signal?.alert_type || "").toLowerCase();

  const capitalStatus = type.includes("capital") || type.includes("funding") ? "Primary route" : "Watch";
  const buyerStatus = type.includes("buyer") ? "Primary route" : "Watch";
  const operatorStatus = type.includes("operator") || type.includes("contractor") ? "Primary route" : "Watch";
  const distressStatus = type.includes("distress") || type.includes("pain") ? "Primary route" : "Watch";

  if (lockReason !== "open") {
    return <LockedScreen reason={lockReason} />;
  }

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
        <section style={{ ...hero, borderColor: `${tone}66` }}>
          <div style={{ ...greenEyebrow, color: tone }}>
            VaultForge Routing Room · {owner ? "Owner View" : "Member View"} · {signal?.priority || "signal"}
          </div>

          <h1 style={{ fontSize: "clamp(52px,10vw,92px)", lineHeight: 0.88, margin: "0 0 18px" }}>
            {signal?.title || "Routing room not found."}
          </h1>

          <p style={{ ...muted, fontSize: 21 }}>
            {signal?.message || status || "This room organizes the work needed to move a signal toward a real opportunity."}
          </p>

          <div style={{ margin: "18px 0" }}>
            {signal?.alert_type && <span style={chip}>{typeLabel(signal.alert_type)}</span>}
            {signal?.score !== undefined && <span style={chip}>Score {signal.score}</span>}
            {signal?.state && <span style={chip}>{signal.state}</span>}
            {signal?.market && <span style={chip}>{signal.market}</span>}
            {item?.source_table && <span style={chip}>{item.source_table}</span>}
          </div>

          <div className="vf-routing-actions">
            <Link href="/alerts" style={ghost}>Alerts</Link>
            <Link href={`/signals/${encodeURIComponent(signalId)}`} style={btn}>Signal Detail</Link>
            {dealRoomHref(signal) && <Link href={dealRoomHref(signal)} style={btn}>Exact Deal Room</Link>}
            <Link href="/intelligence" style={ghost}>Intelligence Map</Link>
            {owner && <Link href="/admin-intelligence" style={ghost}>Owner Control</Link>}
            <button type="button" onClick={load} style={ghost}>Refresh Room</button>
            <Link href="/logout" style={danger}>Logout</Link>
          </div>
        </section>

        {!signal && (
          <section style={hero}>
            <strong>{status}</strong>
            <p style={muted}>
              Generated signals are live and may change. Store a signal first if you need it to stay permanently available.
            </p>
          </section>
        )}

        {signal && (
          <>
            <section style={grid}>
              <RoutingPanel
                title="Buyer Route"
                status={buyerStatus}
                text="Connect to buyer profiles when the signal indicates buyer demand, buyer needed, disposition, or acquisition fit."
              />

              <RoutingPanel
                title="Capital Route"
                status={capitalStatus}
                text="Connect to lenders/private money/JV capital when the signal shows funding gap, lender needed, or capital demand."
              />

              <RoutingPanel
                title="Operator Route"
                status={operatorStatus}
                text="Connect to contractors, operators, project managers, or JV execution partners when operations are the bottleneck."
              />

              <RoutingPanel
                title="Distress / Pain Route"
                status={distressStatus}
                text="Escalate stalled projects, seller pain, contractor issues, permit delays, or urgent distress signals."
              />
            </section>

            {owner && (
              <section style={{ ...hero, marginTop: 22 }}>
                <div style={greenEyebrow}>Owner Routing Actions</div>
                <h2 style={{ fontSize: 42, lineHeight: 1, margin: "0 0 14px" }}>
                  Log routing decisions without auto-dispatch.
                </h2>
                <p style={{ ...muted, fontSize: 19 }}>
                  These actions create a safe audit trail. They do not notify members, change records,
                  or auto-route private details yet.
                </p>

                <textarea
                  value={actionNote}
                  onChange={(event) => setActionNote(event.target.value)}
                  placeholder="Optional admin note: why this signal should route, who should review it, or what needs to happen next..."
                  style={{
                    width: "100%",
                    minHeight: 130,
                    borderRadius: 20,
                    border: "1px solid rgba(255,255,255,.18)",
                    background: "rgba(255,255,255,.075)",
                    color: "white",
                    padding: 16,
                    fontSize: 16,
                    boxSizing: "border-box",
                    marginBottom: 14,
                  }}
                />

                <div className="vf-routing-actions">
                  <button type="button" style={btn} disabled={!!actionBusy} onClick={() => handleRoutingAction("route_to_buyer", "Buyer")}>
                    {actionBusy === "route_to_buyer" ? "Logging..." : "Route to Buyer"}
                  </button>
                  <button type="button" style={btn} disabled={!!actionBusy} onClick={() => handleRoutingAction("route_to_lender", "Lender")}>
                    {actionBusy === "route_to_lender" ? "Logging..." : "Route to Lender"}
                  </button>
                  <button type="button" style={btn} disabled={!!actionBusy} onClick={() => handleRoutingAction("route_to_operator", "Operator")}>
                    {actionBusy === "route_to_operator" ? "Logging..." : "Route to Operator"}
                  </button>
                  <button type="button" style={ghost} disabled={!!actionBusy} onClick={() => handleRoutingAction("route_to_contractor", "Contractor")}>
                    {actionBusy === "route_to_contractor" ? "Logging..." : "Route to Contractor"}
                  </button>
                  <button type="button" style={ghost} disabled={!!actionBusy} onClick={() => handleRoutingAction("needs_review", "Admin")}>
                    {actionBusy === "needs_review" ? "Logging..." : "Needs Review"}
                  </button>
                  <button type="button" style={ghost} disabled={!!actionBusy} onClick={() => handleRoutingAction("watch", "Watch")}>
                    {actionBusy === "watch" ? "Logging..." : "Watch"}
                  </button>
                </div>

                {actionMessage && (
                  <p
                    style={{
                      color:
                        actionMessage.toLowerCase().includes("could not") ||
                        actionMessage.toLowerCase().includes("required")
                          ? "#ffd0d0"
                          : "#9df3bf",
                      fontWeight: 900,
                    }}
                  >
                    {actionMessage}
                  </p>
                )}
              </section>
            )}

            <section style={{ ...hero, marginTop: 22 }}>
              <div style={greenEyebrow}>Routing Action History</div>
              <h2 style={{ fontSize: 42, lineHeight: 1, margin: "0 0 14px" }}>
                Logged decisions.
              </h2>

              {actions.length === 0 ? (
                <p style={{ ...muted, fontSize: 19 }}>
                  No routing actions have been logged for this signal yet.
                </p>
              ) : (
                <section style={grid}>
                  {actions.map((action, index) => (
                    <div key={action.id || `${action.action}-${index}`} style={card}>
                      <div style={greenEyebrow}>{actionLabel(action.action || "manual_note")}</div>
                      <h3 style={{ fontSize: 28, margin: "0 0 10px" }}>
                        {action.title || "Routing action"}
                      </h3>
                      <p style={muted}>
                        {action.note || "No note recorded."}
                      </p>
                      <div>
                        {action.target_role && <span style={chip}>{action.target_role}</span>}
                        {action.status && <span style={chip}>{action.status}</span>}
                        {action.priority && <span style={chip}>{action.priority}</span>}
                        {action.created_at && <span style={chip}>{action.created_at}</span>}
                      </div>
                    </div>
                  ))}
                </section>
              )}
            </section>

            {item && (
              <section style={{ ...hero, marginTop: 22 }}>
                <div style={greenEyebrow}>Related Work Object</div>
                <h2 style={{ fontSize: 42, lineHeight: 1, margin: "0 0 14px" }}>
                  {item.title || signal.item_title || "Related item"}
                </h2>

                {item.main_photo_url && (
                  <img
                    src={item.main_photo_url}
                    alt={item.title || "Related work item"}
                    style={{
                      width: "100%",
                      maxHeight: 360,
                      objectFit: "cover",
                      borderRadius: 24,
                      border: "1px solid rgba(255,255,255,.16)",
                      marginBottom: 18,
                    }}
                  />
                )}

                <p style={{ ...muted, fontSize: 19 }}>
                  {item.description || "This room has a related deal/project/pain object attached."}
                </p>

                <div style={{ margin: "16px 0" }}>
                  {item.state && <span style={chip}>{item.state}</span>}
                  {item.city && <span style={chip}>{item.city}</span>}
                  {item.property_type && <span style={chip}>{item.property_type}</span>}
                  {item.strategy && <span style={chip}>{item.strategy}</span>}
                  {item.asking_price_display && <span style={chip}>{item.asking_price_display}</span>}
                  {item.arv_display && <span style={chip}>ARV {item.arv_display}</span>}
                </div>

                {owner && (
                  <div style={card}>
                    <div style={greenEyebrow}>Owner Private View</div>
                    <p style={muted}>
                      Address: {item.exact_address || "—"}
                      <br />
                      Contact: {item.contact_email || "—"} {item.contact_phone ? `· ${item.contact_phone}` : ""}
                      <br />
                      Private Notes: {item.private_notes || "—"}
                    </p>
                  </div>
                )}
              </section>
            )}

            <section style={{ ...hero, marginTop: 22 }}>
              <div style={greenEyebrow}>Current Safety Mode</div>
              <h2 style={{ fontSize: 42, lineHeight: 1, margin: "0 0 14px" }}>
                Routing room is read-only right now.
              </h2>
              <p style={{ ...muted, fontSize: 19 }}>
                Next phase can add comments, route status, participant assignments, lender/buyer/operator introductions,
                and notification history. No automatic dispatch happens yet.
              </p>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
