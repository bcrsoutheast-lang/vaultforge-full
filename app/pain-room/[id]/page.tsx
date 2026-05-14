"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Row = Record<string, any>;

const PAYLOAD_START = "VF_PAIN_PAYLOAD_START";
const PAYLOAD_END = "VF_PAIN_PAYLOAD_END";

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
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

function parseArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(clean).filter(Boolean);

  const text = clean(value);
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.map(clean).filter(Boolean);
  } catch {
    // Continue.
  }

  return text.split(/[,\n|;]/).map((item) => item.trim()).filter(Boolean);
}

function extractEmbeddedPayload(row: Row | null) {
  if (!row) return {};

  const sources = [
    row.summary,
    row.description,
    row.notes,
    row.ai_summary,
    row.route_summary,
    row.routing_summary,
    row.metadata?.summary,
    row.metadata?.description,
    row.metadata?.notes,
  ].map(clean);

  for (const source of sources) {
    const start = source.indexOf(PAYLOAD_START);
    const end = source.indexOf(PAYLOAD_END);

    if (start === -1 || end === -1 || end <= start) continue;

    const raw = source.slice(start + PAYLOAD_START.length, end).trim();

    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed as Row;
    } catch {
      // Try next.
    }
  }

  return {};
}

function meta(row: Row | null) {
  const m = row && typeof row.metadata === "object" && row.metadata ? row.metadata : {};
  const embedded = extractEmbeddedPayload(row);
  return { ...m, ...embedded };
}

function field(row: Row | null, ...keys: string[]) {
  if (!row) return "";

  const m = meta(row);
  const values: unknown[] = [];

  for (const key of keys) {
    values.push(m[key]);
    values.push(row[key]);
  }

  return first(...values);
}

function stripPayload(value: unknown) {
  let text = clean(value);

  const start = text.indexOf(PAYLOAD_START);
  if (start !== -1) text = text.slice(0, start).trim();

  const jsonStart = text.indexOf('{"pain_id"');
  if (jsonStart !== -1) text = text.slice(0, jsonStart).trim();

  return text;
}

