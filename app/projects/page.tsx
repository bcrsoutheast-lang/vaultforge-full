import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Deal = {
  id: string;
  title: string;
  state: string;
  property_type: string;
  strategy: string | null;
  price: number | null;
  description: string | null;
  status: string;
  buy_bucket_count: number;
  ai_summary: string | null;
  created_at: string;
};

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function money(value: number | null) {
  if (!value) return "Price not listed";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export default async function ProjectsPage() {
  const supabase = getSupabase();
  let deals: Deal[] = [];
  let errorMessage = "";

  if (!supabase) {
    errorMessage = "Supabase keys are missing in Vercel.";
  } else {
    const { data, error } = await supabase
      .from("vf_deals")
      .select("id,title,state,property_type,strategy,price,description,status,buy_bucket_count,ai_summary,created_at")
      .eq("archived", false)
      .order("created_at", { ascending: false });

    if (error) errorMessage = error.message;
    deals = (data || []) as Deal[];
  }

  return (
    <main style={page}>
      <nav style={nav}>
        <Link style={link} href="/dashboard">Dashboard</Link>
        <Link style={link} href="/submit">Create Deal</Link>
        <Link style={link} href="/network">Network</Link>
      </nav>

      <section style={headerCard}>
        <p style={eyebrow}>VaultForge Projects</p>
        <h1 style={titleStyle}>Saved Deals</h1>
        <p style={subtext}>This page reads real rows from Supabase table vf_deals.</p>
      </section>

      {errorMessage ? <div style={errorBox}>{errorMessage}</div> : null}

      {!errorMessage && deals.length === 0 ? (
        <section style={card}>
          <h2>No deals saved yet.</h2>
          <p style={subtext}>Create one deal, then come back here and refresh. It should stay saved.</p>
          <Link style={buttonLink} href="/submit">Create First Deal</Link>
        </section>
      ) : null}

      <section style={grid}>
        {deals.map((deal) => (
          <article key={deal.id} style={card}>
            <div style={rowBetween}>
              <span style={pill}>{deal.status || "active"}</span>
              <span style={muted}>{new Date(deal.created_at).toLocaleDateString()}</span>
            </div>
            <h2 style={{ marginBottom: 8 }}>{deal.title}</h2>
            <p style={muted}>{deal.state} • {deal.property_type} • {deal.strategy || "Strategy open"}</p>
            <p style={priceStyle}>{money(deal.price)}</p>
            {deal.description ? <p style={bodyText}>{deal.description}</p> : null}
            {deal.ai_summary ? <p style={aiBox}>AI route: {deal.ai_summary}</p> : null}
            <div style={actions}>
              <button style={smallButton}>Add to Buy Bucket</button>
              <button style={smallButton}>Message</button>
              <button style={ghostButton}>Archive later</button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

const page = { minHeight: "100vh", padding: 24, background: "#071326", color: "white", fontFamily: "Arial" };
const nav = { display: "flex", gap: 12, flexWrap: "wrap" as const, marginBottom: 24 };
const link = { color: "white", textDecoration: "none", border: "1px solid rgba(255,255,255,.25)", borderRadius: 999, padding: "10px 14px" };
const headerCard = { background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.16)", borderRadius: 22, padding: 24, marginBottom: 18 };
const eyebrow = { color: "#a7f3d0", fontSize: 13, letterSpacing: 1, textTransform: "uppercase" as const };
const titleStyle = { fontSize: 36, margin: "8px 0" };
const subtext = { color: "rgba(255,255,255,.76)", lineHeight: 1.5 };
const grid = { display: "grid", gap: 16 };
const card = { background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.16)", borderRadius: 22, padding: 20 };
const rowBetween = { display: "flex", justifyContent: "space-between", gap: 12 };
const pill = { background: "rgba(167,243,208,.15)", color: "#a7f3d0", border: "1px solid rgba(167,243,208,.35)", borderRadius: 999, padding: "6px 10px", fontSize: 12, fontWeight: 800 };
const muted = { color: "rgba(255,255,255,.65)" };
const priceStyle = { fontSize: 22, fontWeight: 900, margin: "12px 0" };
const bodyText = { color: "rgba(255,255,255,.82)", lineHeight: 1.5 };
const aiBox = { borderLeft: "3px solid #a7f3d0", paddingLeft: 12, color: "rgba(255,255,255,.82)" };
const actions = { display: "flex", gap: 10, flexWrap: "wrap" as const, marginTop: 16 };
const smallButton = { border: 0, borderRadius: 12, padding: "10px 12px", fontWeight: 800, cursor: "pointer" };
const ghostButton = { border: "1px solid rgba(255,255,255,.25)", background: "transparent", color: "white", borderRadius: 12, padding: "10px 12px", fontWeight: 800, cursor: "pointer" };
const errorBox = { background: "rgba(248,113,113,.14)", border: "1px solid rgba(248,113,113,.45)", borderRadius: 18, padding: 16, marginBottom: 18 };
const buttonLink = { display: "inline-block", color: "#071326", background: "white", textDecoration: "none", borderRadius: 14, padding: "12px 16px", fontWeight: 900 };
