"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import VaultForgeRoomCommandBar from "../../components/VaultForgeRoomCommandBar";
import VaultForgeRoomMemberMatch from "../../components/VaultForgeRoomMemberMatch";

type Deal = Record<string, any>;

const shell: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(181,92,255,.20), transparent 28%), radial-gradient(circle at top right, rgba(157,243,191,.13), transparent 24%), radial-gradient(circle at bottom right, rgba(232,196,107,.14), transparent 28%), linear-gradient(180deg,#02040a 0%,#071326 45%,#030509 100%)",
  color: "white",
  padding: "26px 18px 90px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
};

const nav: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginBottom: 24,
};

const navLink: React.CSSProperties = {
  color: "#06100a",
  background: "linear-gradient(135deg,#f5d978,#9df3bf 55%,#b55cff)",
  textDecoration: "none",
  borderRadius: 999,
  padding: "12px 16px",
  fontWeight: 900,
  border: "none",
  cursor: "pointer",
};

const ghost: React.CSSProperties = {
  color: "white",
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,.18)",
  borderRadius: 999,
  padding: "12px 16px",
  fontWeight: 900,
  background: "linear-gradient(135deg, rgba(181,92,255,.16), rgba(255,255,255,.05))",
};

const hero: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.16)",
  background:
    "linear-gradient(135deg, rgba(181,92,255,.16), rgba(157,243,191,.075), rgba(255,255,255,.03))",
  borderRadius: 34,
  padding: "28px 22px",
  marginBottom: 22,
  boxShadow: "0 38px 115px rgba(0,0,0,.52)",
};

const section: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.13)",
  background: "linear-gradient(145deg, rgba(181,92,255,.095), rgba(157,243,191,.05), rgba(255,255,255,.03))",
  borderRadius: 30,
  padding: 22,
  marginBottom: 20,
};

const tightPanel: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 18,
  padding: 14,
  background: "rgba(0,0,0,.16)",
};

const contactSection: React.CSSProperties = {
  ...section,
  border: "1px solid rgba(232,196,107,.32)",
  background:
    "linear-gradient(145deg, rgba(232,196,107,.13), rgba(157,243,191,.075), rgba(255,255,255,.035))",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  gap: 16,
};

const muted: React.CSSProperties = {
  color: "rgba(255,255,255,.70)",
  lineHeight: 1.5,
  fontSize: 16,
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: 5,
  fontWeight: 900,
  fontSize: 12,
  marginBottom: 12,
  textTransform: "uppercase",
};

const pill: React.CSSProperties = {
  display: "inline-block",
  color: "#9df3bf",
  border: "1px solid rgba(157,243,191,.35)",
  borderRadius: 999,
  padding: "7px 12px",
  fontSize: 12,
  letterSpacing: 1.4,
  margin: "0 8px 10px 0",
  fontWeight: 900,
};

const chip: React.CSSProperties = {
  border: "1px solid rgba(157,243,191,.22)",
  borderRadius: 999,
  padding: "7px 10px",
  color: "#9df3bf",
  background: "rgba(157,243,191,.07)",
  fontSize: 12,
  fontWeight: 850,
  display: "inline-flex",
};

const image: React.CSSProperties = {
  width: "100%",
  borderRadius: 24,
  display: "block",
  border: "1px solid rgba(255,255,255,.12)",
  objectFit: "cover",
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.16)",
  background: "linear-gradient(135deg, rgba(181,92,255,.13), rgba(255,255,255,.06))",
  color: "white",
  padding: 14,
  fontSize: 16,
};

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function getEmail() {
  if (typeof window === "undefined") return "";

  return (
    window.localStorage.getItem("vf_email") ||
    window.sessionStorage.getItem("vf_email") ||
    "text@text.com"
  )
    .trim()
    .toLowerCase();
}

function requestHeaders() {
  return {
    "Content-Type": "application/json",
    "x-vf-email": getEmail(),
  };
}

function money(value: unknown) {
  const raw = String(value || "").replace(/[^0-9.-]/g, "");
  const n = Number(raw || 0);

  if (!n) return "Not listed";

  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function valueOf(deal: Deal | null, keys: string[]) {
  if (!deal) return "";

  for (const key of keys) {
    const value = deal[key];

    if (
      value !== null &&
      value !== undefined &&
      value !== "" &&
      !(Array.isArray(value) && value.length === 0)
    ) {
      return value;
    }
  }

  return "";
}

function isEmpty(value: any) {
  return (
    value === null ||
    value === undefined ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  );
}

function formatValue(value: any) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") return item.url || item.publicUrl || item.public_url || JSON.stringify(item);
        return String(item || "");
      })
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function phoneHref(value: unknown) {
  const digits = clean(value).replace(/[^0-9+]/g, "");
  return digits ? `tel:${digits}` : "";
}

