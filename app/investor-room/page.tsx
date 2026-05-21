"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const INVESTOR_APP_KEY = "vaultforge_investor_application_v1";
const INVESTOR_REQUESTS_KEY = "vaultforge_investor_requests_v1";
const INVESTOR_EXECUTION_REQUESTS_KEY = "vaultforge_investor_execution_requests_v1";
const INVESTOR_ADMIN_MESSAGES_KEY = "vaultforge_investor_admin_messages_v1";
const INVESTOR_CLEANUP_KEY = "vaultforge_investor_room_cleanup_v2";
const INVESTOR_HIDDEN_KEY = "vaultforge_investor_room_hidden_v1";

const STATES = ["GA", "TN", "AL", "FL", "NC", "SC", "TX"];
const EXECUTION_LANES = [
  { key: "lender", title: "Request Lender", note: "Route this opportunity to private funding sources inside the member network." },
  { key: "hard_money", title: "Request Hard Money", note: "Request fast bridge, rehab, or acquisition capital." },
  { key: "jv_partner", title: "Request JV Partner", note: "Ask for an execution or capital partner for this opportunity." },
  { key: "contractor", title: "Request Contractor", note: "Ask for rehab, construction, bid, or field execution help." },
  { key: "title_closing", title: "Request Title / Closing", note: "Ask for title, closing, escrow, or transaction coordination help." },
  { key: "insurance", title: "Request Insurance", note: "Ask for property insurance or risk coverage help." },
  { key: "property_management", title: "Request Property Management", note: "Ask for leasing, rental, or management support." },
  { key: "operator", title: "Request Operator", note: "Ask for an operator, asset manager, or boots-on-ground execution help." },
  { key: "disposition", title: "Request Disposition Help", note: "Ask for resale, buyer, or exit strategy support." },
  { key: "boots_on_ground", title: "Request Boots On Ground", note: "Ask for local eyes, site visit, photos, or field support." },
  { key: "equity_partner", title: "Request Equity Partner", note: "Ask for private capital or equity partnership routing." },
];

const TICKER_ITEMS = [
  "VAULTFORGE INVESTOR ACCESS",
  "PRIVATE DEAL SIGNALS",
  "PAIN PRESSURE ROUTING",
  "FUNDING THROUGH NETWORK",
  "EXECUTION THROUGH MEMBERS",
  "NO PRIVATE CONTACT EXPOSED",
  "REQUEST INFO CONTROLLED",
  "PROFILE ATTACHED TO REQUESTS",
  "MEMBER APPROVAL REQUIRED",
  "ONE-STOP EXECUTION LANE",
];

const INTELLIGENCE_BLURBS = [
  "VaultForge routes investor requests with buyer profile context attached.",
  "Private member data stays hidden until deeper access is approved.",
  "Deal and Pain cards are teaser intelligence, not public listings.",
  "More complete investor profiles create stronger routing and better member confidence.",
  "Execution requests route to the private network without exposing the directory.",
];

const LOGOS = [
  "/vaultforge-logo.png",
  "/VaultForge-logo.png",
  "/vaultforge-logo.jpg",
  "/logo.png",
  "/vf-logo.png",
  "/vaultforge.png",
];

type Kind = "Deal" | "Pain";
type Folder = "active" | "saved" | "archived" | "deleted";
type ActiveRoom = { kind: Kind; item: any } | null;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function clean(value: unknown, fallback = "") {
  const text = String(value || "").trim();
  return text || fallback;
}

function itemState(item: any) {
  return clean(
    item?.state ||
      item?.propertyState ||
      item?.property_state ||
      item?.dealState ||
      item?.deal_state ||
      item?.painState ||
      item?.pain_state ||
      item?.marketState ||
      item?.market_state ||
      item?.locationState ||
      item?.location_state
  ).toUpperCase();
}

function itemTitle(item: any, kind: Kind) {
  return clean(item?.title || item?.name || item?.headline || item?.summary, `${kind} Teaser`);
}

function itemId(item: any, kind: Kind, index = 0) {
  return clean(
    item?.id ||
      item?.roomId ||
      item?.room_id ||
      item?.dealId ||
      item?.deal_id ||
      item?.painId ||
      item?.pain_id ||
      item?.signalId ||
      item?.signal_id,
    `${kind}-${itemTitle(item, kind)}-${itemState(item)}-${index}`
  );
}

function itemKey(item: any, kind: Kind, index = 0) {
  return `${kind}:${itemId(item, kind, index)}:${itemState(item)}:${itemTitle(item, kind)}`.toLowerCase();
}

function cleanupKey(item: any, kind: Kind) {
  return `${kind}:${itemState(item)}:${itemTitle(item, kind)}:${itemId(item, kind)}`.toLowerCase();
}

function readRows(keys: string[]) {
  const rows: any[] = [];
  keys.forEach((key) => {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "[]");
      if (Array.isArray(parsed)) rows.push(...parsed);
      else if (parsed && typeof parsed === "object") rows.push(...Object.values(parsed));
    } catch {
      // ignore malformed browser data
    }
  });
  return rows;
}

function dedupe(rows: any[], kind: Kind) {
  const map = new Map<string, any>();
  rows.forEach((item, index) => {
    const key = itemKey(item, kind, index);
    if (!map.has(key)) map.set(key, item);
  });
  return Array.from(map.values());
}

