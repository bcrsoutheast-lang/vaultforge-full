import Link from "next/link";
import VaultForgeIntelligenceActions from "../components/VaultForgeIntelligenceActions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Signal = Record<string, any>;

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.18), transparent 28%), radial-gradient(circle at top right, rgba(168,36,36,.16), transparent 30%), linear-gradient(180deg,#020306,#07111f 52%,#020306)",
  color: "#fff7e0",
  padding: "26px 16px 80px",
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1220, margin: "0 auto" };
const panel: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.22)",
  background: "linear-gradient(180deg,rgba(255,255,255,.075),rgba(255,255,255,.032))",
  boxShadow: "0 22px 70px rgba(0,0,0,.38)",
  borderRadius: 26,
};
const pill: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.28)",
  background: "rgba(232,196,107,.09)",
  borderRadius: 999,
  padding: "8px 11px",
  color: "#efd58e",
  fontSize: 11,
  fontWeight: 950,
  letterSpacing: ".1em",
  textTransform: "uppercase",
};

async function getBaseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "";
}

async function fetchJson(path: string) {
  const base = await getBaseUrl();
  try {
    const res = await fetch(`${base}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function arr(data: any): Signal[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.signals)) return data.signals;
  if (Array.isArray(data?.rooms)) return data.rooms;
  if (Array.isArray(data?.alerts)) return data.alerts;
  return [];
}

function text(v: any, fallback = "Not listed") {
  const s = String(v ?? "").trim();
  return s || fallback;
}

function idOf(item: Signal, i: number) {
  return text(item.id || item.signal_id || item.room_id || item.item_id || item.deal_id || `intelligence-${i}`, `intelligence-${i}`);
}

function titleOf(item: Signal, i: number) {
  return text(item.title || item.name || item.headline || item.summary || item.signal_title, `Intelligence Signal ${i + 1}`);
}

function severityOf(item: Signal, i: number) {
  const raw = text(item.severity || item.priority || item.urgency || item.risk_level || "").toLowerCase();
  if (raw.includes("critical") || raw.includes("urgent") || raw.includes("high")) return "HIGH";
  if (raw.includes("low")) return "LOW";
  if (i % 5 === 0) return "HIGH";
  if (i % 3 === 0) return "WATCH";
  return "MEDIUM";
}

function marketOf(item: Signal) {
  const city = text(item.city || item.market_city || "", "");
  const county = text(item.county || item.market_county || "", "");
  const state = text(item.state || item.market_state || item.property_state || "", "");
  return [city, county, state].filter(Boolean).join(" / ") || "Market not listed";
}

function scoreOf(item: Signal, i: number) {
  const raw = Number(item.score || item.urgency_score || item.pressure_score || item.routing_score || 0);
  if (Number.isFinite(raw) && raw > 0) return Math.min(99, Math.round(raw));
  return [91, 84, 78, 72, 66, 59][i % 6];
}

export default async function IntelligencePage() {
  const primary = arr(await fetchJson("/api/intelligence/feed"));
  const signals = primary.length ? primary : arr(await fetchJson("/api/signals"));

  const visible = signals.slice(0, 24);
  const high = visible.filter((x, i) => severityOf(x, i) === "HIGH").length;
  const avg = visible.length
    ? Math.round(visible.reduce((sum, item, i) => sum + scoreOf(item, i), 0) / visible.length)
    : 0;

  const fallback = !visible.length;
  const rows = fallback
    ? [
        { id: "vf-intel-fallback-pressure", title: "Pressure signal standby", signal_type: "Distress Monitor", summary: "Connect /api/intelligence/feed or /api/signals to populate live intelligence signals." },
        { id: "vf-intel-fallback-routing", title: "Routing heat standby", signal_type: "Routing Pressure", summary: "This page is ready for live market pressure, demand, capital, and operator-shortage signals." },
        { id: "vf-intel-fallback-capital", title: "Capital demand standby", signal_type: "Capital Signal", summary: "Use this lane for lender pullbacks, refinance pressure, JV need, and liquidity gaps." },
      ]
    : visible;

  return (
    <main style={page}>
      <div style={wrap}>
        <header style={{ ...panel, padding: 22, marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <div style={{ color: "#e8c46b", fontSize: 12, fontWeight: 1000, letterSpacing: ".18em", textTransform: "uppercase" }}>
                VaultForge Intelligence Terminal
              </div>
              <h1 style={{ margin: "8px 0 8px", fontSize: "clamp(32px,6vw,64px)", lineHeight: .92, letterSpacing: "-.06em" }}>
                Live Market Pressure Command
              </h1>
              <p style={{ margin: 0, color: "#cdbb8a", maxWidth: 820, fontSize: 15, lineHeight: 1.55, fontWeight: 750 }}>
                Intelligence signals, distress pressure, capital demand, buyer heat, operator gaps, and routing-ready opportunities in one Bloomberg-style lane.
              </p>
            </div>
            <nav style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link href="/dashboard" style={pill}>Dashboard</Link>
              <Link href="/alerts" style={pill}>Alerts</Link>
              <Link href="/routing-inbox" style={pill}>Routing</Link>
              <Link href="/projects" style={pill}>Projects</Link>
            </nav>
          </div>
        </header>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12, marginBottom: 18 }}>
          {[
            ["Signals", rows.length],
            ["High Pressure", high],
            ["Avg Pressure", avg || "—"],
            ["Mode", fallback ? "Standby" : "Live"],
          ].map(([label, value]) => (
            <div key={label} style={{ ...panel, padding: 16 }}>
              <div style={{ color: "#8fa0bf", fontSize: 11, fontWeight: 1000, letterSpacing: ".14em", textTransform: "uppercase" }}>{label}</div>
              <div style={{ marginTop: 7, fontSize: 28, fontWeight: 1000, letterSpacing: "-.04em" }}>{value}</div>
            </div>
          ))}
        </section>

        <section style={{ ...panel, overflow: "hidden" }}>
          <div style={{ padding: "13px 16px", borderBottom: "1px solid rgba(232,196,107,.18)", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ color: "#e8c46b", fontSize: 12, fontWeight: 1000, letterSpacing: ".14em", textTransform: "uppercase" }}>
              Intelligence Feed
            </div>
            <div style={{ color: "#cdbb8a", fontSize: 12, fontWeight: 850 }}>
              Save / Archive / Hide uses the shared room-state engine.
            </div>
          </div>

          <div style={{ display: "grid", gap: 12, padding: 14 }}>
            {rows.map((item, i) => {
              const id = idOf(item, i);
              const sev = severityOf(item, i);
              const score = scoreOf(item, i);
              return (
                <article key={`${id}-${i}`} style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 22, background: "rgba(0,0,0,.26)", padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ maxWidth: 760 }}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                        <span style={pill}>{sev}</span>
                        <span style={pill}>Score {score}</span>
                        <span style={pill}>{text(item.signal_type || item.type || item.category || "Market Signal")}</span>
                      </div>
                      <h2 style={{ margin: 0, fontSize: 24, letterSpacing: "-.04em" }}>{titleOf(item, i)}</h2>
                      <p style={{ color: "#cdbb8a", margin: "8px 0 0", lineHeight: 1.5, fontWeight: 750 }}>
                        {text(item.ai_summary || item.summary || item.description || item.notes || "No intelligence summary attached yet.")}
                      </p>
                      <div style={{ marginTop: 12, color: "#8fa0bf", fontSize: 13, fontWeight: 850 }}>
                        Market: {marketOf(item)} · Room ID: {id}
                      </div>
                    </div>
                    <div style={{ minWidth: 230 }}>
                      <VaultForgeIntelligenceActions roomId={id} roomType="intelligence" sourceRoute="/intelligence" />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
                    <Link href={`/signals/${encodeURIComponent(id)}`} style={pill}>Open Signal</Link>
                    <Link href={`/routing-room/${encodeURIComponent(id)}`} style={pill}>Routing Room</Link>
                    <Link href={`/messages/new?roomType=intelligence&roomId=${encodeURIComponent(id)}`} style={pill}>Message</Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
