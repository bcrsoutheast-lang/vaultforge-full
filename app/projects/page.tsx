"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Deal = {
  id: string;
  title?: string | null;
  property_type?: string | null;
  strategy?: string | null;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  asking_price?: number | string | null;
  arv?: number | string | null;
  repairs?: number | string | null;
  beds?: number | string | null;
  baths?: number | string | null;
  sqft?: number | string | null;
  description?: string | null;
  status?: string | null;
  photo_urls?: string[] | string | null;
  main_photo_url?: string | null;
  created_at?: string | null;
};

function money(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function getPhotos(deal: Deal): string[] {
  const raw = deal.photo_urls;
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {}
    if (raw.startsWith("http")) return [raw];
  }
  return deal.main_photo_url ? [deal.main_photo_url] : [];
}

function readEmail() {
  if (typeof window === "undefined") return "";
  return (
    window.localStorage.getItem("vf_email") ||
    window.localStorage.getItem("vaultforge_email") ||
    window.localStorage.getItem("email") ||
    ""
  );
}

export default function ProjectsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");
  const email = useMemo(readEmail, []);

  async function loadDeals() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/deal/list", {
        cache: "no-store",
        headers: email ? { "x-vf-email": email } : {},
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not load deals.");
      setDeals(Array.isArray(data.deals) ? data.deals : []);
    } catch (err: any) {
      setMessage(err?.message || "Could not load deals.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDeals();
  }, []);

  async function addToBucket(dealId: string) {
    setBusyId(dealId);
    setMessage("");
    try {
      const res = await fetch("/api/deal/buy-bucket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(email ? { "x-vf-email": email } : {}),
        },
        body: JSON.stringify({ deal_id: dealId, buyer_email: email || "member@vaultforge.local" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not add deal to Buy Bucket.");
      setMessage("Deal added to Buy Bucket.");
    } catch (err: any) {
      setMessage(err?.message || "Could not add deal to Buy Bucket.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <p style={styles.kicker}>VaultForge Projects</p>
        <h1 style={styles.title}>Deal pipeline.</h1>
        <p style={styles.sub}>Review submitted opportunities, open the deal room, and save targets to your Buy Bucket.</p>
        <div style={styles.nav}>
          <Link href="/dashboard" style={styles.navLink}>Dashboard</Link>
          <Link href="/submit" style={styles.navLink}>Create</Link>
          <Link href="/buy-bucket" style={styles.navLink}>Buy Bucket</Link>
        </div>
      </section>

      {message ? <div style={styles.notice}>{message}</div> : null}
      {loading ? <div style={styles.notice}>Loading deals…</div> : null}
      {!loading && deals.length === 0 ? <div style={styles.notice}>No deals found yet. Create one first.</div> : null}

      <section style={styles.grid}>
        {deals.map((deal) => {
          const photos = getPhotos(deal);
          const firstPhoto = photos[0];
          return (
            <article key={deal.id} style={styles.card}>
              {firstPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={firstPhoto} alt={deal.title || "Deal photo"} style={styles.photo} />
              ) : (
                <div style={styles.photoPlaceholder}>No photo saved</div>
              )}
              <div style={styles.cardBody}>
                <p style={styles.kickerSmall}>{deal.property_type || "Opportunity"} · {deal.strategy || "Strategy TBD"}</p>
                <h2 style={styles.cardTitle}>{deal.title || "Untitled deal"}</h2>
                <p style={styles.meta}>{[deal.city, deal.state].filter(Boolean).join(", ") || deal.address || "Location pending"}</p>
                <div style={styles.stats}>
                  <span>Ask: {money(deal.asking_price)}</span>
                  <span>ARV: {money(deal.arv)}</span>
                  <span>Repairs: {money(deal.repairs)}</span>
                </div>
                <p style={styles.desc}>{deal.description || "No description saved yet."}</p>
                <div style={styles.actions}>
                  <Link href={`/projects?deal=${encodeURIComponent(deal.id)}`} style={styles.secondaryButton} onClick={(e) => {
                    e.preventDefault();
                    window.location.href = `/projects?deal=${encodeURIComponent(deal.id)}`;
                  }}>View Deal</Link>
                  <button type="button" style={styles.primaryButton} onClick={() => addToBucket(deal.id)} disabled={busyId === deal.id}>
                    {busyId === deal.id ? "Saving…" : "Add to Buy Bucket"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <DealRoom />
    </main>
  );
}

function DealRoom() {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("deal");
    if (!id) return;
    setLoading(true);
    fetch(`/api/deal/detail?id=${encodeURIComponent(id)}`, { cache: "no-store" })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) throw new Error(d?.error || "Could not open deal.");
        setDeal(d.deal || null);
      })
      .catch((err) => setError(err?.message || "Could not open deal."))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && !deal && !error) return null;
  const photos = deal ? getPhotos(deal) : [];

  return (
    <section style={styles.room}>
      <h2 style={styles.roomTitle}>Deal Room</h2>
      {loading ? <p>Opening deal…</p> : null}
      {error ? <p style={styles.error}>{error}</p> : null}
      {deal ? (
        <>
          <h3 style={styles.cardTitle}>{deal.title || "Untitled deal"}</h3>
          <p style={styles.meta}>{[deal.city, deal.state].filter(Boolean).join(", ") || deal.address || "Location pending"}</p>
          <div style={styles.photoGrid}>
            {photos.length ? photos.map((url, idx) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url + idx} src={url} alt={`Deal photo ${idx + 1}`} style={styles.roomPhoto} />
            )) : <div style={styles.photoPlaceholder}>No photos saved on this deal.</div>}
          </div>
          <p style={styles.desc}>{deal.description || "No description saved yet."}</p>
        </>
      ) : null}
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#111812", color: "#f6f1df", padding: 24, fontFamily: "Arial, sans-serif" },
  hero: { border: "1px solid rgba(245,215,136,.25)", borderRadius: 28, padding: 24, background: "linear-gradient(135deg,#182216,#243022)" },
  kicker: { color: "#f5d788", letterSpacing: 4, textTransform: "uppercase", fontWeight: 800 },
  title: { fontSize: 46, lineHeight: 1, margin: "10px 0" },
  sub: { color: "#c9c6ba", fontSize: 18, lineHeight: 1.5 },
  nav: { display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 },
  navLink: { color: "#111812", background: "#f5d788", padding: "11px 14px", borderRadius: 999, textDecoration: "none", fontWeight: 800 },
  notice: { marginTop: 18, padding: 16, border: "1px solid rgba(245,215,136,.3)", borderRadius: 18, color: "#baffc9", background: "rgba(255,255,255,.04)" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18, marginTop: 22 },
  card: { overflow: "hidden", border: "1px solid rgba(255,255,255,.12)", borderRadius: 24, background: "#1b241b" },
  photo: { width: "100%", height: 210, objectFit: "cover", display: "block" },
  photoPlaceholder: { minHeight: 160, display: "flex", alignItems: "center", justifyContent: "center", background: "#293127", color: "#c9c6ba", borderRadius: 18, padding: 14 },
  cardBody: { padding: 18 },
  kickerSmall: { color: "#f5d788", fontSize: 12, textTransform: "uppercase", letterSpacing: 2, fontWeight: 800 },
  cardTitle: { fontSize: 25, margin: "6px 0" },
  meta: { color: "#c9c6ba" },
  stats: { display: "grid", gap: 6, margin: "14px 0", color: "#eee" },
  desc: { color: "#d8d5ca", lineHeight: 1.5 },
  actions: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 },
  primaryButton: { border: 0, borderRadius: 999, padding: "12px 15px", background: "#f5d788", color: "#111812", fontWeight: 900, cursor: "pointer" },
  secondaryButton: { border: "1px solid rgba(245,215,136,.55)", borderRadius: 999, padding: "12px 15px", color: "#f5d788", textDecoration: "none", fontWeight: 900 },
  room: { marginTop: 24, border: "1px solid rgba(245,215,136,.25)", borderRadius: 24, padding: 20, background: "#1b241b" },
  roomTitle: { color: "#f5d788", textTransform: "uppercase", letterSpacing: 3 },
  error: { color: "#ffb4b4" },
  photoGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, margin: "16px 0" },
  roomPhoto: { width: "100%", height: 150, objectFit: "cover", borderRadius: 14 },
};
