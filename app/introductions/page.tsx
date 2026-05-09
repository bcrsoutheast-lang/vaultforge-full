"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";
import {
  VaultForgePulseStrip,
  VaultForgeSignalBar,
  VaultForgeCommandFooter,
} from "../components/VaultForgeVisualLayer";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type Intro = Record<string, any>;

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
  const text = clean(value || "intro").replace(/_/g, " ");
  return text.slice(0, 1).toUpperCase() + text.slice(1);
}

function first(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }
  return "";
}

function exactIntroId(item: Intro) {
  return first(item.introduction_id, item.intro_id, item.introId, item.id);
}

function exactSignalId(item: Intro) {
  return first(item.signal_id, item.signalId, item.alert_id, item.alertId);
}

function exactItemId(item: Intro) {
  return first(item.item_id, item.itemId, item.deal_id, item.dealId, item.project_id, item.projectId, item.property_id, item.propertyId, item.pain_id, item.painId);
}

function exactIntroHref(item: Intro) {
  const introId = exactIntroId(item);
  return introId ? `/introduction/${encodeURIComponent(introId)}` : "/introductions";
}

function exactSignalHref(item: Intro) {
  const signalId = exactSignalId(item);
  return signalId ? `/signals/${encodeURIComponent(signalId)}` : "/intelligence";
}

function exactRoutingHref(item: Intro) {
  const signalId = exactSignalId(item);
  return signalId ? `/routing-room/${encodeURIComponent(signalId)}` : "/routing-inbox";
}

function exactWorkHref(item: Intro) {
  const itemId = exactItemId(item);
  if (itemId) return `/deal-room/${encodeURIComponent(itemId)}`;
  return exactSignalHref(item);
}

function titleOf(item: Intro) {
  return first(item.title, item.name, item.subject, "Controlled introduction");
}

function noteOf(item: Intro) {
  return first(item.note, item.notes, item.message, item.description, "Controlled introduction staged through VaultForge.");
}

function statusOf(item: Intro) {
  return first(item.intro_status, item.status, item.routing_status, "staged").toLowerCase();
}

function priorityOf(item: Intro) {
  return first(item.priority, item.severity, "medium").toLowerCase();
}

function toneOf(item: Intro) {
  const status = statusOf(item);
  const priority = priorityOf(item);

  if (status === "sent" || item.sent === true) return "#9df3bf";
  if (status === "paused" || item.paused === true) return "#ffb3b3";
  if (priority === "urgent") return "#ffb3b3";
  if (priority === "high") return "#f5d978";
  return "#9df3bf";
}

function visibleEmail(item: Intro) {
  return first(
    item.visible_to_email,
    item.member_email,
    item.recipient_email,
    item.intro_to_email,
    item.responding_member_email,
    item.counterparty_email
  );
}

function counterpartyEmail(item: Intro) {
  return first(
    item.counterparty_email,
    item.sender_email,
    item.recipient_email,
    item.intro_to_email,
    item.responding_member_email
  );
}

function responsesForIntro(intro: Intro, responses: Record<string, any>[]) {
  const introId = exactIntroId(intro);

  return responses.filter((row) => {
    const rowIntro = first(row.introduction_id, row.intro_id);
    return rowIntro && introId && rowIntro === introId;
  });
}

function latestResponseForIntro(intro: Intro, responses: Record<string, any>[]) {
  const rows = responsesForIntro(intro, responses);

  return rows[0] || null;
}

function responseLabel(row: Record<string, any> | null) {
  if (!row) return "No response yet";
  return label(first(row.response, "response"));
}

