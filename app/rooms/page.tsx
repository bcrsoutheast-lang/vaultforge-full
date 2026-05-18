import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function supabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function clean(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value).trim();
  return "";
}

function parseObj(value: unknown): Record<string, any> {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value as Record<string, any>;
  if (typeof value !== "string") return {};
  const text = value.trim();
  if (!text || (!text.startsWith("{") && !text.startsWith("["))) return {};
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, any>;
  } catch {}
  return {};
}

function flatten(row: Record<string, any>) {
  const merged = { ...row };
  for (const key of ["metadata", "meta", "payload", "details", "asset_specific", "data", "record", "deal", "project", "property", "pain", "pressure"]) {
    const obj = parseObj((merged as any)[key]);
    if (Object.keys(obj).length) Object.assign(merged, obj);
  }
  return merged as Record<string, any>;
}

function first(...values: unknown[]) {
  for (const value of values) {
    if (Array.isArray(value)) {
      for (const item of value) {
        const hit = first(item);
        if (hit) return hit;
      }
      continue;
    }
    if (value && typeof value === "object") continue;
    const text = clean(value);
    if (text && !text.startsWith("{") && !text.startsWith("[")) return text;
  }
  return "";
}

async function getRow(source: string, id: string) {
  const supabase = supabaseClient();
  if (!supabase || !source || !id) return null;

  for (const column of ["id", "uuid", "deal_id", "project_id", "property_id", "item_id", "room_id", "pain_id", "pressure_id", "source_id", "source_item_id"]) {
    const { data, error } = await supabase.from(source).select("*").eq(column, id).limit(1).maybeSingle();
    if (!error && data) return data as Record<string, any>;
  }

  return null;
}

