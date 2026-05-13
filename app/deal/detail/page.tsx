"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../../components/VaultForgeMemberNav";

export const dynamic = "force-dynamic";

type Row = Record<string, any>;

function clean(value: unknown) {
  return String(value || "").trim();
}

function money(value: unknown) {
  const text = clean(value);
  if (!text) return "Not listed";
  const n = Number(text.replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(n)) return text;
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
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
  if (Array.isArray(value)) return value.map(clean).filter(Boolean);
  const text = clean(value);
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.map(clean).filter(Boolean);
  } catch {}
  return text.split(/[,\n|;]/).map((item) => item.trim()).filter(Boolean);
}

function photosOf(row: Row) {
  const values = [
    row.main_photo_url,
    row.image_url,
    row.photo_url,
    row.primary_photo_url,
    ...(Array.isArray(row.photo_urls) ? row.photo_urls : list(row.photo_urls)),
    ...(Array.isArray(row.photos) ? row.photos : []),
  ];

  return Array.from(
    new Set(
      values
        .map((item: any) => {
          if (typeof item === "string") return clean(item);
          if (item && typeof item === "object") {
            return clean(item.url || item.publicUrl || item.public_url || item.photo_url || item.image_url);
          }
          return "";
        })
        .filter((url) => url.startsWith("http"))
    )
  );
}

function titleOf(row: Row) {
  return first(row.title, row.deal_title, row.name, row.address, "VaultForge Deal");
}

function marketOf(row: Row) {
  const city = first(row.city);
  const state = first(row.state, row.market);
  return [city, state].filter(Boolean).join(", ") || first(row.location, row.address, "Market not listed");
}

function routeSummary(row: Row) {
  return first(
    row.ai_route_summary,
    row.route_summary,
    row.routing_summary,
    row.urgency_reason,
    row.routing_reason,
    row.description,
    row.seller_situation,
    "No routing summary saved yet."
  );
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 28%), radial-gradient(circle at 88% 8%, rgba(56,189,248,.10), transparent 26%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 96px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { width: "min(1220px,100%)", margin: "0 auto" };

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.24)",
  borderRadius: 30,
  padding: 24,
  background: "linear-gradient(145deg,rgba(255,255,255,.070),rgba(255,255,255,.030))",
  boxShadow: "0 28px 86px rgba(0,0,0,.30)",
  marginBottom: 18,
};

const glass: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 22,
  padding: 18,
  background: "rgba(255,255,255,.045)",
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

function Info({ label, value }: { label: string; value: unknown }) {
  return (
    <div style={glass}>
      <div style={eyebrow}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 950, marginTop: 8 }}>{clean(value) || "Not listed"}</div>
    </div>
  );
}

function ListBlock({ label, values }: { label: string; values: string[] }) {
  return (
    <section style={glass}>
      <div style={eyebrow}>{label}</div>
      {values.length ? (
        <div style={{ marginTop: 12 }}>
          {values.map((value) => <span key={value} style={chip}>{value}</span>)}
        </div>
      ) : (
        <p style={muted}>Not listed.</p>
      )}
    </section>
  );
}