function cleanupMap() {
  return readJson<Record<string, Folder>>(INVESTOR_CLEANUP_KEY, {});
}

function hiddenMap() {
  return readJson<Record<string, boolean>>(INVESTOR_HIDDEN_KEY, {});
}

function getFolder(item: any, kind: Kind): Folder {
  return cleanupMap()[cleanupKey(item, kind)] || "active";
}

function setFolderForItem(item: any, kind: Kind, folder: Folder) {
  const map = cleanupMap();
  const key = cleanupKey(item, kind);
  if (folder === "active") delete map[key];
  else map[key] = folder;
  writeJson(INVESTOR_CLEANUP_KEY, map);
  window.dispatchEvent(new Event("vaultforge-investor-room-change"));
}

function hideForever(item: any, kind: Kind) {
  const map = hiddenMap();
  map[cleanupKey(item, kind)] = true;
  writeJson(INVESTOR_HIDDEN_KEY, map);

  const cleanup = cleanupMap();
  delete cleanup[cleanupKey(item, kind)];
  writeJson(INVESTOR_CLEANUP_KEY, cleanup);

  window.dispatchEvent(new Event("vaultforge-investor-room-change"));
}

function isHidden(item: any, kind: Kind) {
  return Boolean(hiddenMap()[cleanupKey(item, kind)]);
}

function investorProfileSnapshot(investor: any) {
  return {
    photoUrl: investor?.photoUrl || "",
    contactName: investor?.contactName || "",
    company: investor?.company || "",
    email: investor?.email || "",
    phone: investor?.phone || "",
    website: investor?.website || "",
    investorTypes: investor?.investorTypes || investor?.assetTypes || [],
    buyingStrategies: investor?.buyingStrategies || investor?.buyingStrategy || [],
    assetTypes: investor?.assetTypes || [],
    statesInterested: investor?.statesInterested || [],
    countiesInterested: investor?.countiesInterested || "",
    citiesInterested: investor?.citiesInterested || "",
    minDeal: investor?.minDeal || "",
    maxDeal: investor?.maxDeal || "",
    monthlyVolume: investor?.monthlyVolume || "",
    yearlyVolume: investor?.yearlyVolume || "",
    closeSpeed: investor?.closeSpeed || "",
    proofFunds: investor?.proofFunds || "",
    directBuyer: investor?.directBuyer || "",
    fundingNeeded: investor?.fundingNeeded || "",
    openToJV: investor?.openToJV || "",
    openToWholesalers: investor?.openToWholesalers || "",
    capitalSource: investor?.capitalSource || "",
    notes: investor?.notes || "",
  };
}

function saveInvestorAdminMessage(subject: string, body: string) {
  const rows = readJson<any[]>(INVESTOR_ADMIN_MESSAGES_KEY, []);
  const investor = readJson<any>(INVESTOR_APP_KEY, {});
  const profile = investorProfileSnapshot(investor);

  rows.unshift({
    id: `investor-admin-message-${Date.now()}`,
    topic: subject || "Investor message to admin",
    subject: subject || "Investor message to admin",
    body,
    message: body,
    status: "new",
    priority: "normal",
    lane: "investor-admin",
    investorEmail: profile.email,
    investorCompany: profile.company,
    investorName: profile.contactName,
    investorPhotoUrl: profile.photoUrl,
    investorProfile: profile,
    createdAt: new Date().toISOString(),
  });

  writeJson(INVESTOR_ADMIN_MESSAGES_KEY, rows);

  const adminRows = readJson<any[]>("vaultforge_admin_messages_v1", []);
  adminRows.unshift({
    id: `investor-admin-message-${Date.now()}`,
    topic: `Investor Message: ${subject || "No subject"}`,
    body,
    email: profile.email || "",
    status: "new",
    priority: "normal",
    source: "investor-room",
    investorProfile: profile,
    createdAt: new Date().toISOString(),
  });
  writeJson("vaultforge_admin_messages_v1", adminRows);

  window.dispatchEvent(new Event("vaultforge-investor-admin-message-change"));
  window.dispatchEvent(new Event("vaultforge-admin-message-change"));
}

