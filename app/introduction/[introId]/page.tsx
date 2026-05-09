"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

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

type Signal = {
  id?: string;
  title?: string;
  message?: string;
  alert_type?: string;
  priority?: string;
  score?: number;
  item_id?: string;
  state?: string;
  market?: string;
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
  exact_address?: string;
  contact_email?: string;
  contact_phone?: string;
  private_notes?: string;
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
  gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
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

function InfoBox({ title, value }: { title: string; value?: string | number }) {
  return (
    <div style={card}>
      <div style={greenEyebrow}>{title}</div>
      <p style={{ ...muted, fontSize: 18, margin: 0 }}>{value || "—"}</p>
    </div>
  );
}

async function saveIntroResponse({
  email,
  intro,
  response,
}: {
  email: string;
  intro: Introduction;
  response: string;
}) {
  const res = await fetch("/api/routing/introduction-responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-vf-email": email,
    },
    body: JSON.stringify({
      email,
      member_email: email,
      introduction_id: intro.id,
      signal_id: intro.signal_id,
      item_id: intro.item_id,
      title: intro.title,
      priority: intro.priority,
      response,
      note: intro.note,
      source: "member_introduction_detail",
    }),
  });

  const data = await safeJson(res);

  if (!res.ok || data?.ok === false) {
    throw new Error(data?.error || data?.details || "Could not save introduction response.");
  }

  return data;
}


