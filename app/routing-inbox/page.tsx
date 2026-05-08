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

const statGrid: React.CSSProperties = {
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

function actionLabel(action: string) {
  const text = String(action || "routing_action").replace(/_/g, " ");
  return text.slice(0, 1).toUpperCase() + text.slice(1);
}

function StatCard({ label, value, detail }: { label: string; value: number | string; detail: string }) {
  return (
    <div style={card}>
      <div style={greenEyebrow}>{label}</div>
      <div style={{ fontSize: 46, fontWeight: 950, lineHeight: 1 }}>{value}</div>
      <p style={{ ...muted, marginBottom: 0 }}>{detail}</p>
    </div>
  );
}

function LockedScreen({ reason }: { reason: "login" | "profile" | "payment" | "loading" }) {
  return (
    <main style={page}>
      <div style={wrap}>
        <section style={hero}>
          <div style={greenEyebrow}>VaultForge Routing Inbox</div>
          <h1 style={{ fontSize: "clamp(54px,12vw,100px)", lineHeight: 0.88, margin: "0 0 18px" }}>
            {reason === "loading"
              ? "Checking routing inbox..."
              : reason === "login"
              ? "Login required."
              : reason === "profile"
              ? "Complete your profile first."
              : "Activate access first."}
          </h1>
          {reason === "login" && <Link href="/login" style={btn}>Login / Create Access</Link>}
          {reason === "profile" && <Link href="/profile" style={btn}>Complete Profile</Link>}
          {reason === "payment" && <Link href="/payment" style={btn}>Activate Access</Link>}
          <Link href="/dashboard" style={ghost}>Dashboard</Link>
        </section>
      </div>
    </main>
  );
}

export default function RoutingInboxPage() {
  const [email, setEmail] = useState("");
  const [access, setAccess] = useState<Access | null>(null);
  const [lockReason, setLockReason] = useState<"loading" | "login" | "profile" | "payment" | "open">("loading");
  const [actions, setActions] = useState<RoutingAction[]>([]);
  const [status, setStatus] = useState("Loading routing inbox...");

  async function load() {
    setStatus("Loading routing inbox...");

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

      const res = await fetch(`/api/routing/actions?email=${encodeURIComponent(currentEmail)}&owner=${owner ? "1" : "0"}`, {
        cache: "no-store",
        headers: {
          "x-vf-email": currentEmail,
          "x-vf-admin": owner ? "1" : "0",
        },
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Could not load routing inbox.");
      }

      setActions(Array.isArray(data?.actions) ? data.actions : []);
      setLockReason("open");
      setStatus("");
    } catch (error: any) {
      setLockReason("open");
      setStatus(error?.message || "Could not load routing inbox.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const owner = useMemo(() => isOwner(email, access), [email, access]);

  const counts = useMemo(() => {
    return {
      total: actions.length,
      buyer: actions.filter((a) => a.action === "route_to_buyer").length,
      lender: actions.filter((a) => a.action === "route_to_lender").length,
      operator: actions.filter((a) => a.action === "route_to_operator").length,
      review: actions.filter((a) => a.action === "needs_review").length,
      watch: actions.filter((a) => a.action === "watch").length,
    };
  }, [actions]);

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
          .vf-routing-inbox-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .vf-routing-inbox-actions > * {
            width: 100%;
            margin: 0 !important;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <section style={hero}>
          <div style={greenEyebrow}>VaultForge Routing Inbox · {owner ? "Owner Global View" : "Member View"}</div>
          <h1 style={{ fontSize: "clamp(58px,12vw,108px)", lineHeight: 0.86, margin: "0 0 18px" }}>
            Routed opportunities.
          </h1>
          <p style={{ ...muted, fontSize: 22 }}>
            This shows routing decisions connected to your member email. Owner sees global routing actions.
            This is read-only and does not dispatch notifications yet.
          </p>

          <div className="vf-routing-inbox-actions">
            <button type="button" style={btn} onClick={load}>Refresh Inbox</button>
            <Link href="/alerts" style={ghost}>Alerts</Link>
            <Link href="/intelligence" style={ghost}>Intelligence Map</Link>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
            {owner && <Link href="/admin-routing" style={btn}>Admin Routing</Link>}
            {owner && <Link href="/admin-intelligence" style={ghost}>Owner Control</Link>}
            <Link href="/logout" style={danger}>Logout</Link>
          </div>

          {status && (
            <p style={{ color: status.toLowerCase().includes("could not") ? "#ffd0d0" : "#9df3bf", fontWeight: 900 }}>
              {status}
            </p>
          )}
        </section>

        <section style={statGrid}>
          <StatCard label="Total Routed" value={counts.total} detail="Routing actions visible to you." />
          <StatCard label="Buyer" value={counts.buyer} detail="Buyer-directed routing." />
          <StatCard label="Lender" value={counts.lender} detail="Capital/private money routing." />
          <StatCard label="Operator" value={counts.operator} detail="Operator/JV/project help." />
          <StatCard label="Needs Review" value={counts.review} detail="Manual review items." />
          <StatCard label="Watch" value={counts.watch} detail="Signals being monitored." />
        </section>

        {actions.length === 0 ? (
          <section style={hero}>
            <strong>No routed opportunities yet.</strong>
            <p style={muted}>
              Once admin routes a signal to a role/email, it appears here for the matching member. Owner sees all routed actions.
            </p>
          </section>
        ) : (
          <section style={grid}>
            {actions.map((action, index) => (
              <article key={action.id || `${action.action}-${index}`} style={card}>
                <div style={greenEyebrow}>{actionLabel(action.action || "routing_action")}</div>
                <h2 style={{ fontSize: 30, lineHeight: 1.05, margin: "0 0 10px" }}>
                  {action.title || "Routing action"}
                </h2>
                <p style={muted}>{action.note || "No note recorded."}</p>

                <div style={{ margin: "12px 0" }}>
                  {action.target_role && <span style={chip}>{action.target_role}</span>}
                  {action.status && <span style={chip}>{action.status}</span>}
                  {action.priority && <span style={chip}>{action.priority}</span>}
                  {action.created_at && <span style={chip}>{action.created_at}</span>}
                </div>

                <div className="vf-routing-inbox-actions">
                  {action.signal_id && (
                    <Link href={`/routing-room/${encodeURIComponent(action.signal_id)}`} style={btn}>
                      Open Routing Room
                    </Link>
                  )}
                  {action.signal_id && (
                    <Link href={`/signals/${encodeURIComponent(action.signal_id)}`} style={ghost}>
                      Open Signal
                    </Link>
                  )}
                  {action.item_id && (
                    <Link href={`/deal-room/${encodeURIComponent(action.item_id)}`} style={ghost}>
                      Open Deal Room
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