function saveExecutionRequest(kind: Kind, item: any, lane: any, notes: string) {
  const rows = readJson<any[]>(INVESTOR_EXECUTION_REQUESTS_KEY, []);
  const investor = readJson<any>(INVESTOR_APP_KEY, {});
  const profile = investorProfileSnapshot(investor);
  const title = itemTitle(item, kind);
  const state = itemState(item);
  const header = `${lane.title} - ${kind} - ${title} - ${state || "Unknown State"}`;

  const profileText = [
    `Investor: ${profile.contactName || "Not listed"}`,
    `Company: ${profile.company || "Not listed"}`,
    `Email: ${profile.email || "Not listed"}`,
    `Phone: ${profile.phone || "Not listed"}`,
    `Types: ${Array.isArray(profile.investorTypes) ? profile.investorTypes.join(", ") : profile.investorTypes || "Not listed"}`,
    `Strategy: ${Array.isArray(profile.buyingStrategies) ? profile.buyingStrategies.join(", ") : profile.buyingStrategies || "Not listed"}`,
    `Markets: ${Array.isArray(profile.statesInterested) ? profile.statesInterested.join(", ") : profile.statesInterested || "Not listed"}`,
    `Buy Box: ${profile.minDeal || "Not listed"} - ${profile.maxDeal || "Not listed"}`,
    `Volume: ${profile.monthlyVolume || "Not listed"} / month, ${profile.yearlyVolume || "Not listed"} / year`,
    `Close Speed: ${profile.closeSpeed || "Not listed"}`,
    `Proof of Funds: ${profile.proofFunds || "Not listed"}`,
    `Direct Buyer: ${profile.directBuyer || "Not listed"}`,
    `Funding Needed: ${profile.fundingNeeded || "Not listed"}`,
  ].join("\\n");

  rows.unshift({
    id: `execution-request-${Date.now()}`,
    requestType: lane.key,
    requestTitle: lane.title,
    kind,
    itemId: itemId(item, kind),
    title,
    state,
    roomHeader: header,
    investorEmail: profile.email,
    investorCompany: profile.company,
    investorName: profile.contactName,
    investorPhotoUrl: profile.photoUrl,
    investorProfile: profile,
    notes: notes || "",
    message: `${header}\\n\\n${notes || "Investor requested execution support."}\\n\\n--- Investor Profile Attached ---\\n${profileText}`,
    status: "new",
    createdAt: new Date().toISOString(),
  });

  writeJson(INVESTOR_EXECUTION_REQUESTS_KEY, rows);
  window.dispatchEvent(new Event("vaultforge-investor-execution-request-change"));
}

function sendRequest(kind: Kind, item: any, body: string) {
  const rows = readJson<any[]>(INVESTOR_REQUESTS_KEY, []);
  const investor = readJson<any>(INVESTOR_APP_KEY, {});
  const profile = investorProfileSnapshot(investor);
  const title = itemTitle(item, kind);
  const state = itemState(item);
  const header = `${kind} Request • ${title} • ${state || "Unknown State"}`;

  const profileText = [
    `Investor: ${profile.contactName || "Not listed"}`,
    `Company: ${profile.company || "Not listed"}`,
    `Email: ${profile.email || "Not listed"}`,
    `Phone: ${profile.phone || "Not listed"}`,
    `Types: ${Array.isArray(profile.investorTypes) ? profile.investorTypes.join(", ") : profile.investorTypes || "Not listed"}`,
    `Strategy: ${Array.isArray(profile.buyingStrategies) ? profile.buyingStrategies.join(", ") : profile.buyingStrategies || "Not listed"}`,
    `Markets: ${Array.isArray(profile.statesInterested) ? profile.statesInterested.join(", ") : profile.statesInterested || "Not listed"}`,
    `Buy Box: ${profile.minDeal || "Not listed"} - ${profile.maxDeal || "Not listed"}`,
    `Volume: ${profile.monthlyVolume || "Not listed"} / month, ${profile.yearlyVolume || "Not listed"} / year`,
    `Close Speed: ${profile.closeSpeed || "Not listed"}`,
    `Proof of Funds: ${profile.proofFunds || "Not listed"}`,
    `Direct Buyer: ${profile.directBuyer || "Not listed"}`,
    `Funding Needed: ${profile.fundingNeeded || "Not listed"}`,
  ].join("\n");

  rows.unshift({
    id: `investor-request-${Date.now()}`,
    kind,
    itemId: itemId(item, kind),
    title,
    state,
    roomHeader: header,
    investorEmail: profile.email,
    investorCompany: profile.company,
    investorName: profile.contactName,
    investorPhotoUrl: profile.photoUrl,
    investorProfile: profile,
    message: `${header}\n\n${body || "Investor requested more information."}\n\n--- Investor Profile Attached ---\n${profileText}`,
    status: "new",
    createdAt: new Date().toISOString(),
  });

  writeJson(INVESTOR_REQUESTS_KEY, rows);
  window.dispatchEvent(new Event("vaultforge-investor-request-change"));
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#05070d",
  color: "#f7f7fb",
  padding: 18,
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1320, margin: "0 auto", paddingBottom: 100 };
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 16 };
const wideGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 18 };
const hero: React.CSSProperties = {
  border: "1px solid rgba(245,197,66,.28)",
  borderRadius: 30,
  padding: 30,
  marginBottom: 20,
  background: "radial-gradient(circle at top right, rgba(245,197,66,.16), transparent 34%), linear-gradient(180deg,#080d19,#050816)",
};
const tickerWrap: React.CSSProperties = {
  borderTop: "1px solid rgba(245,197,66,.25)",
  borderBottom: "1px solid rgba(245,197,66,.25)",
  background: "#090d14",
  overflow: "hidden",
  margin: "0 0 20px",
  borderRadius: 18,
};

const tickerTrack: React.CSSProperties = {
  display: "flex",
  gap: 40,
  width: "max-content",
  padding: "14px 0",
  animation: "vfTickerMove 34s linear infinite",
};

