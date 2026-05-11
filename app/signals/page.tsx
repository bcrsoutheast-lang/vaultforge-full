"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../../components/VaultForgeMemberNav";

type Row = Record<string, any>;

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

  const keys = ["vf_email", "vf_member_email", "vf_admin_email", "email", "memberEmail"];

  for (const key of keys) {
    const localValue = cleanEmail(window.localStorage.getItem(key));
    if (localValue.includes("@")) return localValue;

    const sessionValue = cleanEmail(window.sessionStorage.getItem(key));
    if (sessionValue.includes("@")) return sessionValue;
  }

  return cleanEmail(readCookie("vf_email") || readCookie("vf_member_email") || readCookie("vf_admin_email"));
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function meta(row: Row) {
  return typeof row?.metadata === "object" && row.metadata ? row.metadata : {};
}

function first(...values: unknown[]) {
  for (const value of values) {
    if (Array.isArray(value)) {
      const found = value.find((item) => clean(item));
      if (found !== undefined) return clean(found);
      continue;
    }

    const text = clean(value);
    if (text) return text;
  }
  return "";
}

function arr(value: unknown) {
  if (Array.isArray(value)) return value.map(clean).filter(Boolean);
  if (typeof value === "string") return value.split(",").map(clean).filter(Boolean);
  return [];
}

function titleOf(row: Row) {
  const m = meta(row);
  return first(row.title, row.signal_title, row.event_title, row.alert_title, row.subject, m.title, m.signal_title, "VaultForge Signal");
}

function noteOf(row: Row) {
  const m = meta(row);
  return first(row.note, row.notes, row.summary, row.description, row.message, row.body, row.route_summary, m.note, m.summary, m.description, m.message, "Live VaultForge operational record.");
}

function signalIdOf(row: Row, fallback = "") {
  const m = meta(row);
  return first(row.signal_id, row.signalId, row.id, m.signal_id, fallback);
}

function itemIdOf(row: Row) {
  const m = meta(row);
  return first(row.item_id, row.itemId, row.pain_id, row.deal_id, row.project_id, m.item_id, m.pain_id, m.deal_id, m.project_id);
}

function ownerEmailOf(row: Row) {
  const m = meta(row);
  return cleanEmail(first(row.owner_email, row.submitted_by_email, row.created_by_email, row.member_email, row.target_email, row.recipient_email, m.owner_email, m.submitted_by_email, m.created_by_email, m.member_email, m.target_email, m.recipient_email));
}

function photoList(row: Row) {
  const m = meta(row);
  const values = [
    row.image_url,
    row.photo_url,
    row.primary_photo_url,
    m.image_url,
    m.photo_url,
    ...(Array.isArray(row.photo_urls) ? row.photo_urls : []),
    ...(Array.isArray(row.photos) ? row.photos : []),
    ...(Array.isArray(m.photo_urls) ? m.photo_urls : []),
    ...(Array.isArray(m.photos) ? m.photos : []),
  ];

  return values
    .map((item: any) => {
      if (typeof item === "string") return clean(item);
      if (item && typeof item === "object") return clean(item.url || item.publicUrl || item.photo_url || item.image_url);
      return "";
    })
    .filter((url) => url.startsWith("http"));
}

function getIntel(row: Row) {
  const m = meta(row);
  return {
    ai_summary: first(row.ai_summary, row.summary, m.ai_summary, m.summary, noteOf(row)),
    best_actions: arr(row.best_actions || m.best_actions),
    risk_flags: arr(row.risk_flags || m.risk_flags),
    suggested_routes: arr(row.suggested_routes || m.suggested_routes || row.ai_tags || m.ai_tags),
    priority_score: Number(row.priority_score || row.confidence_score || m.priority_score || 0),
    route_summary: first(row.route_summary, m.route_summary),
  };
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.15), transparent 30%), radial-gradient(circle at 85% 10%, rgba(157,243,191,.10), transparent 28%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 92px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { width: "min(1180px,100%)", margin: "0 auto" };

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.26)",
  borderRadius: 28,
  padding: 24,
  background: "rgba(255,255,255,.055)",
  marginBottom: 18,
  boxShadow: "0 24px 80px rgba(0,0,0,.28)",
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

const muted: React.CSSProperties = { color: "#cbd5e1", lineHeight: 1.55 };

const button: React.CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: 50,
  borderRadius: 999,
  padding: "12px 18px",
  border: 0,
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
  fontWeight: 950,
  textDecoration: "none",
  cursor: "pointer",
};

const ghost: React.CSSProperties = {
  ...button,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.16)",
  color: "white",
};

