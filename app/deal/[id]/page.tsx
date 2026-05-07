"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Deal = Record<string, any>;

const shell: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 30%), linear-gradient(180deg,#030509 0%,#071326 55%,#030509 100%)",
  color: "white",
  padding: "26px 18px 90px",
  fontFamily: "Arial, sans-serif"
};

const wrap: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto"
};

const nav: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginBottom: 24
};

const navLink: React.CSSProperties = {
  color: "#06100a",
  background: "#f5d978",
  textDecoration: "none",
  borderRadius: 999,
  padding: "12px 16px",
  fontWeight: 900,
  border: "none"
};

const ghost: React.CSSProperties = {
  color: "white",
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,.18)",
  borderRadius: 999,
  padding: "12px 16px",
  fontWeight: 900,
  background: "rgba(255,255,255,.04)"
};

const hero: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.16)",
  background:
    "linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.025))",
  borderRadius: 34,
  padding: "28px 22px",
  marginBottom: 22,
  boxShadow: "0 30px 90px rgba(0,0,0,.45)"
};

const section: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.13)",
  background: "rgba(255,255,255,.035)",
  borderRadius: 30,
  padding: 22,
  marginBottom: 20
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  gap: 16
};

const muted: React.CSSProperties = {
  color: "rgba(255,255,255,.66)",
  lineHeight: 1.5,
  fontSize: 16
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: 5,
  fontWeight: 900,
  fontSize: 12,
  marginBottom: 12
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
  fontWeight: 900
};

const image: React.CSSProperties = {
  width: "100%",
  borderRadius: 24,
  display: "block",
  border: "1px solid rgba(255,255,255,.12)",
  objectFit: "cover"
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.16)",
  background: "rgba(255,255,255,.07)",
  color: "white",
  padding: 14,
  fontSize: 16
};

function getEmail() {
  if (typeof window === "undefined") return "";

  return (
    window.localStorage.getItem("vf_email") ||
    window.sessionStorage.getItem("vf_email") ||
    "text@text.com"
  ).trim().toLowerCase();
}

function headers() {
  return {
    "Content-Type": "application/json",
    "x-vf-email": getEmail()
  };
}

function money(value: unknown) {
  const n = Number(value || 0);

  if (!n) return "Not listed";

  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });
}

function valueOf(deal: Deal | null, keys: string[]) {
  if (!deal) return "";

  for (const key of keys) {
    const v = deal[key];

    if (
      v !== null &&
      v !== undefined &&
      v !== "" &&
      !(Array.isArray(v) && v.length === 0)
    ) {
      return v;
    }
  }

  return "";
}

function Field({
  label,
  value
}: {
  label: string;
  value: any;
}) {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)
  ) {
    return null;
  }

  return (
    <div style={section}>
      <div style={eyebrow}>{label}</div>

      <p
        style={{
          ...muted,
          fontSize: 20,
          margin: 0
        }}
      >
        {Array.isArray(value) ? value.join(", ") : String(value)}
      </p>
    </div>
  );
}

