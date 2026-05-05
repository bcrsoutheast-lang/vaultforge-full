"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Deal = Record<string, any>;
type Toast = { type: "success" | "error" | "info"; text: string };

const shell: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 30%), linear-gradient(180deg,#06100a,#102015 55%,#06100a)",
  color: "white",
  padding: "28px 18px 90px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1180, margin: "0 auto" };

const hero: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.28)",
  background: "rgba(255,255,255,.045)",
  borderRadius: 34,
  padding: 24,
  marginBottom: 22,
};

const paneGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(290px,1fr))",
  gap: 18,
};

const pane: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.24)",
  background:
    "linear-gradient(145deg, rgba(255,255,255,.075), rgba(255,255,255,.025))",
  borderRadius: 30,
  overflow: "hidden",
  boxShadow: "0 25px 75px rgba(0,0,0,.28)",
};

const bodyStyle: React.CSSProperties = { padding: 20 };

const btn: React.CSSProperties = {
  display: "inline-block",
  background: "#f5d978",
  color: "#06100a",
  textDecoration: "none",
  borderRadius: 999,
  padding: "12px 15px",
  fontWeight: 900,
  border: "none",
  margin: "6px 6px 0 0",
  cursor: "pointer",
};

const ghost: React.CSSProperties = {
  display: "inline-block",
  color: "white",
  textDecoration: "none",
  borderRadius: 999,
  padding: "12px 15px",
  fontWeight: 900,
  border: "1px solid rgba(255,255,255,.16)",
  background: "rgba(255,255,255,.04)",
  margin: "6px 6px 0 0",
  cursor: "pointer",
};

const successBtn: React.CSSProperties = {
  ...ghost,
  border: "1px solid rgba(157,243,191,.44)",
  color: "#9df3bf",
  background: "rgba(157,243,191,.08)",
};

const danger: React.CSSProperties = {
  ...ghost,
  border: "1px solid rgba(255,120,120,.32)",
  color: "#ffd0d0",
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: 5,
  fontWeight: 900,
  fontSize: 12,
  marginBottom: 12,
  textTransform: "uppercase",
};

const muted: React.CSSProperties = {
  color: "rgba(255,255,255,.68)",
  lineHeight: 1.5,
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.08)",
  color: "white",
  padding: 12,
  fontWeight: 900,
  marginTop: 10,
};

const metricGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 10,
  margin: "14px 0",
};

const metric: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.10)",
  borderRadius: 18,
  padding: 12,
  background: "rgba(0,0,0,.16)",
};

function readCookie(name: string) {
  if (typeof document === "undefined") return "";
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  if (!match) return "";
  return decodeURIComponent(match.slice(name.length + 1)).trim();
}

function getEmail() {
  if (typeof window === "undefined") return "";
  return (
    window.localStorage.getItem("vf_email") ||
    window.sessionStorage.getItem("vf_email") ||
    readCookie("vf_email") ||
    ""
  )
    .trim()
    .toLowerCase();
}

function hasStoredLogin() {
  if (typeof window === "undefined") return false;
  const flag =
    window.localStorage.getItem("vf_member_login") ||
    window.sessionStorage.getItem("vf_member_login") ||
    readCookie("vf_member_login") ||
    "";
  return Boolean(getEmail()) && flag === "1";
}

async function verifySoftAccessOrRedirect() {
  if (typeof window === "undefined") return false;

  const email = getEmail();

  if (!hasStoredLogin()) {
    window.location.replace("/login");
    return false;
  }

  try {
    const res = await fetch(`/api/member/access?email=${encodeURIComponent(email)}`, {
      cache: "no-store",
      headers: email ? { "x-vf-email": email } : {},
    });
    const data = await res.json().catch(() => null);

    if (data?.owner) {
      const ownerEmail = String(data.email || email || "").trim().toLowerCase();
      if (ownerEmail) {
        window.localStorage.setItem("vf_email", ownerEmail);
        window.sessionStorage.setItem("vf_email", ownerEmail);
      }
      window.localStorage.setItem("vf_member_login", "1");
      window.sessionStorage.setItem("vf_member_login", "1");
      return true;
    }

    return true;
  } catch {
    return true;
  }
}

