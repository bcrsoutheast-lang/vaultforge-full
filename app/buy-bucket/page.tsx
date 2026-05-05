"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Item = Record<string, any>;
type Deal = Record<string, any>;

const shell: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 30%), linear-gradient(180deg,#06100a,#102015 55%,#06100a)",
  color: "white",
  padding: "28px 18px 90px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1180, margin: "0 auto" };

const hero: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.28)",
  background: "rgba(255,255,255,.045)",
  borderRadius: 34,
  padding: 24,
  marginBottom: 22,
};

const paneGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(290px,1fr))",
  gap: 18,
};

const pane: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.24)",
  background:
    "linear-gradient(145deg, rgba(255,255,255,.07), rgba(255,255,255,.025))",
  borderRadius: 30,
  overflow: "hidden",
  boxShadow: "0 25px 75px rgba(0,0,0,.28)",
};

const body: React.CSSProperties = { padding: 20 };

const btn: React.CSSProperties = {
  display: "inline-block",
  background: "#f5d978",
  color: "#06100a",
  textDecoration: "none",
  borderRadius: 999,
  padding: "12px 15px",
  fontWeight: 900,
  border: "none",
  margin: "6px 6px 0 0",
};

const ghost: React.CSSProperties = {
  display: "inline-block",
  color: "white",
  textDecoration: "none",
  borderRadius: 999,
  padding: "12px 15px",
  fontWeight: 900,
  border: "1px solid rgba(255,255,255,.16)",
  background: "rgba(255,255,255,.04)",
  margin: "6px 6px 0 0",
};

const danger: React.CSSProperties = {
  ...ghost,
  border: "1px solid rgba(255,120,120,.32)",
  color: "#ffd0d0",
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: 5,
  fontWeight: 900,
  fontSize: 12,
  marginBottom: 12,
};

const muted: React.CSSProperties = {
  color: "rgba(255,255,255,.68)",
  lineHeight: 1.5,
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.08)",
  color: "white",
  padding: 12,
  fontWeight: 900,
  marginTop: 10,
};

function getEmail() {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("vf_email") ||
    sessionStorage.getItem("vf_email") ||
    "text@text.com"
  )
    .trim()
    .toLowerCase();
}

