"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type DealRoom = Record<string, any>;
type RoomState = "active" | "saved" | "archived" | "deleted";

const DEAL_ARRAY_KEYS = [
  "vaultforge_clean_deal_rooms",
  "vaultforge_deal_rooms",
  "vf_deal_rooms",
  "deal_rooms",
  "vaultforge_rooms_deal",
  "vaultforge_clean_rooms",
];

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#05070d",
  color: "#f7f7fb",
  padding: "18px",
  fontFamily:
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1180, margin: "0 auto", paddingBottom: 70 };
const card: React.CSSProperties = {
  background: "linear-gradient(180deg,#080d19,#050816)",
  border: "1px solid rgba(245,197,66,.28)",
  borderRadius: 26,
  padding: 28,
  marginBottom: 22,
  boxShadow: "0 18px 60px rgba(0,0,0,.3)",
};
const eyebrow: React.CSSProperties = {
  color: "#ffd45a",
  textTransform: "uppercase",
  letterSpacing: 8,
  fontWeight: 950,
  fontSize: 18,
  marginBottom: 14,
};
const h1: React.CSSProperties = {
  fontSize: "clamp(42px,7vw,78px)",
  lineHeight: 0.92,
  letterSpacing: -4,
  margin: "0 0 18px",
  fontWeight: 950,
};
const h2: React.CSSProperties = {
  fontSize: "clamp(30px,5vw,52px)",
  lineHeight: 1,
  letterSpacing: -2,
  margin: "0 0 18px",
  fontWeight: 950,
};
const sub: React.CSSProperties = {
  color: "#c9d0dc",
  fontSize: "clamp(18px,2.4vw,25px)",
  lineHeight: 1.35,
  margin: 0,
};
const button: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 18,
  padding: "14px 18px",
  fontWeight: 950,
  textDecoration: "none",
  border: "1px solid rgba(207,216,230,.18)",
  background: "#171c29",
  color: "#f7f7fb",
  cursor: "pointer",
};
const goldButton: React.CSSProperties = { ...button, background: "#ffdc68", color: "#111319", borderColor: "#ffdc68" };
const redButton: React.CSSProperties = { ...button, background: "#2b1015", color: "#ff9b9b", borderColor: "rgba(255,78,78,.45)" };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 14 };
const metric: React.CSSProperties = { background: "#111724", border: "1px solid rgba(207,216,230,.15)", borderRadius: 20, padding: 18 };
const metricLabel: React.CSSProperties = { color: "#ffd45a", letterSpacing: 2.5, textTransform: "uppercase", fontSize: 12, fontWeight: 950, marginBottom: 8 };
const metricValue: React.CSSProperties = { color: "#f7f7fb", fontSize: 22, fontWeight: 900 };
const chip: React.CSSProperties = { display: "inline-flex", border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f9fbff", borderRadius: 999, padding: "10px 13px", fontWeight: 900, margin: "0 8px 8px 0" };

function clean(value: any, fallback = "Not listed") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function arr(value: any): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value.includes(",")) return value.split(",").map((v) => v.trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function money(value: any) {
  const text = String(value ?? "").replace(/[^0-9.]/g, "");
  if (!text) return "Not listed";
  const num = Number(text);
  if (Number.isNaN(num)) return String(value);
  return `$${num.toLocaleString()}`;
}

function getPhoto(deal: DealRoom) {
  return clean(
    deal.photoDataUrl || deal.photo_url || deal.photoUrl || deal.image_url || deal.imageUrl || deal.coverPhoto || deal.photo,
    ""
  );
}

function readJson(key: string) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeJson(key: string, value: any) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function findDeal(id: string): DealRoom | null {
  const directKeys = [
    `vaultforge_clean_deal_room_${id}`,
    `vaultforge_deal_room_${id}`,
    `vf_deal_room_${id}`,
    `deal_room_${id}`,
  ];

  for (const key of directKeys) {
    const direct = readJson(key);
    if (direct && typeof direct === "object") return direct;
  }

  for (const key of DEAL_ARRAY_KEYS) {
    const data = readJson(key);
    const list = Array.isArray(data) ? data : [];
    const found = list.find((item: any) => String(item?.id || item?.roomId || item?.deal_id || item?.dealId) === id);
    if (found) return found;
  }

  return null;
}

function updateRoomState(id: string, state: RoomState, deal: DealRoom) {
  const stateMap = readJson("vaultforge_clean_room_states") || {};
  stateMap[id] = state;
  writeJson("vaultforge_clean_room_states", stateMap);

  const folders = readJson("vaultforge_room_folders") || {};
  folders[id] = { id, type: "deal", state, title: clean(deal.title || deal.name, "Deal Room"), updatedAt: new Date().toISOString() };
  writeJson("vaultforge_room_folders", folders);

  const perRoom = { ...deal, roomState: state, updatedAt: new Date().toISOString() };
  writeJson(`vaultforge_clean_deal_room_${id}`, perRoom);

  for (const key of DEAL_ARRAY_KEYS) {
    const current = readJson(key);
    if (!Array.isArray(current)) continue;
    const next = current.map((item: any) => String(item?.id || item?.roomId || item?.deal_id || item?.dealId) === id ? perRoom : item);
    writeJson(key, next);
  }
}

function calcSpread(deal: DealRoom) {
  const arv = Number(String(deal.arv || deal.value || deal.afterRepairValue || "").replace(/[^0-9.]/g, ""));
  const ask = Number(String(deal.askingPrice || deal.ask || deal.price || "").replace(/[^0-9.]/g, ""));
  const repairs = Number(String(deal.repairs || deal.repairCost || "").replace(/[^0-9.]/g, ""));
  if (!arv || !ask) return clean(deal.equitySpread, "Not calculated");
  return `$${Math.max(arv - ask - (repairs || 0), 0).toLocaleString()}`;
}

function makeSignalSummary(deal: DealRoom) {
  const route = arr(deal.routeTo || deal.routingNeeds || deal.route_to).join(", ") || "buyer / investor";
  const issues = arr(deal.knownIssues || deal.issues).join(", ") || "None listed";
  const location = [deal.city, deal.county, deal.state].filter(Boolean).join(", ") || "market not listed";
  return [
    `Signal: ${clean(deal.assetClass || deal.asset_class, "Deal")} opportunity in ${location}.`,
    `Numbers: ask ${money(deal.askingPrice || deal.ask)}, ARV/value ${money(deal.arv || deal.value)}, repairs/work ${money(deal.repairs)}. Estimated spread: ${calcSpread(deal)}.`,
    `Routing: send to ${route}. Urgency is ${clean(deal.urgency, "Normal")}. Access is ${clean(deal.access)}. Occupancy is ${clean(deal.occupancy)}.`,
    `Risk flags: ${issues}. Best contact: ${clean(deal.bestContact)} through ${clean(deal.contactName || deal.name)}.`
  ].join(" ");
}

export default function DealRoomDetailPage() {
  const params = useParams();
  const id = String(params?.id || "");
  const [deal, setDeal] = useState<DealRoom | null>(null);
  const [state, setState] = useState<RoomState>("active");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const found = findDeal(id);
    setDeal(found);
    const states = readJson("vaultforge_clean_room_states") || {};
    setState((states[id] || found?.roomState || "active") as RoomState);
  }, [id]);

  const photo = useMemo(() => (deal ? getPhoto(deal) : ""), [deal]);
  const routeTo = deal ? arr(deal.routeTo || deal.routingNeeds || deal.route_to) : [];
  const issues = deal ? arr(deal.knownIssues || deal.issues) : [];
  const docs = deal ? arr(deal.docs || deal.documents || deal.availableDocs) : [];

  function setRoomState(next: RoomState) {
    if (!deal) return;
    updateRoomState(id, next, deal);
    setState(next);
    setNotice(next === "saved" ? "Saved to Saved Rooms." : next === "archived" ? "Archived." : next === "deleted" ? "Moved to Deleted Rooms." : "Restored to Active.");
    window.setTimeout(() => setNotice(""), 2200);
  }

  if (!deal) {
    return (
      <main style={page}>
        <div style={wrap}>
          <Nav />
          <section style={card}>
            <div style={eyebrow}>Deal Room</div>
            <h1 style={h1}>Room not found.</h1>
            <p style={sub}>This room was not found by ID, but the Deal Rooms board now stores and opens rooms from the same local keys.</p>
          </section>
          <section style={card}>
            <Link href="/deal-rooms" style={goldButton}>Back to Deal Rooms</Link>
            <Link href="/deal-create" style={{ ...button, marginLeft: 10 }}>Create Deal</Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main style={page}>
      <div style={wrap}>
        <Nav />

        {notice ? <div style={{ ...card, borderColor: "rgba(101,255,151,.5)", background: "#102818" }}>{notice}</div> : null}

        <section style={card}>
          <div style={eyebrow}>Deal Room • {state.toUpperCase()}</div>
          <h1 style={h1}>{clean(deal.title || deal.name, "Deal Room")}</h1>
          <p style={sub}>{[deal.city, deal.county, deal.state].filter(Boolean).join(", ") || "Market not listed"}</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            <button type="button" style={goldButton} onClick={() => setRoomState("saved")}>Save</button>
            <button type="button" style={button} onClick={() => setRoomState("archived")}>Archive</button>
            <button type="button" style={redButton} onClick={() => setRoomState("deleted")}>Delete</button>
            {state !== "active" ? <button type="button" style={button} onClick={() => setRoomState("active")}>Restore Active</button> : null}
            <Link href="/deal-rooms" style={button}>Back to Deal Rooms</Link>
          </div>
        </section>

        {photo ? (
          <section style={card}>
            <div style={eyebrow}>Room Photo</div>
            <img src={photo} alt="Deal room photo" style={{ width: "100%", maxHeight: 460, objectFit: "cover", borderRadius: 24, border: "1px solid rgba(207,216,230,.22)" }} />
          </section>
        ) : (
          <section style={card}>
            <div style={eyebrow}>Room Photo</div>
            <p style={sub}>No photo was saved with this room. New saves use compressed browser photos so localStorage does not exceed quota.</p>
          </section>
        )}

        <section style={card}>
          <div style={eyebrow}>Signal Summary</div>
          <h2 style={h2}>AI execution read.</h2>
          <p style={sub}>{clean(deal.aiRead || deal.aiSummary || makeSignalSummary(deal))}</p>
        </section>

        <section style={card}>
          <div style={eyebrow}>Numbers</div>
          <div style={grid}>
            <Metric label="Ask" value={money(deal.askingPrice || deal.ask || deal.price)} />
            <Metric label="ARV / Value" value={money(deal.arv || deal.value)} />
            <Metric label="Repairs" value={money(deal.repairs || deal.work)} />
            <Metric label="Spread" value={calcSpread(deal)} />
            <Metric label="Assignment / Fee" value={money(deal.assignmentFee || deal.fee)} />
            <Metric label="Deadline" value={clean(deal.deadline || deal.closeDate)} />
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Asset Details</div>
          <div style={grid}>
            <Metric label="Class" value={clean(deal.assetClass || deal.asset_class)} />
            <Metric label="Beds" value={clean(deal.beds)} />
            <Metric label="Baths" value={clean(deal.baths)} />
            <Metric label="Sqft" value={clean(deal.sqft || deal.squareFeet)} />
            <Metric label="Units" value={clean(deal.units)} />
            <Metric label="Acres" value={clean(deal.acres)} />
            <Metric label="Zoning" value={clean(deal.zoning)} />
            <Metric label="Occupancy" value={clean(deal.occupancy)} />
            <Metric label="Access" value={clean(deal.access)} />
            <Metric label="Address" value={clean(deal.address || deal.location)} />
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Contact + Control</div>
          <div style={grid}>
            <Metric label="Contact" value={clean(deal.contactName || deal.name)} />
            <Metric label="Phone" value={clean(deal.contactPhone || deal.phone)} />
            <Metric label="Email" value={clean(deal.contactEmail || deal.email)} />
            <Metric label="Best Contact" value={clean(deal.bestContact)} />
            <Metric label="Submitter Role" value={clean(deal.submitterRole || deal.role)} />
            <Metric label="Urgency" value={clean(deal.urgency)} />
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Routing Intelligence</div>
          <h2 style={h2}>Who should see this.</h2>
          <ChipList title="Route To" values={routeTo} fallback="No route target selected" />
          <ChipList title="Known Issues" values={issues} fallback="No issues listed" />
          <ChipList title="Available Docs" values={docs} fallback="No docs selected" />
          <div style={{ marginTop: 18 }}>
            <Metric label="Private AI Notes" value={clean(deal.notes || deal.privateNotes || deal.description)} />
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Next Best Actions</div>
          <div style={grid}>
            <Action title="Verify numbers" text="Confirm ask, ARV/value, repair budget, fee/spread, and close deadline before routing." />
            <Action title="Route match" text={`Primary lane: ${routeTo.join(", ") || "Buyer / Investor"}. Add lender/operator only if capital or execution gap exists.`} />
            <Action title="Risk review" text={`Watch flags: ${issues.join(", ") || "None listed"}. Check access and occupancy before showing to members.`} />
            <Action title="Message thread" text="Next build should attach a dedicated message thread to this room ID for all member requests." />
          </div>
        </section>
      </div>
    </main>
  );
}

