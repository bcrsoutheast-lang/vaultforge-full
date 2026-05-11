"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../../components/VaultForgeMemberNav";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type PainRecord = Record<string, any>;

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.18), transparent 28%), radial-gradient(circle at top right, rgba(181,92,255,.18), transparent 24%), radial-gradient(circle at bottom right, rgba(157,243,191,.13), transparent 28%), linear-gradient(180deg,#02040a 0%,#071326 48%,#030509 100%)",
  color: "white",
  padding: "28px 18px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1120, margin: "0 auto" };

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
  marginBottom: 18,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
  gap: 16,
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
  border: "1px solid rgba(255,120,120,.38)",
  color: "#ffd0d0",
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

const eyebrow: React.CSSProperties = {
  color: "#9df3bf",
  letterSpacing: 5,
  fontWeight: 950,
  fontSize: 12,
  marginBottom: 12,
  textTransform: "uppercase",
};

const muted: React.CSSProperties = {
  color: "rgba(255,255,255,.72)",
  lineHeight: 1.55,
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
  return cleanEmail(
    localStorage.getItem("vf_email") ||
      sessionStorage.getItem("vf_email") ||
      readCookie("vf_email") ||
      readCookie("vf_admin_email") ||
      ""
  );
}

function first(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }
  return "";
}

function titleOf(row: PainRecord, painId: string) {
  return first(row.title, row.event_title, row.signal_title, row.name, row.pain_label, `Pain Room ${painId}`);
}

function noteOf(row: PainRecord) {
  return first(
    row.note,
    row.notes,
    row.event_description,
    row.description,
    row.message,
    row.route_summary,
    row.metadata?.route_summary,
    "Pain signal context will appear here as the record is connected."
  );
}

function imageOf(row: PainRecord) {
  return first(row.image_url, row.photo_url, row.primary_photo_url, row.metadata?.image_url, row.metadata?.photo_urls?.[0]);
}

function signalIdOf(row: PainRecord) {
  return first(row.signal_id, row.related_alert_id, row.alert_id, row.metadata?.signal_id);
}

