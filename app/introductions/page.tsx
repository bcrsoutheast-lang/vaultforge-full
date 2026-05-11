"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";


const OWNER_EMAIL = "bcrsoutheast@gmail.com";
type Row = Record<string, any>;

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
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

function readCookie(name: string) {
  if (typeof document === "undefined") return "";
  const match = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
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

function isOwner(email: string) {
  return email === OWNER_EMAIL || readCookie("vf_admin") === "1" || readCookie("isAdmin") === "true";
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function metadataOf(row: Row) {
  return typeof row?.metadata === "object" && row.metadata ? row.metadata : {};
}

function titleOf(row: Row) {
  const m = metadataOf(row);
  return first(
    row.title,
    row.signal_title,
    row.event_title,
    row.alert_title,
    row.intro_title,
    row.headline,
    row.name,
    row.pain_label,
    m.title,
    m.signal_title,
    m.event_title,
    m.intro_title,
    "VaultForge Routing Signal"
  );
}

function noteOf(row: Row) {
  const m = metadataOf(row);
  return first(
    row.note,
    row.notes,
    row.summary,
    row.description,
    row.event_description,
    row.message,
    row.body,
    row.route_summary,
    row.help_requested,
    row.intro_note,
    m.note,
    m.notes,
    m.summary,
    m.description,
    m.message,
    m.route_summary,
    m.intro_note,
    "Routing context ready for owner follow-up."
  );
}

function signalIdOf(row: Row) {
  const m = metadataOf(row);
  return first(row.signal_id, row.signalId, row.alert_id, row.alertId, row.related_alert_id, m.signal_id, m.alert_id, row.id);
}

function itemIdOf(row: Row) {
  const m = metadataOf(row);
  return first(row.item_id, row.itemId, row.pain_id, row.painId, row.deal_id, row.project_id, row.property_id, m.item_id, m.pain_id, m.deal_id, m.project_id);
}

function introIdOf(row: Row) {
  const m = metadataOf(row);
  return first(row.introduction_id, row.intro_id, row.id, m.introduction_id, m.intro_id);
}

function ownerEmailOf(row: Row) {
  const m = metadataOf(row);
  const candidates = [
    row.owner_email, row.submitted_by_email, row.created_by_email, row.creator_email, row.submitted_by,
    row.user_email, row.member_email, row.target_email, row.target_member_email, row.recipient_email,
    row.visible_to_email, row.intro_to_email, row.counterparty_email, row.email,
    m.owner_email, m.submitted_by_email, m.created_by_email, m.creator_email, m.submitted_by,
    m.user_email, m.member_email, m.target_email, m.target_member_email, m.recipient_email,
    m.visible_to_email, m.intro_to_email, m.counterparty_email, m.email,
  ].map(cleanEmail).filter((email) => email.includes("@"));
  return candidates.find((email) => email !== OWNER_EMAIL) || candidates[0] || "";
}

function imageOf(row: Row) {
  const m = metadataOf(row);
  const photos = Array.isArray(row.photos) ? row.photos : [];
  const urls = Array.isArray(row.photo_urls) ? row.photo_urls : [];
  const mUrls = Array.isArray(m.photo_urls) ? m.photo_urls : [];
  return first(
    row.image_url, row.photo_url, row.primary_photo_url, row.main_photo_url, row.cover_image, row.thumbnail_url,
    m.image_url, m.photo_url, m.primary_photo_url, m.main_photo_url,
    urls[0], mUrls[0],
    photos[0]?.url, photos[0]?.publicUrl, photos[0]?.public_url, photos[0]?.data_url, photos[0]
  );
}

function marketOf(row: Row) {
  const m = metadataOf(row);
  return first(row.market, [row.city, row.state].filter(Boolean).join(", "), row.location, row.state, m.market, m.location);
}

function typeOf(row: Row) {
  const m = metadataOf(row);
  return first(row.routing_type, row.intro_type, row.alert_type, row.type, row.category, row.signal_type, row.source, m.routing_type, m.intro_type, m.type, "routing");
}

function priorityOf(row: Row) {
  const m = metadataOf(row);
  return first(row.priority, row.urgency, row.urgency_level, row.severity, m.priority, m.urgency, "medium").toLowerCase();
}

function statusOf(row: Row) {
  const m = metadataOf(row);
  return first(row.status, row.intro_status, row.routing_status, m.status, m.intro_status, "open");
}

function scoreOf(row: Row) {
  const raw = Number(first(row.score, row.signal_score, row.confidence_score, row.match_score, row.fit_score));
  if (Number.isFinite(raw) && raw > 0) return Math.max(0, Math.min(100, Math.round(raw)));
  let score = 54;
  const p = priorityOf(row);
  if (p.includes("urgent")) score += 24;
  if (p.includes("high")) score += 14;
  if (marketOf(row)) score += 6;
  if (ownerEmailOf(row)) score += 8;
  if (imageOf(row)) score += 6;
  return Math.max(0, Math.min(100, score));
}

function toneOf(row: Row) {
  const p = priorityOf(row);
  if (p.includes("urgent") || p.includes("critical")) return "#ef4444";
  if (p.includes("high")) return "#e8c46b";
  return "#9df3bf";
}

function connectHref(row: Row, email: string) {
  const signalId = signalIdOf(row);
  const itemId = itemIdOf(row);
  if (!signalId) return "/signals";
  const query = new URLSearchParams();
  if (email) query.set("email", email);
  if (itemId) query.set("item_id", itemId);
  return `/connect/${encodeURIComponent(signalId)}?${query.toString()}`;
}

function signalHref(row: Row) {
  const signalId = signalIdOf(row);
  return signalId ? `/signals/${encodeURIComponent(signalId)}` : "/signals";
}

function routingHref(row: Row) {
  const signalId = signalIdOf(row);
  return signalId ? `/routing-room/${encodeURIComponent(signalId)}` : "/routing-inbox";
}

function introHref(row: Row) {
  const introId = introIdOf(row);
  return introId ? `/introduction/${encodeURIComponent(introId)}` : "/introductions";
}

function workHref(row: Row) {
  const itemId = itemIdOf(row);
  if (itemId) return `/deal-room/${encodeURIComponent(itemId)}`;
  return signalHref(row);
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 30%), radial-gradient(circle at bottom right, rgba(148,163,184,.10), transparent 32%), linear-gradient(180deg,#020303,#07090d 50%,#020303)",
    color: "white",
    padding: "22px 16px 82px",
    fontFamily: "Inter, Arial, sans-serif",
  },
  wrap: { width: "min(1240px,100%)", margin: "0 auto" },
  hero: {
    border: "1px solid rgba(232,196,107,.28)",
    borderRadius: 30,
    padding: 24,
    background: "linear-gradient(135deg,rgba(255,255,255,.075),rgba(255,255,255,.026))",
    boxShadow: "0 28px 90px rgba(0,0,0,.38)",
    marginBottom: 16,
  },
  eyebrow: { color: "#e8c46b", fontSize: 12, letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 950, margin: "0 0 10px" },
  title: { fontSize: "clamp(44px,8vw,92px)", lineHeight: 0.88, margin: 0, letterSpacing: "-.06em" },
  muted: { color: "#cbd5e1", lineHeight: 1.55 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(315px,1fr))", gap: 16 },
  card: {
    border: "1px solid rgba(232,196,107,.18)",
    borderRadius: 24,
    overflow: "hidden",
    background: "linear-gradient(180deg,rgba(255,255,255,.065),rgba(255,255,255,.026))",
    boxShadow: "0 20px 70px rgba(0,0,0,.25)",
    color: "white",
  },
  body: { padding: 18 },
  chip: {
    color: "#e5e7eb",
    border: "1px solid rgba(255,255,255,.14)",
    background: "rgba(255,255,255,.055)",
    borderRadius: 999,
    padding: "8px 10px",
    fontSize: 12,
    fontWeight: 850,
    display: "inline-flex",
    margin: "0 8px 8px 0",
  },
  actionRow: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 },
  primary: {
    color: "#101010",
    textDecoration: "none",
    borderRadius: 15,
    padding: "12px 15px",
    minHeight: 45,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 950,
    background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
    border: "1px solid rgba(232,196,107,.7)",
    cursor: "pointer",
  },
  secondary: {
    color: "#fff",
    textDecoration: "none",
    borderRadius: 15,
    padding: "12px 15px",
    minHeight: 45,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 850,
    border: "1px solid rgba(255,255,255,.14)",
    background: "rgba(255,255,255,.055)",
    cursor: "pointer",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    minHeight: 54,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,.16)",
    background: "rgba(255,255,255,.07)",
    color: "white",
    padding: "0 16px",
    fontSize: 16,
    outline: "none",
  },
};

