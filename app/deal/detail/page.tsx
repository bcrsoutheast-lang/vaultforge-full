"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Deal = Record<string, any>;

function clean(value: unknown) {
  return String(value || "").trim();
}

function meta(row: Deal | null) {
  return row && typeof row.metadata === "object" && row.metadata ? row.metadata : {};
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

function from(deal: Deal | null, ...keys: string[]) {
  if (!deal) return "";
  const m = meta(deal);
  const values: unknown[] = [];

  for (const key of keys) {
    values.push(deal[key]);
    values.push(m[key]);
  }

  return first(...values);
}

function parseArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item: any) => {
        if (typeof item === "string") return clean(item);
        if (item && typeof item === "object") {
          return clean(item.url || item.publicUrl || item.public_url || item.photo_url || item.image_url || item.main_photo_url);
        }
        return "";
      })
      .filter(Boolean);
  }

  const text = clean(value);
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parseArray(parsed);
  } catch {
    // Continue as delimited text.
  }

  return text
    .split(/[,\n|;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function photosOf(deal: Deal | null) {
  if (!deal) return [];
  const m = meta(deal);

  const values = [
    deal.main_photo_url,
    deal.image_url,
    deal.photo_url,
    deal.primary_photo_url,
    m.main_photo_url,
    m.image_url,
    m.photo_url,
    m.primary_photo_url,
    ...parseArray(deal.photo_urls),
    ...parseArray(m.photo_urls),
    ...parseArray(deal.photos),
    ...parseArray(m.photos),
  ];

  return Array.from(new Set(values.map(clean).filter((url) => url.startsWith("http"))));
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

function numValue(value: unknown) {
  const text = clean(value);
  if (!text) return null;
  const number = Number(text.replace(/[^\d.-]/g, ""));
  return Number.isFinite(number) ? number : null;
}

function marketText(deal: Deal | null) {
  return (
    [from(deal, "city"), from(deal, "state")].filter(Boolean).join(", ") ||
    from(deal, "market", "location", "address", "property_address") ||
    "Market not listed"
  );
}

function titleText(deal: Deal | null) {
  return first(from(deal, "title", "deal_title", "project_title"), from(deal, "address"), "Deal Room");
}

function assetText(deal: Deal | null) {
  return from(deal, "property_type", "deal_type", "asset_type") || "Asset";
}

function strategyText(deal: Deal | null) {
  return from(deal, "strategy", "exit_strategy", "deal_strategy") || "Strategy not listed";
}

function bedsBaths(deal: Deal | null) {
  const beds = from(deal, "beds", "bedrooms");
  const baths = from(deal, "baths", "bathrooms");
  return [beds ? `${beds} bd` : "", baths ? `${baths} ba` : ""].filter(Boolean).join(" / ") || "Not listed";
}

function sqftAcres(deal: Deal | null) {
  const sqft = from(deal, "square_feet", "sqft", "building_sqft");
  const acres = from(deal, "acres", "land_acres", "lot_size");
  if (sqft) return `${sqft} sqft`;
  if (acres) return `${acres} acres`;
  return "Not listed";
}

function spreadText(deal: Deal | null) {
  const ask = numValue(from(deal, "asking_price", "price", "ask", "purchase_price"));
  const arv = numValue(from(deal, "arv", "arv_value", "estimated_value", "after_repair_value"));
  const repairs = numValue(from(deal, "repair_estimate", "repairs_needed", "estimated_repairs", "rehab_budget", "repair_budget"));

  if (ask === null || arv === null) return "Spread pending";
  const net = arv - ask - (repairs || 0);
  return money(net);
}

function cleanSummaryText(value: string) {
  return clean(value)
    .replace(/VF_[A-Z_]+_START[\s\S]*?VF_[A-Z_]+_END/g, "")
    .replace(/\s*\|\s*/g, " • ")
    .replace(/\s+/g, " ")
    .trim();
}

function existingSummary(deal: Deal | null) {
  return cleanSummaryText(
    first(
      from(deal, "ai_summary"),
      from(deal, "ai_route_summary"),
      from(deal, "route_summary"),
      from(deal, "routing_summary"),
      from(deal, "summary")
    )
  );
}

function likelyRouteStack(deal: Deal | null) {
  const type = assetText(deal).toLowerCase();
  const strategy = strategyText(deal).toLowerCase();
  const needs = from(deal, "routing_needs", "deal_needs", "needs", "route_context").toLowerCase();
  const pressure = from(deal, "distress_signals", "seller_pressure", "pain_signals", "seller_situation").toLowerCase();
  const stack: string[] = [];

  if (needs.includes("buyer") || strategy.includes("flip") || strategy.includes("wholesale")) stack.push("Cash buyer");
  if (needs.includes("contractor") || from(deal, "repair_estimate", "repairs_needed", "rehab_budget")) stack.push("Contractor");
  if (needs.includes("lender") || needs.includes("capital") || pressure.includes("funding") || pressure.includes("gap")) stack.push("Private lender");
  if (needs.includes("jv") || needs.includes("partner") || needs.includes("operator")) stack.push("JV/operator");
  if (type.includes("land")) stack.push("Builder / developer");
  if (type.includes("commercial") || from(deal, "noi", "cap_rate")) stack.push("Commercial investor");
  if (!stack.length) stack.push("Buyer", "Operator", "Owner review");

  return Array.from(new Set(stack)).slice(0, 4);
}

function bestFormation(deal: Deal | null) {
  const stack = likelyRouteStack(deal);
  const strategy = strategyText(deal).toLowerCase();
  const type = assetText(deal).toLowerCase();

  if (stack.includes("Private lender")) return "Capital-backed acquisition";
  if (stack.includes("JV/operator")) return "JV / operator-led execution";
  if (stack.includes("Contractor")) return "Contractor-verified flip";
  if (stack.includes("Builder / developer")) return "Developer / builder route";
  if (type.includes("commercial")) return "Investor yield review";
  if (strategy.includes("wholesale")) return "Buyer-first off-market route";
  if (strategy.includes("hold") || strategy.includes("rental")) return "Buy-and-hold investor route";

  return "Buyer-first execution route";
}

function confidenceScore(deal: Deal | null) {
  let score = 38;

  if (from(deal, "asking_price", "price", "ask", "purchase_price")) score += 11;
  if (from(deal, "arv", "arv_value", "estimated_value", "after_repair_value")) score += 11;
  if (from(deal, "repair_estimate", "repairs_needed", "estimated_repairs", "rehab_budget", "repair_budget")) score += 8;
  if (from(deal, "city", "state", "market")) score += 8;
  if (from(deal, "strategy", "exit_strategy", "deal_strategy")) score += 8;
  if (from(deal, "beds", "bedrooms", "sqft", "building_sqft", "land_acres", "acres")) score += 6;
  if (from(deal, "routing_needs", "deal_needs", "needs", "route_context")) score += 7;
  if (from(deal, "distress_signals", "seller_pressure", "pain_signals", "seller_situation")) score += 7;
  if (photosOf(deal).length) score += 9;

  return Math.max(0, Math.min(96, score));
}

function riskText(deal: Deal | null) {
  const pressure = `${from(deal, "distress_signals", "seller_pressure", "pain_signals")} ${from(deal, "seller_situation")} ${from(deal, "title_issue")}`.toLowerCase();

  if (pressure.includes("foreclosure") || pressure.includes("urgent") || pressure.includes("emergency")) {
    return "High urgency: confirm title, access, and buyer/capital readiness before broad routing.";
  }

  if (pressure.includes("funding") || pressure.includes("gap")) {
    return "Capital risk: verify funding gap and timeline before introducing buyers or operators.";
  }

  if (from(deal, "repair_estimate", "repairs_needed", "rehab_budget") && !from(deal, "contractor_scope")) {
    return "Execution risk: repairs are listed, so contractor scope or inspection notes should be confirmed.";
  }

  return "Normal review: validate numbers, photo condition, access, and member fit before routing.";
}

function bestNextMove(deal: Deal | null) {
  const stack = likelyRouteStack(deal);
  const ask = from(deal, "asking_price", "price", "ask", "purchase_price");
  const arv = from(deal, "arv", "arv_value", "estimated_value", "after_repair_value");
  const repairs = from(deal, "repair_estimate", "repairs_needed", "estimated_repairs", "rehab_budget", "repair_budget");

  if (stack.includes("Private lender")) return "Verify funding gap, then route to private lender with ask, ARV, repairs, and timeline.";
  if (stack.includes("Contractor")) return "Confirm repair scope and photos, then send to contractor-backed buyer/operator.";
  if (stack.includes("Builder / developer")) return "Confirm zoning, utilities, road access, and entitlement path before developer routing.";
  if (stack.includes("Commercial investor")) return "Confirm NOI, tenant status, cap rate, and lease details before investor routing.";
  if (ask && arv && repairs) return "Package the spread and route to cash buyers first; keep owner contact controlled.";
  if (ask && arv) return "Confirm repair estimate, then route as buyer-first opportunity.";
  return "Complete the key economics, then route to the best-fit buyer/operator lane.";
}

function executiveSummary(deal: Deal | null) {
  const saved = existingSummary(deal);
  if (saved) return saved;

  const title = titleText(deal);
  const type = assetText(deal);
  const market = marketText(deal);
  const strategy = strategyText(deal);
  const ask = money(from(deal, "asking_price", "price", "ask", "purchase_price"));
  const arv = money(from(deal, "arv", "arv_value", "estimated_value", "after_repair_value"));
  const repairs = money(from(deal, "repair_estimate", "repairs_needed", "estimated_repairs", "rehab_budget", "repair_budget"));
  const route = likelyRouteStack(deal).join(", ");

  return [
    `${title} is a ${type} opportunity in ${market}.`,
    strategy !== "Strategy not listed" ? `Likely strategy is ${strategy}.` : "",
    ask !== "Not listed" || arv !== "Not listed" || repairs !== "Not listed"
      ? `Economics show Ask ${ask}, ARV ${arv}, and Repairs ${repairs}.`
      : "",
    `Recommended route stack: ${route}.`,
    `Best next move: ${bestNextMove(deal)}`,
  ]
    .filter(Boolean)
    .join(" ");
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at 8% 0%, rgba(232,196,107,.18), transparent 28%), radial-gradient(circle at 88% 10%, rgba(56,189,248,.12), transparent 28%), linear-gradient(180deg,#02040a,#071326 55%,#02040a)",
  color: "white",
  padding: "24px 16px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  width: "min(1180px,100%)",
  margin: "0 auto",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.22)",
  borderRadius: 28,
  padding: 22,
  background: "rgba(255,255,255,.04)",
  marginBottom: 18,
  boxShadow: "0 24px 80px rgba(0,0,0,.28)",
};

const glass: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 22,
  padding: 16,
  background: "rgba(255,255,255,.045)",
};

const label: React.CSSProperties = {
  color: "#e8c46b",
  fontWeight: 950,
  fontSize: 12,
  letterSpacing: ".18em",
  textTransform: "uppercase",
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
  padding: "12px 18px",
  borderRadius: 999,
  textDecoration: "none",
  fontWeight: 900,
  border: "1px solid rgba(255,255,255,.14)",
  color: "white",
  background: "rgba(255,255,255,.06)",
};

const primary: React.CSSProperties = {
  ...button,
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#071326",
  border: "none",
};

const chip: React.CSSProperties = {
  border: "1px solid rgba(157,243,191,.24)",
  borderRadius: 999,
  padding: "7px 10px",
  color: "#9df3bf",
  background: "rgba(157,243,191,.075)",
  fontSize: 12,
  fontWeight: 850,
  display: "inline-flex",
};

function Metric({ title, value, tone }: { title: string; value: unknown; tone?: "gold" | "blue" | "green" }) {
  const color = tone === "blue" ? "#bfdbfe" : tone === "green" ? "#9df3bf" : "#f8e7b0";

  return (
    <div style={glass}>
      <div style={label}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 1000, marginTop: 8, color }}>{clean(value) || "Not listed"}</div>
    </div>
  );
}

