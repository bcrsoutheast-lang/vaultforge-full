"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type Access = {
  email?: string;
  owner?: boolean;
  profile_complete?: boolean;
  payment_status?: string;
  access_status?: string;
  paid?: boolean;
  unlocked?: boolean;
};

type RelatedItem = {
  id?: string;
  title?: string;
  source_table?: string;
  item_kind?: string;
  city?: string;
  state?: string;
  county?: string;
  property_type?: string;
  strategy?: string;
  status?: string;
  asking_price_display?: string;
  arv_display?: string;
  repair_estimate_display?: string;
  beds?: string;
  baths?: string;
  square_feet?: string;
  acres?: string;
  occupancy?: string;
  seller_situation?: string;
  deal_needs?: string[];
  description?: string;
  photo_urls?: string[];
  main_photo_url?: string;
  safe_href?: string;
  exact_address?: string;
  contact_email?: string;
  contact_phone?: string;
  private_notes?: string;
  raw?: Record<string, any>;
};

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.18), transparent 28%), radial-gradient(circle at top right, rgba(157,243,191,.13), transparent 25%), radial-gradient(circle at bottom right, rgba(181,92,255,.18), transparent 28%), linear-gradient(180deg,#02040a 0%,#071326 48%,#030509 100%)",
  color: "white",
  padding: "28px 18px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1180, margin: "0 auto" };

const hero: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.34)",
  background:
    "linear-gradient(145deg, rgba(232,196,107,.12), rgba(181,92,255,.10), rgba(255,255,255,.035))",
  borderRadius: 34,
  padding: 26,
  marginBottom: 22,
  boxShadow: "0 30px 90px rgba(0,0,0,.34)",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.13)",
  background:
    "linear-gradient(145deg, rgba(181,92,255,.10), rgba(232,196,107,.055), rgba(255,255,255,.03))",
  borderRadius: 28,
  padding: 22,
  boxShadow: "0 26px 80px rgba(0,0,0,.34)",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
  gap: 18,
};

const btn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg,#f5d978,#9df3bf 55%,#b55cff)",
  color: "#06100a",
  border: "none",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 950,
  textDecoration: "none",
  cursor: "pointer",
  margin: "6px 6px 0 0",
  minHeight: 46,
};

const ghost: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.055)",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 900,
  textDecoration: "none",
  cursor: "pointer",
  margin: "6px 6px 0 0",
  minHeight: 46,
};

const danger: React.CSSProperties = {
  ...ghost,
  color: "#ffd0d0",
  border: "1px solid rgba(255,120,120,.38)",
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: 5,
  fontWeight: 950,
  fontSize: 12,
  marginBottom: 12,
  textTransform: "uppercase",
};

const greenEyebrow: React.CSSProperties = { ...eyebrow, color: "#9df3bf" };

const muted: React.CSSProperties = {
  color: "rgba(255,255,255,.70)",
  lineHeight: 1.55,
};

const chip: React.CSSProperties = {
  display: "inline-flex",
  border: "1px solid rgba(157,243,191,.25)",
  color: "#9df3bf",
  background: "rgba(157,243,191,.07)",
  borderRadius: 999,
  padding: "8px 11px",
  fontWeight: 850,
  fontSize: 13,
  margin: "0 7px 7px 0",
};

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function readCookie(name: string) {
  if (typeof document === "undefined") return "";
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!match) return "";

  try {
    return decodeURIComponent(match.slice(name.length + 1));
  } catch {
    return match.slice(name.length + 1);
  }
}

function getEmail() {
  if (typeof window === "undefined") return "";

  return (
    localStorage.getItem("vf_email") ||
    sessionStorage.getItem("vf_email") ||
    readCookie("vf_email") ||
    readCookie("vf_admin_email") ||
    ""
  )
    .trim()
    .toLowerCase();
}

