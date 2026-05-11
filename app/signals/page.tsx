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

function metadata(row: Row) {
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

function list(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(clean).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[,\n|]/)
      .map(clean)
      .filter(Boolean);
  }

  return [];
}

function titleOf(row: Row) {
  const m = metadata(row);
  return first(row.title, row.signal_title, row.event_title, row.alert_title, row.subject, m.title, m.signal_title, "VaultForge Signal");
}

function summaryOf(row: Row) {
  const m = metadata(row);
  return first(row.ai_summary, row.summary, row.note, row.notes, row.description, row.message, row.body, m.ai_summary, m.summary, m.note, m.notes, m.description, "VaultForge signal created. Review details, route to the right member type, and keep communication controlled inside the platform.");
}

function signalIdOf(row: Row, fallback = "") {
  const m = metadata(row);
  return first(row.signal_id, row.signalId, row.id, m.signal_id, fallback);
}

function itemIdOf(row: Row) {
  const m = metadata(row);
  return first(row.item_id, row.itemId, row.pain_id, row.deal_id, row.project_id, m.item_id, m.pain_id, m.deal_id, m.project_id);
}

function ownerEmailOf(row: Row) {
  const m = metadata(row);
  return cleanEmail(first(row.owner_email, row.submitted_by_email, row.created_by_email, row.member_email, row.target_email, row.recipient_email, m.owner_email, m.submitted_by_email, m.created_by_email, m.member_email, m.target_email, m.recipient_email));
}

function getPhotos(row: Row) {
  const m = metadata(row);
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

  const urls = values
    .map((item: any) => {
      if (typeof item === "string") return clean(item);
      if (item && typeof item === "object") return clean(item.url || item.publicUrl || item.photo_url || item.image_url);
      return "";
    })
    .filter((url) => url.startsWith("http"));

  return Array.from(new Set(urls));
}

function numberText(value: unknown) {
  return clean(value) || "Not listed";
}

function moneyPresent(value: unknown) {
  return clean(value).replace(/[$,\s]/g, "").length > 0;
}

