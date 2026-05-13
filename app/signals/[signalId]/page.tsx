"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type AnyRow = Record<string, any>;

type SignalApiState = {
  ok?: boolean;
  signal?: AnyRow | null;
  routing_actions?: AnyRow[];
  messages?: AnyRow[];
  activity?: AnyRow[];
  alerts?: AnyRow[];
  score?: number;
  counts?: Record<string, number>;
  direct_links?: Record<string, string>;
  error?: string;
  details?: string;
};

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

function localEmail() {
  if (typeof window === "undefined") return "";

  const keys = ["vf_email", "vf_member_email", "vf_admin_email", "email", "memberEmail"];

  for (const key of keys) {
    const value = cleanEmail(window.localStorage.getItem(key) || window.sessionStorage.getItem(key));
    if (value.includes("@")) return value;
  }

  return cleanEmail(readCookie("vf_email") || readCookie("vf_member_email") || readCookie("vf_admin_email"));
}

function ownerView(email: string) {
  return email === OWNER_EMAIL || readCookie("vf_admin") === "1" || readCookie("isAdmin") === "true";
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function label(value: unknown, fallback = "Unassigned") {
  const text = clean(value || fallback).replace(/_/g, " ").replace(/-/g, " ");
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
}

function signalTitle(signal: AnyRow | null | undefined, signalId: string) {
  return first(signal?.title, signal?.signal_title, signal?.headline, signal?.name, signal?.pain_label, `Signal ${signalId}`);
}

function signalNote(signal: AnyRow | null | undefined) {
  return first(
    signal?.note,
    signal?.notes,
    signal?.summary,
    signal?.description,
    signal?.message,
    signal?.route_summary,
    "Signal context is being organized for routing, messaging, and execution."
  );
}

function priorityOf(signal: AnyRow | null | undefined) {
  return first(signal?.priority, signal?.urgency, signal?.severity, "medium").toLowerCase();
}

function toneForPriority(priority: string) {
  if (priority.includes("urgent") || priority.includes("critical")) return "#ff6b5f";
  if (priority.includes("high")) return "#f5d978";
  if (priority.includes("low")) return "#94a3b8";
  return "#e8c46b";
}

function marketOf(signal: AnyRow | null | undefined) {
  return first(signal?.market, [signal?.city, signal?.state].filter(Boolean).join(", "), signal?.state, signal?.location);
}

function ownerEmailOf(signal: AnyRow | null | undefined) {
  return cleanEmail(
    first(
      signal?.owner_email,
      signal?.submitted_by,
      signal?.user_email,
      signal?.member_email,
      signal?.email,
      signal?.metadata?.owner_email,
      signal?.metadata?.submitted_by,
      signal?.metadata?.user_email,
      signal?.metadata?.member_email,
      OWNER_EMAIL
    )
  );
}

function photosOf(signal: AnyRow | null | undefined) {
  const fromPhotos = Array.isArray(signal?.photos)
    ? signal?.photos
        .map((photo: any) => first(photo?.url, photo?.publicUrl, photo?.public_url, photo?.data_url, photo?.dataUrl, photo))
        .filter(Boolean)
    : [];

  const fromPhotoUrls = Array.isArray(signal?.photo_urls) ? signal?.photo_urls.map(clean).filter(Boolean) : [];
  const single = first(signal?.image_url, signal?.photo_url, signal?.primary_photo_url);

  return Array.from(new Set([single, ...fromPhotoUrls, ...fromPhotos].filter(Boolean)));
}

function validImageUrl(url: unknown) {
  const value = clean(url);
  const lowerValue = value.toLowerCase();

  if (!value) return false;
  if (lowerValue === "null") return false;
  if (lowerValue === "undefined") return false;
  if (lowerValue.includes("[object object]")) return false;
  if (!lowerValue.startsWith("http")) return false;

  return true;
}

function pct(value: number) {
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}

function scoreFrom(state: SignalApiState, signal: AnyRow | null | undefined) {
  if (typeof state.score === "number" && Number.isFinite(state.score)) return Math.round(state.score);
  const raw = Number(first(signal?.score, signal?.signal_score, signal?.confidence_score, signal?.match_score));
  if (Number.isFinite(raw) && raw > 0) return Math.max(0, Math.min(100, Math.round(raw)));

  let score = 52;
  const priority = priorityOf(signal);
  if (priority.includes("urgent")) score += 20;
  if (priority.includes("high")) score += 12;
  if (marketOf(signal)) score += 6;
  if (ownerEmailOf(signal) && ownerEmailOf(signal) !== OWNER_EMAIL) score += 6;
  if (photosOf(signal).length) score += 6;
  return Math.max(0, Math.min(100, score));
}

function signalBars(state: SignalApiState, signal: AnyRow | null | undefined) {
  const score = scoreFrom(state, signal);
  const priority = priorityOf(signal);
  const routingCount = Number(state.counts?.routing || state.routing_actions?.length || 0);
  const messageCount = Number(state.counts?.messages || state.messages?.length || 0);
  const photoCount = photosOf(signal).length;

  return [
    { label: "Signal strength", value: score, note: "Overall operating score" },
    { label: "Urgency", value: priority.includes("urgent") ? 96 : priority.includes("high") ? 82 : priority.includes("low") ? 38 : 60, note: label(priority) },
    { label: "Routing activity", value: Math.min(100, routingCount * 22), note: `${routingCount} routing action${routingCount === 1 ? "" : "s"}` },
    { label: "Communication", value: Math.min(100, messageCount * 18), note: `${messageCount} message${messageCount === 1 ? "" : "s"}` },
    { label: "Asset context", value: photoCount ? 76 : 34, note: photoCount ? `${photoCount} photo${photoCount === 1 ? "" : "s"}` : "No photos yet" },
  ];
}

function Ticker({ signal, state }: { signal: AnyRow | null; state: SignalApiState }) {
  const items = [
    `Signal room opened: ${signalTitle(signal, "")}`,
    `Owner path: ${ownerEmailOf(signal) || OWNER_EMAIL}`,
    `Market: ${marketOf(signal) || "unassigned"}`,
    `Routing records: ${state.routing_actions?.length || 0}`,
    `Messages: ${state.messages?.length || 0}`,
    `Priority: ${label(priorityOf(signal))}`,
  ];

  return (
    <div style={styles.tickerWrap}>
      <div style={styles.tickerTrack}>
        {[...items, ...items].map((item, index) => (
          <span key={`${item}-${index}`} style={styles.tickerItem}>{item}</span>
        ))}
      </div>
    </div>
  );
}

function SignalBar({ labelText, value, note, tone }: { labelText: string; value: number; note: string; tone: string }) {
  return (
    <div style={styles.signalBarCard}>
      <div style={styles.signalBarTop}>
        <span>{labelText}</span>
        <strong>{pct(value)}</strong>
      </div>
      <div style={styles.barRail}>
        <div style={{ ...styles.barFill, width: pct(value), background: `linear-gradient(90deg, ${tone}, #f8e7b0)` }} />
      </div>
      <small style={styles.mutedSmall}>{note}</small>
    </div>
  );
}

function MiniList({ title, rows, empty }: { title: string; rows: AnyRow[]; empty: string }) {
  return (
    <section style={styles.panel}>
      <h2 style={styles.panelTitle}>{title}</h2>
      {rows.length ? (
        <div style={styles.listStack}>
          {rows.slice(0, 5).map((row, index) => (
            <article key={first(row.id, row.thread_id, row.created_at, index)} style={styles.listItem}>
              <strong>{first(row.title, row.subject, row.action, row.message, row.note, `${title} item`)}</strong>
              <span>{first(row.status, row.priority, row.created_at, row.sender_email, row.recipient_email, "Active")}</span>
            </article>
          ))}
        </div>
      ) : (
        <p style={styles.muted}>{empty}</p>
      )}
    </section>
  );
}

export default function SignalRoomPage() {
  const params = useParams();
  const signalId = decodeURIComponent(String(params?.signalId || ""));

  const [state, setState] = useState<SignalApiState>({});
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [isOwner, setIsOwner] = useState(false);

  async function load() {
    setLoading(true);

    const currentEmail = localEmail();
    const currentOwner = ownerView(currentEmail);
    setEmail(currentEmail);
    setIsOwner(currentOwner);

    try {
      const query = new URLSearchParams();
      if (currentEmail) query.set("email", currentEmail);
      if (currentOwner) query.set("owner", "1");

      const response = await fetch(`/api/signals/${encodeURIComponent(signalId)}?${query.toString()}`, {
        cache: "no-store",
        headers: {
          "x-vf-email": currentEmail,
          "x-vf-admin": currentOwner ? "1" : "0",
        },
      });

      const json = await safeJson(response);
      setState(json);
    } catch (error: any) {
      setState({ ok: false, error: "Could not load signal room.", details: error?.message || String(error) });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [signalId]);

  const signal = state.signal || null;
  const priority = priorityOf(signal);
  const tone = toneForPriority(priority);
  const photos = photosOf(signal).filter(validImageUrl);
  const ownerEmail = ownerEmailOf(signal);
  const bars = useMemo(() => signalBars(state, signal), [state, signal]);
  const messageHref = `/connect/${encodeURIComponent(signalId)}?source=signal&signal_id=${encodeURIComponent(signalId)}&to=${encodeURIComponent(ownerEmail || OWNER_EMAIL)}&subject=${encodeURIComponent(`Request info: ${signalTitle(signal, signalId)}`)}`;

  return (
    <main style={styles.page}>
      <style>{`
        @keyframes vfTickerMove {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        a:hover, button:hover {
          transform: translateY(-1px);
          filter: brightness(1.06);
          transition: all .18s ease;
        }

        @media (max-width: 860px) {
          .vf-hero-grid, .vf-two-grid, .vf-bars-grid, .vf-photo-grid {
            grid-template-columns: 1fr !important;
          }
          .vf-actions { display: grid !important; grid-template-columns: 1fr !important; }
          .vf-actions > * { width: 100%; box-sizing: border-box; justify-content: center; }
        }
      `}</style>

      <section style={styles.shell}>
        <nav style={styles.topNav}>
          <Link href="/dashboard" style={styles.brand}>VaultForge</Link>
          <div style={styles.navLinks}>
            <Link href="/dashboard" style={styles.navLink}>Dashboard</Link>
            <Link href="/signals" style={styles.navLink}>Signals</Link>
            <Link href="/pain-feed" style={styles.navLink}>Pain Feed</Link>
            <Link href="/projects" style={styles.navLink}>Projects</Link>
            <Link href="/messages" style={styles.navLink}>Messages</Link>
            <Link href="/routing-inbox" style={styles.navLink}>Routing</Link>
            <Link href="/members" style={styles.navLink}>Members</Link>
            {isOwner ? <Link href="/admin" style={styles.ownerLink}>Admin</Link> : null}
          </div>
        </nav>

        <Ticker signal={signal} state={state} />

        <section className="vf-hero-grid" style={{ ...styles.hero, borderColor: `${tone}66` }}>
          <div>
            <p style={{ ...styles.eyebrow, color: tone }}>VAULTFORGE SIGNAL ROOM</p>
            <h1 style={styles.title}>{signalTitle(signal, signalId)}</h1>
            <p style={styles.subtitle}>{signalNote(signal)}</p>

            <div style={styles.chipRow}>
              <span style={styles.chip}>Signal: {signalId}</span>
              <span style={styles.chip}>Priority: {label(priority)}</span>
              <span style={styles.chip}>Market: {marketOf(signal) || "Unassigned"}</span>
              <span style={styles.chip}>Owner: {ownerEmail || OWNER_EMAIL}</span>
            </div>

            <div className="vf-actions" style={styles.actionRow}>
              <Link href={messageHref} style={styles.primaryAction}>Message Owner</Link>
              <Link href="/signals" style={styles.secondaryAction}>Back to Signals</Link>
              <Link href="/dashboard" style={styles.secondaryAction}>Dashboard</Link>
              <button type="button" onClick={load} style={styles.ghostButton}>{loading ? "Refreshing..." : "Refresh Room"}</button>
            </div>

            {state.ok === false && state.error ? (
              <div style={styles.errorBox}>
                <strong>{state.error}</strong>
                {state.details ? <span>{state.details}</span> : null}
              </div>
            ) : null}
          </div>

          <aside style={styles.ownerCard}>
            <span style={styles.cardLabel}>Current viewer</span>
            <strong style={styles.ownerEmail}>{email || "member session"}</strong>
            <span style={styles.rolePill}>{isOwner ? "Owner/Admin View" : "Member View"}</span>
            <div style={styles.ownerDivider} />
            <span style={styles.cardLabel}>Item owner / submitter</span>
            <strong style={styles.ownerEmail}>{ownerEmail || OWNER_EMAIL}</strong>
            <small style={styles.mutedSmall}>Messages route here first. BCR is fallback only.</small>
          </aside>
        </section>

        <section className="vf-bars-grid" style={styles.barsGrid}>
          {bars.map((bar) => (
            <SignalBar key={bar.label} labelText={bar.label} value={bar.value} note={bar.note} tone={tone} />
          ))}
        </section>

        <section className="vf-two-grid" style={styles.twoGrid}>
          <section style={styles.panel}>
            <h2 style={styles.panelTitle}>Signal Overview</h2>
            <div style={styles.detailGrid}>
              <div><span>Type</span><strong>{label(first(signal?.signal_type, signal?.item_kind, signal?.pain_type, "Signal"))}</strong></div>
              <div><span>Status</span><strong>{label(first(signal?.status, "active"))}</strong></div>
              <div><span>Asset</span><strong>{label(first(signal?.asset_type, signal?.property_type, "Unassigned"))}</strong></div>
              <div><span>Strategy</span><strong>{label(first(signal?.strategy, signal?.exit_strategy, "Review"))}</strong></div>
              <div><span>Created</span><strong>{first(signal?.created_at, "—")}</strong></div>
              <div><span>Source</span><strong>{label(first(signal?._source_table, signal?.source_table, signal?.source, "VaultForge"))}</strong></div>
            </div>
          </section>

          <section style={styles.panel}>
            <h2 style={styles.panelTitle}>AI Summary</h2>
            <p style={styles.muted}>
              This room consolidates the signal into one operating view. The next AI layer should rank matching members,
              explain why they fit, and recommend whether to route, request more info, or hold for owner review.
            </p>
            <div style={styles.chipRow}>
              <span style={styles.goldChip}>Signal score: {scoreFrom(state, signal)}</span>
              <span style={styles.goldChip}>Routing: {state.routing_actions?.length || 0}</span>
              <span style={styles.goldChip}>Messages: {state.messages?.length || 0}</span>
            </div>
          </section>
        </section>

        {photos.length ? (
          <section style={styles.panelWide}>
            <h2 style={styles.panelTitle}>Photos / Asset Context</h2>
            <div className="vf-photo-grid" style={styles.photoGrid}>
              {photos.slice(0, 8).map((url) => (
                <a key={url} href={url} target="_blank" rel="noreferrer" style={styles.photoLink}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt="VaultForge signal asset"
                    style={styles.photo}
                    onError={(event) => {
                      const anchor = event.currentTarget.closest("a");
                      if (anchor instanceof HTMLElement) anchor.style.display = "none";
                    }}
                  />
                </a>
              ))}
            </div>
          </section>
        ) : null}

        <section className="vf-two-grid" style={styles.twoGrid}>
          <MiniList title="Routing Actions" rows={state.routing_actions || []} empty="No routing actions connected yet." />
          <MiniList title="Messages" rows={state.messages || []} empty="No message thread connected yet. Use Message Owner to start one." />
          <MiniList title="Activity" rows={state.activity || []} empty="No activity events connected yet." />
          <MiniList title="Alerts" rows={state.alerts || []} empty="No alerts connected yet." />
        </section>

        {isOwner ? (
          <section style={styles.ownerControls}>
            <p style={styles.eyebrow}>OWNER CONTROL LAYER</p>
            <h2 style={styles.panelTitle}>Advanced routing stays controlled.</h2>
            <p style={styles.muted}>
              Owner/admin orchestration should live in routing/admin pages. This room shows enough control context without
              overwhelming the member view.
            </p>
            <div className="vf-actions" style={styles.actionRow}>
              <Link href={`/routing-room/${encodeURIComponent(signalId)}`} style={styles.secondaryAction}>Open Routing Room</Link>
              <Link href="/routing-inbox" style={styles.secondaryAction}>Routing Inbox</Link>
              <Link href="/introductions" style={styles.secondaryAction}>Introductions</Link>
              <Link href="/admin" style={styles.secondaryAction}>Admin Control</Link>
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 30%), radial-gradient(circle at bottom right, rgba(148,163,184,.12), transparent 32%), linear-gradient(180deg,#020303,#07090d 48%,#020303)",
    color: "white",
    padding: "22px 16px 80px",
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  shell: { width: "min(1220px,100%)", margin: "0 auto" },
  topNav: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 16 },
  brand: { color: "#f8e7b0", textDecoration: "none", fontWeight: 950, letterSpacing: ".12em", textTransform: "uppercase" },
  navLinks: { display: "flex", gap: 9, flexWrap: "wrap" },
  navLink: { color: "#e5e7eb", textDecoration: "none", border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.045)", borderRadius: 999, padding: "9px 12px", fontSize: 13, fontWeight: 800 },
  ownerLink: { color: "#101010", textDecoration: "none", border: "1px solid rgba(232,196,107,.75)", background: "linear-gradient(135deg,#f8e7b0,#e8c46b)", borderRadius: 999, padding: "9px 12px", fontSize: 13, fontWeight: 950 },
  tickerWrap: { overflow: "hidden", border: "1px solid rgba(232,196,107,.18)", borderRadius: 999, background: "rgba(232,196,107,.055)", marginBottom: 16, whiteSpace: "nowrap" },
  tickerTrack: { display: "inline-flex", gap: 28, padding: "10px 0", minWidth: "max-content" },
  tickerItem: { color: "#f8e7b0", fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 900 },
  hero: { display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(280px,360px)", gap: 18, border: "1px solid rgba(232,196,107,.3)", borderRadius: 30, padding: 24, background: "linear-gradient(135deg,rgba(255,255,255,.075),rgba(255,255,255,.028))", boxShadow: "0 28px 90px rgba(0,0,0,.38)", marginBottom: 16 },
  eyebrow: { color: "#e8c46b", fontSize: 12, letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 950, margin: "0 0 10px" },
  title: { fontSize: "clamp(42px,8vw,86px)", lineHeight: .88, margin: 0, letterSpacing: "-.06em" },
  subtitle: { color: "#cbd5e1", fontSize: 18, lineHeight: 1.55, maxWidth: 820, margin: "16px 0 0" },
  chipRow: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 },
  chip: { color: "#e5e7eb", border: "1px solid rgba(255,255,255,.14)", background: "rgba(255,255,255,.055)", borderRadius: 999, padding: "8px 10px", fontSize: 12, fontWeight: 850 },
  goldChip: { color: "#111", border: "1px solid rgba(232,196,107,.55)", background: "linear-gradient(135deg,#f8e7b0,#e8c46b)", borderRadius: 999, padding: "8px 10px", fontSize: 12, fontWeight: 950 },
  actionRow: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 },
  primaryAction: { color: "#101010", textDecoration: "none", borderRadius: 15, padding: "12px 15px", fontWeight: 950, background: "linear-gradient(135deg,#f8e7b0,#e8c46b)" },
  secondaryAction: { color: "#fff", textDecoration: "none", borderRadius: 15, padding: "12px 15px", fontWeight: 850, border: "1px solid rgba(255,255,255,.14)", background: "rgba(255,255,255,.055)" },
  ghostButton: { color: "#fff", borderRadius: 15, padding: "12px 15px", fontWeight: 850, border: "1px solid rgba(255,255,255,.14)", background: "rgba(255,255,255,.055)", cursor: "pointer" },
  ownerCard: { border: "1px solid rgba(232,196,107,.2)", borderRadius: 24, padding: 18, background: "rgba(0,0,0,.32)", display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" },
  cardLabel: { color: "#94a3b8", fontSize: 11, letterSpacing: ".13em", textTransform: "uppercase", fontWeight: 900 },
  ownerEmail: { color: "#fff", fontSize: 15, wordBreak: "break-word" },
  rolePill: { color: "#f8e7b0", fontWeight: 900, fontSize: 13 },
  ownerDivider: { height: 1, background: "rgba(255,255,255,.12)", margin: "8px 0" },
  mutedSmall: { color: "#94a3b8", lineHeight: 1.45 },
  errorBox: { marginTop: 14, border: "1px solid rgba(239,68,68,.35)", background: "rgba(127,29,29,.22)", color: "#fee2e2", borderRadius: 16, padding: 14, display: "flex", flexDirection: "column", gap: 6 },
  barsGrid: { display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: 12, marginBottom: 16 },
  signalBarCard: { border: "1px solid rgba(255,255,255,.12)", borderRadius: 20, padding: 14, background: "rgba(255,255,255,.045)" },
  signalBarTop: { display: "flex", justifyContent: "space-between", gap: 8, color: "#e5e7eb", fontSize: 12, fontWeight: 900, marginBottom: 10 },
  barRail: { height: 8, borderRadius: 999, background: "rgba(255,255,255,.09)", overflow: "hidden", marginBottom: 8 },
  barFill: { height: "100%", borderRadius: 999 },
  twoGrid: { display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 16, marginBottom: 16 },
  panel: { border: "1px solid rgba(255,255,255,.12)", borderRadius: 24, padding: 20, background: "linear-gradient(180deg,rgba(255,255,255,.065),rgba(255,255,255,.028))", boxShadow: "0 20px 70px rgba(0,0,0,.25)" },
  panelWide: { border: "1px solid rgba(255,255,255,.12)", borderRadius: 24, padding: 20, background: "linear-gradient(180deg,rgba(255,255,255,.065),rgba(255,255,255,.028))", boxShadow: "0 20px 70px rgba(0,0,0,.25)", marginBottom: 16 },
  panelTitle: { margin: "0 0 14px", fontSize: 28, letterSpacing: "-.03em" },
  muted: { color: "#cbd5e1", lineHeight: 1.55 },
  detailGrid: { display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 12 },
  listStack: { display: "grid", gap: 10 },
  listItem: { border: "1px solid rgba(255,255,255,.1)", borderRadius: 16, padding: 13, background: "rgba(0,0,0,.2)", display: "flex", flexDirection: "column", gap: 6, color: "#cbd5e1" },
  photoGrid: { display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12 },
  photoLink: { display: "block", borderRadius: 18, overflow: "hidden", border: "1px solid rgba(232,196,107,.22)", background: "rgba(0,0,0,.25)", minHeight: 180 },
  photo: { width: "100%", height: 210, objectFit: "cover", display: "block" },
  ownerControls: { border: "1px solid rgba(232,196,107,.2)", borderRadius: 24, padding: 20, background: "rgba(232,196,107,.055)" },
};