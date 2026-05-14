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

function cleanDisplayText(value: unknown) {
  let text = clean(value);
  const start = text.indexOf(PAYLOAD_START);
  if (start !== -1) text = text.slice(0, start).trim();
  return text;
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
  return field(row, "primary_bottleneck") || "Owner Review Needed";
}

function fastestPath(row: Row | null) {
  return field(row, "fastest_path") || "Clarify missing details, then route to the best operator type.";
}

function whoShouldSee(row: Row | null) {
  const raw = meta(row).who_should_see || meta(row).suggested_resolution_stack;

  if (Array.isArray(raw)) return raw.map(clean).filter(Boolean);

  const text = `${problemText(row)} ${field(row, "requested_help", "help_requested", "routing_needs", "needs")} ${field(row, "distress_signals")}`.toLowerCase();
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

  if (!field(row, "requested_help", "help_requested", "routing_needs", "needs")) missing.push("specific help needed");
  if (!field(row, "urgency", "urgency_level", "timeline", "deadline")) missing.push("timeline/deadline");
  if (!field(row, "city", "state", "market")) missing.push("market");
  if (!field(row, "asset_type", "property_type", "pain_type", "problem_type")) missing.push("asset/problem type");
  if (!photosOf(row).length) missing.push("photos/files");
  if (!field(row, "contact_phone", "phone", "owner_phone")) missing.push("best phone/contact method");

  return missing;
}

function executiveRead(row: Row | null) {
  const asset = assetClass(row);
  const market = marketOf(row);
  const problem = assetOf(row);
  const urgency = urgencyOf(row);
  const bottleneck = primaryBottleneck(row);
  const ask = money(field(row, "asking_price", "price", "target_price"));
  const arv = money(field(row, "arv", "arv_value", "estimated_value", "property_value"));
  const repairs = money(field(row, "repair_estimate", "repairs_needed", "estimated_repairs", "repair_budget"));
  const capital = money(field(row, "capital_needed", "funding_needed", "gap_amount"));

  return `VaultForge reads this as a ${asset} ${problem.toLowerCase()} issue in ${market}. Urgency is ${urgency}. The main blocker is ${bottleneck.toLowerCase()}. Numbers on file: ask/target ${ask}, ARV/value ${arv}, repair/scope ${repairs}, capital need ${capital}.`;
}

function aiProblemSummary(row: Row | null) {
  const parts = [
    executiveRead(row),
    `Next move: ${fastestPath(row)}`,
    `Who should see this: ${whoShouldSee(row).join(", ")}.`,
    missingInfo(row).length ? `Missing: ${missingInfo(row).join(", ")}.` : "Ready for first-pass routing.",
  ];

  return parts.join(" ");
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.13), transparent 28%), radial-gradient(circle at 92% 12%, rgba(248,113,113,.12), transparent 28%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 96px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  width: "min(1220px,100%)",
  margin: "0 auto",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.24)",
  borderRadius: 30,
  padding: 24,
  background: "linear-gradient(145deg,rgba(255,255,255,.065),rgba(255,255,255,.030))",
  boxShadow: "0 28px 86px rgba(0,0,0,.30)",
  marginBottom: 18,
};

const glass: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 22,
  padding: 18,
  background: "rgba(255,255,255,.045)",
};

const label: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

const muted: React.CSSProperties = {
  color: "#cbd5e1",
  lineHeight: 1.6,
};

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