const panel: React.CSSProperties = { background: "#121724", border: "1px solid rgba(207,216,230,.16)", borderRadius: 24, padding: 22 };
const goldPanel: React.CSSProperties = { ...panel, borderColor: "rgba(245,197,66,.52)", boxShadow: "0 0 28px rgba(245,197,66,.10)" };
const redPanel: React.CSSProperties = { ...panel, borderColor: "rgba(255,70,70,.52)", boxShadow: "0 0 28px rgba(255,70,70,.10)" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 6, fontWeight: 950, fontSize: 13, marginBottom: 12 };
const h1: React.CSSProperties = { fontSize: "clamp(42px,7vw,78px)", lineHeight: 0.9, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(28px,5vw,48px)", lineHeight: 0.96, letterSpacing: -2, margin: "0 0 14px", fontWeight: 950 };
const h3: React.CSSProperties = { fontSize: 26, margin: "0 0 10px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 20, lineHeight: 1.35, margin: 0 };
const muted: React.CSSProperties = { color: "#aeb7c7", margin: "8px 0 0", lineHeight: 1.4 };
const btn: React.CSSProperties = {
  border: "1px solid rgba(207,216,230,.18)",
  background: "#171c29",
  color: "#f7f7fb",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 950,
  textDecoration: "none",
  display: "inline-block",
  cursor: "pointer",
};
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };
const redBtn: React.CSSProperties = { ...btn, background: "#271016", borderColor: "rgba(255,70,70,.48)", color: "#ffaaaa" };
const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid rgba(207,216,230,.18)",
  background: "#111823",
  color: "#f8fafc",
  borderRadius: 16,
  padding: "14px 15px",
  fontSize: 16,
};

function LogoBlock() {
  const [index, setIndex] = useState(0);
  const src = LOGOS[index];

  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
      <div style={{ width: "min(420px,88vw)", border: "1px solid rgba(245,197,66,.28)", borderRadius: 26, padding: 16, background: "#070b14" }}>
        {src ? (
          <img
            src={src}
            alt="VaultForge"
            style={{ width: "100%", display: "block", borderRadius: 16 }}
            onError={() => setIndex((value) => (value + 1 < LOGOS.length ? value + 1 : LOGOS.length))}
          />
        ) : (
          <div style={{ minHeight: 150, display: "grid", placeItems: "center", color: "#ffd45a", fontSize: 52, fontWeight: 950 }}>VAULTFORGE</div>
        )}
      </div>
    </div>
  );
}

function TopNav({ onMessageAdmin }: { onMessageAdmin: () => void }) {
  return (
    <div style={{ ...row, justifyContent: "space-between", marginBottom: 18 }}>
      <div style={{ color: "#ffd45a", fontSize: 26, fontWeight: 950 }}>VAULTFORGE</div>
      <div style={row}>
        <Link href="/" style={btn}>Home</Link>
        <Link href="/investor-access" style={btn}>Investor Access</Link>
        <Link href="/investor-payment" style={btn}>Payment</Link>
        <button type="button" style={goldBtn} onClick={onMessageAdmin}>Message Admin</button>
        <Link href="/logout" style={btn}>Logout</Link>
        <Link href="/admin" style={redBtn}>Admin</Link>
      </div>
    </div>
  );
}

