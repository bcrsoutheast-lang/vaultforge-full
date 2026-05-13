"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Row = Record<string, any>;

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function first(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }

  return "";
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

function photo(row: Row) {
  return first(
    row.main_photo_url,
    row.image_url,
    row.photo_url,
    Array.isArray(row.photo_urls) ? row.photo_urls[0] : "",
  );
}

function ownerOf(row: Row) {
  return cleanEmail(
    first(
      row.owner_email,
      row.member_email,
      row.user_email,
      row.email,
    )
  );
}

function titleOf(row: Row) {
  return first(row.title, row.pain_title, row.problem_title, "Pain Request");
}

function marketOf(row: Row) {
  return (
    [first(row.city), first(row.state)]
      .filter(Boolean)
      .join(", ") || first(row.market, row.location, "Market not listed")
  );
}

function problemType(row: Row) {
  return first(
    row.problem_type,
    row.pain_type,
    row.asset_type,
    row.property_type,
    "Problem"
  );
}

function summary(row: Row) {
  return first(
    row.ai_summary,
    row.route_summary,
    row.routing_summary,
    row.summary,
    row.description,
    row.notes,
    "No summary yet."
  );
}

function bottleneck(row: Row) {
  return first(row.primary_bottleneck, "Owner Review Needed");
}

function fastestMove(row: Row) {
  return first(
    row.fastest_path,
    "Clarify details and route to the best operator."
  );
}

function signalIdOf(row: Row) {
  return first(row.signal_id, row.canonical_event_id, row.id);
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.12), transparent 28%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "24px 16px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  width: "min(1300px,100%)",
  margin: "0 auto",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.18)",
  borderRadius: 28,
  overflow: "hidden",
  background: "rgba(255,255,255,.04)",
  boxShadow: "0 20px 70px rgba(0,0,0,.28)",
};

const button: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 48,
  borderRadius: 999,
  padding: "12px 18px",
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#08120d",
  textDecoration: "none",
  fontWeight: 900,
};

export default function PainFeedPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [status, setStatus] = useState("Loading Pain Feed...");

  async function load() {
    try {
      const email =
        cleanEmail(localStorage.getItem("vf_email")) ||
        cleanEmail(localStorage.getItem("email"));

      const res = await fetch(
        `/api/pain/feed?email=${encodeURIComponent(email)}&owner=1`,
        {
          cache: "no-store",
          credentials: "include",
          headers: {
            "x-vf-email": email,
            "x-vf-admin": "1",
          },
        }
      );

      const data = await res.json();

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || "Failed to load pain feed.");
      }

      const rows = Array.isArray(data?.pains) ? data.pains : [];
      setItems(rows);
      setStatus(rows.length ? "" : "No pain records yet.");
    } catch (error: any) {
      setStatus(error?.message || "Could not load pain feed.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main style={page}>
      <div style={wrap}>
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              color: "#e8c46b",
              fontWeight: 900,
              letterSpacing: ".18em",
              textTransform: "uppercase",
              fontSize: 12,
            }}
          >
            VaultForge Problem Solver Intelligence
          </div>

          <h1
            style={{
              fontSize: "clamp(48px,9vw,88px)",
              lineHeight: 0.92,
              letterSpacing: "-.06em",
              margin: "10px 0",
            }}
          >
            Pain Feed
          </h1>

          <p style={{ color: "#cbd5e1", maxWidth: 980, fontSize: 18 }}>
            Operational problem rooms for distressed situations, funding gaps,
            contractor issues, stalled projects, exits, tenant issues, and
            execution bottlenecks.
          </p>
        </div>

        {status ? (
          <div style={{ color: "#cbd5e1", marginBottom: 18 }}>{status}</div>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(360px,1fr))",
            gap: 18,
          }}
        >
          {items.map((row, index) => {
            const image = photo(row);
            const id = first(row.id, row.pain_id, row.item_id);
            const contactHref = signalIdOf(row)
              ? `/connect/${encodeURIComponent(
                  signalIdOf(row)
                )}?to=${encodeURIComponent(ownerOf(row))}&source=pain&type=pain&title=${encodeURIComponent(
                  titleOf(row)
                )}`
              : `/messages/new?to=${encodeURIComponent(
                  ownerOf(row)
                )}&source=pain&type=pain&title=${encodeURIComponent(
                  titleOf(row)
                )}`;

            return (
              <section key={`${id}-${index}`} style={card}>
                {image ? (
                  <img
                    src={image}
                    alt={titleOf(row)}
                    style={{
                      width: "100%",
                      height: 240,
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : null}

                <div style={{ padding: 20 }}>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                      marginBottom: 12,
                    }}
                  >
                    <span
                      style={{
                        border: "1px solid rgba(157,243,191,.22)",
                        background: "rgba(157,243,191,.08)",
                        color: "#9df3bf",
                        borderRadius: 999,
                        padding: "6px 10px",
                        fontSize: 12,
                        fontWeight: 900,
                      }}
                    >
                      {problemType(row)}
                    </span>

                    <span
                      style={{
                        border: "1px solid rgba(232,196,107,.22)",
                        background: "rgba(232,196,107,.08)",
                        color: "#f8e7b0",
                        borderRadius: 999,
                        padding: "6px 10px",
                        fontSize: 12,
                        fontWeight: 900,
                      }}
                    >
                      {marketOf(row)}
                    </span>
                  </div>

                  <h2
                    style={{
                      fontSize: 28,
                      lineHeight: 1,
                      margin: "0 0 12px",
                    }}
                  >
                    {titleOf(row)}
                  </h2>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2,minmax(0,1fr))",
                      gap: 10,
                      marginBottom: 14,
                    }}
                  >
                    <div>
                      <div style={{ color: "#94a3b8", fontSize: 12 }}>
                        Asking / Target
                      </div>
                      <div style={{ fontWeight: 900 }}>
                        {money(first(row.asking_price, row.price))}
                      </div>
                    </div>

                    <div>
                      <div style={{ color: "#94a3b8", fontSize: 12 }}>
                        Capital Needed
                      </div>
                      <div style={{ fontWeight: 900 }}>
                        {money(first(row.capital_needed, row.funding_needed))}
                      </div>
                    </div>
                  </div>

                  <p
                    style={{
                      color: "#dbe4ee",
                      lineHeight: 1.6,
                      marginBottom: 14,
                    }}
                  >
                    <strong>VaultForge read:</strong> This looks like a{" "}
                    {problemType(row).toLowerCase()} pressure signal in{" "}
                    {marketOf(row)}. The main blocker is{" "}
                    {bottleneck(row).toLowerCase()}. Fastest move:{" "}
                    {fastestMove(row)}
                  </p>

                  <p
                    style={{
                      color: "#94a3b8",
                      lineHeight: 1.6,
                      marginBottom: 18,
                    }}
                  >
                    {summary(row)}
                  </p>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Link href={contactHref} style={button}>
                      Contact Owner
                    </Link>

                    <Link
                      href={`/pain-room/${encodeURIComponent(id)}`}
                      style={{
                        ...button,
                        background: "rgba(255,255,255,.06)",
                        border: "1px solid rgba(255,255,255,.12)",
                        color: "white",
                      }}
                    >
                      Open Room
                    </Link>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
