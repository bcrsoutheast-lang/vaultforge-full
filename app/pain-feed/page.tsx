"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";
import {
  VaultForgePulseStrip,
  VaultForgeSignalBar,
  VaultForgeCommandFooter,
  VaultForgeStatGrid,
} from "../components/VaultForgeVisualLayer";

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
    const value = cleanEmail(window.localStorage.getItem(key) || window.sessionStorage.getItem(key));
    if (value.includes("@")) return value;
  }

  return cleanEmail(readCookie("vf_email") || readCookie("vf_admin_email"));
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
  return first(item.title, item.pain_label, item.name, item.headline, "Pain Signal");
}

function noteOf(item: PainItem) {
  return first(
    item.note,
    item.notes,
    item.description,
    item.message,
    item.route_summary,
    item.metadata?.route_summary,
    "Pain signal routed into VaultForge."
  );
}

function painIdOf(item: PainItem) {
  return first(item.id, item.pain_id, item.uuid, item.metadata?.pain_id);
}

function signalIdOf(item: PainItem) {
  const painId = painIdOf(item);
  return first(
    item.signal_id,
    item.signalId,
    item.related_alert_id,
    item.alert_id,
    item.metadata?.signal_id,
    item.metadata?.alert_id,
    painId
  );
}

function priorityOf(item: PainItem) {
  return first(item.priority, item.urgency, item.metadata?.priority, "medium").toLowerCase();
}

function priorityTone(priority: string) {
  if (priority.includes("urgent") || priority.includes("critical")) return "#ef4444";
  if (priority.includes("high")) return "#e8c46b";
  if (priority.includes("low")) return "#94a3b8";
  return "#e8c46b";
}

function marketOf(item: PainItem) {
  return first(item.market, [item.city, item.state].filter(Boolean).join(", "), item.state, item.metadata?.market);
}

function typeOf(item: PainItem) {
  return first(item.pain_type, item.signal_type, item.asset_type, item.metadata?.pain_type, "Pain Signal");
}

function ownerEmailOf(item: PainItem) {
  return cleanEmail(
    first(
      item.owner_email,
      item.submitted_by,
      item.user_email,
      item.member_email,
      item.email,
      item.metadata?.owner_email,
      item.metadata?.submitted_by,
      item.metadata?.user_email,
      item.metadata?.member_email,
      OWNER_EMAIL
    )
  );
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
  if (ownerEmailOf(item) && ownerEmailOf(item) !== OWNER_EMAIL) score += 6;
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

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 30%), radial-gradient(circle at bottom right, rgba(148,163,184,.10), transparent 32%), linear-gradient(180deg,#020303,#07090d 50%,#020303)",
  color: "white",
  padding: "22px 16px 82px",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const wrap: React.CSSProperties = {
  width: "min(1240px,100%)",
  margin: "0 auto",
};

const hero: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.28)",
  borderRadius: 30,
  padding: 24,
  background:
    "linear-gradient(135deg,rgba(255,255,255,.075),rgba(255,255,255,.026))",
  boxShadow: "0 28px 90px rgba(0,0,0,.38)",
  marginBottom: 16,
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  fontSize: 12,
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontWeight: 950,
  margin: "0 0 10px",
};

const title: React.CSSProperties = {
  fontSize: "clamp(44px,8vw,92px)",
  lineHeight: 0.88,
  margin: 0,
  letterSpacing: "-.06em",
};

const subtitle: React.CSSProperties = {
  color: "#cbd5e1",
  fontSize: 18,
  lineHeight: 1.55,
  maxWidth: 820,
  margin: "16px 0 0",
};

const actionRow: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginTop: 16,
};

const primaryAction: React.CSSProperties = {
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
};

const secondaryAction: React.CSSProperties = {
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
};

const input: React.CSSProperties = {
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
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(310px,1fr))",
  gap: 16,
};

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.18)",
  borderRadius: 24,
  padding: 20,
  background:
    "linear-gradient(180deg,rgba(255,255,255,.065),rgba(255,255,255,.026))",
  boxShadow: "0 20px 70px rgba(0,0,0,.25)",
  color: "white",
};

const chip: React.CSSProperties = {
  color: "#e5e7eb",
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(255,255,255,.055)",
  borderRadius: 999,
  padding: "8px 10px",
  fontSize: 12,
  fontWeight: 850,
  display: "inline-flex",
  margin: "0 8px 8px 0",
};

