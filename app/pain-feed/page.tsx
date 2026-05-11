"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type PainItem = Record<string, any>;

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function readCookie(name: string) {
  if (typeof document === "undefined") return "";
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

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

function titleOf(item: PainItem) {
  return first(item.title, item.pain_label, item.name, item.headline, item.metadata?.title, "Pain Signal");
}

function noteOf(item: PainItem) {
  return first(
    item.note,
    item.notes,
    item.description,
    item.message,
    item.route_summary,
    item.help_requested,
    item.metadata?.route_summary,
    item.metadata?.help_requested,
    "Pain signal routed into VaultForge."
  );
}

function painIdOf(item: PainItem) {
  return first(item.id, item.pain_id, item.uuid, item.item_id, item.metadata?.pain_id, item.metadata?.item_id);
}

function signalIdOf(item: PainItem) {
  const painId = painIdOf(item);
  return first(
    item.signal_id,
    item.signalId,
    item.related_alert_id,
    item.alert_id,
    item.routing_id,
    item.metadata?.signal_id,
    item.metadata?.alert_id,
    painId
  );
}

function priorityOf(item: PainItem) {
  return first(item.priority, item.urgency, item.urgency_level, item.metadata?.priority, item.metadata?.urgency, "medium").toLowerCase();
}

function priorityTone(priority: string) {
  if (priority.includes("urgent") || priority.includes("critical")) return "#ef4444";
  if (priority.includes("high")) return "#e8c46b";
  if (priority.includes("low")) return "#94a3b8";
  return "#e8c46b";
}

function marketOf(item: PainItem) {
  return first(item.market, [item.city, item.state].filter(Boolean).join(", "), item.location, item.state, item.metadata?.market);
}

function typeOf(item: PainItem) {
  return first(item.pain_type, item.signal_type, item.asset_type, item.metadata?.pain_type, "Pain Signal");
}

function ownerEmailOf(item: PainItem) {
  const candidates = [
    item.owner_email,
    item.created_by_email,
    item.submitted_by_email,
    item.creator_email,
    item.submitted_by,
    item.user_email,
    item.member_email,
    item.email,
    item.metadata?.owner_email,
    item.metadata?.created_by_email,
    item.metadata?.submitted_by_email,
    item.metadata?.creator_email,
    item.metadata?.submitted_by,
    item.metadata?.user_email,
    item.metadata?.member_email,
    item.metadata?.email,
  ]
    .map(cleanEmail)
    .filter((email) => email.includes("@"));

  return candidates.find((email) => email !== OWNER_EMAIL) || candidates[0] || "";
}

function imageOf(item: PainItem) {
  const photos = Array.isArray(item.photos) ? item.photos : [];
  const photoUrls = Array.isArray(item.photo_urls) ? item.photo_urls : [];
  const metadataPhotoUrls = Array.isArray(item.metadata?.photo_urls) ? item.metadata.photo_urls : [];

  return first(
    item.image_url,
    item.photo_url,
    item.primary_photo_url,
    item.metadata?.image_url,
    item.metadata?.photo_url,
    photoUrls[0],
    metadataPhotoUrls[0],
    photos[0]?.url,
    photos[0]?.publicUrl,
    photos[0]?.public_url,
    photos[0]?.data_url,
    photos[0]?.dataUrl,
    photos[0]
  );
}

function scoreOf(item: PainItem) {
  const raw = Number(first(item.score, item.signal_score, item.confidence_score));
  if (Number.isFinite(raw) && raw > 0) return Math.max(0, Math.min(100, Math.round(raw)));

  let score = 54;
  const priority = priorityOf(item);
  if (priority.includes("urgent")) score += 24;
  if (priority.includes("high")) score += 14;
  if (marketOf(item)) score += 6;
  if (ownerEmailOf(item)) score += 8;
  if (imageOf(item)) score += 6;
  return Math.max(0, Math.min(100, score));
}

function signalHref(item: PainItem) {
  const signalId = signalIdOf(item);
  return signalId ? `/signals/${encodeURIComponent(signalId)}` : "/signals";
}

function painRoomHref(item: PainItem) {
  const painId = painIdOf(item);
  return painId ? `/pain-room/${encodeURIComponent(painId)}` : signalHref(item);
}

function routingHref(item: PainItem) {
  const signalId = signalIdOf(item);
  return signalId ? `/routing-room/${encodeURIComponent(signalId)}` : "/routing-inbox";
}

function connectHref(item: PainItem, viewerEmail: string) {
  const signalId = signalIdOf(item);
  const painId = painIdOf(item);

  if (!signalId) return "/pain-feed";

  const query = new URLSearchParams();
  if (viewerEmail) query.set("email", viewerEmail);
  if (painId) query.set("item_id", painId);

  return `/connect/${encodeURIComponent(signalId)}?${query.toString()}`;
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 30%), radial-gradient(circle at bottom right, rgba(148,163,184,.10), transparent 32%), linear-gradient(180deg,#020303,#07090d 50%,#020303)",
    color: "white",
    padding: "22px 16px 82px",
    fontFamily: 'Inter, Arial, sans-serif',
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
  eyebrow: {
    color: "#e8c46b",
    fontSize: 12,
    letterSpacing: ".18em",
    textTransform: "uppercase",
    fontWeight: 950,
    margin: "0 0 10px",
  },
  title: {
    fontSize: "clamp(44px,8vw,92px)",
    lineHeight: 0.88,
    margin: 0,
    letterSpacing: "-.06em",
  },
  muted: { color: "#cbd5e1", lineHeight: 1.55 },
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
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(310px,1fr))", gap: 16 },
  card: {
    border: "1px solid rgba(232,196,107,.18)",
    borderRadius: 24,
    padding: 20,
    background: "linear-gradient(180deg,rgba(255,255,255,.065),rgba(255,255,255,.026))",
    boxShadow: "0 20px 70px rgba(0,0,0,.25)",
    color: "white",
  },
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
};

