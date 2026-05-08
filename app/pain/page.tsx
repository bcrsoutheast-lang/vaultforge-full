"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type PainRow = Record<string, any>;

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(255,120,120,.20), transparent 28%), radial-gradient(circle at top right, rgba(157,243,191,.16), transparent 24%), radial-gradient(circle at bottom right, rgba(181,92,255,.18), transparent 28%), linear-gradient(180deg,#02040a 0%,#071326 45%,#030509 100%)",
  color: "white",
  padding: "28px 18px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1200, margin: "0 auto" };

const hero: React.CSSProperties = {
  border: "1px solid rgba(255,120,120,.30)",
  background:
    "linear-gradient(145deg, rgba(255,120,120,.12), rgba(181,92,255,.10), rgba(255,255,255,.03))",
  borderRadius: 34,
  padding: 26,
  marginBottom: 22,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
  gap: 16,
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.13)",
  background:
    "linear-gradient(145deg, rgba(181,92,255,.13), rgba(255,120,120,.06), rgba(255,255,255,.03))",
  borderRadius: 28,
  padding: 22,
  boxShadow: "0 26px 80px rgba(0,0,0,.34)",
};

const signalCard: React.CSSProperties = {
  ...card,
  overflow: "hidden",
  position: "relative",
};

const btn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg,#f5d978,#9df3bf 55%,#b55cff)",
  color: "#06100a",
  textDecoration: "none",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 950,
  border: "none",
  margin: "7px 7px 0 0",
  minHeight: 46,
  cursor: "pointer",
};

const ghost: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  textDecoration: "none",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 900,
  border: "1px solid rgba(255,255,255,.16)",
  background: "linear-gradient(135deg, rgba(181,92,255,.18), rgba(255,255,255,.05))",
  margin: "7px 7px 0 0",
  minHeight: 46,
  cursor: "pointer",
};

const eyebrow: React.CSSProperties = {
  color: "#ff9f9f",
  letterSpacing: 5,
  fontWeight: 950,
  fontSize: 12,
  marginBottom: 12,
  textTransform: "uppercase",
};

const greenEyebrow: React.CSSProperties = {
  ...eyebrow,
  color: "#9df3bf",
};

const muted: React.CSSProperties = {
  color: "rgba(255,255,255,.70)",
  lineHeight: 1.55,
};

const chip: React.CSSProperties = {
  display: "inline-flex",
  border: "1px solid rgba(157,243,191,.25)",
  color: "#9df3bf",
  background: "rgba(157,243,191,.07)",
  borderRadius: 999,
  padding: "8px 11px",
  fontWeight: 850,
  fontSize: 13,
  margin: "0 7px 7px 0",
};

const image: React.CSSProperties = {
  width: "100%",
  height: 220,
  objectFit: "cover",
  borderRadius: 22,
  border: "1px solid rgba(255,255,255,.14)",
  boxShadow: "0 20px 60px rgba(0,0,0,.30)",
};

function getEmail() {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("vf_email") ||
    sessionStorage.getItem("vf_email") ||
    ""
  )
    .trim()
    .toLowerCase();
}

function asText(value: unknown, fallback = "") {
  const text = String(value || "").trim();
  return text || fallback;
}

function money(value: unknown) {
  const n = Number(value || 0);
  if (!Number.isFinite(n) || n <= 0) return "";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function first(...values: unknown[]) {
  for (const value of values) {
    const text = asText(value);
    if (text) return text;
  }
  return "";
}

function formatDate(value: unknown) {
  const text = asText(value);
  if (!text) return "";
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return date.toLocaleString();
}

function painTitle(row: PainRow) {
  return first(row.title, row.pain_type, row.requested_help, "Distress Signal");
}

function painBody(row: PainRow) {
  return first(
    row.description,
    row.ai_summary,
    row.requested_help,
    "No description yet."
  );
}

function painLocation(row: PainRow) {
  return [row.city, row.state]
    .map((value) => asText(value))
    .filter(Boolean)
    .join(", ");
}

function normalizePhotos(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }

  const text = asText(value);
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed.map(String).filter(Boolean);
    }
  } catch {
    // continue
  }

  return [text];
}

function normalizeTags(row: PainRow) {
  const value = row.ai_tags || row.routing_tags || row.tags;

  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }

  const text = asText(value);
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed.map(String).filter(Boolean);
    }
  } catch {
    // continue
  }

  return text.split(",").map((item) => item.trim()).filter(Boolean);
}

function urgencyTone(value: unknown) {
  const text = asText(value).toLowerCase();

  if (text.includes("emergency") || text.includes("urgent")) return "#ff6b6b";
  if (text.includes("high")) return "#ff9f9f";
  if (text.includes("medium")) return "#f5d978";

  return "#9df3bf";
}

function NumberStatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div style={card}>
      <div style={greenEyebrow}>{label}</div>
      <div style={{ fontSize: 54, fontWeight: 950, lineHeight: 1 }}>{value}</div>
      <p style={muted}>{detail}</p>
    </div>
  );
}

function DetailCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div style={card}>
      <div style={greenEyebrow}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 950, lineHeight: 1.05 }}>{value}</div>
      <p style={muted}>{detail}</p>
    </div>
  );
}

function ActionButton({
  href,
  children,
  primary = false,
}: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <Link href={href} style={primary ? btn : ghost}>
      {children}
    </Link>
  );
}

export default function PainPage() {
  const [rows, setRows] = useState<PainRow[]>([]);
  const [status, setStatus] = useState("Loading distress signals...");
  const [filter, setFilter] = useState("all");

  async function load() {
    setStatus("Loading distress signals...");

    try {
      const email = getEmail();
      const res = await fetch(`/api/pain/list?email=${encodeURIComponent(email)}`, {
        cache: "no-store",
        headers: {
          "x-vf-email": email,
        },
      });

      const data = await res.json();

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Could not load distress signals.");
      }

      setRows(Array.isArray(data?.pain) ? data.pain : []);
      setStatus("");
    } catch (error: any) {
      setStatus(error?.message || "Could not load distress signals.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const openRows = useMemo(
    () => rows.filter((row) => row.resolved !== true && asText(row.routing_status).toLowerCase() !== "resolved"),
    [rows]
  );

  const urgentRows = useMemo(
    () =>
      rows.filter((row) => {
        const text = `${row.urgency_level || ""} ${row.pain_type || ""} ${row.description || ""}`.toLowerCase();
        return text.includes("urgent") || text.includes("emergency") || text.includes("high");
      }),
    [rows]
  );

  const capitalRows = useMemo(
    () =>
      rows.filter((row) => {
        const text = `${row.pain_type || ""} ${row.requested_help || ""} ${row.description || ""}`.toLowerCase();
        return text.includes("capital") || text.includes("fund") || text.includes("lender") || text.includes("loan");
      }),
    [rows]
  );

  const filteredRows = useMemo(() => {
    if (filter === "open") return openRows;
    if (filter === "urgent") return urgentRows;
    if (filter === "capital") return capitalRows;
    if (filter === "photos") return rows.filter((row) => normalizePhotos(row.photo_urls).length > 0);

    return rows;
  }, [capitalRows, filter, openRows, rows, urgentRows]);

  return (
    <main style={page}>
      <style>{`
        a:hover,
        button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        @media (max-width: 760px) {
          a,
          button {
            width: 100%;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <section style={hero}>
          <div style={eyebrow}>Pain Button™ Intelligence Feed</div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
            <span style={{ ...chip, borderColor: "rgba(255,120,120,.38)", color: "#ff9f9f" }}>
              Distress Signals
            </span>
            <span style={chip}>Capital Needs</span>
            <span style={chip}>Operator Routing</span>
            <span style={chip}>Deal Rescue</span>
            <span style={chip}>Photo-Aware Intake</span>
          </div>

          <h1 style={{ fontSize: "clamp(56px,12vw,104px)", lineHeight: 0.88, margin: "0 0 18px" }}>
            Distress becomes routing intelligence.
          </h1>

          <p style={{ ...muted, fontSize: 21 }}>
            This is the command-center feed for seller pressure, stalled projects, funding gaps, contractor problems,
            title issues, zoning problems, and emergency deal rescue. Each signal can now carry photos, asset class,
            routing tags, urgency, and requested help.
          </p>

          <Link href="/dashboard" style={ghost}>Dashboard</Link>
          <Link href="/pain-submit" style={btn}>Pain Button</Link>
          <Link href="/routing" style={ghost}>Routing Brain</Link>
          <Link href="/alerts" style={ghost}>Smart Alerts</Link>
          <button type="button" onClick={load} style={btn}>Refresh</button>
        </section>

        <section style={{ ...grid, marginBottom: 22 }}>
          <NumberStatCard label="Total Signals" value={rows.length} detail="All distress and pain submissions loaded." />
          <NumberStatCard label="Open Signals" value={openRows.length} detail="Unresolved routing opportunities." />
          <NumberStatCard label="Urgent" value={urgentRows.length} detail="High-priority or emergency signals." />
          <NumberStatCard label="Capital Need" value={capitalRows.length} detail="Funding, lender, or capital-related requests." />
        </section>

        <section style={{ ...hero, borderColor: "rgba(157,243,191,.28)" }}>
          <div style={greenEyebrow}>Feed Filters</div>
          <button type="button" onClick={() => setFilter("all")} style={filter === "all" ? btn : ghost}>All</button>
          <button type="button" onClick={() => setFilter("open")} style={filter === "open" ? btn : ghost}>Open</button>
          <button type="button" onClick={() => setFilter("urgent")} style={filter === "urgent" ? btn : ghost}>Urgent</button>
          <button type="button" onClick={() => setFilter("capital")} style={filter === "capital" ? btn : ghost}>Capital</button>
          <button type="button" onClick={() => setFilter("photos")} style={filter === "photos" ? btn : ghost}>With Photos</button>
        </section>

        {status && <section style={hero}>{status}</section>}

        {!status && rows.length === 0 && (
          <section style={hero}>
            <strong>No distress signals yet.</strong>
            <p style={muted}>
              Use the Pain Button to start routing seller pain, stalled deals, funding needs, or execution problems into VaultForge.
            </p>
          </section>
        )}

        {!status && rows.length > 0 && filteredRows.length === 0 && (
          <section style={hero}>
            <strong>No signals match this filter.</strong>
            <p style={muted}>Try another filter or submit a new signal.</p>
          </section>
        )}

        <section style={{ display: "grid", gap: 18 }}>
          {filteredRows.map((row, index) => {
            const id = asText(row.id) || String(index);
            const type = first(row.pain_type, "Signal");
            const assetType = first(row.asset_type, "Unknown Asset");
            const urgency = first(row.urgency_level, "Normal");
            const statusLabel = first(row.routing_status, row.resolved ? "Resolved" : "Pending");
            const location = painLocation(row);
            const capital = money(row.capital_needed);
            const value = money(row.estimated_value);
            const repairs = money(row.estimated_repairs);
            const tags = normalizeTags(row);
            const photos = normalizePhotos(row.photo_urls);
            const tone = urgencyTone(urgency);

            return (
              <article key={id} style={{ ...signalCard, borderColor: `${tone}66` }}>
                <div
                  style={{
                    position: "absolute",
                    top: -32,
                    right: -28,
                    width: 120,
                    height: 120,
                    borderRadius: 999,
                    background: tone,
                    opacity: 0.12,
                  }}
                />

                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  <span style={{ ...chip, borderColor: `${tone}aa`, color: tone }}>{urgency}</span>
                  <span style={chip}>{assetType}</span>
                  <span style={{ ...chip, borderColor: "rgba(255,120,120,.38)", color: "#ff9f9f" }}>{type}</span>
                  <span style={chip}>{statusLabel}</span>
                  {location && <span style={chip}>{location}</span>}
                  {photos.length > 0 && <span style={chip}>{photos.length} Photo{photos.length === 1 ? "" : "s"}</span>}
                </div>

                {photos.length > 0 && (
                  <section style={{ ...grid, marginBottom: 16 }}>
                    {photos.slice(0, 3).map((src, photoIndex) => (
                      <img
                        key={`${src.slice(0, 30)}-${photoIndex}`}
                        src={src}
                        alt={`Pain signal photo ${photoIndex + 1}`}
                        style={image}
                      />
                    ))}
                  </section>
                )}

                <div style={eyebrow}>Routing Input</div>
                <h2 style={{ fontSize: "clamp(32px,7vw,56px)", lineHeight: 1, margin: "0 0 12px" }}>
                  {painTitle(row)}
                </h2>

                <p style={{ ...muted, fontSize: 20 }}>
                  {painBody(row)}
                </p>

                {row.requested_help && (
                  <section style={{ ...card, margin: "16px 0", borderColor: "rgba(157,243,191,.25)" }}>
                    <div style={greenEyebrow}>Requested Help</div>
                    <p style={{ ...muted, fontSize: 18, margin: 0 }}>{asText(row.requested_help)}</p>
                  </section>
                )}

                {(capital || value || repairs) && (
                  <section style={grid}>
                    {capital && <DetailCard label="Capital Needed" value={capital} detail="Requested capital or funding gap." />}
                    {value && <DetailCard label="Estimated Value" value={value} detail="Estimated property or project value." />}
                    {repairs && <DetailCard label="Repairs" value={repairs} detail="Estimated repairs or execution cost." />}
                  </section>
                )}

                {tags.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={greenEyebrow}>Routing Tags</div>
                    {tags.map((tag) => (
                      <span key={`${id}-${tag}`} style={chip}>{tag}</span>
                    ))}
                  </div>
                )}

                {row.ai_summary && (
                  <section style={{ ...card, marginTop: 16, borderColor: "rgba(181,92,255,.28)" }}>
                    <div style={eyebrow}>AI Summary</div>
                    <p style={{ ...muted, fontSize: 18, margin: 0 }}>{asText(row.ai_summary)}</p>
                  </section>
                )}

                <div style={{ marginTop: 14 }}>
                  {row.deal_id && (
                    <ActionButton href={`/deal/${encodeURIComponent(String(row.deal_id))}`} primary>
                      Open Deal Room
                    </ActionButton>
                  )}
                  <ActionButton href="/routing" primary>
                    Route
                  </ActionButton>
                  <ActionButton href="/messages">
                    Message
                  </ActionButton>
                  <ActionButton href="/alerts">
                    Alerts
                  </ActionButton>
                  <ActionButton href="/pain-submit">
                    Related Signal
                  </ActionButton>
                </div>

                <p style={{ ...muted, marginTop: 14 }}>
                  {formatDate(row.created_at)}
                </p>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
