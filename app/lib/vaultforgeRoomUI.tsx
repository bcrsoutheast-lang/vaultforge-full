import Link from "next/link";
import { roomPath, type VaultForgeRoomRecord, type VaultForgeRoomKind } from "./vaultforgeRoomHydration";

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "radial-gradient(circle at top left, rgba(232,196,107,.12), transparent 30%), linear-gradient(180deg,#020814,#071326 52%,#020814)",
  color: "white",
  padding: "24px 16px 90px",
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1180, margin: "0 auto", display: "grid", gap: 18 };
const card: React.CSSProperties = { border: "1px solid rgba(232,196,107,.22)", background: "linear-gradient(135deg,rgba(18,24,42,.96),rgba(8,19,35,.96))", borderRadius: 24, padding: 24, boxShadow: "0 24px 70px rgba(0,0,0,.28)" };
const softCard: React.CSSProperties = { border: "1px solid rgba(148,163,184,.18)", background: "rgba(15,23,42,.78)", borderRadius: 22, padding: 18 };
const eyebrow: React.CSSProperties = { color: "#f4d477", textTransform: "uppercase", letterSpacing: ".18em", fontWeight: 900, fontSize: 13 };
const muted: React.CSSProperties = { color: "#cbd5e1", lineHeight: 1.55 };
const pill: React.CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(148,163,184,.24)", background: "rgba(255,255,255,.06)", borderRadius: 999, padding: "11px 14px", color: "white", textDecoration: "none", fontWeight: 900, fontSize: 14 };
const goldPill: React.CSSProperties = { ...pill, background: "linear-gradient(135deg,#fde68a,#e8c46b)", color: "#111827", border: "0" };

function kindLabel(kind: VaultForgeRoomKind) {
  if (kind === "pressure") return "Pressure Room";
  if (kind === "routing") return "Routing Room";
  if (kind === "signal") return "Signal Room";
  if (kind === "alert") return "Alert Trigger";
  return "Opportunity Room";
}

function backPath(kind: VaultForgeRoomKind) {
  if (kind === "pressure") return "/pressure-rooms";
  if (kind === "routing") return "/routing-inbox";
  if (kind === "signal") return "/intelligence";
  if (kind === "alert") return "/alerts";
  return "/opportunity-rooms";
}

