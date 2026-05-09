"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type Access = {
  email?: string;
  owner?: boolean;
  profile_complete?: boolean;
  payment_status?: string;
  access_status?: string;
  paid?: boolean;
  unlocked?: boolean;
  next_step?: string;
};

type FeedAlert = {
  id: string;
  source: string;
  alert_type: string;
  priority: string;
  score: number;
  title: string;
  message: string;
  member_email?: string;
  member_name?: string;
  item_id?: string;
  item_title?: string;
  state?: string;
  market?: string;
  source_table?: string;
  safe_href?: string;
  created_at?: string;
};

type MarketWindow = {
  state: string;
  total_signals: number;
  pain_signals: number;
  capital_needed: number;
  buyer_needed: number;
  operator_needed: number;
  status: string;
};

type Feed = {
  ok?: boolean;
  mode?: string;
  owner?: boolean;
  alerts?: FeedAlert[];
  counts?: {
    profiles?: number;
    target_profiles?: number;
    deals?: number;
    pain?: number;
    generated_alerts?: number;
  };
  market_windows?: MarketWindow[];
  note?: string;
  error?: string;
};

type StoredFeed = {
  ok?: boolean;
  owner?: boolean;
  email?: string;
  table?: string;
  alerts?: FeedAlert[];
  counts?: {
    stored_alerts?: number;
    urgent?: number;
    high?: number;
    medium?: number;
  };
  note?: string;
  error?: string;
};

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

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
  gap: 18,
};

const statGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
  gap: 14,
  marginBottom: 22,
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.13)",
  background:
    "linear-gradient(145deg, rgba(181,92,255,.10), rgba(232,196,107,.055), rgba(255,255,255,.03))",
  borderRadius: 28,
  padding: 22,
  boxShadow: "0 26px 80px rgba(0,0,0,.34)",
};

const terminal: React.CSSProperties = {
  ...card,
  background:
    "linear-gradient(145deg, rgba(0,0,0,.38), rgba(255,255,255,.045))",
  border: "1px solid rgba(157,243,191,.24)",
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

const select: React.CSSProperties = {
  width: "100%",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.075)",
  color: "white",
  padding: 14,
  fontSize: 16,
  boxSizing: "border-box",
};

function cleanEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
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

function priorityRank(priority: string) {
  const p = String(priority || "").toLowerCase();
  if (p === "urgent") return 4;
  if (p === "high") return 3;
  if (p === "medium") return 2;
  return 1;
}

function typeLabel(type: string) {
  const t = String(type || "opportunity").replace(/_/g, " ");
  return t.slice(0, 1).toUpperCase() + t.slice(1);
}

function dealRoomHref(alert: FeedAlert) {
  const itemId = String(alert.item_id || "").trim();
  if (!itemId) return "";
  return `/deal-room/${encodeURIComponent(itemId)}`;
}

function routingRoomHref(alert: FeedAlert) {
  const signalId = String(alert.id || "").trim();
  if (!signalId) return "";
  return `/routing-room/${encodeURIComponent(signalId)}`;
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: number | string;
  detail: string;
}) {
  return (
    <div style={card}>
      <div style={greenEyebrow}>{label}</div>
      <div style={{ fontSize: 46, fontWeight: 950, lineHeight: 1 }}>{value}</div>
      <p style={{ ...muted, marginBottom: 0 }}>{detail}</p>
    </div>
  );
}

function AlertCard({
  alert,
  owner,
  email,
  storingId,
  onStore,
}: {
  alert: FeedAlert;
  owner: boolean;
  email: string;
  storingId: string;
  onStore: (alert: FeedAlert) => void;
}) {
  const tone = priorityTone(alert.priority);

  return (
    <article style={{ ...terminal, borderColor: `${tone}66` }}>
      <div style={{ ...greenEyebrow, color: tone }}>
        {alert.priority || "signal"} · {typeLabel(alert.alert_type)} · score {alert.score || 0}
      </div>

      <h2 style={{ fontSize: 32, lineHeight: 1.05, margin: "0 0 10px" }}>
        {alert.title || "Intelligence Signal"}
      </h2>

      <p style={{ ...muted, fontSize: 17 }}>{alert.message}</p>

      <div style={{ margin: "14px 0" }}>
        {alert.state && <span style={chip}>{alert.state}</span>}
        {alert.market && <span style={chip}>{alert.market}</span>}
        {alert.source && <span style={chip}>{alert.source}</span>}
        {alert.source_table && <span style={chip}>{alert.source_table}</span>}
        {owner && alert.member_name && <span style={chip}>{alert.member_name}</span>}
        {owner && alert.member_email && <span style={chip}>{alert.member_email}</span>}
      </div>

      <Link href={alert.safe_href || "/projects"} style={btn}>
        Open Work Area
      </Link>

      {owner && (
        <button
          type="button"
          style={ghost}
          disabled={storingId === alert.id}
          onClick={() => onStore(alert)}
        >
          {storingId === alert.id ? "Storing..." : "Store Approved Signal"}
        </button>
      )}
    </article>
  );
}

