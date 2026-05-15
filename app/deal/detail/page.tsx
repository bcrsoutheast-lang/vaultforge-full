"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Deal = Record<string, any>;

const shell: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(181,92,255,.24), transparent 28%), radial-gradient(circle at top right, rgba(157,243,191,.16), transparent 24%), radial-gradient(circle at bottom right, rgba(232,196,107,.16), transparent 28%), linear-gradient(180deg,#02040a 0%,#071326 45%,#030509 100%)",
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
  background: "linear-gradient(135deg, rgba(181,92,255,.20), rgba(255,255,255,.05))",
};

const hero: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.16)",
  background:
    "linear-gradient(135deg, rgba(181,92,255,.18), rgba(157,243,191,.08), rgba(255,255,255,.03))",
  borderRadius: 34,
  padding: "28px 22px",
  marginBottom: 22,
  boxShadow: "0 38px 115px rgba(0,0,0,.52)",
};

const section: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.13)",
  background: "linear-gradient(145deg, rgba(181,92,255,.10), rgba(157,243,191,.055), rgba(255,255,255,.03))",
  borderRadius: 30,
  padding: 22,
  marginBottom: 20,
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
  color: "rgba(255,255,255,.66)",
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
  return String(value || "").trim();
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


function dealIdFromBrowser() {
  if (typeof window === "undefined") return "";

  const params = new URLSearchParams(window.location.search);
  const queryId =
    clean(params.get("id")) ||
    clean(params.get("deal_id")) ||
    clean(params.get("dealId")) ||
    clean(params.get("item_id"));

  if (queryId) return queryId;

  const parts = window.location.pathname.split("/").filter(Boolean);
  const last = clean(parts[parts.length - 1]);

  if (!last || last === "detail" || last === "deal") return "";

  try {
    return decodeURIComponent(last);
  } catch {
    return last;
  }
}