function WindowCard({
  row,
  email,
  mode,
}: {
  row: Row;
  email: string;
  mode: "routing" | "introduction";
}) {
  const image = imageOf(row);
  const tone = toneOf(row);
  const signalId = signalIdOf(row);
  const itemId = itemIdOf(row);
  const ownerEmail = ownerEmailOf(row);
  const introId = introIdOf(row);

  return (
    <article style={{ ...styles.card, borderColor: `${tone}66` }}>
      {image ? (
        <Link href={signalHref(row)} style={{ display: "block", textDecoration: "none" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={titleOf(row)} style={{ width: "100%", height: 210, objectFit: "cover", display: "block" }} />
        </Link>
      ) : (
        <div style={{ height: 210, display: "grid", placeItems: "center", color: "rgba(255,255,255,.55)", borderBottom: "1px solid rgba(255,255,255,.10)" }}>
          No photo connected
        </div>
      )}

      <div style={styles.body}>
        <p style={{ ...styles.eyebrow, color: tone }}>
          {priorityOf(row)} · {typeOf(row)} · {statusOf(row)} · score {scoreOf(row)}
        </p>
        <h2 style={{ fontSize: 30, lineHeight: 1.05, margin: "0 0 10px" }}>{titleOf(row)}</h2>
        <p style={{ ...styles.muted, fontSize: 16 }}>{noteOf(row)}</p>

        <div style={{ marginTop: 12 }}>
          {marketOf(row) ? <span style={styles.chip}>{marketOf(row)}</span> : null}
          {signalId ? <span style={styles.chip}>Signal: {signalId}</span> : null}
          {itemId ? <span style={styles.chip}>Item: {itemId}</span> : null}
          {introId ? <span style={styles.chip}>Intro: {introId}</span> : null}
          <span style={styles.chip}>Owner: {ownerEmail || "resolved in Connect"}</span>
        </div>

        <div className="vf-actions" style={styles.actionRow}>
          <Link href={connectHref(row, email)} style={styles.primary}>Message Owner</Link>
          {mode === "introduction" ? <Link href={introHref(row)} style={styles.secondary}>Open Intro</Link> : null}
          <Link href={signalHref(row)} style={styles.secondary}>Open Signal</Link>
          <Link href={routingHref(row)} style={styles.secondary}>Routing Room</Link>
          <Link href={workHref(row)} style={styles.secondary}>Work Area</Link>
        </div>
      </div>
    </article>
  );
}


async function loadIntroductionRows(email: string, owner: boolean) {
  const headers = { "x-vf-email": email, "x-vf-admin": owner ? "1" : "0" };
  const urls = [
    `/api/routing/introductions?email=${encodeURIComponent(email)}&owner=${owner ? "1" : "0"}`,
    `/api/routing/introduction-responses?email=${encodeURIComponent(email)}&owner=${owner ? "1" : "0"}`,
    `/api/simple-messages?email=${encodeURIComponent(email)}&owner=${owner ? "1" : "0"}`,
  ];

  const rows: Row[] = [];

  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: "no-store", headers });
      const data = await safeJson(res);
      const list = Array.isArray(data.introductions)
        ? data.introductions
        : Array.isArray(data.responses)
        ? data.responses
        : Array.isArray(data.messages)
        ? data.messages
        : Array.isArray(data.threads)
        ? data.threads
        : Array.isArray(data.data)
        ? data.data
        : [];
      rows.push(...list.map((item: Row) => ({ ...item, _loaded_from: url })));
    } catch {
      // keep page alive
    }
  }

  const seen = new Set<string>();
  return rows
    .filter((row) => {
      const key = first(introIdOf(row), signalIdOf(row), itemIdOf(row), row.thread_id, row.id, titleOf(row) + noteOf(row));
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => new Date(String(b.created_at || b.updated_at || 0)).getTime() - new Date(String(a.created_at || a.updated_at || 0)).getTime());
}

