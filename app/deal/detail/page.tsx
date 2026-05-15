"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Deal = Record<string, any>;

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

function meta(row: Deal | null) {
  return row && typeof row.metadata === "object" && row.metadata ? row.metadata : {};
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
          return clean(item.url || item.publicUrl || item.public_url || item.photo_url || item.image_url || item.main_photo_url || item.src);
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
    ...parseArray(deal.photos),
    ...parseArray(m.photo_urls),
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

function numberValue(value: unknown) {
  const text = clean(value);
  if (!text) return null;
  const number = Number(text.replace(/[^\d.-]/g, ""));
  return Number.isFinite(number) ? number : null;
}

function marketText(deal: Deal | null) {
  return [from(deal, "city"), from(deal, "state")].filter(Boolean).join(", ") || from(deal, "market", "location", "address", "property_address") || "Market not listed";
}

function titleOf(deal: Deal | null) {
  return first(from(deal, "title", "deal_title", "project_title"), from(deal, "address"), "Deal Room");
}

function assetType(deal: Deal | null) {
  return from(deal, "property_type", "deal_type", "asset_type") || "Deal";
}

function strategyOf(deal: Deal | null) {
  return from(deal, "strategy", "exit_strategy", "deal_strategy") || "Awaiting strategy classification";
}

function ownerOf(deal: Deal | null) {
  return cleanEmail(from(deal, "owner_email", "member_email", "user_email", "submitted_by_email", "created_by_email", "submitted_by", "email"));
}

function askValue(deal: Deal | null) {
  return from(deal, "asking_price", "price", "ask", "purchase_price");
}

function arvValue(deal: Deal | null) {
  return from(deal, "arv", "arv_value", "estimated_value", "after_repair_value");
}

function repairsValue(deal: Deal | null) {
  return from(deal, "repair_estimate", "repairs_needed", "estimated_repairs", "rehab_budget", "repair_budget");
}

function spreadText(deal: Deal | null) {
  const ask = numberValue(askValue(deal));
  const arv = numberValue(arvValue(deal));
  const repairs = numberValue(repairsValue(deal));

  if (ask === null || arv === null) return "Need ask + ARV";

  const spread = arv - ask - (repairs || 0);
  return money(spread);
}

function spreadTone(deal: Deal | null) {
  const ask = numberValue(askValue(deal));
  const arv = numberValue(arvValue(deal));
  const repairs = numberValue(repairsValue(deal)) || 0;
  if (ask === null || arv === null) return "neutral";
  const spread = arv - ask - repairs;
  if (spread >= 75000) return "strong";
  if (spread >= 25000) return "watch";
  return "risk";
}

function bedsBaths(deal: Deal | null) {
  return [from(deal, "beds", "bedrooms"), from(deal, "baths", "bathrooms")].filter(Boolean).join(" / ") || "Not listed";
}

function sizeText(deal: Deal | null) {
  return from(deal, "sqft", "square_feet", "building_sqft", "lot_size", "acres", "land_acres") || "Not listed";
}

function routeNeed(deal: Deal | null) {
  return from(deal, "routing_needs", "deal_needs", "needs", "route_context") || "Owner review pending";
}

function pressureText(deal: Deal | null) {
  return from(deal, "distress_signals", "seller_pressure", "pain_signals", "urgency", "urgency_level", "seller_situation") || "No urgent pressure detected yet.";
}

function summaryText(deal: Deal | null) {
  const saved = first(
    from(deal, "ai_route_summary", "route_summary", "routing_summary", "ai_summary"),
    from(deal, "description", "notes", "note")
  );

  if (saved) return saved;

  const parts = [
    `${assetType(deal)} opportunity in ${marketText(deal)}.`,
    `Strategy: ${strategyOf(deal)}.`,
    `Economics: ask ${money(askValue(deal))}, ARV ${money(arvValue(deal))}, repairs ${money(repairsValue(deal))}, spread ${spreadText(deal)}.`,
    `Routing read: ${routeNeed(deal)}.`,
    `Pressure: ${pressureText(deal)}.`,
  ];

  return parts.join(" ");
}

function smartSummaryText(deal: Deal | null) {
  const saved = first(
    from(deal, "ai_route_summary", "route_summary", "routing_summary", "ai_summary"),
    from(deal, "description", "notes", "note")
  );

  if (saved) return saved;

  const parts: string[] = [];
  parts.push(`${assetType(deal)} opportunity in ${marketText(deal)}.`);

  const strategy = strategyOf(deal);
  if (strategy && strategy !== "Awaiting strategy classification") {
    parts.push(`Strategy reads as ${strategy}.`);
  } else {
    parts.push("Strategy classification is still pending.");
  }

  const ask = askValue(deal);
  const arv = arvValue(deal);
  const repairs = repairsValue(deal);

  if (ask || arv || repairs) {
    parts.push(
      `Known economics: ask ${money(ask)}, ARV ${money(arv)}, repairs ${money(repairs)}, spread ${spreadText(deal)}.`
    );
  } else {
    parts.push("Underwriting is pending: ask, ARV, and repairs still need confirmation.");
  }

  const route = routeNeed(deal);
  if (route && route !== "Owner review pending") {
    parts.push(`Routing read: ${route}.`);
  } else {
    parts.push("Routing requires owner review before broad circulation.");
  }

  return parts.join(" ");
}

function routeStack(deal: Deal | null) {
  const text = `${routeNeed(deal)} ${pressureText(deal)} ${strategyOf(deal)} ${assetType(deal)}`.toLowerCase();
  const stack: string[] = [];

  if (text.includes("buyer") || text.includes("wholesale") || text.includes("assign") || text.includes("flip")) stack.push("Cash Buyer");
  if (text.includes("contractor") || text.includes("repair") || text.includes("rehab")) stack.push("Contractor / Rehab Operator");
  if (text.includes("lender") || text.includes("capital") || text.includes("funding")) stack.push("Private Lender");
  if (text.includes("jv") || text.includes("partner") || text.includes("operator")) stack.push("JV / Operator");
  if (text.includes("land") || text.includes("develop") || text.includes("entitlement")) stack.push("Builder / Developer");
  if (text.includes("commercial") || text.includes("noi") || text.includes("cap")) stack.push("Commercial Investor");

  if (!stack.length) stack.push("Buyer", "Operator", "Owner Review");
  return Array.from(new Set(stack)).slice(0, 5);
}

function bestNextMove(deal: Deal | null) {
  const text = `${routeNeed(deal)} ${pressureText(deal)} ${strategyOf(deal)} ${assetType(deal)}`.toLowerCase();

  if (text.includes("lender") || text.includes("funding") || text.includes("capital")) {
    return "Verify ask, ARV, repairs, and timeline, then route to private capital before releasing sensitive owner details.";
  }

  if (text.includes("contractor") || text.includes("repair") || text.includes("rehab")) {
    return "Get repair scope priced first, then route the deal to buyers/operators with the spread already protected.";
  }

  if (text.includes("fast close") || text.includes("urgent") || text.includes("foreclosure")) {
    return "Prioritize speed: package photos, numbers, and access notes, then route to cash buyers with proof-of-funds discipline.";
  }

  if (text.includes("land") || text.includes("entitlement") || text.includes("develop")) {
    return "Package zoning, utilities, access, acreage, and entitlement status, then route to builders/developers first.";
  }

  if (text.includes("commercial") || text.includes("noi") || text.includes("cap")) {
    return "Confirm income, tenant status, and cap-rate assumptions, then route to commercial investors or owner-users.";
  }

  return "Confirm the missing execution details, then route to the highest-fit buyer/operator stack instead of broadcasting broadly.";
}

function confidenceScore(deal: Deal | null) {
  let score = 34;
  if (askValue(deal)) score += 10;
  if (arvValue(deal)) score += 10;
  if (repairsValue(deal)) score += 8;
  if (from(deal, "beds", "bedrooms", "sqft", "building_sqft", "acres", "land_acres")) score += 8;
  if (from(deal, "strategy", "exit_strategy")) score += 8;
  if (routeNeed(deal) && routeNeed(deal) !== "Owner review / buyer route") score += 12;
  if (pressureText(deal) && pressureText(deal) !== "No urgent pressure listed.") score += 8;
  if (photosOf(deal).length) score += 10;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function urgencyScore(deal: Deal | null) {
  const text = pressureText(deal).toLowerCase();
  let score = 34;
  if (text.includes("urgent")) score += 26;
  if (text.includes("fast close")) score += 22;
  if (text.includes("foreclosure")) score += 26;
  if (text.includes("funding gap")) score += 18;
  if (text.includes("deadline")) score += 16;
  if (routeNeed(deal) && routeNeed(deal) !== "Owner review / buyer route") score += 8;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function riskRead(deal: Deal | null) {
  const missing: string[] = [];
  if (!askValue(deal)) missing.push("ask");
  if (!arvValue(deal)) missing.push("ARV/value");
  if (!repairsValue(deal)) missing.push("repairs/scope");
  if (!from(deal, "occupancy", "tenant_status")) missing.push("occupancy");
  if (!from(deal, "access_notes")) missing.push("access notes");

  if (!missing.length) return "Core underwriting and execution fields are present. Ready for controlled routing.";
  return `Clarify ${missing.slice(0, 4).join(", ")} before wide routing.`;
}

function valueText(value: unknown) {
  return clean(value) || "Not listed";
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at 8% 0%, rgba(232,196,107,.18), transparent 28%), radial-gradient(circle at 92% 10%, rgba(86,216,255,.12), transparent 28%), linear-gradient(180deg,#020409,#071326 54%,#020409)",
  color: "white",
  padding: "22px 16px 96px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  width: "min(1240px,100%)",
  margin: "0 auto",
};

const panel: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.22)",
  borderRadius: 28,
  background: "linear-gradient(145deg,rgba(255,255,255,.07),rgba(255,255,255,.028))",
  boxShadow: "0 24px 90px rgba(0,0,0,.32)",
};

const card: React.CSSProperties = {
  ...panel,
  padding: 20,
  marginBottom: 16,
};

const label: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".18em",
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
  padding: "12px 17px",
  border: 0,
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
  fontWeight: 950,
  textDecoration: "none",
};