function headers() {
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

function formatLabel(key: string) {
  return String(key).replace(/_/g, " ").toUpperCase();
}

function formatValue(value: any) {
  if (Array.isArray(value)) return value.join(", ");
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

function numberValue(value: any) {
  const cleanValue = String(value || "").replace(/[^0-9.-]/g, "");
  const n = Number(cleanValue);
  return Number.isFinite(n) ? n : 0;
}

function getAiSummary(deal: Deal) {
  const ask = numberValue(valueOf(deal, ["asking_price", "price"]));
  const arv = numberValue(deal.arv);
  const repairs = numberValue(deal.repair_estimate);
  const spread = arv && ask ? arv - ask - repairs : 0;
  const margin = arv && spread ? Math.round((spread / arv) * 100) : 0;
  const type = String(deal.property_type || deal.deal_type || "Deal");
  const strategy = String(deal.strategy || "Strategy not listed");
  const city = String(deal.city || "Unknown market");
  const state = String(deal.state || "");

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
    <section style={{ ...section, borderColor: "rgba(181,92,255,.38)", background: "linear-gradient(145deg, rgba(181,92,255,.14), rgba(157,243,191,.07), rgba(255,255,255,.035))" }}>
      <div style={eyebrow}>AI DEAL SUMMARY</div>
      <h2 style={{ fontSize: "clamp(34px,7vw,66px)", lineHeight: 0.95, margin: "0 0 14px" }}>
        {summary.headline}
      </h2>

      <p style={{ ...muted, fontSize: 19 }}>
        VaultForge readout based on saved deal fields. This is the command read for fast review, routing, and execution.
      </p>

      <div style={grid}>
        <Field label="RISK / SPREAD SIGNAL" value={summary.risk} />
        <Field label="ESTIMATED SPREAD" value={summary.spread ? money(summary.spread) : "Not enough data"} />
        <Field label="ESTIMATED MARGIN" value={summary.margin ? `${summary.margin}%` : "Not enough data"} />
        <Field label="LIKELY BUYER FIT" value={summary.buyerFit} />
        <Field label="STRATEGY READ" value={summary.strategy} />
        <Field label="NEXT ACTION" value="Review photos, verify numbers, contact owner/source, and compare against Buy Box demand." />
      </div>
    </section>
  );
}

function ContactCard({ deal, id }: { deal: Deal; id: string }) {
  const ownerName = valueOf(deal, ["owner_name", "contact_name", "seller_name", "source_name"]);
  const ownerPhone = valueOf(deal, ["owner_phone", "contact_phone", "seller_phone", "source_phone", "phone"]);
  const ownerEmail = valueOf(deal, [
    "owner_contact_email",
    "contact_email",
    "seller_email",
    "source_email",
    "owner_email",
    "member_email",
    "email",
  ]);
  const preferred = valueOf(deal, ["preferred_contact", "contact_preference", "best_contact_method"]);
  const notes = valueOf(deal, ["contact_notes", "owner_contact_notes", "seller_contact_notes", "contact_note"]);
  const subject = `VaultForge Deal: ${deal.title || id || "Deal Room"}`;
  const callLink = phoneHref(ownerPhone);
  const mailLink = emailHref(ownerEmail, subject);

  return (
    <section style={contactSection}>
      <div style={eyebrow}>Owner / Seller Contact</div>
      <h2 style={{ fontSize: "clamp(34px,7vw,64px)", lineHeight: 0.95, margin: "0 0 12px" }}>
        {clean(ownerName) || "Contact source pending"}
      </h2>
      <p style={{ ...muted, fontSize: 18, marginTop: 0 }}>
        This contact information stays inside the Deal Room so the workstation card does not become a public listing board.
      </p>

      <div style={grid}>
        <Field label="NAME" value={ownerName || "Not listed"} />
        <Field label="PHONE" value={ownerPhone || "Not listed"} />
        <Field label="EMAIL" value={ownerEmail || "Not listed"} />
        <Field label="PREFERRED CONTACT" value={preferred || "Not listed"} />
      </div>

      {notes ? <Field label="CONTACT NOTES" value={notes} /> : null}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
        {callLink ? <a href={callLink} style={navLink}>Call Contact</a> : null}
        {mailLink ? <a href={mailLink} style={ghost}>Email Contact</a> : null}
        <a
          href={`/messages/new?source=deal&type=deal&folder=projects&folder_key=projects&deal_id=${encodeURIComponent(id)}&to=${encodeURIComponent(String(ownerEmail || ""))}&title=${encodeURIComponent(String(deal.title || "Deal Room"))}&subject=${encodeURIComponent(subject)}`}
          style={ghost}
        >
          Message Owner
        </a>
      </div>
    </section>
  );
}

export default function DealRoomPage() {
  const [id, setId] = useState("");
  const [deal, setDeal] = useState<Deal | null>(null);
  const [status, setStatus] = useState("");
  const [messageStatus, setMessageStatus] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadDeal(nextId = id) {
    const dealId = clean(nextId);

    setLoading(true);
    setStatus("");
    setDeal(null);

    if (!dealId) {
      setLoading(false);
      setStatus("Missing deal id. Open this room from Projects or use /deal/detail?id=DEAL_ID.");
      return;
    }

    try {
      const res = await fetch(`/api/deal/detail?id=${encodeURIComponent(dealId)}`, {
        cache: "no-store",
        credentials: "include",
        headers: headers(),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.ok === false) {
        setStatus(data?.error || data?.details || "Could not load deal.");
      } else {
        const found = data?.deal || data?.record || data?.item || data?.data || null;
        if (found) {
          setDeal(found);
        } else {
          setStatus("Deal response loaded, but no deal record was returned.");
        }
      }
    } catch {
      setStatus("Could not load deal. Refresh and try again.");
    }

    setLoading(false);
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
        headers: headers(),
        body: JSON.stringify({
          deal_id: id,
          to_email: ownerEmail,
          subject: `Inquiry on ${deal?.title || "VaultForge deal"}`,
          body: message.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || data?.details || "Message failed.");
      }

      setMessage("");
      setMessageStatus("Message sent to deal owner.");
    } catch (err: any) {
      setMessageStatus(err?.message || "Could not send message.");
    }
  }

  useEffect(() => {
    const nextId = dealIdFromBrowser();
    setId(nextId);
    loadDeal(nextId);
  }, []);

  const photos: string[] = useMemo(() => {
    const next = Array.isArray(deal?.photo_urls)
      ? deal.photo_urls.filter(Boolean)
      : [];

    if (deal?.main_photo_url && !next.includes(deal.main_photo_url)) {
      next.unshift(deal.main_photo_url);
    }

    return next;
  }, [deal]);

  const hiddenKeys = new Set([
    "id",
    "created_at",
    "updated_at",
    "photo_urls",
    "main_photo_url",
    "photos",
    "image_url",
    "photo_url",
    "primary_photo_url",
  ]);

  const allFields = deal
    ? Object.entries(deal).filter(([key, value]) => {
        if (hiddenKeys.has(key)) return false;
        return !isEmpty(value);
      })
    : [];

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
        }
      `}</style>
      <div style={wrap}>
        <nav style={nav}>
          <Link href="/dashboard" style={ghost}>Dashboard</Link>
          <Link href="/projects" style={ghost}>Projects</Link>
          <Link href="/buy-bucket" style={ghost}>Buy Bucket</Link>
          <Link href="/submit" style={navLink}>Create Deal</Link>
        </nav>

        {loading && <section style={section}>Loading deal room...</section>}

        {status && (
          <section style={{ ...section, color: "#ffd0d0" }}>
            {status}
          </section>
        )}

        {deal && (
          <>
            <section style={hero}>
              <div style={eyebrow}>VAULTFORGE DEAL ROOM</div>

              <h1
                style={{
                  fontSize: "clamp(52px,12vw,96px)",
                  lineHeight: 0.9,
                  letterSpacing: -4,
                  margin: "0 0 18px",
                }}
              >
                {deal.title || "Untitled Deal"}
              </h1>

              <h2 style={{ fontSize: 34, margin: "0 0 16px", color: "#e8c46b" }}>
                {money(valueOf(deal, ["asking_price", "price"]))}
              </h2>

              <span style={pill}>{deal.city || "Unknown City"}</span>
              <span style={pill}>{deal.county || "County not listed"}</span>
              <span style={pill}>{deal.state || "Unknown State"}</span>
              <span style={pill}>{deal.property_type || deal.deal_type || "Deal"}</span>
              <span style={pill}>{deal.strategy || "No strategy"}</span>

              <p style={{ ...muted, fontSize: 20 }}>
                {deal.description || deal.ai_summary || "No description."}
              </p>
            </section>

            <AiDealSummary deal={deal} />

            <ContactCard deal={deal} id={id} />

            <section style={section}>
              <div style={eyebrow}>PHOTO GALLERY</div>

              {photos.length === 0 ? (
                <p style={muted}>No photos uploaded for this deal.</p>
              ) : (
                <div style={grid}>
                  {photos.map((src, i) => (
                    <img
                      key={`${src}-${i}`}
                      src={src}
                      alt={`Deal photo ${i + 1}`}
                      style={{ ...image, height: i === 0 ? 360 : 240 }}
                    />
                  ))}
                </div>
              )}
            </section>

            <section style={section}>
              <div style={eyebrow}>MESSAGE DEAL OWNER</div>

              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="I'm interested in this deal."
                style={{ ...input, minHeight: 130, resize: "vertical" }}
              />

              <button type="button" onClick={sendMessage} style={{ ...navLink, marginTop: 12 }}>
                Message Owner
              </button>

              {messageStatus && (
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
              )}
            </section>

            <section style={grid}>
              <Field label="ASKING PRICE" value={money(valueOf(deal, ["asking_price", "price"]))} />
              <Field label="ARV / VALUE" value={deal.arv ? money(deal.arv) : ""} />
              <Field label="REPAIR ESTIMATE" value={deal.repair_estimate ? money(deal.repair_estimate) : ""} />
              <Field label="ADDRESS / AREA" value={deal.address} />
              <Field label="COUNTY" value={deal.county || deal.county_name || deal.market_county} />
              <Field label="BEDROOMS" value={valueOf(deal, ["bedrooms", "beds"])} />
              <Field label="BATHROOMS" value={valueOf(deal, ["bathrooms", "baths"])} />
              <Field label="SQUARE FEET" value={valueOf(deal, ["square_feet", "building_sqft", "sqft"])} />
              <Field label="ACRES" value={valueOf(deal, ["acres", "land_acres"])} />
              <Field label="YEAR BUILT" value={deal.year_built} />
              <Field label="OCCUPANCY" value={deal.occupancy} />
              <Field label="CONDITION" value={deal.condition} />
              <Field label="COMMERCIAL TYPE" value={deal.commercial_type} />
              <Field label="UNITS / SUITES" value={deal.units} />
              <Field label="NOI" value={deal.noi} />
              <Field label="CAP RATE" value={deal.cap_rate} />
              <Field label="ZONING" value={deal.zoning} />
              <Field label="TENANT STATUS" value={deal.tenant_status} />
              <Field label="PARCEL ID" value={deal.parcel_id} />
              <Field label="ROAD FRONTAGE" value={deal.frontage || deal.road_frontage} />
              <Field label="UTILITIES" value={valueOf(deal, ["utilities", "access_notes"])} />
              <Field label="ROAD ACCESS" value={deal.road_access} />
              <Field label="TOPOGRAPHY" value={deal.topography} />
              <Field label="DEAL NEEDS" value={valueOf(deal, ["deal_needs", "needs", "routing_needs"])} />
            </section>

            <Field label="SELLER SITUATION" value={deal.seller_situation} />
            <Field label="ACCESS NOTES" value={deal.access_notes} />
            <Field label="PRIVATE NOTES" value={deal.private_notes} />

            <section style={section}>
              <div style={eyebrow}>ALL PROJECT DATA</div>
              <p style={muted}>
                This section automatically shows every saved field on this project so new Residential,
                Commercial, Land, contact, or custom fields do not disappear from the Deal Room.
              </p>

              <div style={grid}>
                {allFields.map(([key, value]) => (
                  <div key={key} style={section}>
                    <div style={eyebrow}>{formatLabel(key)}</div>
                    <p style={{ ...muted, fontSize: 18, margin: 0, overflowWrap: "break-word" }}>
                      {formatValue(value)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}