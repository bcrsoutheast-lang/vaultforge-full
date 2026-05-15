"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

type Deal = Record<string, any>;

const shell: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.18), transparent 28%), radial-gradient(circle at top right, rgba(157,243,191,.12), transparent 24%), linear-gradient(180deg,#020409 0%,#071326 48%,#020409 100%)",
  color: "white",
  padding: "24px 16px 90px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  width: "min(1120px,100%)",
  margin: "0 auto",
};

const nav: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginBottom: 18,
};

const navLink: React.CSSProperties = {
  color: "#06100a",
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  textDecoration: "none",
  borderRadius: 999,
  padding: "12px 16px",
  fontWeight: 950,
  border: "none",
  cursor: "pointer",
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
};

const ghost: React.CSSProperties = {
  color: "white",
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,.16)",
  borderRadius: 999,
  padding: "12px 16px",
  fontWeight: 900,
  background: "rgba(255,255,255,.06)",
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
};

const hero: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.24)",
  background: "linear-gradient(145deg,rgba(255,255,255,.060),rgba(255,255,255,.025))",
  borderRadius: 30,
  padding: 22,
  marginBottom: 18,
  boxShadow: "0 26px 90px rgba(0,0,0,.36)",
};

const section: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  background: "rgba(255,255,255,.045)",
  borderRadius: 26,
  padding: 20,
  marginBottom: 18,
};

const contactSection: React.CSSProperties = {
  ...section,
  border: "1px solid rgba(232,196,107,.30)",
  background: "linear-gradient(145deg,rgba(232,196,107,.095),rgba(255,255,255,.035))",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  gap: 12,
};

const muted: React.CSSProperties = {
  color: "#cbd5e1",
  lineHeight: 1.5,
  fontSize: 16,
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".18em",
  fontWeight: 950,
  fontSize: 11,
  marginBottom: 10,
  textTransform: "uppercase",
};

const pill: React.CSSProperties = {
  display: "inline-flex",
  color: "#9df3bf",
  border: "1px solid rgba(157,243,191,.30)",
  borderRadius: 999,
  padding: "7px 10px",
  fontSize: 12,
  margin: "0 8px 8px 0",
  fontWeight: 850,
  background: "rgba(157,243,191,.07)",
};

const image: React.CSSProperties = {
  width: "100%",
  borderRadius: 22,
  display: "block",
  border: "1px solid rgba(232,196,107,.16)",
  objectFit: "cover",
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.16)",
  background: "rgba(255,255,255,.07)",
  color: "white",
  padding: 14,
  fontSize: 16,
};

function clean(value: unknown) {
  return String(value || "").trim();
}

function getEmail() {
  if (typeof window === "undefined") return "";

  const keys = ["vf_email", "vf_member_email", "vf_admin_email", "email", "memberEmail"];

  for (const key of keys) {
    const local = clean(window.localStorage.getItem(key)).toLowerCase();
    if (local.includes("@")) return local;

    const session = clean(window.sessionStorage.getItem(key)).toLowerCase();
    if (session.includes("@")) return session;
  }

  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("vf_email="));

  if (cookie) {
    try {
      return decodeURIComponent(cookie.slice("vf_email=".length)).toLowerCase();
    } catch {
      return cookie.slice("vf_email=".length).toLowerCase();
    }
  }

  return "";
}

function requestHeaders() {
  return {
    "Content-Type": "application/json",
    "x-vf-email": getEmail(),
  };
}

function money(value: unknown) {
  const raw = clean(value).replace(/[^0-9.-]/g, "");
  const n = Number(raw || 0);

  if (!n) return "Not listed";

  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function numberValue(value: any) {
  const raw = clean(value).replace(/[^0-9.-]/g, "");
  const n = Number(raw || 0);
  return Number.isFinite(n) ? n : 0;
}

function valueOf(deal: Deal | null, keys: string[]) {
  if (!deal) return "";

  for (const key of keys) {
    const value = deal[key];

    if (value !== null && value !== undefined && value !== "" && !(Array.isArray(value) && value.length === 0)) {
      return value;
    }
  }

  return "";
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

  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return [];

    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsePhotoArray(parsed);
    } catch {
      return text
        .split(/[,
|;]/)
        .map((item) => item.trim())
        .filter((url) => url.startsWith("http"));
    }
  }

  return [];
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

