"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import VaultForgeMemberNav from "../../components/VaultForgeMemberNav";
import {
  VaultForgePulseStrip,
  VaultForgeSignalBar,
  VaultForgeCommandFooter,
  VaultForgeSignalMeter,
} from "../../components/VaultForgeVisualLayer";

type AnyRow = Record<string, any>;

type PageProps = {
  params: Promise<{ signalId: string }> | { signalId: string };
};

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

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

function getEmail() {
  if (typeof window === "undefined") return "";

  const url = new URL(window.location.href);
  const urlEmail = cleanEmail(url.searchParams.get("email"));
  if (urlEmail.includes("@")) return urlEmail;

  const keys = ["vf_email", "vf_member_email", "vf_admin_email", "email", "memberEmail"];

  for (const key of keys) {
    const value = cleanEmail(window.localStorage.getItem(key) || window.sessionStorage.getItem(key));
    if (value.includes("@")) return value;
  }

  return cleanEmail(readCookie("vf_email") || readCookie("vf_member_email") || readCookie("vf_admin_email"));
}

function isOwnerSession(email: string) {
  return email === OWNER_EMAIL || readCookie("vf_admin") === "1" || readCookie("isAdmin") === "true";
}

function fmtDate(value: unknown) {
  const date = new Date(String(value || ""));
  if (Number.isNaN(date.getTime())) return "Recent";
  return date.toLocaleString();
}

function titleOf(signal: AnyRow) {
  return first(signal.title, signal.signal_title, signal.headline, signal.name, "VaultForge Signal");
}

function noteOf(signal: AnyRow) {
  return first(
    signal.note,
    signal.notes,
    signal.summary,
    signal.description,
    signal.message,
    signal.route_summary,
    "Exact signal context and routing intelligence."
  );
}

function ownerEmailOf(signal: AnyRow) {
  return cleanEmail(
    first(
      signal.owner_email,
      signal.created_by_email,
      signal.submitted_by_email,
      signal.creator_email,
      signal.submitted_by,
      signal.user_email,
      signal.member_email,
      signal.email,
      OWNER_EMAIL
    )
  );
}

function priorityOf(signal: AnyRow) {
  return first(signal.priority, signal.urgency, signal.urgency_level, "medium").toLowerCase();
}

function marketOf(signal: AnyRow) {
  return first(signal.market, [signal.city, signal.state].filter(Boolean).join(", "), signal.location, signal.address, "Market pending");
}

function assetTypeOf(signal: AnyRow) {
  return first(signal.asset_type, signal.property_type, signal.item_kind, "Asset review");
}

function strategyOf(signal: AnyRow) {
  return first(signal.strategy, signal.asset_strategy, signal.exit_strategy, signal.status, "Review");
}

function itemIdOf(signal: AnyRow, fallback: string) {
  return first(signal.item_id, signal.project_id, signal.deal_id, signal.property_id, signal.pain_id, signal.id, fallback);
}

function scoreTone(score: number) {
  if (score >= 78) return "red";
  if (score >= 62) return "gold";
  return "silver";
}

function safeArray(value: unknown): AnyRow[] {
  return Array.isArray(value) ? value : [];
}

function photosOf(signal: AnyRow) {
  const rawPhotos = safeArray(signal.photos);
  const rawUrls = Array.isArray(signal.photo_urls) ? signal.photo_urls : [];

  const urls = [
    signal.image_url,
    signal.photo_url,
    signal.primary_photo_url,
    ...rawUrls,
    ...rawPhotos.map((photo) => photo?.url || photo?.publicUrl || photo?.public_url || photo?.data_url || photo?.dataUrl),
  ]
    .map(clean)
    .filter(Boolean);

  return Array.from(new Set(urls));
}

