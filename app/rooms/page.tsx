import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RoomType = "deal" | "pain";

type Room = {
  id: string;
  type: RoomType;
  source_table: string;
  title: string;
  market: string;
  asset: string;
  strategy: string;
  status: string;
  urgency: string;
  score: string;
  asking: string;
  arv: string;
  repairs: string;
  capital: string;
  summary: string;
  photo: string;
};

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
  if (typeof value === "string") {
    const text = value.trim();
    if (!text || text.toLowerCase() === "null" || text.toLowerCase() === "undefined") return "";
    return text;
  }
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
  const keys = [
    "metadata",
    "meta",
    "payload",
    "details",
    "asset_specific",
    "ai_payload",
    "analysis_payload",
    "room_payload",
    "source_payload",
    "data",
    "record",
    "item",
    "deal",
    "project",
    "property",
    "pain",
    "pressure",
  ];

  for (const key of keys) {
    const obj = parseObj((merged as any)[key]);
    if (Object.keys(obj).length) Object.assign(merged, obj);
  }

  for (const key of keys) {
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

function photoFrom(...values: unknown[]) {
  const found: string[] = [];

  function push(value: unknown) {
    if (!value) return;

    if (Array.isArray(value)) {
      value.forEach(push);
      return;
    }

    if (typeof value === "object") {
      const obj = value as Record<string, any>;
      push(obj.url || obj.publicUrl || obj.public_url || obj.src || obj.image_url || obj.photo_url);
      return;
    }

    const text = clean(value);
    if (!text) return;

    if (text.startsWith("[") || text.startsWith("{")) {
      try {
        push(JSON.parse(text));
        return;
      } catch {}
    }

    text
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.startsWith("http"))
      .forEach((item) => found.push(item));
  }

  values.forEach(push);
  return found[0] || "";
}

function idFrom(row: Record<string, any>) {
  return first(
    row.id,
    row.uuid,
    row.deal_id,
    row.project_id,
    row.property_id,
    row.item_id,
    row.room_id,
    row.pain_id,
    row.pressure_id,
    row.source_id,
    row.source_item_id
  );
}