function LockedScreen({ reason }: { reason: "login" | "profile" | "payment" | "loading" }) {
  return (
    <main style={page}>
      <div style={wrap}>
        <section style={hero}>
          <div style={greenEyebrow}>VaultForge Smart Alerts</div>

          <h1 style={{ fontSize: "clamp(54px,12vw,100px)", lineHeight: 0.88, margin: "0 0 18px" }}>
            {reason === "loading"
              ? "Checking alert access..."
              : reason === "login"
              ? "Login required."
              : reason === "profile"
              ? "Complete your profile first."
              : "Activate access first."}
          </h1>

          <p style={{ ...muted, fontSize: 21 }}>
            Smart Alerts use your profile, buy box, role, deals, and pain signals to surface relevant opportunities.
          </p>

          {reason === "login" && <Link href="/login" style={btn}>Login / Create Access</Link>}
          {reason === "profile" && <Link href="/profile" style={btn}>Complete Profile</Link>}
          {reason === "payment" && <Link href="/payment" style={btn}>Activate Access</Link>}
          <Link href="/dashboard" style={ghost}>Dashboard</Link>
        </section>
      </div>
    </main>
  );
}


async function storeSignal(alert: FeedAlert, email: string) {
  const res = await fetch("/api/intelligence/store", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-vf-email": email,
      "x-vf-admin": "1",
    },
    body: JSON.stringify({
      email,
      owner: "1",
      admin_email: email,
      alert,
    }),
  });

  const data = await safeJson(res);

  if (!res.ok || data?.ok === false) {
    throw new Error(data?.error || data?.details || "Could not store signal.");
  }

  return data;
}

