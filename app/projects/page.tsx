"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

const bodyStyle: React.CSSProperties = { padding: 20 };

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

export default function ProjectsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [status, setStatus] = useState("Loading projects...");

  async function load() {
    setStatus("Loading projects...");
    try {
      const res = await fetch("/api/deal/list", {
        cache: "no-store",
        headers: { "x-vf-email": getEmail() },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || data?.details || "Could not load deals.");
      }

      setDeals(data?.deals || []);
      setStatus("");
    } catch (err: any) {
      setStatus(err?.message || "Could not load projects.");
    }
  }

  async function archiveDeal(id: string) {
    await fetch("/api/deal/archive", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-vf-email": getEmail() },
      body: JSON.stringify({ id }),
    });
    await load();
  }

  async function deleteDeal(id: string) {
    const yes = window.confirm("Move this deal to trash?");
    if (!yes) return;

    await fetch("/api/deal/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-vf-email": getEmail() },
      body: JSON.stringify({ id }),
    });
    await load();
  }

  async function setFolder(id: string, folder: string) {
    await fetch("/api/deal/folder", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-vf-email": getEmail() },
      body: JSON.stringify({ id, folder }),
    });
    await load();
  }

  async function saveDeal(id: string) {
    try {
      const res = await fetch("/api/deal/buy-bucket", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-vf-email": getEmail() },
        body: JSON.stringify({ deal_id: id }),
      });
      const data = await res.json();
      if (!res.ok && !String(data?.error || "").toLowerCase().includes("duplicate")) {
        throw new Error(data?.error || "Save failed.");
      }
      alert("Saved to Buy Bucket.");
    } catch (err: any) {
      alert(err?.message || "Could not save.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main style={shell}>
      <div style={wrap}>
        <section style={hero}>
          <div style={eyebrow}>PROJECTS</div>
          <h1 style={{ fontSize: "clamp(56px,12vw,96px)", lineHeight: 0.9, margin: "0 0 18px" }}>
            Window pane deal room.
          </h1>
          <p style={muted}>
            Organize live opportunities with folders, archive controls, deal room links,
            and clean member actions.
          </p>
          <Link href="/dashboard" style={ghost}>Dashboard</Link>
          <Link href="/submit" style={btn}>Create</Link>
          <Link href="/buy-bucket" style={ghost}>Buy Bucket</Link>
          <button type="button" onClick={load} style={btn}>Refresh</button>
        </section>

        {status && <section style={hero}>{status}</section>}

        {!status && deals.length === 0 && (
          <section style={hero}>No active projects yet. Create a deal to start.</section>
        )}

        <section style={paneGrid}>
          {deals.map((deal) => {
            const image = getPhotos(deal)[0];

            return (
              <article key={deal.id} style={pane}>
                {image ? (
                  <img
                    src={image}
                    alt={deal.title || "Deal"}
                    style={{ width: "100%", height: 230, objectFit: "cover", display: "block" }}
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

                <div style={bodyStyle}>
                  <div style={eyebrow}>
                    {deal.folder || "Active"} · {deal.property_type || "Deal"} · {deal.strategy || "Strategy Needed"}
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
                    value={deal.folder || "Active"}
                    onChange={(event) => setFolder(deal.id, event.target.value)}
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
                    <Link href={`/deal/${deal.id}`} style={btn}>Deal Room</Link>
                    <button type="button" onClick={() => saveDeal(deal.id)} style={ghost}>Save</button>
                    <button type="button" onClick={() => archiveDeal(deal.id)} style={ghost}>Archive</button>
                    <button type="button" onClick={() => deleteDeal(deal.id)} style={danger}>Delete</button>
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
