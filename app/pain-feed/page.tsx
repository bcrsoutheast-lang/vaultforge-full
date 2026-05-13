"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Row = Record<string, any>;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function first(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }
  return "";
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

function titleOf(row: Row) {
  return first(row.title, row.pain_title, row.problem_title, row.headline, "Pain Request");
}

function marketOf(row: Row) {
  return [first(row.city), first(row.state, row.operating_state)]
    .filter(Boolean)
    .join(", ") || first(row.market, row.location, "Market not listed");
}

function problemType(row: Row) {
  return first(row.problem_type, row.pain_type, row.asset_type, row.property_type, "Problem");
}

function summaryOf(row: Row) {
  return first(
    row.ai_summary,
    row.route_summary,
    row.routing_summary,
    row.summary,
    row.description,
    row.problem_description,
    row.pain_description,
    row.notes,
    row.note,
    "No summary yet."
  );
}

function ownerOf(row: Row) {
  return cleanEmail(first(row.owner_email, row.member_email, row.user_email, row.email, row.submitted_by_email));
}

function idOf(row: Row) {
  return first(row.id, row.pain_id, row.item_id, row.request_id, row.signal_id);
}

function signalIdOf(row: Row) {
  return first(row.signal_id, row.canonical_event_id, row.id, row.pain_id, row.item_id);
}

function photoOf(row: Row) {
  const urls = [
    row.main_photo_url,
    row.image_url,
    row.photo_url,
    Array.isArray(row.photo_urls) ? row.photo_urls[0] : "",
    Array.isArray(row.photos) ? (typeof row.photos[0] === "string" ? row.photos[0] : row.photos[0]?.url) : "",
  ];

  return first(...urls);
}

function money(value: unknown) {
  const text = clean(value);
  if (!text) return "Not listed";

  const number = Number(text.replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(number)) return text;

  return number.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function bottleneck(row: Row) {
  return first(row.primary_bottleneck, "Owner Review Needed");
}

function fastestMove(row: Row) {
  return first(row.fastest_path, "Clarify details and route to the best operator.");
}

const navBtn: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: 999,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.12)",
  color: "white",
  textDecoration: "none",
  fontWeight: 800,
};

const mainBtn: React.CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: 48,
  padding: "12px 18px",
  borderRadius: 999,
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#08120d",
  textDecoration: "none",
  fontWeight: 950,
};

const ghostBtn: React.CSSProperties = {
  ...mainBtn,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.12)",
  color: "white",
};