const chip: React.CSSProperties = {
  border: "1px solid rgba(157,243,191,.22)",
  borderRadius: 999,
  padding: "7px 10px",
  color: "#9df3bf",
  background: "rgba(157,243,191,.07)",
  margin: "0 7px 7px 0",
  fontSize: 12,
  fontWeight: 850,
  display: "inline-flex",
};

function Pair({ label, value }: { label: string; value: unknown }) {
  const text = clean(value);
  if (!text) return null;

  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,.08)", padding: "10px 0" }}>
      <div style={{ color: "#94a3b8", fontSize: 12, textTransform: "uppercase", letterSpacing: ".12em", fontWeight: 900 }}>{label}</div>
      <div style={{ marginTop: 4, fontSize: 17, fontWeight: 800 }}>{text}</div>
    </div>
  );
}

export default function SignalRoomPage({ params }: { params: { signalId: string } }) {
  const [email, setEmail] = useState("");
  const [row, setRow] = useState<Row | null>(null);
  const [status, setStatus] = useState("Loading signal room...");

  const signalId = decodeURIComponent(params.signalId || "");

  async function load() {
    const viewer = getEmail();
    setEmail(viewer);
    setStatus("Loading signal room...");

    try {
      const urls = [
        `/api/signals/${encodeURIComponent(signalId)}?email=${encodeURIComponent(viewer)}`,
        `/api/pain/feed?email=${encodeURIComponent(viewer)}&owner=0`,
        `/api/routing/actions?email=${encodeURIComponent(viewer)}&owner=0`,
      ];

      for (const url of urls) {
        try {
          const res = await fetch(url, {
            cache: "no-store",
            headers: { "x-vf-email": viewer || "", "x-vf-admin": "0" },
          });

          const data = await safeJson(res);
          const direct = data.signal || data.item || data.record || data.data;
          const lists = [
            ...(Array.isArray(data.signals) ? data.signals : []),
            ...(Array.isArray(data.pains) ? data.pains : []),
            ...(Array.isArray(data.actions) ? data.actions : []),
            ...(Array.isArray(data.data) ? data.data : []),
          ];

          const candidates = direct && !Array.isArray(direct) ? [direct, ...lists] : lists;
          const match = candidates.find((item: Row) => signalIdOf(item) === signalId || itemIdOf(item) === signalId || clean(item.id) === signalId);

          if (match) {
            setRow(match);
            setStatus("");
            return;
          }
        } catch {
          // Try next feed.
        }
      }

      setRow({
        signal_id: signalId,
        title: "Signal Room",
        summary: "Signal record not found in available feeds yet. The room is ready, but the source table did not return the record.",
        metadata: {},
      });
      setStatus("Signal source not found yet.");
    } catch (error: any) {
      setStatus(error?.message || "Could not load signal room.");
    }
  }

  useEffect(() => {
    load();
  }, [signalId]);

  const m = meta(row || {});
  const intel = getIntel(row || {});
  const photos = photoList(row || {});
  const itemId = itemIdOf(row || {});
  const owner = ownerEmailOf(row || {});
  const actualSignalId = signalIdOf(row || {}, signalId);

  const assetSpecific = useMemo(() => {
    const raw = m.asset_specific && typeof m.asset_specific === "object" ? m.asset_specific : {};
    return Object.entries(raw).filter(([, value]) => clean(value));
  }, [m]);

  const connectHref = actualSignalId
    ? `/connect/${encodeURIComponent(actualSignalId)}?email=${encodeURIComponent(email)}${itemId ? `&item_id=${encodeURIComponent(itemId)}` : ""}`
    : "/messages";

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }
        @media (max-width: 760px) {
          .vf-grid {
            grid-template-columns: 1fr !important;
          }
          .vf-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
          .vf-actions > * {
            width: 100%;
            box-sizing: border-box;
            justify-content: center;
          }
        }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav title="Signal Room" subtitle="Structured signal overview, summary, best actions, photos, and routing context." active="signals" />

        <section style={card}>
          <p style={eyebrow}>VaultForge Signal Room</p>
          <h1 style={{ fontSize: "clamp(48px,10vw,92px)", lineHeight: 0.88, margin: "10px 0 18px", letterSpacing: "-.06em" }}>
            {row ? titleOf(row) : "Loading Signal"}
          </h1>
          <p style={{ ...muted, fontSize: 18 }}>{row ? noteOf(row) : status}</p>

          <div style={{ marginTop: 14 }}>
            <span style={chip}>Signal: {actualSignalId || "pending"}</span>
            {itemId ? <span style={chip}>Item: {itemId}</span> : null}
            {owner ? <span style={chip}>Owner: {owner}</span> : null}
            <span style={chip}>Score: {intel.priority_score || 75}</span>
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
            <Link href={connectHref} style={button}>Message Owner</Link>
            <Link href={`/routing-room/${encodeURIComponent(actualSignalId || signalId)}`} style={ghost}>Routing Room</Link>
            <button type="button" style={ghost} onClick={load}>Refresh</button>
          </div>
        </section>

        <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "1.25fr .75fr", gap: 18 }}>
          <div style={card}>
            <h2 style={{ marginTop: 0 }}>AI Summary</h2>
            <p style={{ ...muted, fontSize: 22 }}>{intel.ai_summary}</p>

            {intel.route_summary ? (
              <div style={{ marginTop: 16, border: "1px solid rgba(232,196,107,.22)", borderRadius: 20, padding: 16, background: "rgba(232,196,107,.08)" }}>
                <strong style={{ color: "#f8e7b0" }}>Suggested route:</strong>{" "}
                <span style={muted}>{intel.route_summary}</span>
              </div>
            ) : null}
          </div>

          <div style={card}>
            <h2 style={{ marginTop: 0 }}>Signal Overview</h2>
            <Pair label="Type" value={m.pain_type || row?.action || row?.type} />
            <Pair label="Asset" value={m.asset_type || row?.asset_type} />
            <Pair label="Market" value={[m.city || row?.city, m.operating_state || row?.state || row?.market].filter(Boolean).join(", ")} />
            <Pair label="Urgency" value={m.urgency || row?.priority} />
            <Pair label="Source" value={row?.source || row?.source_table || "VaultForge Pain Submissions"} />
          </div>
        </section>

        <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18 }}>
          <div style={card}>
            <h2 style={{ marginTop: 0 }}>Best Actions</h2>
            {(intel.best_actions.length ? intel.best_actions : ["Review owner request.", "Confirm missing details.", "Route to matching member category."]).map((item) => (
              <div key={item} style={{ ...chip, display: "flex", whiteSpace: "normal", borderRadius: 16 }}>{item}</div>
            ))}
          </div>

          <div style={card}>
            <h2 style={{ marginTop: 0 }}>Risk Flags</h2>
            {(intel.risk_flags.length ? intel.risk_flags : ["No risk flags generated yet."]).map((item) => (
              <div key={item} style={{ ...chip, display: "flex", whiteSpace: "normal", borderRadius: 16, color: "#ffd0d0", borderColor: "rgba(255,120,120,.28)", background: "rgba(255,120,120,.08)" }}>{item}</div>
            ))}
          </div>

          <div style={card}>
            <h2 style={{ marginTop: 0 }}>Suggested Routes</h2>
            {(intel.suggested_routes.length ? intel.suggested_routes : ["Owner Review"]).map((item) => (
              <div key={item} style={{ ...chip, display: "flex", whiteSpace: "normal", borderRadius: 16 }}>{item}</div>
            ))}
          </div>
        </section>

        <section style={card}>
          <h2 style={{ marginTop: 0 }}>Photos / Asset Context</h2>
          {photos.length ? (
            <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 }}>
              {photos.map((url, index) => (
                <div key={`${url}-${index}`} style={{ borderRadius: 22, overflow: "hidden", border: "1px solid rgba(232,196,107,.22)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`VaultForge signal asset ${index + 1}`} style={{ width: "100%", height: 260, objectFit: "cover", display: "block" }} />
                </div>
              ))}
            </div>
          ) : (
            <p style={muted}>No valid photos connected yet.</p>
          )}
        </section>

        {assetSpecific.length ? (
          <section style={card}>
            <h2 style={{ marginTop: 0 }}>Asset-Specific Fields</h2>
            <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
              {assetSpecific.map(([key, value]) => (
                <Pair key={key} label={key.replace(/_/g, " ")} value={value} />
              ))}
            </div>
          </section>
        ) : null}

        <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <div style={card}>
            <h2 style={{ marginTop: 0 }}>Numbers</h2>
            <Pair label="Capital Needed" value={m.capital_needed} />
            <Pair label="Asking Price" value={m.asking_price} />
            <Pair label="ARV / Value" value={m.arv_value || m.estimated_value} />
            <Pair label="Repairs / Work" value={m.repairs_needed || m.estimated_repairs} />
          </div>

          <div style={card}>
            <h2 style={{ marginTop: 0 }}>Routing / Messages</h2>
            <Pair label="Routing Actions" value={row?.routing_count || row?.routing_actions_count || "Generated if routing table accepted the record"} />
            <Pair label="Messages" value={row?.message_count || row?.messages_count || "Use Message Owner to start controlled communication"} />
            <Pair label="Status" value={row?.status || row?.routing_status || "New"} />
          </div>
        </section>

        {status ? <section style={card}>{status}</section> : null}
      </div>
    </main>
  );
}