function money(value: any) {
  const n = Number(value || 0);
  if (!n) return "Not listed";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function display(value: any, fallback = "Not listed") {
  const clean = String(value || "").trim();
  return clean || fallback;
}

function getPhotos(deal: Deal) {
  const arr = Array.isArray(deal.photo_urls) ? deal.photo_urls.filter(Boolean) : [];
  if (deal.main_photo_url && !arr.includes(deal.main_photo_url)) {
    arr.unshift(deal.main_photo_url);
  }
  return arr;
}

function detailLine(deal: Deal) {
  return [
    deal.bedrooms ? `${deal.bedrooms} bed` : "",
    deal.bathrooms ? `${deal.bathrooms} bath` : "",
    deal.building_sqft ? `${deal.building_sqft} sqft` : "",
    deal.land_acres ? `${deal.land_acres} acres` : "",
    deal.commercial_type || "",
    deal.condition || "",
  ]
    .filter(Boolean)
    .join(" · ");
}

function ToastBox({ toast }: { toast: Toast | null }) {
  if (!toast) return null;

  const border =
    toast.type === "success"
      ? "rgba(157,243,191,.55)"
      : toast.type === "error"
      ? "rgba(255,120,120,.45)"
      : "rgba(232,196,107,.45)";

  const color =
    toast.type === "success"
      ? "#9df3bf"
      : toast.type === "error"
      ? "#ffd0d0"
      : "#e8c46b";

  return (
    <div
      style={{
        position: "fixed",
        top: 18,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
        width: "calc(100% - 32px)",
        maxWidth: 620,
        border: `1px solid ${border}`,
        background: "rgba(3,5,9,.94)",
        boxShadow: "0 24px 80px rgba(0,0,0,.45)",
        borderRadius: 24,
        padding: "16px 18px",
        color,
        fontWeight: 900,
        textAlign: "center",
      }}
    >
      {toast.text}
    </div>
  );
}

export default function ProjectsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [status, setStatus] = useState("Loading projects...");
  const [workingId, setWorkingId] = useState("");
  const [successId, setSuccessId] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);

  function showToast(next: Toast) {
    setToast(next);
    window.setTimeout(() => setToast(null), 1800);
  }

  function markSuccess(id: string) {
    setSuccessId(id);
    window.setTimeout(() => setSuccessId(""), 1200);
  }

  async function load() {
    setStatus("Loading projects...");
    try {
      const res = await fetch("/api/deal/list", {
        cache: "no-store",
        headers: { "x-vf-email": getEmail() },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || data?.details || "Could not load deals.");
      }

      setDeals(data?.deals || []);
      setStatus("");
    } catch (err: any) {
      setStatus(err?.message || "Could not load projects.");
      showToast({ type: "error", text: err?.message || "Could not load projects." });
    }
  }

  async function runAction(id: string, endpoint: string, payload: Record<string, any>, label: string, done: string) {
    setWorkingId(id);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-vf-email": getEmail() },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || data?.error) {
        throw new Error(data?.error || data?.details || `${label} failed.`);
      }

      markSuccess(id);
      showToast({ type: "success", text: done });
      await load();
    } catch (err: any) {
      showToast({ type: "error", text: err?.message || `${label} failed.` });
    } finally {
      setWorkingId("");
    }
  }

  async function archiveDeal(id: string) {
    const yes = window.confirm("Archive this deal?");
    if (!yes) return;
    await runAction(id, "/api/deal/archive", { id }, "Archive", "Archived ✓");
  }

  async function deleteDeal(id: string) {
    const yes = window.confirm("Move this deal to trash?");
    if (!yes) return;
    await runAction(id, "/api/deal/delete", { id }, "Delete", "Moved to Trash ✓");
  }

  async function setFolder(id: string, folder: string) {
    await runAction(id, "/api/deal/folder", { id, folder }, "Folder update", `Moved to ${folder} ✓`);
  }

  async function saveDeal(id: string) {
    await runAction(id, "/api/deal/buy-bucket", { deal_id: id }, "Save", "Saved to Buy Bucket ✓");
  }

  useEffect(() => {
    verifySoftAccessOrRedirect().then((allowed) => { if (allowed) load(); });
  }, []);

  return (
    <main style={shell}>
      <ToastBox toast={toast} />
      <div style={wrap}>
        <section style={hero}>
          <div style={eyebrow}>Projects</div>
          <h1 style={{ fontSize: "clamp(56px,12vw,96px)", lineHeight: 0.9, margin: "0 0 18px" }}>
            Window pane deal room.
          </h1>
          <p style={muted}>
            Organize live opportunities with folders, archive controls, deal room links,
            and clean member actions.
          </p>
          <Link href="/dashboard" style={ghost}>Dashboard</Link>
          <Link href="/submit" style={btn}>Create</Link>
          <Link href="/buy-bucket" style={ghost}>Buy Bucket</Link>
          <button type="button" onClick={load} style={btn}>Refresh</button>
        </section>

        {status && <section style={hero}>{status}</section>}

        {!status && deals.length === 0 && (
          <section style={hero}>No active projects yet. Create a deal to start.</section>
        )}

        <section style={paneGrid}>
          {deals.map((deal) => {
            const image = getPhotos(deal)[0];
            const busy = workingId === deal.id;
            const done = successId === deal.id;

            return (
              <article key={deal.id} style={pane}>
                {image ? (
                  <img
                    src={image}
                    alt={deal.title || "Deal"}
                    style={{ width: "100%", height: 230, objectFit: "cover", display: "block" }}
                  />
                ) : (
                  <div
                    style={{
                      height: 230,
                      display: "grid",
                      placeItems: "center",
                      color: "rgba(255,255,255,.55)",
                      borderBottom: "1px solid rgba(255,255,255,.10)",
                    }}
                  >
                    No photo
                  </div>
                )}

                <div style={bodyStyle}>
                  <div style={eyebrow}>
                    {deal.folder || "Active"} · {deal.property_type || "Deal"} · {deal.strategy || "Strategy Needed"}
                  </div>

                  <h2 style={{ fontSize: 34, margin: "0 0 8px" }}>
                    {deal.title || "Untitled Deal"}
                  </h2>

                  <p style={{ ...muted, fontSize: 19, margin: "0 0 10px" }}>
                    {display(deal.city, "Unknown City")}, {display(deal.state, "Unknown State")}
                  </p>

                  <div style={metricGrid}>
                    <div style={metric}>
                      <div style={eyebrow}>Ask</div>
                      <strong>{money(deal.asking_price || deal.price)}</strong>
                    </div>
                    <div style={metric}>
                      <div style={eyebrow}>ARV</div>
                      <strong>{money(deal.arv)}</strong>
                    </div>
                    <div style={metric}>
                      <div style={eyebrow}>Repairs</div>
                      <strong>{money(deal.repair_estimate)}</strong>
                    </div>
                    <div style={metric}>
                      <div style={eyebrow}>Status</div>
                      <strong>{deal.status || "Active"}</strong>
                    </div>
                  </div>

                  <p style={{ ...muted, margin: "0 0 10px" }}>
                    {detailLine(deal) || "Additional details in Deal Room"}
                  </p>

                  {(deal.seller_situation || deal.description) && (
                    <p style={{ ...muted, margin: "0 0 10px" }}>
                      {String(deal.seller_situation || deal.description).slice(0, 120)}
                    </p>
                  )}

                  <select
                    value={deal.folder || "Active"}
                    onChange={(event) => setFolder(deal.id, event.target.value)}
                    style={selectStyle}
                    disabled={busy}
                  >
                    <option style={{ color: "#111" }}>Active</option>
                    <option style={{ color: "#111" }}>Hot</option>
                    <option style={{ color: "#111" }}>Follow Up</option>
                    <option style={{ color: "#111" }}>Needs Funding</option>
                    <option style={{ color: "#111" }}>Under Review</option>
                    <option style={{ color: "#111" }}>Passed</option>
                  </select>

                  <div style={{ marginTop: 12 }}>
                    <Link href={`/deal/${deal.id}`} style={btn}>Deal Room</Link>
                    <button type="button" disabled={busy} onClick={() => saveDeal(deal.id)} style={done ? successBtn : ghost}>
                      {busy ? "Saving..." : done ? "Saved ✓" : "Save"}
                    </button>
                    <button type="button" disabled={busy} onClick={() => archiveDeal(deal.id)} style={ghost}>
                      {busy ? "Working..." : "Archive"}
                    </button>
                    <button type="button" disabled={busy} onClick={() => deleteDeal(deal.id)} style={danger}>
                      {busy ? "Working..." : "Delete"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
