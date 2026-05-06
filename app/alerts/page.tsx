"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type AlertItem = Record<string, any>;
type Toast = { type: "success" | "error" | "info"; text: string };

const shell: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(157,243,191,.10), transparent 30%), linear-gradient(180deg,#030509,#061120 60%,#030509)",
  color: "white",
  padding: "28px 18px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  maxWidth: 1150,
  margin: "0 auto",
};

const nav: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginBottom: 22,
};

const navLink: React.CSSProperties = {
  color: "white",
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,.18)",
  borderRadius: 999,
  padding: "11px 15px",
  fontWeight: 800,
  background: "rgba(255,255,255,.04)",
};

const hero: React.CSSProperties = {
  border: "1px solid rgba(157,243,191,.25)",
  borderRadius: 34,
  padding: 28,
  background:
    "linear-gradient(145deg, rgba(157,243,191,.075), rgba(255,255,255,.025))",
  marginBottom: 24,
  boxShadow: "0 24px 80px rgba(0,0,0,.28)",
};

const statGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
  gap: 14,
  marginBottom: 22,
};

const statCard: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.14)",
  borderRadius: 24,
  padding: 18,
  background: "rgba(255,255,255,.04)",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.16)",
  borderRadius: 28,
  padding: 24,
  background: "rgba(255,255,255,.035)",
  marginBottom: 18,
};

const btn: React.CSSProperties = {
  display: "inline-block",
  background: "#9df3bf",
  color: "#071326",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 900,
  textDecoration: "none",
  margin: "8px 8px 0 0",
  border: 0,
  cursor: "pointer",
};

const ghost: React.CSSProperties = {
  ...btn,
  background: "rgba(255,255,255,.05)",
  color: "white",
  border: "1px solid rgba(255,255,255,.18)",
};

const danger: React.CSSProperties = {
  ...ghost,
  color: "#ffd0d0",
  border: "1px solid rgba(255,120,120,.35)",
};

const muted: React.CSSProperties = {
  color: "rgba(255,255,255,.70)",
  lineHeight: 1.5,
};

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
    ""
  )
    .trim()
    .toLowerCase();
}

function clean(value: any, fallback = "") {
  const text = String(value || "").trim();
  return text || fallback;
}

function alertTitle(item: AlertItem) {
  return clean(
    item.title ||
      item.alert_title ||
      item.subject ||
      item.match_title ||
      item.deal_title ||
      item.type,
    "VaultForge Alert"
  );
}

function alertBody(item: AlertItem) {
  return clean(
    item.body ||
      item.message ||
      item.description ||
      item.summary ||
      item.reason ||
      item.match_reason,
    "New activity is available in your VaultForge workspace."
  );
}

function alertType(item: AlertItem) {
  return clean(item.alert_type || item.type || item.category || item.source, "Alert");
}

function isRead(item: AlertItem) {
  return Boolean(item.read || item.is_read || item.read_at || item.dismissed || item.is_dismissed);
}

function createdLabel(item: AlertItem) {
  const raw = item.created_at || item.inserted_at || item.updated_at;
  if (!raw) return "";
  try {
    return new Date(raw).toLocaleString();
  } catch {
    return String(raw);
  }
}