export default function PainFeedPage() {
  const [email, setEmail] = useState("");
  const [owner, setOwner] = useState(false);
  const [items, setItems] = useState<PainItem[]>([]);
  const [status, setStatus] = useState("Loading pain feed...");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setStatus("Loading pain feed...");

    try {
      const currentEmail = getEmail();
      const currentOwner = isOwner(currentEmail);

      setEmail(currentEmail);
      setOwner(currentOwner);

      if (!currentEmail) {
        setStatus("Login email not found. Please log in again.");
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/pain/feed?email=${encodeURIComponent(currentEmail)}&owner=${currentOwner ? "1" : "0"}`, {
        cache: "no-store",
        headers: { "x-vf-email": currentEmail, "x-vf-admin": currentOwner ? "1" : "0" },
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) throw new Error(data?.error || data?.details || "Could not load pain feed.");

      const realItems = Array.isArray(data.pains) ? data.pains : [];
      setItems(realItems);
      setStatus(realItems.length ? "" : "No real pain records found yet. Submit a new Pain Button item first.");
    } catch (error: any) {
      setItems([]);
      setStatus(error?.message || "Could not load pain feed.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return items
      .filter((item) => {
        if (priorityFilter !== "all" && priorityOf(item) !== priorityFilter) return false;
        if (!q) return true;

        return [
          titleOf(item),
          noteOf(item),
          marketOf(item),
          priorityOf(item),
          typeOf(item),
          painIdOf(item),
          signalIdOf(item),
          ownerEmailOf(item),
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => scoreOf(b) - scoreOf(a));
  }, [items, search, priorityFilter]);

  const urgent = items.filter((item) => priorityOf(item).includes("urgent")).length;
  const high = items.filter((item) => priorityOf(item).includes("high")).length;
  const withOwner = items.filter((item) => ownerEmailOf(item)).length;

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
          <Link href="/dashboard" style={{ color: "#f8e7b0", textDecoration: "none", fontWeight: 950, letterSpacing: ".12em" }}>
            VAULTFORGE
          </Link>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href="/dashboard" style={styles.secondary}>Dashboard</Link>
            <Link href="/signals" style={styles.secondary}>Signals</Link>
            <Link href="/messages" style={styles.secondary}>Messages</Link>
            <Link href="/routing-inbox" style={styles.secondary}>Routing</Link>
            <Link href="/alerts" style={styles.secondary}>Alerts</Link>
          </div>
        </nav>

        <section style={styles.hero}>
          <p style={styles.eyebrow}>VaultForge Pain Feed</p>
          <h1 style={styles.title}>Pain becomes signal.</h1>
          <p style={{ ...styles.muted, maxWidth: 820, fontSize: 18, marginTop: 16 }}>
            Message Owner now goes directly to the simple Connect system, not the old broken message route.
          </p>

          <div style={{ marginTop: 16 }}>
            <span style={styles.chip}>Signed in: {email || "unknown"}</span>
            <span style={styles.chip}>Pain Signals: {items.length}</span>
            <span style={styles.chip}>Urgent: {urgent}</span>
            <span style={styles.chip}>High: {high}</span>
            <span style={styles.chip}>Owners detected: {withOwner}</span>
            <span style={styles.chip}>{owner ? "Owner View" : "Member View"}</span>
          </div>

          <div className="vf-actions" style={styles.actionRow}>
            <button type="button" onClick={load} style={styles.primary}>{loading ? "Refreshing..." : "Refresh Pain Feed"}</button>
            <Link href="/pain" style={styles.primary}>Submit New Pain</Link>
            <Link href="/messages" style={styles.secondary}>Messages</Link>
            <Link href="/activity" style={styles.secondary}>Activity</Link>
          </div>
        </section>

        <section style={styles.hero}>
          <p style={styles.eyebrow}>Filter Pain Signals</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, market, owner, priority, signal id..." style={styles.input} />
            <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} style={styles.input}>
              <option value="all" style={{ color: "#111" }}>All Priorities</option>
              <option value="urgent" style={{ color: "#111" }}>Urgent</option>
              <option value="high" style={{ color: "#111" }}>High</option>
              <option value="medium" style={{ color: "#111" }}>Medium</option>
              <option value="low" style={{ color: "#111" }}>Low</option>
            </select>
          </div>
        </section>

        {status ? <section style={styles.hero}><p style={{ ...styles.muted, margin: 0 }}>{status}</p></section> : null}

        <section style={styles.grid}>
          {filtered.map((item, index) => {
            const painId = painIdOf(item);
            const signalId = signalIdOf(item);
            const image = imageOf(item);
            const priority = priorityOf(item);
            const tone = priorityTone(priority);
            const ownerEmail = ownerEmailOf(item);
            const connect = connectHref(item, email);

            return (
              <article key={`${painId}-${signalId}-${index}`} style={{ ...styles.card, borderColor: `${tone}66` }}>
                <p style={{ ...styles.eyebrow, color: tone }}>{priority || "medium"} · {typeOf(item)}</p>

                {image ? (
                  <Link href={signalHref(item)} style={{ display: "block", textDecoration: "none" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image}
                      alt={titleOf(item)}
                      style={{ width: "100%", height: 190, objectFit: "cover", borderRadius: 18, border: "1px solid rgba(232,196,107,.18)", marginBottom: 14 }}
                    />
                  </Link>
                ) : null}

                <h2 style={{ fontSize: 30, lineHeight: 1.05, margin: "0 0 10px" }}>{titleOf(item)}</h2>
                <p style={{ ...styles.muted, fontSize: 16 }}>{noteOf(item)}</p>

                <div style={{ marginTop: 12 }}>
                  <span style={styles.chip}>Score: {scoreOf(item)}</span>
                  {marketOf(item) ? <span style={styles.chip}>{marketOf(item)}</span> : null}
                  {painId ? <span style={styles.chip}>Pain: {painId}</span> : null}
                  {signalId ? <span style={styles.chip}>Signal: {signalId}</span> : null}
                  <span style={styles.chip}>Owner: {ownerEmail || "resolved in Connect"}</span>
                </div>

                <div className="vf-actions" style={styles.actionRow}>
                  <Link href={connect} style={styles.primary}>Message Owner</Link>
                  <Link href={signalHref(item)} style={styles.secondary}>Open Signal</Link>
                  <Link href={painRoomHref(item)} style={styles.secondary}>Pain Room</Link>
                  <Link href={routingHref(item)} style={styles.secondary}>Routing Room</Link>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