function Field({ label, value }: { label: string; value: any }) {
  const text = Array.isArray(value) ? value.filter(Boolean).join(" / ") : clean(value);
  if (!text) return null;

  return (
    <div style={section}>
      <div style={eyebrow}>{label}</div>
      <div style={{ ...muted, fontSize: 20, margin: 0, overflowWrap: "break-word", fontWeight: 750 }}>{text}</div>
    </div>
  );
}

function getAiSummary(deal: Deal) {
  const ask = numberValue(valueOf(deal, ["asking_price", "price", "purchase_price"]));
  const arv = numberValue(valueOf(deal, ["arv", "arv_value", "estimated_value", "after_repair_value"]));
  const repairs = numberValue(valueOf(deal, ["repair_estimate", "repairs_needed", "estimated_repairs", "rehab_budget", "repair_budget"]));
  const spread = arv && ask ? arv - ask - repairs : 0;
  const margin = arv && spread ? Math.round((spread / arv) * 100) : 0;
  const type = clean(valueOf(deal, ["property_type", "deal_type", "asset_type"])) || "Deal";
  const strategy = clean(valueOf(deal, ["strategy", "exit_strategy"])) || "Strategy not listed";
  const city = clean(deal.city) || "Unknown market";
  const state = clean(deal.state);

  let risk = "Needs Review";
  if (spread > 0 && margin >= 20) risk = "Strong Spread";
  if (spread > 0 && margin > 0 && margin < 20) risk = "Tight Spread";
  if (ask && arv && spread <= 0) risk = "High Risk";

  let buyerFit = "General investor";
  if (type.toLowerCase().includes("land")) buyerFit = "Builder / developer / land buyer";
  if (type.toLowerCase().includes("commercial")) buyerFit = "Commercial investor / operator / lender";
  if (type.toLowerCase().includes("residential")) buyerFit = "Fix-flip buyer / rental buyer / local operator";

  return {
    risk,
    spread,
    margin,
    buyerFit,
    headline: `${type} opportunity in ${city}${state ? ", " + state : ""}`,
    strategy,
  };
}

function AiDealSummary({ deal }: { deal: Deal }) {
  const summary = getAiSummary(deal);

  return (
    <section style={{ ...section, borderColor: "rgba(232,196,107,.28)", background: "linear-gradient(145deg,rgba(232,196,107,.085),rgba(255,255,255,.035))" }}>
      <div style={eyebrow}>AI Deal Summary</div>
      <h2 style={{ fontSize: "clamp(34px,7vw,64px)", lineHeight: 0.95, margin: "0 0 14px", letterSpacing: "-.045em" }}>
        {summary.headline}
      </h2>
      <p style={{ ...muted, fontSize: 18 }}>
        VaultForge readout based on saved deal fields for fast review, routing, and execution.
      </p>
      <div style={grid}>
        <Field label="Risk / Spread Signal" value={summary.risk} />
        <Field label="Estimated Spread" value={summary.spread ? money(summary.spread) : "Not enough data"} />
        <Field label="Estimated Margin" value={summary.margin ? `${summary.margin}%` : "Not enough data"} />
        <Field label="Likely Buyer Fit" value={summary.buyerFit} />
      </div>
    </section>
  );
}