const ghost: React.CSSProperties = {
  ...button,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.15)",
  color: "white",
};

const compactNav: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  marginBottom: 14,
};

const smallGhost: React.CSSProperties = {
  ...ghost,
  minHeight: 38,
  padding: "8px 12px",
  fontSize: 13,
};

const smallGold: React.CSSProperties = {
  ...button,
  minHeight: 38,
  padding: "8px 12px",
  fontSize: 13,
};

const dangerButton: React.CSSProperties = {
  ...smallGhost,
  border: "1px solid rgba(248,113,113,.35)",
  color: "#fecaca",
  background: "rgba(248,113,113,.10)",
};

const chip: React.CSSProperties = {
  border: "1px solid rgba(157,243,191,.22)",
  borderRadius: 999,
  padding: "7px 10px",
  color: "#9df3bf",
  background: "rgba(157,243,191,.07)",
  fontSize: 12,
  fontWeight: 900,
  display: "inline-flex",
};

function Mini({ labelText, value, tone }: { labelText: string; value: unknown; tone?: "strong" | "watch" | "risk" | "neutral" }) {
  const colors = {
    strong: { border: "rgba(157,243,191,.28)", bg: "rgba(157,243,191,.075)", color: "#9df3bf" },
    watch: { border: "rgba(232,196,107,.28)", bg: "rgba(232,196,107,.075)", color: "#f8e7b0" },
    risk: { border: "rgba(248,113,113,.30)", bg: "rgba(248,113,113,.075)", color: "#fecaca" },
    neutral: { border: "rgba(255,255,255,.12)", bg: "rgba(255,255,255,.045)", color: "white" },
  }[tone || "neutral"];

  return (
    <div style={{ border: `1px solid ${colors.border}`, borderRadius: 18, padding: 14, background: colors.bg }}>
      <div style={{ ...label, color: colors.color }}>{labelText}</div>
      <div style={{ marginTop: 8, fontSize: 22, fontWeight: 1000, color: colors.color }}>{clean(value) || "Not listed"}</div>
    </div>
  );
}