export default function MemberIntroductionDetailPage() {
  const params = useParams();
  const introId = decodeURIComponent(String(params?.introId || ""));

  const [email, setEmail] = useState("");
  const [owner, setOwner] = useState(false);
  const [intro, setIntro] = useState<Introduction | null>(null);
  const [signal, setSignal] = useState<Signal | null>(null);
  const [item, setItem] = useState<RelatedItem | null>(null);
  const [responseBusy, setResponseBusy] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [status, setStatus] = useState("Loading introduction...");

  async function load() {
    setStatus("Loading introduction...");

    try {
      const currentEmail = getEmail();
      const currentOwner = isOwnerEmail(currentEmail);

      setEmail(currentEmail);
      setOwner(currentOwner);

      if (!currentEmail) {
        setStatus("Login email not found. Please log in again.");
        return;
      }

      const introRes = await fetch(`/api/routing/introductions?email=${encodeURIComponent(currentEmail)}&owner=${currentOwner ? "1" : "0"}`, {
        cache: "no-store",
        headers: {
          "x-vf-email": currentEmail,
          "x-vf-admin": currentOwner ? "1" : "0",
        },
      });

      const introData = await safeJson(introRes);

      if (!introRes.ok || introData?.ok === false) {
        throw new Error(introData?.error || introData?.details || "Could not load introductions.");
      }

      const foundIntro = Array.isArray(introData?.introductions)
        ? introData.introductions.find((entry: Introduction) => String(entry.id) === introId)
        : null;

      setIntro(foundIntro || null);

      if (!foundIntro) {
        setStatus("Introduction not found for this account.");
        return;
      }

      if (!currentOwner && !["approved", "ready", "sent"].includes(clean(foundIntro.status).toLowerCase())) {
        setStatus("This introduction is not visible to members yet.");
        return;
      }

      if (foundIntro.signal_id) {
        const [storedRes, feedRes] = await Promise.all([
          fetch(`/api/intelligence/stored?email=${encodeURIComponent(currentEmail)}&owner=${currentOwner ? "1" : "0"}`, {
            cache: "no-store",
            headers: { "x-vf-email": currentEmail, "x-vf-admin": currentOwner ? "1" : "0" },
          }),
          fetch(`/api/intelligence/feed?email=${encodeURIComponent(currentEmail)}&owner=${currentOwner ? "1" : "0"}`, {
            cache: "no-store",
            headers: { "x-vf-email": currentEmail, "x-vf-admin": currentOwner ? "1" : "0" },
          }),
        ]);

        const storedData = await safeJson(storedRes);
        const feedData = await safeJson(feedRes);
        const stored = Array.isArray(storedData?.alerts) ? storedData.alerts : [];
        const generated = Array.isArray(feedData?.alerts) ? feedData.alerts : [];
        const foundSignal =
          stored.find((entry: Signal) => String(entry.id) === String(foundIntro.signal_id)) ||
          generated.find((entry: Signal) => String(entry.id) === String(foundIntro.signal_id)) ||
          null;

        setSignal(foundSignal || null);
      }

      if (foundIntro.item_id) {
        const itemRes = await fetch(`/api/intelligence/item/${encodeURIComponent(foundIntro.item_id)}?email=${encodeURIComponent(currentEmail)}&owner=${currentOwner ? "1" : "0"}`, {
          cache: "no-store",
          headers: {
            "x-vf-email": currentEmail,
            "x-vf-admin": currentOwner ? "1" : "0",
          },
        });
        const itemData = await safeJson(itemRes);
        setItem(itemData?.item || null);
      }

      setStatus("");
    } catch (error: any) {
      setStatus(error?.message || "Could not load introduction.");
    }
  }

  useEffect(() => {
    load();
  }, [introId]);

  const statusColor = useMemo(() => tone(intro?.status || ""), [intro?.status]);

  async function handleIntroResponse(response: string) {
    if (!intro?.id) return;

    setResponseBusy(response);
    setResponseMessage("Saving introduction response...");

    try {
      const result = await saveIntroResponse({
        email,
        intro,
        response,
      });

      setResponseMessage(result?.message || "Introduction response saved safely.");
    } catch (error: any) {
      setResponseMessage(error?.message || "Could not save introduction response.");
    } finally {
      setResponseBusy("");
    }
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
          .vf-intro-detail-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .vf-intro-detail-actions > * {
            width: 100%;
            margin: 0 !important;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <section style={{ ...hero, borderColor: `${statusColor}66` }}>
          <div style={{ ...greenEyebrow, color: statusColor }}>
            VaultForge Introduction Detail · {owner ? "Owner View" : "Member View"} · {label(intro?.status || "loading")}
          </div>

          <h1 style={{ fontSize: "clamp(52px,10vw,92px)", lineHeight: 0.88, margin: "0 0 18px" }}>
            {intro?.title || "Controlled introduction"}
          </h1>

          <p style={{ ...muted, fontSize: 21 }}>
            {intro?.note || status || "This is a controlled introduction staged through VaultForge."}
          </p>

          <div className="vf-intro-detail-actions">
            <Link href="/introductions" style={ghost}>Back to Introductions</Link>
            <Link href="/routing-inbox" style={ghost}>Routing Inbox</Link>
            <Link href="/alerts" style={ghost}>Alerts</Link>
            <Link href="/intelligence" style={ghost}>Intelligence Map</Link>
            {owner && <Link href="/admin-introductions" style={btn}>Admin Introductions</Link>}
            {owner && intro?.id && <Link href={`/admin-introduction-review/${encodeURIComponent(intro.id)}`} style={btn}>Owner Review</Link>}
            {intro?.signal_id && <Link href={`/routing-room/${encodeURIComponent(intro.signal_id)}`} style={btn}>Routing Room</Link>}
            {intro?.signal_id && <Link href={`/signals/${encodeURIComponent(intro.signal_id)}`} style={ghost}>Signal</Link>}
            {intro?.item_id && <Link href={`/deal-room/${encodeURIComponent(intro.item_id)}`} style={ghost}>Deal Room</Link>}
            <button type="button" onClick={load} style={ghost}>Refresh</button>
            <Link href="/logout" style={danger}>Logout</Link>
          </div>

          {status && (
            <p style={{ color: status.toLowerCase().includes("could not") || status.toLowerCase().includes("not found") ? "#ffd0d0" : "#9df3bf", fontWeight: 900 }}>
              {status}
            </p>
          )}

          {responseMessage && (
            <p
              style={{
                color:
                  responseMessage.toLowerCase().includes("could not")
                    ? "#ffd0d0"
                    : "#9df3bf",
                fontWeight: 900,
              }}
            >
              {responseMessage}
            </p>
          )}
        </section>

        {intro && (
          <>
            <section style={grid}>
              <InfoBox title="Status" value={label(intro.status || "introduction")} />
              <InfoBox title="Member Email" value={intro.member_email} />
              <InfoBox title="Intro Type" value={intro.intro_type} />
              <InfoBox title="Priority" value={intro.priority} />
              <InfoBox title="Created" value={intro.created_at} />
              <InfoBox title="Marked Sent" value={intro.sent_at || "Not sent"} />
              {owner && <InfoBox title="Intro To Email" value={intro.intro_to_email || "Not set"} />}
              {owner && <InfoBox title="Created By" value={intro.created_by} />}
            </section>

            <section style={{ ...hero, marginTop: 22 }}>
              <div style={greenEyebrow}>Signal Context</div>
              <h2 style={{ fontSize: 42, lineHeight: 1, margin: "0 0 14px" }}>
                {signal?.title || "Signal context unavailable"}
              </h2>
              <p style={muted}>{signal?.message || "No signal message found."}</p>
              {signal?.alert_type && <span style={chip}>{signal.alert_type}</span>}
              {signal?.priority && <span style={chip}>{signal.priority}</span>}
              {signal?.score !== undefined && <span style={chip}>Score {signal.score}</span>}
              {signal?.state && <span style={chip}>{signal.state}</span>}
              {signal?.market && <span style={chip}>{signal.market}</span>}
            </section>

            {item && (
              <section style={{ ...hero, marginTop: 22 }}>
                <div style={greenEyebrow}>Related Deal / Pain Context</div>
                <h2 style={{ fontSize: 42, lineHeight: 1, margin: "0 0 14px" }}>
                  {item.title || "Related object"}
                </h2>
                <p style={muted}>{item.description || "No related item description found."}</p>

                <section style={grid}>
                  <InfoBox title="Market" value={[item.city, item.state].filter(Boolean).join(", ")} />
                  <InfoBox title="Property Type" value={item.property_type} />
                  <InfoBox title="Strategy" value={item.strategy} />
                  <InfoBox title="Asking Price" value={item.asking_price_display} />
                  <InfoBox title="ARV / Value" value={item.arv_display} />
                  <InfoBox title="Repairs" value={item.repair_estimate_display} />
                  {owner && <InfoBox title="Exact Address" value={item.exact_address} />}
                  {owner && <InfoBox title="Contact Email" value={item.contact_email} />}
                  {owner && <InfoBox title="Contact Phone" value={item.contact_phone} />}
                  {owner && <InfoBox title="Private Notes" value={item.private_notes} />}
                </section>
              </section>
            )}

            {!owner && (
              <section style={{ ...hero, marginTop: 22 }}>
                <div style={greenEyebrow}>Respond to Introduction</div>
                <h2 style={{ fontSize: 42, lineHeight: 1, margin: "0 0 14px" }}>
                  What do you want to do next?
                </h2>
                <p style={{ ...muted, fontSize: 19 }}>
                  This saves your response only. It does not message anyone or reveal private details.
                </p>

                <div className="vf-intro-detail-actions">
                  <button
                    type="button"
                    style={btn}
                    disabled={!!responseBusy}
                    onClick={() => handleIntroResponse("interested")}
                  >
                    {responseBusy === "interested" ? "Saving..." : "Interested"}
                  </button>

                  <button
                    type="button"
                    style={ghost}
                    disabled={!!responseBusy}
                    onClick={() => handleIntroResponse("need_details")}
                  >
                    {responseBusy === "need_details" ? "Saving..." : "Need Details"}
                  </button>

                  <button
                    type="button"
                    style={ghost}
                    disabled={!!responseBusy}
                    onClick={() => handleIntroResponse("request_call")}
                  >
                    {responseBusy === "request_call" ? "Saving..." : "Request Call"}
                  </button>

                  <button
                    type="button"
                    style={ghost}
                    disabled={!!responseBusy}
                    onClick={() => handleIntroResponse("pass")}
                  >
                    {responseBusy === "pass" ? "Saving..." : "Pass"}
                  </button>
                </div>
              </section>
            )}

            <section style={{ ...hero, marginTop: 22 }}>
              <div style={greenEyebrow}>Current Safety Mode</div>
              <p style={{ ...muted, fontSize: 19 }}>
                This page is read-only. It does not send messages, expose owner-only private fields to members,
                create introductions, or mutate deals/members.
              </p>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
