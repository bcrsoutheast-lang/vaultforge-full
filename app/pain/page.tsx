"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type SelectedPhoto = {
  name: string;
  size: number;
  type: string;
  dataUrl: string;
};

type PainType = {
  key: string;
  label: string;
  description: string;
  route: string;
  defaultHelp: string;
};

const OPERATING_STATES = [
  { value: "", label: "Select operating state" },
  { value: "GA", label: "Georgia" },
  { value: "FL", label: "Florida" },
  { value: "TN", label: "Tennessee" },
  { value: "AL", label: "Alabama" },
  { value: "TX", label: "Texas" },
  { value: "NC", label: "North Carolina" },
  { value: "SC", label: "South Carolina" },
];

const PAIN_TYPES: PainType[] = [
  {
    key: "distressed_seller",
    label: "Distressed Seller",
    description: "Seller pressure, urgent disposition, inherited property, foreclosure, or owner needs a path out.",
    route: "buyer / capital / operator",
    defaultHelp: "Need buyer, private capital, operator, or structured exit.",
  },
  {
    key: "funding_gap",
    label: "Funding Gap",
    description: "Deal works but needs bridge capital, gap funding, transactional funding, or JV capital.",
    route: "lender / private capital / JV",
    defaultHelp: "Need lender, private capital, gap funding, or JV capital partner.",
  },
  {
    key: "buyer_needed",
    label: "Buyer Needed",
    description: "You have a deal, assignment, listing, off-market asset, or disposition need.",
    route: "buyer / acquisition partner",
    defaultHelp: "Need cash buyer, acquisition partner, or disposition route.",
  },
  {
    key: "operator_needed",
    label: "Operator Needed",
    description: "Need boots on ground, GC/operator, project manager, or local execution.",
    route: "operator / contractor / local partner",
    defaultHelp: "Need operator, contractor, project manager, or execution partner.",
  },
  {
    key: "stalled_construction",
    label: "Stalled Construction",
    description: "Project is stuck because of funding, contractor, permit, scope, inspection, or execution problem.",
    route: "operator / capital / contractor",
    defaultHelp: "Need capital, operator, contractor, permit help, or project rescue.",
  },
  {
    key: "off_market_opportunity",
    label: "Off-Market Opportunity",
    description: "Private opportunity that needs routing before it becomes public.",
    route: "buyer / capital / operator",
    defaultHelp: "Need the right buyer, operator, or capital route.",
  },
  {
    key: "permit_city_issue",
    label: "Permit / City Issue",
    description: "Inspection, zoning, permit, municipality, code, or city issue blocking progress.",
    route: "operator / permit specialist",
    defaultHelp: "Need city/permit guidance, local operator, or compliance path.",
  },
  {
    key: "emergency_exit",
    label: "Emergency Exit",
    description: "Urgent situation where speed, discretion, and routing are needed immediately.",
    route: "buyer / capital / owner review",
    defaultHelp: "Need urgent buyer, funding, or owner-reviewed execution route.",
  },
  {
    key: "land_opportunity",
    label: "Land Opportunity",
    description: "Land, entitlement, development, builder, rezoning, or site opportunity.",
    route: "developer / builder / land buyer",
    defaultHelp: "Need developer, builder, land buyer, entitlement help, or capital.",
  },
  {
    key: "commercial_opportunity",
    label: "Commercial Opportunity",
    description: "Commercial, multifamily, mixed-use, retail, office, industrial, or income asset.",
    route: "commercial buyer / capital / operator",
    defaultHelp: "Need commercial buyer, capital partner, operator, or diligence support.",
  },
];

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.18), transparent 28%), radial-gradient(circle at top right, rgba(181,92,255,.18), transparent 24%), radial-gradient(circle at bottom right, rgba(157,243,191,.13), transparent 28%), linear-gradient(180deg,#02040a 0%,#071326 48%,#030509 100%)",
  color: "white",
  padding: "28px 18px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1220, margin: "0 auto" };

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
  marginBottom: 18,
  boxShadow: "0 26px 80px rgba(0,0,0,.30)",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
  gap: 16,
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
  border: "1px solid rgba(255,120,120,.38)",
  color: "#ffd0d0",
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

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.075)",
  color: "white",
  padding: 15,
  fontSize: 16,
};

