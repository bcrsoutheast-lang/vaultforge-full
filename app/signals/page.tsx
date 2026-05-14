
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

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

const PAYLOAD_START = "VF_PAIN_PAYLOAD_START";
const PAYLOAD_END = "VF_PAIN_PAYLOAD_END";

function stripPayload(value: unknown) {
  let text = clean(value);

  const marker = text.indexOf(PAYLOAD_START);
  if (marker !== -1) text = text.slice(0, marker).trim();

  const jsonStart = text.indexOf('{"pain_id"');
  if (jsonStart !== -1) text = text.slice(0, jsonStart).trim();

  return text;
}

function extractPayload(row: Row) {
  const candidates = [
    row.note,
    row.notes,
    row.summary,
    row.description,
    row.message,
    row.body,
    row.route_summary,
    row.routing_summary,
    row.ai_summary,
    meta(row).note,
    meta(row).notes,
    meta(row).summary,
    meta(row).description,
    meta(row).message,
    meta(row).route_summary,
    meta(row).routing_summary,
    meta(row).ai_summary,
  ].map(clean);

  for (const text of candidates) {
    const start = text.indexOf(PAYLOAD_START);
    const end = text.indexOf(PAYLOAD_END);

    if (start !== -1 && end !== -1 && end > start) {
      const raw = text.slice(start + PAYLOAD_START.length, end).trim();
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") return parsed as Row;
      } catch {
        // continue
      }
    }

    const jsonStart = text.indexOf('{"pain_id"');
    if (jsonStart !== -1) {
      const raw = text.slice(jsonStart).trim();
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") return parsed as Row;
      } catch {
        // continue
      }
    }
  }

  return {};
}

function merged(row: Row) {
  const m = meta(row);
  const payload = extractPayload(row);
  return { ...row, ...m, ...payload };
}

