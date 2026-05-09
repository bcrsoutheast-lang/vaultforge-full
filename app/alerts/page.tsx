
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type SignalCard = Record<string, any>;

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
  gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
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
  const text = clean(value || "signal").replace(/_/g, " ");
  return text.slice(0, 1).toUpperCase() + text.slice(1);
}

function first(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }
  return "";
}

function exactSignalId(item: SignalCard) {
  return first(
    item.signal_id,
    item.signalId,
    item.alert_id,
    item.alertId,
    item.id
  );
}

function exactItemId(item: SignalCard) {
  return first(
    item.item_id,
    item.itemId,
    item.deal_id,
    item.dealId,
    item.project_id,
    item.projectId,
    item.property_id,
    item.propertyId,
    item.pain_id,
    item.painId
  );
}

function exactSignalHref(item: SignalCard) {
  const signalId = exactSignalId(item);
  return signalId ? `/signals/${encodeURIComponent(signalId)}` : "/intelligence";
}

function exactWorkHref(item: SignalCard) {
  const itemId = exactItemId(item);
  if (itemId) return `/deal-room/${encodeURIComponent(itemId)}`;
  return exactSignalHref(item);
}

function exactRoutingHref(item: SignalCard) {
  const signalId = exactSignalId(item);
  return signalId ? `/routing-room/${encodeURIComponent(signalId)}` : "/routing-inbox";
}

function priorityOf(item: SignalCard) {
  return first(item.priority, item.severity, item.alert_priority, item.urgency, "medium").toLowerCase();
}

function priorityTone(item: SignalCard) {
  const priority = priorityOf(item);
  if (priority === "urgent") return "#ffb3b3";
  if (priority === "high") return "#f5d978";
  return "#9df3bf";
}

function titleOf(item: SignalCard) {
  return first(item.title, item.name, item.headline, item.signal_title, item.alert_title, "VaultForge Signal");
}

function messageOf(item: SignalCard) {
  return first(item.message, item.description, item.note, item.summary, item.reason, "Signal context ready for exact routing.");
}

function marketOf(item: SignalCard) {
  return first(item.market, item.state, item.location, [item.city, item.state].filter(Boolean).join(", "));
}

function typeOf(item: SignalCard) {
  return first(item.alert_type, item.type, item.category, item.signal_type, item.source, "signal");
}

function scoreOf(item: SignalCard) {
  const raw = Number(item.score || item.confidence_score || item.match_score || 0);
  if (Number.isFinite(raw) && raw > 0) return Math.max(0, Math.min(100, Math.round(raw)));
  const priority = priorityOf(item);
  if (priority === "urgent") return 84;
  if (priority === "high") return 72;
  return 58;
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

  const map = new Map<string, SignalCard>();

  for (const item of [...stored, ...generated]) {
    const signalId = exactSignalId(item) || `${titleOf(item)}-${messageOf(item)}`;
    map.set(signalId, item);
  }

  return Array.from(map.values());
}

function StatCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div style={card}>
      <div style={{ color: "#9df3bf", letterSpacing: 4, fontWeight: 900, fontSize: 11, marginBottom: 10, textTransform: "uppercase" }}>
        {title}
      </div>
      <div style={{ fontSize: 42, fontWeight: 950, lineHeight: 1 }}>{value}</div>
      <p style={{ color: "rgba(255,255,255,.68)", lineHeight: 1.45, marginBottom: 0 }}>{detail}</p>
    </div>
  );
}