function TickerRibbon() {
  return (
    <div style={tickerWrap}>
      <div style={tickerTrack}>
        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, index) => (
          <div key={`${item}-${index}`} style={{ whiteSpace: "nowrap", color: "#ffd45a", fontWeight: 950, letterSpacing: 3 }}>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function profileScore(investor: any) {
  const fields = [
    investor?.photoUrl,
    investor?.contactName,
    investor?.company,
    investor?.email,
    investor?.phone,
    investor?.investorTypes?.length,
    investor?.buyingStrategies?.length,
    investor?.assetTypes?.length,
    investor?.statesInterested?.length,
    investor?.minDeal,
    investor?.maxDeal,
    investor?.monthlyVolume,
    investor?.yearlyVolume,
    investor?.closeSpeed,
    investor?.proofFunds,
    investor?.directBuyer,
    investor?.fundingNeeded,
  ];

  const filled = fields.filter(Boolean).length;
  return Math.min(100, Math.round((filled / fields.length) * 100));
}

function IntelligencePanel({ investor }: { investor: any }) {
  const score = profileScore(investor);
  const blurb = INTELLIGENCE_BLURBS[score % INTELLIGENCE_BLURBS.length];

  return (
    <section style={goldPanel}>
      <div style={eyebrow}>VaultForge Intelligence</div>
      <h2 style={h2}>{score}% Profile Signal</h2>
      <p style={sub}>{blurb}</p>
      <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,.08)", overflow: "hidden", marginTop: 14 }}>
        <div style={{ height: "100%", width: `${score}%`, background: "#ffdc68" }} />
      </div>
      <div style={{ ...row, marginTop: 14 }}>
        <Link href="/investor-application" style={goldBtn}>Improve Investor Profile</Link>
      </div>
    </section>
  );
}

function RequestPipeline() {
  return (
    <section style={panel}>
      <div style={eyebrow}>Request Pipeline</div>
      <div style={grid}>
        <div style={panel}><div style={eyebrow}>01 Submitted</div><p style={muted}>Investor request is captured with profile attached.</p></div>
        <div style={panel}><div style={eyebrow}>02 Routed</div><p style={muted}>VaultForge routes internally without exposing member directory.</p></div>
        <div style={panel}><div style={eyebrow}>03 Reviewed</div><p style={muted}>Admin/member reviews investor fit and request context.</p></div>
        <div style={panel}><div style={eyebrow}>04 Approved</div><p style={muted}>Contact or deeper access can be shared only after approval.</p></div>
      </div>
    </section>
  );
}

function UrgencyBadges({ kind }: { kind: Kind }) {
  const badges = kind === "Deal"
    ? ["OFF MARKET", "ARV SIGNAL", "FUNDING AVAILABLE", "EXECUTION NETWORK", "REQUEST CONTROLLED"]
    : ["DISTRESS", "CAPITAL GAP", "OPERATOR NEEDED", "URGENT SIGNAL", "PRIVATE ROUTING"];

  return (
    <div style={{ ...row, marginTop: 10 }}>
      {badges.map((badge) => (
        <span key={badge} style={{ border: "1px solid rgba(245,197,66,.32)", borderRadius: 999, padding: "8px 11px", color: "#ffd45a", background: "rgba(245,197,66,.07)", fontWeight: 900, fontSize: 12 }}>
          {badge}
        </span>
      ))}
    </div>
  );
}

function Metric({ title, count, note, active, onClick }: { title: string; count: number | string; note: string; active?: boolean; onClick?: () => void }) {
  return (
    <button type="button" style={{ ...(active ? goldPanel : panel), width: "100%", textAlign: "left" }} onClick={onClick}>
      <div style={eyebrow}>{title}</div>
      <h2 style={h2}>{count}</h2>
      <p style={muted}>{note}</p>
    </button>
  );
}

function MiniValues({ item }: { item: any }) {
  const city = item?.city || item?.market || item?.area || "Market not listed";
  const asset = item?.assetType || item?.asset_type || item?.type || "Asset not listed";
  const price = item?.askingPrice || item?.asking_price || item?.price || item?.amount || "Not listed";
  const repairs = item?.repairs || item?.repairEstimate || item?.repair_estimate || "Not listed";
  const arv = item?.arv || item?.afterRepairValue || item?.after_repair_value || "Not listed";

  return (
    <>
      <p style={sub}>{city} • {asset}</p>
      <div style={{ marginTop: 14 }}>
        <div style={eyebrow}>Asking / Need</div><p style={muted}>{String(price)}</p>
        <div style={eyebrow}>Repairs</div><p style={muted}>{String(repairs)}</p>
        <div style={eyebrow}>ARV / Value</div><p style={muted}>{String(arv)}</p>
      </div>
    </>
  );
}

function RoomCard({
  kind,
  item,
  isOpen,
  onOpen,
  onClose,
  onMove,
  onRestore,
  onDeleteForever,
}: {
  kind: Kind;
  item: any;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onMove: (folder: Folder) => void;
  onRestore: () => void;
  onDeleteForever: () => void;
}) {
  const folder = getFolder(item, kind);
  const wrapper = folder === "deleted" ? redPanel : folder === "saved" ? goldPanel : panel;
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const header = `${kind} Request • ${itemTitle(item, kind)} • ${itemState(item) || "Unknown State"}`;

  return (
    <div style={isOpen ? goldPanel : wrapper}>
      <div style={eyebrow}>{kind} • {itemState(item) || "NA"} {folder !== "active" ? `• ${folder}` : ""}</div>
      <h2 style={h2}>{itemTitle(item, kind)}</h2>
      <MiniValues item={item} />
      <p style={{ ...muted, marginTop: 14 }}>
        Member information, seller information, private notes, routing notes, and contact details are hidden until deeper access is approved.
      </p>

      <div style={{ ...row, marginTop: 14 }}>
        <button type="button" style={goldBtn} onClick={isOpen ? onClose : onOpen}>
          {isOpen ? "Collapse / Done" : "Open Details"}
        </button>
        <button type="button" style={btn} onClick={() => onMove("saved")}>Save</button>
        <button type="button" style={btn} onClick={() => onMove("archived")}>Archive</button>
        <button type="button" style={redBtn} onClick={() => onMove("deleted")}>Delete</button>
        {folder !== "active" ? <button type="button" style={btn} onClick={onRestore}>Restore</button> : null}
        {folder === "deleted" ? <button type="button" style={redBtn} onClick={onDeleteForever}>Delete Forever</button> : null}
      </div>

      {isOpen ? (
        <div style={{ ...panel, marginTop: 16 }}>
          <div style={eyebrow}>Room Detail Open</div>
          <p style={sub}>{header}</p>
          <p style={muted}>
            This detail is expanded inside the same card. Collapse / Done closes it without moving the card list.
          </p>

          <div style={{ ...panel, marginTop: 14 }}>
            <div style={eyebrow}>Private Data Hidden</div>
            <p style={muted}>
              This investor lane does not expose member name, member phone, member email, seller info, exact private notes, docs, routing notes, or full room intelligence.
            </p>
          </div>

          <label style={{ display: "grid", gap: 8, marginTop: 14 }}>
            <span style={eyebrow}>Message With Room Header</span>
            <textarea
              style={{ ...input, minHeight: 120 }}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="I am interested. Send more information. I can close with..."
            />
          </label>

          <div style={{ ...row, marginTop: 12 }}>
            <button
              type="button"
              style={goldBtn}
              onClick={() => {
                sendRequest(kind, item, message);
                setSent(true);
              }}
            >
              Send Request Through VaultForge
            </button>
            <button type="button" style={btn} onClick={() => onMove("saved")}>Save</button>
            <button type="button" style={btn} onClick={() => onMove("archived")}>Archive</button>
            <button type="button" style={redBtn} onClick={() => onMove("deleted")}>Delete</button>
            <button type="button" style={btn} onClick={onClose}>Collapse / Done</button>
          </div>

          {sent ? <p style={muted}>Request sent to VaultForge admin/member workflow.</p> : null}
        </div>
      ) : null}
    </div>
  );
}




function MessageAdminModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 110, background: "rgba(0,0,0,.78)", padding: 18, overflow: "auto" }}>
      <div style={{ maxWidth: 820, margin: "40px auto", ...goldPanel }}>
        <div style={{ ...row, justifyContent: "space-between" }}>
          <div>
            <div style={eyebrow}>Investor Message Admin</div>
            <h2 style={h2}>Contact VaultForge Admin</h2>
          </div>
          <button type="button" style={btn} onClick={onClose}>Close</button>
        </div>

        <p style={sub}>Your investor profile is attached so admin can see who is asking.</p>

        <label style={{ display: "grid", gap: 8, marginTop: 14 }}>
          <span style={eyebrow}>Subject</span>
          <input style={input} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Question about investor access, funding, a deal, or support..." />
        </label>

        <label style={{ display: "grid", gap: 8, marginTop: 14 }}>
          <span style={eyebrow}>Message</span>
          <textarea style={{ ...input, minHeight: 150 }} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write your message to VaultForge admin..." />
        </label>

        <div style={{ ...row, marginTop: 14 }}>
          <button
            type="button"
            style={goldBtn}
            onClick={() => {
              saveInvestorAdminMessage(subject, body || "Investor requested admin support.");
              setSent(true);
              setSubject("");
              setBody("");
            }}
          >
            Send Message Admin
          </button>
          <button type="button" style={btn} onClick={onClose}>Collapse / Done</button>
        </div>

        {sent ? <p style={{ ...sub, marginTop: 14 }}>Message sent to VaultForge admin.</p> : null}
      </div>
    </div>
  );
}