function StatCard({ title, value, detail }: { title: string; value: string | number; detail: string }) {
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

export default function IntroductionsPage() {
  const [email, setEmail] = useState("");
  const [owner, setOwner] = useState(false);
  const [introductions, setIntroductions] = useState<Intro[]>([]);
  const [responses, setResponses] = useState<Record<string, any>[]>([]);
  const [status, setStatus] = useState("Loading controlled introductions...");
  const [search, setSearch] = useState("");

  async function load() {
    setStatus("Loading controlled introductions...");

    try {
      const currentEmail = getEmail();
      const currentOwner = isOwner(currentEmail);

      setEmail(currentEmail);
      setOwner(currentOwner);

      if (!currentEmail) {
        setStatus("Login email not found. Please log in again.");
        return;
      }

      const headers = {
        "x-vf-email": currentEmail,
        "x-vf-admin": currentOwner ? "1" : "0",
      };

      const [res, responseRes] = await Promise.all([
        fetch(`/api/routing/introductions?email=${encodeURIComponent(currentEmail)}&owner=${currentOwner ? "1" : "0"}`, {
          cache: "no-store",
          headers,
        }),
        fetch(`/api/routing/introduction-responses?email=${encodeURIComponent(currentEmail)}&owner=${currentOwner ? "1" : "0"}`, {
          cache: "no-store",
          headers,
        }),
      ]);

      const data = await safeJson(res);
      const responseData = await safeJson(responseRes);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Could not load introductions.");
      }

      const rows = Array.isArray(data?.introductions) ? data.introductions : [];
      const responseRows = Array.isArray(responseData?.responses) ? responseData.responses : [];
      setIntroductions(rows);
      setResponses(responseRows);
      setStatus(rows.length ? "" : "No controlled introductions visible yet.");
    } catch (error: any) {
      setStatus(error?.message || "Could not load introductions.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return introductions.filter((item) => {
      if (!q) return true;

      return [
        titleOf(item),
        noteOf(item),
        statusOf(item),
        priorityOf(item),
        visibleEmail(item),
        counterpartyEmail(item),
        exactIntroId(item),
        exactSignalId(item),
        exactItemId(item),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [introductions, search]);

  const sent = introductions.filter((item) => statusOf(item) === "sent" || item.sent === true).length;
  const ready = introductions.filter((item) => statusOf(item) === "ready" || statusOf(item) === "staged").length;
  const approved = introductions.filter((item) => item.approved === true || statusOf(item) === "approved").length;
  const paused = introductions.filter((item) => item.paused === true || statusOf(item) === "paused").length;
  const responded = introductions.filter((item) => responsesForIntro(item, responses).length > 0).length;

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
        <VaultForgeMemberNav
          title="Introductions"
          subtitle="Controlled member introductions and response tracking"
        />

        <VaultForgePulseStrip
          items={[
            { label: "INTROS", value: "LIVE", tone: "gold" },
            { label: "RESPONSES", value: "TRACKING", tone: "green" },
            { label: "NETWORK", value: "ACTIVE", tone: "purple" },
            { label: "PRESSURE", value: "WATCHING", tone: "red" },
          ]}
        />

        <VaultForgeSignalBar
          urgent={paused}
          high={ready + approved}
          normal={Math.max(0, introductions.length - paused - ready - approved)}
        />

        <section style={hero}>
          <div style={{ color: "#9df3bf", letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 12, textTransform: "uppercase" }}>
            VaultForge Introductions · {owner ? "Owner View" : "Member View"}
          </div>

          <h1 style={{ fontSize: "clamp(56px,11vw,104px)", lineHeight: 0.86, margin: "0 0 18px" }}>
            Exact introductions.
          </h1>

          <p style={{ ...muted, fontSize: 22 }}>
            Controlled introductions now keep exact links to the intro, signal, routing room, and work area.
          </p>

          <div>
            <span style={chip}>Visible Intros: {introductions.length}</span>
            <span style={chip}>Sent: {sent}</span>
            <span style={chip}>Ready: {ready}</span>
            <span style={chip}>Approved: {approved}</span>
            <span style={chip}>Paused: {paused}</span>
            <span style={chip}>Responded: {responded}</span>
            <span style={chip}>Email: {email || "unknown"}</span>
          </div>

          <div className="vf-actions" style={{ marginTop: 14 }}>
            <button type="button" style={btn} onClick={load}>Refresh Introductions</button>
            <Link href="/routing-inbox" style={ghost}>Routing Inbox</Link>
            <Link href="/activity" style={ghost}>Activity</Link>
            <Link href="/alerts" style={ghost}>Alerts</Link>
            <Link href="/intelligence" style={ghost}>Intelligence</Link>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
            {owner && <Link href="/admin-introductions" style={ghost}>Admin Introductions</Link>}
            <Link href="/logout" style={danger}>Logout</Link>
          </div>

          {status && (
            <p style={{ color: status.toLowerCase().includes("could not") ? "#ffd0d0" : "#9df3bf", fontWeight: 900 }}>
              {status}
            </p>
          )}
        </section>

        <section style={statGrid}>
          <StatCard title="Visible Intros" value={introductions.length} detail="Introductions visible to this account." />
          <StatCard title="Sent" value={sent} detail="Marked sent by owner." />
          <StatCard title="Ready" value={ready} detail="Ready or staged introductions." />
          <StatCard title="Approved" value={approved} detail="Approved introductions." />
          <StatCard title="Paused" value={paused} detail="Paused introductions." />
          <StatCard title="Responded" value={responded} detail="Introductions with saved member responses." />
        </section>

        <section style={hero}>
          <div style={{ color: "#9df3bf", letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 12, textTransform: "uppercase" }}>
            Search
          </div>
          <input
            style={input}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search intro title, email, signal id, item id..."
          />
        </section>

        {filtered.length === 0 ? (
          <section style={hero}>
            <strong>No exact introduction cards visible yet.</strong>
            <p style={{ ...muted }}>
              When owner/admin stages or marks introductions ready/sent for your email, they will appear here.
            </p>
          </section>
        ) : (
          <section style={grid}>
            {filtered.map((item, index) => {
              const tone = toneOf(item);
              const latestResponse = latestResponseForIntro(item, responses);
              const responseCount = responsesForIntro(item, responses).length;

              return (
                <article key={exactIntroId(item) || index} style={{ ...card, borderColor: `${tone}66` }}>
                  <div style={{ color: tone, letterSpacing: 4, fontWeight: 900, fontSize: 11, marginBottom: 10, textTransform: "uppercase" }}>
                    {label(statusOf(item))} · {label(priorityOf(item))}
                  </div>

                  <h2 style={{ fontSize: 30, lineHeight: 1.05, margin: "0 0 10px" }}>
                    {titleOf(item)}
                  </h2>

                  <p style={{ ...muted, fontSize: 18 }}>
                    {noteOf(item)}
                  </p>

                  <div style={{ margin: "12px 0" }}>
                    {visibleEmail(item) && <span style={chip}>Visible: {visibleEmail(item)}</span>}
                    {counterpartyEmail(item) && <span style={chip}>Counterparty: {counterpartyEmail(item)}</span>}
                    {exactIntroId(item) && <span style={chip}>Intro: {exactIntroId(item)}</span>}
                    {exactSignalId(item) && <span style={chip}>Signal: {exactSignalId(item)}</span>}
                    {exactItemId(item) && <span style={chip}>Item: {exactItemId(item)}</span>}
                    <span style={chip}>Response: {responseLabel(latestResponse)}</span>
                    {responseCount > 0 && <span style={chip}>Responses: {responseCount}</span>}
                  </div>

                  {latestResponse && (
                    <section style={{ marginTop: 12, border: "1px solid rgba(255,255,255,.10)", borderRadius: 20, padding: 14, background: "rgba(255,255,255,.035)" }}>
                      <strong style={{ color: "#9df3bf", display: "block", marginBottom: 8 }}>Latest response</strong>
                      <p style={{ ...muted, margin: 0 }}>
                        {latestResponse.note || latestResponse.notes || "No response note."}
                      </p>
                    </section>
                  )}

                  <div className="vf-actions">
                    <Link href={exactIntroHref(item)} style={btn}>Open Exact Introduction</Link>
                    {exactSignalId(item) && <Link href={exactSignalHref(item)} style={ghost}>Signal</Link>}
                    {exactSignalId(item) && <Link href={exactRoutingHref(item)} style={ghost}>Routing Room</Link>}
                    {exactItemId(item) && <Link href={exactWorkHref(item)} style={ghost}>Work Area</Link>}
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
            This page reads introduction records only. It does not create introductions, send messages, reveal private data, or change deal/member records.
          </p>
        </section>
        <VaultForgeCommandFooter />
      </div>
    </main>
  );
}