export default function AlertsPage() {
  const [email, setEmail] = useState("");
  const [owner, setOwner] = useState(false);
  const [signals, setSignals] = useState<SignalCard[]>([]);
  const [status, setStatus] = useState("Loading smart alerts...");
  const [search, setSearch] = useState("");
  const [generateStatus, setGenerateStatus] = useState("");
  const [generatingId, setGeneratingId] = useState("");

  async function load() {
    setStatus("Loading smart alerts...");

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
      setSignals(rows);
      setStatus(rows.length ? "" : "No alerts available yet.");
    } catch (error: any) {
      setStatus(error?.message || "Could not load alerts.");
    }
  }

  async function generateRoutingFromCard(item: SignalCard) {
    if (!owner) {
      setGenerateStatus("Owner/admin access required to generate routing actions.");
      return;
    }

    const signalId = exactSignalId(item);
    const itemId = exactItemId(item);
    const activeId = signalId || itemId || titleOf(item);

    setGeneratingId(activeId);
    setGenerateStatus("Generating routing action from exact card...");

    try {
      const res = await fetch("/api/routing/generate", {
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
          title: titleOf(item),
          note: messageOf(item),
          state: item?.state || item?.market || item?.location || "",
          market: item?.market || item?.state || item?.location || "",
          city: item?.city || "",
          strategy: item?.strategy || item?.asset_strategy || item?.exit_strategy || "",
          asset_type: item?.property_type || item?.asset_type || item?.item_kind || "",
          role_needed: item?.role_needed || item?.target_role || item?.deal_need || "",
          priority: priorityOf(item),
          source: "exact_card_generate",
          source_table: item?.source_table || "",
          item_kind: item?.item_kind || typeOf(item),
        }),
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Could not generate routing action.");
      }

      setGenerateStatus(data?.message || "Routing action generated from exact card.");
    } catch (error: any) {
      setGenerateStatus(error?.message || "Could not generate routing action.");
    } finally {
      setGeneratingId("");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return signals
      .filter((item) => {
        if (!q) return true;
        return [
          titleOf(item),
          messageOf(item),
          marketOf(item),
          typeOf(item),
          priorityOf(item),
          exactSignalId(item),
          exactItemId(item),
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => scoreOf(b) - scoreOf(a));
  }, [signals, search]);

  const urgent = signals.filter((item) => priorityOf(item) === "urgent").length;
  const high = signals.filter((item) => priorityOf(item) === "high").length;
  const withWork = signals.filter((item) => exactItemId(item)).length;

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
        <section style={hero}>
          <div style={{ color: "#9df3bf", letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 12, textTransform: "uppercase" }}>
            VaultForge Smart Alerts
          </div>

          <h1 style={{ fontSize: "clamp(56px,11vw,104px)", lineHeight: 0.86, margin: "0 0 18px" }}>
            Exact alerts.
          </h1>

          <p style={{ ...muted, fontSize: 22 }}>
            Alerts now open the exact signal, exact routing room, or exact deal/work area tied to the clicked card.
          </p>

          <div>
            <span style={chip}>Alerts: {signals.length}</span>
            <span style={chip}>Urgent: {urgent}</span>
            <span style={chip}>High: {high}</span>
            <span style={chip}>With Work Area: {withWork}</span>
            <span style={chip}>{owner ? "Owner View" : "Member View"}</span>
          </div>

          <div className="vf-actions" style={{ marginTop: 14 }}>
            <button type="button" style={btn} onClick={load}>Refresh Alerts</button>
            <Link href="/intelligence" style={ghost}>Intelligence</Link>
            <Link href="/activity" style={ghost}>Activity</Link>
            <Link href="/routing-inbox" style={ghost}>Routing Inbox</Link>
            <Link href="/introductions" style={ghost}>Introductions</Link>
            <Link href="/member-intelligence" style={ghost}>Member Intelligence</Link>
            {owner && <Link href="/admin-intelligence" style={ghost}>Owner Intelligence</Link>}
            <Link href="/logout" style={danger}>Logout</Link>
          </div>

          {status && (
            <p style={{ color: status.toLowerCase().includes("could not") || status.toLowerCase().includes("not found") ? "#ffd0d0" : "#9df3bf", fontWeight: 900 }}>
              {status}
            </p>
          )}

          {generateStatus && (
            <p style={{ color: generateStatus.toLowerCase().includes("could not") || generateStatus.toLowerCase().includes("required") ? "#ffd0d0" : "#9df3bf", fontWeight: 900 }}>
              {generateStatus}
            </p>
          )}
        </section>

        <section style={statGrid}>
          <StatCard title="Alerts" value={signals.length} detail="Total exact-routable alert/signal cards." />
          <StatCard title="Urgent" value={urgent} detail="Urgent pressure signals." />
          <StatCard title="High" value={high} detail="High-priority signals." />
          <StatCard title="Exact Work" value={withWork} detail="Cards with direct item/deal IDs." />
        </section>

        <section style={hero}>
          <div style={{ color: "#9df3bf", letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 12, textTransform: "uppercase" }}>
            Search
          </div>
          <input
            style={input}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search alert title, market, priority, ID..."
          />
        </section>

        {filtered.length === 0 ? (
          <section style={hero}>
            <strong>No alert cards match this view.</strong>
          </section>
        ) : (
          <section style={grid}>
            {filtered.map((item, index) => {
              const tone = priorityTone(item);
              const signalId = exactSignalId(item);
              const itemId = exactItemId(item);

              return (
                <article key={signalId || itemId || index} style={{ ...card, borderColor: `${tone}66` }}>
                  <div style={{ color: tone, letterSpacing: 4, fontWeight: 900, fontSize: 11, marginBottom: 10, textTransform: "uppercase" }}>
                    {label(priorityOf(item))} · {label(typeOf(item))}
                  </div>

                  <h2 style={{ fontSize: 30, lineHeight: 1.05, margin: "0 0 10px" }}>
                    {titleOf(item)}
                  </h2>

                  <p style={{ ...muted, fontSize: 18 }}>
                    {messageOf(item)}
                  </p>

                  <div style={{ margin: "12px 0" }}>
                    <span style={chip}>Score: {scoreOf(item)}</span>
                    {marketOf(item) && <span style={chip}>{marketOf(item)}</span>}
                    {signalId && <span style={chip}>Signal: {signalId}</span>}
                    {itemId && <span style={chip}>Item: {itemId}</span>}
                  </div>

                  <div className="vf-actions">
                    <Link href={exactSignalHref(item)} style={btn}>Open Exact Signal</Link>
                    <Link href={exactRoutingHref(item)} style={ghost}>Routing Room</Link>
                    {owner && (
                      <button
                        type="button"
                        style={ghost}
                        disabled={generatingId === (signalId || itemId || titleOf(item))}
                        onClick={() => generateRoutingFromCard(item)}
                      >
                        {generatingId === (signalId || itemId || titleOf(item)) ? "Generating..." : "Generate Routing"}
                      </button>
                    )}
                    <Link href={exactWorkHref(item)} style={ghost}>Open Exact Work Area</Link>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <section style={{ ...hero, marginTop: 22 }}>
          <div style={{ color: "#9df3bf", letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 12, textTransform: "uppercase" }}>
            Current Safety Mode
          </div>
          <p style={{ ...muted, fontSize: 19 }}>
            This page only fixes exact navigation. It does not auto-route, notify, create introductions, or mutate records.
          </p>
        </section>
      </div>
    </main>
  );
}
