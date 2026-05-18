"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

type RoomState = "active" | "saved" | "archived" | "deleted";

type AlertedMember = {
  id: string;
  name: string;
  role: string;
  contact: string;
  note: string;
  createdAt: string;
};

type DealRoom = {
  id?: string;
  kind?: string;
  assetClass?: string;
  title?: string;
  state?: string;
  city?: string;
  county?: string;
  address?: string;
  askingPrice?: string;
  arv?: string;
  repairs?: string;
  equitySpread?: string;
  beds?: string;
  baths?: string;
  sqft?: string;
  acres?: string;
  units?: string;
  buildingSize?: string;
  zoning?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  bestContact?: string;
  submitterRole?: string;
  routeTo?: string[] | string;
  urgency?: string;
  occupancy?: string;
  knownIssues?: string[] | string;
  access?: string;
  docs?: string[] | string;
  assignmentFee?: string;
  deadline?: string;
  notes?: string;
  aiRead?: string;
  photoName?: string;
  photoDataUrl?: string;
  imageDataUrl?: string;
  photoUrl?: string;
  imageUrl?: string;
  photos?: string[];
  createdAt?: string;
  updatedAt?: string;
  roomState?: RoomState;
  alertedMembers?: AlertedMember[];
  [key: string]: unknown;
};

const DEAL_LIST_KEYS = ["vaultforge_clean_deal_rooms", "vaultforge_deal_rooms", "vaultforge_deals", "vf_deal_rooms", "deal_rooms"];
const ROOM_STATE_KEY = "vaultforge_room_states";

const shell: React.CSSProperties = { minHeight: "100vh", background: "#05070d", color: "#f7f7fb", padding: "22px", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 1180, margin: "0 auto", paddingBottom: 80 };
const card: React.CSSProperties = { background: "linear-gradient(180deg,#080d19,#050816)", border: "1px solid rgba(245,197,66,.28)", borderRadius: 26, padding: 28, marginBottom: 22, boxShadow: "0 18px 60px rgba(0,0,0,.32)" };
const panel: React.CSSProperties = { background: "#111724", border: "1px solid rgba(207,216,230,.16)", borderRadius: 22, padding: 20 };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 8, fontWeight: 950, fontSize: 18, marginBottom: 14 };
const h1: React.CSSProperties = { fontSize: "clamp(42px,7vw,76px)", lineHeight: .92, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(28px,4vw,46px)", lineHeight: 1, letterSpacing: -2, margin: "0 0 14px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: "clamp(18px,2.4vw,24px)", lineHeight: 1.35, margin: 0 };
const navButton: React.CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none", borderRadius: 999, padding: "13px 18px", fontWeight: 950, background: "#171c29", color: "#f7f7fb", border: "1px solid rgba(207,216,230,.18)", cursor: "pointer" };
const goldButton: React.CSSProperties = { ...navButton, background: "#ffdc68", color: "#111319", borderColor: "#ffdc68" };
const redButton: React.CSSProperties = { ...navButton, background: "#261016", color: "#ffaaaa", borderColor: "rgba(255,75,75,.45)" };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", borderRadius: 16, border: "1px solid rgba(207,216,230,.18)", background: "#121724", color: "#f6f7fb", padding: "14px 15px", fontSize: 16, outline: "none" };
const chip: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f9fbff", borderRadius: 999, padding: "10px 14px", fontWeight: 900, display: "inline-flex", margin: "4px 6px 4px 0" };

function safeJson(value: string | null) { if (!value) return null; try { return JSON.parse(value); } catch { return null; } }
function getString(value: unknown) { return typeof value === "string" ? value : ""; }
function listText(value: unknown) { if (Array.isArray(value)) return value.filter(Boolean).map(String).join(", "); return getString(value) || "Not selected"; }
function roomId(deal: DealRoom, fallback: number) { return getString(deal.id) || `deal_${fallback}`; }
function money(value: unknown) { const raw = getString(value); if (!raw) return "Not listed"; const cleaned = raw.replace(/[^0-9.]/g, ""); if (!cleaned) return raw; const num = Number(cleaned); return Number.isFinite(num) ? `$${num.toLocaleString()}` : raw; }
function photoFor(deal: DealRoom) { const photos = Array.isArray(deal.photos) ? deal.photos : []; return getString(deal.photoDataUrl) || getString(deal.imageDataUrl) || getString(deal.photoUrl) || getString(deal.imageUrl) || getString(photos[0]); }
function makeMemberId() { return `alerted_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`; }