function ScoreBar({ labelText, value, caption }: { labelText: string; value: number; caption: string }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,.10)", borderRadius: 18, padding: 14, background: "rgba(0,0,0,.16)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12, fontWeight: 950 }}>
        <span>{labelText}</span>
        <span>{value}%</span>
      </div>
      <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,.12)", overflow: "hidden", marginTop: 10 }}>
        <div style={{ width: `${value}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#ff6b6b,#f8e7b0,#56d8ff)" }} />
      </div>
      <p style={{ ...muted, margin: "8px 0 0", fontSize: 13 }}>{caption}</p>
    </div>
  );
}

function Info({ labelText, value }: { labelText: string; value: unknown }) {
  return (
    <div style={glass}>
      <div style={label}>{labelText}</div>
      <div style={{ fontSize: 22, fontWeight: 950, marginTop: 8 }}>{clean(value) || "Not listed"}</div>
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
  const signalId = signalIdOf(pain);
  const owner = ownerOf(pain);
  const contactHref = signalId
    ? `/connect/${encodeURIComponent(signalId)}?email=${encodeURIComponent(email)}${owner ? `&to=${encodeURIComponent(owner)}` : ""}&source=pain&type=pain&folder=pain&folder_key=pain&title=${encodeURIComponent(titleOf(pain))}&subject=${encodeURIComponent(titleOf(pain))}`
    : `/messages/new?email=${encodeURIComponent(email)}${owner ? `&to=${encodeURIComponent(owner)}` : ""}&source=pain&type=pain&folder=pain&folder_key=pain&title=${encodeURIComponent(titleOf(pain))}&subject=${encodeURIComponent(titleOf(pain))}`;

  return (
    <main style={page}>
      <style>{`
        @media (max-width: 820px) {
          .vf-grid,
          .vf-actions,
          .vf-photo-grid {
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
        }
      `}</style>

      <div style={wrap}>
        <section style={card}>
          <div style={label}>VaultForge Problem Solver Intelligence</div>
          <h1 style={{ fontSize: "clamp(48px,10vw,92px)", lineHeight: 0.9, letterSpacing: "-.07em", margin: "12px 0 18px" }}>
            {pain ? titleOf(pain) : "Pain Room"}
          </h1>

          {status ? <p style={{ ...muted, fontSize: 20 }}>{status}</p> : null}

          {pain ? (
            <>
              <p style={{ ...muted, fontSize: 20, maxWidth: 980 }}>{executiveRead(pain)}</p>

              <div style={{ marginTop: 14 }}>
                <span style={chip}>Status: {statusOf(pain)}</span>
                <span style={chip}>Urgency: {urgencyOf(pain)}</span>
                <span style={chip}>Problem: {assetOf(pain)}</span>
                <span style={chip}>Market: {marketOf(pain)}</span>
              </div>

              <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
                <Link href={contactHref} style={button}>Contact Owner</Link>
                <Link href="/pain-feed" style={ghost}>Pain Feed</Link>
                <Link href="/dashboard" style={ghost}>Dashboard</Link>
                <button type="button" onClick={load} style={ghost}>Refresh</button>
              </div>
            </>
          ) : null}
        </section>

        {pain ? (
          <>
            <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 14, marginBottom: 18 }}>
              <ScoreBar labelText="Pressure" value={pressureScore(pain)} caption="Urgency, distress, timeline, and problem severity." />
              <ScoreBar labelText="Resolution Readiness" value={resolutionScore(pain)} caption="How much info exists to route the problem." />
              <ScoreBar labelText="Asset Context" value={photos.length ? 76 : 42} caption={`${photos.length} photo${photos.length === 1 ? "" : "s"} connected.`} />
              <ScoreBar labelText="Execution Risk" value={missingInfo(pain).length ? 72 : 38} caption={missingInfo(pain).length ? `Missing: ${missingInfo(pain).join(", ")}` : "Ready for first-pass routing."} />
            </section>

            {photos.length ? (
              <section style={card}>
                <div style={label}>Photos / Problem Context</div>
                <div className="vf-photo-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginTop: 14 }}>
                  {photos.map((url) => (
                    <img key={url} src={url} alt="Pain context" style={{ width: "100%", height: 230, objectFit: "cover", borderRadius: 20, border: "1px solid rgba(232,196,107,.20)" }} />
                  ))}
                </div>
              </section>
            ) : null}

            <section style={card}>
              <div style={label}>Asset Snapshot</div>
              <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 14, marginTop: 14 }}>
                <Info labelText="Asset Class" value={assetClass(pain)} />
                <Info labelText="Market / Address" value={field(pain, "address", "property_address", "location") || marketOf(pain)} />
                <Info labelText="Beds / Baths" value={[field(pain, "beds", "bedrooms"), field(pain, "baths", "bathrooms")].filter(Boolean).join(" / ") || "Not listed"} />
                <Info labelText="Sqft / Acres" value={field(pain, "square_feet", "sqft", "building_sqft", "acres", "land_acres")} />
                <Info labelText="Occupancy" value={field(pain, "occupancy", "tenant_status", "vacancy_status")} />
                <Info labelText="Zoning" value={field(pain, "zoning", "land_use")} />
                <Info labelText="Year Built" value={field(pain, "year_built")} />
                <Info labelText="Access / Utilities" value={field(pain, "access_notes", "road_access", "utilities")} />
              </div>
            </section>

            <section style={card}>
              <div style={label}>Numbers Snapshot</div>
              <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 14, marginTop: 14 }}>
                <Info labelText="Asking / Target" value={money(field(pain, "asking_price", "price", "target_price"))} />
                <Info labelText="ARV / Value" value={money(field(pain, "arv", "arv_value", "estimated_value", "property_value"))} />
                <Info labelText="Repairs / Scope" value={money(field(pain, "repair_estimate", "repairs_needed", "estimated_repairs", "repair_budget"))} />
                <Info labelText="Capital Needed" value={money(field(pain, "capital_needed", "funding_needed", "gap_amount"))} />
                <Info labelText="Debt / Payoff" value={money(field(pain, "loan_balance", "payoff", "debt", "mortgage_balance"))} />
                <Info labelText="NOI / Rent" value={field(pain, "noi", "rent", "monthly_rent", "income")} />
                <Info labelText="Timeline" value={field(pain, "timeline", "deadline", "desired_timeline", "urgency_level", "urgency")} />
                <Info labelText="Owner Goal" value={ownerGoal(pain)} />
              </div>
            </section>

            <section style={card}>
              <div style={label}>Problem Snapshot</div>
              <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 14, marginTop: 14 }}>
                <Info labelText="Problem Type" value={assetOf(pain)} />
                <Info labelText="Primary Bottleneck" value={primaryBottleneck(pain)} />
                <Info labelText="Urgency" value={urgencyOf(pain)} />
              </div>
              <div style={{ marginTop: 14, border: "1px solid rgba(248,113,113,.25)", borderRadius: 18, padding: 14, background: "rgba(248,113,113,.075)" }}>
                <div style={{ ...label, color: "#fecaca" }}>Pain Details</div>
                <p style={{ ...muted, margin: "8px 0 0", fontSize: 17 }}>{problemText(pain)}</p>
              </div>
            </section>

            <section style={card}>
              <div style={label}>VaultForge AI Problem Read</div>
              <p style={{ ...muted, fontSize: 18 }}>{aiProblemSummary(pain)}</p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14, marginTop: 16 }}>
                <Info labelText="Primary Bottleneck" value={primaryBottleneck(pain)} />
                <Info labelText="Fastest Resolution Path" value={fastestPath(pain)} />
                <Info labelText="Owner / Contact" value={owner || "Not listed"} />
              </div>
            </section>

            <section style={card}>
              <div style={label}>Who Should See This</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                {whoShouldSee(pain).map((item) => (
                  <span key={item} style={chip}>{item}</span>
                ))}
              </div>
            </section>

            <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 14, marginBottom: 18 }}>
              <Info labelText="Pain ID" value={idOf(pain)} />
              <Info labelText="Signal ID" value={signalId || "Not linked"} />
              <Info labelText="Submitted By" value={owner || email || "Not listed"} />
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}