const muted: React.CSSProperties = {
  color: "#cbd5e1",
  lineHeight: 1.55,
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
        headers: {
          "x-vf-email": currentEmail,
          "x-vf-admin": currentOwner ? "1" : "0",
        },
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Could not load pain feed.");
      }

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

  const urgent = items.filter((item) => priorityOf(item) === "urgent").length;
  const high = items.filter((item) => priorityOf(item) === "high").length;
  const normal = Math.max(0, items.length - urgent - high);
  const withOwner = items.filter((item) => ownerEmailOf(item) && ownerEmailOf(item) !== OWNER_EMAIL).length;
  const withPhotos = items.filter((item) => imageOf(item)).length;

  return (
    <main style={page}>
      <style>{`
        a:hover,
        button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        input::placeholder {
          color: rgba(255,255,255,.42);
        }

        @media (max-width: 820px) {
          .vf-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .vf-actions > * {
            width: 100%;
            box-sizing: border-box;
            justify-content: center;
            margin: 0 !important;
          }
        }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav title="Pain Feed" subtitle="Submitted pain records converted into signal-ready operating cards." />

        <VaultForgePulseStrip
          items={[
            { label: "PAIN", value: "LIVE", tone: "gold" },
            { label: "SIGNALS", value: "READY", tone: "silver" },
            { label: "OWNERS", value: withOwner, tone: "green" },
            { label: "PHOTOS", value: withPhotos, tone: "blue" },
          ]}
        />

        <VaultForgeSignalBar urgent={urgent} high={high} normal={normal} active={items.length} routed={0} messages={0} />

        <section style={hero}>
          <p style={eyebrow}>VAULTFORGE PAIN COMMAND FEED</p>
          <h1 style={title}>Pain becomes signal.</h1>
          <p style={subtitle}>
            Pain records stay clean here, but the primary operating path is now Signal Room → Message → Routing → Execution.
          </p>

          <div style={{ marginTop: 16 }}>
            <span style={chip}>Signed in: {email || "unknown"}</span>
            <span style={chip}>Pain Signals: {items.length}</span>
            <span style={chip}>Urgent: {urgent}</span>
            <span style={chip}>High: {high}</span>
            <span style={chip}>Owners detected: {withOwner}</span>
            <span style={chip}>{owner ? "Owner View" : "Member View"}</span>
          </div>

          <div className="vf-actions" style={actionRow}>
            <button type="button" onClick={load} style={primaryAction}>
              {loading ? "Refreshing..." : "Refresh Pain Feed"}
            </button>
            <Link href="/pain" style={primaryAction}>Submit New Pain</Link>
            <Link href="/signals" style={secondaryAction}>Signals</Link>
            <Link href="/dashboard" style={secondaryAction}>Dashboard</Link>
            <Link href="/messages" style={secondaryAction}>Messages</Link>
          </div>
        </section>

        <section style={hero}>
          <p style={eyebrow}>FILTER PAIN SIGNALS</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, market, owner, priority, signal id..."
              style={input}
            />

            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
              style={input}
            >
              <option value="all" style={{ color: "#111" }}>All Priorities</option>
              <option value="urgent" style={{ color: "#111" }}>Urgent</option>
              <option value="high" style={{ color: "#111" }}>High</option>
              <option value="medium" style={{ color: "#111" }}>Medium</option>
              <option value="low" style={{ color: "#111" }}>Low</option>
            </select>
          </div>
        </section>

        <VaultForgeStatGrid
          stats={[
            { label: "Pain Signals", value: items.length, detail: "Real saved pain records.", tone: "gold" },
            { label: "Urgent", value: urgent, detail: "Pressure requiring attention.", tone: "red" },
            { label: "Owners", value: withOwner, detail: "Records with detected submitter/owner.", tone: "green" },
            { label: "Photos", value: withPhotos, detail: "Records with asset context.", tone: "blue" },
          ]}
        />

        {status ? (
          <section style={hero}>
            <p style={{ ...muted, margin: 0 }}>{status}</p>
          </section>
        ) : null}

        <section style={grid}>
          {filtered.map((item, index) => {
            const painId = painIdOf(item);
            const signalId = signalIdOf(item);
            const image = imageOf(item);
            const priority = priorityOf(item);
            const tone = priorityTone(priority);
            const ownerEmail = ownerEmailOf(item);
            const messageHref = `/messages/new?signal_id=${encodeURIComponent(signalId || "")}&item_id=${encodeURIComponent(painId || "")}&recipient=${encodeURIComponent(ownerEmail || OWNER_EMAIL)}&to=${encodeURIComponent(ownerEmail || OWNER_EMAIL)}&subject=${encodeURIComponent(`Pain follow-up: ${titleOf(item)}`)}`;

            return (
              <article key={`${painId}-${signalId}-${index}`} style={{ ...card, borderColor: `${tone}66` }}>
                <p style={{ ...eyebrow, color: tone }}>
                  {priority || "medium"} · {typeOf(item)}
                </p>

                {image ? (
                  <Link href={signalHref(item)} style={{ display: "block", textDecoration: "none" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image}
                      alt={titleOf(item)}
                      style={{
                        width: "100%",
                        height: 190,
                        objectFit: "cover",
                        borderRadius: 18,
                        border: "1px solid rgba(232,196,107,.18)",
                        marginBottom: 14,
                      }}
                    />
                  </Link>
                ) : null}

                <h2 style={{ fontSize: 30, lineHeight: 1.05, margin: "0 0 10px" }}>{titleOf(item)}</h2>
                <p style={{ ...muted, fontSize: 16 }}>{noteOf(item)}</p>

                <div style={{ marginTop: 12 }}>
                  <span style={chip}>Score: {scoreOf(item)}</span>
                  {marketOf(item) ? <span style={chip}>{marketOf(item)}</span> : null}
                  {painId ? <span style={chip}>Pain: {painId}</span> : null}
                  {signalId ? <span style={chip}>Signal: {signalId}</span> : null}
                  <span style={chip}>Owner: {ownerEmail || OWNER_EMAIL}</span>
                </div>

                <div className="vf-actions" style={actionRow}>
                  <Link href={signalHref(item)} style={primaryAction}>Open Signal Room</Link>
                  <Link href={messageHref} style={secondaryAction}>Message Owner</Link>
                  <Link href={painRoomHref(item)} style={secondaryAction}>Pain Room Backup</Link>
                </div>
              </article>
            );
          })}
        </section>

        <section style={{ ...hero, marginTop: 18 }}>
          <p style={eyebrow}>OPERATING RULE</p>
          <p style={{ ...muted, fontSize: 18 }}>
            Pain Feed remains the intake list. Signal Room is now the main operating room. Pain Room stays available as a backup path only.
          </p>
        </section>

        <VaultForgeCommandFooter />
      </div>
    </main>
  );
}