export default function DealRoomPage() {
  const params = useParams();
  const id = String(params?.id || "");

  const [deal, setDeal] = useState<Deal | null>(null);
  const [status, setStatus] = useState("");
  const [messageStatus, setMessageStatus] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadDeal() {
    setLoading(true);
    setStatus("");

    try {
      const res = await fetch(
        `/api/deal/detail?id=${encodeURIComponent(id)}`,
        {
          cache: "no-store",
          headers: headers()
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setStatus(data?.error || data?.details || "Could not load deal.");
      } else {
        setDeal(data?.deal || null);
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
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          deal_id: id,
          subject: `Inquiry on ${deal?.title || "VaultForge deal"}`,
          body: message.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error || data?.details || "Message failed."
        );
      }

      setMessage("");
      setMessageStatus("Message sent to deal owner.");
    } catch (err: any) {
      setMessageStatus(err?.message || "Could not send message.");
    }
  }

  useEffect(() => {
    if (id) {
      loadDeal();
    }
  }, [id]);

  const photos: string[] = Array.isArray(deal?.photo_urls)
    ? deal.photo_urls.filter(Boolean)
    : [];

  if (deal?.main_photo_url && !photos.includes(deal.main_photo_url)) {
    photos.unshift(deal.main_photo_url);
  }

  const ownerName = valueOf(deal, [
    "owner_name",
    "contact_name",
    "seller_name"
  ]);

  const ownerPhone = valueOf(deal, [
    "owner_phone",
    "contact_phone",
    "seller_phone"
  ]);

  const ownerEmail = valueOf(deal, [
    "owner_contact_email",
    "contact_email",
    "seller_email",
    "owner_email",
    "member_email"
  ]);

  return (
    <main style={shell}>
      <div style={wrap}>
        <nav style={nav}>
          <Link href="/dashboard" style={ghost}>
            Dashboard
          </Link>

          <Link href="/projects" style={ghost}>
            Projects
          </Link>

          <Link href="/buy-bucket" style={ghost}>
            Buy Bucket
          </Link>

          <Link href="/submit" style={navLink}>
            Create Deal
          </Link>
        </nav>

        {loading && (
          <section style={section}>
            Loading deal room...
          </section>
        )}

        {status && (
          <section
            style={{
              ...section,
              color: "#ffd0d0"
            }}
          >
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
                  margin: "0 0 18px"
                }}
              >
                {deal.title || "Untitled Deal"}
              </h1>

              <h2
                style={{
                  fontSize: 34,
                  margin: "0 0 16px",
                  color: "#e8c46b"
                }}
              >
                {money(valueOf(deal, ["asking_price", "price"]))}
              </h2>

              <span style={pill}>{deal.city || "Unknown City"}</span>
              <span style={pill}>{deal.state || "Unknown State"}</span>
              <span style={pill}>{deal.property_type || "Deal"}</span>
              <span style={pill}>{deal.strategy || "No strategy"}</span>

              <p
                style={{
                  ...muted,
                  fontSize: 20
                }}
              >
                {deal.description || "No description."}
              </p>
            </section>

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
                      style={{
                        ...image,
                        height: i === 0 ? 360 : 240
                      }}
                    />
                  ))}
                </div>
              )}
            </section>

            <section style={section}>
              <div style={eyebrow}>MESSAGE DEAL OWNER</div>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="I'm interested in this deal."
                style={{
                  ...input,
                  minHeight: 130,
                  resize: "vertical"
                }}
              />

              <button
                type="button"
                onClick={sendMessage}
                style={{
                  ...navLink,
                  marginTop: 12
                }}
              >
                Message Owner
              </button>

              {messageStatus && (
                <p
                  style={{
                    color: messageStatus.toLowerCase().includes("sent")
                      ? "#9df3bf"
                      : "#ffd0d0",
                    fontWeight: 900
                  }}
                >
                  {messageStatus}
                </p>
              )}
            </section>

            <section style={grid}>
              <Field
                label="ASKING PRICE"
                value={money(valueOf(deal, ["asking_price", "price"]))}
              />

              <Field
                label="ARV / VALUE"
                value={deal.arv ? money(deal.arv) : ""}
              />

              <Field
                label="REPAIR ESTIMATE"
                value={deal.repair_estimate ? money(deal.repair_estimate) : ""}
              />

              <Field
                label="ADDRESS / AREA"
                value={deal.address}
              />

              <Field
                label="BEDROOMS"
                value={valueOf(deal, ["bedrooms", "beds"])}
              />

              <Field
                label="BATHROOMS"
                value={valueOf(deal, ["bathrooms", "baths"])}
              />

              <Field
                label="SQUARE FEET"
                value={valueOf(deal, ["square_feet", "building_sqft", "sqft"])}
              />

              <Field
                label="ACRES"
                value={valueOf(deal, ["acres", "land_acres"])}
              />

              <Field
                label="YEAR BUILT"
                value={deal.year_built}
              />

              <Field
                label="OCCUPANCY"
                value={deal.occupancy}
              />

              <Field
                label="CONDITION"
                value={deal.condition}
              />

              <Field
                label="COMMERCIAL TYPE"
                value={deal.commercial_type}
              />

              <Field
                label="UNITS / SUITES"
                value={deal.units}
              />

              <Field
                label="NOI"
                value={deal.noi}
              />

              <Field
                label="CAP RATE"
                value={deal.cap_rate}
              />

              <Field
                label="ZONING"
                value={deal.zoning}
              />

              <Field
                label="TENANT STATUS"
                value={deal.tenant_status}
              />

              <Field
                label="PARCEL ID"
                value={deal.parcel_id}
              />

              <Field
                label="ROAD FRONTAGE"
                value={deal.frontage}
              />

              <Field
                label="UTILITIES"
                value={valueOf(deal, ["utilities", "access_notes"])}
              />

              <Field
                label="ROAD ACCESS"
                value={deal.road_access}
              />

              <Field
                label="TOPOGRAPHY"
                value={deal.topography}
              />

              <Field
                label="DEAL NEEDS"
                value={valueOf(deal, ["deal_needs", "needs", "routing_needs"])}
              />
            </section>

            <section style={grid}>
              <Field
                label="OWNER / CONTACT NAME"
                value={ownerName}
              />

              <Field
                label="OWNER PHONE"
                value={ownerPhone}
              />

              <Field
                label="OWNER EMAIL"
                value={ownerEmail}
              />

              <Field
                label="PREFERRED CONTACT"
                value={deal.preferred_contact}
              />
            </section>

            <Field
              label="SELLER SITUATION"
              value={deal.seller_situation}
            />

            <Field
              label="ACCESS NOTES"
              value={deal.access_notes}
            />

            <Field
              label="PRIVATE NOTES"
              value={deal.private_notes}
            />


            <section style={section}>
              <div style={eyebrow}>ALL PROJECT DATA</div>

              <div style={grid}>
                {Object.entries(deal)
                  .filter(([key, value]) => {
                    if (
                      value === null ||
                      value === undefined ||
                      value === "" ||
                      (Array.isArray(value) && value.length === 0)
                    ) {
                      return false;
                    }

                    const hidden = [
                      "id",
                      "created_at",
                      "updated_at",
                      "photo_urls",
                      "main_photo_url"
                    ];

                    return !hidden.includes(key);
                  })
                  .map(([key, value]) => (
                    <div
                      key={key}
                      style={section}
                    >
                      <div style={eyebrow}>
                        {String(key)
                          .replace(/_/g, " ")
                          .toUpperCase()}
                      </div>

                      <p
                        style={{
                          ...muted,
                          fontSize: 18,
                          margin: 0,
                          overflowWrap: "break-word"
                        }}
                      >
                        {Array.isArray(value)
                          ? value.join(", ")
                          : typeof value === "object"
                          ? JSON.stringify(value)
                          : String(value)}
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
