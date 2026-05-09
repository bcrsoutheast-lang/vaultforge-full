"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type RoutingResponse = {
  id?: string;
  member_email?: string;
  signal_id?: string;
  action_id?: string;
  item_id?: string;
  response?: string;
  title?: string;
  note?: string;
  source?: string;
  priority?: string;
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

function responseLabel(value: string) {
  const text = clean(value || "response").replace(/_/g, " ");
  return text.slice(0, 1).toUpperCase() + text.slice(1);
}

function responseTone(value: string) {
  const r = clean(value).toLowerCase();
  if (r === "interested" || r === "request_intro" || r === "request_call") return "#9df3bf";
  if (r === "need_more_info" || r === "watch") return "#f5d978";
  if (r === "pass") return "#ffb3b3";
  return "#d8b5ff";
}

async function draftIntroduction({
  email,
  response,
}: {
  email: string;
  response: RoutingResponse;
}) {
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
      response_id: response.id,
      signal_id: response.signal_id,
      action_id: response.action_id,
      item_id: response.item_id,
      member_email: response.member_email,
      intro_type: "controlled_intro",
      status: "draft",
      title: response.title || "VaultForge controlled introduction",
      note:
        response.note ||
        "Controlled introduction drafted from member response. No notification sent.",
      priority: response.priority || "medium",
      source: "admin_routing_responses",
    }),
  });

  const data = await safeJson(res);

  if (!res.ok || data?.ok === false) {
    throw new Error(data?.error || data?.details || "Could not draft introduction.");
  }

  return data;
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
          <div style={greenEyebrow}>Admin Routing Responses</div>
          <h1 style={{ fontSize: "clamp(54px,12vw,100px)", lineHeight: 0.88, margin: "0 0 18px" }}>
            Owner access required.
          </h1>
          <p style={{ ...muted, fontSize: 21 }}>
            Member response monitoring belongs to the owner control tower.
          </p>
          <Link href="/admin-login" style={btn}>Admin Login</Link>
          <Link href="/dashboard" style={ghost}>Dashboard</Link>
        </section>
      </div>
    </main>
  );
}