function readRoomStates(): Record<string, RoomState> {
  const parsed = safeJson(window.localStorage.getItem(ROOM_STATE_KEY));
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, RoomState> : {};
}

function writeRoomState(id: string, state: RoomState) {
  const states = readRoomStates();
  states[id] = state;
  window.localStorage.setItem(ROOM_STATE_KEY, JSON.stringify(states));
}

function readAllDeals(): DealRoom[] {
  const states = readRoomStates();
  const seen = new Map<string, DealRoom>();
  DEAL_LIST_KEYS.forEach((key) => {
    const parsed = safeJson(window.localStorage.getItem(key));
    if (Array.isArray(parsed)) parsed.forEach((item, index) => {
      if (!item || typeof item !== "object") return;
      const deal = item as DealRoom;
      const id = roomId(deal, index);
      seen.set(id, { ...deal, id, roomState: states[id] || deal.roomState || "active" });
    });
  });
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i) || "";
    if (!key.includes("deal_room") && !key.includes("deal_rooms")) continue;
    const parsed = safeJson(window.localStorage.getItem(key));
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const deal = parsed as DealRoom;
      const id = roomId(deal, i + 1000);
      seen.set(id, { ...deal, id, roomState: states[id] || deal.roomState || "active" });
    }
  }
  return Array.from(seen.values());
}

function saveDealEverywhere(deal: DealRoom) {
  if (!deal.id) return;
  const all = readAllDeals().filter((item) => item.id !== deal.id);
  const next = [deal, ...all];
  DEAL_LIST_KEYS.forEach((key) => window.localStorage.setItem(key, JSON.stringify(next)));
  window.localStorage.setItem(`vaultforge_clean_deal_room_${deal.id}`, JSON.stringify(deal));
  window.localStorage.setItem(`vaultforge_deal_room_${deal.id}`, JSON.stringify(deal));
}

function readAlertedMembers(id: string, deal?: DealRoom | null): AlertedMember[] {
  const local = safeJson(window.localStorage.getItem(`vaultforge_deal_alerted_members_${id}`));
  if (Array.isArray(local)) return local as AlertedMember[];
  return Array.isArray(deal?.alertedMembers) ? deal.alertedMembers : [];
}