function cleanDisplayText(value: unknown) {
  return stripPayload(value) || "";
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

function numberValue(value: unknown) {
  const text = clean(value);
  const number = Number(text.replace(/[^\d.-]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

function photoUrl(item: any) {
  if (typeof item === "string") return clean(item);

  if (item && typeof item === "object") {
    return clean(item.url || item.publicUrl || item.public_url || item.photo_url || item.image_url || item.main_photo_url || item.src);
  }

  return "";
}

function photosOf(row: Row | null) {
  if (!row) return [];

  const m = meta(row);

  const values = [
    row.main_photo_url,
    row.image_url,
    row.photo_url,
    row.primary_photo_url,
    m.main_photo_url,
    m.image_url,
    m.photo_url,
    m.primary_photo_url,
    ...parseArray(row.photo_urls),
    ...parseArray(row.photos),
    ...parseArray(row.files),
    ...parseArray(m.photo_urls),
    ...parseArray(m.photos),
    ...parseArray(m.files),
  ];

  return Array.from(new Set(values.map(photoUrl).filter((url) => url.startsWith("http"))));
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

function idOf(row: Row | null) {
  return field(row, "id", "pain_id", "request_id", "item_id", "signal_id", "alert_id");
}

function signalIdOf(row: Row | null) {
  return field(row, "signal_id", "signalId", "alert_id", "routing_id");
}

function titleOf(row: Row | null) {
  return field(row, "title", "pain_title", "problem_title", "headline", "name", "address") || "Pain Room";
}

function ownerOf(row: Row | null) {
  return cleanEmail(field(row, "owner_email", "member_email", "user_email", "submitted_by_email", "created_by_email", "email"));
}

function marketOf(row: Row | null) {
  const city = field(row, "city");
  const state = field(row, "state", "market", "operating_state");

  return [city, state].filter(Boolean).join(", ") || field(row, "location", "address") || "Market not listed";
}

function assetClass(row: Row | null) {
  const raw = field(row, "asset_class", "asset_type", "property_type", "deal_type", "pain_type", "problem_type");
  const lower = raw.toLowerCase();

  if (lower.includes("multi")) return "Multifamily";
  if (lower.includes("commercial")) return "Commercial";
  if (lower.includes("land") || lower.includes("acre")) return "Land";
  if (lower.includes("residential") || lower.includes("house") || lower.includes("single")) return "Residential";

  return raw || "Not listed";
}

function assetOf(row: Row | null) {
  return field(row, "pain_type", "problem_type", "asset_type", "property_type", "deal_type") || "Problem";
}

function urgencyOf(row: Row | null) {
  return field(row, "urgency", "urgency_level", "priority", "timeline_pressure") || "Not listed";
}

function statusOf(row: Row | null) {
  return field(row, "status", "pain_status", "routing_status", "stage") || "Open";
}

function ownerGoal(row: Row | null) {
  return field(row, "owner_goal", "goal", "desired_outcome", "exit_strategy", "strategy", "what_do_you_want", "requested_help", "help_requested") || "Not listed";
}

function problemText(row: Row | null) {
  return cleanDisplayText(
    field(
      row,
      "problem_description",
      "pain_description",
      "description",
      "summary",
      "ai_summary",
      "note",
      "notes",
      "message",
      "help_requested",
      "requested_help",
      "route_summary",
      "ai_route_summary",
      "routing_summary"
    )
  ) || "Problem details are pending.";
}

function clamp(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function pressureScore(row: Row | null) {
  const text = `${problemText(row)} ${urgencyOf(row)} ${field(row, "distress_signals", "pressure_signals", "seller_situation")}`.toLowerCase();
  let score = 34;

  if (text.includes("urgent")) score += 25;
  if (text.includes("foreclosure")) score += 28;
  if (text.includes("funding gap")) score += 22;
  if (text.includes("stalled")) score += 18;
  if (text.includes("contractor")) score += 12;
  if (text.includes("tenant")) score += 12;
  if (text.includes("permit") || text.includes("city") || text.includes("code")) score += 15;
  if (text.includes("fast close") || text.includes("deadline")) score += 20;

  return clamp(score);
}

function resolutionScore(row: Row | null) {
  let score = 38;

  if (field(row, "city", "state", "market")) score += 10;
  if (field(row, "asset_type", "property_type", "pain_type", "problem_type")) score += 10;
  if (field(row, "requested_help", "help_requested", "routing_needs", "needs")) score += 14;
  if (photosOf(row).length) score += 12;
  if (problemText(row) && problemText(row) !== "Problem details are pending.") score += 14;

  return clamp(score);
}

function primaryBottleneck(row: Row | null) {
  const direct = field(row, "primary_bottleneck");
  if (direct) return direct;

  const text = `${problemText(row)} ${field(row, "capital_needed", "funding_needed", "gap_amount")} ${field(row, "requested_help", "help_requested")}`.toLowerCase();

  if (text.includes("capital") || text.includes("funding") || text.includes("lender") || text.includes("gap")) return "Capital / Funding Gap";
  if (text.includes("contractor") || text.includes("repair") || text.includes("construction")) return "Contractor / Execution Gap";
  if (text.includes("buyer") || text.includes("sell") || text.includes("exit")) return "Buyer / Exit Gap";
  if (text.includes("permit") || text.includes("city") || text.includes("code")) return "Permit / City Issue";
  if (text.includes("tenant") || text.includes("lease")) return "Tenant / Occupancy Issue";

  return "Owner Review Needed";
}

function fastestPath(row: Row | null) {
  const direct = field(row, "fastest_path");
  if (direct) return direct;

  const bottleneck = primaryBottleneck(row);

  if (bottleneck.includes("Capital")) return "Verify numbers, confirm funding gap, route to private lender or JV capital.";
  if (bottleneck.includes("Contractor")) return "Confirm scope/photos, get repair pricing, route to contractor or operator.";
  if (bottleneck.includes("Buyer")) return "Package asset facts, confirm seller timeline, route to qualified buyer.";
  if (bottleneck.includes("Permit")) return "Identify municipality issue, timeline, and route to local operator.";
  if (bottleneck.includes("Tenant")) return "Clarify lease, access, occupancy, and legal constraints before routing.";

  return "Clarify missing decision details, then route to the best operator.";
}

function whoShouldSee(row: Row | null) {
  const raw = meta(row).who_should_see || meta(row).suggested_resolution_stack;

  if (Array.isArray(raw)) return raw.map(clean).filter(Boolean);

  const text = `${problemText(row)} ${field(row, "requested_help", "help_requested", "routing_needs", "needs")} ${field(row, "distress_signals")} ${primaryBottleneck(row)}`.toLowerCase();
  const stack: string[] = [];

  if (text.includes("buyer") || text.includes("sell") || text.includes("fast close")) stack.push("Buyer");
  if (text.includes("funding") || text.includes("capital") || text.includes("lender")) stack.push("Lender");
  if (text.includes("contractor") || text.includes("repair") || text.includes("construction")) stack.push("Contractor");
  if (text.includes("jv") || text.includes("partner") || text.includes("operator")) stack.push("Operator / JV Partner");
  if (text.includes("tenant") || text.includes("permit") || text.includes("city") || text.includes("code")) stack.push("Local Operator");
  if (text.includes("attorney") || text.includes("probate") || text.includes("title")) stack.push("Attorney / Title");

  if (!stack.length) stack.push("Owner Review", "Operator", "Buyer");

  return Array.from(new Set(stack));
}

function missingInfo(row: Row | null) {
  const missing: string[] = [];

  if (!field(row, "timeline", "deadline", "desired_timeline")) missing.push("timeline");
  if (!field(row, "contact_phone", "phone", "owner_phone")) missing.push("best contact");
  if (!field(row, "requested_help", "help_requested", "routing_needs", "needs")) missing.push("exact ask");

  return missing;
}

function spreadText(row: Row | null) {
  const ask = numberValue(field(row, "asking_price", "price", "target_price"));
  const arv = numberValue(field(row, "arv", "arv_value", "estimated_value", "property_value"));
  const repairs = numberValue(field(row, "repair_estimate", "repairs_needed", "estimated_repairs", "repair_budget"));

  if (!ask || !arv) return "Not enough pricing data";

  const spread = arv - ask - repairs;
  return money(spread);
}

function executiveBrief(row: Row | null) {
  const asset = assetClass(row);
  const market = marketOf(row);
  const problem = assetOf(row);
  const urgency = urgencyOf(row);
  const bottleneck = primaryBottleneck(row);
  const path = fastestPath(row);

  return `${asset} ${problem.toLowerCase()} in ${market}. Urgency: ${urgency}. Primary constraint: ${bottleneck}. Recommended move: ${path}`;
}

function routeStackText(row: Row | null) {
  return whoShouldSee(row).join(" → ");
}

function signalTone(row: Row | null) {
  const score = pressureScore(row);

  if (score >= 75) return { label: "High pressure", color: "#fecaca", border: "rgba(248,113,113,.34)", bg: "rgba(248,113,113,.10)" };
  if (score >= 55) return { label: "Active pressure", color: "#f8e7b0", border: "rgba(232,196,107,.34)", bg: "rgba(232,196,107,.09)" };

  return { label: "Monitor", color: "#cbd5e1", border: "rgba(148,163,184,.22)", bg: "rgba(148,163,184,.06)" };
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at 16% 0%, rgba(232,196,107,.16), transparent 30%), radial-gradient(circle at 92% 9%, rgba(248,113,113,.12), transparent 26%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "18px 14px 90px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  width: "min(1220px,100%)",
  margin: "0 auto",
};

const panel: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.22)",
  borderRadius: 26,
  padding: 20,
  background: "linear-gradient(145deg,rgba(255,255,255,.060),rgba(255,255,255,.025))",
  boxShadow: "0 24px 78px rgba(0,0,0,.28)",
};

const tightPanel: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 18,
  padding: 14,
  background: "rgba(0,0,0,.16)",
};

const label: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".17em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 11,
};

const muted: React.CSSProperties = {
  color: "#cbd5e1",
  lineHeight: 1.55,
};

const button: React.CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: 48,
  borderRadius: 999,
  padding: "11px 17px",
  border: 0,
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
  fontWeight: 950,
  textDecoration: "none",
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
  fontSize: 12,
  fontWeight: 850,
  display: "inline-flex",
};

function MiniMetric({ labelText, value, emphasis = false }: { labelText: string; value: unknown; emphasis?: boolean }) {
  return (
    <div style={tightPanel}>
      <div style={label}>{labelText}</div>
      <div style={{ fontSize: emphasis ? 28 : 20, fontWeight: 950, marginTop: 8, lineHeight: 1.05 }}>
        {clean(value) || "Not listed"}
      </div>
    </div>
  );
}

function ScoreStrip({ labelText, value }: { labelText: string; value: number }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontWeight: 950, fontSize: 12 }}>
        <span>{labelText}</span>
        <span>{value}%</span>
      </div>
      <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,.12)", overflow: "hidden", marginTop: 8 }}>
        <div style={{ width: `${value}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#ff6b6b,#f8e7b0,#56d8ff)" }} />
      </div>
    </div>
  );
}

function DetailLine({ labelText, value }: { labelText: string; value: unknown }) {
  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,.08)", padding: "11px 0" }}>
      <div style={{ ...label, fontSize: 10 }}>{labelText}</div>
      <div style={{ ...muted, marginTop: 5, fontWeight: 750 }}>{clean(value) || "Not listed"}</div>
    </div>
  );
}

export default function PainRoomPage() {
  const [email, setEmail] = useState("");
  const [pain, setPain] = useState<Row | null>(null);
  const [status, setStatus] = useState("Loading Pain Room...");

  async function load() {
    const viewer = getEmail();
    setEmail(viewer);

    const pathParts = window.location.pathname.split("/").filter(Boolean);
    const id = decodeURIComponent(pathParts[pathParts.length - 1] || "");

    if (!id) {
      setStatus("Missing Pain Room ID.");
      return;
    }

    try {
      const owner = viewer === "bcrsoutheast@gmail.com";
      const ownerFlag = owner ? "1" : "0";

      const response = await fetch(`/api/pain/feed?id=${encodeURIComponent(id)}&email=${encodeURIComponent(viewer)}&owner=${ownerFlag}`, {
        cache: "no-store",
        credentials: "include",
        headers: {
          "x-vf-email": viewer,
          "x-vf-admin": ownerFlag,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data?.ok === false) {
        throw new Error(data?.error || "Pain record not found.");
      }

      const found = data.pain || (Array.isArray(data.pains) ? data.pains[0] : null) || null;

      if (!found) {
        setStatus("Pain record not found.");
        return;
      }

      setPain(found);
      setStatus("");
    } catch (error: any) {
      setStatus(error?.message || "Could not load Pain Room.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const photos = useMemo(() => photosOf(pain), [pain]);
  const heroPhoto = photos[0] || "";
  const signalId = signalIdOf(pain);
  const owner = ownerOf(pain);
  const tone = signalTone(pain);
  const contactHref = signalId
    ? `/connect/${encodeURIComponent(signalId)}?email=${encodeURIComponent(email)}${owner ? `&to=${encodeURIComponent(owner)}` : ""}&source=pain&type=pain&folder=pain&folder_key=pain&title=${encodeURIComponent(titleOf(pain))}&subject=${encodeURIComponent(titleOf(pain))}`
    : `/messages/new?email=${encodeURIComponent(email)}${owner ? `&to=${encodeURIComponent(owner)}` : ""}&source=pain&type=pain&folder=pain&folder_key=pain&title=${encodeURIComponent(titleOf(pain))}&subject=${encodeURIComponent(titleOf(pain))}`;

  return (
    <main style={page}>
      <style>{`
        @media (max-width: 860px) {
          .vf-main-grid,
          .vf-metric-grid,
          .vf-detail-grid,
          .vf-actions,
          .vf-lower-grid {
            grid-template-columns: 1fr !important;
          }

          .vf-actions {
            display: grid !important;
            gap: 10px !important;
          }

          .vf-actions > * {
            width: 100%;
            box-sizing: border-box;
            justify-content: center;
          }

          .vf-hero-title {
            font-size: 54px !important;
          }
        }
      `}</style>

      <div style={wrap}>
        <section className="vf-main-grid" style={{ display: "grid", gridTemplateColumns: "1.05fr .95fr", gap: 16, marginBottom: 16 }}>
          <div style={{ ...panel, padding: 0, overflow: "hidden" }}>
            {heroPhoto ? (
              <img src={heroPhoto} alt="Pain context" style={{ width: "100%", height: 330, objectFit: "cover", display: "block" }} />
            ) : (
              <div style={{ height: 260, display: "grid", placeItems: "center", color: "#94a3b8", fontWeight: 900 }}>No photo attached</div>
            )}

            <div style={{ padding: 20 }}>
              <div style={label}>VaultForge Problem Command Center</div>
              <h1 className="vf-hero-title" style={{ fontSize: "clamp(52px,8vw,88px)", lineHeight: .88, letterSpacing: "-.07em", margin: "10px 0 12px" }}>
                {pain ? titleOf(pain) : "Pain Room"}
              </h1>

              {status ? <p style={{ ...muted, fontSize: 18 }}>{status}</p> : null}

              {pain ? (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                  <span style={chip}>{statusOf(pain)}</span>
                  <span style={chip}>{urgencyOf(pain)}</span>
                  <span style={chip}>{assetClass(pain)}</span>
                  <span style={chip}>{marketOf(pain)}</span>
                </div>
              ) : null}
            </div>
          </div>

          <aside style={{ ...panel, display: "grid", gap: 14 }}>
            <div>
              <div style={label}>Executive Brief</div>
              <p style={{ ...muted, fontSize: 19, margin: "9px 0 0" }}>
                {pain ? executiveBrief(pain) : "Loading command intelligence..."}
              </p>
            </div>

            <div style={{ border: `1px solid ${tone.border}`, background: tone.bg, borderRadius: 18, padding: 14 }}>
              <div style={{ ...label, color: tone.color }}>Pressure Signal · {tone.label}</div>
              <div style={{ color: tone.color, fontSize: 24, fontWeight: 950, marginTop: 8 }}>{primaryBottleneck(pain)}</div>
            </div>

            <div style={tightPanel}>
              <div style={label}>Best Next Move</div>
              <div style={{ fontSize: 22, lineHeight: 1.25, fontWeight: 950, marginTop: 8 }}>{fastestPath(pain)}</div>
            </div>

            <div style={tightPanel}>
              <div style={label}>Route Stack</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                {whoShouldSee(pain).map((item) => (
                  <span key={item} style={chip}>{item}</span>
                ))}
              </div>
            </div>

            <div className="vf-actions" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Link href={contactHref} style={button}>Contact Owner</Link>
              <Link href="/pain-feed" style={ghost}>Pain Feed</Link>
              <Link href="/dashboard" style={ghost}>Dashboard</Link>
              <button type="button" onClick={load} style={ghost}>Refresh</button>
            </div>
          </aside>
        </section>

        {pain ? (
          <>
            <section style={{ ...panel, marginBottom: 16 }}>
              <div style={label}>Live Intelligence Read</div>

              <div className="vf-metric-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 14, marginTop: 14 }}>
                <ScoreStrip labelText="Pressure" value={pressureScore(pain)} />
                <ScoreStrip labelText="Readiness" value={resolutionScore(pain)} />
                <ScoreStrip labelText="Asset Context" value={photos.length ? 76 : 42} />
                <ScoreStrip labelText="Execution Risk" value={missingInfo(pain).length ? 72 : 38} />
              </div>

              <div className="vf-detail-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12, marginTop: 16 }}>
                <MiniMetric labelText="Ask / Target" value={money(field(pain, "asking_price", "price", "target_price"))} emphasis />
                <MiniMetric labelText="ARV / Value" value={money(field(pain, "arv", "arv_value", "estimated_value", "property_value"))} emphasis />
                <MiniMetric labelText="Repairs / Scope" value={money(field(pain, "repair_estimate", "repairs_needed", "estimated_repairs", "repair_budget"))} emphasis />
                <MiniMetric labelText="Spread Read" value={spreadText(pain)} emphasis />
              </div>
            </section>

            <section className="vf-lower-grid" style={{ display: "grid", gridTemplateColumns: "1.15fr .85fr", gap: 16, marginBottom: 16 }}>
              <div style={panel}>
                <div style={label}>Situation Brief</div>
                <p style={{ ...muted, fontSize: 18, marginTop: 10 }}>{problemText(pain)}</p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginTop: 16 }}>
                  <MiniMetric labelText="Problem Type" value={assetOf(pain)} />
                  <MiniMetric labelText="Market / Address" value={field(pain, "address", "property_address", "location") || marketOf(pain)} />
                  <MiniMetric labelText="Owner Goal" value={ownerGoal(pain)} />
                </div>
              </div>

              <div style={panel}>
                <div style={label}>Missing / Clarify</div>
                {missingInfo(pain).length ? (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                    {missingInfo(pain).map((item) => (
                      <span key={item} style={{ ...chip, color: "#f8e7b0", borderColor: "rgba(232,196,107,.32)", background: "rgba(232,196,107,.08)" }}>{item}</span>
                    ))}
                  </div>
                ) : (
                  <p style={{ ...muted, marginTop: 10 }}>Ready for first-pass routing.</p>
                )}

                <div style={{ marginTop: 18 }}>
                  <DetailLine labelText="Contact" value={owner || email || "Not listed"} />
                  <DetailLine labelText="Timeline" value={field(pain, "timeline", "deadline", "desired_timeline", "urgency_level", "urgency")} />
                  <DetailLine labelText="Capital Needed" value={money(field(pain, "capital_needed", "funding_needed", "gap_amount"))} />
                </div>
              </div>
            </section>

            <section style={{ ...panel, marginBottom: 16 }}>
              <div style={label}>Asset Snapshot</div>
              <div className="vf-detail-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12, marginTop: 14 }}>
                <MiniMetric labelText="Beds / Baths" value={[field(pain, "beds", "bedrooms"), field(pain, "baths", "bathrooms")].filter(Boolean).join(" / ") || "Not listed"} />
                <MiniMetric labelText="Sqft / Acres" value={field(pain, "square_feet", "sqft", "building_sqft", "acres", "land_acres")} />
                <MiniMetric labelText="Occupancy" value={field(pain, "occupancy", "tenant_status", "vacancy_status")} />
                <MiniMetric labelText="Year Built" value={field(pain, "year_built")} />
                <MiniMetric labelText="Zoning" value={field(pain, "zoning", "land_use")} />
                <MiniMetric labelText="Access / Utilities" value={field(pain, "access_notes", "road_access", "utilities")} />
                <MiniMetric labelText="NOI / Rent" value={field(pain, "noi", "rent", "monthly_rent", "income")} />
                <MiniMetric labelText="Debt / Payoff" value={money(field(pain, "loan_balance", "payoff", "debt", "mortgage_balance"))} />
              </div>
            </section>

            {photos.length > 1 ? (
              <section style={{ ...panel, marginBottom: 16 }}>
                <div style={label}>Additional Photos</div>
                <div className="vf-photo-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginTop: 14 }}>
                  {photos.slice(1).map((url) => (
                    <img key={url} src={url} alt="Pain context" style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 18, border: "1px solid rgba(232,196,107,.18)" }} />
                  ))}
                </div>
              </section>
            ) : null}

            <details style={{ ...panel, marginBottom: 16 }}>
              <summary style={{ cursor: "pointer", fontWeight: 950, color: "#e8c46b", letterSpacing: ".12em", textTransform: "uppercase" }}>
                System IDs / Routing Trace
              </summary>
              <div style={{ marginTop: 14 }}>
                <DetailLine labelText="Pain ID" value={idOf(pain)} />
                <DetailLine labelText="Signal ID" value={signalId || "Not linked"} />
                <DetailLine labelText="Submitted By" value={owner || email || "Not listed"} />
              </div>
            </details>
          </>
        ) : null}
      </div>
    </main>
  );
}
