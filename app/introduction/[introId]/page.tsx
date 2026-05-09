"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

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
  gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
  gap: 18,
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

function titleOf(item: Intro | null) {
  return first(item?.title, item?.name, item?.subject, "Controlled introduction");
}

function noteOf(item: Intro | null) {
  return first(item?.note, item?.notes, item?.message, item?.description, "Controlled introduction staged through VaultForge.");
}

function statusOf(item: Intro | null) {
  return first(item?.intro_status, item?.status, item?.routing_status, "staged").toLowerCase();
}

function priorityOf(item: Intro | null) {
  return first(item?.priority, item?.severity, "medium").toLowerCase();
}

function toneOf(item: Intro | null) {
  const status = statusOf(item);
  const priority = priorityOf(item);

  if (status === "sent" || item?.sent === true) return "#9df3bf";
  if (status === "paused" || item?.paused === true) return "#ffb3b3";
  if (priority === "urgent") return "#ffb3b3";
  if (priority === "high") return "#f5d978";
  return "#9df3bf";
}

function visibleEmail(item: Intro | null) {
  return first(
    item?.visible_to_email,
    item?.member_email,
    item?.recipient_email,
    item?.intro_to_email,
    item?.responding_member_email,
    item?.counterparty_email
  );
}

function counterpartyEmail(item: Intro | null) {
  return first(
    item?.counterparty_email,
    item?.sender_email,
    item?.recipient_email,
    item?.intro_to_email,
    item?.responding_member_email
  );
}

function InfoBox({ title, value }: { title: string; value?: string | number }) {
  return (
    <div style={card}>
      <div style={{ color: "#9df3bf", letterSpacing: 4, fontWeight: 900, fontSize: 11, marginBottom: 10, textTransform: "uppercase" }}>
        {title}
      </div>
      <p style={{ ...muted, fontSize: 18, margin: 0 }}>{value || "—"}</p>
    </div>
  );
}

