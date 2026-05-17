import Link from "next/link";
import { roomPath, type VaultForgeRoomKind, type VaultForgeRoomRecord } from "./vaultforgeRoomHydration";

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 30%), linear-gradient(180deg,#020814,#071326 52%,#020814)",
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

function clean(value: unknown) {
  return String(value || "").trim();
}

function fallbackRoom(kind: VaultForgeRoomKind, id: string): VaultForgeRoomRecord {
  return {
    id: clean(id) || "missing-room-id",
    kind,
    source_table: "not-found",
    title: "Room data not found",
    subtitle: "The room shell opened, but the database payload did not resolve.",
    city: "",
    county: "",
    state: "",
    address: "",
    asset_type: "",
    strategy: "",
    urgency: "Review",
    status: "needs-data",
    summary: "VaultForge opened the correct room route, but the id did not match a live deal, pain, signal, routing, or alert row. Go back to the lane and open a card that was created from real saved data.",
    notes: "",
    ai_summary: "",
    ai_best_fit: "",
    ai_next_steps: [],
    route_reason: "",
    fit_score: "",
    asking: "",
    arv: "",
    repairs: "",
    capital_needed: "",
    photos: [],
    raw: {},
  };
}

function displayValue(value: string, fallback = "Not listed") {
  const text = clean(value);
  return text || fallback;
}

export function VaultForgeRoomPage({ room, kind, id }: { room: VaultForgeRoomRecord | null; kind: VaultForgeRoomKind; id: string }) {
  const display = room || fallbackRoom(kind, id);

  return (
    <main style={page}>
      <div style={wrap}>
        <section style={card}>
          <div style={eyebrow}>VaultForge {kindLabel(display.kind)} Execution Room</div>
          <h1 style={{ fontSize: "clamp(42px,9vw,84px)", lineHeight: 0.88, letterSpacing: "-.06em", margin: "12px 0 18px" }}>{display.title}</h1>
          <p style={{ ...muted, fontSize: 20, maxWidth: 980 }}>{display.summary}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 22 }}>
            <Link href={backPath(display.kind)} style={pill}>Back To Lane</Link>
            <Link href="/projects" style={pill}>Projects</Link>
            <Link href="/dashboard" style={pill}>Command</Link>
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>5S Room Controls</div>
          <p style={muted}>Save what matters. Archive what is done. Delete/hide what should leave active workflow. These controls keep the command center from turning into clutter.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <button type="button" style={pill}>Save Room</button>
            <button type="button" style={pill}>Archive Room</button>
            <button type="button" style={{ ...pill, color: "#fecaca", borderColor: "rgba(248,113,113,.35)" }}>Delete / Hide Room</button>
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
          <div style={eyebrow}>{kindLabel(display.kind)} Intelligence Brief</div>
          <h2 style={{ fontSize: "clamp(32px,7vw,58px)", lineHeight: 0.95, letterSpacing: "-.05em", margin: "10px 0 16px" }}>Project payload restored.</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>
            <div style={softCard}>
              <h3 style={{ margin: "0 0 10px", fontSize: 24 }}>Room Summary</h3>
              <p style={muted}>{display.ai_summary || display.notes || display.summary}</p>
            </div>
            <div style={softCard}>
              <h3 style={{ margin: "0 0 10px", fontSize: 24 }}>AI Best Fit</h3>
              <p style={muted}>{display.ai_best_fit || display.route_reason || "Best-fit routing will appear here when the saved row includes match or routing intelligence."}</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10, marginTop: 16 }}>
            <Metric label="Market" value={display.subtitle || "Not listed"} />
            <Metric label="Asset" value={display.asset_type || "Not listed"} />
            <Metric label="Strategy" value={display.strategy || "Not listed"} />
            <Metric label="Urgency" value={display.urgency || "Review"} />
            <Metric label="Asking" value={display.asking || "Not listed"} />
            <Metric label="ARV / Value" value={display.arv || "Not listed"} />
            <Metric label="Repairs / Work" value={display.repairs || "Not listed"} />
            <Metric label="Capital Need" value={display.capital_needed || "Not listed"} />
            <Metric label="Fit Score" value={display.fit_score || "Not listed"} />
          </div>

          {display.ai_next_steps.length ? (
            <div style={{ ...softCard, marginTop: 16 }}>
              <h3 style={{ margin: "0 0 10px", fontSize: 24 }}>AI Next Moves</h3>
              <ol style={{ margin: 0, paddingLeft: 22, color: "#cbd5e1", lineHeight: 1.7 }}>
                {display.ai_next_steps.map((step) => <li key={step}>{step}</li>)}
              </ol>
            </div>
          ) : null}

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
    <div style={{ border: "1px solid rgba(148,163,184,.16)", background: "rgba(2,6,23,.38)", borderRadius: 16, padding: 12 }}>
      <div style={{ color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: ".12em", fontWeight: 900 }}>{label}</div>
      <div style={{ color: "white", fontSize: 16, fontWeight: 900, marginTop: 4, overflowWrap: "anywhere" }}>{displayValue(value)}</div>
    </div>
  );
}

export function VaultForgeRoomListPage({ title, subtitle, kind, rooms }: { title: string; subtitle: string; kind: VaultForgeRoomKind; rooms: VaultForgeRoomRecord[] }) {
  return (
    <main style={page}>
      <div style={wrap}>
        <section style={card}>
          <div style={eyebrow}>VaultForge Private Intelligence Network</div>
          <h1 style={{ fontSize: "clamp(50px,10vw,96px)", lineHeight: 0.88, letterSpacing: "-.06em", margin: "12px 0 18px" }}>{title}</h1>
          <p style={{ ...muted, fontSize: 20 }}>{subtitle}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 20 }}>
            <Link href="/dashboard" style={pill}>Command</Link>
            <Link href="/opportunity-rooms" style={pill}>Opportunity</Link>
            <Link href="/pressure-rooms" style={pill}>Pressure</Link>
            <Link href="/routing-inbox" style={pill}>Routing</Link>
            <Link href="/alerts" style={pill}>Alerts</Link>
            <Link href="/intelligence" style={pill}>Intelligence</Link>
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>{kindLabel(kind)} Cards</div>
          <h2 style={{ fontSize: "clamp(34px,7vw,62px)", lineHeight: 0.95, letterSpacing: "-.05em", margin: "10px 0 16px" }}>{rooms.length ? "Live rooms restored." : "No live rooms resolved yet."}</h2>
          {!rooms.length ? <p style={muted}>No records resolved from the current database/API aliases yet. This page is ready; it needs saved deal, pain, signal, routing, or alert rows.</p> : null}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(270px,1fr))", gap: 14 }}>
            {rooms.map((room) => (
              <article key={`${room.kind}:${room.id}:${room.title}`} style={softCard}>
                <div style={eyebrow}>{kindLabel(room.kind)}</div>
                <h3 style={{ fontSize: 26, lineHeight: 1, margin: "10px 0", overflowWrap: "anywhere" }}>{room.title}</h3>
                <p style={muted}>{room.subtitle}</p>
                <p style={{ ...muted, fontSize: 14 }}>{room.summary.slice(0, 260)}</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8, marginTop: 12 }}>
                  <Metric label="Asset" value={room.asset_type || "Not listed"} />
                  <Metric label="Urgency" value={room.urgency || "Review"} />
                </div>
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
