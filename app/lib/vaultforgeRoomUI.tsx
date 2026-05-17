import Link from "next/link";
import {
  roomPath,
  type VaultForgeRoomKind,
  type VaultForgeRoomRecord,
} from "./vaultforgeRoomHydration";

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.12), transparent 30%), radial-gradient(circle at top right, rgba(239,68,68,.10), transparent 24%), linear-gradient(180deg,#020814,#071326 52%,#020814)",
  color: "white",
  padding: "20px 14px 90px",
  fontFamily:
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const wrap: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
  display: "grid",
  gap: 16,
};

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.22)",
  background:
    "linear-gradient(135deg,rgba(18,24,42,.96),rgba(8,19,35,.96))",
  borderRadius: 24,
  padding: 18,
  boxShadow: "0 24px 70px rgba(0,0,0,.28)",
};

const softCard: React.CSSProperties = {
  border: "1px solid rgba(148,163,184,.18)",
  background:
    "radial-gradient(circle at top right, rgba(232,196,107,.06), transparent 26%), rgba(15,23,42,.78)",
  borderRadius: 22,
  padding: 16,
};

const eyebrow: React.CSSProperties = {
  color: "#f4d477",
  textTransform: "uppercase",
  letterSpacing: ".18em",
  fontWeight: 900,
  fontSize: 12,
};

const muted: React.CSSProperties = { color: "#cbd5e1", lineHeight: 1.55 };

const pill: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid rgba(148,163,184,.24)",
  background: "rgba(255,255,255,.06)",
  borderRadius: 999,
  padding: "9px 12px",
  color: "white",
  textDecoration: "none",
  fontWeight: 900,
  fontSize: 13,
};

const goldPill: React.CSSProperties = {
  ...pill,
  background: "linear-gradient(135deg,#fde68a,#e8c46b)",
  color: "#111827",
  border: "0",
};

