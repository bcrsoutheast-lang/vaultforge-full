"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

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
  const ask = numberValue(valueOf(deal, ["asking_price", "price", "purchase_price"]));
  const arv = numberValue(valueOf(deal, ["arv", "arv_value", "estimated_value", "after_repair_value"]));
  const repairs = numberValue(valueOf(deal, ["repair_estimate", "repairs_needed", "estimated_repairs", "repair_budget", "rehab_budget"]));
  const spread = arv && ask ? arv - ask - repairs : 0;
  const margin = arv && spread ? Math.round((spread / arv) * 100) : 0;
  const type = String(valueOf(deal, ["property_type", "deal_type", "asset_type"]) || "Deal");
  const strategy = String(valueOf(deal, ["strategy", "exit_strategy"]) || "Strategy not listed");
  const city = String(valueOf(deal, ["city"]) || "Unknown market");
  const state = String(valueOf(deal, ["state"]) || "");

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
      <div style={eyebrow}>AI Deal Summary</div>
      <h2 style={{ fontSize: "clamp(34px,7vw,66px)", lineHeight: 0.95, margin: "0 0 14px" }}>
        {summary.headline}
      </h2>

      <p style={{ ...muted, fontSize: 19 }}>
        VaultForge readout based on saved deal fields for fast review, routing, and execution.
      </p>

      <div style={grid}>
        <Field label="Risk / Spread Signal" value={summary.risk} />
        <Field label="Estimated Spread" value={summary.spread ? money(summary.spread) : "Not enough data"} />
        <Field label="Estimated Margin" value={summary.margin ? `${summary.margin}%` : "Not enough data"} />
        <Field label="Likely Buyer Fit" value={summary.buyerFit} />
        <Field label="Strategy Read" value={summary.strategy} />
        <Field label="Next Action" value="Review photos, verify numbers, contact owner/source, and compare against Buy Box demand." />
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
        Contact details stay inside the Deal Room so workstation cards do not become public listing cards.
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
          href={`/messages/new?source=deal&type=deal&folder=projects&folder_key=projects&deal_id=${encodeURIComponent(id)}&to=${encodeURIComponent(String(ownerEmail || ""))}&title=${encodeURIComponent(String(deal.title || "Deal Room"))}&subject=${encodeURIComponent(subject)}`}
          style={ghost}
        >
          Message Owner
        </a>
      </div>
    </section>
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
      setStatus("Missing deal id.");
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
        setStatus(data?.error || data?.details || "Could not load deal.");
      } else {
        const found = data?.deal || data?.record || data?.item || null;
        setDeal(found);
        if (!found) setStatus("Deal record not found.");
      }
    } catch {
      setDeal(null);
      setStatus("Could not load deal. Refresh and try again.");
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
    const resolved = resolveBrowserId(paramsId);
    setDealId(resolved);
    loadDeal(resolved);
  }, [paramsId]);

  const photos: string[] = useMemo(() => {
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
  }, [deal]);

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

          .vf-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
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

        {loading ? <section style={section}>Loading deal room...</section> : null}

        {status ? (
          <section style={{ ...section, color: "#ffd0d0" }}>
            {status}
          </section>
        ) : null}

        {deal ? (
          <>
            <section style={hero}>
              <div style={eyebrow}>VaultForge Deal Room</div>

              <h1
                style={{
                  fontSize: "clamp(52px,12vw,96px)",
                  lineHeight: 0.9,
                  letterSpacing: -4,
                  margin: "0 0 18px",
                }}
              >
                {valueOf(deal, ["title", "deal_title", "project_title", "headline"]) || "Untitled Deal"}
              </h1>

              <h2 style={{ fontSize: 34, margin: "0 0 16px", color: "#e8c46b" }}>
                {money(valueOf(deal, ["asking_price", "price", "purchase_price"]))}
              </h2>

              <span style={pill}>{valueOf(deal, ["city"]) || "Unknown City"}</span>
              <span style={pill}>{valueOf(deal, ["county", "county_name", "market_county"]) || "County not listed"}</span>
              <span style={pill}>{valueOf(deal, ["state"]) || "Unknown State"}</span>
              <span style={pill}>{valueOf(deal, ["property_type", "deal_type", "asset_type"]) || "Deal"}</span>
              <span style={pill}>{valueOf(deal, ["strategy", "exit_strategy"]) || "No strategy"}</span>

              <p style={{ ...muted, fontSize: 20 }}>
                {valueOf(deal, ["description", "ai_summary", "route_summary", "routing_summary"]) || "No description."}
              </p>
            </section>

            <AiDealSummary deal={deal} />

            <ContactCard deal={deal} id={dealId} />

            <section style={section}>
              <div style={eyebrow}>Photo Gallery</div>

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
              <div style={eyebrow}>Message Deal Owner</div>

              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="I'm interested in this deal."
                style={{ ...input, minHeight: 130, resize: "vertical" }}
              />

              <button type="button" onClick={sendMessage} style={{ ...navLink, marginTop: 12 }}>
                Message Owner
              </button>

              {messageStatus ? (
                <p
                  style={{
                    color: messageStatus.toLowerCase().includes("sent") ? "#9df3bf" : "#ffd0d0",
                    fontWeight: 900,
                  }}
                >
                  {messageStatus}
                </p>
              ) : null}
            </section>

            <section style={grid}>
              <Field label="Asking Price" value={money(valueOf(deal, ["asking_price", "price", "purchase_price"]))} />
              <Field label="ARV / Value" value={money(valueOf(deal, ["arv", "arv_value", "estimated_value", "after_repair_value"]))} />
              <Field label="Repair Estimate" value={money(valueOf(deal, ["repair_estimate", "repairs_needed", "estimated_repairs", "repair_budget", "rehab_budget"]))} />
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