function ContactCard({ deal, id }: { deal: Deal; id: string }) {
  const ownerName = valueOf(deal, ["owner_name", "contact_name", "seller_name", "source_name"]);
  const ownerPhone = valueOf(deal, ["owner_phone", "contact_phone", "seller_phone", "source_phone", "phone"]);
  const ownerEmail = valueOf(deal, ["owner_contact_email", "contact_email", "seller_email", "source_email"]);
  const preferred = valueOf(deal, ["preferred_contact", "contact_preference", "best_contact_method"]);
  const notes = valueOf(deal, ["contact_notes", "owner_contact_notes", "seller_contact_notes", "contact_note"]);
  const subject = `VaultForge Deal: ${deal.title || id || "Deal Room"}`;
  const callLink = phoneHref(ownerPhone);
  const mailLink = emailHref(ownerEmail, subject);
  const messageTo = clean(ownerEmail || valueOf(deal, ["owner_email", "member_email", "email"]));

  return (
    <section style={contactSection}>
      <div style={eyebrow}>Owner / Seller Contact</div>
      <h2 style={{ fontSize: "clamp(34px,7vw,62px)", lineHeight: 0.95, margin: "0 0 12px", letterSpacing: "-.045em" }}>
        {clean(ownerName) || "Contact source pending"}
      </h2>
      <p style={{ ...muted, fontSize: 18, marginTop: 0 }}>
        Contact stays inside the Deal Room so workstation cards do not become public listing cards.
      </p>

      <div style={grid}>
        <Field label="Name" value={ownerName || "Not listed"} />
        <Field label="Phone" value={ownerPhone || "Not listed"} />
        <Field label="Email" value={ownerEmail || "Not listed"} />
        <Field label="Preferred Contact" value={preferred || "Not listed"} />
      </div>

      {notes ? <Field label="Contact Notes" value={notes} /> : null}

      <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
        {callLink ? <a href={callLink} style={navLink}>Call Contact</a> : null}
        {mailLink ? <a href={mailLink} style={ghost}>Email Contact</a> : null}
        <a
          href={`/messages/new?source=deal&type=deal&folder=projects&folder_key=projects&deal_id=${encodeURIComponent(id)}&to=${encodeURIComponent(messageTo)}&title=${encodeURIComponent(String(deal.title || "Deal Room"))}&subject=${encodeURIComponent(subject)}`}
          style={ghost}
        >
          Message Owner
        </a>
      </div>
    </section>
  );
}

function getIdFromLocation() {
  if (typeof window === "undefined") return "";

  const url = new URL(window.location.href);
  const queryId = clean(url.searchParams.get("id") || url.searchParams.get("deal_id") || url.searchParams.get("item_id"));
  if (queryId) return queryId;

  const parts = url.pathname.split("/").map((part) => part.trim()).filter(Boolean);
  return decodeURIComponent(parts[parts.length - 1] || "");
}