function deriveSignal(row: Row) {
  const m = metadata(row);

  const title = titleOf(row);
  const signalId = signalIdOf(row);
  const itemId = itemIdOf(row);
  const assetType = first(row.asset_type, m.asset_type, "Unknown");
  const painType = first(row.pain_type, row.action, row.type, m.pain_type, m.action, "Signal");
  const state = first(row.state, row.market, row.operating_state, m.operating_state, m.state, m.market);
  const city = first(row.city, m.city);
  const area = first(row.area, row.submarket, m.area, m.submarket);
  const urgency = first(row.priority, row.urgency, m.urgency, m.urgency_level, "Normal");
  const timeline = first(row.timeline, m.timeline);
  const address = first(row.address, row.property_address, m.address, m.property_address);
  const help = first(row.help_requested, row.requested_help, row.message, m.help_requested, m.requested_help);
  const asking = first(row.asking_price, m.asking_price);
  const arv = first(row.arv_value, row.estimated_value, m.arv_value, m.estimated_value);
  const repairs = first(row.repairs_needed, row.estimated_repairs, m.repairs_needed, m.estimated_repairs);
  const capital = first(row.capital_needed, m.capital_needed);
  const owner = ownerEmailOf(row);
  const photos = getPhotos(row);

  const suppliedBestActions = list(row.best_actions || m.best_actions);
  const suppliedRiskFlags = list(row.risk_flags || m.risk_flags);
  const suppliedRoutes = list(row.suggested_routes || m.suggested_routes || row.ai_tags || m.ai_tags || row.role_needed || m.role_needed);

  const routes = new Set<string>(suppliedRoutes);

  const lower = [title, help, summaryOf(row), painType, assetType].join(" ").toLowerCase();

  if (lower.includes("buyer")) routes.add("Buyer Match");
  if (lower.includes("capital") || lower.includes("fund") || lower.includes("lender") || moneyPresent(capital)) routes.add("Capital / Lender");
  if (lower.includes("contractor") || lower.includes("repair")) routes.add("Contractor / Operator");
  if (assetType.toLowerCase().includes("commercial")) routes.add("Commercial Buyer / Operator");
  if (assetType.toLowerCase().includes("land")) routes.add("Builder / Land Buyer");
  if (lower.includes("permit") || lower.includes("city") || lower.includes("zoning")) routes.add("Permit / Attorney");
  if (!routes.size) routes.add("Owner Review");

  const riskFlags = [...suppliedRiskFlags];

  if (!photos.length) riskFlags.push("No usable photos attached");
  if (!address) riskFlags.push("Address/location incomplete");
  if (!moneyPresent(asking)) riskFlags.push("Asking price missing");
  if (!moneyPresent(arv)) riskFlags.push("ARV/value missing");
  if (!timeline) riskFlags.push("Timeline missing");
  if (!help) riskFlags.push("Help request unclear");
  if (urgency.toLowerCase().includes("high") || urgency.toLowerCase().includes("emergency")) riskFlags.push("High urgency");

  const uniqueRisks = Array.from(new Set(riskFlags)).slice(0, 8);

  const bestActions = [...suppliedBestActions];

  if (!bestActions.length) {
    bestActions.push("Confirm control of the opportunity and who has decision authority.");
    bestActions.push("Verify address, photos, asking price, ARV/value, repair scope, and timeline.");
    bestActions.push("Route to the matching member category before releasing private contact details.");
  }

  if (routes.has("Buyer Match")) bestActions.push("Route to matched buyers in the operating state.");
  if (routes.has("Capital / Lender")) bestActions.push("Send controlled funding request to lender/capital members.");
  if (routes.has("Contractor / Operator")) bestActions.push("Request contractor/operator review for scope, timeline, and execution risk.");
  if (assetType.toLowerCase().includes("commercial")) bestActions.push("Request rent roll, NOI, lease status, and tenant/occupancy details.");
  if (assetType.toLowerCase().includes("land")) bestActions.push("Verify zoning, utilities, road access, entitlement status, and builder demand.");

  const priorityRaw = Number(row.priority_score || row.confidence_score || row.match_score || m.priority_score || m.confidence_score || 0);
  let score = Number.isFinite(priorityRaw) && priorityRaw > 0 ? priorityRaw : 55;

  if (urgency.toLowerCase().includes("emergency")) score += 20;
  else if (urgency.toLowerCase().includes("high")) score += 15;
  if (photos.length) score += 8;
  if (moneyPresent(asking) || moneyPresent(arv)) score += 8;
  if (moneyPresent(capital)) score += 6;
  if (address) score += 5;
  if (timeline) score += 5;
  score = Math.max(0, Math.min(100, Math.round(score)));

  const pressure =
    score >= 85 ? "Critical" : score >= 70 ? "High" : score >= 50 ? "Active" : "Monitor";

  const location = [city, state].filter(Boolean).join(", ") || state || "Market not listed";

  const routeSummary = first(
    row.route_summary,
    m.route_summary,
    `Suggested route: ${Array.from(routes).join(", ")}. Priority score: ${score}.`
  );

  return {
    title,
    signalId,
    itemId,
    assetType,
    painType,
    state,
    city,
    area,
    location,
    urgency,
    timeline,
    address,
    help,
    asking,
    arv,
    repairs,
    capital,
    owner,
    photos,
    summary: summaryOf(row),
    bestActions: Array.from(new Set(bestActions)).slice(0, 8),
    riskFlags: uniqueRisks.length ? uniqueRisks : ["No major missing-data flags detected"],
    routes: Array.from(routes).slice(0, 8),
    score,
    pressure,
    routeSummary,
    assetSpecific: m.asset_specific && typeof m.asset_specific === "object" ? m.asset_specific : {},
  };
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 30%), radial-gradient(circle at 85% 12%, rgba(157,243,191,.10), transparent 28%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 96px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  width: "min(1220px,100%)",
  margin: "0 auto",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.26)",
  borderRadius: 28,
  padding: 24,
  background:
    "linear-gradient(145deg,rgba(255,255,255,.070),rgba(255,255,255,.030))",
  boxShadow: "0 26px 86px rgba(0,0,0,.28)",
  marginBottom: 18,
  overflow: "hidden",
};

const blackCard: React.CSSProperties = {
  ...card,
  background:
    "radial-gradient(circle at top left,rgba(232,196,107,.08),transparent 32%), linear-gradient(145deg,rgba(255,255,255,.055),rgba(0,0,0,.20))",
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

const greenEyebrow: React.CSSProperties = {
  color: "#9df3bf",
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

const muted: React.CSSProperties = {
  color: "#cbd5e1",
  lineHeight: 1.55,
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
  maxWidth: "100%",
};

function InfoLine({ label, value }: { label: string; value: unknown }) {
  const text = clean(value);
  if (!text) return null;

  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,.08)", padding: "10px 0" }}>
      <div style={{ color: "#94a3b8", fontSize: 12, textTransform: "uppercase", letterSpacing: ".12em", fontWeight: 900 }}>{label}</div>
      <div style={{ marginTop: 4, fontSize: 17, fontWeight: 850, overflowWrap: "anywhere" }}>{text}</div>
    </div>
  );
}

