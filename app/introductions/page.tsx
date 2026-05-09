"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type Introduction = {
  id?: string;
  response_id?: string;
  signal_id?: string;
  action_id?: string;
  item_id?: string;
  member_email?: string;
  intro_to_email?: string;
  intro_type?: string;
  status?: string;
  title?: string;
  note?: string;
  source?: string;
  priority?: string;
  created_by?: string;
  sent_at?: string;
  created_at?: string;
  updated_at?: string;
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

function isOwnerEmail(email: string) {
  return email === OWNER_EMAIL || readCookie("vf_admin") === "1";
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function label(value: string) {
  const text = clean(value || "introduction").replace(/_/g, " ");
  return text.slice(0, 1).toUpperCase() + text.slice(1);
}

function tone(value: string) {
  const status = clean(value).toLowerCase();
  if (status === "sent" || status === "ready" || status === "approved") return "#9df3bf";
  if (status === "draft" || status === "needs_review") return "#f5d978";
  if (status === "paused" || status === "declined") return "#ffb3b3";
  return "#d8b5ff";
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

export default function MemberIntroductionsPage() {
  const [email, setEmail] = useState("");
  const [owner, setOwner] = useState(false);
  const [introductions, setIntroductions] = useState<Introduction[]>([]);
  const [status, setStatus] = useState("Loading introductions...");

  async function load() {
    setStatus("Loading introductions...");

    try {
      const currentEmail = getEmail();
      const currentOwner = isOwnerEmail(currentEmail);

      setEmail(currentEmail);
      setOwner(currentOwner);

      if (!currentEmail) {
        setIntroductions([]);
        setStatus("Login email not found. Please log in again.");
        return;
      }

      const res = await fetch(`/api/routing/introductions?email=${encodeURIComponent(currentEmail)}&owner=${currentOwner ? "1" : "0"}`, {
        cache: "no-store",
        headers: {
          "x-vf-email": currentEmail,
          "x-vf-admin": currentOwner ? "1" : "0",
        },
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Could not load introductions.");
      }

      setIntroductions(Array.isArray(data?.introductions) ? data.introductions : []);
      setStatus("");
    } catch (error: any) {
      setStatus(error?.message || "Could not load introductions.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(() => {
    if (owner) return introductions;
    return introductions.filter((item) =>
      ["ready", "sent", "approved"].includes(clean(item.status).toLowerCase())
    );
  }, [introductions, owner]);

  const counts = useMemo(() => {
    return {
      total: visible.length,
      sent: visible.filter((item) => item.status === "sent").length,
      ready: visible.filter((item) => item.status === "ready").length,
      approved: visible.filter((item) => item.status === "approved").length,
      paused: visible.filter((item) => item.status === "paused").length,
    };
  }, [visible]);

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
          .vf-intro-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .vf-intro-actions > * {
            width: 100%;
            margin: 0 !important;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <section style={hero}>
          <div style={greenEyebrow}>VaultForge Introductions · {owner ? "Owner Global View" : "Member View"}</div>
          <h1 style={{ fontSize: "clamp(58px,12vw,108px)", lineHeight: 0.86, margin: "0 0 18px" }}>
            Controlled introductions.
          </h1>
          <p style={{ ...muted, fontSize: 22 }}>
            Review introductions staged through the VaultForge routing system. This page is read-only and does not expose private contact details beyond what admin has staged.
          </p>

          <div className="vf-intro-actions">
            <button type="button" style={btn} onClick={load}>Refresh Introductions</button>
            <Link href="/routing-inbox" style={ghost}>Routing Inbox</Link>
            <Link href="/alerts" style={ghost}>Alerts</Link>
            <Link href="/intelligence" style={ghost}>Intelligence Map</Link>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
            {owner && <Link href="/admin-introductions" style={btn}>Admin Introductions</Link>}
            {owner && <Link href="/admin-dispatch-queue" style={ghost}>Dispatch Queue</Link>}
            <Link href="/logout" style={danger}>Logout</Link>
          </div>

          {status && (
            <p style={{ color: status.toLowerCase().includes("could not") || status.toLowerCase().includes("not found") ? "#ffd0d0" : "#9df3bf", fontWeight: 900 }}>
              {status}
            </p>
          )}

          <div style={{ marginTop: 16 }}>
            <span style={chip}>Email: {email || "not loaded"}</span>
            <span style={chip}>Mode: Read-only</span>
          </div>
        </section>

        <section style={statGrid}>
          <StatCard label="Visible Intros" value={counts.total} detail="Introductions visible to this account." />
          <StatCard label="Sent" value={counts.sent} detail="Marked sent by owner." />
          <StatCard label="Ready" value={counts.ready} detail="Ready/staged introductions." />
          <StatCard label="Approved" value={counts.approved} detail="Approved introductions." />
          <StatCard label="Paused" value={counts.paused} detail="Paused introductions." />
        </section>

        {visible.length === 0 ? (
          <section style={hero}>
            <strong>No controlled introductions visible yet.</strong>
            <p style={muted}>
              When owner/admin stages or marks introductions ready/sent for your email, they will appear here.
            </p>
          </section>
        ) : (
          <section style={grid}>
            {visible.map((item, index) => {
              const statusTone = tone(item.status || "");
              return (
                <article key={item.id || `${item.signal_id}-${index}`} style={{ ...card, borderColor: `${statusTone}66` }}>
                  <div style={{ ...greenEyebrow, color: statusTone }}>{label(item.status || "introduction")}</div>
                  <h2 style={{ fontSize: 30, lineHeight: 1.05, margin: "0 0 10px" }}>
                    {item.title || "Controlled Introduction"}
                  </h2>
                  <p style={muted}>{item.note || "No intro note recorded yet."}</p>

                  <div style={{ margin: "12px 0" }}>
                    {item.member_email && <span style={chip}>Member: {item.member_email}</span>}
                    {owner && item.intro_to_email && <span style={chip}>To: {item.intro_to_email}</span>}
                    {item.intro_type && <span style={chip}>{item.intro_type}</span>}
                    {item.priority && <span style={chip}>{item.priority}</span>}
                    {item.created_at && <span style={chip}>{item.created_at}</span>}
                  </div>

                  <div className="vf-intro-actions">
                    {item.signal_id && (
                      <Link href={`/routing-room/${encodeURIComponent(item.signal_id)}`} style={btn}>
                        Routing Room
                      </Link>
                    )}
                    {item.signal_id && (
                      <Link href={`/signals/${encodeURIComponent(item.signal_id)}`} style={ghost}>
                        Signal
                      </Link>
                    )}
                    {item.item_id && (
                      <Link href={`/deal-room/${encodeURIComponent(item.item_id)}`} style={ghost}>
                        Deal Room
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <section style={{ ...hero, marginTop: 22 }}>
          <div style={greenEyebrow}>Current Safety Mode</div>
          <p style={{ ...muted, fontSize: 19 }}>
            This page reads introduction records only. It does not create introductions, send messages, reveal private data, or change deal/member records.
          </p>
        </section>
      </div>
    </main>
  );
}