function aiAnalysis(signal: AnyRow, score: number, counts: AnyRow) {
  const priority = priorityOf(signal);
  const asset = assetTypeOf(signal).toLowerCase();
  const note = noteOf(signal).toLowerCase();
  const market = marketOf(signal);
  const owner = ownerEmailOf(signal);

  const strategy: string[] = [];
  const risks: string[] = [];
  const next: string[] = [];

  if (priority.includes("urgent") || score >= 80) {
    strategy.push("Treat this as high-pressure execution. Push it into routing review and owner follow-up fast.");
    risks.push("Timing pressure is elevated. Delays may reduce deal quality or member response speed.");
  } else if (priority.includes("high") || score >= 65) {
    strategy.push("Good candidate for routed member review. Prioritize matching by market, asset type, and stated need.");
  } else {
    strategy.push("Hold in review lane until routing fit, owner details, or stronger execution need is confirmed.");
  }

  if (note.includes("capital") || note.includes("funding") || note.includes("loan") || note.includes("lender")) {
    strategy.push("Capital lane detected. Route to lenders/private capital/JV members before general buyers.");
    next.push("Ask owner for capital stack, payoff, timeline, target terms, and collateral details.");
  }

  if (note.includes("buyer") || note.includes("sell") || note.includes("disposition")) {
    strategy.push("Buyer/disposition lane detected. Match with buyers active in the same state and asset class.");
    next.push("Collect asking price, ARV/value, repairs, photos, address confidence, and access notes.");
  }

  if (note.includes("operator") || note.includes("contractor") || note.includes("permit") || note.includes("stuck")) {
    strategy.push("Execution/operator lane detected. Route to operators, contractors, local partners, or boots-on-ground members.");
    risks.push("Execution blockers may require site verification before routing to capital or buyers.");
  }

  if (asset.includes("land")) {
    next.push("Check zoning, utilities, road access, entitlement path, builder demand, and exit strategy.");
  }

  if (asset.includes("residential")) {
    next.push("Verify photos, repairs, occupancy, access, comps, and buyer profile.");
  }

  if (!owner || owner === OWNER_EMAIL) {
    risks.push("Owner fallback detected. Confirm owner_email is populated before routing outside admin review.");
  } else {
    next.push(`Owner detected: ${owner}. Message/intro actions should route to this owner.`);
  }

  if (!market || market === "Market pending") {
    risks.push("Market is incomplete. Routing quality improves once city/state are confirmed.");
  }

  if (!counts?.routing_actions) {
    next.push("Generate or review routing action so this signal enters the routing queue.");
  }

  if (!counts?.messages) {
    next.push("Use Message Owner to start the controlled conversation thread.");
  }

  return {
    strategy: strategy.length ? strategy : ["Review signal details, confirm owner, and route based on market fit."],
    risks: risks.length ? risks : ["No major risk flags detected from current fields. Continue verification."],
    next: next.length ? next : ["Open routing, message owner, and confirm execution details."],
  };
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

const shell: React.CSSProperties = {
  width: "min(1180px,100%)",
  margin: "0 auto",
};

const hero: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.28)",
  borderRadius: 30,
  padding: 24,
  background: "linear-gradient(135deg,rgba(255,255,255,.075),rgba(255,255,255,.026))",
  boxShadow: "0 28px 90px rgba(0,0,0,.38)",
  marginBottom: 16,
};

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.18)",
  borderRadius: 24,
  padding: 20,
  background: "linear-gradient(180deg,rgba(255,255,255,.065),rgba(255,255,255,.026))",
  boxShadow: "0 20px 70px rgba(0,0,0,.25)",
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

const smallEyebrow: React.CSSProperties = {
  color: "#e8c46b",
  fontSize: 11,
  letterSpacing: ".16em",
  textTransform: "uppercase",
  fontWeight: 950,
  margin: "0 0 8px",
};

const title: React.CSSProperties = {
  fontSize: "clamp(44px,8vw,92px)",
  lineHeight: 0.88,
  margin: 0,
  letterSpacing: "-.06em",
};

const muted: React.CSSProperties = {
  color: "#cbd5e1",
  lineHeight: 1.55,
};

const chip: React.CSSProperties = {
  display: "inline-flex",
  border: "1px solid rgba(255,255,255,.14)",
  color: "#e5e7eb",
  background: "rgba(255,255,255,.055)",
  borderRadius: 999,
  padding: "8px 11px",
  fontWeight: 850,
  fontSize: 12,
  margin: "0 7px 7px 0",
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

const workstationLink: React.CSSProperties = {
  display: "block",
  color: "white",
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,.12)",
  background: "rgba(255,255,255,.04)",
  borderRadius: 20,
  padding: 16,
};