function ScoreBar({ title, value }: { title: string; value: number }) {
  return (
    <div style={glass}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div style={label}>{title}</div>
        <strong>{value}%</strong>
      </div>
      <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,.12)", overflow: "hidden", marginTop: 12 }}>
        <div style={{ height: "100%", width: `${value}%`, borderRadius: 999, background: "linear-gradient(90deg,#ff6b6b,#f8e7b0,#56d8ff)" }} />
      </div>
    </div>
  );
}

function NotesBlock({ title, value }: { title: string; value: unknown }) {
  const text = clean(value);
  if (!text) return null;

  return (
    <section style={card}>
      <div style={label}>{title}</div>
      <p style={{ ...muted, fontSize: 18, margin: "10px 0 0" }}>{text}</p>
    </section>
  );
}

export default function DealDetailPage() {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [status, setStatus] = useState("Loading deal...");
  const [dealId, setDealId] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams(window.location.search);
        const id = clean(params.get("id"));

        setDealId(id);

        if (!id) {
          setStatus("Missing deal id.");
          return;
        }

        const response = await fetch(`/api/deal/detail?id=${encodeURIComponent(id)}`, {
          cache: "no-store",
          credentials: "include",
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok || data?.ok === false) {
          throw new Error(data?.error || "Could not load deal.");
        }

        setDeal(data.deal || null);
        setStatus("");
      } catch (error: any) {
        setStatus(error?.message || "Could not load deal.");
      }
    }

    load();
  }, []);

  const photos = useMemo(() => photosOf(deal), [deal]);
  const signalId = from(deal, "signal_id");
  const confidence = confidenceScore(deal);
  const routeStack = likelyRouteStack(deal);
  const mainPhoto = photos[0];

  return (
    <main style={page}>
      <style>{`
        @media (max-width: 860px) {
          .vf-hero { grid-template-columns: 1fr !important; }
          .vf-grid { grid-template-columns: 1fr !important; }
          .vf-actions { display: grid !important; grid-template-columns: 1fr !important; }
          .vf-actions a { width: 100%; box-sizing: border-box; }
        }
      `}</style>

      <div style={wrap}>
        <section style={card}>
          <div style={label}>VaultForge Deal Room</div>
          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
            <Link href="/projects" style={primary}>Back to Projects</Link>
            <Link href="/dashboard" style={button}>Dashboard</Link>
            <Link href="/submit" style={button}>Create Deal</Link>
            {signalId ? <Link href={`/signals/${encodeURIComponent(signalId)}`} style={button}>Signal Room</Link> : null}
            {signalId ? <Link href={`/routing-room/${encodeURIComponent(signalId)}`} style={button}>Routing Room</Link> : null}
          </div>
        </section>

        {status ? (
          <section style={card}>
            <div style={label}>Status</div>
            <h1 style={{ margin: "10px 0 0", fontSize: 34 }}>{status}</h1>
          </section>
        ) : null}

        {deal ? (
          <>
            <section className="vf-hero" style={{ display: "grid", gridTemplateColumns: "390px 1fr", gap: 18, alignItems: "stretch" }}>
              <div style={{ ...card, padding: 0, overflow: "hidden", minHeight: 310 }}>
                {mainPhoto ? (
                  <img src={mainPhoto} alt="Deal" style={{ width: "100%", height: "100%", minHeight: 310, objectFit: "cover", display: "block" }} />
                ) : (
                  <div style={{ minHeight: 310, display: "grid", placeItems: "center", color: "#94a3b8", fontWeight: 900 }}>
                    No photo attached
                  </div>
                )}
              </div>

              <section style={card}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                  <span style={chip}>{assetText(deal)}</span>
                  <span style={chip}>{marketText(deal)}</span>
                  <span style={chip}>{strategyText(deal)}</span>
                </div>

                <h1
                  style={{
                    fontSize: "clamp(44px,8vw,82px)",
                    lineHeight: 0.9,
                    margin: "6px 0 14px",
                    letterSpacing: "-.07em",
                  }}
                >
                  {titleText(deal)}
                </h1>

                <div style={{ border: "1px solid rgba(232,196,107,.22)", borderRadius: 22, padding: 18, background: "rgba(232,196,107,.07)" }}>
                  <div style={label}>Executive Summary</div>
                  <p style={{ ...muted, fontSize: 19, margin: "10px 0 0" }}>{executiveSummary(deal)}</p>
                </div>

                <div style={{ marginTop: 14, border: "1px solid rgba(157,243,191,.22)", borderRadius: 22, padding: 18, background: "rgba(157,243,191,.06)" }}>
                  <div style={label}>Best Next Move</div>
                  <p style={{ color: "#dbeafe", fontSize: 20, lineHeight: 1.45, margin: "10px 0 0", fontWeight: 850 }}>
                    {bestNextMove(deal)}
                  </p>
                </div>
              </section>
            </section>

            <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 14 }}>
              <Metric title="Ask" value={money(from(deal, "asking_price", "price", "ask", "purchase_price"))} />
              <Metric title="ARV" value={money(from(deal, "arv", "arv_value", "estimated_value", "after_repair_value"))} />
              <Metric title="Repairs" value={money(from(deal, "repair_estimate", "repairs_needed", "estimated_repairs", "rehab_budget", "repair_budget"))} />
              <Metric title="Spread Read" value={spreadText(deal)} tone="green" />
              <Metric title="Beds / Baths" value={bedsBaths(deal)} tone="blue" />
              <Metric title="Size" value={sqftAcres(deal)} tone="blue" />
              <Metric title="Year Built" value={from(deal, "year_built", "built_year") || "Not listed"} tone="blue" />
              <Metric title="Occupancy" value={from(deal, "occupancy", "occupancy_status", "tenant_status") || "Not listed"} tone="blue" />
            </section>

            <section style={card}>
              <div style={label}>Bloomberg Intelligence Layer</div>

              <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
                <ScoreBar title="Confidence" value={confidence} />
                <ScoreBar title="Execution Readiness" value={Math.max(35, Math.min(95, confidence - 8 + (photos.length ? 8 : 0)))} />
              </div>

              <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: 14, marginTop: 14 }}>
                <div style={glass}>
                  <div style={label}>Recommended Formation</div>
                  <h2 style={{ fontSize: 30, lineHeight: 1, margin: "10px 0 0" }}>{bestFormation(deal)}</h2>
                  <p style={{ ...muted, margin: "10px 0 0" }}>{riskText(deal)}</p>
                </div>

                <div style={glass}>
                  <div style={label}>Route Stack</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                    {routeStack.map((item) => (
                      <span key={item} style={chip}>{item}</span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {photos.length > 1 ? (
              <section style={card}>
                <div style={label}>Additional Photos</div>
                <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginTop: 12 }}>
                  {photos.slice(1).map((photo) => (
                    <img
                      key={photo}
                      src={photo}
                      alt="Deal"
                      style={{
                        width: "100%",
                        height: 190,
                        objectFit: "cover",
                        borderRadius: 20,
                        border: "1px solid rgba(232,196,107,.18)",
                      }}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 14 }}>
              <Metric title="Zoning" value={from(deal, "zoning", "zoning_type") || "Not listed"} />
              <Metric title="Utilities" value={from(deal, "utilities", "utility_access") || "Not listed"} />
              <Metric title="Road Access" value={from(deal, "road_access", "access", "frontage", "road_frontage") || "Not listed"} />
              <Metric title="NOI / Cap" value={[from(deal, "noi", "net_operating_income"), from(deal, "cap_rate")].filter(Boolean).join(" / ") || "Not listed"} />
              <Metric title="Timeline" value={from(deal, "timeline", "deadline") || "Not listed"} />
              <Metric title="Capital Need" value={from(deal, "capital_needed", "funding_needed") || "Not listed"} />
            </section>

            <NotesBlock title="Routing Need" value={from(deal, "routing_needs", "deal_needs", "needs", "route_context")} />
            <NotesBlock title="Signal Pressure" value={from(deal, "distress_signals", "seller_pressure", "pain_signals")} />
            <NotesBlock title="Seller / Situation" value={from(deal, "seller_situation")} />
            <NotesBlock title="Access Notes" value={from(deal, "access_notes")} />
            <NotesBlock title="Private Notes" value={from(deal, "private_notes")} />
            <NotesBlock title="Deal Notes" value={from(deal, "description", "notes", "note")} />

            <section style={{ ...card, opacity: 0.72 }}>
              <div style={label}>Internal Reference</div>
              <p style={{ ...muted, margin: "10px 0 0" }}>
                Reference hidden from top view. Deal room loaded successfully.
              </p>
              <p style={{ ...muted, fontSize: 13, margin: "10px 0 0" }}>
                Deal reference: {dealId || "Loaded"} {signalId ? "• Signal linked" : ""}
              </p>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