function dealId(item: AlertItem) {
  return clean(item.deal_id || item.project_id || item.property_id || item.related_deal_id);
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
        maxWidth: 640,
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

export default function AlertsPage() {
  const [items, setItems] = useState<AlertItem[]>([]);
  const [status, setStatus] = useState("Loading alerts...");
  const [workingId, setWorkingId] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);

  function showToast(next: Toast) {
    setToast(next);
    window.setTimeout(() => setToast(null), 1800);
  }

  async function load() {
    setStatus("Loading alerts...");

    try {
      const email = getEmail();

      const res = await fetch(`/api/alerts/list?email=${encodeURIComponent(email)}`, {
        cache: "no-store",
        headers: { "x-vf-email": email },
      });

      const data = await res.json();

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Could not load alerts.");
      }

      const list = Array.isArray(data?.alerts) ? data.alerts : [];
      setItems(list);
      setStatus(list.length ? "" : "No alerts yet.");
    } catch (error: any) {
      setItems([]);
      setStatus(error?.message || "Could not load alerts.");
      showToast({ type: "error", text: error?.message || "Could not load alerts." });
    }
  }

  async function runAction(id: string, endpoint: string, payload: Record<string, any>, done: string) {
    setWorkingId(id);

    try {
      const email = getEmail();

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": email,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Action failed.");
      }

      showToast({ type: "success", text: done });
      await load();
    } catch (error: any) {
      showToast({ type: "error", text: error?.message || "Action failed." });
    } finally {
      setWorkingId("");
    }
  }

  async function markRead(item: AlertItem) {
    await runAction(
      String(item.id || ""),
      "/api/alerts/read",
      { id: item.id, source_table: item.source_table },
      "Marked read ✓"
    );
  }

  async function dismiss(item: AlertItem) {
    const yes = window.confirm("Dismiss this alert?");
    if (!yes) return;

    await runAction(
      String(item.id || ""),
      "/api/alerts/dismiss",
      { id: item.id, source_table: item.source_table },
      "Dismissed ✓"
    );
  }

  useEffect(() => {
    load();
  }, []);

  const unread = items.filter((item) => !isRead(item)).length;
  const read = items.length - unread;

  return (
    <main style={shell}>
      <ToastBox toast={toast} />

      <div style={wrap}>
        <nav style={nav}>
          <Link href="/dashboard" style={navLink}>Dashboard</Link>
          <Link href="/projects" style={navLink}>Projects</Link>
          <Link href="/buy-bucket" style={navLink}>Buy Bucket</Link>
          <Link href="/messages" style={navLink}>Messages</Link>
          <Link href="/network" style={navLink}>Network</Link>
          <Link href="/profile" style={navLink}>Profile</Link>
          <Link href="/logout" style={navLink}>Logout</Link>
        </nav>

        <section style={hero}>
          <div
            style={{
              color: "#9df3bf",
              letterSpacing: 5,
              fontWeight: 900,
              marginBottom: 12,
            }}
          >
            VAULTFORGE ALERTS
          </div>

          <h1
            style={{
              fontSize: "clamp(56px,13vw,96px)",
              lineHeight: 0.9,
              margin: "0 0 18px",
            }}
          >
            Routing Signal Feed
          </h1>

          <p style={{ ...muted, fontSize: 23, maxWidth: 880 }}>
            Match alerts, network signals, buy-side opportunities, routing notices,
            and member activity inside your VaultForge command center.
          </p>

          <button type="button" onClick={load} style={btn}>Refresh Alerts</button>
          <Link href="/dashboard" style={ghost}>Dashboard</Link>
          <Link href="/buy-bucket" style={ghost}>Buy Bucket</Link>
        </section>

        <section style={statGrid}>
          <div style={statCard}>
            <div style={{ color: "#9df3bf", fontWeight: 900 }}>Total Alerts</div>
            <div style={{ fontSize: 44, fontWeight: 900 }}>{items.length}</div>
          </div>

          <div style={statCard}>
            <div style={{ color: "#9df3bf", fontWeight: 900 }}>Unread</div>
            <div style={{ fontSize: 44, fontWeight: 900 }}>{unread}</div>
          </div>

          <div style={statCard}>
            <div style={{ color: "#9df3bf", fontWeight: 900 }}>Read/Dismissed</div>
            <div style={{ fontSize: 44, fontWeight: 900 }}>{read}</div>
          </div>
        </section>

        {status && (
          <section style={{ ...card, color: "#b9ffc9", fontSize: 22 }}>
            {status}
          </section>
        )}

        {!status &&
          items.map((item) => {
            const id = String(item.id || "");
            const busy = workingId === id;
            const relatedDealId = dealId(item);

            return (
              <section
                key={`${item.source_table || "alert"}-${id}`}
                style={{
                  ...card,
                  border: isRead(item)
                    ? "1px solid rgba(255,255,255,.13)"
                    : "1px solid rgba(157,243,191,.36)",
                  background: isRead(item)
                    ? "rgba(255,255,255,.03)"
                    : "rgba(157,243,191,.055)",
                }}
              >
                <div
                  style={{
                    color: "#9df3bf",
                    border: "1px solid rgba(157,243,191,.35)",
                    display: "inline-block",
                    borderRadius: 999,
                    padding: "8px 14px",
                    marginBottom: 14,
                    fontWeight: 900,
                  }}
                >
                  {alertType(item)} · {item.source_table || "alerts"}
                </div>

                <h2 style={{ fontSize: 36, margin: "8px 0" }}>
                  {alertTitle(item)}
                </h2>

                <p style={{ ...muted, fontSize: 20 }}>
                  {alertBody(item)}
                </p>

                {createdLabel(item) && (
                  <p style={{ color: "rgba(255,255,255,.45)" }}>
                    {createdLabel(item)}
                  </p>
                )}

                {relatedDealId && (
                  <Link href={`/deal/${relatedDealId}`} style={btn}>
                    Open Deal Room
                  </Link>
                )}

                {!isRead(item) && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => markRead(item)}
                    style={ghost}
                  >
                    {busy ? "Working..." : "Mark Read"}
                  </button>
                )}

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => dismiss(item)}
                  style={danger}
                >
                  {busy ? "Working..." : "Dismiss"}
                </button>
              </section>
            );
          })}
      </div>
    </main>
  );
}