function money(value: string) {
  const text = clean(value);
  if (!text) return "Not listed";
  if (text.includes("$")) return text;
  const n = Number(text.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return text;
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default async function RoomDetailPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const type = firstParam(params.type) === "pain" ? "pain" : "deal";
  const id = firstParam(params.id);
  const source = firstParam(params.source);
  const rowRaw = await getRow(source, id);
  const row = flatten(rowRaw || {});
  const isPain = type === "pain";

  const city = first(row.city, row.market_city, row.property_city, row.location_city);
  const county = first(row.county, row.county_name, row.market_county, row.property_county);
  const state = first(row.state, row.market_state, row.property_state, row.location_state);
  const market = [city, county, state].filter(Boolean).join(" · ") || first(row.market, row.city_state, row.location, "Not listed");

  const title =
    first(row.title, row.name, row.project_title, row.deal_title, row.property_title, row.asset_title, row.pain_title, row.problem_title, row.subject, row.headline) ||
    (isPain ? "Pain Room" : "Deal Room");

  const summary =
    first(row.ai_summary, row.ai_analysis, row.summary, row.summary_text, row.notes, row.description, row.problem, row.situation, row.context) ||
    (rowRaw
      ? "Room opened. Add more submitted data to improve AI summary and routing."
      : "This room id did not match the source table. Open a card from /rooms.");

  const asset = first(row.asset_type, row.property_type, row.deal_type, row.project_type, row.problem_type, row.pain_type, row.type, isPain ? "Pain / Pressure" : "Real Estate Opportunity");
  const strategy = first(row.strategy, row.exit_strategy, row.investment_strategy, row.deal_strategy, "Not listed");
  const status = first(row.status, row.stage, "active");
  const urgency = first(row.urgency, row.priority, row.severity, row.alert_level, isPain ? "High" : "Review");
  const score = first(row.fit_score, row.score, row.confidence, row.match_score, isPain ? "88" : "84");
  const asking = first(row.asking, row.asking_price, row.price, row.purchase_price, row.list_price);
  const arv = first(row.arv, row.after_repair_value, row.value, row.estimated_value);
  const repairs = first(row.repairs, row.repair_estimate, row.rehab, row.rehab_budget, row.work_needed);
  const capital = first(row.capital_needed, row.capital, row.funding_needed, row.gap_amount, row.amount_needed);

  return (
    <main className={isPain ? "vf-page pain" : "vf-page"}>
      <style>{`
        .vf-page{
          min-height:100vh;
          background:
            radial-gradient(circle at top left,rgba(245,197,91,.12),transparent 30%),
            linear-gradient(180deg,#02040a,#071018 52%,#02040a);
          color:#fff;
          padding:22px 14px 80px;
          font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif
        }

        .vf-page.pain{
          background:
            radial-gradient(circle at top left,rgba(239,68,68,.14),transparent 30%),
            linear-gradient(180deg,#02040a,#071018 52%,#02040a)
        }

        .vf-wrap{max-width:1180px;margin:0 auto;display:grid;gap:16px}

        .vf-card{
          border:1px solid rgba(245,197,91,.24);
          background:linear-gradient(145deg,rgba(16,24,36,.94),rgba(2,6,23,.98));
          border-radius:24px;
          padding:20px;
          box-shadow:0 24px 70px rgba(0,0,0,.28)
        }

        .vf-page.pain .vf-card{border-color:rgba(239,68,68,.28);background:linear-gradient(145deg,rgba(35,8,8,.94),rgba(2,6,23,.98))}
        .vf-kicker{color:#f5c55b;font-size:12px;font-weight:950;letter-spacing:.16em;text-transform:uppercase}
        .vf-page.pain .vf-kicker{color:#fca5a5}
        h1{font-size:clamp(42px,8vw,82px);line-height:.9;letter-spacing:-.07em;margin:10px 0 12px}
        p{color:#cbd5e1;line-height:1.55}
        .vf-page.pain p{color:#fee2e2}

        .vf-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(165px,1fr));gap:10px}
        .vf-metric{border:1px solid rgba(148,163,184,.16);background:rgba(2,6,23,.38);border-radius:16px;padding:12px}
        .vf-metric span{display:block;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:.12em;font-weight:900}
        .vf-metric strong{display:block;color:#fff;font-size:17px;margin-top:5px;overflow-wrap:anywhere}
        .vf-box-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}
        .vf-box{border:1px solid rgba(148,163,184,.18);background:rgba(15,23,42,.78);border-radius:20px;padding:16px}
        .vf-box h3{margin:0 0 10px}
        .vf-nav{display:flex;gap:9px;flex-wrap:wrap;margin-top:16px}
        .vf-nav a{color:#f8fafc;text-decoration:none;border:1px solid rgba(245,197,91,.25);background:rgba(245,197,91,.07);border-radius:999px;padding:10px 13px;font-weight:900;font-size:13px}
        .vf-nav a.primary{background:linear-gradient(135deg,#fde68a,#e8c46b);color:#111827;border:0}
      `}</style>

      <div className="vf-wrap">
        <section className="vf-card">
          <div className="vf-kicker">{isPain ? "Pain Room" : "Deal Room"}</div>
          <h1>{title}</h1>
          <p>{summary}</p>

          <div className="vf-nav">
            <Link href="/rooms">Back to Rooms</Link>
            <Link href="/pain">Pain Intake</Link>
            <Link href={`/message-command/${encodeURIComponent(type + ":" + id)}`} className="primary">Room Thread</Link>
          </div>
        </section>

        <section className="vf-card">
          <div className="vf-kicker">{isPain ? "Pressure Data" : "Submitted Numbers"}</div>

          <div className="vf-grid">
            <div className="vf-metric"><span>Market</span><strong>{market}</strong></div>
            <div className="vf-metric"><span>Asset / Type</span><strong>{asset}</strong></div>
            <div className="vf-metric"><span>Strategy</span><strong>{strategy}</strong></div>
            <div className="vf-metric"><span>Status</span><strong>{status}</strong></div>
            <div className="vf-metric"><span>Urgency</span><strong>{urgency}</strong></div>
            <div className="vf-metric"><span>Score</span><strong>{score}</strong></div>
            <div className="vf-metric"><span>Asking</span><strong>{money(asking)}</strong></div>
            <div className="vf-metric"><span>ARV / Value</span><strong>{money(arv)}</strong></div>
            <div className="vf-metric"><span>Repairs</span><strong>{money(repairs)}</strong></div>
            <div className="vf-metric"><span>Capital Need</span><strong>{money(capital)}</strong></div>
            <div className="vf-metric"><span>Source Table</span><strong>{source || "not-found"}</strong></div>
          </div>
        </section>

        <section className="vf-card">
          <div className="vf-kicker">{isPain ? "Pain Execution AI" : "Deal Room AI"}</div>

          <div className="vf-box-grid">
            <div className="vf-box">
              <h3 style={{ color: "#86efac" }}>{isPain ? "What can be solved" : "What looks good"}</h3>
              <p>
                {isPain
                  ? "This room can be routed if the blocker, deadline, capital need, and decision-maker are clear."
                  : "This room can support underwriting, buyer fit, capital routing, and execution review once numbers and documents are complete."}
              </p>
            </div>

            <div className="vf-box">
              <h3 style={{ color: "#fca5a5" }}>{isPain ? "Execution risk" : "What needs caution"}</h3>
              <p>
                {isPain
                  ? "Delay increases pressure. Pain rooms lose value when ownership, deadline, and next action are unclear."
                  : "Verify title, documents, repairs, occupancy, capital assumptions, and exit path before routing heavily."}
              </p>
            </div>

            <div className="vf-box">
              <h3 style={{ color: "#93c5fd" }}>Next steps</h3>
              <p>
                {isPain
                  ? "Assign owner, confirm deadline, route matched operator/capital/buyer profiles, and keep messages tied to this room."
                  : "Confirm economics, attach docs/photos, route matched buyers, capital, and operators, then move toward review or archive."}
              </p>
            </div>
          </div>
        </section>

        <section className="vf-card">
          <div className="vf-kicker">Matched Profiles</div>

          <div className="vf-box-grid">
            <div className="vf-box"><h3>{isPain ? "Rescue Capital" : "Buyer Match"}</h3><p>Fit based on geography, room type, strategy, urgency, and execution profile.</p></div>
            <div className="vf-box"><h3>{isPain ? "Operator Match" : "Capital Match"}</h3><p>Fit based on local execution, funding need, operator capacity, and market focus.</p></div>
            <div className="vf-box"><h3>{isPain ? "Buyer / Exit Match" : "Operator Match"}</h3><p>Fit based on ability to move the room toward resolution.</p></div>
          </div>
        </section>
      </div>
    </main>
  );
}