export default function DealRoomDetailPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(String(params?.id || ""));
  const [deal, setDeal] = useState<DealRoom | null>(null);
  const [members, setMembers] = useState<AlertedMember[]>([]);
  const [memberForm, setMemberForm] = useState({ name: "", role: "Buyer", contact: "", note: "" });

  useEffect(() => {
    const found = readAllDeals().find((item) => item.id === id) || null;
    setDeal(found);
    setMembers(readAlertedMembers(id, found));
  }, [id]);

  const photo = deal ? photoFor(deal) : "";
  const signalSummary = useMemo(() => {
    if (!deal) return "No room loaded.";
    const route = listText(deal.routeTo);
    const issues = listText(deal.knownIssues);
    const docs = listText(deal.docs);
    return `Signal: ${getString(deal.assetClass) || "Deal"} in ${[deal.city, deal.county, deal.state].map(getString).filter(Boolean).join(", ") || "unknown market"}. Ask ${money(deal.askingPrice)}, value ${money(deal.arv)}, repairs ${money(deal.repairs)}. Route to ${route}. Urgency ${getString(deal.urgency) || "not set"}. Access ${getString(deal.access) || "not set"}. Issues: ${issues}. Docs: ${docs}. AI next step: alert matched member profiles, verify contact/control, confirm numbers, then move qualified buyers/operators/lenders into Messages.`;
  }, [deal]);

  function updateRoomState(state: RoomState) {
    if (!deal?.id) return;
    const next = { ...deal, roomState: state, updatedAt: new Date().toISOString() };
    writeRoomState(deal.id, state);
    saveDealEverywhere(next);
    setDeal(next);
  }

  function addAlertedMember() {
    if (!deal?.id) return;
    const name = memberForm.name.trim();
    const contact = memberForm.contact.trim();
    if (!name && !contact) return;
    const nextMember: AlertedMember = { id: makeMemberId(), name: name || "Unnamed member", role: memberForm.role || "Member", contact, note: memberForm.note.trim(), createdAt: new Date().toISOString() };
    const nextMembers = [nextMember, ...members];
    window.localStorage.setItem(`vaultforge_deal_alerted_members_${deal.id}`, JSON.stringify(nextMembers));
    const nextDeal = { ...deal, alertedMembers: nextMembers, updatedAt: new Date().toISOString() };
    saveDealEverywhere(nextDeal);
    setDeal(nextDeal);
    setMembers(nextMembers);
    setMemberForm({ name: "", role: "Buyer", contact: "", note: "" });
  }

  function removeAlertedMember(memberId: string) {
    if (!deal?.id) return;
    const nextMembers = members.filter((member) => member.id !== memberId);
    window.localStorage.setItem(`vaultforge_deal_alerted_members_${deal.id}`, JSON.stringify(nextMembers));
    const nextDeal = { ...deal, alertedMembers: nextMembers, updatedAt: new Date().toISOString() };
    saveDealEverywhere(nextDeal);
    setDeal(nextDeal);
    setMembers(nextMembers);
  }

  if (!deal) {
    return (
      <main style={shell}><div style={wrap}>
        <nav style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}><Link href="/deal-rooms" style={goldButton}>Back to Deal Rooms</Link><Link href="/deal-create" style={navButton}>Create Deal</Link><Link href="/" style={redButton}>Exit</Link></nav>
        <section style={card}><div style={eyebrow}>Deal Room</div><h1 style={h1}>Room not found.</h1><p style={sub}>This room was not found in local saved Deal Rooms. Go back and open a saved card.</p></section>
      </div></main>
    );
  }

  return (
    <main style={shell}>
      <div style={wrap}>
        <nav style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
          <Link href="/command" style={navButton}>Command</Link>
          <Link href="/deal-rooms" style={goldButton}>Deal Rooms</Link>
          <Link href="/messages" style={navButton}>Messages</Link>
          <Link href="/profile" style={navButton}>Profile</Link>
          <Link href="/" style={redButton}>Exit</Link>
        </nav>

        <section style={card}>
          {photo ? <img src={photo} alt={getString(deal.title) || "Deal photo"} style={{ width: "100%", maxHeight: 420, objectFit: "cover", borderRadius: 24, border: "1px solid rgba(207,216,230,.2)", marginBottom: 22 }} /> : <div style={{ height: 180, borderRadius: 24, border: "1px dashed rgba(207,216,230,.28)", display: "flex", alignItems: "center", justifyContent: "center", color: "#c9d0dc", marginBottom: 22 }}>No photo saved for this room</div>}
          <div style={eyebrow}>{getString(deal.assetClass) || "Deal Room"}</div>
          <h1 style={h1}>{getString(deal.title) || "Untitled Deal"}</h1>
          <p style={sub}>{[deal.address, deal.city, deal.county, deal.state].map(getString).filter(Boolean).join(" • ") || "Location not listed"}</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
            <button type="button" onClick={() => updateRoomState("saved")} style={goldButton}>Save</button>
            <button type="button" onClick={() => updateRoomState("archived")} style={navButton}>Archive</button>
            <button type="button" onClick={() => updateRoomState("deleted")} style={redButton}>Delete</button>
            <span style={chip}>Current: {deal.roomState || "active"}</span>
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Signal Summary</div>
          <p style={sub}>{signalSummary}</p>
        </section>

        <section style={card}>
          <div style={eyebrow}>Numbers + Asset Facts</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
            <Info title="Ask" value={money(deal.askingPrice)} />
            <Info title="ARV / Value" value={money(deal.arv)} />
            <Info title="Repairs / Work" value={money(deal.repairs)} />
            <Info title="Equity Spread" value={money(deal.equitySpread)} />
            <Info title="Beds" value={getString(deal.beds) || "Not listed"} />
            <Info title="Baths" value={getString(deal.baths) || "Not listed"} />
            <Info title="Sqft" value={getString(deal.sqft) || "Not listed"} />
            <Info title="Units" value={getString(deal.units) || "Not listed"} />
            <Info title="Acres" value={getString(deal.acres) || "Not listed"} />
            <Info title="Zoning" value={getString(deal.zoning) || "Not listed"} />
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Contact + Control</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 14 }}>
            <Info title="Contact Name" value={getString(deal.contactName) || "Not listed"} />
            <Info title="Phone" value={getString(deal.contactPhone) || "Not listed"} />
            <Info title="Email" value={getString(deal.contactEmail) || "Not listed"} />
            <Info title="Best Contact" value={getString(deal.bestContact) || "Not listed"} />
            <Info title="Submitter Role" value={getString(deal.submitterRole) || "Not listed"} />
            <Info title="Deadline" value={getString(deal.deadline) || "Not listed"} />
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Routing Profile</div>
          <h2 style={h2}>Who this should alert.</h2>
          <p style={sub}>Route targets: {listText(deal.routeTo)}. This section is where the room tracks which member profiles have been routed or alerted.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 14, marginTop: 18 }}>
            {(Array.isArray(deal.routeTo) ? deal.routeTo : [deal.routeTo]).filter(Boolean).map((target) => (
              <div key={String(target)} style={panel}>
                <div style={eyebrow}>{String(target)}</div>
                <p style={{ ...sub, fontSize: 17 }}>Best-fit profile lane for this room. AI should match by state, county, asset type, capital/execution profile, urgency, and contact rules.</p>
              </div>
            ))}
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Alerted Members</div>
          <h2 style={h2}>+ Add who was routed.</h2>
          <p style={sub}>Track each member/profile this deal was sent to or should be sent to.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12, marginTop: 18 }}>
            <input style={input} value={memberForm.name} onChange={(e) => setMemberForm((x) => ({ ...x, name: e.target.value }))} placeholder="Member / Company" />
            <select style={input} value={memberForm.role} onChange={(e) => setMemberForm((x) => ({ ...x, role: e.target.value }))}>
              {["Buyer", "Investor", "Lender", "Operator", "Contractor", "Broker", "JV Partner", "Developer", "Property Manager"].map((item) => <option key={item}>{item}</option>)}
            </select>
            <input style={input} value={memberForm.contact} onChange={(e) => setMemberForm((x) => ({ ...x, contact: e.target.value }))} placeholder="Email / phone" />
            <input style={input} value={memberForm.note} onChange={(e) => setMemberForm((x) => ({ ...x, note: e.target.value }))} placeholder="Routing note" />
          </div>
          <button type="button" onClick={addAlertedMember} style={{ ...goldButton, marginTop: 14 }}>+ Add Alerted Member</button>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 14, marginTop: 18 }}>
            {members.length ? members.map((member) => (
              <div key={member.id} style={panel}>
                <strong style={{ fontSize: 20 }}>{member.name}</strong>
                <p style={{ color: "#cbd3df", lineHeight: 1.5 }}>{member.role}<br />{member.contact || "No contact listed"}<br />{member.note || "No note"}</p>
                <button type="button" onClick={() => removeAlertedMember(member.id)} style={redButton}>Remove</button>
              </div>
            )) : <p style={sub}>No alerted members added yet.</p>}
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Issues / Docs / Notes</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 14 }}>
            <Info title="Urgency" value={getString(deal.urgency) || "Not listed"} />
            <Info title="Occupancy" value={getString(deal.occupancy) || "Not listed"} />
            <Info title="Access" value={getString(deal.access) || "Not listed"} />
            <Info title="Known Issues" value={listText(deal.knownIssues)} />
            <Info title="Docs" value={listText(deal.docs)} />
            <Info title="Assignment Fee" value={getString(deal.assignmentFee) || "Not listed"} />
          </div>
          <div style={{ ...panel, marginTop: 14 }}>
            <div style={eyebrow}>Private / AI Notes</div>
            <p style={{ ...sub, fontSize: 18 }}>{getString(deal.notes) || getString(deal.aiRead) || "No notes saved."}</p>
          </div>
        </section>
      </div>
    </main>
  );
}

function Info({ title, value }: { title: string; value: string }) {
  return <div style={panel}><div style={{ ...eyebrow, fontSize: 13, letterSpacing: 4 }}>{title}</div><div style={{ color: "#f7f7fb", fontSize: 20, fontWeight: 850, lineHeight: 1.25 }}>{value}</div></div>;
}