function marketOf(row: PainRecord) {
  return first(row.market, [row.city, row.state].filter(Boolean).join(", "), row.state, row.metadata?.market);
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export default function PainRoomPage({ params }: { params: { id: string } }) {
  const painId = clean(params.id);
  const [email, setEmail] = useState("");
  const [record, setRecord] = useState<PainRecord | null>(null);
  const [status, setStatus] = useState("Loading pain room...");

  async function load() {
    setStatus("Loading pain room...");

    try {
      const currentEmail = getEmail();
      setEmail(currentEmail);

      if (!currentEmail) {
        setStatus("Login email not found. Please log in again.");
        return;
      }

      const owner = currentEmail === OWNER_EMAIL || readCookie("vf_admin") === "1" || readCookie("isAdmin") === "true";

      const urls = [
        `/api/activity/event?event_type=pain_signal&event_id=${encodeURIComponent(painId)}&email=${encodeURIComponent(currentEmail)}&owner=${owner ? "1" : "0"}`,
        `/api/routing/actions?email=${encodeURIComponent(currentEmail)}&owner=${owner ? "1" : "0"}`,
        `/api/intelligence/feed?email=${encodeURIComponent(currentEmail)}&owner=${owner ? "1" : "0"}`,
      ];

      let found: PainRecord | null = null;

      for (const url of urls) {
        try {
          const res = await fetch(url, {
            cache: "no-store",
            headers: {
              "x-vf-email": currentEmail,
              "x-vf-admin": owner ? "1" : "0",
            },
          });

          const data = await safeJson(res);

          if (data?.event) {
            found = data.event;
            break;
          }

          const lists = [data?.actions, data?.alerts, data?.signals, data?.items, data?.feed].filter(Array.isArray);

          for (const list of lists) {
            const match = list.find((item: PainRecord) => {
              const values = [
                item.id,
                item.item_id,
                item.pain_id,
                item.related_deal_id,
                item.signal_id,
                item.related_alert_id,
                item.metadata?.pain_id,
                item.metadata?.item_id,
                item.metadata?.signal_id,
              ].map(clean);

              return values.includes(painId);
            });

            if (match) {
              found = match;
              break;
            }
          }

          if (found) break;
        } catch {
          // Try next source.
        }
      }

      if (!found) {
        found = {
          id: painId,
          title: "Pain signal event",
          note: "Exact source row was not found yet, but this pain room can still hold operational follow-up.",
          pain_id: painId,
          priority: "medium",
          created_at: new Date().toISOString(),
        };
      }

      setRecord(found);
      setStatus("");
    } catch (error: any) {
      setStatus(error?.message || "Could not load pain room.");
    }
  }

  useEffect(() => {
    load();
  }, [painId]);

  const row = record || {};
  const title = titleOf(row, painId);
  const note = noteOf(row);
  const image = imageOf(row);
  const signalId = signalIdOf(row);
  const market = marketOf(row);

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        @media (max-width: 760px) {
          a, button {
            width: 100%;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav title="Pain Room" subtitle="Operational pain signal context" />

        <section style={hero}>
          <div style={eyebrow}>VaultForge Pain Room</div>
          <h1 style={{ fontSize: "clamp(54px,12vw,104px)", lineHeight: 0.86, margin: "0 0 18px" }}>
            {title}
          </h1>
          <p style={{ ...muted, fontSize: 21 }}>{note}</p>

          <div>
            <span style={chip}>Signed in: {email || "unknown"}</span>
            <span style={chip}>Pain: {painId}</span>
            {signalId && <span style={chip}>Signal: {signalId}</span>}
            {market && <span style={chip}>Market: {market}</span>}
            <span style={chip}>Type: Pain Signal</span>
          </div>

          <button type="button" onClick={load} style={btn}>Refresh Pain Room</button>
          <Link href="/pain-feed" style={ghost}>Pain Feed</Link>
          <Link href="/pain" style={ghost}>Submit New Pain</Link>
          {signalId && <Link href={`/signals/${encodeURIComponent(signalId)}`} style={ghost}>Open Signal</Link>}
          {signalId && <Link href={`/routing-room/${encodeURIComponent(signalId)}`} style={ghost}>Routing Room</Link>}
          <Link href={`/messages/new?to=${encodeURIComponent(OWNER_EMAIL)}&item_id=${encodeURIComponent(painId)}&signal_id=${encodeURIComponent(signalId)}`} style={btn}>Message / Request Info</Link>
          <Link href="/activity" style={ghost}>Activity</Link>
          <Link href="/logout" style={danger}>Logout</Link>
        </section>

        {status && <section style={hero}>{status}</section>}

        <section style={grid}>
          <section style={card}>
            <div style={eyebrow}>What it is</div>
            <h2 style={{ fontSize: 32, margin: "0 0 12px" }}>Pain Signal</h2>
            <p style={muted}>A member-submitted pressure point, deal problem, funding gap, buyer need, or execution issue.</p>
          </section>

          <section style={card}>
            <div style={eyebrow}>Where it routes</div>
            <h2 style={{ fontSize: 32, margin: "0 0 12px" }}>{first(row.best_route, row.target_role, row.metadata?.best_route, "Routing / Alerts")}</h2>
            <p style={muted}>This room should connect to alerts, routing, introductions, activity, and messages.</p>
          </section>

          <section style={card}>
            <div style={eyebrow}>Priority</div>
            <h2 style={{ fontSize: 32, margin: "0 0 12px" }}>{first(row.priority, row.urgency, "Medium")}</h2>
            <p style={muted}>Urgency and signal pressure will improve as scoring gets connected.</p>
          </section>
        </section>

        <section style={card}>
          <div style={eyebrow}>Context / Photo</div>

          {image ? (
            <img
              src={image}
              alt={title}
              style={{
                width: "100%",
                maxHeight: 440,
                objectFit: "cover",
                borderRadius: 24,
                border: "1px solid rgba(255,255,255,.14)",
                marginBottom: 16,
              }}
            />
          ) : (
            <div
              style={{
                minHeight: 240,
                borderRadius: 24,
                border: "1px solid rgba(255,255,255,.12)",
                background:
                  "linear-gradient(135deg, rgba(232,196,107,.14), rgba(181,92,255,.12), rgba(157,243,191,.08))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(255,255,255,.68)",
                fontWeight: 900,
                letterSpacing: 2,
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              No image tied to this pain room yet
            </div>
          )}

          <p style={muted}>
            Photo preview depends on the Pain submit record carrying image data. Permanent storage upload is the next layer.
          </p>
        </section>

        <section style={card}>
          <div style={eyebrow}>Raw Routing Context</div>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              color: "rgba(255,255,255,.72)",
              fontSize: 13,
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            {JSON.stringify(row, null, 2)}
          </pre>
        </section>
      </div>
    </main>
  );
}