function money(value: unknown) {
  const text = clean(value);
  if (!text) return "Not listed";
  const number = Number(text.replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(number)) return text;
  return number.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function smartField(row: Row, ...keys: string[]) {
  const r = merged(row);
  return first(...keys.map((key) => r[key]));
}

function titleOf(row: Row) {
  return smartField(row, "title", "signal_title", "event_title", "alert_title", "pain_title", "problem_title", "headline", "subject", "name") || "VaultForge Intelligence";
}

function noteOf(row: Row) {
  const cleanDirect = stripPayload(
    first(
      row.note,
      row.notes,
      row.summary,
      row.description,
      row.message,
      row.body,
      row.route_summary,
      row.routing_summary,
      row.ai_summary,
      meta(row).note,
      meta(row).summary,
      meta(row).description,
      meta(row).message
    )
  );

  if (cleanDirect && cleanDirect.length > 12) return cleanDirect;

  const r = merged(row);
  const pieces = [
    r.pain_title ? `Pain: ${r.pain_title}` : "",
    r.pain_type || r.problem_type ? `Type: ${first(r.pain_type, r.problem_type)}` : "",
    r.asset_type || r.asset_class ? `Asset: ${first(r.asset_type, r.asset_class)}` : "",
    r.city || r.state || r.market ? `Market: ${[first(r.city), first(r.state, r.market, r.operating_state)].filter(Boolean).join(", ")}` : "",
    r.urgency || r.priority ? `Urgency: ${first(r.urgency, r.priority, r.urgency_level)}` : "",
    r.help_requested || r.requested_help ? `Need: ${first(r.help_requested, r.requested_help)}` : "",
    r.primary_bottleneck ? `Bottleneck: ${r.primary_bottleneck}` : "",
    r.fastest_path ? `Next: ${r.fastest_path}` : "",
  ].filter(Boolean);

  return pieces.join(" • ") || "AI background intelligence record. Open the related room for full context.";
}

function signalIdOf(row: Row) {
  return smartField(row, "signal_id", "signalId", "alert_id", "routing_id", "id");
}

function itemIdOf(row: Row) {
  return smartField(row, "item_id", "itemId", "pain_id", "request_id", "deal_id", "project_id");
}

function ownerEmailOf(row: Row) {
  return cleanEmail(smartField(row, "owner_email", "submitted_by_email", "created_by_email", "member_email", "target_email", "recipient_email", "email"));
}

function imgOf(row: Row) {
  const r = merged(row);
  const photos = Array.isArray(r.photos) ? r.photos : [];
  const photoUrls = Array.isArray(r.photo_urls) ? r.photo_urls : [];
  const files = Array.isArray(r.files) ? r.files : [];
  const uploads = Array.isArray(r.uploads) ? r.uploads : [];

  return first(
    r.image_url,
    r.photo_url,
    r.primary_photo_url,
    r.main_photo_url,
    photoUrls[0],
    photos[0]?.url,
    photos[0],
    files[0]?.url,
    files[0],
    uploads[0]?.url,
    uploads[0]
  );
}

function connectHref(row: Row, email: string) {
  const signalId = signalIdOf(row);
  if (!signalId) return "/messages";

  const query = new URLSearchParams();
  if (email) query.set("email", email);
  const itemId = itemIdOf(row);
  if (itemId) query.set("item_id", itemId);

  return `/connect/${encodeURIComponent(signalId)}?${query.toString()}`;
}

function marketOf(row: Row) {
  const city = smartField(row, "city");
  const state = smartField(row, "state", "market", "operating_state");
  return [city, state].filter(Boolean).join(", ") || "Market not listed";
}

function tagsOf(row: Row) {
  const r = merged(row);
  const values = [
    first(r.pain_type, r.problem_type, r.asset_type, r.asset_class),
    first(r.urgency, r.priority, r.urgency_level),
    marketOf(row),
    first(r.primary_bottleneck),
  ].filter(Boolean);

  return Array.from(new Set(values)).slice(0, 4);
}

function economicsOf(row: Row) {
  const r = merged(row);
  return [
    ["Ask", money(first(r.asking_price, r.price, r.target_price))],
    ["ARV", money(first(r.arv, r.arv_value, r.estimated_value, r.property_value))],
    ["Repairs", money(first(r.repair_estimate, r.repairs_needed, r.repair_budget))],
  ];
}

function bestMoveOf(row: Row) {
  return smartField(row, "fastest_path", "best_next_move", "next_move") || "Open the related room, verify context, and message the owner if the opportunity fits.";
}

function shouldSeeOf(row: Row) {
  const r = merged(row);
  const raw = r.who_should_see || r.suggested_resolution_stack;
  if (Array.isArray(raw)) return raw.map(clean).filter(Boolean).slice(0, 5);
  const text = first(raw);
  if (text) return text.split(/[,\n|;]/).map(clean).filter(Boolean).slice(0, 5);
  return ["Buyer", "Operator", "Capital"];
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
  border: "1px solid rgba(232,196,107,.28)",
  borderRadius: 28,
  padding: 24,
  background: "rgba(255,255,255,.06)",
  marginBottom: 16,
  boxShadow: "0 24px 80px rgba(0,0,0,.26)",
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
  minHeight: 48,
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

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.08)",
  color: "white",
  padding: 14,
  fontSize: 16,
  outline: "none",
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

function RecordCard({ row, email, mode }: { row: Row; email: string; mode: "alerts" | "routing" | "introductions" | "signals" }) {
  const signalId = signalIdOf(row);
  const itemId = itemIdOf(row);
  const image = imgOf(row);
  const owner = ownerEmailOf(row);
  const signalHref = signalId ? `/signals/${encodeURIComponent(signalId)}` : "/signals";
  const roomHref = itemId ? `/pain-room/${encodeURIComponent(itemId)}` : signalHref;

  return (
    <article style={card}>
      {image ? (
        <div style={{ borderRadius: 22, overflow: "hidden", border: "1px solid rgba(232,196,107,.22)", marginBottom: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={titleOf(row)} style={{ width: "100%", maxHeight: 260, objectFit: "cover", display: "block" }} />
        </div>
      ) : null}

      <p style={eyebrow}>AI Background Intelligence</p>
      <h2 style={{ fontSize: 34, lineHeight: 1, margin: "0 0 10px" }}>{titleOf(row)}</h2>
      <p style={{ ...muted, fontSize: 17 }}>{noteOf(row)}</p>

      <div style={{ marginTop: 12 }}>
        {tagsOf(row).map((tag) => <span key={tag} style={chip}>{tag}</span>)}
      </div>

      <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 10, marginTop: 14 }}>
        {economicsOf(row).map(([labelText, value]) => (
          <div key={labelText} style={{ border: "1px solid rgba(255,255,255,.10)", borderRadius: 16, padding: 12, background: "rgba(0,0,0,.18)" }}>
            <div style={{ ...eyebrow, fontSize: 10 }}>{labelText}</div>
            <div style={{ fontSize: 18, fontWeight: 950, marginTop: 6 }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ border: "1px solid rgba(232,196,107,.20)", borderRadius: 18, padding: 14, background: "rgba(232,196,107,.06)", marginTop: 14 }}>
        <div style={eyebrow}>Best Next Move</div>
        <p style={{ ...muted, margin: "8px 0 0" }}>{bestMoveOf(row)}</p>
      </div>

      <div style={{ marginTop: 12 }}>
        {shouldSeeOf(row).map((item) => <span key={item} style={chip}>{item}</span>)}
        {owner ? <span style={chip}>Owner: {owner}</span> : null}
      </div>

      <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
        <Link href="/dashboard" style={ghost}>Dashboard</Link>
        <Link href={roomHref} style={button}>Open Related Room</Link>
        {signalId ? <Link href={connectHref(row, email)} style={ghost}>Message Owner</Link> : null}
      </div>
    </article>
  );
}

export default function CommandPage() {
  const [email, setEmail] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState("Loading signals...");
  const [search, setSearch] = useState("");

  async function load() {
    const viewer = getEmail();
    setEmail(viewer);
    setStatus("Loading signals...");

    try {
      const collected: Row[] = [];
      const urls = [
        `/api/pain/feed?email=${encodeURIComponent(viewer)}&owner=0`,
        `/api/intelligence/feed?email=${encodeURIComponent(viewer)}&owner=0`,
        `/api/routing/actions?email=${encodeURIComponent(viewer)}&owner=0`,
      ];

      for (const url of urls) {
        try {
          const res = await fetch(url, {
            cache: "no-store",
            headers: { "x-vf-email": viewer || "", "x-vf-admin": "0" },
          });
          const data = await safeJson(res);
          const list = Array.isArray(data.signals)
            ? data.signals
            : Array.isArray(data.pains)
            ? data.pains
            : Array.isArray(data.actions)
            ? data.actions
            : Array.isArray(data.data)
            ? data.data
            : [];
          if (Array.isArray(list)) collected.push(...list);
        } catch {
          // Keep page alive if one feed is unavailable.
        }
      }

      const seen = new Set<string>();
      const unique = collected.filter((row) => {
        const key = first(signalIdOf(row), itemIdOf(row), row.id, titleOf(row) + noteOf(row));
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setRows(unique);
      setStatus(unique.length ? "" : "No signals records found yet.");
    } catch (error: any) {
      setStatus(error?.message || "Could not load signals.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((row) =>
      [titleOf(row), noteOf(row), signalIdOf(row), itemIdOf(row), ownerEmailOf(row)]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, search]);

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }
        input::placeholder {
          color: rgba(255,255,255,.42);
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
        <VaultForgeMemberNav title="AI Background Intelligence" subtitle="Clean intelligence records. Routing stays behind the scenes." active="dashboard" />

        <section style={card}>
          <p style={eyebrow}>VaultForge Background Intelligence</p>
          <h1 style={{ fontSize: "clamp(50px,10vw,92px)", lineHeight: 0.88, margin: "10px 0 18px", letterSpacing: "-.06em" }}>
            AI intelligence records.
          </h1>
          <p style={{ ...muted, fontSize: 18 }}>Clean background intelligence surfaced only when needed. No raw payloads, no internal routing clutter.</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
            <span style={chip}>Signed in: {email || "unknown"}</span>
            <span style={chip}>Records: {rows.length}</span>
          </div>
          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            <Link href="/dashboard" style={button}>Dashboard</Link>
            <button type="button" onClick={load} style={ghost}>Refresh</button>
            <Link href="/messages" style={ghost}>Messages</Link>
          </div>
        </section>

        <section style={card}>
          <p style={eyebrow}>Search</p>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search title, owner, market, summary..."
            style={input}
          />
        </section>

        {status ? <section style={card}>{status}</section> : null}

        <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(330px,1fr))", gap: 16 }}>
          {filtered.map((row, index) => (
            <RecordCard key={`${signalIdOf(row)}-${itemIdOf(row)}-${row.id || index}`} row={row} email={email} mode="signals" />
          ))}
        </section>
      </div>
    </main>
  );
}