function kindLabel(kind: VaultForgeRoomKind) {
  if (kind === "pressure") return "Pain Room";
  if (kind === "routing") return "Routing Layer";
  if (kind === "signal") return "Signal Layer";
  if (kind === "alert") return "Alert Layer";
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

function displayValue(value: string, fallback = "Not listed") {
  const text = clean(value);
  return text || fallback;
}

function moneyish(value: string) {
  const cleanText = clean(value);
  if (!cleanText) return "";
  if (cleanText.includes("$")) return cleanText;

  const numeric = Number(cleanText.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(numeric) || numeric <= 0) return cleanText;

  return numeric.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function compact(value: unknown, max = 135) {
  const text = clean(value).replace(/\s+/g, " ");
  if (!text) return "";
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}…`;
}

function roomPhoto(room: VaultForgeRoomRecord) {
  return room.photos?.[0] || "";
}

function roomScore(room: VaultForgeRoomRecord) {
  const raw = clean(room.fit_score);
  if (raw) return raw;
  if (room.kind === "pressure") return "88";
  return "84";
}

function roomLocation(room: VaultForgeRoomRecord) {
  return (
    [room.city, room.county, room.state].filter(Boolean).join(", ") ||
    room.subtitle ||
    "Market not listed"
  );
}

function roomValueLine(room: VaultForgeRoomRecord) {
  const asking = moneyish(room.asking);
  const arv = moneyish(room.arv);
  const repairs = moneyish(room.repairs);
  const capital = moneyish(room.capital_needed);

  if (room.kind === "pressure") {
    return capital ? `Capital need ${capital}` : "Capital need not listed";
  }

  const pieces = [];
  if (asking) pieces.push(`Ask ${asking}`);
  if (arv) pieces.push(`ARV ${arv}`);
  if (repairs) pieces.push(`Repairs ${repairs}`);

  return pieces.join(" · ") || "Economics not listed";
}

function roomAISummary(room: VaultForgeRoomRecord) {
  if (room.kind === "pressure") {
    return compact(
      room.ai_summary ||
        room.summary ||
        room.notes ||
        "Open for pressure summary, blockers, matched execution profiles, AI next steps, and routing context.",
      150
    );
  }

  return compact(
    room.ai_summary ||
      room.summary ||
      room.notes ||
      "Open for deal numbers, AI good/bad/next steps, matched profiles, alerts, and execution context.",
    150
  );
}

function roomMeta(room: VaultForgeRoomRecord) {
  return [room.asset_type, room.strategy, room.urgency, room.status]
    .map((item) => compact(item, 32))
    .filter(Boolean)
    .slice(0, 4);
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
    summary:
      "VaultForge opened the correct room route, but the id did not match a live deal, pain, signal, routing, or alert row. Go back to the lane and open a card created from real saved data.",
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid rgba(148,163,184,.16)",
        background: "rgba(2,6,23,.38)",
        borderRadius: 16,
        padding: 12,
      }}
    >
      <div
        style={{
          color: "#94a3b8",
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: ".12em",
          fontWeight: 900,
        }}
      >
        {label}
      </div>
      <div
        style={{
          color: "white",
          fontSize: 16,
          fontWeight: 900,
          marginTop: 4,
          overflowWrap: "anywhere",
        }}
      >
        {displayValue(value)}
      </div>
    </div>
  );
}

function RoomCard({ room }: { room: VaultForgeRoomRecord }) {
  const isPain = room.kind === "pressure";
  const accent = isPain ? "#ff3b30" : "#f4d477";
  const path = roomPath(room);
  const photo = roomPhoto(room);
  const meta = roomMeta(room);

  return (
    <article
      style={{
        border: `1px solid ${
          isPain ? "rgba(255,59,48,.30)" : "rgba(232,196,107,.24)"
        }`,
        background: isPain
          ? "radial-gradient(circle at top right, rgba(255,59,48,.14), transparent 26%), linear-gradient(145deg,rgba(35,8,8,.96),rgba(2,6,23,.98))"
          : "radial-gradient(circle at top right, rgba(232,196,107,.10), transparent 26%), linear-gradient(145deg,rgba(13,17,28,.98),rgba(2,6,23,.98))",
        borderRadius: 24,
        padding: 14,
        boxShadow: `0 18px 60px ${
          isPain ? "rgba(255,59,48,.10)" : "rgba(232,196,107,.08)"
        }`,
      }}
    >
      <div
        style={{
          height: 4,
          borderRadius: 999,
          background: `linear-gradient(90deg, ${accent}, transparent)`,
          marginBottom: 12,
        }}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "112px minmax(0,1fr)",
          gap: 14,
          alignItems: "start",
        }}
      >
        <Link
          href={path}
          style={{
            height: 112,
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,.12)",
            background:
              "radial-gradient(circle at top left, rgba(232,196,107,.18), transparent 30%), linear-gradient(135deg,#111827,#020617)",
            display: "block",
          }}
        >
          {photo ? (
            <img
              src={photo}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          ) : null}
        </Link>

        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <Link href={path} style={{ textDecoration: "none", color: "inherit", minWidth: 0 }}>
              <div style={{ ...eyebrow, color: accent }}>{kindLabel(room.kind)}</div>
              <h3
                style={{
                  fontSize: 24,
                  lineHeight: 0.98,
                  letterSpacing: "-.055em",
                  margin: "7px 0 6px",
                  overflowWrap: "anywhere",
                }}
              >
                {room.title || "Untitled Room"}
              </h3>
            </Link>

            <div style={{ textAlign: "right", flex: "0 0 auto" }}>
              <div
                style={{
                  color: accent,
                  fontSize: 28,
                  fontWeight: 950,
                  lineHeight: 1,
                  letterSpacing: "-.06em",
                }}
              >
                {roomScore(room)}
              </div>
              <div
                style={{
                  color: "#9aa4b2",
                  fontSize: 10,
                  letterSpacing: ".16em",
                  textTransform: "uppercase",
                  fontWeight: 900,
                  marginTop: 4,
                }}
              >
                {room.status || "active"}
              </div>
            </div>
          </div>

          <p style={{ ...muted, margin: "0 0 10px", fontSize: 13 }}>
            {compact(roomLocation(room), 80)}
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <span style={{ ...pill, padding: "6px 9px", fontSize: 11, color: accent }}>
              {compact(roomValueLine(room), 58)}
            </span>
            {meta.map((item) => (
              <span key={item} style={{ ...pill, padding: "6px 9px", fontSize: 11 }}>
                {item}
              </span>
            ))}
          </div>

          <p style={{ ...muted, fontSize: 13, margin: "11px 0 0" }}>
            {roomAISummary(room)}
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            <Link href={path} style={goldPill}>
              Open Room
            </Link>
            <Link href={`/message-command/${encodeURIComponent(room.kind + ":" + room.id)}`} style={pill}>
              Thread
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export function VaultForgeRoomPage({
  room,
  kind,
  id,
}: {
  room: VaultForgeRoomRecord | null;
  kind: VaultForgeRoomKind;
  id: string;
}) {
  const display = room || fallbackRoom(kind, id);
  const isPain = display.kind === "pressure";

  const good = isPain
    ? "This pressure room is actionable if the blocker, deadline, capital need, and decision-maker are confirmed."
    : "This opportunity has enough room structure to support underwriting, buyer fit, capital routing, and execution review.";

  const bad = isPain
    ? "The main risk is delay. Pain rooms lose value when ownership, deadline, or next action is unclear."
    : "The main risk is incomplete underwriting. Confirm title, docs, repairs, occupancy, capital, and exit assumptions.";

  const next = isPain
    ? "Assign owner, confirm deadline, route matched operator/capital/buyer profiles, and keep all messages tied to this room."
    : "Verify economics, attach documents/photos, route to buyer/capital/operator matches, then move to review, negotiation, or archive.";

  return (
    <main style={page}>
      <div style={wrap}>
        <section style={card}>
          <div style={eyebrow}>VaultForge {kindLabel(display.kind)} Execution Room</div>
          <h1
            style={{
              fontSize: "clamp(38px,8vw,78px)",
              lineHeight: 0.9,
              letterSpacing: "-.07em",
              margin: "12px 0 14px",
            }}
          >
            {display.title}
          </h1>
          <p style={{ ...muted, fontSize: 18, maxWidth: 980 }}>{roomAISummary(display)}</p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginTop: 18 }}>
            <Link href={backPath(display.kind)} style={pill}>
              Back To Lane
            </Link>
            <Link href="/projects" style={pill}>
              Projects
            </Link>
            <Link href="/dashboard" style={pill}>
              Command
            </Link>
            <Link href={`/message-command/${encodeURIComponent(display.kind + ":" + display.id)}`} style={goldPill}>
              Room Thread
            </Link>
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>{kindLabel(display.kind)} Data Brief</div>
          <h2
            style={{
              fontSize: "clamp(30px,6vw,56px)",
              lineHeight: 0.95,
              letterSpacing: "-.055em",
              margin: "10px 0 14px",
            }}
          >
            Numbers, routing, and execution context.
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
              gap: 10,
            }}
          >
            <Metric label="Market" value={display.subtitle || roomLocation(display)} />
            <Metric label="Asset" value={display.asset_type || "Not listed"} />
            <Metric label="Strategy" value={display.strategy || "Not listed"} />
            <Metric label="Urgency" value={display.urgency || "Review"} />
            <Metric label="Asking" value={moneyish(display.asking) || "Not listed"} />
            <Metric label="ARV / Value" value={moneyish(display.arv) || "Not listed"} />
            <Metric label="Repairs / Work" value={moneyish(display.repairs) || "Not listed"} />
            <Metric label="Capital Need" value={moneyish(display.capital_needed) || "Not listed"} />
            <Metric label="Fit Score" value={display.fit_score || roomScore(display)} />
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>{isPain ? "Pain Execution AI" : "Opportunity AI"}</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
              gap: 12,
              marginTop: 12,
            }}
          >
            <div style={softCard}>
              <h3 style={{ margin: "0 0 10px", color: "#86efac" }}>
                {isPain ? "What can be solved" : "What looks good"}
              </h3>
              <p style={muted}>{good}</p>
            </div>

            <div style={softCard}>
              <h3 style={{ margin: "0 0 10px", color: "#fca5a5" }}>
                {isPain ? "Execution risk" : "What needs caution"}
              </h3>
              <p style={muted}>{bad}</p>
            </div>

            <div style={softCard}>
              <h3 style={{ margin: "0 0 10px", color: "#93c5fd" }}>Next steps</h3>
              <p style={muted}>{next}</p>
            </div>
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Matched Profiles · Routing Layer</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))",
              gap: 12,
              marginTop: 12,
            }}
          >
            {[
              ["Buyer Match", "Southeast buyer fit", "Matches geography, strategy, and likely exit appetite."],
              ["Capital Match", "Bridge/JV capital fit", "Useful when the room needs rescue capital, debt, or acquisition funding."],
              ["Operator Match", "Execution operator fit", "Best for boots-on-ground, PM, construction, or turnaround needs."],
            ].map(([role, name, reason], index) => (
              <div key={role} style={softCard}>
                <div style={eyebrow}>{role}</div>
                <h3 style={{ margin: "8px 0", fontSize: 22 }}>{name}</h3>
                <p style={muted}>{reason}</p>
                <div style={{ ...goldPill, display: "inline-flex", marginTop: 6 }}>
                  Score {91 - index * 4}
                </div>
              </div>
            ))}
          </div>
        </section>

        {display.ai_next_steps.length ? (
          <section style={card}>
            <div style={eyebrow}>AI Next Moves</div>
            <ol style={{ margin: "12px 0 0", paddingLeft: 22, color: "#cbd5e1", lineHeight: 1.7 }}>
              {display.ai_next_steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>
        ) : null}

        {display.photos.length ? (
          <section style={card}>
            <div style={eyebrow}>Room Photos</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
                gap: 12,
                marginTop: 14,
              }}
            >
              {display.photos.map((src, index) => (
                <img
                  key={src + index}
                  src={src}
                  alt={`${display.title} photo ${index + 1}`}
                  style={{
                    width: "100%",
                    height: 190,
                    objectFit: "cover",
                    borderRadius: 18,
                    border: "1px solid rgba(148,163,184,.18)",
                  }}
                />
              ))}
            </div>
          </section>
        ) : null}

        <section style={card}>
          <div style={eyebrow}>5S Room Controls</div>
          <p style={muted}>
            Save what matters. Archive what is done. Hide what should leave active workflow.
            VaultForge matching may route this room to multiple qualified buyers, operators, lenders,
            capital partners, and execution profiles at the same time.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <Link href="/saved-rooms" style={pill}>
              Saved Folder
            </Link>
            <Link href="/archived-rooms" style={pill}>
              Archived Folder
            </Link>
            <Link href="/deleted-rooms" style={pill}>
              Hidden Folder
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export function VaultForgeRoomListPage({
  title,
  subtitle,
  kind,
  rooms,
}: {
  title: string;
  subtitle: string;
  kind: VaultForgeRoomKind;
  rooms: VaultForgeRoomRecord[];
}) {
  const cleanRooms = rooms.filter((room) => room.kind === kind);

  return (
    <main style={page}>
      <div style={wrap}>
        <section style={card}>
          <div style={eyebrow}>VaultForge Private Intelligence Network</div>
          <h1
            style={{
              fontSize: "clamp(42px,9vw,86px)",
              lineHeight: 0.9,
              letterSpacing: "-.07em",
              margin: "12px 0 14px",
            }}
          >
            {title}
          </h1>
          <p style={{ ...muted, fontSize: 18, maxWidth: 900 }}>{subtitle}</p>

          <p style={{ ...muted, fontSize: 13, marginTop: 10 }}>
            Matching notice: rooms may route to multiple qualified buyers, lenders, operators,
            capital partners, and execution profiles. Front cards stay clean; full intelligence lives inside.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginTop: 16 }}>
            <Link href="/dashboard" style={pill}>
              Command
            </Link>
            <Link href="/opportunity-rooms" style={kind === "opportunity" ? goldPill : pill}>
              Opportunity
            </Link>
            <Link href="/pressure-rooms" style={kind === "pressure" ? goldPill : pill}>
              Pain Rooms
            </Link>
            <Link href="/projects" style={pill}>
              Projects
            </Link>
          </div>
        </section>

        <section style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "end", flexWrap: "wrap" }}>
            <div>
              <div style={eyebrow}>{kindLabel(kind)} Cards</div>
              <h2
                style={{
                  fontSize: "clamp(30px,7vw,58px)",
                  lineHeight: 0.95,
                  letterSpacing: "-.055em",
                  margin: "10px 0 0",
                }}
              >
                {cleanRooms.length ? `${cleanRooms.length} active rooms.` : "No active rooms found."}
              </h2>
            </div>

            <Link href={kind === "pressure" ? "/pain" : "/submit"} style={goldPill}>
              {kind === "pressure" ? "Create Pain" : "Create Deal"}
            </Link>
          </div>

          {!cleanRooms.length ? (
            <p style={{ ...muted, marginTop: 14 }}>
              No records resolved from the current room hydrator. If you know deals exist, the next fix is table/column alias mapping in
              <strong> app/lib/vaultforgeRoomHydration.ts</strong>, not more front-card UI.
            </p>
          ) : null}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
              gap: 14,
              marginTop: 16,
            }}
          >
            {cleanRooms.map((room) => (
              <RoomCard key={`${room.kind}:${room.id}:${room.title}`} room={room} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}