function isOwner(email: string, access: Access | null) {
  return cleanEmail(email) === OWNER_EMAIL || access?.owner === true;
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function getDealPriority(item: any) {
  return String(item?.priority || item?.urgency || item?.status || "medium").trim().toLowerCase();
}

function matchTone(level: string) {
  const fit = String(level || "").trim().toLowerCase();
  if (fit === "strong") return "#9df3bf";
  if (fit === "possible") return "#f5d978";
  return "#ffb3b3";
}


function InfoBox({ label, value }: { label: string; value: string | number | undefined }) {
  return (
    <div style={card}>
      <div style={greenEyebrow}>{label}</div>
      <p style={{ ...muted, fontSize: 18, margin: 0 }}>{value || "—"}</p>
    </div>
  );
}

function LockedScreen({ reason }: { reason: "login" | "profile" | "payment" | "loading" }) {
  async function runDealMatchScoring() {
    setScoreBusy(true);
    setMatchStatus("Scoring member fit for this deal...");

    try {
      const currentEmail = email || getEmail();
      const currentOwner = owner || isOwner(currentEmail);

      const res = await fetch("/api/member/match-score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": currentEmail,
          "x-vf-admin": currentOwner ? "1" : "0",
        },
        body: JSON.stringify({
          item_id: itemId,
          state: item?.state || "",
          market: item?.state || item?.market || "",
          city: item?.city || "",
          strategy: item?.strategy || item?.asset_strategy || "",
          asset_type: item?.property_type || item?.asset_type || "",
          role_needed: item?.role_needed || item?.deal_need || "",
          priority: getDealPriority(item),
          title: item?.title || "VaultForge deal",
          note: item?.description || item?.seller_situation || item?.private_notes || "",
        }),
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Could not score member matches.");
      }

      setMatches(Array.isArray(data?.top_matches) ? data.top_matches : []);
      setMatchStatus(`Scored ${data?.counts?.members || 0} members. Strong matches: ${data?.counts?.strong || 0}.`);
    } catch (error: any) {
      setMatchStatus(error?.message || "Could not score member matches.");
    } finally {
      setScoreBusy(false);
    }
  }

  return (
    <main style={page}>
      <div style={wrap}>
        <section style={hero}>
          <div style={greenEyebrow}>VaultForge Deal Room</div>
          <h1 style={{ fontSize: "clamp(54px,12vw,100px)", lineHeight: 0.88, margin: "0 0 18px" }}>
            {reason === "loading"
              ? "Checking deal-room access..."
              : reason === "login"
              ? "Login required."
              : reason === "profile"
              ? "Complete your profile first."
              : "Activate access first."}
          </h1>
          {reason === "login" && <Link href="/login" style={btn}>Login / Create Access</Link>}
          {reason === "profile" && <Link href="/profile" style={btn}>Complete Profile</Link>}
          {reason === "payment" && <Link href="/payment" style={btn}>Activate Access</Link>}
          <Link href="/projects" style={ghost}>Back to Projects</Link>
        </section>
      </div>
    </main>
  );
}

