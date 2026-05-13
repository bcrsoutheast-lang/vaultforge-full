"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Deal = Record<string, any>;

function clean(value: unknown) {
  return String(value || "").trim();
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
    // continue
  }

  return text
    .split(/[,\n|;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function photosOf(deal: Deal) {
  const meta = typeof deal?.metadata === "object" && deal.metadata ? deal.metadata : {};

  const values = [
    deal.main_photo_url,
    deal.image_url,
    deal.photo_url,
    meta.main_photo_url,
    meta.image_url,
    meta.photo_url,
    ...parseArray(deal.photo_urls),
    ...parseArray(meta.photo_urls),
    ...parseArray(deal.photos),
    ...parseArray(meta.photos),
  ];

  return Array.from(
    new Set(values.map(clean).filter((url) => url.startsWith("http")))
  );
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

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 30%), linear-gradient(180deg,#02040a,#071326 55%,#02040a)",
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
};

const label: React.CSSProperties = {
  color: "#e8c46b",
  fontWeight: 900,
  fontSize: 12,
  letterSpacing: ".18em",
  textTransform: "uppercase",
  marginBottom: 8,
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

function Info({
  title,
  value,
}: {
  title: string;
  value: unknown;
}) {
  return (
    <div style={card}>
      <div style={label}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 900 }}>
        {clean(value) || "Not listed"}
      </div>
    </div>
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

        const response = await fetch(
          `/api/deal/detail?id=${encodeURIComponent(id)}`,
          {
            cache: "no-store",
            credentials: "include",
          }
        );

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

  const photos = useMemo(() => {
    if (!deal) return [];
    return photosOf(deal);
  }, [deal]);

  return (
    <main style={page}>
      <style>{`
        @media (max-width: 820px) {
          .vf-grid {
            grid-template-columns: 1fr !important;
          }

          .vf-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
          }

          .vf-actions a {
            width: 100%;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <section style={card}>
          <div style={label}>VaultForge Deal Detail</div>

          <h1
            style={{
              fontSize: "clamp(48px,10vw,90px)",
              lineHeight: .9,
              margin: "10px 0 14px",
              letterSpacing: "-.07em",
            }}
          >
            {deal
              ? first(
                  deal.title,
                  deal.deal_title,
                  deal.address,
                  "Deal Detail"
                )
              : "Deal Detail"}
          </h1>

          <p style={{ color: "#cbd5e1", fontSize: 18 }}>
            {status ||
              first(
                deal?.ai_route_summary,
                deal?.route_summary,
                deal?.routing_summary,
                deal?.description,
                "VaultForge execution intelligence layer."
              )}
          </p>

          <div
            className="vf-actions"
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginTop: 20,
            }}
          >
            <Link href="/projects" style={primary}>
              Projects
            </Link>

            <Link href="/dashboard" style={button}>
              Dashboard
            </Link>

            <Link href="/submit" style={button}>
              Create Deal
            </Link>

            <Link href="/messages" style={button}>
              Messages
            </Link>
          </div>
        </section>

        {deal ? (
          <>
            {photos.length ? (
              <section style={card}>
                <div style={label}>Photos</div>

                <div
                  className="vf-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit,minmax(220px,1fr))",
                    gap: 12,
                  }}
                >
                  {photos.map((photo) => (
                    <img
                      key={photo}
                      src={photo}
                      alt="Deal"
                      style={{
                        width: "100%",
                        height: 240,
                        objectFit: "cover",
                        borderRadius: 20,
                        border: "1px solid rgba(232,196,107,.18)",
                      }}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            <section
              className="vf-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,minmax(0,1fr))",
                gap: 14,
              }}
            >
              <Info
                title="Property Type"
                value={first(
                  deal.property_type,
                  deal.deal_type,
                  deal.asset_type
                )}
              />

              <Info
                title="Market"
                value={[
                  first(deal.city),
                  first(deal.state, deal.market),
                ]
                  .filter(Boolean)
                  .join(", ")}
              />

              <Info
                title="Strategy"
                value={first(deal.strategy, deal.exit_strategy)}
              />

              <Info
                title="Asking Price"
                value={money(deal.asking_price || deal.price)}
              />

              <Info
                title="ARV"
                value={money(
                  deal.arv || deal.arv_value || deal.estimated_value
                )}
              />

              <Info
                title="Repairs"
                value={money(
                  deal.repair_estimate ||
                    deal.repairs_needed ||
                    deal.estimated_repairs
                )}
              />

              <Info
                title="Beds"
                value={first(deal.beds, deal.bedrooms)}
              />

              <Info
                title="Baths"
                value={first(deal.baths, deal.bathrooms)}
              />

              <Info
                title="Sqft / Acres"
                value={first(
                  deal.square_feet,
                  deal.sqft,
                  deal.building_sqft,
                  deal.acres,
                  deal.land_acres
                )}
              />
            </section>

            <section style={card}>
              <div style={label}>Routing Needs</div>
              <div style={{ fontSize: 22 }}>
                {first(
                  deal.routing_needs,
                  deal.deal_needs,
                  deal.needs,
                  "Not listed"
                )}
              </div>
            </section>

            <section style={card}>
              <div style={label}>Distress / Pain Signals</div>
              <div style={{ fontSize: 22 }}>
                {first(
                  deal.distress_signals,
                  deal.seller_situation,
                  "Not listed"
                )}
              </div>
            </section>

            <section style={card}>
              <div style={label}>Why Routed / Importance</div>
              <div style={{ fontSize: 22 }}>
                {first(
                  deal.ai_route_summary,
                  deal.route_summary,
                  deal.routing_summary,
                  deal.description,
                  "Not listed"
                )}
              </div>
            </section>

            <section style={card}>
              <div style={label}>Seller / Situation</div>
              <div style={{ fontSize: 22 }}>
                {first(
                  deal.seller_situation,
                  deal.private_notes,
                  deal.access_notes,
                  "Not listed"
                )}
              </div>
            </section>

            <section style={card}>
              <div style={label}>Deal ID</div>
              <div style={{ fontSize: 20 }}>
                {dealId || first(deal.id, deal.deal_id)}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