export default function AdminRoutingResponsesPage() {
  const [email, setEmail] = useState("");
  const [owner, setOwner] = useState(false);
  const [responses, setResponses] = useState<RoutingResponse[]>([]);
  const [status, setStatus] = useState("Loading member responses...");
  const [filter, setFilter] = useState("all");
  const [introBusy, setIntroBusy] = useState("");
  const [introMessage, setIntroMessage] = useState("");

  async function load() {
    setStatus("Loading member responses...");

    try {
      const currentEmail = getEmail();
      const currentOwner = isOwner(currentEmail);

      setEmail(currentEmail);
      setOwner(currentOwner);

      if (!currentOwner) {
        setStatus("");
        return;
      }

      const res = await fetch(`/api/routing/responses?email=${encodeURIComponent(currentEmail)}&owner=1`, {
        cache: "no-store",
        headers: {
          "x-vf-email": currentEmail,
          "x-vf-admin": "1",
        },
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Could not load routing responses.");
      }

      setResponses(Array.isArray(data?.responses) ? data.responses : []);
      setStatus("");
    } catch (error: any) {
      setStatus(error?.message || "Could not load routing responses.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const responseTypes = useMemo(() => {
    const set = new Set<string>();
    for (const item of responses) {
      const value = clean(item.response);
      if (value) set.add(value);
    }
    return Array.from(set).sort();
  }, [responses]);

  const filtered = useMemo(() => {
    if (filter === "all") return responses;
    return responses.filter((item) => clean(item.response) === filter);
  }, [responses, filter]);

  const counts = useMemo(() => {
    return {
      total: responses.length,
      interested: responses.filter((item) => item.response === "interested").length,
      needMore: responses.filter((item) => item.response === "need_more_info").length,
      requestCall: responses.filter((item) => item.response === "request_call").length,
      requestIntro: responses.filter((item) => item.response === "request_intro").length,
      pass: responses.filter((item) => item.response === "pass").length,
    };
  }, [responses]);

  async function handleDraftIntro(response: RoutingResponse) {
    if (!owner) {
      setIntroMessage("Owner/admin access required to draft introductions.");
      return;
    }

    setIntroBusy(response.id || response.signal_id || response.member_email || "intro");
    setIntroMessage("Drafting controlled introduction...");

    try {
      const result = await draftIntroduction({
        email,
        response,
      });

      setIntroMessage(result?.message || "Controlled introduction drafted safely.");
    } catch (error: any) {
      setIntroMessage(error?.message || "Could not draft introduction.");
    } finally {
      setIntroBusy("");
    }
  }

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
          .vf-admin-response-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .vf-admin-response-actions > * {
            width: 100%;
            margin: 0 !important;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <section style={hero}>
          <div style={greenEyebrow}>VaultForge Admin Routing Responses</div>
          <h1 style={{ fontSize: "clamp(58px,12vw,108px)", lineHeight: 0.86, margin: "0 0 18px" }}>
            Member response intelligence.
          </h1>
          <p style={{ ...muted, fontSize: 22 }}>
            See who responded to routed opportunities and how they responded. This is read-only monitoring:
            no intros, notifications, or deal/member mutations happen here.
          </p>

          <div className="vf-admin-response-actions">
            <button type="button" style={btn} onClick={load}>Refresh Responses</button>
            <Link href="/admin-routing" style={btn}>Admin Routing</Link>
            <Link href="/admin-introductions" style={btn}>Admin Introductions</Link>
            <Link href="/admin-intelligence" style={ghost}>Owner Intelligence</Link>
            <Link href="/routing-inbox" style={ghost}>Routing Inbox</Link>
            <Link href="/alerts" style={ghost}>Alerts</Link>
            <Link href="/admin" style={ghost}>Admin Home</Link>
            <Link href="/logout" style={danger}>Logout</Link>
          </div>

          {status && (
            <p style={{ color: status.toLowerCase().includes("could not") ? "#ffd0d0" : "#9df3bf", fontWeight: 900 }}>
              {status}
            </p>
          )}

          {introMessage && (
            <p
              style={{
                color:
                  introMessage.toLowerCase().includes("could not") ||
                  introMessage.toLowerCase().includes("required")
                    ? "#ffd0d0"
                    : "#9df3bf",
                fontWeight: 900,
              }}
            >
              {introMessage}
            </p>
          )}

          <div style={{ marginTop: 16 }}>
            <span style={chip}>Owner: {email || OWNER_EMAIL}</span>
            <span style={chip}>Table: vf_routing_responses</span>
            <span style={chip}>Mode: Read-only response monitor</span>
            <span style={chip}>Introductions: /admin-introductions</span>
          </div>
        </section>

        <section style={statGrid}>
          <StatCard label="Total Responses" value={counts.total} detail="All member responses." />
          <StatCard label="Interested" value={counts.interested} detail="Members want to pursue." />
          <StatCard label="Need More Info" value={counts.needMore} detail="More context requested." />
          <StatCard label="Request Call" value={counts.requestCall} detail="Call requested." />
          <StatCard label="Request Intro" value={counts.requestIntro} detail="Intro requested." />
          <StatCard label="Pass" value={counts.pass} detail="Member passed." />
        </section>

        <section style={hero}>
          <div style={greenEyebrow}>Filter</div>
          <div className="vf-admin-response-actions">
            <button type="button" style={filter === "all" ? btn : ghost} onClick={() => setFilter("all")}>All</button>
            {responseTypes.map((type) => (
              <button key={type} type="button" style={filter === type ? btn : ghost} onClick={() => setFilter(type)}>
                {responseLabel(type)}
              </button>
            ))}
          </div>
        </section>

        {filtered.length === 0 ? (
          <section style={hero}>
            <strong>No member responses yet.</strong>
            <p style={muted}>
              Members can respond from Routing Inbox with Interested, Need More Info, Request Call, Request Intro, or Pass.
            </p>
          </section>
        ) : (
          <section style={grid}>
            {filtered.map((item, index) => {
              const tone = responseTone(item.response || "");
              return (
                <article key={item.id || `${item.response}-${index}`} style={{ ...card, borderColor: `${tone}66` }}>
                  <div style={{ ...greenEyebrow, color: tone }}>{responseLabel(item.response || "response")}</div>
                  <h2 style={{ fontSize: 30, lineHeight: 1.05, margin: "0 0 10px" }}>
                    {item.title || "Routing response"}
                  </h2>
                  <p style={muted}>{item.note || "No member note recorded."}</p>

                  <div style={{ margin: "12px 0" }}>
                    {item.member_email && <span style={chip}>{item.member_email}</span>}
                    {item.priority && <span style={chip}>{item.priority}</span>}
                    {item.created_at && <span style={chip}>{item.created_at}</span>}
                  </div>

                  <div className="vf-admin-response-actions">
                    {item.signal_id && (
                      <Link href={`/routing-room/${encodeURIComponent(item.signal_id)}`} style={btn}>
                        Open Routing Room
                      </Link>
                    )}
                    {item.signal_id && (
                      <Link href={`/signals/${encodeURIComponent(item.signal_id)}`} style={ghost}>
                        Open Signal
                      </Link>
                    )}
                    {item.item_id && (
                      <Link href={`/deal-room/${encodeURIComponent(item.item_id)}`} style={ghost}>
                        Open Deal Room
                      </Link>
                    )}

                    {(item.response === "interested" ||
                      item.response === "request_intro" ||
                      item.response === "request_call" ||
                      item.response === "need_more_info") && (
                      <button
                        type="button"
                        style={btn}
                        disabled={!!introBusy}
                        onClick={() => handleDraftIntro(item)}
                      >
                        {introBusy === (item.id || item.signal_id || item.member_email || "intro")
                          ? "Drafting..."
                          : "Draft Controlled Intro"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