function money(value: string) {
  const text = clean(value);
  if (!text) return "";
  if (text.includes("$")) return text;

  const n = Number(text.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return text;

  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function normalize(rowInput: Record<string, any>, type: RoomType, sourceTable: string): Room {
  const row = flatten(rowInput);

  const city = first(row.city, row.market_city, row.property_city, row.location_city);
  const county = first(row.county, row.county_name, row.market_county, row.property_county);
  const state = first(row.state, row.market_state, row.property_state, row.location_state);
  const market = [city, county, state].filter(Boolean).join(" · ");

  const title =
    first(
      row.title,
      row.name,
      row.project_title,
      row.deal_title,
      row.property_title,
      row.asset_title,
      row.pain_title,
      row.problem_title,
      row.subject,
      row.headline
    ) || (type === "pain" ? "Pain Room" : "Deal Room");

  const asset =
    first(
      row.asset_type,
      row.property_type,
      row.deal_type,
      row.project_type,
      row.problem_type,
      row.pain_type,
      row.type
    ) || (type === "pain" ? "Pain / Pressure" : "Real Estate Opportunity");

  const summary =
    first(
      row.ai_summary,
      row.ai_analysis,
      row.ai_best_summary,
      row.analysis,
      row.executive_summary,
      row.summary,
      row.summary_text,
      row.notes,
      row.description,
      row.problem,
      row.situation,
      row.context
    ) || (type === "pain"
      ? "Open for pressure, blockers, risk, AI next steps, matched profiles, and execution context."
      : "Open for deal numbers, AI analysis, matched profiles, alerts, and routing context.");

  return {
    id: idFrom(row) || `${sourceTable}-${Math.random().toString(36).slice(2)}`,
    type,
    source_table: sourceTable,
    title,
    market: market || first(row.market, row.city_state, row.location, "Market not listed"),
    asset,
    strategy: first(row.strategy, row.exit_strategy, row.investment_strategy, row.deal_strategy),
    status: first(row.status, row.stage, "active"),
    urgency: first(row.urgency, row.priority, row.severity, row.alert_level, type === "pain" ? "High" : "Review"),
    score: first(row.fit_score, row.score, row.confidence, row.match_score, type === "pain" ? "88" : "84"),
    asking: first(row.asking, row.asking_price, row.price, row.purchase_price, row.list_price),
    arv: first(row.arv, row.after_repair_value, row.value, row.estimated_value),
    repairs: first(row.repairs, row.repair_estimate, row.rehab, row.rehab_budget, row.work_needed),
    capital: first(row.capital_needed, row.capital, row.funding_needed, row.gap_amount, row.amount_needed),
    summary,
    photo: photoFrom(row.photos, row.photo_urls, row.photo_url, row.image_url, row.images, row.media, row.files),
  };
}

async function queryTable(table: string) {
  const supabase = supabaseClient();
  if (!supabase) return [] as Record<string, any>[];

  for (const column of ["created_at", "updated_at", "inserted_at", "id"]) {
    const { data, error } = await supabase.from(table).select("*").order(column, { ascending: false }).limit(30);
    if (!error && Array.isArray(data)) return data as Record<string, any>[];
  }

  const { data, error } = await supabase.from(table).select("*").limit(30);
  if (!error && Array.isArray(data)) return data as Record<string, any>[];
  return [];
}

async function listRooms(type: RoomType) {
  const tables =
    type === "pain"
      ? ["vf_pain_requests", "pain_requests", "vf_pain", "pain", "vf_pressure_rooms"]
      : ["vf_deals", "vf_projects", "projects", "deals", "property_cards", "vf_property_cards"];

  const rooms: Room[] = [];
  const seen = new Set<string>();

  for (const table of tables) {
    const rows = await queryTable(table);

    for (const row of rows) {
      const room = normalize(row, type, table);
      const key = `${room.type}:${room.id}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      rooms.push(room);
    }

    if (rooms.length >= 40) break;
  }

  return rooms.slice(0, 40);
}

function Card({ room }: { room: Room }) {
  const isPain = room.type === "pain";
  const accent = isPain ? "#ef4444" : "#f5c55b";
  const ask = money(room.asking);
  const arv = money(room.arv);
  const repairs = money(room.repairs);
  const capital = money(room.capital);

  return (
    <article className={`vf-card ${isPain ? "pain" : "deal"}`}>
      <div className="vf-line" />

      <Link
        href={`/rooms/detail?type=${room.type}&id=${encodeURIComponent(room.id)}&source=${encodeURIComponent(room.source_table)}`}
        className={isPain ? "vf-alert" : "vf-photo"}
      >
        {room.photo && !isPain ? <img src={room.photo} alt="" /> : isPain ? "!" : null}
      </Link>

      <div>
        <div className="vf-card-top">
          <div>
            <div className="vf-kicker" style={{ color: accent }}>
              {isPain ? "Pain Room" : "Deal Room"}
            </div>

            <h2>{room.title}</h2>

            <p>{room.market}</p>
          </div>

          <div className="vf-score">
            <strong style={{ color: accent }}>{room.score}</strong>
            <span>{isPain ? room.urgency : room.status}</span>
          </div>
        </div>

        <div className="vf-pills">
          {isPain ? (
            <>
              <span>{capital ? `Capital ${capital}` : "Capital not listed"}</span>
              <span>{room.asset}</span>
              <span>{room.urgency}</span>
            </>
          ) : (
            <>
              <span>{ask ? `Ask ${ask}` : "Ask not listed"}</span>
              <span>{arv ? `ARV ${arv}` : "ARV not listed"}</span>
              <span>{repairs ? `Repairs ${repairs}` : "Repairs not listed"}</span>
              <span>{room.asset}</span>
            </>
          )}
        </div>

        <p className="vf-summary">{room.summary}</p>

        <div className="vf-actions">
          <Link href={`/rooms/detail?type=${room.type}&id=${encodeURIComponent(room.id)}&source=${encodeURIComponent(room.source_table)}`}>
            Open Room
          </Link>

          <Link href={`/message-command/${encodeURIComponent(room.type + ":" + room.id)}`}>
            Thread
          </Link>
        </div>
      </div>
    </article>
  );
}

export default async function RoomsPage() {
  const [deals, pain] = await Promise.all([listRooms("deal"), listRooms("pain")]);

  return (
    <main className="vf-page">
      <style>{`
        .vf-page{
          min-height:100vh;
          background:
            radial-gradient(circle at top left,rgba(245,197,91,.12),transparent 30%),
            radial-gradient(circle at top right,rgba(239,68,68,.12),transparent 28%),
            linear-gradient(180deg,#02040a,#071018 52%,#02040a);
          color:#fff;
          padding:22px 14px 80px;
          font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif
        }

        .vf-wrap{max-width:1180px;margin:0 auto;display:grid;gap:16px}

        .vf-hero,.vf-panel{
          border:1px solid rgba(245,197,91,.24);
          background:linear-gradient(145deg,rgba(16,24,36,.94),rgba(2,6,23,.98));
          border-radius:24px;
          padding:20px;
          box-shadow:0 24px 70px rgba(0,0,0,.28)
        }

        .vf-kicker{color:#f5c55b;font-size:12px;font-weight:950;letter-spacing:.16em;text-transform:uppercase}

        h1{font-size:clamp(44px,9vw,88px);line-height:.9;letter-spacing:-.07em;margin:10px 0 12px}

        .vf-hero p{color:#cbd5e1;font-size:18px;line-height:1.5;max-width:920px}

        .vf-nav{display:flex;gap:9px;flex-wrap:wrap;margin-top:16px}

        .vf-nav a,.vf-actions a,.vf-section-head a{
          color:#f8fafc;
          text-decoration:none;
          border:1px solid rgba(245,197,91,.25);
          background:rgba(245,197,91,.07);
          border-radius:999px;
          padding:10px 13px;
          font-weight:900;
          font-size:13px
        }

        .vf-nav a.primary,.vf-actions a:first-child,.vf-section-head a{
          background:linear-gradient(135deg,#fde68a,#e8c46b);
          color:#111827;
          border:0
        }

        .vf-section-head{display:flex;justify-content:space-between;gap:12px;align-items:end;flex-wrap:wrap;margin-bottom:14px}

        .vf-section-head h2{font-size:clamp(32px,7vw,60px);line-height:.95;letter-spacing:-.06em;margin:8px 0 0}

        .vf-grid{display:grid;gap:14px}

        .vf-card{
          border:1px solid rgba(245,197,91,.22);
          background:
            radial-gradient(circle at top right,rgba(245,197,91,.09),transparent 28%),
            linear-gradient(145deg,rgba(12,16,25,.96),rgba(2,6,23,.99));
          border-radius:24px;
          padding:14px;
          display:grid;
          grid-template-columns:130px minmax(0,1fr);
          gap:14px
        }

        .vf-card.pain{
          border-color:rgba(239,68,68,.28);
          background:
            radial-gradient(circle at top right,rgba(239,68,68,.14),transparent 28%),
            linear-gradient(145deg,rgba(35,8,8,.96),rgba(2,6,23,.99))
        }

        .vf-line{grid-column:1/-1;height:4px;border-radius:999px;background:linear-gradient(90deg,#f5c55b,transparent)}
        .vf-card.pain .vf-line{background:linear-gradient(90deg,#ef4444,transparent)}

        .vf-photo,.vf-alert{
          height:130px;
          border-radius:16px;
          overflow:hidden;
          border:1px solid rgba(255,255,255,.12);
          background:
            radial-gradient(circle at top left,rgba(245,197,91,.18),transparent 30%),
            linear-gradient(135deg,#111827,#020617);
          display:grid;
          place-items:center;
          color:#ef4444;
          text-decoration:none;
          font-size:44px;
          font-weight:950
        }

        .vf-alert{
          background:
            radial-gradient(circle at center,rgba(239,68,68,.25),transparent 50%),
            linear-gradient(135deg,#2b0909,#020617);
          border-color:rgba(239,68,68,.28)
        }

        .vf-photo img{width:100%;height:100%;object-fit:cover;display:block}

        .vf-card-top{display:flex;justify-content:space-between;gap:12px}

        .vf-card-top h2{font-size:28px;line-height:.98;letter-spacing:-.055em;margin:6px 0;color:#fff}

        .vf-card-top p{color:#cbd5e1;margin:0;font-size:13px}

        .vf-score{text-align:right;flex:0 0 auto}

        .vf-score strong{display:block;font-size:30px;line-height:1}

        .vf-score span{display:block;color:#94a3b8;font-size:10px;letter-spacing:.14em;text-transform:uppercase;margin-top:4px}

        .vf-pills{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}

        .vf-pills span{
          border:1px solid rgba(255,255,255,.13);
          background:rgba(255,255,255,.045);
          color:#cbd5e1;
          border-radius:999px;
          padding:6px 9px;
          font-size:11px;
          font-weight:850
        }

        .vf-summary{color:#dbeafe;font-size:13px;line-height:1.45;margin:12px 0 0}

        .vf-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}

        @media(max-width:700px){
          .vf-card{grid-template-columns:1fr}
          .vf-photo,.vf-alert{height:160px}
          .vf-card-top h2{font-size:24px}
        }
      `}</style>

      <div className="vf-wrap">
        <section className="vf-hero">
          <div className="vf-kicker">VaultForge Hard Reset</div>
          <h1>Rooms</h1>
          <p>
            One live room board. Deal Rooms and Pain Rooms. Pain stays intake.
            Old Opportunity, Projects, Pain Feed, and Pressure pages are bypassed before they render.
          </p>

          <div className="vf-nav">
            <Link href="/rooms" className="primary">Rooms</Link>
            <Link href="/pain">Pain Intake</Link>
            <Link href="/message-command">Messages</Link>
          </div>
        </section>

        <section className="vf-panel">
          <div className="vf-section-head">
            <div>
              <div className="vf-kicker">Deal Rooms</div>
              <h2>{deals.length ? `${deals.length} active deals` : "Deal Rooms"}</h2>
            </div>
            <Link href="/submit">Create Deal</Link>
          </div>

          {!deals.length ? <p style={{ color: "#cbd5e1" }}>No deal records resolved yet.</p> : null}

          <div className="vf-grid">
            {deals.map((room) => <Card key={`${room.source_table}:${room.id}`} room={room} />)}
          </div>
        </section>

        <section className="vf-panel">
          <div className="vf-section-head">
            <div>
              <div className="vf-kicker" style={{ color: "#fca5a5" }}>Pain Rooms</div>
              <h2>{pain.length ? `${pain.length} active pain rooms` : "Pain Rooms"}</h2>
            </div>
            <Link href="/pain">Submit Pain</Link>
          </div>

          {!pain.length ? <p style={{ color: "#cbd5e1" }}>No pain records resolved yet.</p> : null}

          <div className="vf-grid">
            {pain.map((room) => <Card key={`${room.source_table}:${room.id}`} room={room} />)}
          </div>
        </section>
      </div>
    </main>
  );
}