"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

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
  created_at?: string;
  status?: string;
  review_status?: string;
  stored_by?: string;
  raw?: Record<string, any>;
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

function normalizeStoredToSignal(value: any): Signal {
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
    created_at: clean(value.created_at),
    status: clean(value.status),
    review_status: clean(value.review_status),
    stored_by: clean(value.stored_by),
    raw: value.raw || value,
  };
}

function detailHref(signal: Signal) {
  if (signal.safe_href && signal.safe_href !== "/projects") return signal.safe_href;

  const itemId = clean(signal.item_id || signal.deal_id);
  if (itemId) return `/projects?focus=${encodeURIComponent(itemId)}`;

  return "/projects";
}

function InfoBox({ label, value }: { label: string; value: string | number | undefined }) {
  return (
    <div style={card}>
      <div style={greenEyebrow}>{label}</div>
      <p style={{ ...muted, fontSize: 18, margin: 0 }}>{value || "—"}</p>
    </div>
  );
}

function LockedScreen({ reason }: { reason: "login" | "profile" | "payment" | "loading" }) {
  return (
    <main style={page}>
      <div style={wrap}>
        <section style={hero}>
          <div style={greenEyebrow}>VaultForge Signal Detail</div>
          <h1 style={{ fontSize: "clamp(54px,12vw,100px)", lineHeight: 0.88, margin: "0 0 18px" }}>
            {reason === "loading"
              ? "Checking signal access..."
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

export default function SignalDetailPage() {
  const params = useParams();
  const signalId = decodeURIComponent(String(params?.signalId || ""));

  const [email, setEmail] = useState("");
  const [access, setAccess] = useState<Access | null>(null);
  const [lockReason, setLockReason] = useState<"loading" | "login" | "profile" | "payment" | "open">("loading");
  const [signal, setSignal] = useState<Signal | null>(null);
  const [source, setSource] = useState("");
  const [status, setStatus] = useState("Loading signal...");

  async function load() {
    setStatus("Loading signal...");

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

      const stored = Array.isArray(storedData?.alerts)
        ? storedData.alerts.map(normalizeStoredToSignal)
        : [];

      const generated = Array.isArray(feedData?.alerts)
        ? feedData.alerts.map(normalizeStoredToSignal)
        : [];

      const foundStored = stored.find((item) => item.id === signalId);
      const foundGenerated = generated.find((item) => item.id === signalId);

      const found = foundStored || foundGenerated || null;

      setSignal(found);
      setSource(foundStored ? "stored approved signal" : foundGenerated ? "live generated signal" : "not found");
      setLockReason("open");
      setStatus(found ? "" : "Signal not found in current stored or generated feed.");
    } catch (error: any) {
      setLockReason("open");
      setStatus(error?.message || "Could not load signal.");
    }
  }

  useEffect(() => {
    load();
  }, [signalId]);

  const owner = useMemo(() => isOwner(email, access), [email, access]);
  const tone = priorityTone(signal?.priority || "medium");

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
          <div style={{ ...greenEyebrow, color: tone }}>
            VaultForge Signal Detail · {source || "signal"} · {owner ? "Owner View" : "Member View"}
          </div>

          <h1 style={{ fontSize: "clamp(52px,10vw,92px)", lineHeight: 0.88, margin: "0 0 18px" }}>
            {signal?.title || "Signal not found."}
          </h1>

          <p style={{ ...muted, fontSize: 21 }}>
            {signal?.message || status || "This signal may have changed or no longer matches your current access/feed."}
          </p>

          <div style={{ margin: "18px 0" }}>
            {signal?.priority && <span style={{ ...chip, color: tone, borderColor: `${tone}88` }}>{signal.priority}</span>}
            {signal?.alert_type && <span style={chip}>{typeLabel(signal.alert_type)}</span>}
            {signal?.score !== undefined && <span style={chip}>Score {signal.score}</span>}
            {signal?.state && <span style={chip}>{signal.state}</span>}
            {signal?.market && <span style={chip}>{signal.market}</span>}
            {signal?.source_table && <span style={chip}>{signal.source_table}</span>}
            {owner && signal?.member_email && <span style={chip}>{signal.member_email}</span>}
          </div>

          <div className="vf-signal-actions">
            <Link href="/alerts" style={ghost}>Back to Alerts</Link>
            <Link href="/intelligence" style={ghost}>Intelligence Map</Link>
            {owner && <Link href="/admin-intelligence" style={btn}>Owner Control</Link>}
            {signal && <Link href={detailHref(signal)} style={btn}>Open Related Work Area</Link>}
            {signal?.deal_id && <Link href={`/projects?focus=${encodeURIComponent(signal.deal_id)}`} style={ghost}>Open Deal Focus</Link>}
            <button type="button" onClick={load} style={ghost}>Refresh Signal</button>
            <Link href="/logout" style={danger}>Logout</Link>
          </div>
        </section>

        {!signal && (
          <section style={hero}>
            <strong>{status || "Signal not found."}</strong>
            <p style={muted}>
              Generated signals are live and can change as profile/deal data changes. Stored approved signals remain available after they are saved.
            </p>
          </section>
        )}

        {signal && (
          <>
            <section style={grid}>
              <InfoBox label="Signal Source" value={source} />
              <InfoBox label="Priority" value={signal.priority} />
              <InfoBox label="Score" value={signal.score} />
              <InfoBox label="Type" value={typeLabel(signal.alert_type || "opportunity")} />
              <InfoBox label="Market" value={[signal.market, signal.state].filter(Boolean).join(", ")} />
              <InfoBox label="Item Title" value={signal.item_title || signal.deal_title} />
              <InfoBox label="Item ID" value={signal.item_id || signal.deal_id} />
              <InfoBox label="Safe Destination" value={signal.safe_href || "/projects"} />
              {owner && <InfoBox label="Matched Member" value={signal.member_name || signal.member_email} />}
              {owner && <InfoBox label="Stored By" value={signal.stored_by} />}
            </section>

            <section style={{ ...hero, marginTop: 22 }}>
              <div style={greenEyebrow}>Execution Layer</div>
              <h2 style={{ fontSize: 42, lineHeight: 1, margin: "0 0 14px" }}>
                This is the exact signal object.
              </h2>
              <p style={{ ...muted, fontSize: 19 }}>
                Next layers can attach this signal to a deal room, capital room, buyer match room,
                operator-needed room, or pain thread. For now, this page gives VaultForge a stable exact-detail destination.
              </p>
            </section>

            {owner && signal.raw && (
              <section style={{ ...hero, marginTop: 22 }}>
                <div style={greenEyebrow}>Owner Debug</div>
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    color: "rgba(255,255,255,.72)",
                    background: "rgba(0,0,0,.26)",
                    borderRadius: 20,
                    padding: 16,
                    overflow: "auto",
                  }}
                >
                  {JSON.stringify(signal.raw, null, 2)}
                </pre>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
