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

type RoutingResponse = {
  id?: string;
  member_email?: string;
  signal_id?: string;
  action_id?: string;
  item_id?: string;
  response?: string;
  title?: string;
  note?: string;
  priority?: string;
  created_at?: string;
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
  safe_href?: string;
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

const wrap: React.CSSProperties = { maxWidth: 1200, margin: "0 auto" };

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

function statusTone(value: string) {
  const status = clean(value).toLowerCase();
  if (status === "approved" || status === "ready" || status === "sent") return "#9df3bf";
  if (status === "draft" || status === "needs_review") return "#f5d978";
  if (status === "paused" || status === "declined") return "#ffb3b3";
  return "#d8b5ff";
}

function label(value: string) {
  const text = clean(value || "draft").replace(/_/g, " ");
  return text.slice(0, 1).toUpperCase() + text.slice(1);
}

function InfoBox({ title, value }: { title: string; value?: string | number }) {
  return (
    <div style={card}>
      <div style={greenEyebrow}>{title}</div>
      <p style={{ ...muted, fontSize: 18, margin: 0 }}>{value || "—"}</p>
    </div>
  );
}

function Locked() {
  return (
    <main style={page}>
      <div style={wrap}>
        <section style={hero}>
          <div style={greenEyebrow}>Introduction Review</div>
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

export default function AdminIntroductionReviewPage() {
  const params = useParams();
  const introId = decodeURIComponent(String(params?.introId || ""));

  const [email, setEmail] = useState("");
  const [owner, setOwner] = useState(false);
  const [intro, setIntro] = useState<Introduction | null>(null);
  const [response, setResponse] = useState<RoutingResponse | null>(null);
  const [signal, setSignal] = useState<Signal | null>(null);
  const [item, setItem] = useState<RelatedItem | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [busy, setBusy] = useState("");
  const [status, setStatus] = useState("Loading introduction review...");

  async function load() {
    setStatus("Loading introduction review...");

    try {
      const currentEmail = getEmail();
      const currentOwner = isOwner(currentEmail);

      setEmail(currentEmail);
      setOwner(currentOwner);

      if (!currentOwner) {
        setStatus("");
        return;
      }

      const introRes = await fetch(`/api/routing/introductions?email=${encodeURIComponent(currentEmail)}&owner=1`, {
        cache: "no-store",
        headers: {
          "x-vf-email": currentEmail,
          "x-vf-admin": "1",
        },
      });

      const introData = await safeJson(introRes);

      if (!introRes.ok || introData?.ok === false) {
        throw new Error(introData?.error || introData?.details || "Could not load introduction.");
      }

      const foundIntro = Array.isArray(introData?.introductions)
        ? introData.introductions.find((entry: Introduction) => String(entry.id) === introId)
        : null;

      setIntro(foundIntro || null);
      setReviewNote(foundIntro?.note || "");

      if (!foundIntro) {
        setStatus("Introduction not found.");
        return;
      }

      if (foundIntro.response_id) {
        const responseRes = await fetch(`/api/routing/responses?email=${encodeURIComponent(currentEmail)}&owner=1`, {
          cache: "no-store",
          headers: {
            "x-vf-email": currentEmail,
            "x-vf-admin": "1",
          },
        });
        const responseData = await safeJson(responseRes);
        const foundResponse = Array.isArray(responseData?.responses)
          ? responseData.responses.find((entry: RoutingResponse) => String(entry.id) === String(foundIntro.response_id))
          : null;
        setResponse(foundResponse || null);
      }

      if (foundIntro.signal_id) {
        const [storedRes, feedRes] = await Promise.all([
          fetch(`/api/intelligence/stored?email=${encodeURIComponent(currentEmail)}&owner=1`, {
            cache: "no-store",
            headers: { "x-vf-email": currentEmail, "x-vf-admin": "1" },
          }),
          fetch(`/api/intelligence/feed?email=${encodeURIComponent(currentEmail)}&owner=1`, {
            cache: "no-store",
            headers: { "x-vf-email": currentEmail, "x-vf-admin": "1" },
          }),
        ]);

        const storedData = await safeJson(storedRes);
        const feedData = await safeJson(feedRes);
        const storedSignals = Array.isArray(storedData?.alerts) ? storedData.alerts : [];
        const feedSignals = Array.isArray(feedData?.alerts) ? feedData.alerts : [];
        const foundSignal =
          storedSignals.find((entry: Signal) => String(entry.id) === String(foundIntro.signal_id)) ||
          feedSignals.find((entry: Signal) => String(entry.id) === String(foundIntro.signal_id)) ||
          null;
        setSignal(foundSignal || null);
      }

      const itemId = clean(foundIntro.item_id);
      if (itemId) {
        const itemRes = await fetch(`/api/intelligence/item/${encodeURIComponent(itemId)}?email=${encodeURIComponent(currentEmail)}&owner=1`, {
          cache: "no-store",
          headers: {
            "x-vf-email": currentEmail,
            "x-vf-admin": "1",
          },
        });
        const itemData = await safeJson(itemRes);
        setItem(itemData?.item || null);
      }

      setStatus("");
    } catch (error: any) {
      setStatus(error?.message || "Could not load introduction review.");
    }
  }

  async function updateStatus(nextStatus: string) {
    if (!intro?.id) return;

    setBusy(nextStatus);
    setStatus(`Marking introduction ${label(nextStatus)}...`);

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
          note: reviewNote,
        }),
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Could not update introduction status.");
      }

      setIntro(data?.introduction || intro);
      setStatus(data?.message || `Introduction marked ${nextStatus}.`);
    } catch (error: any) {
      setStatus(error?.message || "Could not update introduction status.");
    } finally {
      setBusy("");
    }
  }

  useEffect(() => {
    load();
  }, [introId]);

  const statusColor = useMemo(() => statusTone(intro?.status || "draft"), [intro?.status]);

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
          .vf-review-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .vf-review-actions > * {
            width: 100%;
            margin: 0 !important;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <section style={{ ...hero, borderColor: `${statusColor}66` }}>
          <div style={{ ...greenEyebrow, color: statusColor }}>
            Controlled Introduction Review · {label(intro?.status || "draft")}
          </div>

          <h1 style={{ fontSize: "clamp(52px,10vw,92px)", lineHeight: 0.88, margin: "0 0 18px" }}>
            {intro?.title || "Introduction review"}
          </h1>

          <p style={{ ...muted, fontSize: 21 }}>
            Review the member response, signal context, and deal object before this introduction moves toward any future dispatch.
          </p>

          <div className="vf-review-actions">
            <Link href="/admin-introductions" style={ghost}>Back to Introductions</Link>
            <Link href="/admin-dispatch-queue" style={btn}>Dispatch Queue</Link>
            <Link href="/admin-routing-responses" style={ghost}>Response Monitor</Link>
            <Link href="/admin-routing" style={ghost}>Admin Routing</Link>
            <Link href="/admin-intelligence" style={ghost}>Owner Intelligence</Link>
            {intro?.signal_id && <Link href={`/routing-room/${encodeURIComponent(intro.signal_id)}`} style={btn}>Routing Room</Link>}
            {intro?.signal_id && <Link href={`/signals/${encodeURIComponent(intro.signal_id)}`} style={ghost}>Signal</Link>}
            {intro?.item_id && <Link href={`/deal-room/${encodeURIComponent(intro.item_id)}`} style={ghost}>Deal Room</Link>}
            <button type="button" onClick={load} style={ghost}>Refresh Review</button>
          </div>

          {status && (
            <p style={{ color: status.toLowerCase().includes("could not") || status.toLowerCase().includes("not found") ? "#ffd0d0" : "#9df3bf", fontWeight: 900 }}>
              {status}
            </p>
          )}
        </section>

        {intro && (
          <>
            <section style={hero}>
              <div style={greenEyebrow}>Owner Review Controls</div>
              <textarea
                value={reviewNote}
                onChange={(event) => setReviewNote(event.target.value)}
                placeholder="Owner review note. This updates the intro note/status only. It sends nothing."
                style={{
                  width: "100%",
                  minHeight: 140,
                  borderRadius: 20,
                  border: "1px solid rgba(255,255,255,.18)",
                  background: "rgba(255,255,255,.075)",
                  color: "white",
                  padding: 16,
                  fontSize: 16,
                  boxSizing: "border-box",
                  marginBottom: 14,
                }}
              />

              <div className="vf-review-actions">
                {["needs_review", "approved", "ready", "paused", "declined"].map((next) => (
                  <button
                    key={next}
                    type="button"
                    style={next === "approved" || next === "ready" ? btn : ghost}
                    disabled={!!busy}
                    onClick={() => updateStatus(next)}
                  >
                    {busy === next ? "Saving..." : `Mark ${label(next)}`}
                  </button>
                ))}
              </div>
            </section>

            <section style={grid}>
              <InfoBox title="Intro Status" value={label(intro.status || "draft")} />
              <InfoBox title="Member Email" value={intro.member_email} />
              <InfoBox title="Intro To" value={intro.intro_to_email || "Not set yet"} />
              <InfoBox title="Intro Type" value={intro.intro_type} />
              <InfoBox title="Priority" value={intro.priority} />
              <InfoBox title="Created By" value={intro.created_by} />
              <InfoBox title="Signal ID" value={intro.signal_id} />
              <InfoBox title="Item ID" value={intro.item_id} />
            </section>

            <section style={{ ...hero, marginTop: 22 }}>
              <div style={greenEyebrow}>Member Response Context</div>
              <p style={{ ...muted, fontSize: 19 }}>
                {response?.response ? `Response: ${label(response.response)}` : "No response context found."}
              </p>
              <p style={muted}>{response?.note || "No response note recorded."}</p>
              {response?.member_email && <span style={chip}>{response.member_email}</span>}
              {response?.created_at && <span style={chip}>{response.created_at}</span>}
            </section>

            <section style={{ ...hero, marginTop: 22 }}>
              <div style={greenEyebrow}>Signal Context</div>
              <h2 style={{ fontSize: 42, lineHeight: 1, margin: "0 0 14px" }}>
                {signal?.title || "Signal not found"}
              </h2>
              <p style={muted}>{signal?.message || "No signal message found."}</p>
              {signal?.alert_type && <span style={chip}>{signal.alert_type}</span>}
              {signal?.priority && <span style={chip}>{signal.priority}</span>}
              {signal?.score !== undefined && <span style={chip}>Score {signal.score}</span>}
            </section>

            {item && (
              <section style={{ ...hero, marginTop: 22 }}>
                <div style={greenEyebrow}>Deal / Pain Object Context</div>
                <h2 style={{ fontSize: 42, lineHeight: 1, margin: "0 0 14px" }}>
                  {item.title || "Related object"}
                </h2>
                <p style={muted}>{item.description || "No description found."}</p>

                <section style={grid}>
                  <InfoBox title="Market" value={[item.city, item.state].filter(Boolean).join(", ")} />
                  <InfoBox title="Property Type" value={item.property_type} />
                  <InfoBox title="Strategy" value={item.strategy} />
                  <InfoBox title="Asking Price" value={item.asking_price_display} />
                  <InfoBox title="ARV / Value" value={item.arv_display} />
                  <InfoBox title="Repairs" value={item.repair_estimate_display} />
                  <InfoBox title="Exact Address" value={item.exact_address} />
                  <InfoBox title="Contact Email" value={item.contact_email} />
                  <InfoBox title="Contact Phone" value={item.contact_phone} />
                  <InfoBox title="Private Notes" value={item.private_notes} />
                </section>
              </section>
            )}

            <section style={{ ...hero, marginTop: 22 }}>
              <div style={greenEyebrow}>Safety Mode</div>
              <p style={{ ...muted, fontSize: 19 }}>
                This page only updates introduction status and review note. It does not send emails,
                create notifications, expose private details to members, or mutate deals/members.
                Mark introductions Approved or Ready to make them appear in the Dispatch Queue.
              </p>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