function ExecutionRequestModal({
  lane,
  activeRoom,
  onClose,
}: {
  lane: any;
  activeRoom: ActiveRoom;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState("");
  const [sent, setSent] = useState(false);

  if (!lane) return null;

  const kind: Kind = activeRoom?.kind || "Deal";
  const item = activeRoom?.item || { title: "General Investor Execution Request", state: "NA" };
  const header = activeRoom
    ? `${lane.title} - ${kind} - ${itemTitle(item, kind)} - ${itemState(item) || "Unknown State"}`
    : `${lane.title} - General Investor Execution Request`;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,.78)", padding: 18, overflow: "auto" }}>
      <div style={{ maxWidth: 880, margin: "40px auto", ...goldPanel }}>
        <div style={{ ...row, justifyContent: "space-between" }}>
          <div>
            <div style={eyebrow}>Execution Request</div>
            <h2 style={h2}>{lane.title}</h2>
          </div>
          <button type="button" style={btn} onClick={onClose}>Close</button>
        </div>

        <p style={sub}>{header}</p>
        <p style={muted}>{lane.note}</p>

        <div style={{ ...panel, marginTop: 16 }}>
          <div style={eyebrow}>Controlled Routing</div>
          <p style={muted}>
            This does not expose the member directory. VaultForge routes your request internally with your investor profile attached.
          </p>
        </div>

        <label style={{ display: "grid", gap: 8, marginTop: 14 }}>
          <span style={eyebrow}>Request Notes</span>
          <textarea
            style={{ ...input, minHeight: 150 }}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Describe what you need. Example: need 80% LTC hard money, closing in 14 days, contractor bid needed, title issue help..."
          />
        </label>

        <div style={{ ...row, marginTop: 14 }}>
          <button
            type="button"
            style={goldBtn}
            onClick={() => {
              saveExecutionRequest(kind, item, lane, notes);
              setSent(true);
            }}
          >
            Send Execution Request
          </button>
          <button type="button" style={btn} onClick={onClose}>Collapse / Done</button>
        </div>

        {sent ? <p style={{ ...sub, marginTop: 14 }}>Execution request sent to VaultForge routing.</p> : null}
      </div>
    </div>
  );
}

function ExecutionLaneCards({
  activeRoom,
  onSelect,
}: {
  activeRoom: ActiveRoom;
  onSelect: (lane: any) => void;
}) {
  return (
    <section style={{ ...hero, marginTop: 18 }}>
      <div style={eyebrow}>One-Stop-Shop Execution Requests</div>
      <h2 style={h2}>Need help completing this opportunity?</h2>
      <p style={sub}>
        Request funding, title, contractor, operator, insurance, property management, JV, or boots-on-ground support without exposing private member data. Open a Deal/Pain card first to attach the request to that room, or send a general execution request.
      </p>

      <div style={{ ...grid, marginTop: 18 }}>
        {EXECUTION_LANES.map((lane) => (
          <button key={lane.key} type="button" style={panel} onClick={() => onSelect(lane)}>
            <div style={eyebrow}>{lane.title}</div>
            <p style={muted}>{lane.note}</p>
          </button>
        ))}
      </div>
    </section>
  );
}