export default function IntroductionsPage() {
  const [email, setEmail] = useState("");
  const [owner, setOwner] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState("Loading introductions...");
  const [search, setSearch] = useState("");

  async function load() {
    const currentEmail = getEmail();
    const currentOwner = isOwner(currentEmail);

    setEmail(currentEmail);
    setOwner(currentOwner);
    setStatus("Loading introductions...");

    if (!currentEmail) {
      setRows([]);
      setStatus("Login email not found. Please log in again.");
      return;
    }

    try {
      const loaded = await loadIntroductionRows(currentEmail, currentOwner);
      setRows(loaded);
      setStatus(loaded.length ? "" : "No introductions found yet.");
    } catch (error: any) {
      setRows([]);
      setStatus(error?.message || "Could not load introductions.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      [titleOf(row), noteOf(row), statusOf(row), signalIdOf(row), itemIdOf(row), introIdOf(row), ownerEmailOf(row), typeOf(row)]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, search]);

  const staged = rows.filter((row) => statusOf(row).includes("staged")).length;
  const open = rows.filter((row) => statusOf(row).includes("open")).length;
  const withPhotos = rows.filter((row) => imageOf(row)).length;

  return (
    <main style={styles.page}>
      <style>{`
        a:hover, button:hover { transform: translateY(-1px); transition: all .18s ease; filter: brightness(1.06); }
        input::placeholder { color: rgba(255,255,255,.42); }
        @media (max-width: 820px) {
          .vf-actions { display: grid !important; grid-template-columns: 1fr !important; gap: 10px !important; }
          .vf-actions > * { width: 100%; box-sizing: border-box; justify-content: center; margin: 0 !important; }
        }
      `}</style>

      <div style={styles.wrap}>
        <nav style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <Link href="/dashboard" style={{ color: "#f8e7b0", textDecoration: "none", fontWeight: 950, letterSpacing: ".12em" }}>VAULTFORGE</Link>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href="/routing-inbox" style={styles.secondary}>Routing</Link>
            <Link href="/pain-feed" style={styles.secondary}>Pain Feed</Link>
            <Link href="/alerts" style={styles.secondary}>Alerts</Link>
            <Link href="/activity" style={styles.secondary}>Activity</Link>
            <Link href="/messages" style={styles.secondary}>Messages</Link>
          </div>
        </nav>

        <section style={styles.hero}>
          <p style={styles.eyebrow}>VaultForge Introductions</p>
          <h1 style={styles.title}>Intro windows.</h1>
          <p style={{ ...styles.muted, maxWidth: 820, fontSize: 18, marginTop: 16 }}>
            Introductions now use the same card layout and same working Message Owner flow.
          </p>

          <div style={{ marginTop: 16 }}>
            <span style={styles.chip}>Signed in: {email || "unknown"}</span>
            <span style={styles.chip}>Introductions: {rows.length}</span>
            <span style={styles.chip}>Staged: {staged}</span>
            <span style={styles.chip}>Open: {open}</span>
            <span style={styles.chip}>Photos: {withPhotos}</span>
            <span style={styles.chip}>{owner ? "Owner View" : "Member View"}</span>
          </div>

          <div className="vf-actions" style={styles.actionRow}>
            <button type="button" onClick={load} style={styles.primary}>Refresh Introductions</button>
            <Link href="/routing-inbox" style={styles.secondary}>Routing</Link>
            <Link href="/messages" style={styles.secondary}>Messages</Link>
            <Link href="/alerts" style={styles.secondary}>Alerts</Link>
          </div>
        </section>

        <section style={styles.hero}>
          <p style={styles.eyebrow}>Search Introductions</p>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search introductions, owner, signal id..." style={styles.input} />
        </section>

        {status ? <section style={styles.hero}><p style={{ ...styles.muted, margin: 0 }}>{status}</p></section> : null}

        <section style={styles.grid}>
          {filtered.map((row, index) => (
            <WindowCard key={`${introIdOf(row)}-${signalIdOf(row)}-${itemIdOf(row)}-${index}`} row={row} email={email} mode="introduction" />
          ))}
        </section>
      </div>
    </main>
  );
}