export default function IntroductionDetailPage() {
  const params = useParams();
  const introId = decodeURIComponent(String(params?.introId || ""));

  const [email, setEmail] = useState("");
  const [owner, setOwner] = useState(false);
  const [intro, setIntro] = useState<Intro | null>(null);
  const [responses, setResponses] = useState<Record<string, any>[]>([]);
  const [responseChoice, setResponseChoice] = useState("interested");
  const [responseNote, setResponseNote] = useState("");
  const [responseStatus, setResponseStatus] = useState("");
  const [responseBusy, setResponseBusy] = useState(false);
  const [status, setStatus] = useState("Loading exact introduction...");

  async function load() {
    setStatus("Loading exact introduction...");

    try {
      const currentEmail = getEmail();
      const currentOwner = isOwner(currentEmail);

      setEmail(currentEmail);
      setOwner(currentOwner);

      if (!currentEmail) {
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
        throw new Error(data?.error || data?.details || "Could not load introduction.");
      }

      const rows = Array.isArray(data?.introductions) ? data.introductions : [];
      const found = rows.find((item: Intro) => exactIntroId(item) === introId) || null;

      setIntro(found);

      const responseRes = await fetch(`/api/routing/introduction-responses?email=${encodeURIComponent(currentEmail)}&owner=${currentOwner ? "1" : "0"}&intro_id=${encodeURIComponent(introId)}`, {
        cache: "no-store",
        headers: {
          "x-vf-email": currentEmail,
          "x-vf-admin": currentOwner ? "1" : "0",
        },
      });

      const responseData = await safeJson(responseRes);
      setResponses(Array.isArray(responseData?.responses) ? responseData.responses : []);

      setStatus(found ? "" : "Exact introduction not found for this account.");
    } catch (error: any) {
      setStatus(error?.message || "Could not load exact introduction.");
    }
  }

  async function saveResponse() {
    if (!intro) {
      setResponseStatus("Introduction must load before you can respond.");
      return;
    }

    setResponseBusy(true);
    setResponseStatus("Saving introduction response...");

    try {
      const res = await fetch("/api/routing/introduction-responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": email,
          "x-vf-admin": owner ? "1" : "0",
        },
        body: JSON.stringify({
          email,
          introduction_id: exactIntroId(intro),
          intro_id: exactIntroId(intro),
          signal_id: exactSignalId(intro),
          item_id: exactItemId(intro),
          title: `Response to ${titleOf(intro)}`,
          note: responseNote,
          response: responseChoice,
          member_email: email,
          responder_email: email,
          responding_member_email: email,
          counterparty_email: counterpartyEmail(intro),
          owner_email: intro.owner_email || OWNER_EMAIL,
          priority: priorityOf(intro),
          source: "introduction_detail_response",
        }),
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Could not save response.");
      }

      setResponseStatus(data?.message || "Introduction response saved.");
      setResponseNote("");
      await load();
    } catch (error: any) {
      setResponseStatus(error?.message || "Could not save response.");
    } finally {
      setResponseBusy(false);
    }
  }

  useEffect(() => {
    load();
  }, [introId]);

  const tone = toneOf(intro);

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
        <section style={{ ...hero, borderColor: `${tone}66` }}>
          <div style={{ color: tone, letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 12, textTransform: "uppercase" }}>
            Exact Introduction · {owner ? "Owner View" : "Member View"}
          </div>

          <h1 style={{ fontSize: "clamp(54px,11vw,104px)", lineHeight: 0.86, margin: "0 0 18px" }}>
            {titleOf(intro)}
          </h1>

          <p style={{ ...muted, fontSize: 22 }}>
            {noteOf(intro)}
          </p>

          <div>
            <span style={chip}>Intro: {introId}</span>
            <span style={chip}>Status: {label(statusOf(intro))}</span>
            <span style={chip}>Priority: {label(priorityOf(intro))}</span>
            {visibleEmail(intro) && <span style={chip}>Visible: {visibleEmail(intro)}</span>}
            {counterpartyEmail(intro) && <span style={chip}>Counterparty: {counterpartyEmail(intro)}</span>}
          </div>

          <div className="vf-actions" style={{ marginTop: 14 }}>
            <button type="button" style={btn} onClick={load}>Refresh Introduction</button>
            <Link href="/introductions" style={ghost}>Back to Introductions</Link>
            <Link href="/activity" style={ghost}>Activity</Link>
            <Link href="/routing-inbox" style={ghost}>Routing Inbox</Link>
            {intro && exactSignalId(intro) && <Link href={exactSignalHref(intro)} style={ghost}>Signal</Link>}
            {intro && exactSignalId(intro) && <Link href={exactRoutingHref(intro)} style={ghost}>Routing Room</Link>}
            {intro && exactItemId(intro) && <Link href={exactWorkHref(intro)} style={ghost}>Work Area</Link>}
            {owner && <Link href="/admin-introductions" style={ghost}>Admin Introductions</Link>}
          </div>

          {status && (
            <p style={{ color: status.toLowerCase().includes("could not") || status.toLowerCase().includes("not found") ? "#ffd0d0" : "#9df3bf", fontWeight: 900 }}>
              {status}
            </p>
          )}

          {responseStatus && (
            <p style={{ color: responseStatus.toLowerCase().includes("could not") || responseStatus.toLowerCase().includes("must") ? "#ffd0d0" : "#9df3bf", fontWeight: 900 }}>
              {responseStatus}
            </p>
          )}
        </section>

        {intro && (
          <>
            <section style={grid}>
              <InfoBox title="Introduction ID" value={exactIntroId(intro)} />
              <InfoBox title="Signal ID" value={exactSignalId(intro)} />
              <InfoBox title="Item ID" value={exactItemId(intro)} />
              <InfoBox title="Visible To" value={visibleEmail(intro)} />
              <InfoBox title="Counterparty" value={counterpartyEmail(intro)} />
              <InfoBox title="Created" value={intro.created_at} />
              <InfoBox title="Updated" value={intro.updated_at} />
              <InfoBox title="Source" value={intro.source} />
            </section>


            <section style={{ ...hero, marginTop: 22 }}>
              <div style={{ color: "#9df3bf", letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 12, textTransform: "uppercase" }}>
                Controlled Response
              </div>

              <h2 style={{ fontSize: 42, lineHeight: 1, margin: "0 0 14px" }}>
                Respond to this introduction.
              </h2>

              <p style={{ ...muted, fontSize: 19 }}>
                This saves your response only. It does not send emails, notify anyone, or change the deal/member record.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
                <select
                  value={responseChoice}
                  onChange={(event) => setResponseChoice(event.target.value)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    borderRadius: 18,
                    border: "1px solid rgba(255,255,255,.18)",
                    background: "rgba(255,255,255,.075)",
                    color: "white",
                    padding: 14,
                    fontSize: 15,
                  }}
                >
                  <option value="interested" style={{ color: "#111" }}>Interested</option>
                  <option value="need_more_info" style={{ color: "#111" }}>Need More Info</option>
                  <option value="call_requested" style={{ color: "#111" }}>Request Call</option>
                  <option value="reviewing" style={{ color: "#111" }}>Reviewing</option>
                  <option value="not_interested" style={{ color: "#111" }}>Not Interested</option>
                </select>
              </div>

              <textarea
                value={responseNote}
                onChange={(event) => setResponseNote(event.target.value)}
                placeholder="Optional response note..."
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  borderRadius: 18,
                  border: "1px solid rgba(255,255,255,.18)",
                  background: "rgba(255,255,255,.075)",
                  color: "white",
                  padding: 14,
                  fontSize: 15,
                  minHeight: 120,
                  marginTop: 14,
                }}
              />

              <button type="button" style={btn} disabled={responseBusy} onClick={saveResponse}>
                {responseBusy ? "Saving..." : "Save Response"}
              </button>
            </section>

            {responses.length > 0 && (
              <section style={{ ...hero, marginTop: 22 }}>
                <div style={{ color: "#9df3bf", letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 12, textTransform: "uppercase" }}>
                  Response History
                </div>

                <section style={grid}>
                  {responses.map((row, index) => (
                    <article key={row.id || index} style={card}>
                      <div style={{ color: "#9df3bf", letterSpacing: 4, fontWeight: 900, fontSize: 11, marginBottom: 10, textTransform: "uppercase" }}>
                        {String(row.response || "response").replace(/_/g, " ")}
                      </div>
                      <p style={{ ...muted, fontSize: 18 }}>{row.note || row.notes || "No response note."}</p>
                      {row.member_email && <span style={chip}>{row.member_email}</span>}
                      {row.created_at && <span style={chip}>{row.created_at}</span>}
                    </article>
                  ))}
                </section>
              </section>
            )}

            <section style={{ ...hero, marginTop: 22 }}>
              <div style={{ color: "#9df3bf", letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 12, textTransform: "uppercase" }}>
                Connected Exact Work
              </div>

              {exactSignalId(intro) && <Link href={exactSignalHref(intro)} style={btn}>Open Exact Signal</Link>}
              {exactSignalId(intro) && <Link href={exactRoutingHref(intro)} style={ghost}>Open Exact Routing Room</Link>}
              {exactItemId(intro) && <Link href={exactWorkHref(intro)} style={ghost}>Open Exact Work Area</Link>}
            </section>
          </>
        )}

        <section style={{ ...hero, marginTop: 22 }}>
          <div style={{ color: "#9df3bf", letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 12, textTransform: "uppercase" }}>
            Current Safety Mode
          </div>
          <p style={{ ...muted, fontSize: 19 }}>
            This page reads one introduction record only. It does not send messages, reveal private unstaged contact data, or change records.
          </p>
        </section>
      </div>
    </main>
  );
}
