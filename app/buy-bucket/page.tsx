"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type BucketItem = {
  id: string;
  deal_id: string;
  status?: string | null;
  created_at?: string | null;
  deal?: any;
};

function readEmail() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("vf_email") || window.localStorage.getItem("vaultforge_email") || window.localStorage.getItem("email") || "member@vaultforge.local";
}

function photos(deal: any): string[] {
  const raw = deal?.photo_urls;
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {}
    if (raw.startsWith("http")) return [raw];
  }
  return deal?.main_photo_url ? [deal.main_photo_url] : [];
}

export default function BuyBucketPage() {
  const email = useMemo(readEmail, []);
  const [items, setItems] = useState<BucketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadBucket() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/deal/my-bucket?email=${encodeURIComponent(email)}`, {
        cache: "no-store",
        headers: { "x-vf-email": email },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not load Buy Bucket.");
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (err: any) {
      setMessage(err?.message || "Could not load Buy Bucket.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBucket();
  }, []);

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <p style={styles.kicker}>Buy Bucket</p>
        <h1 style={styles.title}>Saved acquisition targets.</h1>
        <p style={styles.sub}>Deals you save from Projects land here for review and follow-up.</p>
        <div style={styles.nav}>
          <Link href="/dashboard" style={styles.navLink}>Dashboard</Link>
          <Link href="/projects" style={styles.navLink}>Projects</Link>
          <Link href="/submit" style={styles.navLink}>Create</Link>
        </div>
      </section>

      {message ? <div style={styles.notice}>{message}</div> : null}
      {loading ? <div style={styles.notice}>Loading Buy Bucket…</div> : null}
      {!loading && items.length === 0 ? <div style={styles.notice}>Your Buy Bucket is empty. Open Projects and add a deal.</div> : null}

      <section style={styles.grid}>
        {items.map((item) => {
          const deal = item.deal || {};
          const first = photos(deal)[0];
          return (
            <article key={item.id} style={styles.card}>
              {first ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={first} alt={deal.title || "Deal photo"} style={styles.photo} />
              ) : <div style={styles.photoPlaceholder}>No photo saved</div>}
              <div style={styles.cardBody}>
                <p style={styles.kickerSmall}>{item.status || "saved"}</p>
                <h2 style={styles.cardTitle}>{deal.title || "Saved deal"}</h2>
                <p style={styles.meta}>{[deal.city, deal.state].filter(Boolean).join(", ") || deal.address || "Location pending"}</p>
                <div style={styles.actions}>
                  <Link href={`/projects?deal=${encodeURIComponent(item.deal_id)}`} style={styles.secondaryButton}>Open Deal Room</Link>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#111812", color: "#f6f1df", padding: 24, fontFamily: "Arial, sans-serif" },
  hero: { border: "1px solid rgba(245,215,136,.25)", borderRadius: 28, padding: 24, background: "linear-gradient(135deg,#182216,#243022)" },
  kicker: { color: "#f5d788", letterSpacing: 4, textTransform: "uppercase", fontWeight: 800 },
  title: { fontSize: 44, lineHeight: 1, margin: "10px 0" },
  sub: { color: "#c9c6ba", fontSize: 18, lineHeight: 1.5 },
  nav: { display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 },
  navLink: { color: "#111812", background: "#f5d788", padding: "11px 14px", borderRadius: 999, textDecoration: "none", fontWeight: 800 },
  notice: { marginTop: 18, padding: 16, border: "1px solid rgba(245,215,136,.3)", borderRadius: 18, color: "#baffc9", background: "rgba(255,255,255,.04)" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18, marginTop: 22 },
  card: { overflow: "hidden", border: "1px solid rgba(255,255,255,.12)", borderRadius: 24, background: "#1b241b" },
  photo: { width: "100%", height: 210, objectFit: "cover", display: "block" },
  photoPlaceholder: { minHeight: 180, display: "flex", alignItems: "center", justifyContent: "center", background: "#293127", color: "#c9c6ba" },
  cardBody: { padding: 18 },
  kickerSmall: { color: "#f5d788", fontSize: 12, textTransform: "uppercase", letterSpacing: 2, fontWeight: 800 },
  cardTitle: { fontSize: 25, margin: "6px 0" },
  meta: { color: "#c9c6ba" },
  actions: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 },
  secondaryButton: { border: "1px solid rgba(245,215,136,.55)", borderRadius: 999, padding: "12px 15px", color: "#f5d788", textDecoration: "none", fontWeight: 900 },
};