function DataList({ title, rows, empty, hrefBase }: { title: string; rows: AnyRow[]; empty: string; hrefBase: string }) {
  return (
    <section style={card}>
      <p style={eyebrow}>{title}</p>
      {rows.length ? (
        <div style={{ display: "grid", gap: 10 }}>
          {rows.slice(0, 8).map((row, index) => {
            const id = first(row.id, row.event_id, row.thread_id, row.item_id, row.signal_id, index);
            const label = first(row.title, row.subject, row.action_type, row.event_type, row.status, title);
            const note = first(row.description, row.body, row.message, row.note, row.summary, row.route_context, row.created_at);

            return (
              <Link key={`${title}-${id}-${index}`} href={`${hrefBase}${encodeURIComponent(String(id))}`} style={workstationLink}>
                <strong>{label}</strong>
                <p style={{ ...muted, margin: "6px 0 0" }}>{note || "Open workstation detail."}</p>
              </Link>
            );
          })}
        </div>
      ) : (
        <p style={{ ...muted, fontSize: 18 }}>{empty}</p>
      )}
    </section>
  );
}

export default function SignalRoomPage({ params }: PageProps) {
  const [signalId, setSignalId] = useState("");
  const [email, setEmail] = useState("");
  const [signal, setSignal] = useState<AnyRow | null>(null);
  const [routingActions, setRoutingActions] = useState<AnyRow[]>([]);
  const [messages, setMessages] = useState<AnyRow[]>([]);
  const [activity, setActivity] = useState<AnyRow[]>([]);
  const [alerts, setAlerts] = useState<AnyRow[]>([]);
  const [counts, setCounts] = useState<AnyRow>({});
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState("Loading signal room...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.resolve(params as any).then((resolved) => setSignalId(String(resolved?.signalId || "")));
  }, [params]);

  async function load(activeSignalId = signalId) {
    if (!activeSignalId) return;

    setLoading(true);
    setStatus("Loading signal room...");

    const activeEmail = getEmail();
    const owner = isOwnerSession(activeEmail);
    setEmail(activeEmail);

    try {
      const query = new URLSearchParams();
      query.set("email", activeEmail);
      if (owner) query.set("owner", "1");

      const res = await fetch(`/api/signals/${encodeURIComponent(activeSignalId)}?${query.toString()}`, {
        cache: "no-store",
        headers: {
          "x-vf-email": activeEmail,
          "x-vf-admin": owner ? "1" : "0",
        },
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || json?.details || "Could not load signal.");
      }

      setSignal(json.signal || null);
      setRoutingActions(safeArray(json.routing_actions));
      setMessages(safeArray(json.messages));
      setActivity(safeArray(json.activity));
      setAlerts(safeArray(json.alerts));
      setCounts(json.counts || {});
      setScore(Number(json.score || 0));
      setStatus("");
    } catch (error: any) {
      setSignal(null);
      setStatus(error?.message || "Could not load signal room.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (signalId) load(signalId);
  }, [signalId]);

  const safeSignal = signal || {};
  const ownerEmail = ownerEmailOf(safeSignal);
  const itemId = itemIdOf(safeSignal, signalId);
  const photos = photosOf(safeSignal);
  const ai = aiAnalysis(safeSignal, score, counts);
  const messageHref = `/messages/new?recipient=${encodeURIComponent(ownerEmail)}&to=${encodeURIComponent(ownerEmail)}&owner_email=${encodeURIComponent(ownerEmail)}&signal_id=${encodeURIComponent(signalId)}&item_id=${encodeURIComponent(itemId)}&subject=${encodeURIComponent(`Signal follow-up: ${titleOf(safeSignal)}`)}`;
  const routingHref = `/routing-room/${encodeURIComponent(signalId)}`;
  const painHref = itemId ? `/pain-room/${encodeURIComponent(itemId)}` : "/pain-feed";
  const activityHref = `/activity/signal/${encodeURIComponent(signalId)}`;

  const signalPriority = priorityOf(safeSignal);
  const urgent = signalPriority.includes("urgent") || score >= 80 ? 1 : 0;
  const high = signalPriority.includes("high") || score >= 65 ? 1 : 0;
  const normal = urgent || high ? 0 : 1;

  return (
    <main style={page}>
      <style>{`
        a:hover,
        button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        @media (max-width: 820px) {
          .vf-two-grid,
          .vf-three-grid,
          .vf-actions {
            grid-template-columns: 1fr !important;
          }

          .vf-actions {
            display: grid !important;
            gap: 10px !important;
          }

          .vf-actions > * {
            width: 100%;
            box-sizing: border-box;
            justify-content: center;
          }
        }
      `}</style>

      <section style={shell}>
        <VaultForgeMemberNav title="Signal Room" subtitle="Unified signal, owner, photos, AI review, routing, messages, activity, and alerts." />

        <VaultForgePulseStrip
          items={[
            { label: "SIGNAL", value: signalId || "LOADING", tone: "gold" },
            { label: "OWNER", value: ownerEmail || "PENDING", tone: ownerEmail && ownerEmail !== OWNER_EMAIL ? "green" : "silver" },
            { label: "ROUTING", value: routingActions.length, tone: "blue" },
            { label: "MESSAGES", value: messages.length, tone: "green" },
            { label: "SCORE", value: score || "REVIEW", tone: scoreTone(score) as any },
          ]}
        />

        <VaultForgeSignalBar
          urgent={urgent}
          high={high}
          normal={normal}
          active={1}
          routed={routingActions.length}
          messages={messages.length}
        />

        <section style={hero}>
          <p style={eyebrow}>VAULTFORGE SIGNAL ROOM</p>
          <h1 style={title}>{titleOf(safeSignal)}</h1>
          <p style={{ ...muted, fontSize: 18, maxWidth: 880, marginTop: 16 }}>{noteOf(safeSignal)}</p>

          <div style={{ marginTop: 16 }}>
            <span style={chip}>Owner: {ownerEmail || "pending"}</span>
            <span style={chip}>Signal: {signalId}</span>
            <span style={chip}>Item: {itemId}</span>
            <span style={chip}>Market: {marketOf(safeSignal)}</span>
            <span style={chip}>Priority: {signalPriority}</span>
            <span style={chip}>Source: {first(safeSignal.source_table, safeSignal._source_table, "signal")}</span>
          </div>

          <div className="vf-actions" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
            <Link href={messageHref} style={primaryAction}>Message Owner</Link>
            <Link href={routingHref} style={primaryAction}>Open Routing</Link>
            <Link href="/intelligence" style={secondaryAction}>Intelligence</Link>
            <Link href="/pain-feed" style={secondaryAction}>Pain Feed</Link>
            <Link href="/messages" style={secondaryAction}>Messages</Link>
            <button type="button" onClick={() => load(signalId)} style={secondaryAction}>
              {loading ? "Refreshing..." : "Refresh Signal"}
            </button>
          </div>
        </section>

        {status ? (
          <section style={card}>
            <p style={{ ...muted, fontSize: 18 }}>{status}</p>
          </section>
        ) : null}

        <section className="vf-three-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 14, marginBottom: 16 }}>
          <VaultForgeSignalMeter label="Signal Score" value={score || 0} tone={scoreTone(score) as any} note="Rule-based score until full model layer is connected." />
          <VaultForgeSignalMeter label="Owner Confidence" value={ownerEmail && ownerEmail !== OWNER_EMAIL ? 92 : 40} tone={ownerEmail && ownerEmail !== OWNER_EMAIL ? "green" : "gold"} note={ownerEmail === OWNER_EMAIL ? "Fallback/admin owner detected." : "Canonical owner detected."} />
          <VaultForgeSignalMeter label="Execution Readiness" value={Math.min(100, 45 + routingActions.length * 12 + messages.length * 10 + photos.length * 6)} tone="gold" note="Based on photos, routing, messages, and related activity." />
        </section>

        <section style={card}>
          <p style={eyebrow}>Signal Data</p>
          <div className="vf-three-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12 }}>
            {[
              ["Owner", ownerEmail || "pending"],
              ["Market", marketOf(safeSignal)],
              ["Asset", assetTypeOf(safeSignal)],
              ["Strategy", strategyOf(safeSignal)],
              ["Created", fmtDate(safeSignal.created_at)],
              ["Source", first(safeSignal.source_table, safeSignal._source_table, "signal")],
            ].map(([label, value]) => (
              <div key={label} style={{ border: "1px solid rgba(255,255,255,.10)", borderRadius: 16, padding: 14, background: "rgba(255,255,255,.035)" }}>
                <p style={smallEyebrow}>{label}</p>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section style={card}>
          <p style={eyebrow}>AI Summary</p>
          <p style={{ ...muted, fontSize: 18 }}>
            This is rule-based AI-style strategy until the live model endpoint is connected. It now uses the signal fields, owner, priority, asset type, score, photos, messages, and routing state.
          </p>

          <div className="vf-three-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12, marginTop: 16 }}>
            <div style={workstationLink}>
              <p style={smallEyebrow}>Strategy</p>
              {ai.strategy.map((item) => <p key={item} style={muted}>• {item}</p>)}
            </div>
            <div style={workstationLink}>
              <p style={smallEyebrow}>Risk / Gaps</p>
              {ai.risks.map((item) => <p key={item} style={muted}>• {item}</p>)}
            </div>
            <div style={workstationLink}>
              <p style={smallEyebrow}>Next Actions</p>
              {ai.next.map((item) => <p key={item} style={muted}>• {item}</p>)}
            </div>
          </div>
        </section>

        <section style={card}>
          <p style={eyebrow}>Photos / Asset Context</p>
          {photos.length ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
              {photos.map((photo, index) => (
                <a key={`${photo}-${index}`} href={photo} target="_blank" rel="noreferrer" style={{ display: "block", borderRadius: 18, overflow: "hidden", border: "1px solid rgba(232,196,107,.22)", background: "rgba(0,0,0,.35)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo}
                    alt={`VaultForge signal asset ${index + 1}`}
                    style={{ display: "block", width: "100%", height: 220, objectFit: "cover" }}
                    onError={(event) => {
                      const target = event.currentTarget;
                      target.style.display = "none";
                    }}
                  />
                </a>
              ))}
            </div>
          ) : (
            <p style={{ ...muted, fontSize: 18 }}>No photos connected yet.</p>
          )}
        </section>

        <section className="vf-two-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 16 }}>
          <Link href={routingHref} style={workstationLink}>
            <p style={eyebrow}>Routing Actions</p>
            <h2>Open Routing Workstation →</h2>
            <p style={muted}>
              {routingActions.length ? `${routingActions.length} routing actions connected.` : "No routing actions connected yet. Open routing to generate/review paths."}
            </p>
          </Link>

          <Link href="/messages" style={workstationLink}>
            <p style={eyebrow}>Messages</p>
            <h2>Open Message Threads →</h2>
            <p style={muted}>
              {messages.length ? `${messages.length} messages connected.` : "No message thread connected yet. Use Message Owner to start one."}
            </p>
          </Link>

          <Link href={activityHref} style={workstationLink}>
            <p style={eyebrow}>Activity</p>
            <h2>Open Activity Workstation →</h2>
            <p style={muted}>
              {activity.length ? `${activity.length} activity events connected.` : "No activity events connected yet."}
            </p>
          </Link>

          <Link href="/alerts" style={workstationLink}>
            <p style={eyebrow}>Alerts</p>
            <h2>Open Alert Actions →</h2>
            <p style={muted}>
              {alerts.length ? `${alerts.length} alerts connected.` : "No alerts connected yet."}
            </p>
          </Link>
        </section>

        <DataList title="Routing Preview" rows={routingActions} empty="No routing actions connected yet." hrefBase="/routing-room/" />
        <DataList title="Message Preview" rows={messages} empty="No message thread connected yet. Use Message Owner to start one." hrefBase="/messages/" />
        <DataList title="Activity Preview" rows={activity} empty="No activity events connected yet." hrefBase="/activity/signal/" />
        <DataList title="Alert Preview" rows={alerts} empty="No alerts connected yet." hrefBase="/alerts?signal=" />

        <section style={card}>
          <p style={eyebrow}>Workstation Cleanup</p>
          <div className="vf-actions" style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <button type="button" style={secondaryAction}>Save / Watch</button>
            <button type="button" style={secondaryAction}>Pin Review</button>
            <button type="button" style={secondaryAction}>Mark Reviewed</button>
            <button type="button" style={secondaryAction}>Archive View</button>
          </div>
          <p style={{ ...muted, marginTop: 12 }}>
            These are safe workstation controls for the UI layer. Permanent save/archive actions can be wired after launch-critical data flow is stable.
          </p>
        </section>

        <VaultForgeCommandFooter />
      </section>
    </main>
  );
}