export default function InvestorRoomPage() {
  const [investor, setInvestor] = useState<any>({});
  const [state, setState] = useState("GA");
  const [kind, setKind] = useState<Kind>("Deal");
  const [folder, setFolder] = useState<Folder>("active");
  const [activeRoom, setActiveRoom] = useState<ActiveRoom>(null);
  const [selectedExecutionLane, setSelectedExecutionLane] = useState<any>(null);
  const [messageAdminOpen, setMessageAdminOpen] = useState(false);
  const [tick, setTick] = useState(0);

  function refresh() {
    setTick((value) => value + 1);
  }

  useEffect(() => {
    const update = () => {
      setInvestor(readJson<any>(INVESTOR_APP_KEY, {}));
      refresh();
    };
    update();
    window.addEventListener("storage", update);
    window.addEventListener("vaultforge-investor-change", update);
    window.addEventListener("vaultforge-investor-room-change", update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener("vaultforge-investor-change", update);
      window.removeEventListener("vaultforge-investor-room-change", update);
    };
  }, []);

  const access = investor?.paymentStatus === "paid" || investor?.accessStatus === "active" || investor?.access === "active";

  const rawDeals = useMemo(() => {
    const rows = readRows(["vaultforge_clean_deal_rooms", "vaultforge_deal_rooms", "vaultforge_rooms_deals", "vf_deal_rooms"]);
    return dedupe(rows, "Deal").filter((item) => itemState(item) === state && !isHidden(item, "Deal"));
  }, [state, tick]);

  const rawPains = useMemo(() => {
    const rows = readRows(["vaultforge_clean_pain_rooms", "vaultforge_clean_pain_rooms_v1", "vaultforge_clean_pain_rooms_v2", "vaultforge_pain_rooms", "vaultforge_rooms_pain", "vf_pain_rooms"]);
    return dedupe(rows, "Pain").filter((item) => itemState(item) === state && !isHidden(item, "Pain"));
  }, [state, tick]);

  const activeDeals = rawDeals.filter((item) => getFolder(item, "Deal") === "active");
  const savedDeals = rawDeals.filter((item) => getFolder(item, "Deal") === "saved");
  const archivedDeals = rawDeals.filter((item) => getFolder(item, "Deal") === "archived");
  const deletedDeals = rawDeals.filter((item) => getFolder(item, "Deal") === "deleted");

  const activePains = rawPains.filter((item) => getFolder(item, "Pain") === "active");
  const savedPains = rawPains.filter((item) => getFolder(item, "Pain") === "saved");
  const archivedPains = rawPains.filter((item) => getFolder(item, "Pain") === "archived");
  const deletedPains = rawPains.filter((item) => getFolder(item, "Pain") === "deleted");

  const currentItems =
    kind === "Deal"
      ? folder === "saved"
        ? savedDeals
        : folder === "archived"
          ? archivedDeals
          : folder === "deleted"
            ? deletedDeals
            : activeDeals
      : folder === "saved"
        ? savedPains
        : folder === "archived"
          ? archivedPains
          : folder === "deleted"
            ? deletedPains
            : activePains;

  function openKind(nextKind: Kind) {
    setKind(nextKind);
    setFolder("active");
    setActiveRoom(null);
  }

  function openFolder(nextKind: Kind, nextFolder: Folder) {
    setKind(nextKind);
    setFolder(nextFolder);
    setActiveRoom(null);
  }

  if (!access) {
    return (
      <main style={page}>
      <style>{`@keyframes vfTickerMove { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
        <div style={wrap}>
          <TopNav onMessageAdmin={() => setMessageAdminOpen(true)} />
          <section style={hero}>
            <LogoBlock />
            <div style={eyebrow}>Investor Room Locked</div>
            <h1 style={h1}>Approval and payment required.</h1>
            <p style={sub}>Complete the investor application and payment before entering the investor visitor room.</p>
            <div style={{ ...row, marginTop: 18 }}>
              <Link href="/investor-application" style={goldBtn}>Investor Application</Link>
              <Link href="/investor-payment" style={btn}>Investor Payment</Link>
              <Link href="/investor-access" style={btn}>Investor Access</Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main style={page}>
      <div style={wrap}>
        <TopNav onMessageAdmin={() => setMessageAdminOpen(true)} />
        <TickerRibbon />
        <MessageAdminModal open={messageAdminOpen} onClose={() => setMessageAdminOpen(false)} />

        <section style={hero}>
          <LogoBlock />
          <div style={eyebrow}>VaultForge Investor Visitor Room</div>
          <h1 style={h1}>Controlled deal and pain access.</h1>
          <p style={sub}>Browse limited state teaser cards and request more information through VaultForge. This room is separate from the private member network.</p>
          <div style={{ ...row, marginTop: 22 }}>
            <button type="button" style={kind === "Deal" && folder === "active" ? goldBtn : btn} onClick={() => openKind("Deal")}>Deal Signals</button>
            <button type="button" style={kind === "Pain" && folder === "active" ? goldBtn : btn} onClick={() => openKind("Pain")}>Pain Signals</button>
            <button type="button" style={btn} onClick={() => { setFolder("active"); setActiveRoom(null); }}>Collapse / Done</button>
          </div>
        </section>

        <section style={{ marginBottom: 18 }}>
          <IntelligencePanel investor={investor} />
        </section>

        <section style={goldPanel}>
          <div style={eyebrow}>State Desk</div>
          <div style={row}>
            {STATES.map((stateCode) => (
              <button key={stateCode} type="button" style={stateCode === state ? goldBtn : btn} onClick={() => { setState(stateCode); setFolder("active"); setActiveRoom(null); }}>
                {stateCode}
              </button>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 18 }}>
          <div style={grid}>
            <Metric title="Deal Signals" count={activeDeals.length} note={`active opportunity cards in ${state}`} active={kind === "Deal" && folder === "active"} onClick={() => openKind("Deal")} />
            <Metric title="Pain Signals" count={activePains.length} note={`active pressure cards in ${state}`} active={kind === "Pain" && folder === "active"} onClick={() => openKind("Pain")} />
            <Metric title="Requests" count={readJson<any[]>(INVESTOR_REQUESTS_KEY, []).length} note="requests sent through VaultForge" />
            <Metric title="Saved Deals" count={savedDeals.length} note="saved deal cards" active={kind === "Deal" && folder === "saved"} onClick={() => openFolder("Deal", "saved")} />
            <Metric title="Archived Deals" count={archivedDeals.length} note="archived deal cards" active={kind === "Deal" && folder === "archived"} onClick={() => openFolder("Deal", "archived")} />
            <Metric title="Deleted Deals" count={deletedDeals.length} note="deleted deal cards" active={kind === "Deal" && folder === "deleted"} onClick={() => openFolder("Deal", "deleted")} />
            <Metric title="Saved Pain" count={savedPains.length} note="saved pain cards" active={kind === "Pain" && folder === "saved"} onClick={() => openFolder("Pain", "saved")} />
            <Metric title="Archived Pain" count={archivedPains.length} note="archived pain cards" active={kind === "Pain" && folder === "archived"} onClick={() => openFolder("Pain", "archived")} />
            <Metric title="Deleted Pain" count={deletedPains.length} note="deleted pain cards" active={kind === "Pain" && folder === "deleted"} onClick={() => openFolder("Pain", "deleted")} />
          </div>
        </section>

        <section style={{ marginTop: 22 }}>
          <div style={{ ...row, justifyContent: "space-between", marginBottom: 12 }}>
            <div style={eyebrow}>{folder === "active" ? `${kind} Cards • ${state}` : `${kind} ${folder} Folder • ${state}`}</div>
            {folder !== "active" ? <button type="button" style={btn} onClick={() => { setFolder("active"); setActiveRoom(null); }}>Collapse Folder / Done</button> : null}
          </div>

          <div style={wideGrid}>
            {currentItems.length ? (
              currentItems.map((item, index) => (
                <RoomCard
                  key={`${kind}-${folder}-${itemKey(item, kind, index)}`}
                  kind={kind}
                  item={item}
                  isOpen={activeRoom?.kind === kind && cleanupKey(activeRoom.item, kind) === cleanupKey(item, kind)}
                  onOpen={() => setActiveRoom({ kind, item })}
                  onClose={() => setActiveRoom(null)}
                  onMove={(nextFolder) => { setFolderForItem(item, kind, nextFolder); setActiveRoom(null); refresh(); }}
                  onRestore={() => { setFolderForItem(item, kind, "active"); setActiveRoom(null); refresh(); }}
                  onDeleteForever={() => { hideForever(item, kind); setActiveRoom(null); refresh(); }}
                />
              ))
            ) : (
              <div style={panel}>
                <h2 style={h2}>No {folder} {kind.toLowerCase()} cards.</h2>
                <p style={sub}>Use the dashboard cards above to switch folders or return to active cards.</p>
              </div>
            )}
          </div>
        </section>

        <ExecutionLaneCards activeRoom={activeRoom} onSelect={setSelectedExecutionLane} />
        <ExecutionRequestModal lane={selectedExecutionLane} activeRoom={activeRoom} onClose={() => setSelectedExecutionLane(null)} />

        <section style={{ marginTop: 18 }}>
          <RequestPipeline />
        </section>

        <section style={{ ...hero, marginTop: 24 }}>
          <div style={eyebrow}>Network Capabilities Through Members</div>
          <h2 style={h2}>One-stop execution support.</h2>
          <p style={sub}>Funding, title/closing, contractors, operators, insurance, and execution partners are available through the private member network after member/admin approval.</p>
          <div style={{ ...grid, marginTop: 18 }}>
            <div style={panel}><div style={eyebrow}>Funding</div><p style={muted}>Private lenders, hard money, bridge, equity, and capital introductions through members.</p></div>
            <div style={panel}><div style={eyebrow}>Title / Closing</div><p style={muted}>Closing support and transaction coordination through approved network relationships.</p></div>
            <div style={panel}><div style={eyebrow}>Contractors</div><p style={muted}>Rehab, construction, repairs, inspections, and field execution routed through members.</p></div>
            <div style={panel}><div style={eyebrow}>Operators</div><p style={muted}>Asset operators, acquisition/disposition support, management, and execution partners.</p></div>
            <div style={panel}><div style={eyebrow}>Insurance</div><p style={muted}>Coverage support and property-risk routing through approved member resources.</p></div>
            <div style={panel}><div style={eyebrow}>Admin Control</div><p style={muted}>No direct contact is exposed until the member/admin workflow approves deeper access.</p></div>
          </div>
        </section>
      </div>
    </main>
  );
}