function Score({ labelText, value, caption }: { labelText: string; value: number; caption: string }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,.11)", borderRadius: 18, padding: 14, background: "rgba(0,0,0,.16)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12, fontWeight: 950 }}>
        <span>{labelText}</span>
        <span>{value}%</span>
      </div>
      <div style={{ height: 9, borderRadius: 999, background: "rgba(255,255,255,.12)", overflow: "hidden", marginTop: 10 }}>
        <div style={{ width: `${value}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#ff6b6b,#f8e7b0,#56d8ff)" }} />
      </div>
      <p style={{ ...muted, margin: "8px 0 0", fontSize: 13 }}>{caption}</p>
    </div>
  );
}

function DetailRow({ labelText, value }: { labelText: string; value: unknown }) {
  return (
    <div style={{ borderTop: "1px solid rgba(255,255,255,.08)", padding: "12px 0" }}>
      <div style={{ ...label, fontSize: 10 }}>{labelText}</div>
      <div style={{ marginTop: 5, color: "#e5eefb", fontWeight: 800 }}>{valueText(value)}</div>
    </div>
  );
}

export default function DealDetailPage() {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [status, setStatus] = useState("Loading deal...");
  const [dealId, setDealId] = useState("");
  const [returnTo, setReturnTo] = useState("/smart-ai");
  const [roomHidden, setRoomHidden] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams(window.location.search);
        const id = clean(params.get("id"));
        const fromParam = clean(params.get("from"));
        const safeFrom =
          fromParam.startsWith("/") &&
          !fromParam.startsWith("//") &&
          !fromParam.includes("://")
            ? fromParam
            : "/smart-ai";

        setDealId(id);
        setReturnTo(safeFrom);

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

  function hideFromWorkstations() {
    if (typeof window === "undefined") return;

    const key = "vf_smart_ai_deleted_" + (ownerOf(deal) || "guest");
    const itemKey = ["deal", dealId || from(deal, "id", "deal_id"), titleOf(deal), marketText(deal)].join("|");

    try {
      const raw = window.localStorage.getItem(key);
      const list = raw ? JSON.parse(raw) : [];
      const next = Array.isArray(list) ? Array.from(new Set([...list, itemKey])) : [itemKey];
      window.localStorage.setItem(key, JSON.stringify(next));
      setRoomHidden(true);
    } catch {
      setRoomHidden(true);
    }
  }

  const photos = useMemo(() => photosOf(deal), [deal]);
  const signalId = from(deal, "signal_id", "canonical_event_id", "routing_id");
  const owner = ownerOf(deal);
  const routeItems = routeStack(deal);
  const confidence = confidenceScore(deal);
  const urgency = urgencyScore(deal);
  const spreadToneValue = spreadTone(deal);

  return (
    <main style={page}>
      <style>{`
        @media (max-width: 860px) {
          .vf-hero,
          .vf-grid,
          .vf-actions,
          .vf-two {
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
        <section className="vf-hero" style={{ ...panel, display: "grid", gridTemplateColumns: "minmax(280px,420px) 1fr", gap: 22, padding: 18, marginBottom: 16 }}>
          <div style={{ borderRadius: 24, overflow: "hidden", border: "1px solid rgba(232,196,107,.18)", background: "rgba(0,0,0,.24)", minHeight: 300 }}>
            {photos[0] ? (
              <img src={photos[0]} alt="Deal" style={{ width: "100%", height: "100%", minHeight: 300, objectFit: "cover", display: "block" }} />
            ) : (
              <div style={{ minHeight: 300, display: "grid", placeItems: "center", color: "#94a3b8", fontWeight: 900 }}>No photo connected</div>
            )}
          </div>

          <div style={{ padding: "8px 4px" }}>
            <div style={compactNav}>
              <Link href={returnTo} style={smallGold}>Workstations</Link>
              <Link href="/dashboard" style={smallGhost}>Dashboard</Link>
              <Link href="/projects" style={smallGhost}>Projects</Link>
              <Link
                href={`/messages/new?deal_id=${encodeURIComponent(dealId || from(deal, "id", "deal_id") || "")}&target=${encodeURIComponent(owner || "")}`}
                style={smallGhost}
              >
                Message Owner
              </Link>
              <Link href="/messages" style={smallGhost}>Messages</Link>
              <Link href="/smart-ai" style={smallGhost}>Smart AI</Link>
              {deal ? (
                <button type="button" onClick={hideFromWorkstations} style={dangerButton}>
                  {roomHidden ? "Hidden" : "Hide"}
                </button>
              ) : null}
            </div>

            <div style={label}>VaultForge Deal Command Room</div>
            <h1 style={{ fontSize: "clamp(40px,8vw,76px)", lineHeight: 0.92, letterSpacing: "-.065em", margin: "10px 0 12px" }}>
              {deal ? titleOf(deal) : "Deal Room"}
            </h1>

            {status ? <p style={{ ...muted, fontSize: 20 }}>{status}</p> : null}

            {deal ? (
              <>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                  <span style={chip}>{assetType(deal)}</span>
                  <span style={chip}>{marketText(deal)}</span>
                  {strategyOf(deal) !== "Awaiting strategy classification" ? <span style={chip}>{strategyOf(deal)}</span> : null}
                  {owner ? <span style={chip}>Owner: {owner}</span> : null}
                </div>

                <div style={{ border: "1px solid rgba(232,196,107,.22)", borderRadius: 22, padding: 16, background: "rgba(232,196,107,.06)", marginBottom: 14 }}>
                  <div style={label}>AI Summary</div>
                  <p style={{ ...muted, margin: "9px 0 0", fontSize: 17 }}>{smartSummaryText(deal)}</p>
                </div>

                <div style={{ border: "1px solid rgba(157,243,191,.23)", borderRadius: 22, padding: 16, background: "rgba(157,243,191,.065)", marginBottom: 14 }}>
                  <div style={{ ...label, color: "#9df3bf" }}>Best Next Move</div>
                  <p style={{ color: "#dfffea", margin: "9px 0 0", fontSize: 17, lineHeight: 1.55, fontWeight: 800 }}>{bestNextMove(deal)}</p>
                </div>
              </>
            ) : null}
          </div>
        </section>

        {deal ? (
          <>
            <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12, marginBottom: 16 }}>
              <Mini labelText="Ask" value={askValue(deal) ? money(askValue(deal)) : "Pending underwriting"} />
              <Mini labelText="ARV" value={arvValue(deal) ? money(arvValue(deal)) : "Pending underwriting"} />
              <Mini labelText="Repairs" value={repairsValue(deal) ? money(repairsValue(deal)) : "Pending scope"} />
              <Mini labelText="Spread" value={spreadText(deal)} tone={spreadToneValue as any} />
            </section>

            <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "1.3fr .9fr .9fr", gap: 14, marginBottom: 16 }}>
              <div style={card}>
                <div style={label}>Route Stack</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                  {routeItems.map((item) => (
                    <span key={item} style={chip}>{item}</span>
                  ))}
                </div>
                <p style={{ ...muted, margin: "14px 0 0" }}>{routeNeed(deal)}</p>
              </div>

              <Score labelText="Confidence" value={confidence} caption={riskRead(deal)} />
              <Score labelText="Urgency" value={urgency} caption={pressureText(deal)} />
            </section>

            <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12, marginBottom: 16 }}>
              <Mini labelText="Beds / Baths" value={bedsBaths(deal)} />
              <Mini labelText="Size" value={sizeText(deal)} />
              <Mini labelText="Year Built" value={from(deal, "year_built", "built_year") || "Not listed"} />
              <Mini labelText="Occupancy" value={from(deal, "occupancy", "occupancy_status", "tenant_status") || "Not listed"} />
            </section>

            {photos.length > 1 ? (
              <section style={card}>
                <div style={label}>Photo Strip</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10, marginTop: 12 }}>
                  {photos.slice(1).map((photo) => (
                    <img key={photo} src={photo} alt="Deal" style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 16, border: "1px solid rgba(232,196,107,.16)" }} />
                  ))}
                </div>
              </section>
            ) : null}

            <section className="vf-two" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
              <div style={card}>
                <div style={label}>Situation Brief</div>
                <p style={{ ...muted, fontSize: 17 }}>{from(deal, "seller_situation", "description", "notes", "private_notes") || "No seller/situation notes listed."}</p>
              </div>

              <div style={card}>
                <div style={label}>Access / Execution Notes</div>
                <p style={{ ...muted, fontSize: 17 }}>{from(deal, "access_notes", "condition", "timeline", "private_notes") || "No access or execution notes listed."}</p>
              </div>
            </section>

            <section style={card}>
              <div style={label}>Detailed Deal Data</div>
              <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 18, marginTop: 10 }}>
                <div>
                  <DetailRow labelText="Property Type" value={assetType(deal)} />
                  <DetailRow labelText="Market" value={marketText(deal)} />
                  <DetailRow labelText="Address" value={from(deal, "address", "property_address", "location")} />
                  <DetailRow labelText="County" value={from(deal, "county")} />
                </div>
                <div>
                  <DetailRow labelText="Strategy" value={strategyOf(deal)} />
                  <DetailRow labelText="Timeline" value={from(deal, "timeline", "deadline", "desired_timeline")} />
                  <DetailRow labelText="Zoning" value={from(deal, "zoning", "zoning_type")} />
                  <DetailRow labelText="Utilities" value={from(deal, "utilities", "utility_access")} />
                </div>
                <div>
                  <DetailRow labelText="Road Access / Frontage" value={from(deal, "road_access", "frontage", "road_frontage")} />
                  <DetailRow labelText="NOI / Rent" value={[from(deal, "noi", "net_operating_income"), from(deal, "rent_estimate", "monthly_rent")].filter(Boolean).join(" / ")} />
                  <DetailRow labelText="Cap Rate" value={from(deal, "cap_rate")} />
                  <DetailRow labelText="Contact" value={[from(deal, "contact_name", "seller_name", "owner_name"), from(deal, "contact_phone", "seller_phone", "owner_phone"), from(deal, "contact_email", "seller_email", "owner_contact_email")].filter(Boolean).join(" / ")} />
                </div>
              </div>
            </section>

            <section style={card}>
              <div style={label}>Room Controls</div>
              <p style={{ ...muted, marginTop: 8 }}>
                Keep the room moving without getting trapped.
              </p>
              <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                <Link href={returnTo} style={button}>Return to Workstations</Link>
                <Link href="/dashboard" style={ghost}>Dashboard</Link>
                <Link href="/projects" style={ghost}>Projects</Link>
                <Link href="/smart-ai" style={ghost}>Smart AI</Link>
                <Link
                  href={`/messages/new?deal_id=${encodeURIComponent(dealId || from(deal, "id", "deal_id") || "")}&target=${encodeURIComponent(owner || "")}`}
                  style={ghost}
                >
                  Message Owner
                </Link>
                <Link href="/messages" style={ghost}>Messages</Link>
                <button type="button" onClick={hideFromWorkstations} style={dangerButton}>
                  {roomHidden ? "Hidden from Workstations" : "Hide from Workstations"}
                </button>
              </div>
            </section>

            <details style={{ ...card, padding: 0, overflow: "hidden" }}>
              <summary style={{ padding: 18, cursor: "pointer", fontWeight: 950, color: "#e8c46b", letterSpacing: ".14em", textTransform: "uppercase", fontSize: 12 }}>
                Internal IDs / Technical Links
              </summary>
              <div style={{ padding: "0 18px 18px" }}>
                <DetailRow labelText="Deal ID" value={dealId || from(deal, "id", "deal_id", "item_id")} />
                <DetailRow labelText="Signal ID" value={signalId || "Not linked"} />
                <DetailRow labelText="Owner / Submitted By" value={owner || "Not listed"} />
              </div>
            </details>
          </>
        ) : null}
      </div>
    </main>
  );
}