function Nav() {
  return (
    <nav style={{ ...card, display: "flex", gap: 10, flexWrap: "wrap" }}>
      <strong style={{ color: "#ffd45a", fontSize: 26, marginRight: 10 }}>VAULTFORGE</strong>
      <Link href="/command" style={button}>Command</Link>
      <Link href="/deal-rooms" style={goldButton}>Deal Rooms</Link>
      <Link href="/pain-intake" style={button}>Pain Intake</Link>
      <Link href="/pain-rooms" style={button}>Pain Rooms</Link>
      <Link href="/messages" style={button}>Messages</Link>
      <Link href="/profile" style={button}>Profile</Link>
      <Link href="/saved-rooms" style={button}>Saved</Link>
      <Link href="/archived-rooms" style={button}>Archived</Link>
      <Link href="/deleted-rooms" style={button}>Deleted</Link>
      <Link href="/" style={redButton}>Exit</Link>
    </nav>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={metric}>
      <div style={metricLabel}>{label}</div>
      <div style={metricValue}>{value}</div>
    </div>
  );
}

function ChipList({ title, values, fallback }: { title: string; values: string[]; fallback: string }) {
  return (
    <div style={{ marginTop: 18 }}>
      <div style={metricLabel}>{title}</div>
      {values.length ? values.map((value) => <span key={value} style={chip}>{value}</span>) : <p style={sub}>{fallback}</p>}
    </div>
  );
}

function Action({ title, text }: { title: string; text: string }) {
  return (
    <div style={metric}>
      <div style={metricLabel}>{title}</div>
      <p style={{ ...sub, fontSize: 17 }}>{text}</p>
    </div>
  );
}