export default function DealRoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const paramId = clean((params as any)?.id);
  const queryId = clean(searchParams?.get("id") || searchParams?.get("deal_id") || searchParams?.get("item_id"));

  const [id, setId] = useState(queryId || paramId);
  const [deal, setDeal] = useState<Deal | null>(null);
  const [status, setStatus] = useState("");
  const [messageStatus, setMessageStatus] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadDeal(nextId?: string) {
    const targetId = clean(nextId || id || getIdFromLocation());

    if (!targetId || targetId === "detail") {
      setLoading(false);
      setStatus("Missing deal ID.");
      return;
    }

    setId(targetId);
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
        setStatus(data?.error || data?.details || "Could not load deal.");
        setDeal(null);
      } else {
        const found = data?.deal || data?.record || data?.item || data?.data || null;
        if (!found) {
          setStatus("Deal not found.");
          setDeal(null);
        } else {
          setDeal(found);
          setStatus("");
        }
      }
    } catch {
      setStatus("Could not load deal. Refresh and try again.");
      setDeal(null);
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
      const ownerEmail = valueOf(deal, ["owner_contact_email", "contact_email", "seller_email", "owner_email", "member_email", "email"]);
      const res = await fetch("/api/messages/send", {
        method: "POST",
        credentials: "include",
        headers: requestHeaders(),
        body: JSON.stringify({
          deal_id: id,
          to_email: ownerEmail,
          subject: `Inquiry on ${deal?.title || "VaultForge deal"}`,
          body: message.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Message failed.");
      }

      setMessage("");
      setMessageStatus("Message sent to deal owner.");
    } catch (err: any) {
      setMessageStatus(err?.message || "Could not send message.");
    }
  }

  useEffect(() => {
    loadDeal(queryId || paramId || getIdFromLocation());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryId, paramId]);

  const photos: string[] = useMemo(() => {
    if (!deal) return [];

    return Array.from(
      new Set(
        [
          clean(deal.main_photo_url),
          clean(deal.image_url),
          clean(deal.photo_url),
          clean(deal.primary_photo_url),
          ...parsePhotoArray(deal.photo_urls),
          ...parsePhotoArray(deal.photos),
        ].filter((url) => url.startsWith("http"))
      )
    );
  }, [deal]);

  return (
    <main style={shell}>
      <style>{`
        a:hover, button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,.46); }
        @media (max-width: 760px) {
          .vf-actions { display: grid !important; grid-template-columns: 1fr !important; }
          .vf-actions > * { width: 100%; box-sizing: border-box; justify-content: center; }
        }
      `}</style>

      <div style={wrap}>
        <nav style={nav}>
          <Link href="/dashboard" style={ghost}>Dashboard</Link>
          <Link href="/projects" style={ghost}>Projects</Link>
          <Link href="/buy-bucket" style={ghost}>Buy Bucket</Link>
          <Link href="/submit" style={navLink}>Create Deal</Link>
          <button type="button" onClick={() => loadDeal()} style={ghost}>Refresh</button>
        </nav>

        {loading ? <section style={section}>Loading deal room...</section> : null}

        {status ? <section style={{ ...section, color: "#fecaca", fontWeight: 900 }}>{status}</section> : null}

        {deal ? (
          <>
            <section style={hero}>
              <div style={eyebrow}>VaultForge Deal Room</div>
              <h1 style={{ fontSize: "clamp(52px,12vw,92px)", lineHeight: 0.9, letterSpacing: "-.07em", margin: "0 0 16px" }}>
                {deal.title || deal.deal_title || deal.project_title || "Untitled Deal"}
              </h1>
              <h2 style={{ fontSize: 34, margin: "0 0 16px", color: "#e8c46b" }}>
                {money(valueOf(deal, ["asking_price", "price", "purchase_price"]))}
              </h2>
              <div style={{ marginBottom: 10 }}>
                <span style={pill}>{deal.city || "Unknown City"}</span>
                <span style={pill}>{valueOf(deal, ["county", "county_name", "market_county"]) || "County not listed"}</span>
                <span style={pill}>{deal.state || "Unknown State"}</span>
                <span style={pill}>{valueOf(deal, ["property_type", "deal_type", "asset_type"]) || "Deal"}</span>
                <span style={pill}>{deal.strategy || deal.exit_strategy || "No strategy"}</span>
              </div>
              <p style={{ ...muted, fontSize: 19 }}>
                {valueOf(deal, ["description", "ai_summary", "route_summary", "notes"]) || "No description."}
              </p>
            </section>

            <AiDealSummary deal={deal} />
            <ContactCard deal={deal} id={id} />

            <section style={section}>
              <div style={eyebrow}>Photo Gallery</div>
              {photos.length === 0 ? (
                <p style={muted}>No photos uploaded for this deal.</p>
              ) : (
                <div style={grid}>
                  {photos.map((src, i) => (
                    <img key={`${src}-${i}`} src={src} alt={`Deal photo ${i + 1}`} style={{ ...image, height: i === 0 ? 360 : 220 }} />
                  ))}
                </div>
              )}
            </section>

            <section style={section}>
              <div style={eyebrow}>Message Deal Owner</div>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="I'm interested in this deal."
                style={{ ...input, minHeight: 120, resize: "vertical" }}
              />
              <button type="button" onClick={sendMessage} style={{ ...navLink, marginTop: 12 }}>
                Message Owner
              </button>
              {messageStatus ? (
                <p style={{ color: messageStatus.toLowerCase().includes("sent") ? "#9df3bf" : "#fecaca", fontWeight: 900 }}>
                  {messageStatus}
                </p>
              ) : null}
            </section>

            <section style={grid}>
              <Field label="Asking Price" value={money(valueOf(deal, ["asking_price", "price", "purchase_price"]))} />
              <Field label="ARV / Value" value={money(valueOf(deal, ["arv", "arv_value", "estimated_value", "after_repair_value"]))} />
              <Field label="Repair Estimate" value={money(valueOf(deal, ["repair_estimate", "repairs_needed", "estimated_repairs", "rehab_budget", "repair_budget"]))} />
              <Field label="County" value={valueOf(deal, ["county", "county_name", "market_county"])} />
              <Field label="Bedrooms" value={valueOf(deal, ["bedrooms", "beds"])} />
              <Field label="Bathrooms" value={valueOf(deal, ["bathrooms", "baths"])} />
              <Field label="Square Feet" value={valueOf(deal, ["square_feet", "building_sqft", "sqft"])} />
              <Field label="Year Built" value={deal.year_built} />
              <Field label="Occupancy" value={valueOf(deal, ["occupancy", "tenant_status", "occupancy_status"])} />
              <Field label="Condition" value={deal.condition} />
              <Field label="Address / Area" value={valueOf(deal, ["address", "location"])} />
              <Field label="Access Notes" value={deal.access_notes} />
              <Field label="Private Notes" value={deal.private_notes} />
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