export default function DealRoomPage() {
  const params = useParams();
  const itemId = decodeURIComponent(String(params?.itemId || ""));

  const [email, setEmail] = useState("");
  const [access, setAccess] = useState<Access | null>(null);
  const [lockReason, setLockReason] = useState<"loading" | "login" | "profile" | "payment" | "open">("loading");
  const [item, setItem] = useState<RelatedItem | null>(null);
  const [matches, setMatches] = useState<Record<string, any>[]>([]);
  const [matchStatus, setMatchStatus] = useState("");
  const [scoreBusy, setScoreBusy] = useState(false);
  const [status, setStatus] = useState("Loading deal room...");

  async function load() {
    setStatus("Loading deal room...");

    try {
      const currentEmail = getEmail();
      setEmail(currentEmail);

      if (!currentEmail) {
        setLockReason("login");
        setStatus("");
        return;
      }

      const accessRes = await fetch(`/api/member/access?email=${encodeURIComponent(currentEmail)}`, {
        cache: "no-store",
        headers: { "x-vf-email": currentEmail },
      });

      const accessData = await safeJson(accessRes);
      setAccess(accessData);

      if (!accessData?.owner && !accessData?.profile_complete) {
        setLockReason("profile");
        setStatus("");
        return;
      }

      if (!accessData?.owner && !accessData?.paid && !accessData?.unlocked) {
        setLockReason("payment");
        setStatus("");
        return;
      }

      const owner = isOwner(currentEmail, accessData);

      const itemRes = await fetch(`/api/intelligence/item/${encodeURIComponent(itemId)}?email=${encodeURIComponent(currentEmail)}&owner=${owner ? "1" : "0"}`, {
        cache: "no-store",
        headers: {
          "x-vf-email": currentEmail,
          "x-vf-admin": owner ? "1" : "0",
        },
      });

      const data = await safeJson(itemRes);

      setItem(data?.item || null);
      setLockReason("open");
      setStatus(data?.item ? "" : "Deal room item was not found in known deal/project/pain tables.");
    } catch (error: any) {
      setLockReason("open");
      setStatus(error?.message || "Could not load deal room.");
    }
  }

  useEffect(() => {
    load();
  }, [itemId]);

  const owner = useMemo(() => isOwner(email, access), [email, access]);
  const photos = item?.photo_urls || [];

  if (lockReason !== "open") {
    return <LockedScreen reason={lockReason} />;
  }

  async function runDealMatchScoring() {
    setScoreBusy(true);
    setMatchStatus("Scoring member fit for this deal...");

    try {
      const currentEmail = email || getEmail();
      const currentOwner = owner || isOwner(currentEmail);

      const res = await fetch("/api/member/match-score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": currentEmail,
          "x-vf-admin": currentOwner ? "1" : "0",
        },
        body: JSON.stringify({
          item_id: itemId,
          state: item?.state || "",
          market: item?.state || item?.market || "",
          city: item?.city || "",
          strategy: item?.strategy || item?.asset_strategy || "",
          asset_type: item?.property_type || item?.asset_type || "",
          role_needed: item?.role_needed || item?.deal_need || "",
          priority: getDealPriority(item),
          title: item?.title || "VaultForge deal",
          note: item?.description || item?.seller_situation || item?.private_notes || "",
        }),
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Could not score member matches.");
      }

      setMatches(Array.isArray(data?.top_matches) ? data.top_matches : []);
      setMatchStatus(`Scored ${data?.counts?.members || 0} members. Strong matches: ${data?.counts?.strong || 0}.`);
    } catch (error: any) {
      setMatchStatus(error?.message || "Could not score member matches.");
    } finally {
      setScoreBusy(false);
    }
  }

  return (
    <main style={page}>
      <style>{`
        a:hover,
        button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        @media (max-width: 760px) {
          .vf-dealroom-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .vf-dealroom-actions > * {
            width: 100%;
            margin: 0 !important;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <section style={hero}>
          <div style={greenEyebrow}>
            VaultForge Deal Room · {owner ? "Owner View" : "Member View"} · {item?.source_table || "item lookup"}
          </div>

          <h1 style={{ fontSize: "clamp(52px,10vw,92px)", lineHeight: 0.88, margin: "0 0 18px" }}>
            {item?.title || "Deal room not found."}
          </h1>

          <p style={{ ...muted, fontSize: 21 }}>
            {item?.description || status || "This exact deal room is loaded from the intelligence item lookup layer."}
          </p>

          <div style={{ margin: "18px 0" }}>
            {item?.item_kind && <span style={chip}>{item.item_kind}</span>}
            {item?.status && <span style={chip}>{item.status}</span>}
            {item?.state && <span style={chip}>{item.state}</span>}
            {item?.city && <span style={chip}>{item.city}</span>}
            {item?.property_type && <span style={chip}>{item.property_type}</span>}
            {item?.strategy && <span style={chip}>{item.strategy}</span>}
          </div>

          <div className="vf-dealroom-actions">
            <Link href="/projects" style={ghost}>Projects</Link>
            <Link href="/alerts" style={ghost}>Alerts</Link>
            <Link href="/intelligence" style={ghost}>Intelligence Map</Link>
            <Link href="/routing-inbox" style={ghost}>Routing Inbox</Link>
            <Link href="/introductions" style={btn}>Introductions</Link>
            <button type="button" style={btn} disabled={scoreBusy} onClick={runDealMatchScoring}>
              {scoreBusy ? "Scoring..." : "Score Member Fits"}
            </button>
            <Link href="/messages" style={ghost}>Messages</Link>
            {owner && <Link href="/admin-intelligence" style={btn}>Owner Control</Link>}
            {owner && <Link href="/admin-routing" style={ghost}>Admin Routing</Link>}
            <button type="button" onClick={load} style={ghost}>Refresh Room</button>
            <Link href="/logout" style={danger}>Logout</Link>
          </div>
        </section>

        {!item && (
          <section style={hero}>
            <strong>{status}</strong>
            <p style={muted}>
              This usually means the signal was generated from older data without a matching project/deal id, or the item id is not in the known tables yet.
            </p>
          </section>
        )}

        {item && (
          <>
            {item.main_photo_url && (
              <section style={hero}>
                <img
                  src={item.main_photo_url}
                  alt={item.title || "Deal room image"}
                  style={{
                    width: "100%",
                    maxHeight: 420,
                    objectFit: "cover",
                    borderRadius: 26,
                    border: "1px solid rgba(255,255,255,.16)",
                  }}
                />
              </section>
            )}

            <section style={grid}>
              <InfoBox label="Asking Price" value={item.asking_price_display} />
              <InfoBox label="ARV / Value" value={item.arv_display} />
              <InfoBox label="Repair Estimate" value={item.repair_estimate_display} />
              <InfoBox label="Beds / Baths" value={[item.beds, item.baths].filter(Boolean).join(" / ")} />
              <InfoBox label="Square Feet" value={item.square_feet} />
              <InfoBox label="Acres" value={item.acres} />
              <InfoBox label="Occupancy" value={item.occupancy} />
              <InfoBox label="Seller Situation" value={item.seller_situation} />
              <InfoBox label="County" value={item.county} />
              <InfoBox label="Item ID" value={item.id} />
              {owner && <InfoBox label="Exact Address" value={item.exact_address} />}
              {owner && <InfoBox label="Contact Email" value={item.contact_email} />}
              {owner && <InfoBox label="Contact Phone" value={item.contact_phone} />}
              {owner && <InfoBox label="Private Notes" value={item.private_notes} />}
            </section>

            {(item.deal_needs || []).length > 0 && (
              <section style={{ ...hero, marginTop: 22 }}>
                <div style={greenEyebrow}>Deal Needs</div>
                {(item.deal_needs || []).map((need) => (
                  <span key={need} style={chip}>{need}</span>
                ))}
              </section>
            )}

            {photos.length > 1 && (
              <section style={{ ...hero, marginTop: 22 }}>
                <div style={greenEyebrow}>Photos</div>
                <div style={grid}>
                  {photos.map((photo) => (
                    <img
                      key={photo}
                      src={photo}
                      alt="Deal room photo"
                      style={{
                        width: "100%",
                        height: 230,
                        objectFit: "cover",
                        borderRadius: 22,
                        border: "1px solid rgba(255,255,255,.16)",
                      }}
                    />
                  ))}
                </div>
              </section>
            )}

            <section style={{ ...hero, marginTop: 22 }}>
              <div style={greenEyebrow}>Execution Layer</div>
              <h2 style={{ fontSize: 42, lineHeight: 1, margin: "0 0 14px" }}>
                Exact deal room shell is active.
              </h2>
              <p style={{ ...muted, fontSize: 19 }}>
                Next layers can add signal threads, buyer/lender/operator routing, comments, status updates,
                saved pursuit actions, and notification history. Routing decisions now flow through Routing Rooms,
                Admin Routing, the member Routing Inbox, controlled Introductions, and the future dispatch layer.
              </p>
            </section>

            {matches.length > 0 && (
              <section style={{ ...hero, marginTop: 22 }}>
                <div style={greenEyebrow}>Member Match Scoring</div>
                <h2 style={{ fontSize: 42, lineHeight: 1, margin: "0 0 14px" }}>
                  Strongest member fits.
                </h2>
                <p style={{ ...muted, fontSize: 19 }}>
                  Read-only scoring compares this deal context against member specialization. Nothing is routed or sent automatically.
                </p>

                <section style={grid}>
                  {matches.map((match, index) => {
                    const fitTone = matchTone(match.fit_level);

                    return (
                      <article key={match.member_id || match.email || index} style={{ ...card, borderColor: `${fitTone}66` }}>
                        <div style={{ ...greenEyebrow, color: fitTone }}>
                          {String(match.fit_level || "weak").replace(/_/g, " ")} Fit · {match.fit_score || 0}
                        </div>

                        <h3 style={{ fontSize: 28, margin: "0 0 10px" }}>
                          {match.full_name || match.email || "Member"}
                        </h3>

                        <div style={{ marginBottom: 12 }}>
                          {Array.isArray(match.roles) && match.roles.slice(0, 3).map((role: string) => (
                            <span key={role} style={chip}>{role}</span>
                          ))}
                          {Array.isArray(match.markets) && match.markets.slice(0, 3).map((market: string) => (
                            <span key={market} style={chip}>{market}</span>
                          ))}
                        </div>

                        {Array.isArray(match.reasons) && match.reasons.slice(0, 4).map((reason: string) => (
                          <p key={reason} style={{ ...muted, lineHeight: 1.45 }}>
                            {reason}
                          </p>
                        ))}

                        <Link href={`/member-intelligence/${encodeURIComponent(match.member_id || match.email || "")}`} style={btn}>
                          Member Detail
                        </Link>

                        <Link href="/member-intelligence" style={ghost}>
                          Member Intelligence
                        </Link>
                      </article>
                    );
                  })}
                </section>
              </section>
            )}

            <section style={{ ...hero, marginTop: 22 }}>
              <div style={greenEyebrow}>Controlled Introductions</div>
              <h2 style={{ fontSize: 42, lineHeight: 1, margin: "0 0 14px" }}>
                Intro workflow connected.
              </h2>
              <p style={{ ...muted, fontSize: 19 }}>
                If this deal becomes part of a routed opportunity, owner/admin can stage controlled introductions.
                Members can review staged introductions from the Introductions page.
              </p>
              <Link href="/introductions" style={btn}>Open Introductions</Link>
              <Link href="/routing-inbox" style={ghost}>Routing Inbox</Link>
              {owner && <Link href="/admin-introductions" style={ghost}>Admin Introductions</Link>}
              {owner && <Link href="/admin-dispatch-queue" style={ghost}>Dispatch Queue</Link>}
            </section>

            {owner && item.raw && (
              <section style={{ ...hero, marginTop: 22 }}>
                <div style={greenEyebrow}>Owner Debug</div>
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    color: "rgba(255,255,255,.72)",
                    background: "rgba(0,0,0,.26)",
                    borderRadius: 20,
                    padding: 16,
                    overflow: "auto",
                  }}
                >
                  {JSON.stringify(item.raw, null, 2)}
                </pre>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