function emailHref(value: unknown, subject: string) {
  const email = clean(value);
  if (!email || !email.includes("@")) return "";
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}

function parsePhotoArray(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item: any) => {
        if (typeof item === "string") return clean(item);
        if (item && typeof item === "object") {
          return clean(item.url || item.publicUrl || item.public_url || item.photo_url || item.image_url || item.main_photo_url || item.src);
        }
        return "";
      })
      .filter((url) => url.startsWith("http"));
  }

  const text = clean(value);
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    return parsePhotoArray(parsed);
  } catch {
    return text
      .split(/[,|;\n]+/)
      .map((item) => item.trim())
      .filter((url) => url.startsWith("http"));
  }
}

function numberValue(value: any) {
  const cleanValue = String(value || "").replace(/[^0-9.-]/g, "");
  const n = Number(cleanValue);
  return Number.isFinite(n) ? n : 0;
}

function Field({ label, value }: { label: string; value: any }) {
  if (isEmpty(value)) return null;

  return (
    <div style={section}>
      <div style={eyebrow}>{label}</div>
      <p style={{ ...muted, fontSize: 20, margin: 0, overflowWrap: "break-word" }}>
        {formatValue(value)}
      </p>
    </div>
  );
}

function MiniMetric({ labelText, value, emphasis = false }: { labelText: string; value: unknown; emphasis?: boolean }) {
  return (
    <div style={tightPanel}>
      <div style={eyebrow}>{labelText}</div>
      <div style={{ fontSize: emphasis ? 28 : 20, fontWeight: 950, marginTop: 8, lineHeight: 1.05 }}>
        {clean(value) || "Not listed"}
      </div>
    </div>
  );
}