const label: React.CSSProperties = {
  display: "block",
  fontWeight: 950,
  margin: "0 0 8px",
};

const eyebrow: React.CSSProperties = {
  color: "#9df3bf",
  letterSpacing: 5,
  fontWeight: 950,
  fontSize: 12,
  marginBottom: 12,
  textTransform: "uppercase",
};

const muted: React.CSSProperties = {
  color: "rgba(255,255,255,.72)",
  lineHeight: 1.55,
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

  return cleanEmail(
    localStorage.getItem("vf_email") ||
      sessionStorage.getItem("vf_email") ||
      readCookie("vf_email") ||
      readCookie("vf_admin_email") ||
      ""
  );
}

function isOwner(email: string) {
  return email === OWNER_EMAIL || readCookie("vf_admin") === "1" || readCookie("isAdmin") === "true";
}

function scoreUrgency(urgency: string, timeline: string, capitalNeeded: string) {
  let score = 30;
  if (urgency === "emergency") score += 45;
  if (urgency === "high") score += 30;
  if (urgency === "medium") score += 15;
  if (timeline) score += 10;
  if (capitalNeeded) score += 10;
  return Math.min(100, score);
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export default function PainPage() {
  const [email, setEmail] = useState("");
  const [owner, setOwner] = useState(false);
  const [painTypeKey, setPainTypeKey] = useState("distressed_seller");
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const [form, setForm] = useState({
    title: "",
    state: "",
    city: "",
    area: "",
    assetType: "Residential",
    address: "",
    confidentiality: "Members only",
    urgency: "high",
    timeline: "",
    capitalNeeded: "",
    askingPrice: "",
    arv: "",
    repairs: "",
    helpRequested: "",
    notes: "",
  });

  useEffect(() => {
    const currentEmail = getEmail();
    setEmail(currentEmail);
    setOwner(isOwner(currentEmail));
  }, []);

  const painType = useMemo(() => {
    return PAIN_TYPES.find((item) => item.key === painTypeKey) || PAIN_TYPES[0];
  }, [painTypeKey]);

  const urgencyScore = useMemo(() => {
    return scoreUrgency(form.urgency, form.timeline, form.capitalNeeded);
  }, [form.urgency, form.timeline, form.capitalNeeded]);

  const routeSummary = useMemo(() => {
    const market = [form.city, form.state].filter(Boolean).join(", ") || "Unassigned market";
    const help = form.helpRequested || painType.defaultHelp;
    return `${painType.label} signal. Market: ${market}. Asset: ${form.assetType}. Urgency: ${form.urgency}. Help requested: ${help}. Best route: ${painType.route}.`;
  }, [form, painType]);

  const canSubmit = useMemo(() => {
    return email.includes("@") && clean(form.title) && clean(form.state);
  }, [email, form.title, form.state]);

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handlePhotoFiles(fileList: FileList | null) {
    const files = Array.from(fileList || []).slice(0, 8);

    if (!files.length) return;

    const loaded = await Promise.all(
      files.map(
        (file) =>
          new Promise<SelectedPhoto>((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
              resolve({
                name: file.name,
                size: file.size,
                type: file.type,
                dataUrl: String(reader.result || ""),
              });
            };

            reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
            reader.readAsDataURL(file);
          })
      )
    );

    setPhotos((current) => [...current, ...loaded].slice(0, 8));
  }

  function removePhoto(index: number) {
    setPhotos((current) => current.filter((_, photoIndex) => photoIndex !== index));
  }

  function submitPainClick() {
    const currentEmail = email || getEmail();

    if (!currentEmail.includes("@")) {
      setStatus("Login email missing. Please log in again before submitting pain.");
      return;
    }

    if (!clean(form.title)) {
      setStatus("Add a short pain/opportunity title before submitting.");
      return;
    }

    if (!clean(form.state)) {
      setStatus("Select an operating state before submitting.");
      return;
    }

    submitPain();
  }

  async function submitPain() {
    if (busy) return;

    setBusy(true);
    setStatus("");

    try {
      const currentEmail = email || getEmail();

      const payload = {
        email: currentEmail,
        member_email: currentEmail,
        owner_email: OWNER_EMAIL,
        pain_type: painType.key,
        pain_label: painType.label,
        title: form.title,
        state: form.state,
        city: form.city,
        county: form.area,
        asset_type: form.assetType,
        address: form.address,
        confidentiality: form.confidentiality,
        urgency: form.urgency,
        urgency_score: urgencyScore,
        timeline: form.timeline,
        capital_needed: form.capitalNeeded,
        asking_price: form.askingPrice,
        arv: form.arv,
        repair_estimate: form.repairs,
        help_requested: form.helpRequested || painType.defaultHelp,
        route_summary: routeSummary,
        best_route: painType.route,
        notes: form.notes,
        photo_urls: photos.map((photo) => photo.dataUrl),
        photos: photos.map((photo) => ({
          name: photo.name,
          size: photo.size,
          type: photo.type,
          data_url: photo.dataUrl,
        })),
        photo_count: photos.length,
        raw_fields: form,
        source: "adaptive_pain_button_safe",
      };

      const res = await fetch("/api/pain/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": currentEmail,
          "x-vf-admin": owner ? "1" : "0",
        },
        body: JSON.stringify(payload),
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Pain submit failed.");
      }

      setStatus(data?.message || "Pain signal submitted and routed into VaultForge intelligence.");
    } catch (error: any) {
      setStatus(error?.message || "Could not submit pain signal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        input::placeholder, textarea::placeholder {
          color: rgba(255,255,255,.48);
        }

        select {
          appearance: none;
        }

        @media (max-width: 760px) {
          a, button {
            width: 100%;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav title="Pain Button" subtitle="Adaptive real estate intelligence intake" />

        <section style={hero}>
          <div style={eyebrow}>VaultForge Pain Intelligence</div>
          <h1 style={{ fontSize: "clamp(56px,12vw,108px)", lineHeight: 0.86, margin: "0 0 18px" }}>
            Turn pressure into routed opportunity.
          </h1>
          <p style={{ ...muted, fontSize: 22 }}>
            Submit a real estate problem, stalled deal, funding gap, buyer need, city issue, or execution problem.
          </p>

          <div>
            <span style={chip}>Signed in: {email || "unknown"}</span>
            <span style={chip}>Urgency Score: {urgencyScore}</span>
            <span style={chip}>Route: {painType.route}</span>
            <span style={chip}>Photos: {photos.length}</span>
            <span style={chip}>{owner ? "Owner View" : "Member View"}</span>
          </div>

          <Link href="/pain-feed" style={ghost}>Pain Feed</Link>
          <Link href="/activity" style={ghost}>Activity</Link>
          <Link href="/alerts" style={ghost}>Alerts</Link>
          <Link href="/routing-inbox" style={ghost}>Routing Inbox</Link>
          <Link href="/dashboard" style={ghost}>Dashboard</Link>
          <Link href="/logout" style={danger}>Logout</Link>
        </section>

        {status && (
          <section
            style={{
              ...hero,
              color:
                status.toLowerCase().includes("failed") ||
                status.toLowerCase().includes("missing") ||
                status.toLowerCase().includes("could")
                  ? "#ffd0d0"
                  : "#9df3bf",
            }}
          >
            <strong>{status}</strong>
            {!status.toLowerCase().includes("failed") && !status.toLowerCase().includes("missing") && (
              <div style={{ marginTop: 16 }}>
                <Link href="/pain-feed" style={btn}>Open Pain Feed</Link>
                <Link href="/activity" style={ghost}>Activity</Link>
                <Link href="/alerts" style={ghost}>Alerts</Link>
                <Link href="/routing-inbox" style={ghost}>Routing Inbox</Link>
              </div>
            )}
          </section>
        )}

        <section style={hero}>
          <div style={eyebrow}>Select Pain Type</div>
          <div style={grid}>
            {PAIN_TYPES.map((type) => (
              <button
                key={type.key}
                type="button"
                onClick={() => {
                  setPainTypeKey(type.key);
                  update("helpRequested", type.defaultHelp);
                }}
                style={{
                  ...card,
                  textAlign: "left",
                  cursor: "pointer",
                  borderColor:
                    painType.key === type.key
                      ? "rgba(245,217,120,.78)"
                      : "rgba(255,255,255,.13)",
                }}
              >
                <div style={eyebrow}>{type.route}</div>
                <h3 style={{ fontSize: 26, lineHeight: 1.05, margin: "0 0 10px" }}>{type.label}</h3>
                <p style={muted}>{type.description}</p>
              </button>
            ))}
          </div>
        </section>

        <section style={grid}>
          <section style={card}>
            <div style={eyebrow}>Core Signal</div>

            <label style={label}>Title / What is happening?</label>
            <input
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
              style={input}
              placeholder="Example: Stalled flip needs gap funding"
            />

            <div style={{ marginTop: 16 }}>
              <label style={label}>Help Requested</label>
              <textarea
                value={form.helpRequested || painType.defaultHelp}
                onChange={(event) => update("helpRequested", event.target.value)}
                style={{ ...input, minHeight: 120 }}
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={label}>Notes / Situation</label>
              <textarea
                value={form.notes}
                onChange={(event) => update("notes", event.target.value)}
                style={{ ...input, minHeight: 160 }}
                placeholder="Explain the pressure, opportunity, obstacle, and what needs to happen next."
              />
            </div>
          </section>

          <section style={card}>
            <div style={eyebrow}>Market / Asset</div>

            <label style={label}>Operating State</label>
            <select value={form.state} onChange={(event) => update("state", event.target.value)} style={input}>
              {OPERATING_STATES.map((state) => (
                <option key={state.value} value={state.value}>
                  {state.label}
                </option>
              ))}
            </select>

            <div style={{ marginTop: 16 }}>
              <label style={label}>City</label>
              <input
                value={form.city}
                onChange={(event) => update("city", event.target.value)}
                style={input}
                placeholder="City / market"
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={label}>Area / Submarket</label>
              <input
                value={form.area}
                onChange={(event) => update("area", event.target.value)}
                style={input}
                placeholder="Example: Buckhead, East Atlanta, North Fulton..."
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={label}>Asset Type</label>
              <select value={form.assetType} onChange={(event) => update("assetType", event.target.value)} style={input}>
                <option>Residential</option>
                <option>Commercial</option>
                <option>Land</option>
                <option>Multifamily</option>
                <option>Mixed-use</option>
                <option>Portfolio</option>
              </select>
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={label}>Address or General Location</label>
              <input
                value={form.address}
                onChange={(event) => update("address", event.target.value)}
                style={input}
                placeholder="Exact address if safe, or general location. No ZIP required."
              />
            </div>
          </section>
        </section>

        <section style={grid}>
          <section style={card}>
            <div style={eyebrow}>Pressure / Timeline</div>

            <label style={label}>Urgency</label>
            <select value={form.urgency} onChange={(event) => update("urgency", event.target.value)} style={input}>
              <option value="emergency">Emergency</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="normal">Normal</option>
            </select>

            <div style={{ marginTop: 16 }}>
              <label style={label}>Timeline / Deadline</label>
              <input
                value={form.timeline}
                onChange={(event) => update("timeline", event.target.value)}
                style={input}
                placeholder="Example: 7 days, 30 days, closing Friday..."
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={label}>Confidentiality</label>
              <select value={form.confidentiality} onChange={(event) => update("confidentiality", event.target.value)} style={input}>
                <option>Members only</option>
                <option>Owner review first</option>
                <option>Private / sensitive</option>
                <option>Can route to matched members</option>
              </select>
            </div>
          </section>

          <section style={card}>
            <div style={eyebrow}>Numbers</div>

            <label style={label}>Capital Needed</label>
            <input
              value={form.capitalNeeded}
              onChange={(event) => update("capitalNeeded", event.target.value)}
              style={input}
              placeholder="$125,000"
            />

            <div style={{ marginTop: 16 }}>
              <label style={label}>Asking Price</label>
              <input
                value={form.askingPrice}
                onChange={(event) => update("askingPrice", event.target.value)}
                style={input}
                placeholder="$210,000"
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={label}>ARV / Value</label>
              <input
                value={form.arv}
                onChange={(event) => update("arv", event.target.value)}
                style={input}
                placeholder="$300,000"
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={label}>Repairs / Remaining Work</label>
              <input
                value={form.repairs}
                onChange={(event) => update("repairs", event.target.value)}
                style={input}
                placeholder="$45,000 or scope summary"
              />
            </div>
          </section>
        </section>

        <section style={card}>
          <div style={eyebrow}>Photos / Files</div>
          <p style={muted}>
            Select photos from your phone or upload files from your device. This previews files now and sends photo data to the create API.
          </p>

          <label style={label}>Upload from phone or file</label>
          <input
            type="file"
            accept="image/*,.pdf"
            multiple
            onChange={(event) => handlePhotoFiles(event.target.files)}
            style={input}
          />

          {photos.length > 0 && (
            <div style={{ ...grid, marginTop: 16 }}>
              {photos.map((photo, index) => (
                <div key={`${photo.name}-${index}`} style={card}>
                  {photo.type.startsWith("image/") ? (
                    <img
                      src={photo.dataUrl}
                      alt={photo.name}
                      style={{
                        width: "100%",
                        height: 170,
                        objectFit: "cover",
                        borderRadius: 18,
                        border: "1px solid rgba(255,255,255,.14)",
                        marginBottom: 12,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        height: 170,
                        display: "grid",
                        placeItems: "center",
                        borderRadius: 18,
                        border: "1px solid rgba(255,255,255,.14)",
                        background: "rgba(255,255,255,.06)",
                        marginBottom: 12,
                        fontWeight: 950,
                      }}
                    >
                      FILE
                    </div>
                  )}

                  <div style={{ fontWeight: 950, wordBreak: "break-word" }}>{photo.name}</div>
                  <p style={muted}>{Math.round(photo.size / 1024)} KB</p>
                  <button type="button" style={danger} onClick={() => removePhoto(index)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section style={hero}>
          <div style={eyebrow}>Route Preview</div>
          <h2 style={{ fontSize: "clamp(34px,7vw,62px)", lineHeight: 0.95, margin: "0 0 14px" }}>
            {painType.label}
          </h2>
          <p style={{ ...muted, fontSize: 20 }}>{routeSummary}</p>
          <div>
            <span style={chip}>Best Route: {painType.route}</span>
            <span style={chip}>Urgency Score: {urgencyScore}</span>
            <span style={chip}>Feeds: Activity / Alerts / Routing</span>
            <span style={chip}>Photos: {photos.length}</span>
          </div>

          <button
            type="button"
            onClick={submitPainClick}
            disabled={busy}
            style={{ ...btn, width: "100%", marginTop: 18, opacity: busy ? 0.58 : 1 }}
          >
            {busy ? "Submitting Pain Signal..." : "Submit Pain Signal"}
          </button>

          {!canSubmit && (
            <p style={{ ...muted, marginTop: 12 }}>
              Required before submit: logged-in email, pain title, and operating state.
            </p>
          )}
        </section>

        <section style={{ ...hero, borderColor: "rgba(157,243,191,.22)" }}>
          <div style={eyebrow}>Current Safety Mode</div>
          <p style={muted}>
            Pain submissions create controlled platform records. Private contact details remain gated. No autonomous notifications or contact release occur from this page.
          </p>
        </section>
      </div>
    </main>
  );
}