export function VaultForgeRoomPage({ room, kind, id }: { room: VaultForgeRoomRecord | null; kind: VaultForgeRoomKind; id: string }) {
  const display = room || {
    id: id || "missing-id",
    kind,
    source_table: "not-found",
    title: "Room data not found",
    subtitle: "VaultForge could not hydrate this room from current API/database aliases.",
    city: "",
    county: "",
    state: "",
    address: "",
    asset_type: "",
    strategy: "",
    urgency: "Review",
    status: "needs-data",
    summary: "The room shell is working, but the project/pain/signal payload did not resolve. Open the lane that created this room and confirm the button passes the real database id, not a generic slug like pain-feed or routing-inbox.",
    notes: "",
    ai_summary: "",
    route_reason: "",
    fit_score: "",
    asking: "",
    arv: "",
    repairs: "",
    capital_needed: "",
    photos: [],
    raw: {},
  } as VaultForgeRoomRecord;

  const title = `${kindLabel(display.kind)}: ${display.title}`;

  return (
    <main style={page}>
      <div style={wrap}>
        <section style={card}>
          <div style={eyebrow}>VaultForge {kindLabel(display.kind)} Execution Room</div>
          <h1 style={{ fontSize: "clamp(44px,9vw,86px)", lineHeight: .88, letterSpacing: "-.06em", margin: "12px 0 18px" }}>{title}</h1>
          <p style={{ ...muted, fontSize: 20, maxWidth: 980 }}>{display.summary}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 22 }}>
            <Link href={backPath(display.kind)} style={pill}>Back To Lane</Link>
            <Link href="/projects" style={pill}>Projects</Link>
            <Link href="/dashboard" style={pill}>Command</Link>
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>5S Room Controls</div>
          <p style={muted}>Save what matters. Archive what is done. Delete/hide what should leave active workflow.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <button style={pill}>Save Room</button>
            <button style={pill}>Archive Room</button>
            <button style={{ ...pill, color: "#fecaca", borderColor: "rgba(248,113,113,.35)" }}>Delete / Hide Room</button>
            <Link href={`/message-command/${encodeURIComponent(display.kind + ":" + display.id)}`} style={goldPill}>Internal Thread</Link>
            <Link href="/saved-rooms" style={pill}>Saved Folder</Link>
            <Link href="/archived-rooms" style={pill}>Archived Folder</Link>
            <Link href="/deleted-rooms" style={pill}>Deleted Folder</Link>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
            <span style={{ ...pill, color: "#86efac", padding: "7px 10px", fontSize: 12 }}>{kindLabel(display.kind)}</span>
            <span style={{ ...pill, color: "#86efac", padding: "7px 10px", fontSize: 12 }}>Status: {display.status}</span>
            <span style={{ ...pill, color: "#86efac", padding: "7px 10px", fontSize: 12 }}>Room: {display.id}</span>
            <span style={{ ...pill, color: "#93c5fd", padding: "7px 10px", fontSize: 12 }}>Source: {display.source_table}</span>
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>{kindLabel(display.kind)} Data Restored</div>
          <h2 style={{ fontSize: "clamp(32px,7vw,58px)", lineHeight: .95, letterSpacing: "-.05em", margin: "10px 0 16px" }}>Project payload.</h2>
          <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: 14 }}>
            <div style={softCard}>
              <h3 style={{ margin: "0 0 10px", fontSize: 24 }}>{display.title}</h3>
              <p style={muted}>{display.notes || display.ai_summary || display.summary}</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, marginTop: 16 }}>
                <Metric label="Market" value={display.subtitle || "Not listed"} />
                <Metric label="Asset" value={display.asset_type || "Not listed"} />
                <Metric label="Strategy" value={display.strategy || "Not listed"} />
                <Metric label="Urgency" value={display.urgency || "Review"} />
              </div>
            </div>
            <div style={softCard}>
              <Metric label="Asking" value={display.asking || "Not listed"} />
              <Metric label="ARV / Value" value={display.arv || "Not listed"} />
              <Metric label="Repairs / Work" value={display.repairs || "Not listed"} />
              <Metric label="Capital Need" value={display.capital_needed || "Not listed"} />
            </div>
          </div>

          {display.photos.length ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginTop: 16 }}>
              {display.photos.map((src, index) => (
                <img key={src + index} src={src} alt={`${display.title} photo ${index + 1}`} style={{ width: "100%", height: 190, objectFit: "cover", borderRadius: 18, border: "1px solid rgba(148,163,184,.18)" }} />
              ))}
            </div>
          ) : (
            <div style={{ ...softCard, marginTop: 16, color: "#cbd5e1" }}>No photos resolved for this room yet.</div>
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: "1px solid rgba(148,163,184,.16)", background: "rgba(2,6,23,.38)", borderRadius: 16, padding: 12, marginBottom: 10 }}>
      <div style={{ color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: ".12em", fontWeight: 900 }}>{label}</div>
      <div style={{ color: "white", fontSize: 16, fontWeight: 900, marginTop: 4 }}>{value}</div>
    </div>
  );
}

export function VaultForgeRoomListPage({ title, subtitle, kind, rooms }: { title: string; subtitle: string; kind: VaultForgeRoomKind; rooms: VaultForgeRoomRecord[] }) {
  return (
    <main style={page}>
      <div style={wrap}>
        <section style={card}>
          <div style={eyebrow}>VaultForge Private Intelligence Network</div>
          <h1 style={{ fontSize: "clamp(50px,10vw,96px)", lineHeight: .88, letterSpacing: "-.06em", margin: "12px 0 18px" }}>{title}</h1>
          <p style={{ ...muted, fontSize: 20 }}>{subtitle}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 20 }}>
            <Link href="/dashboard" style={pill}>Command</Link>
            <Link href="/opportunity-rooms" style={pill}>Opportunity</Link>
            <Link href="/pressure-rooms" style={pill}>Pressure</Link>
            <Link href="/routing-inbox" style={pill}>Routing</Link>
            <Link href="/alerts" style={pill}>Alerts</Link>
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>{kindLabel(kind)} Cards</div>
          <h2 style={{ fontSize: "clamp(34px,7vw,62px)", lineHeight: .95, letterSpacing: "-.05em", margin: "10px 0 16px" }}>{rooms.length ? "Live rooms restored." : "No live rooms resolved yet."}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>
            {rooms.map((room) => (
              <article key={`${room.kind}:${room.id}:${room.title}`} style={softCard}>
                <div style={eyebrow}>{kindLabel(room.kind)}</div>
                <h3 style={{ fontSize: 26, lineHeight: 1, margin: "10px 0" }}>{room.title}</h3>
                <p style={muted}>{room.subtitle}</p>
                <p style={{ ...muted, fontSize: 14 }}>{room.summary.slice(0, 220)}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
                  <Link href={roomPath(room)} style={goldPill}>Open Correct Room</Link>
                  <Link href={`/message-command/${encodeURIComponent(room.kind + ":" + room.id)}`} style={pill}>Thread</Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