function ScoreStrip({ labelText, value }: { labelText: string; value: number }) {
  const safe = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontWeight: 950, fontSize: 12 }}>
        <span>{labelText}</span>
        <span>{safe}%</span>
      </div>
      <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,.12)", overflow: "hidden", marginTop: 8 }}>
        <div style={{ width: `${safe}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#ff6b6b,#f8e7b0,#56d8ff)" }} />
      </div>
    </div>
  );
}

function IntelligencePanel({ title, children, tone = "gold" }: { title: string; children: React.ReactNode; tone?: "gold" | "red" | "green" | "blue" }) {
  const color = tone === "red" ? "#fecaca" : tone === "green" ? "#9df3bf" : tone === "blue" ? "#56d8ff" : "#e8c46b";

  return (
    <div style={{ ...tightPanel, borderColor: `${color}55` }}>
      <div style={{ ...eyebrow, color }}>{title}</div>
      <div style={{ ...muted, marginTop: 9, fontSize: 16 }}>{children}</div>
    </div>
  );
}

function resolveBrowserId(paramsId: string) {
  if (typeof window === "undefined") return paramsId || "";

  const queryId = new URLSearchParams(window.location.search).get("id") || "";
  if (queryId) return queryId;

  if (paramsId) return paramsId;

  const pathParts = window.location.pathname.split("/").filter(Boolean);
  return decodeURIComponent(pathParts[pathParts.length - 1] || "");
}

function titleOf(deal: Deal | null) {
  return valueOf(deal, ["title", "deal_title", "project_title", "headline"]) || "Untitled Opportunity";
}

function marketOf(deal: Deal | null) {
  const city = valueOf(deal, ["city"]);
  const county = valueOf(deal, ["county", "county_name", "market_county"]);
  const state = valueOf(deal, ["state"]);
  return [city, county, state].filter(Boolean).join(", ") || valueOf(deal, ["address", "location", "property_address"]) || "Market not listed";
}

function assetType(deal: Deal | null) {
  return valueOf(deal, ["property_type", "deal_type", "asset_type", "asset_class"]) || "Opportunity";
}

function dealText(deal: Deal | null) {
  return [
    titleOf(deal),
    marketOf(deal),
    assetType(deal),
    valueOf(deal, ["description", "ai_summary", "route_summary", "routing_summary"]),
    valueOf(deal, ["seller_situation", "distress_signals", "deal_needs", "routing_needs", "needs"]),
    valueOf(deal, ["strategy", "exit_strategy"]),
    valueOf(deal, ["occupancy", "tenant_status", "access_notes"]),
  ]
    .map(clean)
    .join(" ")
    .toLowerCase();
}

function askValue(deal: Deal | null) {
  return numberValue(valueOf(deal, ["asking_price", "price", "purchase_price", "target_price"]));
}

function arvValue(deal: Deal | null) {
  return numberValue(valueOf(deal, ["arv", "arv_value", "estimated_value", "after_repair_value", "property_value"]));
}

function repairValue(deal: Deal | null) {
  return numberValue(valueOf(deal, ["repair_estimate", "repairs_needed", "estimated_repairs", "repair_budget", "rehab_budget"]));
}

function spreadValue(deal: Deal | null) {
  const ask = askValue(deal);
  const arv = arvValue(deal);
  const repairs = repairValue(deal);
  if (!ask || !arv) return 0;
  return arv - ask - repairs;
}

function marginValue(deal: Deal | null) {
  const arv = arvValue(deal);
  const spread = spreadValue(deal);
  if (!arv || !spread) return 0;
  return Math.round((spread / arv) * 100);
}

function clamp(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function photosOf(deal: Deal | null) {
  if (!deal) return [];
  const next = [
    ...parsePhotoArray(deal.photo_urls),
    ...parsePhotoArray(deal.photos),
    ...parsePhotoArray(deal.files),
    ...parsePhotoArray(deal.uploads),
  ];

  for (const key of ["main_photo_url", "image_url", "photo_url", "primary_photo_url"]) {
    const url = clean(deal[key]);
    if (url.startsWith("http")) next.unshift(url);
  }

  return Array.from(new Set(next));
}

function opportunityScore(deal: Deal | null) {
  const spread = spreadValue(deal);
  const margin = marginValue(deal);
  const text = dealText(deal);
  let score = 38;

  if (spread > 0) score += 18;
  if (margin >= 25) score += 24;
  if (margin >= 15 && margin < 25) score += 12;
  if (askValue(deal) && arvValue(deal) && spread <= 0) score -= 18;
  if (text.includes("off-market") || text.includes("motivated") || text.includes("seller")) score += 8;
  if (text.includes("seller finance") || text.includes("creative") || text.includes("subto")) score += 10;
  if (assetType(deal).toLowerCase().includes("land") && valueOf(deal, ["zoning", "utilities", "road_access"])) score += 8;
  if (photosOf(deal).length) score += 8;
  if (valueOf(deal, ["owner_phone", "contact_phone", "owner_contact_email", "contact_email"])) score += 6;

  return clamp(score);
}

function riskScore(deal: Deal | null) {
  const text = dealText(deal);
  const ask = askValue(deal);
  const arv = arvValue(deal);
  const repairs = repairValue(deal);
  let score = 32;

  if (ask && arv && ask >= arv * 0.82) score += 20;
  if (repairs && arv && repairs >= arv * 0.18) score += 18;
  if (text.includes("title") || text.includes("probate") || text.includes("lien")) score += 20;
  if (text.includes("tenant") || text.includes("occupied")) score += 12;
  if (text.includes("permit") || text.includes("code") || text.includes("city")) score += 12;
  if (!photosOf(deal).length) score += 8;
  if (!valueOf(deal, ["owner_phone", "contact_phone", "owner_contact_email", "contact_email"])) score += 8;

  return clamp(score);
}

function liquidityScore(deal: Deal | null) {
  const text = dealText(deal);
  const asset = assetType(deal).toLowerCase();
  let score = 40;

  if (asset.includes("residential") || asset.includes("single")) score += 14;
  if (asset.includes("commercial")) score += 2;
  if (asset.includes("land")) score -= 8;
  if (spreadValue(deal) > 0 && marginValue(deal) >= 20) score += 18;
  if (text.includes("rural")) score -= 8;
  if (text.includes("tenant") || text.includes("occupied")) score -= 6;

  return clamp(score);
}

function dataConfidence(deal: Deal | null) {
  let score = 20;
  if (marketOf(deal) !== "Market not listed") score += 10;
  if (askValue(deal)) score += 10;
  if (arvValue(deal)) score += 10;
  if (repairValue(deal)) score += 8;
  if (photosOf(deal).length) score += 14;
  if (valueOf(deal, ["address", "location", "property_address"])) score += 8;
  if (valueOf(deal, ["owner_phone", "contact_phone", "owner_contact_email", "contact_email"])) score += 10;
  if (valueOf(deal, ["description", "seller_situation", "private_notes"])) score += 10;
  return clamp(score);
}

function opportunityGrade(deal: Deal | null) {
  const opp = opportunityScore(deal);
  const risk = riskScore(deal);
  const net = opp - risk * 0.35;

  if (net >= 70) return "A";
  if (net >= 58) return "B+";
  if (net >= 48) return "B";
  if (net >= 35) return "C / Needs Rewrite";
  return "Trap Risk";
}

function goodBadRead(deal: Deal | null) {
  const spread = spreadValue(deal);
  const margin = marginValue(deal);
  const risk = riskScore(deal);

  if (spread > 0 && margin >= 25 && risk < 55) return "GOOD: Strong enough spread to justify controlled routing after verification.";
  if (spread > 0 && margin >= 15) return "MIXED: There may be a deal, but pricing, repairs, or execution risk must be tightened.";
  if (askValue(deal) && arvValue(deal) && spread <= 0) return "BAD AS WRITTEN: Current numbers do not support a normal investor path. Strategy must be rewritten.";
  if (!askValue(deal) || !arvValue(deal)) return "UNKNOWN: Missing pricing/value intelligence blocks a real good/bad decision.";
  return "NEEDS TRIAGE: Do not treat as a clean deal until the missing execution facts are verified.";
}

function structureRecommendation(deal: Deal | null) {
  const text = dealText(deal);
  const asset = assetType(deal).toLowerCase();
  const spread = spreadValue(deal);
  const margin = marginValue(deal);

  if (text.includes("seller finance") || text.includes("creative") || text.includes("subto")) return "Creative finance / seller finance path. Verify seller motivation, debt, payoff, payment terms, and legal structure.";
  if (text.includes("foreclosure") || text.includes("deadline") || text.includes("urgent")) return "Fast cash or bridge rescue first. Keep novation/seller finance as backup only if the deadline allows.";
  if (text.includes("contractor") || text.includes("repair") || text.includes("stalled")) return "Contractor-led stabilization, then disposition. Do not route buyer traffic until scope is priced.";
  if (asset.includes("land")) return "Developer/builder route. Confirm zoning, utilities, access, frontage, entitlement path, and builder demand.";
  if (asset.includes("commercial")) return "Commercial operator route. Underwrite income, tenancy, repositioning cost, cap rate, and debt fit.";
  if (spread > 0 && margin >= 25) return "Private investor route: fix/flip, wholetail, or rental buyer. Keep exposure controlled.";
  if (spread > 0 && margin >= 12) return "Tight-spread strategy: renegotiate, novation, wholetail, or buyer-specific route only.";
  if (askValue(deal) && arvValue(deal) && spread <= 0) return "Rewrite required: price reduction, seller finance, novation, JV, or abandon.";
  return "Hold multiple structures open until price, value, repairs, and source motivation are verified.";
}

function buyerFit(deal: Deal | null) {
  const text = dealText(deal);
  const asset = assetType(deal).toLowerCase();

  if (asset.includes("land")) return "Builder / developer / land buyer";
  if (asset.includes("commercial")) return "Commercial operator / owner-user / income investor";
  if (text.includes("seller finance") || text.includes("creative") || text.includes("subto")) return "Creative finance operator";
  if (text.includes("heavy repair") || text.includes("contractor") || text.includes("stalled")) return "Hands-on rehab operator / contractor-backed buyer";
  if (marginValue(deal) >= 25) return "Fix-flip buyer / local rental operator";
  if (marginValue(deal) > 0 && marginValue(deal) < 20) return "Buyer-specific route only; broad investor blast may fail";
  return "Unknown until numbers and condition are verified";
}

function capitalPath(deal: Deal | null) {
  const text = dealText(deal);

  if (text.includes("seller finance") || text.includes("creative") || text.includes("subto")) return "Seller carry, subject-to, wrap, or hybrid creative structure after legal review.";
  if (text.includes("commercial")) return "Commercial debt, private bridge, DSCR, seller carry, or operator equity.";
  if (text.includes("land")) return "Cash buyer, builder deposit, seller carry, entitlement JV, or land bank capital.";
  if (repairValue(deal) > 0) return "Hard money/private lender plus verified repair scope. Avoid soft repair assumptions.";
  if (spreadValue(deal) > 0) return "Cash buyer, hard money, DSCR, or private lending depending on exit.";
  return "Capital path depends on price rewrite, collateral, seller terms, and missing data.";
}

function exitPath(deal: Deal | null) {
  const asset = assetType(deal).toLowerCase();
  const text = dealText(deal);

  if (asset.includes("land")) return "Builder/developer disposition, entitlement play, split/parcel strategy, or land-bank hold.";
  if (asset.includes("commercial")) return "Owner-user sale, operator acquisition, lease-up/reposition, or income-buyer sale.";
  if (text.includes("seller finance") || text.includes("creative")) return "Creative finance hold, wrap resale, rental conversion, or refinance path.";
  if (marginValue(deal) >= 25) return "Fix/flip, wholesale, wholetail, or rental buyer route.";
  if (marginValue(deal) > 0) return "Buyer-specific route, novation, or renegotiated wholetail.";
  return "Abandon or rewrite unless pricing/terms improve.";
}

function bestMove(deal: Deal | null) {
  if (!askValue(deal) || !arvValue(deal)) return "Get price/value clarity before routing.";
  if (!photosOf(deal).length) return "Get photos before serious buyer/operator routing.";
  if (riskScore(deal) >= 70) return "Verify risk blockers first: title, occupancy, access, permits, and repairs.";
  if (spreadValue(deal) <= 0) return "Rewrite structure before exposing to investors.";
  if (marginValue(deal) >= 25) return "Verify source/contact and route privately to matched operators.";
  return "Renegotiate or route only to buyer types that fit the tight spread.";
}

function worstMove(deal: Deal | null) {
  if (spreadValue(deal) <= 0 && askValue(deal) && arvValue(deal)) return "Do not blast this as a normal deal; the numbers do not support it.";
  if (!photosOf(deal).length) return "Do not promise condition-based pricing without photo/scope proof.";
  if (riskScore(deal) >= 70) return "Do not route broadly before clearing risk blockers.";
  return "Do not treat this like a public listing; control exposure and verify before routing.";
}

function aiRewrite(deal: Deal | null) {
  return `Rewrite from raw opportunity into controlled strategy: ${structureRecommendation(deal)} Buyer fit: ${buyerFit(deal)}. Capital path: ${capitalPath(deal)}. Exit path: ${exitPath(deal)}.`;
}

function riskScanner(deal: Deal | null) {
  const text = dealText(deal);
  const risks: string[] = [];

  if (askValue(deal) && arvValue(deal) && askValue(deal) >= arvValue(deal) * 0.82) risks.push("Thin spread / price too high");
  if (repairValue(deal) && arvValue(deal) && repairValue(deal) >= arvValue(deal) * 0.18) risks.push("Heavy rehab exposure");
  if (text.includes("title") || text.includes("probate") || text.includes("lien")) risks.push("Title/legal risk");
  if (text.includes("tenant") || text.includes("occupied")) risks.push("Occupancy/access risk");
  if (text.includes("permit") || text.includes("code") || text.includes("city")) risks.push("Municipal/code risk");
  if (!photosOf(deal).length) risks.push("No photo verification");
  if (!valueOf(deal, ["owner_phone", "contact_phone", "owner_contact_email", "contact_email"])) risks.push("Contact path incomplete");
  if (!risks.length) risks.push("No severe hidden risk detected from current data");

  return risks.slice(0, 7);
}

function missingInfo(deal: Deal | null) {
  const missing: string[] = [];

  if (!askValue(deal)) missing.push("asking price");
  if (!arvValue(deal)) missing.push("ARV/value");
  if (!repairValue(deal)) missing.push("repair estimate");
  if (!photosOf(deal).length) missing.push("photos");
  if (!valueOf(deal, ["address", "location", "property_address"])) missing.push("address/location");
  if (!valueOf(deal, ["owner_phone", "contact_phone", "owner_contact_email", "contact_email"])) missing.push("source contact");
  if (!valueOf(deal, ["occupancy", "tenant_status", "access_notes"])) missing.push("occupancy/access");

  return missing.slice(0, 7);
}

function ContactCard({ deal, id }: { deal: Deal; id: string }) {
  const ownerName = valueOf(deal, ["owner_name", "contact_name", "seller_name", "source_name"]);
  const ownerPhone = valueOf(deal, ["owner_phone", "contact_phone", "seller_phone", "source_phone", "phone"]);
  const ownerEmail = valueOf(deal, [
    "owner_contact_email",
    "contact_email",
    "seller_email",
    "source_email",
  ]);
  const preferred = valueOf(deal, ["preferred_contact", "contact_preference", "best_contact_method"]);
  const notes = valueOf(deal, ["contact_notes", "owner_contact_notes", "seller_contact_notes", "contact_note"]);
  const subject = `VaultForge Opportunity: ${titleOf(deal) || id || "Opportunity Room"}`;
  const callLink = phoneHref(ownerPhone);
  const mailLink = emailHref(ownerEmail, subject);

  return (
    <section style={contactSection}>
      <div style={eyebrow}>Owner / Source Contact</div>
      <h2 style={{ fontSize: "clamp(34px,7vw,64px)", lineHeight: 0.95, margin: "0 0 12px" }}>
        {clean(ownerName) || "Contact source pending"}
      </h2>
      <p style={{ ...muted, fontSize: 18, marginTop: 0 }}>
        Contact details stay inside the Opportunity Room so workstation cards do not become public listing cards.
      </p>

      <div style={grid}>
        <Field label="Name" value={ownerName || "Not listed"} />
        <Field label="Phone" value={ownerPhone || "Not listed"} />
        <Field label="Email" value={ownerEmail || "Not listed"} />
        <Field label="Preferred Contact" value={preferred || "Not listed"} />
      </div>

      {notes ? <Field label="Contact Notes" value={notes} /> : null}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
        {callLink ? <a href={callLink} style={navLink}>Call Contact</a> : null}
        {mailLink ? <a href={mailLink} style={ghost}>Email Contact</a> : null}
        <a
          href={`/messages/new?source=opportunity&type=deal&folder=projects&folder_key=projects&deal_id=${encodeURIComponent(id)}&to=${encodeURIComponent(String(ownerEmail || ""))}&title=${encodeURIComponent(String(titleOf(deal) || "Opportunity Room"))}&subject=${encodeURIComponent(subject)}`}
          style={ghost}
        >
          Message Source
        </a>
      </div>
    </section>
  );
}

export default function DealRoomPage() {
  const params = useParams();
  const paramsId = String(params?.id || "");

  const [dealId, setDealId] = useState("");
  const [deal, setDeal] = useState<Deal | null>(null);
  const [status, setStatus] = useState("");
  const [messageStatus, setMessageStatus] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadDeal(targetId: string) {
    if (!targetId) {
      setLoading(false);
      setStatus("Missing opportunity id.");
      return;
    }

    setLoading(true);
    setStatus("");

    try {
      const res = await fetch(`/api/deal/detail?id=${encodeURIComponent(targetId)}`, {
        cache: "no-store",
        credentials: "include",
        headers: requestHeaders(),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.ok === false) {
        setDeal(null);
        setStatus(data?.error || data?.details || "Could not load opportunity.");
      } else {
        const found = data?.deal || data?.record || data?.item || null;
        setDeal(found);
        if (!found) setStatus("Opportunity record not found.");
      }
    } catch {
      setDeal(null);
      setStatus("Could not load opportunity. Refresh and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    setMessageStatus("");

    if (!message.trim()) {
      setMessageStatus("Write a message first.");
      return;
    }

    try {
      const ownerEmail = valueOf(deal, ["owner_contact_email", "contact_email", "seller_email", "owner_email", "member_email"]);
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: requestHeaders(),
        body: JSON.stringify({
          deal_id: dealId,
          to_email: ownerEmail,
          subject: `Inquiry on ${titleOf(deal) || "VaultForge opportunity"}`,
          body: message.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Message failed.");
      }

      setMessage("");
      setMessageStatus("Message sent to opportunity source.");
    } catch (err: any) {
      setMessageStatus(err?.message || "Could not send message.");
    }
  }

  useEffect(() => {
    const resolved = resolveBrowserId(paramsId);
    setDealId(resolved);
    loadDeal(resolved);
  }, [paramsId]);

  const photos = useMemo(() => photosOf(deal), [deal]);
  const risks = useMemo(() => riskScanner(deal), [deal]);
  const missing = useMemo(() => missingInfo(deal), [deal]);

  return (
    <main style={shell}>
      <style>{`
        a:hover,
        button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        img {
          box-shadow: 0 24px 70px rgba(0,0,0,.32);
        }

        input::placeholder, textarea::placeholder {
          color: rgba(255,255,255,.46);
        }

        @media (max-width: 760px) {
          a,
          button,
          textarea {
            box-sizing: border-box;
          }

          .vf-actions,
          .vf-intel-grid,
          .vf-metric-grid {
            display: grid !important;
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div style={wrap}>
        <nav style={nav}>
          <Link href="/dashboard" style={ghost}>Command</Link>
          <Link href="/workstations" style={ghost}>Workstations</Link>
          <Link href="/opportunity-rooms" style={ghost}>Opportunity Rooms</Link>
          <Link href="/buy-bucket" style={ghost}>Buy Bucket</Link>
          <Link href="/submit" style={navLink}>Submit Opportunity</Link>
        </nav>

        {deal ? (
          <VaultForgeRoomCommandBar
            lane="opportunity"
            roomId={dealId}
            title={titleOf(deal)}
            ownerEmail={String(valueOf(deal, ["owner_contact_email", "contact_email", "seller_email", "owner_email", "member_email"]) || "")}
          />
        ) : null}

        {deal ? (
          <VaultForgeRoomMemberMatch
            lane="opportunity"
            room={deal}
            roomId={dealId}
            title="AI Opportunity Match"
          />
        ) : null}

        {loading ? <section style={section}>Loading opportunity room...</section> : null}

        {status ? (
          <section style={{ ...section, color: "#ffd0d0" }}>
            {status}
          </section>
        ) : null}

        {deal ? (
          <>
            <section style={hero}>
              <div style={eyebrow}>VaultForge Surgeon AI · Opportunity Room</div>

              <h1
                style={{
                  fontSize: "clamp(52px,12vw,96px)",
                  lineHeight: 0.9,
                  letterSpacing: -4,
                  margin: "0 0 18px",
                }}
              >
                {titleOf(deal)}
              </h1>

              <h2 style={{ fontSize: 34, margin: "0 0 16px", color: "#e8c46b" }}>
                {money(askValue(deal))}
              </h2>

              <span style={pill}>{valueOf(deal, ["city"]) || "Unknown City"}</span>
              <span style={pill}>{valueOf(deal, ["county", "county_name", "market_county"]) || "County not listed"}</span>
              <span style={pill}>{valueOf(deal, ["state"]) || "Unknown State"}</span>
              <span style={pill}>{assetType(deal)}</span>
              <span style={pill}>Grade: {opportunityGrade(deal)}</span>

              <p style={{ ...muted, fontSize: 20 }}>
                {valueOf(deal, ["description", "ai_summary", "route_summary", "routing_summary"]) || "No description."}
              </p>
            </section>

            <section style={{ ...section, borderColor: "rgba(181,92,255,.38)", background: "linear-gradient(145deg, rgba(181,92,255,.14), rgba(157,243,191,.07), rgba(255,255,255,.035))" }}>
              <div style={eyebrow}>Institutional Opportunity Read</div>

              <h2 style={{ fontSize: "clamp(34px,7vw,66px)", lineHeight: 0.95, margin: "0 0 14px" }}>
                {goodBadRead(deal)}
              </h2>

              <p style={{ ...muted, fontSize: 19 }}>
                VaultForge reads this as an opportunity workstation, not a listing. The system evaluates spread, risk, structure, buyer fit, capital path, exit path, and whether the strategy needs to be rewritten.
              </p>

              <div className="vf-metric-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 14, marginTop: 18 }}>
                <ScoreStrip labelText="Opportunity Strength" value={opportunityScore(deal)} />
                <ScoreStrip labelText="Risk Load" value={riskScore(deal)} />
                <ScoreStrip labelText="Liquidity / Buyer Fit" value={liquidityScore(deal)} />
                <ScoreStrip labelText="Data Confidence" value={dataConfidence(deal)} />
              </div>

              <div className="vf-intel-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 14, marginTop: 18 }}>
                <IntelligencePanel title="Good / Bad Read" tone={goodBadRead(deal).startsWith("GOOD") ? "green" : goodBadRead(deal).startsWith("BAD") ? "red" : "gold"}>{goodBadRead(deal)}</IntelligencePanel>
                <IntelligencePanel title="AI Rewrite Strategy" tone="blue">{aiRewrite(deal)}</IntelligencePanel>
                <IntelligencePanel title="Structure Recommendation" tone="gold">{structureRecommendation(deal)}</IntelligencePanel>
                <IntelligencePanel title="Buyer / Operator Fit" tone="green">{buyerFit(deal)}</IntelligencePanel>
                <IntelligencePanel title="Best Move Now" tone="green">{bestMove(deal)}</IntelligencePanel>
                <IntelligencePanel title="Worst Move Now" tone="red">{worstMove(deal)}</IntelligencePanel>
                <IntelligencePanel title="Capital Path" tone="blue">{capitalPath(deal)}</IntelligencePanel>
                <IntelligencePanel title="Exit Path" tone="green">{exitPath(deal)}</IntelligencePanel>
                <IntelligencePanel title="Command Recommendation" tone="gold">
                  Decide structure first. Verify source, photos, numbers, risk blockers, and buyer fit before broad routing.
                </IntelligencePanel>
              </div>
            </section>

            <section className="vf-intel-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div style={section}>
                <div style={eyebrow}>Risk Scanner</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                  {risks.map((item) => (
                    <span key={item} style={{ ...chip, color: "#fecaca", borderColor: "rgba(248,113,113,.32)", background: "rgba(248,113,113,.08)" }}>{item}</span>
                  ))}
                </div>
              </div>

              <div style={section}>
                <div style={eyebrow}>Missing Intelligence</div>
                {missing.length ? (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                    {missing.map((item) => (
                      <span key={item} style={{ ...chip, color: "#f8e7b0", borderColor: "rgba(232,196,107,.32)", background: "rgba(232,196,107,.08)" }}>{item}</span>
                    ))}
                  </div>
                ) : (
                  <p style={muted}>Enough data for first-pass routing.</p>
                )}
              </div>
            </section>

            <ContactCard deal={deal} id={dealId} />

            <section style={section}>
              <div style={eyebrow}>Photo Gallery</div>

              {photos.length === 0 ? (
                <p style={muted}>No photos uploaded for this opportunity.</p>
              ) : (
                <div style={grid}>
                  {photos.map((src, i) => (
                    <img
                      key={`${src}-${i}`}
                      src={src}
                      alt={`Opportunity photo ${i + 1}`}
                      style={{ ...image, height: i === 0 ? 360 : 240 }}
                    />
                  ))}
                </div>
              )}
            </section>

            <section style={section}>
              <div style={eyebrow}>Message Opportunity Source</div>

              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="I'm interested in this opportunity."
                style={{ ...input, minHeight: 130, resize: "vertical" }}
              />

              <button type="button" onClick={sendMessage} style={{ ...navLink, marginTop: 12 }}>
                Message Source
              </button>

              {messageStatus ? (
                <p
                  style={{
                    color: messageStatus.toLowerCase().includes("sent")
                      ? "#9df3bf"
                      : "#ffd0d0",
                    fontWeight: 900,
                  }}
                >
                  {messageStatus}
                </p>
              ) : null}
            </section>

            <section style={section}>
              <div style={eyebrow}>Asset Snapshot</div>
              <div className="vf-metric-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 14, marginTop: 14 }}>
                <MiniMetric labelText="Ask / Price" value={money(askValue(deal))} emphasis />
                <MiniMetric labelText="ARV / Value" value={money(arvValue(deal))} emphasis />
                <MiniMetric labelText="Repairs" value={money(repairValue(deal))} emphasis />
                <MiniMetric labelText="Spread" value={spreadValue(deal) ? money(spreadValue(deal)) : "Not enough data"} emphasis />
                <MiniMetric labelText="Margin" value={marginValue(deal) ? `${marginValue(deal)}%` : "Not enough data"} />
                <MiniMetric labelText="Buyer Fit" value={buyerFit(deal)} />
                <MiniMetric labelText="Capital Path" value={capitalPath(deal)} />
                <MiniMetric labelText="Exit Path" value={exitPath(deal)} />
              </div>
            </section>

            <section style={grid}>
              <Field label="Address / Area" value={valueOf(deal, ["address", "location", "property_address"])} />
              <Field label="County" value={valueOf(deal, ["county", "county_name", "market_county"])} />
              <Field label="Bedrooms" value={valueOf(deal, ["bedrooms", "beds"])} />
              <Field label="Bathrooms" value={valueOf(deal, ["bathrooms", "baths"])} />
              <Field label="Square Feet" value={valueOf(deal, ["square_feet", "building_sqft", "sqft"])} />
              <Field label="Acres" value={valueOf(deal, ["acres", "land_acres"])} />
              <Field label="Year Built" value={valueOf(deal, ["year_built", "built_year"])} />
              <Field label="Occupancy" value={valueOf(deal, ["occupancy", "tenant_status", "occupancy_status"])} />
              <Field label="Condition" value={valueOf(deal, ["condition"])} />
              <Field label="Commercial Type" value={valueOf(deal, ["commercial_type"])} />
              <Field label="Units / Suites" value={valueOf(deal, ["units"])} />
              <Field label="NOI" value={valueOf(deal, ["noi", "net_operating_income"])} />
              <Field label="Cap Rate" value={valueOf(deal, ["cap_rate"])} />
              <Field label="Zoning" value={valueOf(deal, ["zoning", "zoning_type"])} />
              <Field label="Road Frontage" value={valueOf(deal, ["frontage", "road_frontage"])} />
              <Field label="Utilities" value={valueOf(deal, ["utilities", "utility_access"])} />
              <Field label="Road Access" value={valueOf(deal, ["road_access"])} />
              <Field label="Topography" value={valueOf(deal, ["topography"])} />
            </section>

            <Field label="Seller Situation" value={valueOf(deal, ["seller_situation"])} />
            <Field label="Access Notes" value={valueOf(deal, ["access_notes"])} />
            <Field label="Private Notes" value={valueOf(deal, ["private_notes"])} />
          </>
        ) : null}
      </div>
    </main>
  );
}