export default function PainFeedPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [status, setStatus] = useState("Loading Pain Feed...");
  const [email, setEmail] = useState("");

  async function load() {
    const viewer = getEmail();
    const finalEmail = viewer || OWNER_EMAIL;
    const ownerFlag = finalEmail === OWNER_EMAIL ? "1" : "0";

    setEmail(finalEmail);
    setStatus("Loading Pain Feed...");

    try {
      const res = await fetch(
        `/api/pain/feed?email=${encodeURIComponent(finalEmail)}&owner=${ownerFlag}`,
        {
          cache: "no-store",
          credentials: "include",
          headers: {
            "x-vf-email": finalEmail,
            "x-vf-admin": ownerFlag,
          },
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Pain Feed API did not return records.");
      }

      const rows = [
        ...(Array.isArray(data.pains) ? data.pains : []),
        ...(Array.isArray(data.items) ? data.items : []),
        ...(Array.isArray(data.signals) ? data.signals : []),
        ...(Array.isArray(data.data) ? data.data : []),
      ];

      const seen = new Set<string>();
      const unique = rows.filter((row) => {
        const key = first(row.canonical_event_id, row.pain_id, row.item_id, row.id, row.signal_id, titleOf(row));
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setItems(unique);
      setStatus(unique.length ? "" : "No pain records found. Submit a new Pain Room or refresh after deploy.");
    } catch (error: any) {
      setItems([]);
      setStatus(error?.message || "Could not load Pain Feed.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(232,196,107,.12), transparent 28%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
        color: "white",
        padding: "20px 16px 120px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <style>{`
        @media (max-width: 760px) {
          .pain-grid { grid-template-columns: 1fr !important; }
          .pain-actions { display: grid !important; grid-template-columns: 1fr !important; }
          .pain-actions > * { width: 100%; box-sizing: border-box; }
        }
      `}</style>

      <div style={{ width: "min(1350px,100%)", margin: "0 auto" }}>
        <section
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            paddingBottom: 14,
            backdropFilter: "blur(16px)",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              background: "rgba(5,10,20,.88)",
              border: "1px solid rgba(232,196,107,.18)",
              borderRadius: 20,
              padding: 12,
            }}
          >
            <Link href="/dashboard" style={navBtn}>Dashboard</Link>
            <Link href="/projects" style={navBtn}>Projects</Link>
            <Link href="/pain" style={navBtn}>Submit Pain</Link>
            <Link href="/messages" style={navBtn}>Messages</Link>
            <button type="button" onClick={load} style={{ ...navBtn, cursor: "pointer" }}>Refresh</button>
          </div>
        </section>

        <section style={{ margin: "18px 0 28px" }}>
          <div
            style={{
              color: "#e8c46b",
              fontWeight: 950,
              letterSpacing: ".18em",
              textTransform: "uppercase",
              fontSize: 12,
            }}
          >
            VaultForge Problem Solver Intelligence
          </div>

          <h1
            style={{
              fontSize: "clamp(52px,10vw,92px)",
              lineHeight: 0.9,
              margin: "10px 0 16px",
              letterSpacing: "-.07em",
            }}
          >
            Pain Feed
          </h1>

          <p style={{ color: "#cbd5e1", maxWidth: 980, fontSize: 18, lineHeight: 1.5 }}>
            Operational problem rooms for distressed situations, funding gaps,
            contractor issues, stalled projects, exits, tenant issues, and execution bottlenecks.
          </p>

          <div style={{ marginTop: 12, color: "#94a3b8", fontWeight: 800 }}>
            Signed in: {email || "unknown"} · Records: {items.length}
          </div>

          {status ? (
            <div
              style={{
                marginTop: 16,
                border: "1px solid rgba(232,196,107,.20)",
                borderRadius: 18,
                padding: 16,
                color: "#f8e7b0",
                background: "rgba(232,196,107,.06)",
              }}
            >
              {status}
            </div>
          ) : null}
        </section>

        <section className="pain-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(360px,1fr))", gap: 18 }}>
          {items.map((row, index) => {
            const id = idOf(row);
            const image = photoOf(row);
            const contactHref = signalIdOf(row)
              ? `/connect/${encodeURIComponent(signalIdOf(row))}?to=${encodeURIComponent(ownerOf(row))}&source=pain&type=pain&folder=pain&folder_key=pain&item_id=${encodeURIComponent(id)}&title=${encodeURIComponent(titleOf(row))}&subject=${encodeURIComponent(titleOf(row))}`
              : `/messages/new?to=${encodeURIComponent(ownerOf(row))}&source=pain&type=pain&folder=pain&folder_key=pain&item_id=${encodeURIComponent(id)}&title=${encodeURIComponent(titleOf(row))}&subject=${encodeURIComponent(titleOf(row))}`;

            return (
              <article
                key={`${id}-${index}`}
                style={{
                  border: "1px solid rgba(232,196,107,.18)",
                  borderRadius: 28,
                  overflow: "hidden",
                  background: "rgba(255,255,255,.04)",
                  boxShadow: "0 22px 70px rgba(0,0,0,.26)",
                }}
              >
                {image ? (
                  <img
                    src={image}
                    alt={titleOf(row)}
                    style={{ width: "100%", height: 240, objectFit: "cover", display: "block" }}
                  />
                ) : null}

                <div style={{ padding: 22 }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                    <span style={chip}>{problemType(row)}</span>
                    <span style={chip}>{marketOf(row)}</span>
                    <span style={chip}>{first(row.urgency, row.urgency_level, row.priority, "Open")}</span>
                  </div>

                  <h2 style={{ fontSize: 32, lineHeight: 1, margin: "0 0 12px" }}>{titleOf(row)}</h2>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                    <Mini label="Asking / Target" value={money(first(row.asking_price, row.price, row.target_price))} />
                    <Mini label="Capital Needed" value={money(first(row.capital_needed, row.funding_needed, row.gap_amount))} />
                    <Mini label="ARV / Value" value={money(first(row.arv, row.arv_value, row.estimated_value))} />
                    <Mini label="Repairs / Scope" value={money(first(row.repair_estimate, row.repairs_needed, row.repair_scope))} />
                  </div>

                  <p style={{ color: "#dbe4ee", lineHeight: 1.6, marginBottom: 12 }}>
                    <strong>VaultForge read:</strong> This looks like a {problemType(row).toLowerCase()} pressure signal in {marketOf(row)}. Main blocker: {bottleneck(row).toLowerCase()}. Fastest move: {fastestMove(row)}
                  </p>

                  <p style={{ color: "#94a3b8", lineHeight: 1.6, marginBottom: 18 }}>{summaryOf(row)}</p>

                  <div className="pain-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Link href={contactHref} style={mainBtn}>Contact Owner</Link>
                    <Link href={`/pain-room/${encodeURIComponent(id)}`} style={ghostBtn}>Open Room</Link>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,.10)",
        borderRadius: 14,
        padding: 10,
        background: "rgba(0,0,0,.15)",
      }}
    >
      <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".08em" }}>
        {label}
      </div>
      <div style={{ fontWeight: 950, marginTop: 4 }}>{value}</div>
    </div>
  );
}

const chip: React.CSSProperties = {
  border: "1px solid rgba(157,243,191,.22)",
  background: "rgba(157,243,191,.08)",
  color: "#9df3bf",
  borderRadius: 999,
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 900,
};