export default function DealDetailPage() {
  const [deal, setDeal] = useState<Row | null>(null);
  const [status, setStatus] = useState("Loading deal detail...");
  const [dealId, setDealId] = useState("");

  useEffect(() => {
    async function load() {
      const params = new URLSearchParams(window.location.search);
      const id = clean(params.get("id"));
      setDealId(id);

      if (!id) {
        setStatus("Missing deal id.");
        return;
      }

      try {
        const response = await fetch(`/api/deal/detail?id=${encodeURIComponent(id)}`, {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok || data?.ok === false || data?.error) {
          throw new Error(data?.error || "Deal could not be loaded.");
        }

        setDeal(data.deal || null);
        setStatus("");
      } catch (error: any) {
        setStatus(error?.message || "Deal could not be loaded.");
      }
    }

    load();
  }, []);

  const photos = useMemo(() => (deal ? photosOf(deal) : []), [deal]);
  const routingNeeds = useMemo(() => list(deal?.routing_needs || deal?.deal_needs || deal?.needs), [deal]);
  const distressSignals = useMemo(() => list(deal?.distress_signals || deal?.seller_situation), [deal]);

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover { transform: translateY(-1px); transition: all .18s ease; filter: brightness(1.06); }
        @media (max-width: 820px) {
          .vf-grid, .vf-actions, .vf-photo-grid { grid-template-columns: 1fr !important; }
          .vf-actions { display: grid !important; gap: 10px !important; }
          .vf-actions > * { width: 100%; box-sizing: border-box; justify-content: center; }
        }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav
          title="Deal Detail"
          subtitle="Deal intelligence, pricing, routing reason, photos, and execution context."
          active="projects"
        />

        <section style={card}>
          <div style={eyebrow}>VaultForge Deal Intelligence</div>
          <h1 style={{ fontSize: "clamp(50px,10vw,92px)", lineHeight: 0.88, letterSpacing: "-.07em", margin: "12px 0 18px" }}>
            {deal ? titleOf(deal) : "Deal Detail"}
          </h1>

          {status ? <p style={{ ...muted, fontSize: 20 }}>{status}</p> : null}

          {deal ? (
            <>
              <p style={{ ...muted, fontSize: 20, maxWidth: 960 }}>{routeSummary(deal)}</p>

              <div style={{ marginTop: 14 }}>
                <span style={chip}>Deal ID: {dealId}</span>
                <span style={chip}>Status: {first(deal.status, "Active")}</span>
                <span style={chip}>Type: {first(deal.property_type, deal.deal_type, deal.asset_type, "Deal")}</span>
                <span style={chip}>Market: {marketOf(deal)}</span>
              </div>

              <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
                <Link href="/projects" style={button}>Projects</Link>
                <Link href="/dashboard" style={ghost}>Dashboard</Link>
                <Link href="/submit" style={ghost}>Create Deal</Link>
                <Link href="/messages" style={ghost}>Messages</Link>
              </div>
            </>
          ) : null}
        </section>

        {deal ? (
          <>
            {photos.length ? (
              <section style={card}>
                <div style={eyebrow}>Photos</div>
                <div className="vf-photo-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginTop: 14 }}>
                  {photos.map((url) => (
                    <img key={url} src={url} alt="Deal" style={{ width: "100%", height: 230, objectFit: "cover", borderRadius: 20, border: "1px solid rgba(232,196,107,.20)" }} />
                  ))}
                </div>
              </section>
            ) : null}

            <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 14, marginBottom: 18 }}>
              <Info label="Asking Price" value={money(deal.asking_price || deal.price)} />
              <Info label="ARV / Value" value={money(deal.arv || deal.arv_value || deal.estimated_value)} />
              <Info label="Repairs" value={money(deal.repair_estimate || deal.repairs_needed || deal.estimated_repairs)} />
              <Info label="Strategy" value={first(deal.strategy, deal.exit_strategy)} />
            </section>

            <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
              <ListBlock label="Routing Needs" values={routingNeeds} />
              <ListBlock label="Distress / Pain Signals" values={distressSignals} />
            </section>

            <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
              <section style={glass}>
                <div style={eyebrow}>Why Routed / Importance</div>
                <p style={{ ...muted, fontSize: 17 }}>{routeSummary(deal)}</p>
              </section>

              <section style={glass}>
                <div style={eyebrow}>Seller / Situation</div>
                <p style={{ ...muted, fontSize: 17 }}>
                  {first(deal.seller_situation, deal.description, deal.private_notes, deal.access_notes, "Not listed.")}
                </p>
              </section>
            </section>

            <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 14, marginBottom: 18 }}>
              <Info label="Beds" value={first(deal.beds, deal.bedrooms)} />
              <Info label="Baths" value={first(deal.baths, deal.bathrooms)} />
              <Info label="Sqft / Acres" value={first(deal.square_feet, deal.sqft, deal.building_sqft, deal.acres, deal.land_acres)} />
            </section>

            <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 14, marginBottom: 18 }}>
              <Info label="Occupancy" value={deal.occupancy} />
              <Info label="Zoning" value={deal.zoning} />
              <Info label="NOI / Cap Rate" value={[first(deal.noi), first(deal.cap_rate)].filter(Boolean).join(" / ")} />
            </section>

            <section style={card}>
              <div style={eyebrow}>Owner / Contact Context</div>
              <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 14, marginTop: 14 }}>
                <Info label="Owner Email" value={first(deal.owner_email, deal.member_email)} />
                <Info label="Contact Name" value={first(deal.owner_name, deal.contact_name, deal.seller_name)} />
                <Info label="Contact Phone" value={first(deal.owner_phone, deal.contact_phone, deal.seller_phone)} />
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