function money(value: any) {
  const n = Number(value || 0);
  if (!n) return "Not listed";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function getDeal(item: Item): Deal {
  return item.deal || item.vf_deals || item.project || item;
}

function getPhotos(deal: Deal) {
  const arr = Array.isArray(deal.photo_urls) ? deal.photo_urls.filter(Boolean) : [];
  if (deal.main_photo_url && !arr.includes(deal.main_photo_url)) {
    arr.unshift(deal.main_photo_url);
  }
  return arr;
}

function detailLine(deal: Deal) {
  return [
    deal.bedrooms ? `${deal.bedrooms} bed` : "",
    deal.bathrooms ? `${deal.bathrooms} bath` : "",
    deal.building_sqft ? `${deal.building_sqft} sqft` : "",
    deal.land_acres ? `${deal.land_acres} acres` : "",
    deal.commercial_type || "",
    deal.condition || "",
  ]
    .filter(Boolean)
    .join(" · ");
}

export default function BuyBucketPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [status, setStatus] = useState("Loading Buy Bucket...");

  async function load() {
    setStatus("Loading Buy Bucket...");
    try {
      const res = await fetch("/api/deal/my-bucket", {
        cache: "no-store",
        headers: { "x-vf-email": getEmail() },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || data?.details || "Could not load Buy Bucket.");
      }

      setItems(data?.deals || data?.items || []);
      setStatus("");
    } catch (err: any) {
      setStatus(err?.message || "Could not load Buy Bucket.");
    }
  }

  async function archiveItem(id: string) {
    await fetch("/api/deal/bucket-archive", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-vf-email": getEmail() },
      body: JSON.stringify({ id }),
    });
    await load();
  }

  async function removeItem(id: string) {
    const yes = window.confirm("Remove this deal from your Buy Bucket?");
    if (!yes) return;

    await fetch("/api/deal/bucket-remove", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-vf-email": getEmail() },
      body: JSON.stringify({ id }),
    });
    await load();
  }

  async function setFolder(id: string, folder: string) {
    await fetch("/api/deal/bucket-folder", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-vf-email": getEmail() },
      body: JSON.stringify({ id, folder }),
    });
    await load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main style={shell}>
      <div style={wrap}>
        <section style={hero}>
          <div style={eyebrow}>BUY BUCKET</div>
          <h1
            style={{
              fontSize: "clamp(56px,12vw,96px)",
              lineHeight: 0.9,
              margin: "0 0 18px",
            }}
          >
            Saved window panes.
          </h1>
          <p style={muted}>
            Track saved acquisition targets, organize follow-up folders, and remove clutter.
          </p>
          <Link href="/dashboard" style={ghost}>
            Dashboard
          </Link>
          <Link href="/projects" style={btn}>
            Projects
          </Link>
          <Link href="/submit" style={ghost}>
            Create
          </Link>
          <button type="button" onClick={load} style={btn}>
            Refresh
          </button>
        </section>

        {status && <section style={hero}>{status}</section>}

        {!status && items.length === 0 && (
          <section style={hero}>Your Buy Bucket is empty. Open Projects and save a deal.</section>
        )}

        <section style={paneGrid}>
          {items.map((item) => {
            const deal = getDeal(item);
            const image = getPhotos(deal)[0];
            const dealId = deal.id || item.deal_id;
            const itemId = item.id;

            return (
              <article key={itemId || dealId} style={pane}>
                {image ? (
                  <img
                    src={image}
                    alt={deal.title || "Deal"}
                    style={{
                      width: "100%",
                      height: 230,
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      height: 230,
                      display: "grid",
                      placeItems: "center",
                      color: "rgba(255,255,255,.55)",
                      borderBottom: "1px solid rgba(255,255,255,.10)",
                    }}
                  >
                    No photo
                  </div>
                )}

                <div style={body}>
                  <div style={eyebrow}>
                    {item.folder || "Active"} · SAVED DEAL · {deal.property_type || "Deal"}
                  </div>

                  <h2 style={{ fontSize: 34, margin: "0 0 8px" }}>
                    {deal.title || "Untitled Deal"}
                  </h2>

                  <p style={{ ...muted, fontSize: 19, margin: "0 0 10px" }}>
                    {deal.city || "Unknown City"}, {deal.state || "Unknown State"}
                  </p>

                  <p style={{ margin: "0 0 8px", fontSize: 20 }}>
                    Ask: {money(deal.asking_price || deal.price)}
                  </p>
                  <p style={{ margin: "0 0 8px", fontSize: 20 }}>
                    ARV: {money(deal.arv)}
                  </p>

                  <p style={{ ...muted, margin: "0 0 10px" }}>
                    {detailLine(deal) || "Additional details in Deal Room"}
                  </p>

                  <select
                    value={item.folder || "Active"}
                    onChange={(event) => setFolder(itemId, event.target.value)}
                    style={selectStyle}
                  >
                    <option style={{ color: "#111" }}>Active</option>
                    <option style={{ color: "#111" }}>Hot</option>
                    <option style={{ color: "#111" }}>Follow Up</option>
                    <option style={{ color: "#111" }}>Needs Funding</option>
                    <option style={{ color: "#111" }}>Under Review</option>
                    <option style={{ color: "#111" }}>Passed</option>
                  </select>

                  <div style={{ marginTop: 12 }}>
                    {dealId && (
                      <Link href={`/deal/${dealId}`} style={btn}>
                        Deal Room
                      </Link>
                    )}
                    <Link href="/messages" style={ghost}>
                      Messages
                    </Link>
                    <button type="button" onClick={() => archiveItem(itemId)} style={ghost}>
                      Archive
                    </button>
                    <button type="button" onClick={() => removeItem(itemId)} style={danger}>
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