export default function AlertsPage() {
  const [email, setEmail] = useState("");
  const [access, setAccess] = useState<Access | null>(null);
  const [lockReason, setLockReason] = useState<"loading" | "login" | "profile" | "payment" | "open">("loading");
  const [feed, setFeed] = useState<Feed>({});
  const [storedFeed, setStoredFeed] = useState<StoredFeed>({});
  const [status, setStatus] = useState("Loading smart alerts...");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [storingId, setStoringId] = useState("");
  const [storeMessage, setStoreMessage] = useState("");

  async function load() {
    setStatus("Loading smart alerts...");

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

      const [feedRes, storedRes] = await Promise.all([
        fetch(`/api/intelligence/feed?email=${encodeURIComponent(currentEmail)}&owner=${owner ? "1" : "0"}`, {
          cache: "no-store",
          headers: {
            "x-vf-email": currentEmail,
            "x-vf-admin": owner ? "1" : "0",
          },
        }),
        fetch(`/api/intelligence/stored?email=${encodeURIComponent(currentEmail)}&owner=${owner ? "1" : "0"}`, {
          cache: "no-store",
          headers: {
            "x-vf-email": currentEmail,
            "x-vf-admin": owner ? "1" : "0",
          },
        }),
      ]);

      const feedData = await safeJson(feedRes);
      const storedData = await safeJson(storedRes);
      setFeed(feedData || {});
      setStoredFeed(storedData || {});
      setLockReason("open");
      setStatus("");
    } catch (error: any) {
      setLockReason("login");
      setStatus(error?.message || "");
    }
  }

  async function handleStore(alert: FeedAlert) {
    if (!owner) {
      setStoreMessage("Only owner/admin can store approved signals.");
      return;
    }

    setStoringId(alert.id);
    setStoreMessage("Storing approved signal...");

    try {
      const result = await storeSignal(alert, email);
      setStoreMessage(result?.message || "Signal stored safely.");

      const storedRes = await fetch(`/api/intelligence/stored?email=${encodeURIComponent(email)}&owner=1`, {
        cache: "no-store",
        headers: {
          "x-vf-email": email,
          "x-vf-admin": "1",
        },
      });
      const storedData = await safeJson(storedRes);
      setStoredFeed(storedData || {});
    } catch (error: any) {
      setStoreMessage(error?.message || "Could not store signal.");
    } finally {
      setStoringId("");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const owner = useMemo(() => isOwner(email, access), [email, access]);

  const alerts = useMemo(() => {
    const list = feed.alerts || [];

    return list
      .filter((alert) => {
        if (priorityFilter !== "all" && String(alert.priority || "").toLowerCase() !== priorityFilter) {
          return false;
        }

        if (typeFilter !== "all" && String(alert.alert_type || "").toLowerCase() !== typeFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority) || Number(b.score || 0) - Number(a.score || 0));
  }, [feed.alerts, priorityFilter, typeFilter]);

  const allTypes = useMemo(() => {
    const types = new Set<string>();
    for (const alert of feed.alerts || []) {
      if (alert.alert_type) types.add(String(alert.alert_type).toLowerCase());
    }
    return Array.from(types).sort();
  }, [feed.alerts]);

  const counts = useMemo(() => {
    const all = feed.alerts || [];

    return {
      total: all.length,
      urgent: all.filter((a) => String(a.priority).toLowerCase() === "urgent").length,
      high: all.filter((a) => String(a.priority).toLowerCase() === "high").length,
      medium: all.filter((a) => String(a.priority).toLowerCase() === "medium").length,
      capital: all.filter((a) => String(a.alert_type).toLowerCase() === "capital_needed").length,
      buyer: all.filter((a) => String(a.alert_type).toLowerCase() === "buyer_match").length,
      operator: all.filter((a) => String(a.alert_type).toLowerCase() === "operator_needed").length,
      distress: all.filter((a) => String(a.alert_type).toLowerCase() === "distress_signal").length,
    };
  }, [feed.alerts]);

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
          .vf-alert-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .vf-alert-actions > * {
            width: 100%;
            margin: 0 !important;
            box-sizing:border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <section style={hero}>
          <div style={greenEyebrow}>VaultForge Smart Alerts · {owner ? "Owner Global Feed" : "Member Feed"}</div>

          <h1 style={{ fontSize: "clamp(58px,12vw,108px)", lineHeight: 0.86, margin: "0 0 18px" }}>
            Live intelligence alerts.
          </h1>

          <p style={{ ...muted, fontSize: 22 }}>
            These signals are generated from existing profiles, deals, projects, property cards, and pain submissions.
            The engine is read-only right now so it can prove the routing logic before storing or sending alerts.
          </p>

          <div className="vf-alert-actions" style={{ marginTop: 18 }}>
            <button type="button" onClick={load} style={btn}>Refresh Alerts</button>
            <Link href="/intelligence" style={ghost}>Intelligence Map</Link>
            <Link href="/activity" style={ghost}>Activity Stream</Link>
            <Link href="/member-intelligence" style={ghost}>Member Intelligence</Link>
            <Link href="/routing-inbox" style={ghost}>Routing Inbox</Link>
            <Link href="/introductions" style={ghost}>Introductions</Link>
            {owner && <Link href="/admin-intelligence" style={btn}>Owner Control</Link>}
            {owner && <Link href="/admin-routing" style={ghost}>Admin Routing</Link>}
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
            <Link href="/submit" style={ghost}>Create Deal</Link>
            <Link href="/pain-submit" style={ghost}>Pain Button</Link>
            <Link href="/projects" style={ghost}>Deal Rooms</Link>
            <Link href="/network" style={ghost}>Network</Link>
            <Link href="/logout" style={danger}>Logout</Link>
          </div>

          {status && <p style={{ ...muted, marginTop: 16 }}>{status}</p>}
          {feed.error && <p style={{ color: "#ffd0d0", fontWeight: 900 }}>{feed.error}</p>}
          {storeMessage && <p style={{ color: storeMessage.toLowerCase().includes("could not") || storeMessage.toLowerCase().includes("only") ? "#ffd0d0" : "#9df3bf", fontWeight: 900 }}>{storeMessage}</p>}
        </section>

        <section style={statGrid}>
          <StatCard label="Generated Signals" value={counts.total} detail="Live read-only matches." />
          <StatCard label="Stored Approved" value={storedFeed.counts?.stored_alerts || 0} detail="Saved into vf_match_alerts." />
          <StatCard label="Urgent" value={counts.urgent} detail="Highest priority review." />
          <StatCard label="High" value={counts.high} detail="Strong opportunity signals." />
          <StatCard label="Capital Needed" value={counts.capital} detail="Potential lender/private money fit." />
          <StatCard label="Buyer Match" value={counts.buyer} detail="Potential buyer-demand fit." />
          <StatCard label="Operator Needed" value={counts.operator} detail="Contractor/operator/JV need." />
          <StatCard label="Distress" value={counts.distress} detail="Pain and friction signals." />
          <StatCard label="Profiles Scanned" value={feed.counts?.target_profiles || 0} detail={owner ? "Global owner scan." : "Your profile."} />
        </section>

        <section style={hero}>
          <div style={greenEyebrow}>Filters</div>
          <div style={grid}>
            <div>
              <label style={{ display: "block", fontWeight: 900, marginBottom: 8 }}>Priority</label>
              <select style={select} value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
                <option value="all" style={{ color: "#111" }}>All Priorities</option>
                <option value="urgent" style={{ color: "#111" }}>Urgent</option>
                <option value="high" style={{ color: "#111" }}>High</option>
                <option value="medium" style={{ color: "#111" }}>Medium</option>
                <option value="low" style={{ color: "#111" }}>Low</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontWeight: 900, marginBottom: 8 }}>Signal Type</label>
              <select style={select} value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                <option value="all" style={{ color: "#111" }}>All Types</option>
                {allTypes.map((type) => (
                  <option key={type} value={type} style={{ color: "#111" }}>
                    {typeLabel(type)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {alerts.length === 0 ? (
          <section style={hero}>
            <strong>No matching alert signals yet.</strong>
            <p style={muted}>
              Complete profile chips, submit routed deals, or submit Pain Button records. The feed will populate once
              there is enough overlap between member profiles and opportunities.
            </p>
          </section>
        ) : (
          <section style={grid}>
            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                owner={owner}
                email={email}
                storingId={storingId}
                onStore={handleStore}
              />
            ))}
          </section>
        )}

        <section style={{ ...hero, marginTop: 22 }}>
          <div style={greenEyebrow}>Stored Approved Signals</div>
          <h2 style={{ fontSize: 42, lineHeight: 1, margin: "0 0 14px" }}>
            Signals saved into the intelligence table.
          </h2>
          <p style={{ ...muted, fontSize: 19 }}>
            These are approved signals already saved in <strong>vf_match_alerts</strong>. Owner sees global stored signals.
            Members only see stored signals tied to their email.
          </p>
          {storedFeed.error && <p style={{ color: "#ffd0d0", fontWeight: 900 }}>{storedFeed.error}</p>}
        </section>

        {(storedFeed.alerts || []).length === 0 ? (
          <section style={hero}>
            <strong>No stored approved signals yet.</strong>
            <p style={muted}>
              Owner/admin can use “Store Approved Signal” on generated alerts to save them.
            </p>
          </section>
        ) : (
          <section style={grid}>
            {(storedFeed.alerts || []).slice(0, 12).map((alert) => (
              <AlertCard
                key={`stored-${alert.id}`}
                alert={alert}
                owner={owner}
                email={email}
                storingId={storingId}
                onStore={handleStore}
              />
            ))}
          </section>
        )}

        <section style={{ ...hero, marginTop: 22 }}>
          <div style={greenEyebrow}>Current Safety Mode</div>
          <p style={{ ...muted, fontSize: 19 }}>
            This is read-only generation. It does not store alerts, notify members, change access, or auto-route private details.
            Next phase can store approved signals after the read-only layer proves accurate. Routed items now flow toward the Routing Inbox once owner/admin logs routing decisions.
          </p>
        </section>
      </div>
    </main>
  );
}
