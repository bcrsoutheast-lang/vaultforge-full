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

function hasAdminCookie() {
  return (
    readCookie("vf_admin") === "1" ||
    readCookie("isAdmin") === "true" ||
    readCookie("vf_email").toLowerCase() === OWNER_EMAIL ||
    readCookie("vf_admin_email").toLowerCase() === OWNER_EMAIL
  );
}

function isOwner(email: string) {
  return cleanEmail(email) === OWNER_EMAIL || hasAdminCookie();
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function label(value: string) {
  const text = clean(value || "draft").replace(/_/g, " ");
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

function Locked() {
  return (
    <main style={page}>
      <div style={wrap}>
        <section style={hero}>
          <div style={greenEyebrow}>Dispatch Queue</div>
          <h1 style={{ fontSize: "clamp(54px,12vw,100px)", lineHeight: 0.88, margin: "0 0 18px" }}>
            Owner access required.
          </h1>
          <Link href="/admin-login" style={btn}>Admin Login</Link>
          <Link href="/dashboard" style={ghost}>Dashboard</Link>
        </section>
      </div>
    </main>
  );
}

export default function AdminDispatchQueuePage() {
  const [email, setEmail] = useState("");
  const [owner, setOwner] = useState(false);
  const [introductions, setIntroductions] = useState<Introduction[]>([]);
  const [status, setStatus] = useState("Loading dispatch queue...");
  const [busyId, setBusyId] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  async function load() {
    setStatus("Loading dispatch queue...");

    try {
      const currentEmail = getEmail();
      const currentOwner = isOwner(currentEmail);

      setEmail(currentEmail);
      setOwner(currentOwner);

      if (!currentOwner) {
        setStatus("");
        return;
      }

      const res = await fetch(`/api/routing/introductions?email=${encodeURIComponent(currentEmail)}&owner=1`, {
        cache: "no-store",
        headers: {
          "x-vf-email": currentEmail,
          "x-vf-admin": "1",
        },
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Could not load introductions.");
      }

      setIntroductions(Array.isArray(data?.introductions) ? data.introductions : []);
      setStatus("");
    } catch (error: any) {
      setStatus(error?.message || "Could not load dispatch queue.");
    }
  }

  async function updateIntroStatus(intro: Introduction, nextStatus: string) {
    if (!intro.id) return;

    setBusyId(`${intro.id}-${nextStatus}`);
    setActionMessage(`Marking introduction ${label(nextStatus)}...`);

    try {
      const res = await fetch("/api/routing/introductions/status", {
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
          id: intro.id,
          status: nextStatus,
          note: intro.note || "",
        }),
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Could not update introduction status.");
      }

      setActionMessage(data?.message || `Introduction marked ${label(nextStatus)}. No notification was sent.`);
      await load();
    } catch (error: any) {
      setActionMessage(error?.message || "Could not update introduction status.");
    } finally {
      setBusyId("");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const queue = useMemo(() => {
    return introductions.filter((item) => ["ready", "approved"].includes(clean(item.status).toLowerCase()));
  }, [introductions]);

  const counts = useMemo(() => {
    return {
      total: introductions.length,
      ready: introductions.filter((item) => item.status === "ready").length,
      approved: introductions.filter((item) => item.status === "approved").length,
      draft: introductions.filter((item) => item.status === "draft").length,
      paused: introductions.filter((item) => item.status === "paused").length,
    };
  }, [introductions]);

  if (!owner && !status) {
    return <Locked />;
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
          .vf-dispatch-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .vf-dispatch-actions > * {
            width: 100%;
            margin: 0 !important;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <section style={hero}>
          <div style={greenEyebrow}>VaultForge Controlled Dispatch Queue</div>
          <h1 style={{ fontSize: "clamp(58px,12vw,108px)", lineHeight: 0.86, margin: "0 0 18px" }}>
            Ready introductions.
          </h1>
          <p style={{ ...muted, fontSize: 22 }}>
            This queue shows introductions marked Approved or Ready. Nothing sends from this page yet.
            It is a safe staging area before controlled notification/dispatch is built.
          </p>

          <div className="vf-dispatch-actions">
            <button type="button" style={btn} onClick={load}>Refresh Queue</button>
            <Link href="/admin-introductions" style={btn}>All Introductions</Link>
            <Link href="/admin-introduction-responses" style={btn}>Intro Responses</Link>
            <Link href="/admin-routing-responses" style={ghost}>Response Monitor</Link>
            <Link href="/admin-routing" style={ghost}>Admin Routing</Link>
            <Link href="/admin-intelligence" style={ghost}>Owner Intelligence</Link>
            <Link href="/admin" style={ghost}>Admin Home</Link>
            <Link href="/logout" style={danger}>Logout</Link>
          </div>

          {status && (
            <p style={{ color: status.toLowerCase().includes("could not") ? "#ffd0d0" : "#9df3bf", fontWeight: 900 }}>
              {status}
            </p>
          )}

          {actionMessage && (
            <p
              style={{
                color:
                  actionMessage.toLowerCase().includes("could not")
                    ? "#ffd0d0"
                    : "#9df3bf",
                fontWeight: 900,
              }}
            >
              {actionMessage}
            </p>
          )}

          <div style={{ marginTop: 16 }}>
            <span style={chip}>Owner: {email || OWNER_EMAIL}</span>
            <span style={chip}>Mode: Read-only dispatch queue</span>
            <span style={chip}>No emails sent</span>
            <span style={chip}>Intro Responses: /admin-introduction-responses</span>
          </div>
        </section>

        <section style={statGrid}>
          <StatCard label="Ready Queue" value={queue.length} detail="Approved or ready introductions." />
          <StatCard label="Ready" value={counts.ready} detail="Marked ready." />
          <StatCard label="Approved" value={counts.approved} detail="Approved for future dispatch." />
          <StatCard label="Draft" value={counts.draft} detail="Still in draft review." />
          <StatCard label="Paused" value={counts.paused} detail="Held or paused." />
          <StatCard label="Total Intros" value={counts.total} detail="All intro records." />
        </section>

        {queue.length === 0 ? (
          <section style={hero}>
            <strong>No introductions are ready for dispatch yet.</strong>
            <p style={muted}>
              Mark introductions Approved or Ready from the exact Introduction Review page.
            </p>
          </section>
        ) : (
          <section style={grid}>
            {queue.map((item, index) => (
              <article key={item.id || `${item.signal_id}-${index}`} style={card}>
                <div style={greenEyebrow}>{label(item.status || "ready")}</div>
                <h2 style={{ fontSize: 30, lineHeight: 1.05, margin: "0 0 10px" }}>
                  {item.title || "Controlled Introduction"}
                </h2>
                <p style={muted}>{item.note || "No intro note recorded."}</p>

                <div style={{ margin: "12px 0" }}>
                  {item.member_email && <span style={chip}>Member: {item.member_email}</span>}
                  {item.intro_to_email && <span style={chip}>To: {item.intro_to_email}</span>}
                  {item.priority && <span style={chip}>{item.priority}</span>}
                  {item.created_at && <span style={chip}>{item.created_at}</span>}
                </div>

                <div className="vf-dispatch-actions">
                  {item.id && (
                    <Link href={`/admin-introduction-review/${encodeURIComponent(item.id)}`} style={btn}>
                      Review Intro
                    </Link>
                  )}
                  {item.signal_id && (
                    <Link href={`/routing-room/${encodeURIComponent(item.signal_id)}`} style={ghost}>
                      Routing Room
                    </Link>
                  )}
                  {item.item_id && (
                    <Link href={`/deal-room/${encodeURIComponent(item.item_id)}`} style={ghost}>
                      Deal Room
                    </Link>
                  )}

                  <button
                    type="button"
                    style={btn}
                    disabled={!!busyId}
                    onClick={() => updateIntroStatus(item, "sent")}
                  >
                    {busyId === `${item.id}-sent` ? "Saving..." : "Mark Sent — No Email"}
                  </button>

                  <button
                    type="button"
                    style={ghost}
                    disabled={!!busyId}
                    onClick={() => updateIntroStatus(item, "paused")}
                  >
                    {busyId === `${item.id}-paused` ? "Saving..." : "Pause"}
                  </button>

                  <button
                    type="button"
                    style={ghost}
                    disabled={!!busyId}
                    onClick={() => updateIntroStatus(item, "needs_review")}
                  >
                    {busyId === `${item.id}-needs_review` ? "Saving..." : "Needs Review"}
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}

        <section style={{ ...hero, marginTop: 22 }}>
          <div style={greenEyebrow}>Current Safety Mode</div>
          <p style={{ ...muted, fontSize: 19 }}>
            This is a read-only queue. It does not send emails, text messages, or member notifications.
            The queue can now mark items Sent, Paused, or Needs Review as a manual status update only.
            It still does not send email, text messages, or member notifications.
          </p>
        </section>
      </div>
    </main>
  );
}