function ListCard({
  title,
  items,
  tone = "green",
}: {
  title: string;
  items: string[];
  tone?: "green" | "red" | "gold" | "blue";
}) {
  const style =
    tone === "red"
      ? { color: "#ffd0d0", borderColor: "rgba(255,120,120,.28)", background: "rgba(255,120,120,.08)" }
      : tone === "gold"
      ? { color: "#f8e7b0", borderColor: "rgba(232,196,107,.28)", background: "rgba(232,196,107,.08)" }
      : tone === "blue"
      ? { color: "#8fd3ff", borderColor: "rgba(56,189,248,.28)", background: "rgba(56,189,248,.08)" }
      : { color: "#9df3bf", borderColor: "rgba(157,243,191,.22)", background: "rgba(157,243,191,.07)" };

  return (
    <section style={card}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      <div style={{ display: "grid", gap: 10 }}>
        {items.map((item) => (
          <div
            key={item}
            style={{
              border: `1px solid ${style.borderColor}`,
              borderRadius: 18,
              padding: 13,
              color: style.color,
              background: style.background,
              lineHeight: 1.4,
              fontWeight: 850,
            }}
          >
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}

function Gauge({ score }: { score: number }) {
  return (
    <div>
      <div style={{ height: 14, borderRadius: 999, background: "rgba(255,255,255,.14)", overflow: "hidden", border: "1px solid rgba(255,255,255,.10)" }}>
        <div
          style={{
            width: `${Math.max(0, Math.min(100, score))}%`,
            height: "100%",
            background: "linear-gradient(90deg,#ff4d4d,#f8e7b0,#9df3bf,#38bdf8)",
          }}
        />
      </div>
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
        `/api/intelligence/feed?email=${encodeURIComponent(viewer)}&owner=0`,
      ];

      for (const url of urls) {
        try {
          const res = await fetch(url, {
            cache: "no-store",
            headers: { "x-vf-email": viewer || "", "x-vf-admin": "0" },
          });

          const data = await safeJson(res);

          const direct = data.signal || data.item || data.record || data.pain || data.action || data.data;
          const lists = [
            ...(Array.isArray(data.signals) ? data.signals : []),
            ...(Array.isArray(data.pains) ? data.pains : []),
            ...(Array.isArray(data.actions) ? data.actions : []),
            ...(Array.isArray(data.intelligence) ? data.intelligence : []),
            ...(Array.isArray(data.data) ? data.data : []),
          ];

          const candidates = direct && !Array.isArray(direct) ? [direct, ...lists] : lists;

          const match = candidates.find((item: Row) => {
            return (
              signalIdOf(item) === signalId ||
              itemIdOf(item) === signalId ||
              clean(item.id) === signalId ||
              clean(metadata(item).signal_id) === signalId ||
              clean(metadata(item).pain_id) === signalId
            );
          });

          if (match) {
            setRow(match);
            setStatus("");
            return;
          }
        } catch {
          // Keep looking through available feeds.
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

  const data = useMemo(() => deriveSignal(row || { signal_id: signalId }), [row, signalId]);

  const connectHref = data.signalId
    ? `/connect/${encodeURIComponent(data.signalId)}?email=${encodeURIComponent(email)}${data.itemId ? `&item_id=${encodeURIComponent(data.itemId)}` : ""}`
    : "/messages";

  const assetSpecificEntries = Object.entries(data.assetSpecific || {}).filter(([, value]) => clean(value));

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        @media (max-width: 820px) {
          .vf-grid,
          .vf-three,
          .vf-two {
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
        <VaultForgeMemberNav
          title="Signal Room"
          subtitle="Structured deal intelligence, routing recommendation, best actions, and execution pressure."
          active="signals"
        />

        <section style={blackCard}>
          <p style={eyebrow}>VaultForge Signal Intelligence</p>

          <div className="vf-two" style={{ display: "grid", gridTemplateColumns: "1.25fr .75fr", gap: 20, alignItems: "start" }}>
            <div>
              <h1 style={{ fontSize: "clamp(48px,10vw,96px)", lineHeight: 0.88, margin: "10px 0 18px", letterSpacing: "-.06em" }}>
                {data.title}
              </h1>

              <p style={{ ...muted, fontSize: 20 }}>{data.summary}</p>

              <div style={{ marginTop: 16 }}>
                <span style={chip}>Signal: {data.signalId || "pending"}</span>
                {data.itemId ? <span style={chip}>Item: {data.itemId}</span> : null}
                <span style={chip}>Asset: {data.assetType}</span>
                <span style={chip}>Market: {data.location}</span>
                <span style={chip}>Pressure: {data.pressure}</span>
              </div>
            </div>

            <div style={{ border: "1px solid rgba(232,196,107,.22)", borderRadius: 24, padding: 18, background: "rgba(0,0,0,.20)" }}>
              <p style={greenEyebrow}>Priority Score</p>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
                <div style={{ fontSize: 72, lineHeight: 1, fontWeight: 950, color: "#f8e7b0" }}>{data.score}</div>
                <div style={{ color: "#cbd5e1", marginBottom: 10, fontWeight: 850 }}>/ 100</div>
              </div>
              <Gauge score={data.score} />
              <p style={{ ...muted, marginBottom: 0 }}>
                {data.pressure} execution pressure based on urgency, photos, numbers, location, and route context.
              </p>
            </div>
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
            <Link href={connectHref} style={button}>Message Owner</Link>
            <Link href={`/routing-room/${encodeURIComponent(data.signalId || signalId)}`} style={ghost}>Routing Room</Link>
            <Link href="/pain-feed" style={ghost}>Pain Feed</Link>
            <button type="button" style={ghost} onClick={load}>Refresh</button>
          </div>
        </section>

        <section className="vf-three" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 18 }}>
          <ListCard title="Best Actions" items={data.bestActions} tone="gold" />
          <ListCard title="Risk Flags" items={data.riskFlags} tone="red" />
          <ListCard title="Suggested Routes" items={data.routes} tone="green" />
        </section>

        <section className="vf-two" style={{ display: "grid", gridTemplateColumns: "1.05fr .95fr", gap: 18 }}>
          <section style={card}>
            <h2 style={{ marginTop: 0 }}>Signal Overview</h2>
            <InfoLine label="Type" value={data.painType} />
            <InfoLine label="Asset" value={data.assetType} />
            <InfoLine label="Market" value={data.location} />
            <InfoLine label="Area / Submarket" value={data.area} />
            <InfoLine label="Urgency" value={data.urgency} />
            <InfoLine label="Timeline" value={data.timeline} />
            <InfoLine label="Owner" value={data.owner} />
          </section>

          <section style={card}>
            <h2 style={{ marginTop: 0 }}>Numbers / Pressure</h2>
            <InfoLine label="Capital Needed" value={numberText(data.capital)} />
            <InfoLine label="Asking Price" value={numberText(data.asking)} />
            <InfoLine label="ARV / Value" value={numberText(data.arv)} />
            <InfoLine label="Repairs / Remaining Work" value={numberText(data.repairs)} />
            <InfoLine label="Address / Location" value={data.address || "Not listed"} />
          </section>
        </section>

        <section style={card}>
          <h2 style={{ marginTop: 0 }}>Photos / Asset Context</h2>

          {data.photos.length ? (
            <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 14 }}>
              {data.photos.map((url, index) => (
                <div key={`${url}-${index}`} style={{ borderRadius: 22, overflow: "hidden", border: "1px solid rgba(232,196,107,.22)", background: "rgba(0,0,0,.22)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`VaultForge signal asset ${index + 1}`}
                    style={{ width: "100%", height: 280, objectFit: "cover", display: "block" }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p style={muted}>No valid photos connected yet.</p>
          )}
        </section>

        {assetSpecificEntries.length ? (
          <section style={card}>
            <p style={eyebrow}>Asset-Specific Intake</p>
            <h2 style={{ marginTop: 6 }}>{data.assetType} field details</h2>

            <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
              {assetSpecificEntries.map(([key, value]) => (
                <div key={key} style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 18, padding: 14, background: "rgba(255,255,255,.04)" }}>
                  <div style={{ color: "#94a3b8", fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 900 }}>
                    {key.replace(/_/g, " ")}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 18, fontWeight: 850, overflowWrap: "anywhere" }}>
                    {clean(value)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section style={card}>
          <p style={eyebrow}>Routing Summary</p>
          <h2 style={{ marginTop: 6 }}>Recommended execution path</h2>
          <p style={{ ...muted, fontSize: 20 }}>{data.routeSummary}</p>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            <Link href={`/routing-room/${encodeURIComponent(data.signalId || signalId)}`} style={button}>Open Routing Room</Link>
            <Link href={connectHref} style={ghost}>Start Controlled Message</Link>
            <Link href="/activity" style={ghost}>Activity</Link>
            <Link href="/messages" style={ghost}>Messages</Link>
          </div>
        </section>

        {status ? <section style={card}>{status}</section> : null}
      </div>
    </main>
  );
}
